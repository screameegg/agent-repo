import React from 'react';
import { Code2 } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { SkillFile } from '../types';

interface CodeAreaProps {
  file: SkillFile;
  onChange: (content: string) => void;
}

export default function CodeArea({ file, onChange }: CodeAreaProps) {
  if (!file) {
    return (
      <div className="flex-1 min-w-0 flex flex-col bg-[#1E1E1E] items-center justify-center relative overflow-hidden">
        <div className="w-16 h-16 bg-[#2D2D2D] rounded-2xl flex items-center justify-center border-2 border-[#1A1A1A] mb-4 shadow-[4px_4px_0px_0px_#1A1A1A]">
          <Code2 className="w-8 h-8 text-[#555]" />
        </div>
        <p className="text-[#888] font-bold">请在左侧选择或创建一个文件</p>
      </div>
    );
  }

  const handleEditorChange = (value: string | undefined) => {
    onChange(value || '');
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col bg-[#1E1E1E] relative overflow-hidden">
      <div className="flex items-center px-3 sm:px-6 py-3 bg-[#2D2D2D] border-b-2 border-[#1A1A1A] shrink-0 overflow-x-auto custom-scrollbar">
         <div className="flex gap-2 mr-6">
            <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]"></div>
            <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]"></div>
            <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]"></div>
         </div>
         <div className="flex items-center gap-2 text-[#A0A0A0] text-sm font-bold font-mono px-3 py-1 bg-[#1E1E1E] rounded-t-lg border-t-2 border-l-2 border-r-2 border-[#1A1A1A] translate-y-[2px] min-w-0">
            <Code2 className="w-4 h-4 text-[#FF9800]" />
            <span className="truncate max-w-[14rem] sm:max-w-none">{file.name}</span>
         </div>
      </div>
      
      <div className="flex-1 relative pt-2">
        <Editor
          height="100%"
          language={file.language || 'typescript'}
          theme="vs-dark"
          value={file.content}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            padding: { top: 16 },
            fontFamily: 'JetBrains Mono, monospace',
            cursorSmoothCaretAnimation: "on",
            formatOnPaste: true,
            scrollbar: {
               verticalScrollbarSize: 8,
               horizontalScrollbarSize: 8
            }
          }}
        />
      </div>
    </div>
  );
}
