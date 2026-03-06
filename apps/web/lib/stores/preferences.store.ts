'use client';

// ============================================
// Preferences Store — User settings
// ============================================
// Persisted to localStorage (survives page refresh)
// Size: ~0.4KB

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Language } from '@visucode/shared-types';

interface PreferencesState {
  // Settings
  theme: 'dark' | 'light';
  editorFontSize: number;
  visualizerSpeed: number;
  language: Language;
  autoPlay: boolean; // Auto-play lesson animations
  editorMode: 'interview' | 'practice'; // Interview = no autocomplete

  // Actions
  setTheme: (theme: 'dark' | 'light') => void;
  setEditorFontSize: (size: number) => void;
  setVisualizerSpeed: (speed: number) => void;
  setLanguage: (language: Language) => void;
  setAutoPlay: (autoPlay: boolean) => void;
  setEditorMode: (mode: 'interview' | 'practice') => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      // Defaults
      theme: 'dark',
      editorFontSize: 14,
      visualizerSpeed: 1,
      language: 'javascript',
      autoPlay: false,
      editorMode: 'practice',

      // Actions
      setTheme: (theme) => set({ theme }),
      setEditorFontSize: (size) =>
        set({ editorFontSize: Math.max(10, Math.min(24, size)) }),
      setVisualizerSpeed: (speed) =>
        set({ visualizerSpeed: Math.max(0.5, Math.min(3, speed)) }),
      setLanguage: (language) => set({ language }),
      setAutoPlay: (autoPlay) => set({ autoPlay }),
      setEditorMode: (mode) => set({ editorMode: mode }),
    }),
    {
      name: 'visucode-preferences', // localStorage key
    }
  )
);
