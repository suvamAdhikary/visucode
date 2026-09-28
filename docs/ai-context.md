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
- **Dry run**: Authored `dryRunSteps` JSON for official solutions. Live dry run generates the same `DryRunStep` shape from instrumented JS ([ADR-002](./ADR/002-live-dry-run-tracer.md)).

## Current Status (As of Live Dry Run plan)
- **Phase 1 (MVP)**: Done. Dry Run viewer, learn pages, problem browser, Zustand, Vercel.
- **Phase 2**: Done (Sprints 1–5). Test runner, pattern pages, visualizers, core problem set. Extra volume deferred to Phase 4.
- **Next — Live Dry Run**: Plan only. [`docs/phase-live-dry-run-quality-flags.md`](./phase-live-dry-run-quality-flags.md). Preflight small input → JS AST tracer → stepper. Sprint 4 = authored complexity panel (why + mini Big-O visual). User-code good/bad analysis is later (`F-LDR-X-01`). Cuts ahead of Auth.js.
- **Phase 3 (user system)**: After Live Dry Run Sprint 1. [`docs/phase-3-quality-flags.md`](./phase-3-quality-flags.md). Flag IDs stay `F-P3S*`.

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
- Live Dry Run: [`docs/phase-live-dry-run-quality-flags.md`](./phase-live-dry-run-quality-flags.md) — tracer snapshots match execution; Worker + step cap; no LLM
- Phase 3: [`docs/phase-3-quality-flags.md`](./phase-3-quality-flags.md) — same merge bar (progress, `next-env`, service layer, Vercel is not a pass)
