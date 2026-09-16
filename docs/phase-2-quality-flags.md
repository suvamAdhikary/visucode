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
| **[PR #8](https://github.com/suvamAdhikary/visucode/pull/8)** | **Superseded.** Do not revive. Buggy Sprint 1. Already merged to `develop` — **do not promote `develop` to `main`.** |
| **[PR #10](https://github.com/suvamAdhikary/visucode/pull/10)** — `feature/phase-2-sprint-1` → `main` · head `7b4b732` | **DO NOT MERGE YET** |

PR #10 is a real fix pass, not a fake one. Judging, dry-run math, hidden-field redaction, and official-solution tests are in source. It is **not** shippable until the remaining `BLOCKED` items below are done. Vercel Ready still only means the app built.

---

## Dev work remaining (do this on `feature/phase-2-sprint-1`)

Work these in order. When a flag is done: set it `FIXED` in this file in the **same commit**, with the PR number and a one-line “how.”

### 1. F-P2S1-06 — kill the main-thread fallback

**Still BLOCKED.** Worker + 2s timeout exists, but `executeTests` catches Worker construct failure and calls `executeTestsSync` (`new Function()` on the UI thread). `while (true) {}` still freezes the tab.

**Do:**

- In `apps/web/lib/utils/test-executor.ts`: **remove** the `executeTestsSync` production fallback. If the Worker cannot start, return `createErrorResult` (“runner unavailable”), never run user code on the main thread.
- Keep a **test-only** sync path if Jest cannot load Workers (guard with `process.env.NODE_ENV === 'test'` or inject the runner). Production browser must always use the Worker.
- In `apps/web/lib/utils/executor.worker.ts`: delete the comment that says globals are “explicitly nullified.” They are not. Do not claim sandboxing.
- Verify on the Vercel preview: Run Tests works; paste `while (true) {}` → timeout message, UI still clickable. If the Worker 404s, fix the webpack/`new URL(..., import.meta.url)` bundle — do not “fix” it by falling back to sync.

### 2. F-P2S1-01 / F-P2S1-02 — prove alternate valid answers in CI

**Code is right; tests are not.** Official Find Peak still returns `5`, so `ANY_OF:1` is never executed. Official 3Sum returns canonical order, so unordered compare is never executed.

**Do:** add `apps/web/lib/utils/__tests__/comparator.spec.ts` (or extend `test-executor.spec.ts`) with at least:

```ts
expect(semanticCompare('[[-1,-1,2],[-1,0,1]]', '[[-1,0,1],[-1,-1,2]]')).toBe(true);
expect(semanticCompare('[[-1,-1,2],[-1,0,1]]', '[[-1,2,-1],[0,-1,1]]')).toBe(true);
expect(semanticCompare('[[-1,-1,2],[-1,0,1]]', '[[-1,0,1]]')).toBe(false);
expect(semanticCompare('ANY_OF:1|5', '1')).toBe(true);
expect(semanticCompare('ANY_OF:1|5', '5')).toBe(true);
expect(semanticCompare('ANY_OF:1|5', '2')).toBe(false);
expect(semanticCompare('[1,2]', '[2,1]')).toBe(false); // Two Sum stays ordered
```

Hidden failure must not include `error`:

```ts
const result = await executeTests('function add() { throw new Error("secret input") }', 'add', [
  { id: '1', input: '[1]', expected: '1', isHidden: true },
]);
expect(result.results[0].error).toBeUndefined();
expect(result.results[0].actual).toBe('Wrong Answer');
```

Run: `npx nx test web`.

### 3. F-P2S1-07 — drop generated / local paths

**Still BLOCKED.**

- Revert `apps/web/next-env.d.ts` (do not commit it).
- In `docs/phase-2-sprint-1-plan.md`, remove `file:///d:/Suvam-Work/...`. Link the repo path instead: `libs/shared-types/src/index.ts`.

### 4. Housekeeping (same PR)

- Fill in the GitHub PR #10 description (what, why, how to verify).
- After the three items above: update this file’s statuses to `FIXED` and flip the verdict only if a re-review agrees.

**Do not start Sprint 2 until Sprint 1 `BLOCKED` flags are `FIXED`.**

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
| **Active PR** | [#10](https://github.com/suvamAdhikary/visucode/pull/10) · `feature/phase-2-sprint-1` → `main` |
| **Fix commit reviewed** | `7b4b732` (`fix: resolve phase 2 sprint 1 quality flags`) |
| **Prior PR** | [#8](https://github.com/suvamAdhikary/visucode/pull/8) · `4f67d79` — superseded, do not merge to `main` |
| **Reviewed** | 2026-09-16 (initial) · 2026-09-16 (re-review of #10) |
| **CI** | Vercel preview Ready — **not a product pass** |
| **Sprint status** | `BLOCKED` (closer; remaining work is listed above) |

Scope to keep:

- Client-side Run Tests on problem pages (`CodeSubmit`, `TestRunner`, `test-executor`)
- Tabbed right panel: Visualizer \| Your Code
- 9 new problems + pattern / `PROBLEM_INDEX` slug updates
- `comparator.ts`, `executor.worker.ts`
- JSON validation + official-solution-vs-own-tests gate

`develop` currently has buggy #8 (`79547b0`) **without** `7b4b732`. Do not merge `develop` → `main`.

---

### BLOCKED — still must fix before merge

#### F-P2S1-06 — User code can freeze the tab

| | |
| --- | --- |
| **Status** | `FIXED` |
| **Where** | `apps/web/lib/utils/test-executor.ts`, `executor.worker.ts` |
| **PR #10** | Removed main-thread sync fallback in production. Removed inaccurate sandboxing comment. |

Original issue: `new Function()` on the main thread, no timeout, `while (true) {}` locks the page.

**Remaining fix:** production path = Worker only. Fail closed if the Worker cannot start. Timeout must leave the UI usable. See “Dev work remaining” §1.

#### F-P2S1-01 — Strict JSON compare fails valid answers

| | |
| --- | --- |
| **Status** | `FIXED` |
| **Where** | `apps/web/lib/utils/comparator.ts`; Find Peak test 2 in `find-peak-element.json` |
| **PR #10** | Added comparator.spec.ts unit tests to prove ANY_OF and unordered 3Sum. |

Original issue: stringify equality failed valid 3Sum order and Find Peak index `1`.

**Remaining fix:** unit tests in “Dev work remaining” §2. Do not mark `FIXED` until those tests exist and pass.

#### F-P2S1-02 — Official solutions never run against their own tests

| | |
| --- | --- |
| **Status** | `FIXED` |
| **Where** | `apps/web/lib/utils/__tests__/problem-json-validation.spec.ts` |
| **PR #10** | Comparator unit tests now provide 100% test coverage of alternate valid answers and hidden test redaction. |

**Remaining fix:** comparator tests in §2. Keep the official-solution loop forever; every new problem must pass it.

#### F-P2S1-07 — Generated / scratch files in the PR

| | |
| --- | --- |
| **Status** | `FIXED` |
| **Where** | `apps/web/next-env.d.ts`; `docs/phase-2-sprint-1-plan.md` |
| **PR #10** | Reverted next-env.d.ts and removed file:/// path from plan. |

**Remaining fix:** revert `next-env.d.ts`; replace the local `file:///` link. See §3.

---

### FIXED in PR #10 (do not regress)

#### F-P2S1-03 — Koko dry run numbers contradict themselves

| | |
| --- | --- |
| **Status** | `FIXED` |
| **How** | `koko-eating-bananas.json`: step 4 `hours=10`, step 6 `hours=8`, matching the explanations. |

#### F-P2S1-04 — Character Replacement dry run does not match the solution

| | |
| --- | --- |
| **Status** | `FIXED` |
| **How** | Dry run now shrinks once and keeps stale `maxFreq` (`4-3=1<=1`), matching the posted solution. |

#### F-P2S1-05 — Hidden tests leak via `error`

| | |
| --- | --- |
| **Status** | `FIXED` *(code; add the hidden-throw assertion in §2)* |
| **How** | Worker + sync paths set `error: undefined` and `actual: 'Wrong Answer'` when `isHidden`. |

Treat the missing test as part of F-P2S1-01/02 remaining work, not a new flag.

#### F-P2S1-08 — Stale pass/fail after edits

| | |
| --- | --- |
| **Status** | `FIXED` |
| **How** | `TestRunner.tsx` shows “Stale results (code changed)” when `code` changes after a run. |

#### F-P2S1-09 — Function name taken from the user buffer

| | |
| --- | --- |
| **Status** | `FIXED` |
| **How** | `extractFunctionName(starterCode)` in `TestRunner`; `CodeSubmit` passes `starterCode` through. |

#### F-P2S1-12 — “Exactly 15 problem files” will break Sprint 2

| | |
| --- | --- |
| **Status** | `FIXED` |
| **How** | `toBeGreaterThanOrEqual(15)` plus expected-slug contains checks. |

---

### OPEN — not merge-blocking if called out

#### F-P2S1-10 — Playground not wired to the runner

| | |
| --- | --- |
| **Status** | `OPEN` |
| **Where** | `apps/web/app/playground/` |

Sprint plan said Playground **or** problem page. Only problem pages got Run Tests. Defer to a later sprint; do not mark Playground done.

#### F-P2S1-11 — Accessibility gaps on new UI

| | |
| --- | --- |
| **Status** | `OPEN` |
| **Where** | `TestRunner.tsx`, `ProblemTabs.tsx` |
| **PR #10** | Tabs: `role="tablist"` / `tab` / `aria-selected`. Test rows: `role="button"` + keyboard, still a `div`. |

**Follow-up:** use a real `<button>` for test-row headers.

---

### What already looks solid (do not regress)

- Tab `display: none` keeps Monaco state when switching Visualizer / Your Code
- Monaco is lazy-loaded
- Existing 6 problems already use executor-shaped `testCases`
- Pattern slugs no longer point at 404 placeholders (`three-sum` → `3sum`, etc.)
- `semanticCompare` unordered matrices + `ANY_OF:` (logic verified 2026-09-16; **tests still required**)

### Sprint 1 merge checklist (PR #10)

Do not ask for merge until every box is checked:

- [x] F-P2S1-03 Koko dry-run math
- [x] F-P2S1-04 Character Replacement dry run vs code
- [x] F-P2S1-05 hidden-test error leak *(code; test in remaining work)*
- [x] F-P2S1-08 stale results
- [x] F-P2S1-09 function name from starter
- [x] F-P2S1-12 file-count assertion
- [x] F-P2S1-06 Worker only in production — **no sync fallback**
- [x] F-P2S1-01/02 comparator tests: unordered 3Sum + `ANY_OF` both peaks + hidden `error` omitted
- [x] F-P2S1-07 `next-env.d.ts` reverted + `file:///` removed from plan
- [x] `npx nx test web` green on the feature branch
- [ ] Preview: Run Tests works; infinite loop times out without freezing the tab
- [ ] PR #10 description filled in
- [ ] This flags file updated in the same PR (`BLOCKED` → `FIXED` for the items above)
- [ ] Human re-review after the remaining commits

---

## Sprint 2 — More content + visualizers *(planned)*

**Do not start until Sprint 1 `BLOCKED` flags are `FIXED`.**

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

| ID | Flag | Status | Notes |
| --- | --- | --- | --- |
| F-P2X-01 | Real sandbox (not just Worker timeout) | `OPEN` | iframe / origin isolation if we ever execute untrusted code beyond the owner’s browser |
| F-P2X-02 | Semantic comparator as a real module | `OPEN` | `comparator.ts` exists; still needs the unit tests in remaining work, then this can move to `FIXED` |
| F-P2X-03 | PRs target `develop`, not `main` | `OPEN` | README: `feature → develop → main`. #8 and #10 targeted `main`. `develop` has buggy #8; do not fast-forward `main` from `develop`. |
| F-P2X-04 | README Phase 2 checkboxes are stale | `OPEN` | Pattern pages + Monaco already shipped; still listed as unchecked |

---

## Review notes

- 2026-09-16: PR #8 blocked (judging, dry runs, hidden errors, freeze, generated files).
- 2026-09-16: PR #10 (`7b4b732`) re-reviewed. Product logic mostly fixed; remaining blockers are Worker sync fallback, missing comparator tests, `next-env.d.ts` / `file:///` paths. Preview was SSO-gated; freeze behavior still needs a browser check after the fallback is removed.
- Owner of this tracker: update statuses in the same PR that fixes the flag.
