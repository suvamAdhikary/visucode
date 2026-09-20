# Epics and Stories

This document tracks the backlog, epics, and user stories for VisuCode.

## Epic 1: Phase 2 - Advanced Content & Test Runner
**Status**: IN PROGRESS

### Sprint 1: Code Test Runner & Core Problem Set (DONE)
- [x] **Story**: Implement Monaco editor for user code submission.
- [x] **Story**: Implement client-side test execution sandbox (`test-executor.ts`).
- [x] **Story**: Update UI with a tabbed interface (Dry Run vs Your Code) and Test Runner results panel.
- [x] **Story**: Add test cases to existing 6 problems.
- [x] **Story**: Add 9 new problems (total 15), complete with dry runs and test cases.

### Sprint 2: Visualizer Expansion & Final Polish (DONE)
- [x] **Story**: Implement Linked List visualizer component (nodes, pointers, traversal animations).
- [x] **Story**: Implement Tree visualizer component.
- [x] **Story**: Add 5 more problems requiring Linked List / Tree visualizers (total 20).
- [x] **Story**: Integrate visualizer components seamlessly into the Dry Run viewer.

### Sprint 3: Linear & Hashing Patterns (TODO)
*Focus: Arrays & Hashing, Stack / Queue, Greedy / Intervals*
- [ ] **Story**: Implement Hash Map visualizer component.
- [ ] **Story**: Implement Stack & Queue visualizer component.
- [ ] **Story**: Implement 1D Array / Interval number-line visualizer.
- [ ] **Story**: Add 10 problems covering Hashing, Stacks, Queues, Greedy, and Intervals.

### Sprint 4: Advanced Non-Linear Patterns (TODO)
*Focus: Graphs, BFS, Heaps / Priority Queue, Tries*
- [ ] **Story**: Implement Graph visualizer (nodes + edges mapping).
- [ ] **Story**: Upgrade Tree visualizer to support Tries and Heap (Array-to-Tree) representations.
- [ ] **Story**: Add 10 problems covering Graphs, BFS, Heaps, and Tries.

### Sprint 5: Complex Paradigms (TODO)
*Focus: Dynamic Programming (1D & 2D), Backtracking*
- [ ] **Story**: Implement 1D and 2D Grid visualizer for DP tables.
- [ ] **Story**: Implement Recursion Call Stack visualizer for Backtracking.
- [ ] **Story**: Add 10 problems covering 1D DP, 2D DP, and Backtracking.

## Epic 2: Phase 3 - User System & Progress Tracking
**Status**: TODO

- [ ] **Story**: Implement anonymous progress tracking using `localStorage` (mark problems as completed).
- [ ] **Story**: Integrate NextAuth.js for GitHub/Google authentication.
- [ ] **Story**: Add user profile page with completion stats.
- [ ] **Story**: Implement premium content gating for advanced patterns.

## Epic 3: Phase 4 - Backend Migration
**Status**: TODO

- [ ] **Story**: Setup PostgreSQL database and Prisma ORM.
- [ ] **Story**: Create a GraphQL API to serve problem and lesson data.
- [ ] **Story**: Swap `problem.service.ts` to fetch from GraphQL instead of local JSON.
- [ ] **Story**: Implement Redis caching for high-traffic read operations.
