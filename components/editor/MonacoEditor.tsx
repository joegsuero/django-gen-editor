import React, { memo } from "react";
import Editor, { Monaco } from "@monaco-editor/react";

interface MonacoEditorProps {
  editorTheme: string;
  yamlContent: string;
  setYamlContent: (value: string) => void;
  handleEditorDidMount: (editor: any, monaco: Monaco) => void;
  fontSize: number;
  wordWrap: boolean;
  minimap: boolean;
}

const MonacoEditor = ({
  editorTheme,
  yamlContent,
  setYamlContent,
  handleEditorDidMount,
  fontSize,
  wordWrap,
  minimap,
}: MonacoEditorProps) => {
  return (
    <Editor
      height="650px"
      language="yaml"
      theme={editorTheme}
      value={yamlContent}
      onChange={(value) => setYamlContent(value || "")}
      onMount={handleEditorDidMount}
      options={{
        fontSize,
        wordWrap: wordWrap ? "on" : "off",
        minimap: { enabled: minimap },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        insertSpaces: true,
        detectIndentation: false,
        folding: true,
        foldingStrategy: "indentation",
        showFoldingControls: "always",
        bracketPairColorization: { enabled: true },
        guides: {
          indentation: true,
          highlightActiveIndentation: true,
        },
        suggest: {
          showKeywords: true,
          showSnippets: true,
          showClasses: true,
          showMethods: true,
          showProperties: true,
          showReferences: true,
        },
        quickSuggestions: {
          other: true,
          comments: false,
          strings: true,
        },
        parameterHints: { enabled: true },
        hover: { enabled: true },
        // lightbulb: { enabled:  },
      }}
    />
  );
};

export default memo(MonacoEditor);
