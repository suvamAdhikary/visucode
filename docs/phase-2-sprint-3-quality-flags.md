# Phase 2 Sprint 3 — Quality Flags

Working tracker for **Sprint 3 only**. Same quality bar as Sprint 1 (`docs/phase-2-quality-flags.md`): a green Vercel deploy is **not** a merge bar.

Sprint 2 is tracked in [`docs/phase-2-sprint-2-quality-flags.md`](./phase-2-sprint-2-quality-flags.md). That does **not** lower the bar for this sprint.

**Scope this PR:** 3 core problems (Two Sum, Valid Parentheses, Merge Intervals) + HashMap / Stack-Queue / Interval visualizers. Extra problems (queue, more hashing/greedy) ship later with the backend. Do not block merge on “10 problems.”

---

## Current verdict

| Item | Verdict |
| --- | --- |
| **[PR #12](https://github.com/suvamAdhikary/visucode/pull/12)** — `feature/phase-2-sprint-3` → `main` · head `612289b` | **BLOCKED — two leftover items** |
| **CI** | Vercel preview Ready — **not a product pass**. Confirm `npx nx test web` locally. |
| **Reviewed** | 2026-09-20 (initial `b9979ef`) · 2026-09-20 (re-review `612289b`) |

`612289b` fixed placeholders, catalog wiring, dry runs, validation allowlist, and visualizer typing. Remaining: revert `next-env.d.ts`, and make Two Sum’s catalog `patterns` match the JSON (multi-pattern arrays must stay in sync).

Preview: [visucode-git-feature-phase-2-sprint-3-…](https://visucode-git-feature-phase-2-sprint-3-suvamadhikarys-projects.vercel.app)

---

## Dev work remaining (do this on `feature/phase-2-sprint-3`)

Work **in order**. When a flag is done: set it `FIXED` in **this file in the same commit**, with a one-line “how.”

### 1. F-P2S3-04 — revert `next-env.d.ts`

**Status:** `BLOCKED`

Still changed to `import "./.next/dev/types/routes.d.ts"`. That is a local `next dev` artifact. Same rule as Sprint 1 `F-P2S1-07`.

**Do:** revert `apps/web/next-env.d.ts` to `import "./.next/types/routes.d.ts"`. Do not commit it again. `generate-sprint3.js` is already gone — keep it that way.

### 2. F-P2S3-02 / F-P2S3-10 — catalog `patterns[]` must match JSON (multi-pattern)

**Status:** `BLOCKED` (Two Sum mismatch)

A problem **already can** belong to multiple patterns. Types and UI use arrays:

- JSON `patterns: PatternSlug[]`
- `PROBLEM_INDEX.patterns: PatternSlug[]`
- `/problems` filter: `p.patterns.includes(pattern)`
- Problem cards and the problem page render **every** pattern as a tag/link

What was missing: pattern **detail** pages only listed `pattern.service`’s hardcoded `problems: []`. A problem tagged with two patterns in JSON/index would show on `/problems?pattern=…` but miss one of the `/patterns/{slug}` pages.

**Applied on `pr` (this flags update):** `getProblemSummariesForPattern()` unions `PROBLEM_INDEX` (all matching patterns) with the hardcoded coming-soon slugs. Pattern pages now follow the catalog arrays.

**Still do:**

Two Sum is split across indexes:

| Source | `patterns` |
| --- | --- |
| `two-sum.json` | `['hash-map']` |
| `PROBLEM_INDEX` | `['two-pointers']` |
| `pattern.service` Hash Map | `['two-sum']` |

`/problems?pattern=two-pointers` currently lists classic Two Sum. `/problems?pattern=hash-map` does not.

Set `PROBLEM_INDEX` to the same array as JSON. Classic Two Sum is hash-map, not two-pointers (`two-sum-sorted` already covers two-pointers). If a **later** problem truly uses two patterns, put **both** in JSON **and** `PROBLEM_INDEX`, e.g. `['greedy', 'hash-map']`. It will then appear on both pattern pages and both catalog filters.

When adding problems later (BE): one source of truth. JSON `patterns` and `PROBLEM_INDEX.patterns` must be identical arrays.

### 3. Housekeeping

- Check Sprint 3 stories in `docs/epics-and-stories.md` for the **3 problems + 3 visualizers** that actually shipped. Leave queue / extra problems for a later epic.
- Nits (not merge-blocking): Valid Parentheses dry-run `char` values look like `"( "` (trailing space); Merge Intervals `spaceComplexity: "O(1)"` should be `O(N)`.

---

## Flag register

| Status | Meaning |
| --- | --- |
| `BLOCKED` | Must be fixed before PR #12 can merge |
| `OPEN` | Known; not merge-blocking if called out |
| `FIXED` | Verified in code + tests (and browser for UI) |

### BLOCKED — still must fix before merge

#### F-P2S3-04 — Generated / local-only files in the PR

| | |
| --- | --- |
| **Status** | `BLOCKED` |
| **Where** | `apps/web/next-env.d.ts` |
| **How so far** | `scripts/generate-sprint3.js` removed. |
| **Remaining fix** | Revert `next-env.d.ts`. Do not mark `FIXED` until that file is unchanged vs `main`. |

#### F-P2S3-02 — Catalog pattern arrays out of sync

| | |
| --- | --- |
| **Status** | `BLOCKED` |
| **Where** | `apps/web/lib/services/problem.service.ts` (`two-sum` entry) |
| **How so far** | Three slugs added to `PROBLEM_INDEX` and pattern.service. |
| **Remaining fix** | `two-sum` `PROBLEM_INDEX.patterns` = JSON (`['hash-map']`). |

#### F-P2S3-10 — Multi-pattern membership

| | |
| --- | --- |
| **Status** | `FIXED` *(code on this flags commit; verify on pattern pages)* |
| **Where** | `problem.service.ts` `getProblemSummariesForPattern`; `app/patterns/[slug]/page.tsx` |
| **How** | Pattern pages list every indexed problem whose `patterns` array includes that slug. Extra `pattern.problems` slugs stay Coming Soon. JSON + index remain the dual write until BE. |

### FIXED (verified 2026-09-20, head `612289b`)

#### F-P2S3-01 — Placeholder problems on main

| | |
| --- | --- |
| **Status** | `FIXED` |
| **Where** | `apps/web/content/problems/` |
| **How** | Deleted `sprint-3-problem-4`…`10`. Product accepted **3** problems this sprint. |

#### F-P2S3-03 — Dry runs contradict solution / example

| | |
| --- | --- |
| **Status** | `FIXED` |
| **Where** | `two-sum.json`, `valid-parentheses.json`, `merge-intervals.json` |
| **How** | Two Sum line 2 + 5 steps to `[0,1]`. Valid Parentheses walks `"()[]{}"`. Merge Intervals covers all four intervals, 5 steps. |

#### F-P2S3-05 — Problem JSON validation will fail

| | |
| --- | --- |
| **Status** | `FIXED` |
| **Where** | `problem-json-validation.spec.ts` |
| **How** | Allowlist adds `greedy`, `stack`, `hash-map`. Each new problem has ≥3 tests. Confirm `npx nx test web`. |

#### F-P2S3-06 — Visualizer typing / overflow

| | |
| --- | --- |
| **Status** | `FIXED` |
| **Where** | HashMap / StackQueue / Interval visualizers |
| **How** | `React.FC<…Props>`. Interval ticks sampled; timeline height uses `maxLayer`. Stack highlight no longer scales `transform`. |

### Keep (do not throw away)

- Shared types: `HashMapVisualizerState`, `StackQueueVisualizerState`, `IntervalVisualizerState` on `DryRunStep`; `PatternSlug` includes `hash-map` and `stack`; `VisualizerType` includes `hash-map` / `stack-queue` / `interval`.
- Wiring in `DryRunViewer` next to array / list / tree.
- `patterns: PatternSlug[]` on problems — **never collapse to a single string.**
- Official-solution-vs-own-tests gate.

### OPEN

| ID | Flag | Status | Notes |
| --- | --- | --- | --- |
| F-P2S3-07 | Queue never demonstrated | `OPEN` | Deferred with extra problems / BE. Visualizer already supports `type: 'queue'`. |
| F-P2S3-08 | Infinite pulse animation | `OPEN` | `.highlightedRow` `pulse 1.5s infinite`; no `prefers-reduced-motion`. |
| F-P2S3-09 | Generation scripts quality | `OPEN` | Same as Sprint 2 `F-P2S2-07`. Do not add more one-off writers. |
| F-P2S3-11 | More problems after BE | `OPEN` | Owner: grow past 3 problems when GraphQL/content pipeline exists. |

---

## Sprint 3 merge checklist (PR #12)

Copy when asking for re-review:

- [x] F-P2S3-01 no placeholder JSON; **3** real problems is the agreed scope
- [ ] F-P2S3-02 Two Sum `PROBLEM_INDEX.patterns` matches JSON (`hash-map`)
- [x] F-P2S3-03 dry runs match `solutions[0].code` and the example
- [ ] F-P2S3-04 `next-env.d.ts` reverted
- [x] F-P2S3-05 validation spec includes `greedy` / `stack` / `hash-map` (confirm `npx nx test web`)
- [x] F-P2S3-06 visualizer props typed; interval ticks / stack transform
- [x] F-P2S3-10 pattern pages union catalog `patterns[]` (multi-pattern)
- [ ] `npx nx build web` after the `next-env` revert
- [ ] Browser: `/problems?pattern=hash-map` lists Two Sum; `/problems?pattern=two-pointers` does **not**
- [ ] Browser: `/patterns/hash-map` lists Two Sum
- [ ] Sprint 3 stories in `epics-and-stories.md` checked for the 3 visualizers + 3 problems
- [ ] This flags file matches the code (`BLOCKED` only for unfinished items)

---

## Multi-pattern rule (for later BE work)

1. `patterns` is always an **array**. One problem, many patterns is expected.
2. Write the same array in **JSON** and **`PROBLEM_INDEX`**.
3. Catalog filters and pattern pages both use `patterns.includes(slug)`.
4. `pattern.service` `problems: []` is only for Coming Soon slugs not yet in the index. Do not use it as the only membership list.
5. Example: `{ "patterns": ["greedy", "hash-map"] }` → problem shows under Greedy **and** Hash Map.

---

## Review notes

- 2026-09-20: PR #12 (`b9979ef`) blocked. 7/10 problems are placeholders. `PROBLEM_INDEX` unchanged. Dry-run mismatches. `next-env.d.ts` + generator. Untyped visualizers.
- 2026-09-20: PR #12 (`612289b`) re-reviewed. Placeholders gone; 3 problems accepted. Dry runs, allowlist, visualizer typing fixed. Still blocked: `next-env.d.ts`, Two Sum index vs JSON pattern. Multi-pattern: types/UI already arrays; pattern pages now union the index.
- Owner: update statuses in the same PR that fixes the flag. Do not delete flags.
