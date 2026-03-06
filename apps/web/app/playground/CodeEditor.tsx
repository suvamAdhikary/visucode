'use client';

// ============================================
// CodeEditor — Editable Monaco editor
// ============================================
// Used in the Playground for writing code
// Respects Interview/Practice mode from preferences

import Editor, { type OnMount } from '@monaco-editor/react';
import { useRef } from 'react';
import type { editor } from 'monaco-editor';
import { usePreferencesStore } from '../../lib/stores/preferences.store';

interface CodeEditorProps {
  code: string;
  language?: string;
  onChange?: (value: string) => void;
}

export function CodeEditor({
  code,
  language = 'javascript',
  onChange,
}: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const { editorMode, editorFontSize } = usePreferencesStore();

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
  };

  const handleChange = (value: string | undefined) => {
    if (onChange && value !== undefined) {
      onChange(value);
    }
  };

  // Monaco options based on editor mode
  const modeOptions =
    editorMode === 'interview'
      ? {
          quickSuggestions: false,
          suggestOnTriggerCharacters: false,
          parameterHints: { enabled: false },
          wordBasedSuggestions: 'off' as const,
          acceptSuggestionOnCommitCharacter: false,
          snippetSuggestions: 'none' as const,
          suggest: { showWords: false, showSnippets: false },
        }
      : {
          quickSuggestions: true,
          suggestOnTriggerCharacters: true,
          parameterHints: { enabled: true },
          wordBasedSuggestions: 'currentDocument' as const,
          snippetSuggestions: 'inline' as const,
        };

  return (
    <Editor
      height="100%"
      language={language}
      value={code}
      theme="vs-dark"
      onMount={handleMount}
      onChange={handleChange}
      options={{
        ...modeOptions,
        minimap: { enabled: false },
        fontSize: editorFontSize,
        lineHeight: 22,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
        scrollBeyondLastLine: false,
        tabSize: 2,
        wordWrap: 'on',
        lineNumbers: 'on',
        glyphMargin: false,
        folding: true,
        bracketPairColorization: { enabled: true },
        autoClosingBrackets: 'always',
        autoClosingQuotes: 'always',
        padding: { top: 12, bottom: 12 },
        scrollbar: {
          verticalScrollbarSize: 8,
          horizontalScrollbarSize: 8,
        },
      }}
      loading={
        <div
          style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#1e1e1e',
            color: '#888',
            fontSize: '0.875rem',
          }}
        >
          Loading editor...
        </div>
      }
    />
  );
}
