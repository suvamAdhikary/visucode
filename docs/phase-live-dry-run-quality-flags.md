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
| **[PR #15](https://github.com/suvamAdhikary/visucode/pull/15)** — `feature/live-dry-run-sprint-1` → `main` (`db6d587`) | **BLOCKED.** Independent review 2026-09-29. Vercel Ready is **not** a pass. Branch had self-marked Sprint 1 complete — replaced below. Do not open Sprint 2. |
| **Phase 2** | Done (Sprints 1–5). |
| **Phase 3 (user system)** | After this Sprint 1 is merge-ready. Tracker: `docs/phase-3-quality-flags.md`. |

---

## Dev work remaining (do this on `feature/live-dry-run-sprint-1`)

Work these in order. When a flag is done: set it `FIXED` in this file in the **same commit**, with the PR number and a one-line “how.”

### 1. F-LDR-S1-01 — tracer worker must not run on the UI thread

`apps/web/lib/tracer/tracer.ts` imports `ExecutionTracerContext` / `createDiagnosticSuggestion` from `tracer.worker.ts`. That file’s top-level `self.onmessage` + `new Function` therefore loads in the **playground client bundle**. In the browser `self` is `window`.

`traceUserCode` also fail-opens: `Worker` undefined → `executeTraceSync` (`new Function` on the caller thread). `test-executor.ts` already fail-closes in production.

**Do:**

- Move context + suggestion helper to `tracer-context.ts` (no `onmessage`, no Worker side effects).
- `tracer.worker.ts` used **only** via `new Worker(new URL('./tracer.worker.ts', import.meta.url))`. `tracer.ts` must not import the worker module.
- Production: no Worker / construct failure → diagnostic, **never** `executeTraceSync`. Sync path `NODE_ENV === 'test'` only, same pattern as `test-executor.ts`.

### 2. F-LDR-S1-02 / F-LDR-S1-07 — instrument `try` and prove caps

The instrumenter does not walk `TryStatement` / `switch` / class methods / expression-body arrows. `try { while (true) {} }` never gets `__vc.step` and can only die on timeout.

Timeout currently `resolve({ steps: [] })` after `worker.terminate()` — partial trace is dropped.

**Do:**

- Instrument `TryStatement` bodies (minimum: `while (true)` inside `try` must hit loop-hang or step-cap).
- Keep partial steps on timeout if possible; if not, the diagnostic must say the tape is empty.
- CI: `while (true)`, step-cap, timeout, TypeError (TypeError already exists). Recursion bomb already exists.

### 3. F-LDR-S1-03 — assert `left` / `right` (not merge-blocking)

Two-pointers on `[[1,3,5,7,9], 12]` already returns `[1, 4]`. Add a step assertion for real `left` / `right` values. Entry function is currently the **first** `FunctionDeclaration` — call that out if you keep it.

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

- [x] Parse user JS (Acorn); insert `__vc.step(line, locals)` after statements. *(gap: `try` / `switch` / class / expression-body arrows — F-LDR-S1-02)*
- [x] Input preflight **before** the dry-run window / Worker on the playground. Reject missing, unparseable, or over-limit input in place (do not truncate; do not use hidden tests).
- [ ] Execute in a Worker. Timeout + step cap 500 + recursion-depth cap. **Early** abort when the same line + same locals repeat. Never `new Function` on the UI thread. *(blocked: worker module imported into client; sync fallback if no Worker)*
- [ ] On abort or throw: keep partial steps; show a diagnostics popup. *(popup exists for loop-hang; timeout drops steps)*
- [x] Decouple `DryRunViewer` from `Problem`: accept `{ code, dryRunSteps }`.
- [x] Playground UI: editor | input | stepper. Line highlight on **user** code + variable inspector. *(F-P2S1-10 still follows F-LDR-S1-01)*
- [ ] Tests: two-pointers locals; `while (true)`, unbounded recursion, TypeError, 1000-element preflight. *(have: return `[1,4]`, loop-hang, recursion, TypeError, preflight. Missing: `while (true)`, step-cap, timeout)*

### Flag register (Sprint 1)

| ID | Flag | Status | Notes |
| --- | --- | --- | --- |
| F-LDR-S1-01 | No UI-thread `new Function` in playground or tracer | `BLOCKED` | `tracer.ts` imports `tracer.worker.ts` (`self.onmessage` + `new Function` in the client bundle). `Worker` undefined → `executeTraceSync`. Split context/worker; fail closed like `test-executor.ts`. PlaygroundClient itself has no `new Function`. |
| F-LDR-S1-02 | Worker timeout, step cap (500), recursion-depth cap | `BLOCKED` | Caps exist; recursion bomb is tested. CI does **not** test step-cap or timeout. `try` bodies not instrumented. |
| F-LDR-S1-03 | Snapshots match real locals / lines | `OPEN` | `[[1,3,5,7,9], 12]` returns `[1, 4]`. Assert `left`/`right` on a step. Entry = first `FunctionDeclaration`. |
| F-LDR-S1-04 | Viewer decoupled from `Problem` | `FIXED` | `ProblemTabs` still passes `problem`; authored JSON path works |
| F-LDR-S1-05 | No LLM-generated steps | `FIXED` | Acorn only |
| F-LDR-S1-06 | `next-env.d.ts` / generated files | `FIXED` | 0 diff vs `main` |
| F-LDR-S1-07 | Early abort + diagnostics popup | `BLOCKED` | Loop-hang popup + partial steps work. Timeout `resolve({ steps: [] })`. |
| F-LDR-S1-08 | Input preflight before dry-run window | `FIXED` | Playground: button disabled; 1000-el rejected before execute. Problem-page live tab is Sprint 3. |

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

- [ ] Playground and tracer are Worker-only; no UI-thread `new Function` (F-LDR-S1-01)
- [x] Input preflight: playground oversized / invalid input rejected **before** Worker
- [ ] Timeout + step cap + recursion cap + repeat-state early abort proven (`while (true)`, recursion bomb, TypeError)
- [x] Diagnostics popup lists observed issues (line + kind); not an LLM review *(loop-hang path)*
- [ ] Partial trace remains steppable after **timeout** abort (loop-hang already keeps steps)
- [ ] Two-pointers fixture: `left` / `right` on a step, not only return `[1, 4]`
- [x] `DryRunViewer` still plays authored JSON on problem pages
- [x] No LLM / no Python runtime in the Sprint 1 diff
- [x] `next-env.d.ts` 0 diff vs `main`
- [ ] `npx nx test web` green **after** the Worker split and new fixtures
- [ ] This file updated (`BLOCKED` → `FIXED` for Sprint 1 blockers)

---

## Review notes

- 2026-09-28: Plan written after Phase 2 Sprint 5. Independent of tracer code.
- 2026-09-28: Abort diagnostics added — early break on loops/recursion plus a popup of observed issues (`F-LDR-S1-07`).
- 2026-09-28: Input preflight before dry-run window (`F-LDR-S1-08`). Problem example or manual; reject oversized input in place.
- 2026-09-28: Official complexity panel planned as Sprint 4 (`F-LDR-S4-*`). User-code good/bad analysis parked (`F-LDR-X-01`).
- 2026-09-28: Branch self-marked Sprint 1 complete on `db6d587`. Not an independent pass.
- 2026-09-29: Independent review of [PR #15](https://github.com/suvamAdhikary/visucode/pull/15) (`db6d587`). **BLOCKED** on F-LDR-S1-01 (worker module imported into client; sync fallback), F-LDR-S1-02 (`try` uninstrumented; no step-cap/timeout CI), F-LDR-S1-07 (timeout drops steps). F-LDR-S1-04/05/06/08 `FIXED`. F-LDR-S1-03 `OPEN`. Tracer unit tests 22/22 on the blocked snapshot. Preview not used as a freeze check (SSO).
- Owner: update statuses in the same PR that fixes the flag. Do not delete flags. Do not self-mark READY.
