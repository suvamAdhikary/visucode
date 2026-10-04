# ADR-004: Auth.js v5 Identity, JWT Session Strategy, and Lossless Anonymous Account Merge

## Status
Accepted

## Date
2026-10-03

## Context

Phase 3 Sprint 2 introduces developer identity, social sign-in (GitHub and Google OAuth), and account-level progress persistence to VisuCode.

Per [`docs/phase-3-quality-flags.md`](../phase-3-quality-flags.md), full backend database infrastructure (PostgreSQL, Prisma, GraphQL) is scheduled for Phase 4. Introducing temporary database schemas, migrations, or throwaway REST endpoints in Sprint 2 would violate the monolithic roadmap and create maintenance overhead.

Two architectural options were evaluated:
- **Option A (Accepted)**: Auth.js NextAuth v5 with JWT session strategy (`session: { strategy: 'jwt' }`) and user-keyed client storage. Zero database / zero Prisma.
- **Option B**: Scaffold a thin Prisma `User` table ahead of the Phase 4 schema.

Option A was selected to preserve architectural simplicity, avoid throwaway code, and maintain instant client performance with zero database cold starts.

## Decision

1. **Auth.js v5 (NextAuth v5) on Next.js 16 ([`F-P3S2-01`](../phase-3-quality-flags.md))**:
   - The application standardizes strictly on Auth.js v5 (`next-auth@^5.0.0-beta.32`).
   - NextAuth v4 is deprecated for React 19 and Next.js 16 App Router and is strictly disallowed.
   - Central configuration resides in [`apps/web/auth.ts`](file:///apps/web/auth.ts), exporting `{ handlers, auth, signIn, signOut }`.
   - API route handler resides in [`apps/web/app/api/auth/[...nextauth]/route.ts`](file:///apps/web/app/api/auth/[...nextauth]/route.ts) re-exporting `GET` and `POST`.

2. **JWT Session Strategy & OAuth Providers ([`F-P3S2-03`](../phase-3-quality-flags.md))**:
   - Sessions use stateless JWT tokens encrypted with `AUTH_SECRET` (fallback for dev provided).
   - Configured with **GitHub** and **Google** OAuth 2.0 providers.
   - Secrets are strictly managed through environment variables (`AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_SECRET`).
   - `.env.local` is git-ignored, and [`/.env.example`](file:///.env.example) is committed as the reference template.

3. **Lossless Anonymous Account Merge Engine ([`F-P3S2-02`](../phase-3-quality-flags.md))**:
   - When an anonymous user logs in, their anonymous progress (`completedProblems`, `completedLessons`) is merged onto their authenticated account.
   - **Conflict Rule (Set Union)**:
     - `completedProblems`: `Array.from(new Set([...anon.completedProblems, ...authUser.completedProblems]))`
     - `completedLessons`: `Array.from(new Set([...anon.completedLessons, ...authUser.completedLessons]))`
     - `currentTrack`: Authenticated user's track, or anonymous track if authenticated user has not set one.
     - `currentLesson`: `Math.max(authUser.currentLesson, anon.currentLesson)`
   - **Lossless Guarantee**: Anonymous progress records stored under `visucode_progress_${anonId}` are **never deleted or wiped**. If the user signs out, their anonymous local state remains intact.
   - Operations are strictly idempotent; repeated login triggers or multi-tab sessions never duplicate entries.

4. **Service-Layer Encapsulation**:
   - All identity transitions and progress storage are handled through [`apps/web/lib/services/progress.service.ts`](file:///apps/web/lib/services/progress.service.ts).
   - `setActiveUserId(authUserId)` and `clearActiveUserId()` dynamically switch active storage keys while maintaining cache stability for `useSyncExternalStore`.
   - UI components consume `useUserProgress()` and `useSession()`, never accessing `localStorage` directly.

5. **Zero GraphQL / Zero Prisma in Sprint 2 ([`F-P3S2-04`](../phase-3-quality-flags.md))**:
   - Problem catalogs remain statically typed JSON with `PROBLEM_INDEX`.
   - No GraphQL client or Prisma client is introduced in this sprint.

## Consequences

- **Instant Zero-Latency Auth**: JWT session checks require zero remote database roundtrips.
- **Zero Data Loss on Login**: Users who solve problems before creating or linking an account never lose their solved problems or track position.
- **Clean Phase 4 Upgrade Path**: When PostgreSQL lands in Phase 4, only the internal persistence adapter inside `progress.service.ts` will be connected to GraphQL; all client components (`Navbar`, `ProfileClient`, `ProblemCompletionToggle`, `CatalogCard`) remain untouched.
