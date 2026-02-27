// ============================================
// Data Service — Barrel Export
// ============================================
// Single import point for all service functions
// Components import from here, never from individual service files

export { getProblem, listProblems, getCompanies, getProblemsByPattern } from './problem.service';
export { getPattern, listPatterns } from './pattern.service';
export { getLesson, getLearningTrack, listTracks, getLessonsForTrack } from './lesson.service';
