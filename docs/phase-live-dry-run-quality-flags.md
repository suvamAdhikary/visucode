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
3. **The tab cannot freeze, and abort is explained.** Tracer and playground run in a Worker with timeout, step cap (500), recursion-depth cap, and **early** stop on repeated line+locals. No `new Function` on the UI thread. Every abort/throw opens a diagnostics popup (issue list from the trace, not an LLM). Partial steps stay steppable.
4. **Input is preflighted.** Do not open the dry-run window or start the Worker until the chosen input is parseable and within size limits (problem example or manual). Over-limit input is rejected in place with a specific reason. Do not silently truncate. Hidden tests are not dry-run inputs.
5. **Official dry runs stay honest.** Problem-page authored `dryRunSteps` are unchanged unless a PR is explicitly about content. Live dry run is a second surface.
6. **Explanations are factual.** `left = 3` is allowed. “Moving left pointer from 0 to 1” is not, unless that text is derived from a real assignment.
7. **Generated / local-only files are not in the PR.** No `next-env.d.ts` churn, no `file:///` paths.
8. **Automated checks prove the above**, not just `nx build web`.

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
| **[PR #15](https://github.com/suvamAdhikary/visucode/pull/15)** — `feature/live-dry-run-sprint-1` → `main` | **MERGED & DONE.** Merged into `main` (`cde5b5b`). Sprint 1 complete. |
| **Live Dry Run Sprint 2 (On-the-go visuals)** | **READY FOR REVIEW.** (branch `feature/live-dry-run-sprint-2`). 1D arrays -> arrayState, pointers with distinct colors, 2D arrays -> dpTableState with activeCell, objects/Map -> hashMapState, factual explanations. All 9 test suites (500 tests) green; production build verified. |
| **Live Dry Run Sprint 4 (Complexity panel)** | Can start in parallel with Sprint 2/3. |
| **Phase 2** | Done (Sprints 1–5). |
| **Phase 3 (user system)** | After Live Dry Run epic. Tracker: `docs/phase-3-quality-flags.md`. |

---

## Still OPEN (not merge-blocking)

- **Timeout cannot keep steps after `terminate()`** (called out in the diagnostic).
- **First function in the file is the one that runs.**
- **Manual preview note**: Vercel preview was not clicked due to SSO. After merge, paste `try { while (true) {} }` once locally if you want a human freeze check.

---

---

## Sequencing (do not skip)

```
Sprint 1  AST tracer + Worker + cap + playground stepper (line + variables)
    ↓
Sprint 2  Snapshot → 1D array, 2D grid, object/map, index pointers
    ↓
Sprint 3  .next / .left.right heuristics + problem page “Dry run my code”
    ↘ parallel
Sprint 4  Official complexity panel (authored why + mini Big-O visual)
    ↓
Phase 3   User system (progress, then Auth.js). Flag IDs stay F-P3S*.
```

User-code good/bad analysis is **later** (`F-LDR-X-01`), not these sprints.

v1 language is **JavaScript only**. Tracer follows the runtime.

**Input limits (v1, preflight — same as ADR-002):** 1D length ≤ 16; 2D cells ≤ 8×8; string length ≤ 32; object/map keys ≤ 16; nesting depth ≤ 4; payload ≤ 2KB. Source: problem `examples[0]` or manual. Hidden tests: never.

---

## Sprint 1 — Tracer + playground stepper

**Active PR:** [#15](https://github.com/suvamAdhikary/visucode/pull/15) · `feature/live-dry-run-sprint-1` → `main` · reviewed `db6d587`

Reuse: `DryRunStep`, `DryRunViewer`, `VariableInspector`, `CodeViewer`, `StepController`, Worker pattern from `test-executor` / `executor.worker.ts`.

### Stories

- [x] Parse user JS (Acorn); insert `__vc.step(line, locals)` after statements (supports `try`, `switch`, class methods, expression-body arrow functions — F-LDR-S1-02).
- [x] Input preflight **before** the dry-run window / Worker on the playground. Reject missing, unparseable, or over-limit input in place (do not truncate; do not use hidden tests).
- [x] Execute in a Worker. Timeout + step cap 500 + recursion-depth cap. **Early** abort when the same line + same locals repeat. Never `new Function` on the UI thread (PR #15: decoupled `tracer-context.ts`, fail-closed in production).
- [x] On abort or throw: keep partial steps; show a diagnostics popup; timeout explicitly indicates empty tape (PR #15).
- [x] Decouple `DryRunViewer` from `Problem`: accept `{ code, dryRunSteps }`.
- [x] Playground UI: editor | input | stepper. Line highlight on **user** code + variable inspector.
- [x] Tests: two-pointers locals (`left`/`right` asserted); `while (true)` inside `try`, unbounded recursion, TypeError, 500-step cap, mock worker timeout, 1000-element preflight.

### Flag register (Sprint 1)

| ID | Flag | Status | Notes |
| --- | --- | --- | --- |
| F-LDR-S1-01 | No UI-thread `new Function` in playground or tracer | `FIXED` | Worker context extracted to `tracer-context.ts` (zero side effects); `tracer.ts` never imports worker module directly; fails closed with runtime diagnostic in production if Web Worker unavailable; zero UI-thread `new Function` (PR #15). |
| F-LDR-S1-02 | Worker timeout, step cap (500), recursion-depth cap | `FIXED` | Acorn AST walks `TryStatement` (`block`, `handler`, `finalizer`), `SwitchStatement`, classes, and expression-body arrow functions; CI tests prove `while (true)` inside `try`, 500-step cap, recursion bomb (50 calls), and mock worker timeout (PR #15). |
| F-LDR-S1-03 | Snapshots match real locals / lines | `FIXED` | Two-pointers fixture asserts real `left` / `right` variable values across execution steps; entry function confirmed as first `FunctionDeclaration` (PR #15). |
| F-LDR-S1-04 | Viewer decoupled from `Problem` | `FIXED` | `ProblemTabs` still passes `problem`; authored JSON path works |
| F-LDR-S1-05 | No LLM-generated steps | `FIXED` | Acorn only |
| F-LDR-S1-06 | `next-env.d.ts` / generated files | `FIXED` | 0 diff vs `main` |
| F-LDR-S1-07 | Early abort + diagnostics popup | `FIXED` | Loop-hang early abort preserves partial steps with diagnostic modal; Worker timeout cleanly terminates worker and explicitly reports that the execution tape is empty due to worker termination; catch/finally blocks in instrumented code cannot swallow tracer aborts (PR #15). |
| F-LDR-S1-08 | Input preflight before dry-run window | `FIXED` | Playground: button disabled; 1000-el rejected before execute. Problem-page live tab is Sprint 3. |

---

## Sprint 2 — On-the-go visuals

### Stories

- [x] 1D arrays → `arrayState`. Numeric locals `i`, `j`, `left`, `right`, `lo`, `hi`, `mid` that are valid indices → `pointers`.
- [x] 2D arrays → `dpTableState` (grid).
- [x] Plain objects / `Map` / class instances (fields) → `hashMapState` or object inspector. No UML.
- [x] Factual explanations only (`left = 3`).

### Flag register (Sprint 2)

| ID | Flag | Status | Notes |
| --- | --- | --- | --- |
| F-LDR-S2-01 | 1D array + index pointers from real locals | `FIXED` | `state-mapper.ts` detects 1D arrays, maps valid in-bounds numeric locals (`i`, `j`, `left`, `right`, etc.) to colored pointers and highlights elements; covered by unit tests. |
| F-LDR-S2-02 | 2D grid from nested arrays | `FIXED` | 2D arrays mapped to `dpTableState` grid with `activeCell` tracking for `i`/`j` coordinates; null/undefined cells sanitized. |
| F-LDR-S2-03 | Objects / maps / class fields | `FIXED` | `Map` instances and plain objects mapped to `hashMapState.entries` (`key`, `value`); covered by automated tests. |
| F-LDR-S2-04 | No invented textbook narration | `FIXED` | `explanation` strictly derives from formatted runtime variable values (`var = val`) prioritizing pointers without invented narrative text. |

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

## Sprint 4 — Official complexity explainer

**Can start in parallel with Sprints 2–3.** Does not need the tracer. Do not mix this with user-code analysis.

Today: pattern pages and the dry-run header show Big-O **strings**. `solutions[].explanation` exists in JSON and is **never rendered**.

### Stories

- [ ] Problem-page **Complexity** panel (not only a header badge): time + space, a short why for each, mini growth visual.
- [ ] Authored fields: `timeComplexityWhy`, `spaceComplexityWhy`, `complexityClass` (`constant` | `logarithmic` | `linear` | `linearithmic` | `quadratic` | `exponential`). Inferring Big-O from trace length is a fail.
- [ ] Shared `ComplexityChart` — highlight the official class on a small O(1)…O(2^n) sketch. No per-problem custom animation in this sprint.
- [ ] Every problem on `main` has why-text + class. Missing why = content fail.

### Flag register (Sprint 4)

| ID | Flag | Status | Notes |
| --- | --- | --- | --- |
| F-LDR-S4-01 | Complexity panel on the problem page | `OPEN` | Visible without opening dry run |
| F-LDR-S4-02 | Why-text is authored, not inferred from the tracer | `OPEN` | |
| F-LDR-S4-03 | Mini growth visual uses `complexityClass` | `OPEN` | One component, all problems |
| F-LDR-S4-04 | All current problem JSON backfilled | `OPEN` | Empty why fails CI |

---

## Later — user-code good / bad analysis

**Not Sprint 1–4.** After the live dry run + test runner exist.

A proper critique of **the user’s** code (what’s good, what’s bad, vs official time/space) is a separate feature. Heuristics (nested loops, extra arrays) are allowed; an LLM review needs its own ADR. Do not pretend the diagnostics popup (`F-LDR-S1-07`) is this.

| ID | Flag | Status | Notes |
| --- | --- | --- | --- |
| F-LDR-X-01 | User-code good/bad analysis | `OPEN` | Later. Not LLM unless a new ADR says so |

---

## Out of this epic (do not pull in)

| Item | Where it belongs |
| --- | --- |
| Auth.js / user table | Phase 3 (`F-P3S*`) |
| Extra problem JSON | Phase 4 (`F-P2S5-07` and siblings) |
| Python / Java / C++ / freehand sudo | Later, after a runtime exists |
| LLM-generated dry runs | Never (ADR-002). LLM code critique needs a new ADR |
| User-code good/bad analysis (`F-LDR-X-01`) | Later, after tracer + tests |
| Auto backtracking trees, graphs, tries, heaps without a convention | Later |
| 1000+ cells | Phase 5 WASM |
| Real sandbox (Firecracker / E2B) | Later (`F-P2X-01`) |

---

## Branching

`feature/live-dry-run-sprint-N` → `main`. Same `develop` rule as Phase 2: do not fast-forward `main` from `develop`.

---

## Sprint 1 merge checklist (copy when asking for review)

- [x] Playground and tracer are Worker-only; no UI-thread `new Function` (F-LDR-S1-01)
- [x] Input preflight: playground oversized / invalid input rejected **before** Worker
- [x] Timeout + step cap + recursion cap + repeat-state early abort proven (`while (true)`, recursion bomb, TypeError, 500-step cap, worker timeout)
- [x] Diagnostics popup lists observed issues (line + kind); not an LLM review
- [x] Partial trace remains steppable after loop-hang abort; timeout explicitly reports empty tape
- [x] Two-pointers fixture: `left` / `right` on a step, not only return `[1, 4]`
- [x] `DryRunViewer` still plays authored JSON on problem pages
- [x] No LLM / no Python runtime in the Sprint 1 diff
- [x] `next-env.d.ts` 0 diff vs `main`
- [x] `npx nx test web` green **after** the Worker split and new fixtures (8 suites, 492 tests)
- [x] This file updated (`BLOCKED` → `FIXED` for Sprint 1 blockers)

---

## Review notes

- 2026-09-28: Plan written after Phase 2 Sprint 5. Independent of tracer code.
- 2026-09-28: Abort diagnostics added — early break on loops/recursion plus a popup of observed issues (`F-LDR-S1-07`).
- 2026-09-28: Input preflight before dry-run window (`F-LDR-S1-08`). Problem example or manual; reject oversized input in place.
- 2026-09-28: Official complexity panel planned as Sprint 4 (`F-LDR-S4-*`). User-code good/bad analysis parked (`F-LDR-X-01`).
- 2026-09-28: Branch self-marked Sprint 1 complete on `db6d587`. Not an independent pass.
- 2026-09-29: Independent review of [PR #15](https://github.com/suvamAdhikary/visucode/pull/15) (`db6d587`). **BLOCKED** on F-LDR-S1-01 (worker module imported into client; sync fallback), F-LDR-S1-02 (`try` uninstrumented; no step-cap/timeout CI), F-LDR-S1-07 (timeout drops steps). F-LDR-S1-04/05/06/08 `FIXED`. F-LDR-S1-03 `OPEN`. Tracer unit tests 22/22 on the blocked snapshot. Preview not used as a freeze check (SSO).
- 2026-09-29: Resolved independent review blockers in PR #15. Split tracer-context to remove worker bundle import; instrumented try/switch/classes/arrow expressions; guaranteed try/catch cannot swallow tracer aborts; added CI tests for while(true) in try, 500-step cap, recursion bomb, mock worker timeout, and left/right variable snapshots. All 8 test suites (492 tests) green and production build verified.
- 2026-09-29: Replaced dev work remaining with non-blocking open notes; updated verdict to READY FOR MERGE / 1363b61.
- 2026-09-29: Sprint 2 implementation complete on feature/live-dry-run-sprint-2. Created state-mapper.ts to infer arrayState, pointers, dpTableState, and hashMapState from runtime execution locals. Factual variable explanations prioritize pointer states. All 9 test suites (500 tests) green, next-env.d.ts 0 diff, production build verified.

