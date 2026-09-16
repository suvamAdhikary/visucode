# Phase 2 Sprint 2 — Quality Flags

Working tracker for **Sprint 2 only**. Same quality bar as Sprint 1 (`docs/phase-2-quality-flags.md`): a green Vercel deploy is **not** a merge bar. If problem pages crash, starter code is the full solution, or dry runs go blank, **the PR stays closed**.

Sprint 1 is merged ([PR #10](https://github.com/suvamAdhikary/visucode/pull/10)). That does **not** lower the bar for this sprint.

---

## Current verdict

| Item | Verdict |
| --- | --- |
| **[PR #11](https://github.com/suvamAdhikary/visucode/pull/11)** — `feature/phase-2-sprint-2` → `main` · head `21fcc9f` | **DO NOT MERGE** |
| **CI** | Vercel **Error** — `mergeable_state: unstable` |
| **Reviewed** | 2026-09-17 |

The branch adds LinkedList + Tree visualizers and 5 problems. The preview cannot deploy. New problem pages will throw at runtime. Starter code is the accepted answer. Several dry-run steps render an empty list/tree.

Do not merge this because “the scripts ran.”

---

## Dev work remaining (do this on `feature/phase-2-sprint-2`)

Work **in order**. When a flag is done: set it `FIXED` in **this file in the same commit**, with a one-line “how.”

### 1. F-P2S2-01 — make the build green

**Status:** `BLOCKED`

Vercel failed: [deployment 9uJzFENHy5LLWErPUTNk6mm1V4Hs](https://vercel.com/suvamadhikarys-projects/visucode/9uJzFENHy5LLWErPUTNk6mm1V4Hs).

`tsconfig.base.json` has `noUnusedLocals: true`. Likely unused params in the new visualizers:

- `LinkedListVisualizer.tsx`: `forEach((node, index) =>` — drop `index`; `map((p, i) =>` — drop `i`
- `TreeVisualizer.tsx`: `map((p, i) =>` — drop `i`

**Do:**

```bash
npx nx build web
```

Fix every error the log shows. Do **not** disable `noUnusedLocals`. Push until Vercel is Ready.

### 2. F-P2S2-04 — new problem pages must not crash

**Status:** `BLOCKED`

Sprint 2 JSON uses `{ "title", "url" }`. The UI still reads `{ platform, url }`:

```ts
link.platform.toLowerCase()  // platform is undefined → throw
```

Opening `/problems/reverse-linked-list` (and the other four new slugs) dies.

**Do:**

- Keep the `ExternalLink` type: `{ platform, url, problemId? }`.
- In every new problem JSON, set `"platform": "leetcode"` (not `title`).
- Use the real LeetCode problem URL, not `https://leetcode.com/`.
- Guard the renderer: do not call methods on `link.platform` unless it is a string.
- `key={link.platform}` is invalid when platform is missing.

Old Sprint 1 problems already use `platform`. Do not break them.

### 3. F-P2S2-05 — starter code must be a stub

**Status:** `BLOCKED`

Every new problem’s `starterCode.javascript` **is the full solution**. “Your Code” is already solved. Learners have nothing to write.

| Slug | What starter currently is |
| --- | --- |
| `reverse-linked-list` | complete reverse loop |
| `linked-list-cycle` | complete Floyd cycle |
| `merge-two-sorted-lists` | complete dummy-node merge |
| `maximum-depth-of-binary-tree` | complete one-liner DFS |
| `invert-binary-tree` | complete swap + recurse |

**Do:** starter = signature + `// Your code here` (plus the commented `ListNode` / `TreeNode` definition if needed). Keep the real algorithm **only** in `solutions[0].code`. Then `npx nx test web` — official-solution-vs-own-tests must still pass via `wrapperCode`.

### 4. F-P2S2-02 / F-P2S2-03 — dry runs that actually visualize

**Status:** `BLOCKED`

| Problem | What’s wrong |
| --- | --- |
| **Linked List Cycle** | Step 1 shows the cycle. Steps 2–3 set `nodes: []` — the list **vanishes**. Cycle coverage is not met. |
| **Invert Binary Tree** | Step 1 is already swapped. Steps 2–3: `nodes: []`, `rootId: ""`. Missing-child / recurse is not shown. |
| **Reverse Linked List** | Stops mid-reverse on 3 nodes; example is `[1,2,3,4,5]`; `headId` never moves to the new head. |
| **Merge / max depth** | Thin traces; walk them against the solution the same way Sprint 1 Koko/Character Replacement were fixed. |

**Do:** every step must have a real `linkedListState` or `treeState` (nodes + pointers). For cycle: keep the back-edge on **every** step (`n4.nextId = n2` in the LeetCode example). For trees: include a missing child (`leftId` xor `rightId`, empty slot), not an empty `nodes` array. Traces must match `solutions[0].code`.

### 5. F-P2S2-06 — pattern lists must include the new slugs

**Status:** `BLOCKED`

`apps/web/lib/services/pattern.service.ts` was not updated. Reverse / cycle / merge will not appear on Two Pointers. Tree problems will not appear on DFS.

**Do:** add the new slugs to the matching `problems: []` arrays. Same class of bug we already fixed in Sprint 1 (`three-sum` → `3sum`).

### 6. Housekeeping (same PR)

- Fill the GitHub PR #11 description (what, why, how to verify).
- Fix invert-binary-tree `companies: ["Google", "Mac"]` → Meta (or whatever is intended).
- Export new visualizers from `apps/web/app/components/visualizer/index.ts`.
- Do not regenerate JSON from `scripts/generate-problems.js` until that script emits stubs + complete dry runs (it currently hardcodes the reverse-list wrapper and dumps unfinished steps).
- After the items above: update **this file** (`BLOCKED` → `FIXED`) and ask for re-review.

---

## Flag register

| Status | Meaning |
| --- | --- |
| `BLOCKED` | Must be fixed before PR #11 can merge |
| `OPEN` | Known; not merge-blocking if called out |
| `FIXED` | Verified in code + tests (and browser for UI) |

### BLOCKED

#### F-P2S2-01 — Vercel / `nx build web` fails

| | |
| --- | --- |
| **Status** | `BLOCKED` |
| **Where** | `LinkedListVisualizer.tsx`, `TreeVisualizer.tsx` (unused locals); confirm with full build log |
| **Fix** | Remove unused bindings; keep `noUnusedLocals`. Preview must be Ready. |

#### F-P2S2-04 — `externalLinks` shape crashes problem pages

| | |
| --- | --- |
| **Status** | `BLOCKED` |
| **Where** | new `*.json` under `apps/web/content/problems/`; `apps/web/app/problems/[slug]/page.tsx` |
| **Fix** | `platform` + real URLs; safe render. |

#### F-P2S2-05 — starter code is the solution

| | |
| --- | --- |
| **Status** | `BLOCKED` |
| **Where** | all 5 new problem JSON `starterCode.javascript` |
| **Fix** | stubs only; solutions stay in `solutions[]`. |

#### F-P2S2-02 — Linked-list viz: empty / single-node / cycle

| | |
| --- | --- |
| **Status** | `BLOCKED` |
| **Where** | `linked-list-cycle.json` (empty steps); `reverse-linked-list.json` (incomplete reverse); `merge-two-sorted-lists.json` |
| **Fix** | Every step has nodes. Cycle back-edge present on every step. Include empty list and single-node cases in tests and at least one dry-run frame. |

#### F-P2S2-03 — Tree viz: unbalanced / missing child / highlight

| | |
| --- | --- |
| **Status** | `BLOCKED` |
| **Where** | `invert-binary-tree.json` (empty steps 2–3); `maximum-depth-of-binary-tree.json` |
| **Fix** | No empty `nodes: []` frames. Show a missing child. Highlight the node being visited. Match the solution. |

#### F-P2S2-06 — Pattern index out of date

| | |
| --- | --- |
| **Status** | `BLOCKED` |
| **Where** | `apps/web/lib/services/pattern.service.ts` |
| **Fix** | Two Pointers + DFS (or the pattern you actually tagged) list the new slugs. |

### Keep (do not throw away)

- `wrapperCode` + `__execute` for list/tree I/O is the right approach — keep it.
- Shared types: `LinkedListVisualizerState`, `TreeVisualizerState`, `Pointer.targetId`.
- Wiring: `CodeSubmit` → `TestRunner` → worker `wrapperCode`.
- Official-solution-vs-own-tests gate in `problem-json-validation.spec.ts` — must stay; it cannot pass as a substitute for stubs + real dry runs.

### OPEN

| ID | Flag | Status | Notes |
| --- | --- | --- | --- |
| F-P2S2-07 | Generation scripts quality | `OPEN` | `scripts/generate-problems.js` / `test-one.js` — fine as local tools once templates are correct; do not ship generated junk |
| F-P2S2-08 | User accounts / save progress | `OPEN` | Still Phase 3; not this PR |

---

## Sprint 2 merge checklist (PR #11)

Copy onto the PR when asking for re-review:

- [ ] F-P2S2-01 `npx nx build web` + Vercel Ready
- [ ] F-P2S2-04 problem pages for all 5 new slugs load (no `platform` throw)
- [ ] F-P2S2-05 starter is a stub; Reset does not paste the solution
- [ ] F-P2S2-02 cycle dry run keeps the list + back-edge on every step
- [ ] F-P2S2-03 tree dry run never clears `nodes`; missing child visible
- [ ] F-P2S2-06 pattern pages list the new problems
- [ ] `npx nx test web` — every official solution passes its own tests
- [ ] Browser: Visualizer tab on reverse-list, cycle, invert-tree — step through, nothing blank
- [ ] Browser: Your Code tab — stub only, Run Tests against wrapper
- [ ] invert-tree company tag fixed (`Mac`)
- [ ] This flags file updated (`BLOCKED` → `FIXED`) in the same PR
- [ ] PR #11 description filled in

---

## Review notes

- 2026-09-17: PR #11 (`21fcc9f`) blocked. Vercel red. `externalLinks` crash. Starter = solution. Dry runs empty on later steps. Pattern service unchanged.
- Owner: update statuses in the same PR that fixes the flag. Do not delete flags.
