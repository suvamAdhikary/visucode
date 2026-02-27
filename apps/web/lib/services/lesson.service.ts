// ============================================
// Lesson Service — Data access abstraction
// ============================================

import type { Lesson, LearningTrack } from '@visucode/shared-types';

// Learning tracks — small enough for in-memory
const TRACKS: LearningTrack[] = [
  {
    slug: 'arrays',
    name: 'Arrays',
    description:
      'Start from the very basics. Learn what arrays are, how they work, and master the most common patterns used in coding interviews.',
    icon: '📊',
    color: '#06b6d4',
    lessons: [
      'what-is-an-array',
      'array-operations',
      'two-pointers-concept',
      'sliding-window-concept',
      'binary-search-concept',
    ],
    linkedPatterns: ['two-pointers', 'sliding-window', 'binary-search'],
  },
  // Future tracks added here
];

// Phase 1 lesson data — kept in-memory for now
// Phase 2: move to MongoDB or MDX files
const LESSONS: Lesson[] = [
  {
    slug: 'what-is-an-array',
    title: 'What is an Array?',
    track: 'arrays',
    order: 1,
    type: 'concept',
    animationSteps: [
      {
        visual: {
          type: 'array',
          array: { elements: [], highlightIndices: [] },
          pointers: [],
        },
        caption: 'An array is a list of items stored next to each other in memory.',
        durationMs: 3000,
      },
      {
        visual: {
          type: 'array',
          array: { elements: [42], highlightIndices: [0] },
          pointers: [],
        },
        caption: 'We add our first element: 42. It goes into index 0.',
        durationMs: 2500,
        highlight: 'index-0',
      },
      {
        visual: {
          type: 'array',
          array: { elements: [42, 17], highlightIndices: [1] },
          pointers: [],
        },
        caption: 'Add 17 — it goes into index 1. Arrays count from 0.',
        durationMs: 2500,
        highlight: 'index-1',
      },
      {
        visual: {
          type: 'array',
          array: { elements: [42, 17, 3], highlightIndices: [2] },
          pointers: [],
        },
        caption: 'Add 3 at index 2. Each element has its own numbered slot.',
        durationMs: 2500,
      },
      {
        visual: {
          type: 'array',
          array: { elements: [42, 17, 3, 89], highlightIndices: [3] },
          pointers: [],
        },
        caption: 'Add 89. Now we have 4 elements at indices 0, 1, 2, 3.',
        durationMs: 2500,
      },
      {
        visual: {
          type: 'array',
          array: { elements: [42, 17, 3, 89], highlightIndices: [2] },
          pointers: [],
        },
        caption: 'To access any element instantly, use its index. arr[2] = 3.',
        durationMs: 3000,
        highlight: 'index-2',
      },
      {
        visual: {
          type: 'array',
          array: { elements: [42, 17, 3, 89], highlightIndices: [0, 1, 2, 3] },
          pointers: [],
        },
        caption: 'This instant access (O(1)) is what makes arrays powerful.',
        durationMs: 3000,
      },
    ],
    miniExercise: {
      type: 'click-element',
      question: 'Click the element at index 2',
      correctAnswer: '3',
      hint: 'Remember: indices start from 0!',
      visualState: {
        type: 'array',
        array: { elements: [42, 17, 3, 89] },
      },
    },
    accessLevel: 'free',
  },
  {
    slug: 'two-pointers-concept',
    title: 'Two Pointers Pattern',
    track: 'arrays',
    order: 3,
    type: 'visual',
    animationSteps: [
      {
        visual: {
          type: 'array',
          array: { elements: [1, 3, 5, 7, 9, 11] },
          pointers: [],
        },
        caption: 'Given a sorted array, we want to find two numbers that add up to 12.',
        durationMs: 3000,
      },
      {
        visual: {
          type: 'array',
          array: { elements: [1, 3, 5, 7, 9, 11], highlightIndices: [0, 5] },
          pointers: [
            { name: 'L', index: 0, color: '#06b6d4' },
            { name: 'R', index: 5, color: '#a855f7' },
          ],
        },
        caption: 'Place two pointers: L at the start, R at the end.',
        durationMs: 2500,
      },
      {
        visual: {
          type: 'array',
          array: { elements: [1, 3, 5, 7, 9, 11], highlightIndices: [0, 5] },
          pointers: [
            { name: 'L', index: 0, color: '#06b6d4' },
            { name: 'R', index: 5, color: '#a855f7' },
          ],
        },
        caption: 'L + R = 1 + 11 = 12 ✓ Target found! But let\'s see what happens if it wasn\'t...',
        durationMs: 3000,
      },
      {
        visual: {
          type: 'array',
          array: { elements: [1, 3, 5, 7, 9, 11], highlightIndices: [0, 5] },
          pointers: [
            { name: 'L', index: 0, color: '#06b6d4' },
            { name: 'R', index: 5, color: '#a855f7' },
          ],
        },
        caption: 'If sum < target → move L right (to increase sum). If sum > target → move R left (to decrease sum).',
        durationMs: 4000,
      },
      {
        visual: {
          type: 'array',
          array: { elements: [1, 3, 5, 7, 9, 11], highlightIndices: [0, 5] },
          pointers: [
            { name: 'L', index: 0, color: '#06b6d4' },
            { name: 'R', index: 5, color: '#a855f7' },
          ],
        },
        caption: 'This works because the array is sorted — moving pointers guarantees we explore all pairs in O(n) time.',
        durationMs: 3500,
      },
    ],
    miniExercise: {
      type: 'choose-option',
      question: 'If L=1 and R=9, and target=8, should we move L right or R left?',
      correctAnswer: 'Move R left',
      options: ['Move L right', 'Move R left'],
      hint: '1 + 9 = 10 > 8. We need a smaller sum.',
    },
    linkedProblem: 'two-sum-sorted',
    accessLevel: 'free',
  },
];

/**
 * Get a single lesson by slug
 */
export async function getLesson(slug: string): Promise<Lesson | null> {
  return LESSONS.find((l) => l.slug === slug) ?? null;
}

/**
 * Get a learning track by slug
 */
export function getLearningTrack(slug: string): LearningTrack | null {
  return TRACKS.find((t) => t.slug === slug) ?? null;
}

/**
 * List all learning tracks
 */
export function listTracks(): LearningTrack[] {
  return TRACKS;
}

/**
 * Get all lessons for a track, in order
 */
export function getLessonsForTrack(trackSlug: string): Lesson[] {
  return LESSONS
    .filter((l) => l.track === trackSlug)
    .sort((a, b) => a.order - b.order);
}
