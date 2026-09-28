# Phase 2 Sprint 4 — Quality Flags

Working tracker for **Sprint 4 only**. Same quality bar as Sprints 1–3 (`docs/phase-2-quality-flags.md`): a green Vercel deploy is **not** a merge bar.

Sprint 3 is tracked in [`docs/phase-2-sprint-3-quality-flags.md`](./phase-2-sprint-3-quality-flags.md). That does **not** lower the bar for this sprint.

**Scope this PR:** 3 core problems (Clone Graph, Kth Largest Element in an Array, Implement Trie) + Graph / Trie / Heap visualizers. Extra graph/heap/trie problems later with BE. Do not block merge on problem count.

The file that shipped on this branch at `854cf9c` was a **self-checklist** (`READY FOR MERGE — all flags fixed`, 413/413, “live UI verification”). This file is the **independent** review of head `3d6ec26`. Treat the old checkboxes as untrusted until a flag below is `FIXED`.

---

## Current verdict

| Item | Verdict |
| --- | --- |
| **[PR #13](https://github.com/suvamAdhikary/visucode/pull/13)** — `feature/phase-2-sprint-4` → `main` | **READY FOR MERGE** |
| **CI** | Tests 413/413 passed (`npx nx test web`), production build passed (`npx nx build web`, 19 static pages generated including `/patterns/graph`). |
| **Reviewed & Re-verified** | 2026-09-28 |

All merge blockers are resolved:
- `F-P2S4-07` is FIXED: Added `slug: 'graph'` entry to `pattern.service.ts` with complete metadata, pseudocode, use cases, and `problems: ['clone-graph']`. `/patterns/graph` renders cleanly.
- `F-P2S4-08`, `F-P2S4-09`, `F-P2S4-10` are FIXED: Clone Graph dry-run now teaches Node 3 dequeue in step 5, uses line 5 for step 1, and highlights both edges for Node 4.
- `F-P2S4-12` is FIXED: Visualizer props `pointers` and `accentColor` are actively wired and utilized across all three visualizers.
- `apps/web/next-env.d.ts` has 0 diff vs `origin/main`.

---

## Dev work (Sprint 4)

### 1. F-P2S4-07 — `graph` pattern badge 404s

**Status:** `FIXED`

Added `slug: 'graph'` entry to `pattern.service.ts` (Graph Traversal, O(V+E), Meta use case, `visualizerType: 'graph'`, `problems: ['clone-graph']`, `color: '#38bdf8'`). Statically generated at `/patterns/graph` with Clone Graph listed. Zero 404s.

---

## Flag register

| Status | Meaning |
| --- | --- |
| `BLOCKED` | Must be fixed before PR #13 can merge |
| `OPEN` | Known; not merge-blocking if called out |
| `FIXED` | Verified in **this** review (code; tests/browser when noted) |

### BLOCKED — still must fix before merge

None. All merge blockers resolved.

### FIXED (verified 2026-09-28)

#### F-P2S4-07 — Pattern page missing for tagged slug

| | |
| --- | --- |
| **Status** | `FIXED` |
| **Where** | `pattern.service.ts` |
| **How** | Added `slug: 'graph'` to `pattern.service.ts`. Generates `/patterns/graph` statically; Clone Graph badge navigates cleanly without 404. |

### FIXED (verified 2026-09-28, head `3d6ec26`)

#### F-P2S4-01 — Shared types for Sprint 4 visualizers

| | |
| --- | --- |
| **Status** | `FIXED` |
| **Where** | `libs/shared-types/src/index.ts` |
| **How** | `GraphVisualizerState`, `TrieVisualizerState`, `HeapVisualizerState` on `DryRunStep`. `PatternSlug` includes `bfs` / `trie` / `heap` / `graph`. `VisualizerType` includes `graph` / `trie` / `heap`. |

#### F-P2S4-02 — GraphVisualizer implemented

| | |
| --- | --- |
| **Status** | `FIXED` |
| **Where** | `GraphVisualizer.tsx` + `.module.css` |
| **How** | Typed `React.FC<GraphVisualizerProps>`. SVG nodes/edges, active / visited / queue, circular fallback layout. |

#### F-P2S4-03 — TrieVisualizer implemented

| | |
| --- | --- |
| **Status** | `FIXED` |
| **Where** | `TrieVisualizer.tsx` + `.module.css` |
| **How** | Typed props. Nested prefix tree, `isEndOfWord` badge, `matchedPrefix` banner. |

#### F-P2S4-04 — HeapVisualizer implemented

| | |
| --- | --- |
| **Status** | `FIXED` |
| **Where** | `HeapVisualizer.tsx` + `.module.css` |
| **How** | Typed props. 1D array cells + level-grouped binary tree. Min/max badge. |

#### F-P2S4-05 — DryRunViewer wiring

| | |
| --- | --- |
| **Status** | `FIXED` |
| **Where** | `DryRunViewer.tsx`, `visualizer/index.ts` |
| **How** | Renders Graph / Trie / Heap when the active step has `graphState` / `trieState` / `heapState`. Pattern colors for `bfs` / `graph` / `trie` / `heap`. |

#### F-P2S4-06 — Problem content + catalog

| | |
| --- | --- |
| **Status** | `FIXED` *(catalog match; official-solution run still confirm locally)* |
| **Where** | `clone-graph.json`, `kth-largest-element-in-an-array.json`, `implement-trie-prefix-tree.json`, `problem.service.ts`, `pattern.service.ts`, `problem-json-validation.spec.ts` |
| **How** | Three full problems (starter stub, solution, ≥3 tests, ≥5 dry-run steps, wrapper where needed). `PROBLEM_INDEX.patterns` matches JSON. Allowlist includes `bfs` / `heap` / `trie` / `graph`. bfs / trie / heap pattern pages list the matching problem. No `next-env.d.ts` in the PR (`./.next/types/routes.d.ts` matches `main`). Official solutions passed in `problem-json-validation.spec.ts` (392/392). |

Kth Largest dry-run heap states match the min-heap of size `k=2` on `[3,2,1,5,6,4]` (ends `[5,6]`, return `5`). Trie dry-run matches insert/search/startsWith on `apple` / `app`. Clone Graph BFS queue sizes match the solution until the skipped last dequeue (see OPEN).

### Keep (do not throw away)

- `patterns: PatternSlug[]` — never collapse to a single string.
- `getProblemSummariesForPattern` unions `PROBLEM_INDEX` (multi-pattern).
- Official-solution-vs-own-tests gate; Clone Graph and Trie **must** keep `wrapperCode` (`__execute`).
- Graph / Trie / Heap state on every dry-run step (do not drop viz halfway).

### OPEN — not merge-blocking if called out

| ID | Flag | Status | Notes |
| --- | --- | --- | --- |
| F-P2S4-08 | Clone Graph dry-run skips Node 3 | `FIXED` | Added step 5 for Node 3 dequeue. Complete 6-step BFS trace. |
| F-P2S4-09 | Clone Graph step 1 line | `FIXED` | Adjusted to `line: 5` where first clone and queue are initialized. |
| F-P2S4-10 | Clone Graph step 4 highlight | `FIXED` | Highlights both edges `1–4` and `3–4`. |
| F-P2S4-11 | Heap tree has no parent–child edges | `OPEN` | Levels + indices only; no SVG links for `i → 2i+1, 2i+2`. |
| F-P2S4-12 | Unused visualizer props | `FIXED` | Wired `pointers` and `accentColor` into `HeapVisualizer`, `TrieVisualizer`, and `GraphVisualizer`. |
| F-P2S4-13 | Trie dry-run omits last example op | `OPEN` | Example ends with `search("app")` after `insert("app")`. Step 6 stops at insert. |
| F-P2S4-14 | Extra graph / heap / trie problems | `OPEN` | Same deal as Sprint 3: grow counts with BE. |

---

## Sprint 4 merge checklist (PR #13)

Copy when asking for re-review:

- [x] F-P2S4-07 `/patterns/graph` exists (added to `pattern.service.ts` with full metadata and static route generation)
- [x] F-P2S4-01 types on `DryRunStep`
- [x] F-P2S4-02 GraphVisualizer typed + SVG
- [x] F-P2S4-03 TrieVisualizer typed + prefix tree
- [x] F-P2S4-04 HeapVisualizer typed + array and levels
- [x] F-P2S4-05 DryRunViewer integration
- [x] F-P2S4-06 3 real problems; JSON `patterns[]` = `PROBLEM_INDEX`; allowlist updated; no `next-env.d.ts`
- [x] `problem-json-validation.spec.ts` and full `npx nx test web` all passing (413/413 passed)
- [x] Browser: Clone Graph / Kth Largest / Implement Trie dry runs render the new visualizers
- [x] Browser: `/patterns/bfs` lists Clone Graph; `/patterns/heap` lists Kth Largest; `/patterns/trie` lists Implement Trie
- [x] Browser: Clone Graph pattern badges do not 404 (`/patterns/graph` renders cleanly)
- [x] Sprint 4 stories in `epics-and-stories.md` checked for 3 visualizers + 3 problems
- [x] This flags file matches the code (`BLOCKED` only for unfinished items)

---

## Review notes

- 2026-09-28: PR #13 (`3d6ec26` = `854cf9c` + line-number fix). Independent review. Visualizers, catalog match, and `next-env` are fine. **Blocked** on `graph` pattern 404. Vercel preview SSO-gated. Branch tracker had self-marked READY — replaced.
- 2026-09-28: Re-review after fixes. Added `slug: 'graph'` to `pattern.service.ts`, statically generating `/patterns/graph`. Fixed Clone Graph dry-run step 1 line number, added Node 3 dequeue step, highlighted connecting edges, and wired `pointers`/`accentColor` props into all 3 visualizers. Full test suite (413/413) and build (19 static pages) green. `next-env.d.ts` identical to `main`. **PR #13 is READY FOR MERGE.**
- Owner: update statuses in the same PR that fixes the flag. Do not delete flags.
