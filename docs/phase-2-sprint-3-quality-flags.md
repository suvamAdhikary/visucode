# Phase 2 Sprint 3 — Quality Flags

Working tracker for **Sprint 3 only**. Same quality bar as Sprint 1 (`docs/phase-2-quality-flags.md`): a green Vercel deploy is **not** a merge bar. If most problems are empty stubs, they never appear in the catalog, or dry runs contradict the posted solution, **the PR stays closed**.

Sprint 2 is tracked in [`docs/phase-2-sprint-2-quality-flags.md`](./phase-2-sprint-2-quality-flags.md). That does **not** lower the bar for this sprint.

---

## Current verdict

| Item | Verdict |
| --- | --- |
| **[PR #12](https://github.com/suvamAdhikary/visucode/pull/12)** — `feature/phase-2-sprint-3` → `main` · head `b9979ef` | **BLOCKED — do not merge** |
| **CI** | Vercel preview Ready — **not a product pass**. No `nx test web` check on the PR. |
| **Reviewed** | 2026-09-20 |

The branch adds HashMap, Stack/Queue, and Interval visualizers plus 10 problem JSON files. The visualizer scaffolding is usable. Content, catalog wiring, dry-run accuracy, and generated-file hygiene are not.

Preview: [visucode-git-feature-phase-2-sprint-3-…](https://visucode-git-feature-phase-2-sprint-3-suvamadhikarys-projects.vercel.app)

---

## Dev work remaining (do this on `feature/phase-2-sprint-3`)

Work **in order**. When a flag is done: set it `FIXED` in **this file in the same commit**, with a one-line “how.”

### 1. F-P2S3-01 — delete or replace placeholder problems

**Status:** `BLOCKED`

Seven of the ten “problems” are generated stubs:

| Slug | What’s in the file |
| --- | --- |
| `sprint-3-problem-4` … `sprint-3-problem-10` | title “Sprint 3 Problem N”, description `"Generated placeholder problem."`, empty examples / hints / tests / dry runs, `function solve() { return true; }` |

Sprint 3 story: *Add 10 problems covering Hashing, Stacks, Queues, Greedy, and Intervals.* Only three real problems exist (Two Sum, Valid Parentheses, Merge Intervals). No queue problem at all.

**Do:**

- Delete the seven placeholder JSON files, **or** replace each with a real problem (examples, ≥3 tests, ≥3 dry-run steps, matching pattern).
- Do not ship `function solve() { return true; }` on `main`.
- Cover hashing, stack, **queue**, greedy, and intervals — not seven extra hash-map stubs.

Existing `problem-json-validation.spec.ts` will fail on these files (`examples.length >= 1`, `testCases.length >= 3`, `dryRunSteps.length >= 3`, `patterns.length > 0`, official solution must produce `results.length > 0`).

### 2. F-P2S3-02 — new problems must appear in the catalog

**Status:** `BLOCKED`

`apps/web/lib/services/problem.service.ts` is **not in the PR**. `listProblems()` reads the static `PROBLEM_INDEX`. New JSON files load only if someone hits `/problems/{slug}` directly. They will not show on `/problems` or in category / difficulty filters.

Same class of bug as Sprint 2 `F-P2S2-06` (pattern index).

**Do:**

- Add every **real** new slug to `PROBLEM_INDEX`.
- Add them to the matching arrays in `apps/web/lib/services/pattern.service.ts` (`greedy` for merge-intervals; hash-map / stack / queue as applicable).
- Confirm `/problems` lists them and pattern pages include them.

### 3. F-P2S3-03 — dry runs must match the posted solution

**Status:** `BLOCKED`

Quality bar item 2: *Every number, pointer move, and explanation agrees with the posted solution.*

| Problem | What’s wrong |
| --- | --- |
| **Two Sum** | Step 1 says “Initialize empty map” on **line 3**; `new Map()` is line 2. Pattern is `two-pointers` but the solution is a hash map (`two-sum-sorted` already covers two pointers). Trace never shows the input array, never inserts `7`, never shows return `[0, 1]`. |
| **Merge Intervals** | Example is `[[1,3],[2,6],[8,10],[15,18]]`; dry run only uses `[1,3]` and `[2,6]`. Only **2** steps (validation requires ≥ 3). `rangeEnd: 10` would clip `[15,18]`. |
| **Valid Parentheses** | Example is `"()[]{}"`; dry run only does `"()"`. `patterns: []`. |

**Do:** walk each dry run against `solutions[0].code` the same way Sprint 1 Koko / Character Replacement were fixed. Every step: correct `line`, real visualizer state, explanation that matches that line. Fill traces to the example (or change the example to match the trace). Put a real pattern on Valid Parentheses (`stack` category is fine; still needs a `PatternSlug`).

### 4. F-P2S3-04 — revert generated / one-off files

**Status:** `BLOCKED`

Same flag class as Sprint 1 `F-P2S1-07`.

- `apps/web/next-env.d.ts` changed `.next/types/routes.d.ts` → `.next/dev/types/routes.d.ts` (local `next dev` artifact). **Revert it.**
- `scripts/generate-sprint3.js` writes the placeholder JSON. **Do not land it on `main`.** Keep generators only if they emit complete problems (see Sprint 2 `F-P2S2-07`).

### 5. F-P2S3-05 — JSON validation must stay green

**Status:** `BLOCKED`

The PR does not update `problem-json-validation.spec.ts`. `describe.each(problemFiles)` will pick up every new JSON and fail:

- empty examples / tests / dry runs on placeholders
- `greedy` is a valid `PatternSlug` in shared-types but **not** in the spec allowlist (`two-pointers | sliding-window | binary-search | dfs | bfs | dynamic-programming`)
- empty `patterns` on Valid Parentheses and placeholders
- official `solve()` with zero tests (`results.length > 0`)

**Do:**

- Extend the pattern allowlist (`greedy`, and any others you actually use).
- Keep the official-solution-vs-own-tests gate. Every new problem must pass it.
- Give each real problem ≥3 test cases (existing Sprint 1/2 problems already do).
- `npx nx test web` on the feature branch before asking for re-review.

### 6. F-P2S3-06 — visualizer props / layout bugs

**Status:** `BLOCKED` (type error); layout items can ship as `OPEN` only if called out and not crashy

Existing visualizers: `export function Foo({ ... }: Props)`. New ones:

```ts
export const HashMapVisualizer: React.FC = ({ state }) => {
```

`React.FC` without a generic is `{}` props. `state` should be a type error under `noUnusedLocals` / strict props. Same for StackQueue and Interval.

Other issues to fix in the same pass:

- Interval tick loop: one DOM node per integer from `floor(paddedMin)` to `ceil(paddedMax)`. Fine for 0–10; will explode on a larger range. Cap ticks or sample them.
- Timeline `min-height: 150px` while layers stack at `30 + layer * 30` — overlapping intervals can overflow the axis.
- Stack `.highlighted { transform: scale(1.05) }` fights `@keyframes dropIn` (also `transform`).
- Prefer raw values in JSON (`2`, `(`) and format in the visualizer. Do not store `'\"(\"'` so the UI can strip a leading quote.

**Do:** type props like `TreeVisualizer`. Fix the tick / height / transform bugs if merge-intervals (or a later interval problem) can hit them.

### 7. Housekeeping (same PR)

- Mark Sprint 3 stories `[x]` in `docs/epics-and-stories.md` **only after** the real work is done. They are still `[ ]` TODO while this PR claims to implement them.
- Trailing newlines on new JSON files.
- Valid Parentheses `companies`: `"Facebook"` vs `"Meta"` elsewhere — pick one.
- `VisualizerType` in `libs/shared-types` is still `'array' | 'linked-list' | 'tree' | 'graph' | 'matrix'`. Extend it if anything reads that union; otherwise leave a note.

---

## Flag register

| Status | Meaning |
| --- | --- |
| `BLOCKED` | Must be fixed before PR #12 can merge |
| `OPEN` | Known; not merge-blocking if called out |
| `FIXED` | Verified in code + tests (and browser for UI) |

### BLOCKED — still must fix before merge

#### F-P2S3-01 — Placeholder problems on main

| | |
| --- | --- |
| **Status** | `BLOCKED` |
| **Where** | `apps/web/content/problems/sprint-3-problem-{4–10}.json` |
| **Remaining fix** | Delete stubs or replace with real hashing / stack / queue / greedy / interval problems. |

#### F-P2S3-02 — Catalog / pattern index out of date

| | |
| --- | --- |
| **Status** | `BLOCKED` |
| **Where** | `apps/web/lib/services/problem.service.ts`, `pattern.service.ts` |
| **Remaining fix** | Add real new slugs to `PROBLEM_INDEX` and pattern `problems: []` arrays. |

#### F-P2S3-03 — Dry runs contradict solution / example

| | |
| --- | --- |
| **Status** | `BLOCKED` |
| **Where** | `two-sum.json`, `valid-parentheses.json`, `merge-intervals.json` |
| **Remaining fix** | Line numbers, visual state, and explanations must match `solutions[0].code`. Traces must cover the stated example (or shrink the example). ≥3 steps each. |

#### F-P2S3-04 — Generated / local-only files in the PR

| | |
| --- | --- |
| **Status** | `BLOCKED` |
| **Where** | `apps/web/next-env.d.ts`; `scripts/generate-sprint3.js` |
| **Remaining fix** | Revert `next-env.d.ts`. Drop the one-off generator (or make it emit complete problems). |

#### F-P2S3-05 — Problem JSON validation will fail

| | |
| --- | --- |
| **Status** | `BLOCKED` |
| **Where** | `apps/web/lib/utils/__tests__/problem-json-validation.spec.ts`; new problem JSON |
| **Remaining fix** | Extend pattern allowlist; keep official-solution gate; `npx nx test web` green. |

#### F-P2S3-06 — Visualizer typing / overflow

| | |
| --- | --- |
| **Status** | `BLOCKED` |
| **Where** | `HashMapVisualizer.tsx`, `StackQueueVisualizer.tsx`, `IntervalVisualizer.tsx` |
| **Remaining fix** | Typed function props (not untyped `React.FC`). Cap interval ticks; grow timeline with layers; don’t fight `transform` on stack highlight. |

### Keep (do not throw away)

- Shared types: `HashMapVisualizerState`, `StackQueueVisualizerState`, `IntervalVisualizerState` on `DryRunStep`.
- Wiring in `DryRunViewer` next to array / list / tree.
- CSS-module visualizers (hash table, open-top stack, number line).
- The three real slugs (`two-sum`, `valid-parentheses`, `merge-intervals`) once content is filled in.
- Official-solution-vs-own-tests gate — must stay.

### OPEN

| ID | Flag | Status | Notes |
| --- | --- | --- | --- |
| F-P2S3-07 | Queue never demonstrated | `OPEN` | Visualizer supports `type: 'queue'` but no problem uses it. Blocked only if you keep claiming “Stacks **and** Queues” in the sprint story without a queue problem. |
| F-P2S3-08 | Infinite pulse animation | `OPEN` | `.highlightedRow` uses `animation: pulse 1.5s infinite` with no `prefers-reduced-motion`. |
| F-P2S3-09 | Generation scripts quality | `OPEN` | Same as Sprint 2 `F-P2S2-07`. Do not add more one-off writers. |

---

## Sprint 3 merge checklist (PR #12)

Copy when asking for re-review:

- [ ] F-P2S3-01 no `sprint-3-problem-*` stubs (or they are real complete problems)
- [ ] F-P2S3-02 `PROBLEM_INDEX` + pattern service list every new slug
- [ ] F-P2S3-03 Two Sum / Valid Parentheses / Merge Intervals dry runs match `solutions[0].code` and the example
- [ ] F-P2S3-04 `next-env.d.ts` reverted; `generate-sprint3.js` not on `main`
- [ ] F-P2S3-05 `npx nx test web` — every official solution passes its own tests; `greedy` (etc.) in the allowlist
- [ ] F-P2S3-06 visualizer props typed; interval ticks / stack transform not broken
- [ ] `npx nx build web` passes locally
- [ ] Browser: Visualizer tab on `two-sum`, `valid-parentheses`, `merge-intervals` — step through, nothing blank, highlights match the explanation
- [ ] Browser: `/problems` shows the new slugs; category/pattern filters include them
- [ ] Sprint 3 stories in `epics-and-stories.md` checked only if actually done
- [ ] This flags file updated (`BLOCKED` → `FIXED`) in the same PR

---

## Review notes

- 2026-09-20: PR #12 (`b9979ef`) blocked. 7/10 problems are placeholders. `PROBLEM_INDEX` unchanged. Dry-run line numbers / traces do not match solutions. `next-env.d.ts` churn + one-off generator. Untyped `React.FC` visualizers. Vercel Ready is not a pass.
- Owner: update statuses in the same PR that fixes the flag. Do not delete flags.
