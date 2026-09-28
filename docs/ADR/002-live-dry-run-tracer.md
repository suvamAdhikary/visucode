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

4. **Fail closed.** Worker timeout **and** a hard step cap (500). Never `new Function` on the UI thread in playground or tracer. `while (true)` and exponential recursion must not freeze the tab or blow memory.

5. **Visuals from the snapshot, not a human script.** Map shapes we can detect:
   - 1D arrays → `arrayState`; numeric locals `i` / `j` / `left` / `right` / `lo` / `hi` / `mid` that are valid indices → `pointers`
   - 2D arrays → `dpTableState` (grid)
   - plain objects / `Map` / class instances (fields) → `hashMapState` or a small object inspector
   - `{ next }` chains → `linkedListState`
   - `{ left, right }` nodes → `treeState`
   Recursion is call stack + locals. Do not auto-build backtracking trees or invent graph/trie/heap diagrams without a shape convention.

6. **Build this before Auth.js.** Live dry run does not need a user table. Keep Phase 3 flag IDs (`F-P3S*`) as user-system; this epic cuts ahead of identity.

## Consequences

- Playground becomes editor | input | stepper, not a console demo.
- Tests must prove the tracer matches real execution (e.g. two-pointers on `[1,3,5,7,9], 12` yields the real `left` / `right` values). A green Vercel deploy is not a pass.
- Authored JSON remains the quality bar for **official** solutions. Live traces will look more like Python Tutor than a hand-tuned lesson.
- Extracting a real sandbox (Firecracker / E2B) is still a later ADR. This tracer stays in the Next.js Worker, same monolith as ADR-001.
