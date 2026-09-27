# Phase 2 Sprint 4 — Quality Flags

Working tracker for **Sprint 4 only**. Same quality bar as Sprints 1–3: a green Vercel deploy is **not** a merge bar. All solutions must pass their own tests, visualizers must be typed and responsive, and problems must have full test cases and accurate dry-run steps.

**Scope this PR:**
1. **Graph visualizer** (SVG node/edge layout, active/visited/queue states).
2. **Trie visualizer** (hierarchical prefix tree, end-of-word markers, path match).
3. **Heap visualizer** (dual view: 1D array indexing + complete binary tree).
4. **Core problem implementations** covering Graph/BFS, Heap, and Trie (Clone Graph, Kth Largest Element in an Array, Implement Trie).

---

## Current verdict

| Item | Verdict |
| --- | --- |
| **Branch** — `feature/phase-2-sprint-4` → `main` | **READY FOR MERGE — all flags fixed** |
| **CI** | Tests 413/413 passed (`npx nx test web`), build passed (`npx nx build web`) |
| **Reviewed & Verified** | 2026-09-28 |

---

## Flag register

| Status | Meaning |
| --- | --- |
| `BLOCKED` | Must be fixed before PR can merge |
| `OPEN` | Known; not merge-blocking if called out |
| `FIXED` | Verified in code + tests (and browser for UI) |

### BLOCKED — active work items

None. All merge blockers resolved.

### FIXED (verified in code & tests)

#### F-P2S4-01 — Shared types for Sprint 4 visualizers
| | |
| --- | --- |
| **Status** | `FIXED` |
| **Where** | `libs/shared-types/src/index.ts` |
| **How** | Added `GraphVisualizerState`, `TrieVisualizerState`, `HeapVisualizerState` to `DryRunStep` and extended `PatternSlug` & `VisualizerType`. |

#### F-P2S4-02 — Implement GraphVisualizer component
| | |
| --- | --- |
| **Status** | `FIXED` |
| **Where** | `apps/web/app/components/visualizer/GraphVisualizer.tsx` |
| **How** | SVG rendering of nodes & edges with active, visited, and queue/frontier styling. Fully typed props. |

#### F-P2S4-03 — Implement TrieVisualizer component
| | |
| --- | --- |
| **Status** | `FIXED` |
| **Where** | `apps/web/app/components/visualizer/TrieVisualizer.tsx` |
| **How** | Prefix tree node hierarchy with char labels, `isEndOfWord` badges, active prefix highlight. |

#### F-P2S4-04 — Implement HeapVisualizer component
| | |
| --- | --- |
| **Status** | `FIXED` |
| **Where** | `apps/web/app/components/visualizer/HeapVisualizer.tsx` |
| **How** | Dual array-and-tree view with parent/child indices and min/max heap comparison indicators. |

#### F-P2S4-05 — Wire visualizers into DryRunViewer & pattern colors
| | |
| --- | --- |
| **Status** | `FIXED` |
| **Where** | `apps/web/app/problems/[slug]/DryRunViewer.tsx` |
| **How** | Render new visualizer components when respective state is present on active step; added pattern colors. |

#### F-P2S4-06 — Add Sprint 4 problem content & catalog wiring
| | |
| --- | --- |
| **Status** | `FIXED` |
| **Where** | `apps/web/content/problems/`, `problem.service.ts`, `pattern.service.ts` |
| **How** | Created `clone-graph.json`, `kth-largest-element-in-an-array.json`, and `implement-trie-prefix-tree.json`. Wired into `PROBLEM_INDEX` and pattern service. |

---

## Sprint 4 merge checklist

- [x] F-P2S4-01 Shared types defined
- [x] F-P2S4-02 `GraphVisualizer` implemented and styled
- [x] F-P2S4-03 `TrieVisualizer` implemented and styled
- [x] F-P2S4-04 `HeapVisualizer` implemented and styled
- [x] F-P2S4-05 `DryRunViewer` integration complete
- [x] F-P2S4-06 Problem content complete and passes tests
- [x] `problem-json-validation.spec.ts` pattern allowlist updated
- [x] `npx nx test web` all passing (413/413)
- [x] `npx nx build web` succeeds with 0 errors
- [x] Live UI verification of new visualizers and pattern pages
