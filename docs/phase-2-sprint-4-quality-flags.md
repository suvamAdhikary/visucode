# Phase 2 Sprint 4 — Quality Flags

Working tracker for **Sprint 4 only**. Same quality bar as Sprints 1–3 (`docs/phase-2-quality-flags.md`): a green Vercel deploy is **not** a merge bar.

Sprint 3 is tracked in [`docs/phase-2-sprint-3-quality-flags.md`](./phase-2-sprint-3-quality-flags.md). That does **not** lower the bar for this sprint.

**Scope this PR:** 3 core problems (Clone Graph, Kth Largest Element in an Array, Implement Trie) + Graph / Trie / Heap visualizers. Extra graph/heap/trie problems later with BE. Do not block merge on problem count.

The file that shipped on this branch at `854cf9c` was a **self-checklist** (`READY FOR MERGE — all flags fixed`, 413/413, “live UI verification”). This file is the **independent** review of head `3d6ec26`. Treat the old checkboxes as untrusted until a flag below is `FIXED`.

---

## Current verdict

| Item | Verdict |
| --- | --- |
| **[PR #13](https://github.com/suvamAdhikary/visucode/pull/13)** — `feature/phase-2-sprint-4` → `main` · head `3d6ec26` | **BLOCKED** |
| **CI** | Vercel preview Ready — **not a product pass**. Independent: `problem-json-validation.spec.ts` **392/392 passed** (includes official solutions for every JSON, including the 3 new problems). Full `npx nx test web` not re-run. |
| **Reviewed** | 2026-09-28 (`3d6ec26`) |

`3d6ec26` is a real Sprint 4: typed Graph / Trie / Heap visualizers, DryRunViewer wiring, 3 full problem JSONs, catalog + allowlist, `next-env.d.ts` not in the diff. Merge is still blocked: Clone Graph is tagged `graph`, and that badge 404s.

Preview URL is SSO-gated (same as earlier sprints). Do not treat “Vercel Ready” as UI verification.

---

## Dev work (Sprint 4)

### 1. F-P2S4-07 — `graph` pattern badge 404s **BLOCKED**

Clone Graph JSON and `PROBLEM_INDEX` both have `patterns: ['bfs', 'graph']`. The problem page renders each pattern as a link to `/patterns/${p}` (`apps/web/app/problems/[slug]/page.tsx`). `listPatterns()` has **bfs / trie / heap**, not **graph**. `getPattern('graph')` is `null` → `notFound()`.

**Do one of:**

- Add a `slug: 'graph'` entry to `pattern.service.ts` (name, color, `visualizerType: 'graph'`, `problems: ['clone-graph']`), **or**
- Drop `'graph'` from Clone Graph JSON **and** `PROBLEM_INDEX` (keep `bfs` only) if Graph is not a pattern page this sprint.

Do not leave a clickable `graph` badge on a page this PR ships.

---

## Flag register

| Status | Meaning |
| --- | --- |
| `BLOCKED` | Must be fixed before PR #13 can merge |
| `OPEN` | Known; not merge-blocking if called out |
| `FIXED` | Verified in **this** review (code; tests/browser when noted) |

### BLOCKED — still must fix before merge

#### F-P2S4-07 — Pattern page missing for tagged slug

| | |
| --- | --- |
| **Status** | `BLOCKED` |
| **Where** | `clone-graph.json`, `problem.service.ts`, `pattern.service.ts`, `app/problems/[slug]/page.tsx` |
| **Why** | Multi-pattern arrays are correct; the Graph **page** was never added. `/patterns/bfs` works. `/patterns/graph` 404s. Catalog filter `?pattern=graph` still lists Clone Graph via `PROBLEM_INDEX`. |

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
| F-P2S4-08 | Clone Graph dry-run skips Node 3 | `OPEN` | After step 4 queue is `[Node(3)]`. Step 5 jumps to empty queue + return. Teach the last dequeue or leave as a known skip. |
| F-P2S4-09 | Clone Graph step 1 line | `OPEN` | `line: 3` is `const clones = new Map()`. Queue + first clone are lines 4–5. |
| F-P2S4-10 | Clone Graph step 4 highlight | `OPEN` | Node 4 neighbors are 1 and 3; only edge `3–4` is highlighted. |
| F-P2S4-11 | Heap tree has no parent–child edges | `OPEN` | Levels + indices only; no SVG links for `i → 2i+1, 2i+2`. |
| F-P2S4-12 | Unused visualizer props | `OPEN` | `pointers` unused on all three. `accentColor` unused on Heap and Trie (Graph uses it for arrowheads). |
| F-P2S4-13 | Trie dry-run omits last example op | `OPEN` | Example ends with `search("app")` after `insert("app")`. Step 6 stops at insert. |
| F-P2S4-14 | Extra graph / heap / trie problems | `OPEN` | Same deal as Sprint 3: grow counts with BE. |

---

## Sprint 4 merge checklist (PR #13)

Copy when asking for re-review:

- [ ] F-P2S4-07 `/patterns/graph` exists **or** Clone Graph is not tagged `graph`
- [x] F-P2S4-01 types on `DryRunStep`
- [x] F-P2S4-02 GraphVisualizer typed + SVG
- [x] F-P2S4-03 TrieVisualizer typed + prefix tree
- [x] F-P2S4-04 HeapVisualizer typed + array and levels
- [x] F-P2S4-05 DryRunViewer integration
- [x] F-P2S4-06 3 real problems; JSON `patterns[]` = `PROBLEM_INDEX`; allowlist updated; no `next-env.d.ts`
- [x] `problem-json-validation.spec.ts` 392/392 (official solutions included); full `npx nx test web` not re-run this review
- [ ] Browser: Clone Graph / Kth Largest / Implement Trie dry runs render the new visualizers
- [ ] Browser: `/patterns/bfs` lists Clone Graph; `/patterns/heap` lists Kth Largest; `/patterns/trie` lists Implement Trie
- [ ] Browser: Clone Graph pattern badges do not 404
- [x] Sprint 4 stories in `epics-and-stories.md` checked for 3 visualizers + 3 problems
- [ ] This flags file matches the code (`BLOCKED` only for unfinished items)

---

## Review notes

- 2026-09-28: PR #13 (`3d6ec26` = `854cf9c` + line-number fix). Independent review. Visualizers, catalog match, and `next-env` are fine. **Blocked** on `graph` pattern 404. Vercel preview SSO-gated. Branch tracker had self-marked READY — replaced.
- Owner: update statuses in the same PR that fixes the flag. Do not delete flags.
