import { Editor, Monaco } from "@monaco-editor/react";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { VscCode } from "react-icons/vsc";
import { I18nKey } from "#/i18n/declaration";
import { useFiles } from "#/context/files";
import OpenHands from "#/api/open-hands";
import { toast } from 'react-hot-toast';
import * as monaco from 'monaco-editor';
import { GoogleGenerativeAI } from "@google/generative-ai";  //2024修改

interface CodeEditorCompoonentProps {
  isReadOnly: boolean;
}

const API_KEY = "AIzaSyCmSx2EJUSmXJNNm8MTvPrRpD1NOsRp8bw";
const genAI = new GoogleGenerativeAI(API_KEY);

// 添加一个用于控制请求频率的定时器状态
let debounceTimeout: NodeJS.Timeout | null = null;

async function fetchAICompletion(prompt: string): Promise<string[]> {
  try {
    const generationConfig = {
      stopSequences: ["red"],
      maxOutputTokens: 500,
      temperature: 0.5,
      topP: 1,
      topK: 16,
    };

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: generationConfig,
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    toast.success("Fetched Gemini successfully", { duration: 2000 });
    return [text.trim()];  // 返回生成的文本内容
  } catch (error) {
    toast.error("Error fetching completion from Gemini AI model.", { duration: 3000 });
    console.error("Error fetching AI completion:", error);
    return [];
  }
}

function CodeEditorCompoonent({ isReadOnly }: CodeEditorCompoonentProps) {
  const { t } = useTranslation();
  const {
    files,
    selectedPath,
    modifiedFiles,
    modifyFileContent,
    saveFileContent: saveNewFileContent,
  } = useFiles();

  const handleEditorDidMount = useCallback(
    (editor: monaco.editor.IStandaloneCodeEditor, monaco: Monaco): void => {
      monaco.editor.defineTheme("my-theme", {
        base: "vs-dark",
        inherit: true,
        rules: [],
        colors: {
          "editor.background": "#171717",
        },
      });

      monaco.editor.setTheme("my-theme");

      const languages = ["typescript", "python", "javascript", "java", "csharp"];

      languages.forEach(language => {
        monaco.languages.registerInlineCompletionsProvider(language, {
          provideInlineCompletions: async (model, position, context, token) => {
            const currentLine = model.getLineContent(position.lineNumber);
            const completionItems: monaco.languages.InlineCompletion[] = [];

            // Match text after '#'
            const regex = /#\s*(\S.*)/;
            const match = currentLine.match(regex);

            if (match && match[1]) {
              const functionName = match[1].trim();

              // 使用定时器来实现延迟机制
              if (debounceTimeout) {
                clearTimeout(debounceTimeout); // 清除上一个定时器
              }

              // 设置新的定时器，2秒后发起AI请求
              debounceTimeout = setTimeout(async () => {
                const suggestions = await fetchAICompletion(`Create function for ${functionName}`);
                if (suggestions.length === 0) {
                  //toast.error('No suggestions returned from the AI model.', { duration: 3000 });
                }

                // Format suggestions for Monaco editor
                suggestions.forEach((suggestion) => {
                  completionItems.push({
                    insertText: suggestion,
                    range: new monaco.Range(
                      position.lineNumber,
                      position.column,
                      position.lineNumber,
                      position.column
                    ),
                  });
                });

                // 返回补全项
                return { items: completionItems };
              }, 1000); // 2秒延迟
            } else {
              // 如果没有匹配到 '#'
              const suggestions = await fetchAICompletion(currentLine);
              if (suggestions.length === 0) {
                //toast.error('No suggestions returned from the AI model.', { duration: 3000 });
              }

              suggestions.forEach((suggestion) => {
                completionItems.push({
                  insertText: suggestion,
                  range: new monaco.Range(
                    position.lineNumber,
                    position.column,
                    position.lineNumber,
                    position.column
                  ),
                });
              });

              return { items: completionItems };
            }
          },
          freeInlineCompletions(arg) {
            toast('Free completion triggered', { duration: 2000 });
          },
        });
      });

      editor.onDidChangeModelContent((e) => {
        console.log('Editor content changed', e);
      });
    },
    []
  );

  const handleEditorChange = (value: string | undefined) => {
    console.log("Editor content changed:", value);
    if (selectedPath && value) modifyFileContent(selectedPath, value);
  };

  useEffect(() => {
    const handleSave = async (event: KeyboardEvent) => {
      if (selectedPath && (event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();  // Prevent default browser save behavior

        const content = saveNewFileContent(selectedPath);

        if (content) {
          try {
            const token = localStorage.getItem("token")?.toString();
            if (token) await OpenHands.saveFile(token, selectedPath, content);
            toast.success(`File saved successfully at ${selectedPath}`, { duration: 2000 });
          } catch (error) {
            toast.error("Error saving file", { duration: 3000 });
          }
        } else {
          toast.error("No file content to save.", { duration: 3000 });
        }
      }
    };

    document.addEventListener("keydown", handleSave);
    return () => {
      document.removeEventListener("keydown", handleSave);
    };
  }, [saveNewFileContent, selectedPath]);

  if (!selectedPath) {
    return (
      <div
        data-testid="code-editor-empty-message"
        className="flex flex-col items-center text-neutral-400"
      >
        <VscCode size={100} />
        {t(I18nKey.CODE_EDITOR$EMPTY_MESSAGE)}
      </div>
    );
  }

  return (
    <Editor
      data-testid="code-editor"
      height="100%"
      path={selectedPath ?? undefined}
      defaultValue=" "
      value={selectedPath ? modifiedFiles[selectedPath] || files[selectedPath] : undefined}
      onMount={handleEditorDidMount}
      onChange={handleEditorChange}
      options={{ readOnly: isReadOnly }}
    />
  );
}

export default React.memo(CodeEditorCompoonent);
