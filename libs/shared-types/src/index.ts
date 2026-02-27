// VisuCode Shared Types
// Core data models used across the entire platform

// ============================================
// Enums & Basic Types
// ============================================

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type Category =
    | 'array'
    | 'string'
    | 'linked-list'
    | 'tree'
    | 'graph'
    | 'hash-map'
    | 'stack'
    | 'queue'
    | 'heap'
    | 'dynamic-programming'
    | 'math'
    | 'bit-manipulation';

export type PatternSlug =
    | 'two-pointers'
    | 'sliding-window'
    | 'binary-search'
    | 'bfs'
    | 'dfs'
    | 'backtracking'
    | 'dynamic-programming'
    | 'greedy'
    | 'divide-and-conquer'
    | 'topological-sort'
    | 'union-find'
    | 'trie'
    | 'monotonic-stack';

export type Language = 'javascript' | 'python' | 'typescript' | 'go' | 'java' | 'cpp';

export type AccessLevel = 'free' | 'premium';

export type UserRole = 'learner' | 'interviewer' | 'admin' | 'premium';

export type VisualizerType = 'array' | 'linked-list' | 'tree' | 'graph' | 'matrix';

// ============================================
// Problem Types
// ============================================

export interface Example {
    input: string;
    output: string;
    explanation?: string;
}

export interface TestCase {
    id: string;
    input: string; // JSON stringified input
    expected: string; // JSON stringified expected output
    isHidden?: boolean;
}

export interface ExternalLink {
    platform: 'leetcode' | 'hackerrank' | 'neetcode' | 'geeksforgeeks';
    url: string;
    problemId?: string;
}

export interface Solution {
    language: Language;
    code: string;
    timeComplexity: string;
    spaceComplexity: string;
    explanation?: string;
}

export interface Pointer {
    name: string;
    index: number;
    color: string;
    label?: string;
}

export interface Variable {
    name: string;
    value: string; // Stringified for display
    type: string;
    changed?: boolean; // Highlight if just changed
}

export interface ArrayVisualizerState {
    elements: (number | string)[];
    highlightIndices?: number[];
    compareIndices?: [number, number];
    swapIndices?: [number, number];
    windowStart?: number;
    windowEnd?: number;
    sortedRegion?: { start: number; end: number };
}

export interface DryRunStep {
    stepNumber: number;
    line: number; // Which code line is executing
    variables: Variable[];
    arrayState?: ArrayVisualizerState;
    explanation: string; // Short — "Moving left pointer from 0 to 1"
    pointers?: Pointer[];
}

export interface RealWorldUseCase {
    company: string;
    scenario: string;
    description: string;
}

export interface Problem {
    slug: string;
    title: string;
    difficulty: Difficulty;
    category: Category;
    patterns: PatternSlug[];
    companies: string[];
    description: string; // Markdown
    examples: Example[];
    constraints: string[];
    hints: string[];
    starterCode: Partial<Record<Language, string>>;
    solutions: Solution[];
    testCases: TestCase[];
    dryRunSteps: DryRunStep[];
    externalLinks: ExternalLink[];
    realWorldUseCases: RealWorldUseCase[];
    accessLevel: AccessLevel;
}

// ============================================
// Pattern Types
// ============================================

export interface Pattern {
    slug: PatternSlug;
    name: string;
    description: string; // Markdown
    pseudocode: string;
    timeComplexity: string;
    spaceComplexity: string;
    whenToUse: string[];
    realWorldUseCases: RealWorldUseCase[];
    problems: string[]; // Problem slugs
    visualizerType: VisualizerType;
    color: string; // Theme color for this pattern
}

// ============================================
// Lesson Types (Learning Mode)
// ============================================

export type LessonType = 'concept' | 'visual' | 'exercise' | 'practice';

export interface VisualizerState {
    type: VisualizerType;
    array?: ArrayVisualizerState;
    pointers?: Pointer[];
    highlightElements?: string[];
}

export interface AnimationStep {
    visual: VisualizerState;
    caption: string; // Short text (1-2 lines max)
    durationMs: number;
    highlight?: string;
}

export type MiniExerciseType = 'click-element' | 'choose-option' | 'drag-element' | 'type-answer';

export interface MiniExercise {
    type: MiniExerciseType;
    question: string;
    correctAnswer: string;
    options?: string[];
    hint?: string;
    visualState?: VisualizerState;
}

export interface Lesson {
    slug: string;
    title: string;
    track: string; // 'arrays', 'strings', etc.
    order: number;
    type: LessonType;
    animationSteps: AnimationStep[];
    miniExercise?: MiniExercise;
    linkedProblem?: string; // Problem slug — bridges to practice
    accessLevel: AccessLevel;
}

export interface LearningTrack {
    slug: string;
    name: string;
    description: string;
    icon: string; // emoji or icon name
    color: string;
    lessons: string[]; // Lesson slugs in order
    linkedPatterns: PatternSlug[];
}

// ============================================
// User Progress Types
// ============================================

export interface UserProgress {
    userId: string; // Anonymous UUID in Phase 1
    completedProblems: string[];
    completedLessons: string[];
    currentTrack: string;
    currentLesson: number;
    role: UserRole;
    preferences: UserPreferences;
}

export interface UserPreferences {
    theme: 'dark' | 'light';
    editorFontSize: number;
    visualizerSpeed: number; // 0.5x to 3x
    language: Language;
}

// ============================================
// Logger Types
// ============================================

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    event: string;
    context: {
        userId: string;
        sessionId: string;
        route: string;
        [key: string]: unknown;
    };
    error?: {
        message: string;
        stack?: string;
        code?: string;
    };
}
