# Epics and Stories

This document tracks the backlog, epics, and user stories for VisuCode.

## Epic 1: Phase 2 - Advanced Content & Test Runner
**Status**: DONE

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

### Sprint 3: Linear & Hashing Patterns (DONE)
*Focus: Arrays & Hashing, Stack / Queue, Greedy / Intervals*
- [x] **Story**: Implement Hash Map visualizer component.
- [x] **Story**: Implement Stack & Queue visualizer component.
- [x] **Story**: Implement 1D Array / Interval number-line visualizer.
- [x] **Story**: Add 3 core problems covering Hashing, Stacks, and Intervals.

### Sprint 4: Advanced Non-Linear Patterns (DONE)
*Focus: Graphs, BFS, Heaps / Priority Queue, Tries*
- [x] **Story**: Implement Graph visualizer (nodes + edges mapping).
- [x] **Story**: Implement Trie visualizer (prefix tree nodes + char transitions).
- [x] **Story**: Implement Heap visualizer (1D array indexing + complete binary tree hierarchy).
- [x] **Story**: Add 3 core problems covering Graphs, Heaps, and Tries (Clone Graph, Kth Largest Element, Implement Trie).

### Sprint 5: Complex Paradigms (DONE)
*Focus: Dynamic Programming (1D & 2D), Backtracking*
- [x] **Story**: Implement 1D and 2D Grid visualizer for DP tables (`DpTableVisualizer`).
- [x] **Story**: Implement State Space Tree & Recursion Call Stack visualizer for Backtracking (`BacktrackingVisualizer`).
- [x] **Story**: Add core problems covering 1D DP, 2D DP, and Backtracking (Coin Change, Longest Common Subsequence, Subsets).

## Epic 2: Live Dry Run
**Status**: TODO

Quality tracker: [`docs/phase-live-dry-run-quality-flags.md`](./phase-live-dry-run-quality-flags.md). ADR: [`docs/ADR/002-live-dry-run-tracer.md`](./ADR/002-live-dry-run-tracer.md).

Classroom loop: write JS, write an input, step through **that** execution. Authored JSON dry runs stay as “Official dry run.” Do not start Auth.js until Sprint 1 of this epic is merge-ready. JavaScript only — tracer follows the runtime.

### Sprint 1: Tracer + playground stepper (TODO)
*Focus: instrument user JS, Worker + step cap, line + variables. No visualizer heuristics yet.*
- [ ] **Story**: Parse user JS (Acorn); insert `__vc.step(line, locals)` after statements.
- [ ] **Story**: Execute in a Worker with timeout and step cap 500. Kill playground `new Function` on the UI thread (`F-P2S1-10`).
- [ ] **Story**: Decouple `DryRunViewer` from `Problem` so it accepts `{ code, dryRunSteps }`.
- [ ] **Story**: Playground UI: editor | input | stepper. Line highlight on user code + variable inspector.
- [ ] **Story**: CI fixture — two-pointers on `[1,3,5,7,9], 12` yields real `left` / `right` values.

### Sprint 2: On-the-go visuals (TODO)
*Start only after Sprint 1 is merge-ready. Snapshot → existing visualizers.*
- [ ] **Story**: 1D arrays → `arrayState`; numeric locals `i` / `j` / `left` / `right` / `lo` / `hi` / `mid` that are valid indices → pointers.
- [ ] **Story**: 2D arrays → `dpTableState` (grid).
- [ ] **Story**: Plain objects / `Map` / class instances (fields) → hash-map or object inspector. Explanations stay factual (`left = 3`).

### Sprint 3: Structure heuristics + problem page (TODO)
- [ ] **Story**: `{ next }` chains → linked-list visualizer; `{ left, right }` nodes → tree visualizer.
- [ ] **Story**: Problem page tab “Dry run my code” (starter/user code + example input). Official JSON dry run unchanged.

## Epic 3: Phase 3 - User System & Progress Tracking
**Status**: TODO

Start after Live Dry Run Sprint 1 is merge-ready. Auth.js still waits until this epic’s own Sprint 1 is ready. Quality tracker: [`docs/phase-3-quality-flags.md`](./phase-3-quality-flags.md). Do not add problem JSON here — extra catalog volume is Phase 4. Flag IDs stay `F-P3S*`.

Reuse existing types (`UserProgress`, `UserPreferences`) and `visucode_uid`. UI must go through a service adapter, same as `getProblem()`.

### Sprint 1: Anonymous progress (TODO)
*Focus: localStorage completions + profile. No auth, no database.*
- [ ] **Story**: Add `progress.service.ts` (`getProgress`, `markProblemComplete`, `markLessonComplete`) with a localStorage adapter keyed by `visucode_uid`.
- [ ] **Story**: Mark a problem complete from the problem page (after tests pass and/or explicit Mark done). Idempotent; survives refresh.
- [ ] **Story**: Show completed state on problem catalog and pattern pages.
- [ ] **Story**: Profile page with completion stats from `UserProgress` (not a second store).

### Sprint 2: Identity (TODO)
*Start only after Sprint 1 is merge-ready. Auth.js (NextAuth v5) on Next.js 16, not Auth v4.*
- [ ] **Story**: GitHub + Google sign-in / sign-out in the header; session on the profile page.
- [ ] **Story**: First login merges anonymous `completedProblems` / `completedLessons` onto the account (union by default). Prove with a test.
- [ ] **Story**: Persistence choice written in the auth PR — **A:** JWT + keep progress local until Phase 4, or **B:** thin Prisma `User` table only (problems stay JSON). Do not add GraphQL for problems here.

### Sprint 3: Premium UI (TODO, skippable)
*Only if some JSON is actually marked `premium`. Today every problem is `free`. Real entitlement is Phase 4.*
- [ ] **Story**: Mark a small explicit set of problems `accessLevel: 'premium'`.
- [ ] **Story**: Free / signed-out users see a gate (not a 404). Copy states the paywall is preview until Phase 4.
- [ ] **Story**: If all content stays free until the backend, skip this sprint (`WONTFIX` in the flags file).

## Epic 4: Phase 4 - Backend Migration
**Status**: TODO

Extra problems deferred from Phase 2 Sprints 3–5 land here with the content pipeline. Do not pull that work into Live Dry Run or Phase 3.

- [ ] **Story**: Setup PostgreSQL database and Prisma ORM (users + progress if Sprint 2 chose option A).
- [ ] **Story**: Create a GraphQL API to serve problem and lesson data.
- [ ] **Story**: Swap `problem.service.ts` to fetch from GraphQL instead of local JSON. Drop `PROBLEM_INDEX` dual-write.
- [ ] **Story**: Implement Redis caching for high-traffic read operations.
- [ ] **Story**: Grow problem volume past the Phase 2 core set (see `F-P2S5-07` and sibling OPEN flags).
