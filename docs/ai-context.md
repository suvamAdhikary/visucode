# AI Context & Project State

This document provides context for any AI assistant or developer working on the `visucode` project. It serves as a persistent anchor for the project's state, architecture, and current goals.

## What is VisuCode?
An interactive DSA learning platform with animated step-by-step visualizations and a code test runner.

## Architecture Highlights
- **Framework**: Next.js 16 (App Router)
- **Monorepo**: Nx
- **State Management**: Zustand
- **Code Editor**: Monaco Editor (client-side execution via sandboxed `new Function()`)
- **Data**: Local JSON files (Phase 1 & 2), designed to be seamlessly swapped for GraphQL later.

## Current Status (As of Phase 2 Sprint 1)
- **Phase 1 (MVP)**: Completely finished. Interactive Dry Run viewer, basic routing, Zustand stores are implemented.
- **Phase 2 Sprint 1**: Completely finished. Added Code Test Runner UI, sandbox code execution (`test-executor.ts`), and expanded the problem set to 15 problems total.
- **Phase 2 Sprint 2**: Up next. Remaining problems (to hit 20 total), Linked List visualizer, Tree visualizer.

## Key Directories
- `apps/web/app`: Next.js App Router pages (Server & Client components).
- `apps/web/app/components/editor`: Contains Monaco integration and test runner.
- `apps/web/app/components/visualizer`: Contains the core Dry Run visualizer logic.
- `apps/web/lib/services`: Data abstraction layer (fetches from JSON currently).
- `apps/web/content/problems`: JSON files for all DSA problems and their test cases.
- `libs/shared-types`: TypeScript interfaces shared across the monorepo.
- `docs/`: Contains project plans, quality flags, and epics.

## Quality Standards
Refer to `docs/phase-2-quality-flags.md` for specific rules regarding strict type safety, visual feedback, and testing.
