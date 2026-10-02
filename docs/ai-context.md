# AI Context & Project State

This document provides context for any AI assistant or developer working on the `visucode` project. It serves as a persistent anchor for the project's state, architecture, and current goals.

## What is VisuCode?
An interactive DSA learning platform: authored dry runs for taught solutions, and a **live tracer** so learners write JS, write an input, and step through **their** execution.

## Architecture Highlights
- **Framework**: Next.js 16 (App Router)
- **Monorepo**: Nx
- **State Management**: Zustand
- **Code Editor**: Monaco Editor (client-side Worker test runner; live dry run is a second Worker tracer)
- **Data**: Local JSON + `PROBLEM_INDEX` dual-write (Phase 1 & 2). GraphQL swap is Phase 4, one service file per entity.
- **Progress Tracking**: Client-side anonymous persistence keyed by `visucode_uid` behind `progress.service.ts` ([ADR-003](./ADR/003-client-side-anonymous-progress.md)). Uses `useSyncExternalStore` for reactive UI and cross-tab sync.
- **Dry run**: Authored `dryRunSteps` JSON for official solutions. Live dry run generates the same `DryRunStep` shape from instrumented JS ([ADR-002](./ADR/002-live-dry-run-tracer.md)).

## Current Status
- **Phase 1 (MVP)**: Done. Dry Run viewer, learn pages, problem browser, Zustand, Vercel.
- **Phase 2**: Done (Sprints 1–5). Test runner, pattern pages, visualizers, core problem set. Extra volume deferred to Phase 4.
- **Live Dry Run (Epic 2)**: Done (Sprints 1–4 merged into `main`). Acorn AST tracer, Worker step cap 500, stepper UI, heuristics, and authored complexity explainer.
- **Phase 3 (User System & Progress Tracking)**:
  - **Sprint 1 (Anonymous Progress)**: Done. `progress.service.ts`, problem completion toggle, test runner auto-mark, catalog/pattern badges, `/profile` page, ADR-003, and architectural documentation.
  - **Sprint 2 (Identity & Auth.js)**: Next. Auth.js v5 (GitHub/Google) + lossless merge of anonymous progress.

## Key Directories
- `apps/web/app`: Next.js App Router pages (Server & Client components).
- `apps/web/app/profile`: Developer profile and progress tracking metrics page.
- `apps/web/app/components/editor`: Monaco integration, Live Dry Run tabs, and test runner.
- `apps/web/app/components/visualizer`: Core Dry Run visualizer logic.
- `apps/web/lib/services`: Data abstraction layer (`problem.service.ts` for server data, `progress.service.ts` for client progress).
- `apps/web/content/problems`: JSON files for all DSA problems and their test cases.
- `libs/shared-types`: TypeScript interfaces shared across the monorepo.
- `docs/`: Contains project plans, quality flags, ADRs, and architecture docs.

## Quality Standards
- Phase 2: [`docs/phase-2-quality-flags.md`](./phase-2-quality-flags.md)
- Live Dry Run: [`docs/phase-live-dry-run-quality-flags.md`](./phase-live-dry-run-quality-flags.md) — tracer snapshots match execution; Worker + step cap; no LLM
- Phase 3: [`docs/phase-3-quality-flags.md`](./phase-3-quality-flags.md) — service layer only, progress idempotency, lossless anonymous merge, `next-env` 0 diff
- Sprint 1 Architecture: [`docs/phase-3-sprint-1-architecture.md`](./phase-3-sprint-1-architecture.md)

