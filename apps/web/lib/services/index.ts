// ============================================
// Data Service — Server-Side Barrel Export
// ============================================
// Server-side services (Problem, Pattern, Lesson) relying on Node.js fs.
// Used by Server Components and SSR routes.
//
// NOTE: Client components must import client services (e.g. progress.service.ts)
// directly to prevent bundling Node.js modules (fs/promises) in client bundles.

export { getProblem, listProblems, getCompanies, getProblemsByPattern } from './problem.service';
export { getPattern, listPatterns } from './pattern.service';
export { getLesson, getLearningTrack, listTracks, getLessonsForTrack } from './lesson.service';

