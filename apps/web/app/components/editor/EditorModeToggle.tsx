'use client';

// ============================================
// Editor Mode Toggle — Interview vs Practice
// ============================================
// Interview mode: disables autocomplete, suggestions
// Practice mode: full IntelliSense enabled

import { usePreferencesStore } from '../../../lib/stores/preferences.store';

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  toggle: {
    display: 'flex',
    background: 'rgba(255, 255, 255, 0.06)',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '2px',
    gap: '2px',
  },
  button: {
    padding: '0.3rem 0.75rem',
    borderRadius: '6px',
    border: 'none',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    background: 'transparent',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  activeButton: {
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
  },
  interviewActive: {
    background: 'rgba(251, 191, 36, 0.15)',
    color: '#fbbf24',
  },
  practiceActive: {
    background: 'rgba(52, 211, 153, 0.15)',
    color: '#34d399',
  },
  hint: {
    fontSize: '0.6875rem',
    color: 'rgba(255, 255, 255, 0.35)',
    maxWidth: '200px',
    lineHeight: 1.3,
  },
};

export function EditorModeToggle() {
  const { editorMode, setEditorMode } = usePreferencesStore();

  return (
    <div style={styles.container}>
      <div style={styles.toggle}>
        <button
          style={{
            ...styles.button,
            ...(editorMode === 'interview' ? styles.interviewActive : {}),
          }}
          onClick={() => setEditorMode('interview')}
          title="Interview mode — autocomplete and suggestions disabled. Ask your interviewer before enabling."
        >
          🎯 Interview
        </button>
        <button
          style={{
            ...styles.button,
            ...(editorMode === 'practice' ? styles.practiceActive : {}),
          }}
          onClick={() => setEditorMode('practice')}
          title="Practice mode — full IntelliSense, autocomplete, and suggestions enabled."
        >
          📚 Practice
        </button>
      </div>
      <span style={styles.hint}>
        {editorMode === 'interview'
          ? 'Autocomplete off'
          : 'Full IntelliSense'}
      </span>
    </div>
  );
}
