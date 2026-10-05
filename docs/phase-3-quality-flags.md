# Phase 3 — Quality Flags

Living tracker for **every Phase 3 sprint**. Same merge bar as Phase 2 (`docs/phase-2-quality-flags.md`): a green Vercel deploy is **not** a merge bar.

Phase 3 is **user / progress**, not more problem JSON. Extra catalog volume stays Phase 4 (`F-P2S5-07`).

**Do not start Auth.js until Live Dry Run Sprint 1 is merge-ready.** Tracker: [`docs/phase-live-dry-run-quality-flags.md`](./phase-live-dry-run-quality-flags.md). ADR: [`docs/ADR/002-live-dry-run-tracer.md`](./ADR/002-live-dry-run-tracer.md).

**Active epic:** [`docs/epics-and-stories.md`](./epics-and-stories.md) Epic 3 (this file). Live Dry Run is Epic 2.

---

## Quality bar (non-negotiable)

Merge a Phase 3 PR only when **all** of these are true:

1. **Progress is correct.** Completing a problem cannot mark the wrong slug, cannot drop other completions, and survives refresh.
2. **Anonymous → signed-in merge is lossless.** First login copies local progress onto the account. It does not wipe either side without an explicit user choice.
3. **Service layer stays the only data access.** UI calls `progress.service` (and later `auth`), never `localStorage` / `fetch` from components. Phase 4 must still be able to swap the adapter.
4. **Premium is honest.** If gating ships before a user table, the UI must not pretend the paywall is secure. Client-only `accessLevel` is spoofable.
5. **Generated / local-only files are not in the PR.** No `next-env.d.ts` churn, no `file:///` paths.
6. **Automated checks prove the above**, not just `nx build web`.

If any item fails: **do not merge.**

| Status | Meaning |
| --- | --- |
| `BLOCKED` | Must be fixed before that PR / sprint can merge |
| `OPEN` | Known; not merge-blocking if called out |
| `FIXED` | Verified in code + tests (or browser, for UI) |
| `WONTFIX` | Written decision with owner + reason |

---

## Current verdict

| Item | Verdict |
| --- | --- |
| **Phase 3** | **Sprint 3 Complete.** Premium UI architecture preview, honest client gating, catalog access filtering, and dual-write JSON verified. |
| **Live Dry Run** | Done (Sprints 1–4 merged into `main`). [`docs/phase-live-dry-run-quality-flags.md`](./phase-live-dry-run-quality-flags.md). |
| **Phase 2** | Done (Sprints 1–5). Trackers under `docs/phase-2-*-quality-flags.md`. |

---

## Sequencing (do not skip)

```
Live Dry Run Sprint 1  (tracer + playground stepper)  ← next; cuts ahead of Auth.js
    ↓
Sprint 1  localStorage progress + profile (no auth, no DB)
    ↓
Sprint 2  Auth.js (GitHub / Google) + merge anonymous progress
    ↓
Sprint 3  Premium UI only if some JSON is actually premium; real entitlement is Phase 4
```

**Trap:** Sprint 2 auth that writes user rows needs a database. Pick **one**:

- **A (default):** JWT session + keep progress in localStorage / cookie until Phase 4 Postgres. No second progress store.
- **B:** Thin Prisma `User` table in Sprint 2, **problems stay JSON** until Phase 4 GraphQL.

Do not build a custom user-progress API now and throw it away in Phase 4.

---

## Sprint 1 — Anonymous progress

**Branch (when opened):** `feature/phase-3-sprint-1`

Reuse what already exists:

- `UserProgress` / `UserPreferences` in `libs/shared-types`
- `visucode_uid` in `apps/web/lib/logger.ts`
- Zustand persist on preferences (`visucode-preferences`)

### Stories

- [x] `progress.service.ts` — `getProgress`, `markProblemComplete`, `markLessonComplete`. Adapter = localStorage keyed by `visucode_uid`.
- [x] Problem page: mark complete after tests pass (or explicit “Mark done”). Idempotent.
- [x] Catalog / pattern lists show completed state.
- [x] Profile page: counts from `UserProgress` (problems, lessons, current track).
- [x] No NextAuth, no Prisma, no premium in this sprint.

### Flag register (Sprint 1)

| ID | Flag | Status | Notes |
| --- | --- | --- | --- |
| F-P3S1-01 | Progress only through service layer | `FIXED` | Components must not read/write `localStorage` for completions. Strictly encapsulated in `progress.service.ts`. |
| F-P3S1-02 | Wrong slug / lost set on refresh | `FIXED` | Proved with comprehensive unit tests in `apps/web/lib/services/__tests__/progress.service.spec.ts`. |
| F-P3S1-03 | Profile matches catalog completions | `FIXED` | Proved with integration tests in `apps/web/specs/profile-page.spec.tsx` and `problem-completion.spec.tsx`. Same reactive `useUserProgress` hook. |
| F-P3S1-04 | `next-env.d.ts` / generated files | `FIXED` | 0 diff vs `main`. |

---

## Sprint 2 — Identity

**Do not start until Sprint 1 is merge-ready.**

### Stories

- [x] **Auth.js (NextAuth v5)** on Next.js 16 — GitHub + Google. Do not scaffold NextAuth v4.
- [x] Sign-in / sign-out in the header. Session on the profile page.
- [x] First login: merge anonymous `completedProblems` / `completedLessons` onto the account. Document the conflict rule (union by default).
- [x] Persistence = option A or B above, written in the PR that adds auth. Default A.

### Flag register (Sprint 2)

| ID | Flag | Status | Notes |
| --- | --- | --- | --- |
| F-P3S2-01 | Auth.js v5, not Auth v4 | `FIXED` | Standardized on `next-auth@^5.0.0-beta.32` on Next.js 16 & React 19. Proved in `apps/web/specs/auth-route.spec.ts`. |
| F-P3S2-02 | Anonymous merge is lossless | `FIXED` | Proved in `apps/web/specs/auth-identity.spec.tsx` & `progress.service.spec.ts`: complete 2 problems signed out → sign in → still 2. Local anonymous record retained. |
| F-P3S2-03 | Secrets not committed | `FIXED` | `.env.local` strictly ignored in `.gitignore`; committed `/.env.example` as configuration template. |
| F-P3S2-04 | No problem GraphQL in this sprint | `FIXED` | Option A adopted: zero Prisma / zero GraphQL in Sprint 2. JSON + `PROBLEM_INDEX` dual-write preserved. |

---

## Sprint 3 — Premium UI (thin)

Only if product needs a visible free/premium split **before** Phase 4.

### Stories

- [x] Mark a small, explicit set of JSON problems `accessLevel: 'premium'` (`trapping-rain-water`, `minimum-window-substring`, `longest-common-subsequence`).
- [x] Signed-out / free users see a gate, not a 404. Dry run / runner hidden or teaser.
- [x] Copy states this is **client-side until Phase 4**. Do not claim a secure paywall. No fake checkout.

| ID | Flag | Status | Notes |
| --- | --- | --- | --- |
| F-P3S3-01 | Premium sprint | `FIXED` | 3 problems marked `premium` across JSON and `PROBLEM_INDEX`. Dual-write verified in `specs/premium-gate.spec.tsx`. |
| F-P3S3-02 | Gate is labeled as preview | `FIXED` | Gated via `PremiumGate.tsx`. Clear disclosure that gating is client-side preview until Phase 4 backend; zero fake checkout. |

---

## Out of Phase 3 (do not pull in)

| Item | Where it belongs |
| --- | --- |
| Extra DP / graph / heap / … problems | Phase 4 (`F-P2S5-07` and siblings) |
| GraphQL / Prisma for **problems** | Phase 4 |
| Redis | Phase 4 |
| Live dry run / playground tracer (`F-P2S1-10`) | Live Dry Run epic (`docs/phase-live-dry-run-quality-flags.md`) |
| Real code sandbox (`F-P2X-01`) | Later |
| WASM canvas (`Phase 5`) | Phase 5 |

---

## Branching

Phase 2 PRs targeted **`main`**. `develop` still has superseded Sprint 1 (`#8`). **Do not fast-forward `main` from `develop`.**

Phase 3 default: `feature/phase-3-sprint-N` → `main`. Use `develop` only after it is reset to `main` and the README is updated in the same PR.

---

## Sprint 1 merge checklist (copy when asking for review)

- [x] `progress.service` is the only completion read/write
- [x] Completing a problem is idempotent; refresh keeps the set
- [x] Profile counts match catalog badges
- [x] No Auth.js / Prisma in the Sprint 1 diff
- [x] `next-env.d.ts` 0 diff vs `main`
- [x] `npx nx test web` green
- [x] This file updated (`OPEN` → `FIXED` for Sprint 1 flags)

---

## Review notes

- 2026-09-28: Plan written after Phase 2 Sprint 5 merged. Independent of any Phase 3 code.
- 2026-09-28: Live Dry Run epic inserted ahead of Auth.js. Phase 3 flag IDs unchanged.
- Owner: update statuses in the same PR that fixes the flag. Do not delete flags.
