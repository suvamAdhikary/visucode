# Phase 2 — Quality Flags

Living tracker for **every Phase 2 sprint**. A green build, a green Vercel deploy, or “it runs locally” is **not** a merge bar. If the product can mark a correct answer wrong, freeze the tab, leak hidden tests, or teach a dry run that does not match the code, **the PR stays closed**.

---

## Quality bar (non-negotiable)

Merge a Phase 2 PR only when **all** of these are true:

1. **Judging is correct.** Official solutions pass their own tests. Alternate valid answers (order, multiple peaks, etc.) are not failed.
2. **Dry runs match the solution code.** Every number, pointer move, and explanation agrees with the posted solution.
3. **Hidden tests stay hidden.** No input, expected value, or error string leaks in the UI.
4. **User code cannot hang the app.** Infinite loops / long runs are timed out or isolated. Do not ship a runner that can freeze the tab with no recovery.
5. **Generated / local-only files are not in the PR.** No `next-env.d.ts` churn, no personal `file:///` paths, no scratch plans on `main`.
6. **Automated checks prove the above**, not just `nx build web`.

If any item fails: **do not merge.** Fix on the feature branch, update this file, then re-review.

| Status | Meaning |
| --- | --- |
| `BLOCKED` | Must be fixed before that PR / sprint can merge |
| `OPEN` | Known issue; fix before or immediately after merge only if explicitly waived |
| `FIXED` | Verified in code + tests (or browser, for UI) |
| `WONTFIX` | Written decision with owner + reason |

---

## Current verdict

| Item | Verdict |
| --- | --- |
| **[PR #8](https://github.com/suvamAdhikary/visucode/pull/8)** — `feat: complete Phase 2 Sprint 1 - code test runner and 9 new problems` | **DO NOT MERGE** |
| Reason | Product is buggy. Vercel Ready only means the app *built and deployed*. The test runner can fail correct solutions. Dry-run traces disagree with the code they teach. Hidden-test errors leak. User code can freeze the tab. |
| Required to reopen merge | All Sprint 1 `BLOCKED` flags below marked `FIXED`, plus a re-review of the judging path. |

Do not merge this PR “because it is running.” A DSA product that fails a valid 3Sum or Find Peak submission is worse than not shipping the runner yet.

---

## How to use this file

1. Every Phase 2 sprint / PR gets a section.
2. New issues go in as flags (`F-P2S{sprint}-{n}`).
3. When you fix one: set status `FIXED`, PR number, and a one-line “how.”
4. Do not delete flags. Strike through the title only if the work was dropped, and set `WONTFIX`.

---

## Sprint 1 — Code test runner + 9 problems

| | |
| --- | --- |
| **PR** | [#8](https://github.com/suvamAdhikary/visucode/pull/8) · `feature/phase-2-sprint-1` → `main` |
| **Commit reviewed** | `4f67d79` (23 files, +2570 / −7) |
| **Reviewed** | 2026-09-16 |
| **CI** | Vercel preview Ready — **not a product pass** |
| **Sprint status** | `BLOCKED` |

Scope that landed (keep; do not throw away the feature):

- Client-side Run Tests on problem pages (`CodeSubmit`, `TestRunner`, `test-executor`)
- Tabbed right panel: Visualizer \| Your Code
- 9 new problems + pattern / `PROBLEM_INDEX` slug updates
- JSON shape tests + executor unit tests

The original 6 problems already had `testCases`. That plan item was already done on `main`.

### BLOCKED — must fix before merge

#### F-P2S1-01 — Strict JSON compare fails valid answers

| | |
| --- | --- |
| **Status** | `BLOCKED` |
| **Where** | `apps/web/lib/utils/test-executor.ts` → `normalizeOutput` |

`JSON.parse` → `JSON.stringify` → `===` is not a judge.

- **3Sum:** LeetCode accepts any triplet order. `[[-1,0,1],[-1,-1,2]]` is correct and fails against `[[-1,-1,2],[-1,0,1]]`. Unsorted inner triplets (`[-1,2,-1]`) also fail.
- **Find Peak Element, test 2:** prompt says index **1 or 5** is valid; expected is hardcoded `"5"`. A first-peak solution returning `1` is marked wrong.

**Fix:** semantic compare (order-insensitive list-of-lists; any-of expected for multi-answer cases), or only author cases with a unique valid output. Cover both in tests.

#### F-P2S1-02 — Official solutions never run against their own tests

| | |
| --- | --- |
| **Status** | `BLOCKED` |
| **Where** | `apps/web/lib/utils/__tests__/test-executor.spec.ts`, `problem-json-validation.spec.ts` |

Executor tests use inlined snippets. There is no “`solutions[0].code` passes this problem’s `testCases`” loop. That test would have caught F-P2S1-01.

**Fix:** for every problem JSON, execute the posted JavaScript solution against that file’s `testCases` and assert `totalFailed === 0`. Keep this as a required gate for every new problem.

#### F-P2S1-03 — Koko dry run numbers contradict themselves

| | |
| --- | --- |
| **Status** | `BLOCKED` |
| **Where** | `apps/web/content/problems/koko-eating-bananas.json` |

Input `[3,6,7,11]`, `h = 8`:

- Step 4: variables `hours=9`, explanation `1+2+3+4 = 10` (real value is **10**)
- Step 6: variables `hours=7`, explanation `1+2+2+3 = 8` (real value is **8**)

**Fix:** make variables and explanation match the actual `ceil` math. Re-walk the dry run against the solution.

#### F-P2S1-04 — Character Replacement dry run does not match the solution

| | |
| --- | --- |
| **Status** | `BLOCKED` |
| **Where** | `apps/web/content/problems/longest-repeating-character-replacement.json` |

The solution **never decreases `maxFreq` on shrink**. After adding `'B'` at index 4, one shrink makes the window valid. The dry run shrinks twice using live frequencies.

**Fix:** rewrite the dry run to follow the posted code (including the stale-`maxFreq` optimization), or change the solution to match the trace. They must agree.

#### F-P2S1-05 — Hidden tests leak via `error`

| | |
| --- | --- |
| **Status** | `BLOCKED` |
| **Where** | `test-executor.ts` (always returns `error`); `TestRunner.tsx` (renders it) |

Input/expected/actual are masked for `isHidden`, but thrown messages still render. That can expose the hidden case.

**Fix:** never return or render `error` (or raw actual) for hidden cases. UI: pass / wrong answer only.

#### F-P2S1-06 — User code can freeze the tab

| | |
| --- | --- |
| **Status** | `BLOCKED` |
| **Where** | `test-executor.ts` (`new Function()` on the main thread) |

There is no timeout. `while (true) {}` runs after a cosmetic 300ms delay and locks the page. The comment says “sandboxed”; it is not (`window`, `document`, `fetch` are available).

**Fix for Sprint 1 (minimum):** run in a Web Worker with a hard timeout; kill the worker on overrun; show a timeout failure, do not freeze the UI.

**Do not** claim sandboxing until it is actually isolated.

#### F-P2S1-07 — Generated / scratch files in the PR

| | |
| --- | --- |
| **Status** | `BLOCKED` |
| **Where** | `apps/web/next-env.d.ts`; `implementation_plan_ph2_content_test.md` (repo root) |

- `next-env.d.ts` is machine-generated (`.next/dev/types` vs `.next/types`) and says do not edit.
- Root plan file includes a local `file:///d:/Suvam-Work/...` path.

**Fix:** revert `next-env.d.ts`. Move planning notes to `docs/` without machine-local paths, or drop them from the PR. Do not merge scratch files to `main`.

### OPEN — fix with Sprint 1 or immediately after (do not ignore)

#### F-P2S1-08 — Stale pass/fail after edits

| | |
| --- | --- |
| **Status** | `OPEN` |
| **Where** | `TestRunner.tsx` |

Editing code after a run leaves the previous results on screen.

**Fix:** clear `result` when `code` changes (or show an explicit “stale” state until re-run).

#### F-P2S1-09 — Function name taken from the user buffer

| | |
| --- | --- |
| **Status** | `OPEN` |
| **Where** | `TestRunner.tsx` → `extractFunctionName(code)` |

The first `function` / `const` in the editor is what gets called. A helper declared first is invoked instead of the solution.

**Fix:** extract from starter code (or a problem field), not from whatever the user typed first.

#### F-P2S1-10 — Playground not wired to the runner

| | |
| --- | --- |
| **Status** | `OPEN` |
| **Where** | `apps/web/app/playground/` |

Sprint plan said Playground **or** problem page. Only problem pages got Run Tests. Acceptable deferral if called out; do not silently treat Playground as done.

#### F-P2S1-11 — Accessibility gaps on new UI

| | |
| --- | --- |
| **Status** | `OPEN` |
| **Where** | `TestRunner.tsx`, `ProblemTabs.tsx` |

Test rows are `div` + `onClick`. Tabs are not `role="tab"` / tablist.

**Fix:** buttons (or `role="button"` + keyboard), proper tab pattern, focus states.

#### F-P2S1-12 — “Exactly 15 problem files” will break Sprint 2

| | |
| --- | --- |
| **Status** | `OPEN` |
| **Where** | `problem-json-validation.spec.ts` |

`expect(problemFiles.length).toBe(15)` fails the moment problem 16 is added.

**Fix:** assert expected slugs are present; do not pin an exact count.

### What already looks solid (do not regress)

- Tab `display: none` keeps Monaco state when switching Visualizer / Your Code
- Monaco is lazy-loaded
- Existing 6 problems already use executor-shaped `testCases`
- Pattern slugs no longer point at 404 placeholders (`three-sum` → `3sum`, etc.)

### Sprint 1 merge checklist

Copy this onto the PR when asking for re-review:

- [ ] F-P2S1-01 judging: 3Sum order + Find Peak multi-answer
- [ ] F-P2S1-02 every official solution passes its own tests
- [ ] F-P2S1-03 Koko dry-run math
- [ ] F-P2S1-04 Character Replacement dry run vs code
- [ ] F-P2S1-05 hidden-test error leak
- [ ] F-P2S1-06 Worker + timeout (no main-thread freeze)
- [ ] F-P2S1-07 `next-env.d.ts` + scratch plan removed
- [ ] F-P2S1-08 stale results cleared on edit *(or waived in writing)*
- [ ] F-P2S1-09 function name from starter, not user buffer *(or waived)*
- [ ] PR description filled in (what, why, how to verify)
- [ ] Human re-review of judging + one problem dry run in the browser

---

## Sprint 2 — More content + visualizers *(planned)*

From the Sprint 1 plan / README. **Do not start until Sprint 1 `BLOCKED` flags are `FIXED`**, or you will pile content on a broken judge.

Planned slice (adjust when the sprint is scoped):

- ~5 more problems (toward 20)
- Linked-list visualizer
- Tree visualizer
- User accounts / save progress *(may slip to Phase 3)*

| ID | Flag | Status | Notes |
| --- | --- | --- | --- |
| F-P2S2-01 | New problems must pass F-P2S1-02 gate | `OPEN` | No problem JSON without a passing official solution |
| F-P2S2-02 | Linked-list viz: empty / single-node / cycle (if taught) | `OPEN` | Fill when implementation starts |
| F-P2S2-03 | Tree viz: unbalanced / missing child / highlight path | `OPEN` | Fill when implementation starts |

Add flags here as Sprint 2 PRs appear. Same quality bar as Sprint 1.

---

## Later Phase 2 *(unscheduled)*

Keep parking lot items here so they are not “forgotten = done.”

| ID | Flag | Status | Notes |
| --- | --- | --- | --- |
| F-P2X-01 | Real sandbox (not just Worker timeout) | `OPEN` | iframe / origin isolation if we ever execute untrusted code beyond the owner’s browser |
| F-P2X-02 | Semantic comparator as a real module | `OPEN` | Lists, floats, any-of, unordered sets — shared by UI + tests |
| F-P2X-03 | PRs target `develop`, not `main` | `OPEN` | README: `feature → develop → main`. PR #8 targeted `main`. |
| F-P2X-04 | README Phase 2 checkboxes are stale | `OPEN` | Pattern pages + Monaco already shipped; still listed as unchecked |

---

## Review notes (Sprint 1)

- Preview URL was SSO-gated at review time; judging/dry-run issues were found in source, not only in the browser.
- `gh` was not available on the review machine; PR metadata came from the GitHub API. Re-run `npx nx test web` on the feature branch after fixes.
- Owner of this tracker: update statuses in the same PR that fixes the flag when possible.
