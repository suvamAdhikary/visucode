# ADR-002: Live Dry Run Tracer

## Status
Accepted

## Date
2026-09-28

## Context

Problem dry runs are pre-authored `dryRunSteps` in JSON. `DryRunViewer` plays that tape. It never looks at the user’s editor.

The playground is Run + console: `new Function(code)` on the UI thread. That is not a dry run, and it is the same freeze class already banned in the test runner (`F-P2S1-06`).

The product loop we actually want is the classroom one: write a solution, write a small input, walk **that** code line by line, watch arrays and objects change, debug the logic. Authored JSON cannot do that for arbitrary user code. LLM-generated `DryRunStep` JSON would look like a dry run and lie.

## Decision

1. **Two dry runs, one viewer.** Authored JSON stays the taught “Official dry run” on problem pages. Live dry run is “Dry run my code” (playground + a second problem-page tab). Both feed the same `DryRunStep` shape and `DryRunViewer`. Decouple the viewer from `Problem` so it accepts `{ code, dryRunSteps }`.

2. **JavaScript AST instrumentation, not an interpreter and not an LLM.** Parse user JS (Acorn). Insert `__vc.step(line, locals)` after statements. Execute the instrumented source in a **Worker**. Map each snapshot onto existing `DryRunStep` fields (`line`, `variables`, optional visualizer state). Explanations are factual (`left = 3`), not textbook narration.

3. **Tracer follows the runtime.** v1 is JavaScript only — whatever the editor can actually run. Python / Java / C++ / freehand sudo wait until a runtime exists. A later pseudocode subset is allowed only if it compiles to the same IR. Do not generate steps from a model.

4. **Fail closed, then tell the user why.** Worker timeout, a hard **step cap (500)**, and a **recursion-depth cap**. Also stop **early** when the same line + same locals repeat (stuck loop) — do not wait for the timeout. Never `new Function` on the UI thread. Keep the steps collected so far so the learner can still scrub up to the hang.

   After any abort or thrown error, show a **diagnostics popup**: a list of observed issues (kind, line, what happened, what to check). Issues come from the trace (repeat state, cap hit, stack too deep, exception). Do not invent a full code review. Do not use an LLM for this list.

5. **Input preflight before the dry-run window.** Dry run is pen-and-paper scale. Do **not** start the tracer or open the stepper until the chosen input passes size limits. Source of input: that problem’s default example (`examples[0]`), or a user-typed manual input. Playground is always manual (templates must already be small). Hidden tests are never a dry-run input.

   Reject **before** navigation/Worker if the input is missing, not parseable, or over limit. Show what failed (e.g. “array length 1000; dry-run max is 16”). Do not silently truncate. Hard limits (v1): 1D length ≤ 16; 2D cells ≤ 8×8; string length ≤ 32; object/map keys ≤ 16; nesting depth ≤ 4; payload ≤ 2KB.

6. **Visuals from the snapshot, not a human script.** Map shapes we can detect:
   - 1D arrays → `arrayState`; numeric locals `i` / `j` / `left` / `right` / `lo` / `hi` / `mid` that are valid indices → `pointers`
   - 2D arrays → `dpTableState` (grid)
   - plain objects / `Map` / class instances (fields) → `hashMapState` or a small object inspector
   - `{ next }` chains → `linkedListState`
   - `{ left, right }` nodes → `treeState`
   Recursion is call stack + locals. Do not auto-build backtracking trees or invent graph/trie/heap diagrams without a shape convention. Do **not** treat live-trace step count as Big-O; official time/space lives in authored solution JSON (Sprint 4 complexity panel).

7. **Build this before Auth.js.** Live dry run does not need a user table. Keep Phase 3 flag IDs (`F-P3S*`) as user-system; this epic cuts ahead of identity.

## Consequences

- Playground becomes editor | input | stepper, not a console demo.
- Oversized / invalid input never reaches the tracer. Preflight tests: example input accepted; 1000-element array rejected **before** Worker start; hidden tests not used.
- Buggy code must abort into a diagnostics list + partial trace, never a frozen tab. Tests: `while (true)`, unbounded recursion, and a thrown TypeError.
- Tests must prove the tracer matches real execution (e.g. two-pointers on `[1,3,5,7,9], 12` yields the real `left` / `right` values). A green Vercel deploy is not a pass.
- Authored JSON remains the quality bar for **official** solutions. Live traces will look more like Python Tutor than a hand-tuned lesson.
- Extracting a real sandbox (Firecracker / E2B) is still a later ADR. This tracer stays in the Next.js Worker, same monolith as ADR-001.
