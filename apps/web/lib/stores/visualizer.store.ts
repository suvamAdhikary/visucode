'use client';

// ============================================
// Visualizer Store — Controls animation state
// ============================================
// Used by: StepController, Canvas, DryRun, LessonViewer
// Size: ~0.5KB (Zustand core is 1.2KB)

import { create } from 'zustand';

interface VisualizerState {
  // Playback
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  speed: number; // 0.5x to 3x

  // Actions
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setSpeed: (speed: number) => void;
  reset: (totalSteps: number) => void;
}

export const useVisualizerStore = create<VisualizerState>((set, get) => ({
  // Initial state
  currentStep: 0,
  totalSteps: 0,
  isPlaying: false,
  speed: 1,

  // Actions
  setStep: (step) =>
    set({ currentStep: Math.max(0, Math.min(step, get().totalSteps - 1)) }),

  nextStep: () => {
    const { currentStep, totalSteps } = get();
    if (currentStep < totalSteps - 1) {
      set({ currentStep: currentStep + 1 });
    } else {
      set({ isPlaying: false }); // Auto-pause at end
    }
  },

  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 0) {
      set({ currentStep: currentStep - 1 });
    }
  },

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),

  setSpeed: (speed) => set({ speed: Math.max(0.5, Math.min(3, speed)) }),

  reset: (totalSteps) =>
    set({ currentStep: 0, totalSteps, isPlaying: false }),
}));
