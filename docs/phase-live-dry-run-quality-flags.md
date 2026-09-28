# Live Dry Run — Quality Flags

Living tracker for the **Live Dry Run** epic. Same merge bar as Phase 2 (`docs/phase-2-quality-flags.md`): a green Vercel deploy is **not** a merge bar.

This is the classroom loop: write JS, write an input, step through **that** execution. It is not more problem JSON and not Auth.js.

**ADR:** [`docs/ADR/002-live-dry-run-tracer.md`](./ADR/002-live-dry-run-tracer.md)
**Active epic:** [`docs/epics-and-stories.md`](./epics-and-stories.md) Epic 2 (Live Dry Run).

Phase 3 (`docs/phase-3-quality-flags.md`, `F-P3S*`) stays user-system. Do not start Auth.js until Live Dry Run Sprint 1 is merge-ready.

---

## Quality bar (non-negotiable)

Merge a Live Dry Run PR only when **all** of these are true:

1. **The tape is the user’s code.** Steps come from executing instrumented JS, not from authored JSON and not from an LLM.
2. **Snapshots match real execution.** Locals, line numbers, and derived visuals agree with what the function actually did. Prove with tests, not a screenshot.
3. **The tab cannot freeze.** Tracer and playground run in a Worker with timeout **and** a step cap (500). No `new Function` on the UI thread.
4. **Official dry runs stay honest.** Problem-page authored `dryRunSteps` are unchanged unless a PR is explicitly about content. Live dry run is a second surface.
5. **Explanations are factual.** `left = 3` is allowed. “Moving left pointer from 0 to 1” is not, unless that text is derived from a real assignment.
6. **Generated / local-only files are not in the PR.** No `next-env.d.ts` churn, no `file:///` paths.
7. **Automated checks prove the above**, not just `nx build web`.

If any item fails: **do not merge.**

| Status | Meaning |
| --- | --- |
| `BLOCKED` | Must be fixed before that PR / sprint can merge |
| `OPEN` | Known; not merge-blocking if called out |
| `FIXED` | Verified in code + tests (or browser, for UI) |
| `WONTFIX` | Written decision with owner + reason |

---

## Current verdict

| Item | Verdict |
| --- | --- |
| **Live Dry Run** | **NOT STARTED.** Plan only. Do not open Sprint 2 until Sprint 1 `BLOCKED` flags are `FIXED`. |
| **Phase 2** | Done (Sprints 1–5). |
| **Phase 3 (user system)** | Planned, sequenced **after** this epic’s Sprint 1. Tracker: `docs/phase-3-quality-flags.md`. |

---

## Sequencing (do not skip)

```
Sprint 1  AST tracer + Worker + cap + playground stepper (line + variables)
    ↓
Sprint 2  Snapshot → 1D array, 2D grid, object/map, index pointers
    ↓
Sprint 3  .next / .left.right heuristics + problem page “Dry run my code”
    ↓
Phase 3   User system (progress, then Auth.js). Flag IDs stay F-P3S*.
```

v1 language is **JavaScript only**. Tracer follows the runtime.

---

## Sprint 1 — Tracer + playground stepper

**Branch (when opened):** `feature/live-dry-run-sprint-1`

Reuse: `DryRunStep`, `DryRunViewer`, `VariableInspector`, `CodeViewer`, `StepController`, Worker pattern from `test-executor` / `executor.worker.ts`.

### Stories

- [ ] Parse user JS (Acorn); insert `__vc.step(line, locals)` after statements.
- [ ] Execute instrumented code in a Worker. Timeout + step cap 500. Never `new Function` on the UI thread.
- [ ] Decouple `DryRunViewer` from `Problem`: accept `{ code, dryRunSteps }`.
- [ ] Playground: editor | input | stepper. Line highlight on **user** code + variable inspector. Kill the main-thread playground `new Function` (`F-P2S1-10`).
- [ ] Tests: two-pointers on `[1,3,5,7,9], 12` produces `left` / `right` values that match real execution. Infinite loop → timeout/cap, UI still clickable.

### Flag register (Sprint 1)

| ID | Flag | Status | Notes |
| --- | --- | --- | --- |
| F-LDR-S1-01 | No UI-thread `new Function` in playground or tracer | `OPEN` | Same class as `F-P2S1-06` |
| F-LDR-S1-02 | Worker timeout **and** step cap (500) | `OPEN` | Cap must be tested, not only timeout |
| F-LDR-S1-03 | Snapshots match real locals / lines | `OPEN` | Two-pointers fixture in CI |
| F-LDR-S1-04 | Viewer decoupled from `Problem` | `OPEN` | Official JSON path still works |
| F-LDR-S1-05 | No LLM-generated steps | `OPEN` | Instrumentation only |
| F-LDR-S1-06 | `next-env.d.ts` / generated files | `OPEN` | 0 diff vs `main` |

---

## Sprint 2 — On-the-go visuals

**Do not start until Sprint 1 is merge-ready.**

### Stories

- [ ] 1D arrays → `arrayState`. Numeric locals `i`, `j`, `left`, `right`, `lo`, `hi`, `mid` that are valid indices → `pointers`.
- [ ] 2D arrays → `dpTableState` (grid).
- [ ] Plain objects / `Map` / class instances (fields) → `hashMapState` or object inspector. No UML.
- [ ] Factual explanations only (`left = 3`).

### Flag register (Sprint 2)

| ID | Flag | Status | Notes |
| --- | --- | --- | --- |
| F-LDR-S2-01 | 1D array + index pointers from real locals | `OPEN` | |
| F-LDR-S2-02 | 2D grid from nested arrays | `OPEN` | |
| F-LDR-S2-03 | Objects / maps / class fields | `OPEN` | |
| F-LDR-S2-04 | No invented textbook narration | `OPEN` | |

---

## Sprint 3 — Structure heuristics + problem page

### Stories

- [ ] `{ next }` chains → `linkedListState`.
- [ ] `{ left, right }` nodes → `treeState`.
- [ ] Problem page tab: “Dry run my code” using starter/user code and that problem’s example input. “Official dry run” stays authored JSON.

### Flag register (Sprint 3)

| ID | Flag | Status | Notes |
| --- | --- | --- | --- |
| F-LDR-S3-01 | List heuristic does not misread unrelated objects | `OPEN` | Need a fixture that should **not** become a list |
| F-LDR-S3-02 | Tree heuristic same | `OPEN` | |
| F-LDR-S3-03 | Official JSON dry run unchanged by live tab | `OPEN` | Two surfaces |

---

## Out of this epic (do not pull in)

| Item | Where it belongs |
| --- | --- |
| Auth.js / user table | Phase 3 (`F-P3S*`) |
| Extra problem JSON | Phase 4 (`F-P2S5-07` and siblings) |
| Python / Java / C++ / freehand sudo | Later, after a runtime exists |
| LLM-generated dry runs | Never (ADR-002) |
| Auto backtracking trees, graphs, tries, heaps without a convention | Later |
| 1000+ cells | Phase 5 WASM |
| Real sandbox (Firecracker / E2B) | Later (`F-P2X-01`) |

---

## Branching

`feature/live-dry-run-sprint-N` → `main`. Same `develop` rule as Phase 2: do not fast-forward `main` from `develop`.

---

## Sprint 1 merge checklist (copy when asking for review)

- [ ] Playground and tracer are Worker-only; no UI-thread `new Function`
- [ ] Timeout + step cap proven (`while (true)` and a step-bomb fixture)
- [ ] Two-pointers fixture: locals match real execution
- [ ] `DryRunViewer` still plays authored JSON on problem pages
- [ ] No LLM / no Python runtime in the Sprint 1 diff
- [ ] `next-env.d.ts` 0 diff vs `main`
- [ ] `npx nx test web` green
- [ ] This file updated (`OPEN` → `FIXED` for Sprint 1 flags)

---

## Review notes

- 2026-09-28: Plan written after Phase 2 Sprint 5. Independent of tracer code.
- Owner: update statuses in the same PR that fixes the flag. Do not delete flags.
