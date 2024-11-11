import { Editor, Monaco } from "@monaco-editor/react";
import React from "react";
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

async function fetchAICompletion(prompt: string): Promise<string[]> {
  try {
    toast("Fetching AI suggestions...", { duration: 2000 });

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer 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`,  // 替换成你的 OpenAI API Key
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",  // 使用 GPT-3.5 模型
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: prompt }
        ],
        max_tokens: 100,
        temperature: 0.5,
        top_p: 1,
      }),
    });

    const data = await response.json();

    if (data.choices && data.choices.length > 0) {
      const suggestions = data.choices.map((choice: any) => choice.message.content.trim());
      toast.success("Fetched suggestions successfully", { duration: 2000 });
      return suggestions;
    } else {
      toast.error("No suggestions returned from the AI model.", { duration: 3000 });
      return [];
    }
  } catch (error) {
    toast.error("Error fetching completion from AI model.", { duration: 3000 });
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

  const handleEditorDidMount = React.useCallback(
    (editor: monaco.editor.IStandaloneCodeEditor, monaco: Monaco): void => {
      // 自定义主题
      monaco.editor.defineTheme("my-theme", {
        base: "vs-dark",
        inherit: true,
        rules: [],
        colors: {
          "editor.background": "#171717",
        },
      });

      monaco.editor.setTheme("my-theme");

      // 注册多个语言的内联补全提供者
      const languages = ["typescript", "python", "javascript", "java", "csharp"];

      languages.forEach(language => {
        // 注册内联补全提供者
        monaco.languages.registerInlineCompletionsProvider(language, {
          provideInlineCompletions: async (model, position, context, token) => {
            const currentLine = model.getLineContent(position.lineNumber);
            const completionItems: monaco.languages.InlineCompletion[] = [];

            // 捕获 # 后面的文本内容
            const regex = /#\s*(\S.*)/;  // 匹配 # 后面的文本，\S 匹配非空白字符，.* 匹配剩余的文本
            const match = currentLine.match(regex);

            if (match && match[1]) {
              // 提取 # 后面的文字内容
              const functionName = match[1].trim();  // 例如 "快速排序"

              //toast(`Function name: ${functionName}`, { duration: 2000 });

              // 动态调用大模型获取函数实现
              const suggestions = await fetchAICompletion(`Create function for ${functionName}`);

              if (suggestions.length === 0) {
                //toast.error('No suggestions returned from the AI model.', { duration: 3000 });
              }

              // 如果有补全项，构建 Monaco 编辑器所需的补全项格式
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
            } else {
              // 如果没有 #，则继续正常的补全行为
              const suggestions = await fetchAICompletion(currentLine);

              if (suggestions.length === 0) {
                //toast.error('No suggestions returned from the AI model.', { duration: 3000 });
              }

              // 如果有补全项，构建 Monaco 编辑器所需的补全项格式
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
            }

            // 返回补全项
            return { items: completionItems };
          },
          freeInlineCompletions(arg) {
            // 处理没有补全项的情况
            //toast('Free completion triggered', { duration: 2000 });
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

  React.useEffect(() => {
    const handleSave = async (event: KeyboardEvent) => {
      if (selectedPath && (event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();  // 禁止默认的浏览器保存行为

        //toast(`Saving file at path: ${selectedPath}`, { duration: 2000 });

        const content = saveNewFileContent(selectedPath);

        if (content) {
          try {
            const token = localStorage.getItem("token")?.toString();
            if (token) await OpenHands.saveFile(token, selectedPath, content);
            //toast.success(`File saved successfully at ${selectedPath}`, { duration: 2000 });
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
      defaultValue=""
      value={
        selectedPath
          ? modifiedFiles[selectedPath] || files[selectedPath]
          : undefined
      }
      onMount={handleEditorDidMount}
      onChange={handleEditorChange}
      options={{ readOnly: isReadOnly }}
    />
  );
}

export default React.memo(CodeEditorCompoonent);
