# AI Context & Project State

This document provides context for any AI assistant or developer working on the `visucode` project. It serves as a persistent anchor for the project's state, architecture, and current goals.

## What is VisuCode?
An interactive DSA learning platform with animated step-by-step visualizations and a code test runner.

## Architecture Highlights
- **Framework**: Next.js 16 (App Router)
- **Monorepo**: Nx
- **State Management**: Zustand
- **Code Editor**: Monaco Editor (client-side Worker test runner)
- **Data**: Local JSON + `PROBLEM_INDEX` dual-write (Phase 1 & 2). GraphQL swap is Phase 4, one service file per entity.

## Current Status (As of Phase 2 Sprint 5 merged)
- **Phase 1 (MVP)**: Done. Dry Run viewer, learn pages, problem browser, Zustand, Vercel.
- **Phase 2**: Done (Sprints 1–5). Test runner, pattern pages, HashMap / Stack-Queue / Interval / Graph / Trie / Heap / DP-table / Backtracking visualizers, core problem set. Extra volume deferred to Phase 4.
- **Phase 3**: Next. User progress + identity. Plan: [`docs/phase-3-quality-flags.md`](./phase-3-quality-flags.md) and Epic 2 in [`docs/epics-and-stories.md`](./epics-and-stories.md). Sprint 1 = localStorage progress via `progress.service`; Sprint 2 = Auth.js v5; Sprint 3 = optional premium UI.

## Key Directories
- `apps/web/app`: Next.js App Router pages (Server & Client components).
- `apps/web/app/components/editor`: Contains Monaco integration and test runner.
- `apps/web/app/components/visualizer`: Contains the core Dry Run visualizer logic.
- `apps/web/lib/services`: Data abstraction layer (fetches from JSON currently).
- `apps/web/content/problems`: JSON files for all DSA problems and their test cases.
- `libs/shared-types`: TypeScript interfaces shared across the monorepo.
- `docs/`: Contains project plans, quality flags, and epics.

## Quality Standards
- Phase 2: [`docs/phase-2-quality-flags.md`](./phase-2-quality-flags.md)
- Phase 3: [`docs/phase-3-quality-flags.md`](./phase-3-quality-flags.md) — same merge bar (judging, `next-env`, service layer, Vercel is not a pass)
