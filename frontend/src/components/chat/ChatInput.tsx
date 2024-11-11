import React, { useState, useEffect } from 'react';
import { Textarea } from "@nextui-org/react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { I18nKey } from "#/i18n/declaration";
import Clip from "#/assets/clip.svg?react";
import { RootState } from "#/store";
import AgentState from "#/types/AgentState";
import { useSocket } from "#/context/socket";
import { generateAgentStateChangeEvent } from "#/services/agentStateService";
import { cn } from "#/utils/utils";
import ArrowSendIcon from "#/assets/arrow-send.svg?react";
import { convertImageToBase64 } from "#/utils/convert-image-to-base-64";
import ContextMenuChat from './ContextMenuChat';

interface ChatInputProps {
    disabled?: boolean;
    onSendMessage: (message: string, image_urls: string[]) => void;
}

function ChatInput({ disabled = false, onSendMessage }: ChatInputProps) {
    const { send } = useSocket();
    const { t } = useTranslation();
    const { curAgentState } = useSelector((state: RootState) => state.agent);

    const presetMessages = {
        '创建新项目': '请生成项目级代码，我需要此项目的完整文件夹、所有文件及其内容，并有一定的组织结构，请把项目文件夹放在我指定的路径下。\n存储路径：\n[请在此处输入项目文件夹存储路径]\n详细要求：\n[请在此处输入项目的具体要求]',
        '代码语言转换': '请将我的代码文件进行语言转换。\n文件路径：\n[在这里输入你的文件路径]\n需要转换的程序语言：\n[请在此处输入该文件需要转换的程序语言]\n新文件存储路径：\n[请在此处输入转换后的文件存储路径]',
        '代码片段生成': '请生成一个代码片段，完成以下任务：\n[在这里输入具体任务描述]\n代码需要高效，并遵循最佳实践，且包含关键部分的注释。',
        '函数重构优化': '请优化或重构以下代码：\n[在这里粘贴你的代码]\n改进方向是：\n[在这里描述希望改进的方面，如性能、可读性或遵循某些标准]\n请提供优化后的代码并解释所做的改进。',
        '测试用例生成': '请为以下功能生成单元测试代码：\n[在这里输入功能或类的描述]\n测试应包括不同场景，并验证代码的正确性。',
    };

    const [message, setMessage] = React.useState("");
    const [files, setFiles] = React.useState<File[]>([]);
    const [isComposing, setIsComposing] = React.useState(false);
    const [showContextMenu, setShowContextMenu] = useState(false);
    const [lastContextMenuClickTime, setLastContextMenuClickTime] = useState<number | null>(null);

    const handleSendChatMessage = async () => {
        if (curAgentState === AgentState.RUNNING) {
            send(generateAgentStateChangeEvent(AgentState.STOPPED));
            return;
        }

        if (message.trim()) {
            let base64images: string[] = [];
            if (files.length > 0) {
                base64images = await Promise.all(
                    files.map((file) => convertImageToBase64(file)),
                );
            }
            onSendMessage(message, base64images);
            setMessage("");
            setFiles([]);
        }
    };

    const onKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter" && !event.shiftKey && !isComposing) {
            event.preventDefault();
            if (!disabled) {
                handleSendChatMessage();
            }
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFiles((prev) => [...prev, ...Array.from(event.target.files!)]);
        }
    };

    const removeFile = (index: number) => {
        setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
    };

    const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
        const clipboardItems = Array.from(event.clipboardData.items);
        const pastedFiles: File[] = [];
        clipboardItems.forEach((item) => {
            if (item.type.startsWith("image/")) {
                const file = item.getAsFile();
                if (file) {
                    pastedFiles.push(file);
                }
            }
        });
        if (pastedFiles.length > 0) {
            setFiles((prevFiles) => [...prevFiles, ...pastedFiles]);
            event.preventDefault();
        }
    };

    const handleContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
        event.preventDefault();
        const currentTime = Date.now();

        if (lastContextMenuClickTime && currentTime - lastContextMenuClickTime < 300) {
            // Double click detected, hide the context menu
            setShowContextMenu(false);
            setLastContextMenuClickTime(null);
        } else {
            // Single click, show context menu
            setShowContextMenu(true);
        }

        setLastContextMenuClickTime(currentTime);
    };

    const handleOptionSelect = (option: string) => {
        setMessage(presetMessages[option as keyof typeof presetMessages]);
        setShowContextMenu(false); // Close the context menu after selecting an option
    };

    return (
        <div className="w-full relative text-base flex">
            <Textarea
                value={message}
                startContent={
                    <label
                        htmlFor="file-input"
                        className="cursor-pointer"
                        aria-label={t(I18nKey.CHAT_INTERFACE$TOOLTIP_UPLOAD_IMAGE)}
                    >
                        <Clip width={24} height={24} />
                        <input
                            type="file"
                            onChange={handleFileChange}
                            className="hidden"
                            id="file-input"
                            multiple
                        />
                    </label>
                }
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={onKeyPress}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                placeholder={t(I18nKey.CHAT_INTERFACE$INPUT_PLACEHOLDER)}
                onPaste={handlePaste}
                className="pb-3 px-3"
                classNames={{
                    inputWrapper: "bg-neutral-700 border border-neutral-600 rounded-lg",
                    input: "pr-16 text-neutral-400",
                }}
                maxRows={10}
                minRows={1}
                variant="bordered"
                onContextMenu={handleContextMenu} // Use the updated context menu handler
            />
            {showContextMenu && (
                <ContextMenuChat onOptionSelect={handleOptionSelect} />
            )}
            <button
                type="button"
                onClick={handleSendChatMessage}
                disabled={disabled}
                className={cn(
                    "bg-transparent border rounded-lg p-[7px] border-white hover:opacity-80 cursor-pointer select-none absolute right-5 bottom-[19px] transition active:bg-white active:text-black",
                    "w-6 h-6 flex items-center justify-center",
                    "disabled:cursor-not-allowed disabled:border-neutral-400 disabled:text-neutral-400",
                    "hover:bg-neutral-500",
                )}
                aria-label={t(I18nKey.CHAT_INTERFACE$TOOLTIP_SEND_MESSAGE)}
            >
                {curAgentState !== AgentState.RUNNING && <ArrowSendIcon />}
                {curAgentState === AgentState.RUNNING && (
                    <div className="w-[10px] h-[10px] bg-white" />
                )}
            </button>
            {files.length > 0 && (
                <div className="absolute bottom-16 right-5 flex space-x-2 p-4 border-1 border-neutral-500 bg-neutral-800 rounded-lg">
                    {files.map((file, index) => (
                        <div key={index} className="relative">
                            <img
                                src={URL.createObjectURL(file)}
                                alt="upload preview"
                                className="w-24 h-24 object-contain rounded bg-white"
                            />
                            <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="absolute top-0 right-0 bg-black border border-grey-200 text-white rounded-full w-5 h-5 flex pb-1 items-center justify-center"
                            >

                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ChatInput;
