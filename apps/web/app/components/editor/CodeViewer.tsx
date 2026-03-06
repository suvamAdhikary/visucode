'use client';

// ============================================
// CodeViewer — Read-only Monaco editor
// ============================================
// Used in DryRunViewer to show syntax-highlighted
// solution with active line tracking

import { useRef, useCallback } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

interface CodeViewerProps {
  code: string;
  language?: string;
  activeLine?: number;
  accentColor?: string;
  height?: string;
}

export function CodeViewer({
  code,
  language = 'javascript',
  activeLine,
  accentColor = '#6366f1',
  height = '300px',
}: CodeViewerProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const decorationsRef = useRef<editor.IEditorDecorationsCollection | null>(null);

  const handleEditorMount: OnMount = useCallback(
    (editor) => {
      editorRef.current = editor;

      // Set active line if provided
      if (activeLine) {
        highlightLine(editor, activeLine, accentColor);
      }
    },
    [activeLine, accentColor]
  );

  // Update line highlight when activeLine changes
  if (editorRef.current && activeLine) {
    highlightLine(editorRef.current, activeLine, accentColor);
  }

  return (
    <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
      <Editor
        height={height}
        language={language}
        value={code}
        theme="vs-dark"
        onMount={handleEditorMount}
        options={{
          readOnly: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 13,
          lineHeight: 22,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
          renderLineHighlight: 'none',
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          overviewRulerBorder: false,
          scrollbar: {
            vertical: 'hidden',
            horizontal: 'auto',
            verticalScrollbarSize: 0,
          },
          lineNumbers: 'on',
          glyphMargin: false,
          folding: false,
          lineDecorationsWidth: 0,
          lineNumbersMinChars: 3,
          padding: { top: 12, bottom: 12 },
          domReadOnly: true,
          contextmenu: false,
        }}
        loading={
          <div style={{ 
            height, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            background: '#1e1e1e',
            color: '#888',
            fontSize: '0.875rem',
          }}>
            Loading editor...
          </div>
        }
      />
    </div>
  );

  function highlightLine(
    editorInstance: editor.IStandaloneCodeEditor,
    line: number,
    color: string
  ) {
    // Clear previous decorations
    if (decorationsRef.current) {
      decorationsRef.current.clear();
    }

    // Add new line highlight
    decorationsRef.current = editorInstance.createDecorationsCollection([
      {
        range: {
          startLineNumber: line,
          startColumn: 1,
          endLineNumber: line,
          endColumn: 1,
        },
        options: {
          isWholeLine: true,
          className: 'active-line-highlight',
          linesDecorationsClassName: 'active-line-gutter',
          overviewRuler: undefined,
          inlineClassName: undefined,
        },
      },
    ]);

    // Reveal the line
    editorInstance.revealLineInCenter(line);
  }
}
