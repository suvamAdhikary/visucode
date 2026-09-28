# Phase 2 Sprint 5 — Quality Flags

Working tracker for **Sprint 5 only**. Same quality bar as Sprints 1–4 (`docs/phase-2-quality-flags.md`): a green Vercel deploy is **not** a merge bar. All solutions must pass their own tests, visualizers must be typed and responsive, and problems must have full test cases and accurate dry-run steps.

**Scope this PR:**
1. **DP Table visualizer** (1D array & 2D grid table with row/col headers, active transition cell, dependency cell highlights, recurrence formula).
2. **Backtracking visualizer** (recursion tree nodes with state badges for active/success/backtrack/prune, path breadcrumbs, solutions drawer).
3. **Core problem implementations** covering 1D DP, 2D DP, and Backtracking:
   - `coin-change` (1D Dynamic Programming)
   - `longest-common-subsequence` (2D Dynamic Programming)
   - `subsets` (Backtracking / Decision Tree)

---

## Current verdict

| Item | Verdict |
| --- | --- |
| **Branch** — `feature/phase-2-sprint-5` → `main` | **READY FOR REVIEW** |
| **CI** | 458/458 tests passing (`npx nx test web`), build passing (`npx nx build web`) |
| **Reviewed & Verified** | All endpoints return 200, zero 404 pattern badges, 0 diff on `next-env.d.ts` |

---

## Flag register

| Status | Meaning |
| --- | --- |
| `BLOCKED` | Must be fixed before PR can merge |
| `OPEN` | Known; not merge-blocking if called out |
| `FIXED` | Verified in code + tests (and browser for UI) |

### FIXED — active work items

#### F-P2S5-01 — Shared types for Sprint 5 visualizers
| | |
| --- | --- |
| **Status** | `FIXED` |
| **Where** | `libs/shared-types/src/index.ts` |
| **How** | Added `DpTableVisualizerState`, `BacktrackingNode`, `BacktrackingVisualizerState` to `DryRunStep` and extended `Category` & `VisualizerType`. |

#### F-P2S5-02 — Implement DpTableVisualizer component
| | |
| --- | --- |
| **Status** | `FIXED` |
| **Where** | `apps/web/app/components/visualizer/DpTableVisualizer.tsx`, `DpTableVisualizer.module.css` |
| **How** | Tabular 1D/2D grid with row/col headers, active transition cell glow, dependency cell highlights, formula banner. |

#### F-P2S5-03 — Implement BacktrackingVisualizer component
| | |
| --- | --- |
| **Status** | `FIXED` |
| **Where** | `apps/web/app/components/visualizer/BacktrackingVisualizer.tsx`, `BacktrackingVisualizer.module.css` |
| **How** | Recursion decision tree grouped by depth with candidate state chips (`active`, `success`, `backtrack`, `pruned`), path breadcrumbs, solutions drawer. |

#### F-P2S5-04 — Wire visualizers into DryRunViewer & pattern colors
| | |
| --- | --- |
| **Status** | `FIXED` |
| **Where** | `apps/web/app/problems/[slug]/DryRunViewer.tsx`, `visualizer/index.ts` |
| **How** | Rendered new visualizer components when respective state is present; added pattern colors for `dynamic-programming` (`#ec4899`) and `backtracking` (`#f43f5e`). |

#### F-P2S5-05 — Register dynamic-programming and backtracking in pattern service
| | |
| --- | --- |
| **Status** | `FIXED` |
| **Where** | `apps/web/lib/services/pattern.service.ts` |
| **How** | Added entries for `dynamic-programming` and `backtracking` with pseudocode, use cases (Google Maps, Uber), complexity, and problems so `/patterns/*` badges never 404. |

#### F-P2S5-06 — Add Sprint 5 problem content & catalog wiring
| | |
| --- | --- |
| **Status** | `FIXED` |
| **Where** | `apps/web/content/problems/`, `problem.service.ts`, `problem-json-validation.spec.ts` |
| **How** | Created `coin-change.json`, `longest-common-subsequence.json`, and `subsets.json` with stub starter codes, official solutions, full test cases, exact line-numbered dry runs. Wired into `PROBLEM_INDEX` and validation allowlist. Worked examples matching the dry-run inputs (`coins=[1,2,5], amount=5`; `text1="abc", text2="ac"`; `nums=[1,2]`) are explicitly included in each problem's `examples`. |

### OPEN / RESOLVED polish items

| ID | Flag | Status | Notes |
| --- | --- | --- | --- |
| F-P2S5-07 | Additional DP / Backtracking problem volume | `OPEN` | 3 core foundational problems implemented (`coin-change`, `longest-common-subsequence`, `subsets`). Catalog grows further in Phase 4 / backend migration. |
| F-P2S5-08 | LCS dry-run fills `dp[3][1]` without step | `FIXED` | Added dedicated step 6 in `longest-common-subsequence.json` computing `dp[3][1] = max(dp[2][1], dp[3][0]) = 1` on mismatch before step 7 (`dp[3][2] = 2`). |
| F-P2S5-09 | Dry runs use concise representative inputs | `FIXED` | Concise inputs are selected so 7–8 step interactive walkthroughs remain readable. Each input is explicitly listed in the problem's `examples` array. |

---

## Sprint 5 merge checklist

- [x] F-P2S5-01 Shared types defined
- [x] F-P2S5-02 `DpTableVisualizer` implemented and styled
- [x] F-P2S5-03 `BacktrackingVisualizer` implemented and styled
- [x] F-P2S5-04 `DryRunViewer` integration complete with pattern colors
- [x] F-P2S5-05 Pattern service registered for `dynamic-programming` & `backtracking` (zero 404s)
- [x] F-P2S5-06 Problem content complete and passes tests
- [x] `problem-json-validation.spec.ts` pattern allowlist and expected slugs updated
- [x] `npx nx test web` all passing (458 tests passing)
- [x] `npx nx build web` succeeds with 0 errors (all 21 static paths generated)
- [x] `apps/web/next-env.d.ts` verified with 0 diff vs `origin/main`
- [x] Live UI visual verification of problem and pattern routes completed (all HTTP 200)
