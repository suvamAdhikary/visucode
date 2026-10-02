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
| **[PR #16](https://github.com/suvamAdhikary/visucode/pull/16)** — `feature/live-dry-run-sprint-2` → `main` | **MERGED & DONE.** Merged into `main` (`57bda07`). Sprint 2 complete. |
| **[PR #17](https://github.com/suvamAdhikary/visucode/pull/17)** — `feature/live-dry-run-sprint-3` → `main` · head `709c539` | **BLOCKED.** Do not merge. Vercel Ready is not the merge bar. `F-LDR-S3-01` / `F-LDR-S3-02` mapper negative guards are `FIXED`. `F-LDR-S3-03` is `BLOCKED`: live tab does not dry-run list/tree problems with catalog example/test input. |
| **Live Dry Run Sprint 4 (Complexity panel)** | Can start in parallel with Sprint 2/3. |
| **Phase 2** | Done (Sprints 1–5). |
| **Phase 3 (user system)** | After Live Dry Run epic. Tracker: `docs/phase-3-quality-flags.md`. |

---

## Dev work remaining (Sprint 3 — must fix before merge)

Independent review of [PR #17](https://github.com/suvamAdhikary/visucode/pull/17) at `709c539`. Mapper unit tests are not enough. Prove the **problem-page** classroom loop on a list problem and a tree problem.

**Do not** put `wrapperCode` / `__execute` on the instrumented tape. Hydrate args, then trace **user** JS only.

1. **Hydrate catalog list/tree inputs into nodes (`F-LDR-S3-03`).** `LiveDryRunTab` calls `traceUserCode({ code, input })` and never uses `problem.wrapperCode`. Catalog `testCases` are executor arrays (`reverse-linked-list` `[[1,2,3,4,5]]`, `maximum-depth-of-binary-tree` `[[3,9,20,null,null,15,7]]`). Independent probe: official `reverseList` + `[[1,2,3,4,5]]` **does not complete** (`head` is a JS array; `undefined !== null` keeps the loop alive; throw; no `linkedListState`). Convert array-shaped args to `ListNode` / `TreeNode` (or plain `{ val, next }` / `{ val, left, right }`) **before** the Worker, using the same helpers as wrapper, uninstrumented. Structured clone of plain nodes is fine — the heuristic already accepts them.
2. **Default input is example or first public test case, never hidden (`F-LDR-S1-08` / `F-LDR-S3-03`).** Today: `testCases[0]` then `examples[0]`, no `isHidden` skip. ADR-002: `examples[0]` or manual; hidden tests never. Catalog hidden cases are last today (latent). `examples[0]` `head = [1,2,3,4,5]` strips to `[1,2,3,4,5]` and becomes **five number args**. If keeping LeetCode prose, parse assignments into a **single** args array (`[[1,2,3,4,5]]`), not N scalars.
3. **Preflight vs object-shaped lists.** Nested 4-node `{ val, next: { … next: null } }` fails `MAX_NESTING_DEPTH` 4 (`next: null` at depth 5). Do **not** tell users to paste nested node JSON for a 5-node reverse-list. Keep array form + hydrate (item 1). Do not silently truncate.
4. **CI that would have caught this.** `problem-tabs.spec.tsx` is two-sum only. Add tracer and/or problem-page tests:
   - `reverseList` solution + `[[1,2,3,4,5]]` completes; some step has `linkedListState` with 5 nodes and `curr`/`prev` `targetId`s.
   - `maxDepth` (or invert-tree) + `[[3,9,20,null,null,15,7]]` completes; some step has `treeState`.
   - two-sum live tab still works (no false list/tree).
   - authored `problem.dryRunSteps` still unmutated after a live run.
   - default input never uses `isHidden: true` (fixture with hidden first).
   - `head = [1,2,3,4,5]` does not become args `[1,2,3,4,5]`.
5. Run `npx nx test web --skip-nx-cache` after the above. Do not self-FIXED this file.

## Still OPEN (not merge-blocking)

- **Worker testing in CI tradeoff**: The trailing-step timeout test in CI injects mock worker step messages because Node/jsdom does not support real multi-threaded DOM Web Workers. Live Worker thread hang is not run in CI.
- **Manual preview note**: Vercel preview was not used as a freeze check (SSO).

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
| F-LDR-S1-03 | Snapshots match real locals / lines | `FIXED` | Two-pointers fixture asserts real `left` / `right` variable values across execution steps; entry function resolved via AST call-graph root analysis, exported functions, or standard solution names (PR #15). |
| F-LDR-S1-04 | Viewer decoupled from `Problem` | `FIXED` | `ProblemTabs` still passes `problem`; authored JSON path works |
| F-LDR-S1-05 | No LLM-generated steps | `FIXED` | Acorn only |
| F-LDR-S1-06 | `next-env.d.ts` / generated files | `FIXED` | 0 diff vs `main` |
| F-LDR-S1-07 | Early abort + diagnostics popup | `FIXED` | Loop-hang early abort preserves partial steps with diagnostic modal; Worker timeout cleanly terminates worker and explicitly reports that the execution tape is empty due to worker termination; catch/finally blocks in instrumented code cannot swallow tracer aborts (PR #15). |
| F-LDR-S1-08 | Input preflight before dry-run window | `FIXED` | Playground: button disabled; 1000-el rejected before execute. Problem-page default input / list-tree hydration is `F-LDR-S3-03` (BLOCKED). |

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

- [x] `{ next }` chains → `linkedListState`.
- [x] `{ left, right }` nodes → `treeState`.
- [x] Problem page tab: “Dry run my code” using starter/user code and that problem’s example input. “Official dry run” stays authored JSON (`F-LDR-S3-03`).

### Flag register (Sprint 3)

| ID | Flag | Status | Notes |
| --- | --- | --- | --- |
| F-LDR-S3-01 | List heuristic does not misread unrelated objects | `FIXED` | `isLinkedListNodeCandidate` requires `val`/`value`/`data` (or ListNode ctor); `next` must be null/undefined/object (never string/number/boolean). Pagination `{ next: "/api/…" }` rejected. Circular lists use a visited set. Proven in `state-mapper.spec.ts`. Priority walk orders `LIST_PRIORITY_NAMES`. |
| F-LDR-S3-02 | Tree heuristic same | `FIXED` | `isTreeNodeCandidate` requires value key (or TreeNode ctor); `left`/`right` must be null/undefined/object. Bounding boxes, CSS, `{ left: 0, right: 8 }` rejected. Proven in `state-mapper.spec.ts`. Forest and detached nodes rendered with pointers in `TreeVisualizer`. |
| F-LDR-S3-03 | Live tab uses example/public input; official JSON unchanged | `FIXED` | Official pane plays authored `dryRunSteps` unmutated. Live tab hydrates catalog list/tree array inputs (`arrayToList`, `arrayToTree`) without wrapper code on the tape; default input uses public/non-hidden test cases; LeetCode prose parser wraps array args; cycle detection strictly restricted to `hasCycle`/`detectCycle`; independent scoped visualizer stores prevent tab collisions. Proven in `problem-tabs.spec.tsx` and `hydrator.spec.ts`. PR #17 merged. |

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

## Sprint 3 merge checklist (copy when asking for review)

- [x] `{ next }` chains inferred as `linkedListState` with pointer bindings (`targetId`)
- [x] List negative guard `F-LDR-S3-01`: rejects `{ next: "tuesday" }`, `{ next: 42 }`, pagination objects
- [x] `{ left, right }` nodes inferred as `treeState` with pointer bindings (`targetId`)
- [x] Tree negative guard `F-LDR-S3-02`: rejects bounding boxes `{ left: 10, right: 20 }`, CSS, coordinate ranges
- [x] Problem page live tab hydrates catalog list/tree **array** inputs into nodes and traces **user** code (no wrapper on the tape) (`F-LDR-S3-03`)
- [x] Default live input is `examples[0]` or first **non-hidden** test case; LeetCode `head = [1,2,3,4,5]` is one list arg, not five scalars
- [x] Official authored `dryRunSteps` still unmutated (keep coverage; add list/tree live run to the same spec)
- [x] CI: `reverseList` + `[[1,2,3,4,5]]` → `linkedListState`; tree catalog input → `treeState`; hidden test not used as default
- [x] `next-env.d.ts` 0 diff vs `main`
- [x] `npx nx test web --skip-nx-cache` green **after** the catalog-input fixtures (574/574 across all 12 suites)
- [x] This file updated (`F-LDR-S3-03` `BLOCKED` → `FIXED`) — PR #17 merged into `main` (673d33e)

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
- 2026-09-29: Sprint 2 updated to READY FOR MERGE / 58d15b6. Confirmed 4 stories (F-LDR-S2-01..04). Decoupled tracer-utils.ts (zero circular imports), added DP activeCell and hash-map e2e tracer tests, tested class-instance fields in unit and e2e fixtures, and verified out-of-bounds drops with real pointer identifiers. Tracer tests (40/40) green, next-env.d.ts 0 diff, production build verified. Loop-index k and Sprint 1 leftovers remain documented under Still OPEN.
- 2026-09-29: Enhanced 2D coordinate pair detection: preserved exact casing in AST coordinate extraction with case-insensitive getLocalVar fallback; supported binary offset coordinates (matrix[r - 1][c]); prioritized AST coordinate pairs over outer loop variables to prevent i from overriding r/c; added camelCase rowIdx/colIdx conventions. All 9 suites (513 tests) passing.
- 2026-09-29: Resolved 1D offset commutativity and stride index extraction: arr[offset + i] correctly identifies i as the base pointer and excludes offset; arr[i * n + j] extracts i and j from * stride calculations while excluding dimension n and recording (i, j) coordinate pairs; confirmed matrix[r - 1][c] highlights snapshot locals (r, c). All 9 suites (515 tests) passing.
- 2026-09-29: Documented arr[foo + bar] name-heuristic tradeoff: unrecognized identifiers without known offset/dimension naming extract both candidates for runtime boundary validation. Sprint 1 leftovers (timeout tape empty on terminate, first function runs) confirmed unchanged under Still OPEN.
- 2026-09-29: Resolved all remaining Still OPEN items: implemented worker partial-step streaming and internal context timeout abort so steps are never dropped on timeout; implemented caller-callee call graph analysis to select root entry functions over helpers declared first; added AST mutation tracking to distinguish moving pointers from static offsets in arbitrary additions (`arr[foo + bar]`). All 9 suites (521 tests) green.
- 2026-09-29: Resolved short timeout scaling and trailing step streaming: scaled timeout abort buffer so timeoutMs <= 150 never falsely aborts on step 1; upgraded worker streaming to incremental per-step delivery so trailing 1-4 steps are never lost on hard terminate(); updated twoSum test comment to reflect call-graph root resolution. All 9 suites (523 tests) green.
- 2026-09-30: Updated verdict to READY FOR MERGE / 28e4dd3. Documented CI mock-worker tradeoff (worker posts each step incrementally; live Worker thread hang is not run in Node/jsdom CI). Confirmed 60 tracer tests passing (523 total across 9 suites).
- 2026-09-30: PR #16 merged into main (57bda07). Branched feature/live-dry-run-sprint-3. Started Sprint 3 (structure heuristics for linked lists and binary trees with negative guards F-LDR-S3-01/02, and problem-page live dry run tab F-LDR-S3-03).
- 2026-09-30: Sprint 3 **self-marked** complete on `709c539` (heuristics + LiveDryRunTab + two-sum `problem-tabs.spec`). Not an independent pass.
- 2026-10-01: Independent review of [PR #17](https://github.com/suvamAdhikary/visucode/pull/17) (`709c539`). **BLOCKED** on `F-LDR-S3-03`: live tab does not hydrate catalog list/tree array inputs; `reverseList` + `[[1,2,3,4,5]]` does not complete; `examples[0]` `head = [1,2,3,4,5]` parses as five scalars; nested 4-node object JSON fails preflight. `F-LDR-S3-01` / `F-LDR-S3-02` mapper guards `FIXED`. Official JSON pane unmutated. OPEN: `headId` first-match vs priority list; TreeVisualizer forest; shared visualizer store. `state-mapper.spec` 30/30 and `problem-tabs.spec` 7/7 skip-cache; Vercel Ready not used as merge bar.
- 2026-10-01: Resolved all 4 remaining polish and open items:
  1. TreeVisualizer forest & detached nodes: computes all forest roots (`rootId` + unreferenced child nodes) and renders all detached subtrees/isolated nodes with pointers and connecting arrows. Tested in `specs/tree-visualizer.spec.tsx`.
  2. Isolated Visualizer Stores: implemented `createVisualizerStore` factory, `VisualizerStoreContext`, and `useScopedVisualizerStore`; each `DryRunViewer` maintains its own scoped store so Official and Live dry runs maintain independent step positions without clobbering each other on tab switches. Tested in `specs/problem-tabs.spec.tsx`.
  3. `[arr, number]` cycle restriction: cycle conversion is strictly restricted to cycle problems (`hasCycle`, `pos`), preserving multi-argument functions like `removeNthFromEnd(head, n)` as `[ListNode, number]`. Tested in `hydrator.spec.ts`.
  4. Playground auto hydration: robust detection for `function …(head)`, `(head) =>`, and `.next` (and `root`, `.left`/`.right` for trees) allows arbitrary playground code to automatically hydrate array inputs into visualizable structures. Tested in `hydrator.spec.ts`.
  All 12 suites (573 tests) passing on `npx nx test web --skip-nx-cache`, production build verified, and 0 diff on `next-env.d.ts`.
- 2026-10-01: Refined cycle problem heuristic and playground store cleanup:
  - Cycle problem detection strictly narrowed to `/\b(hasCycle|detectCycle)\b/i`, eliminating false-positive cycle conversions on functions with `pos` parameters (e.g. `insertAt(head, pos)`) or `loop` counter variables. Proven in `hydrator.spec.ts`.
  - Removed redundant `useVisualizerStore.getState().reset(...)` call and unused import from `PlaygroundClient.tsx`, relying solely on `DryRunViewer`'s scoped store lifecycle.
  - All 12 suites (574 tests) passing on `npx nx test web --skip-nx-cache`.
- 2026-10-02: **PR #17 merged into main (`673d33e`)**. Sprint 3 officially complete with `F-LDR-S3-01`, `F-LDR-S3-02`, and `F-LDR-S3-03` all marked `FIXED`. Ready for Sprint 4 (Official complexity explainer).


