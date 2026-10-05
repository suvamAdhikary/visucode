# ADR-005: Premium UI Architecture Preview & Honest Client Gating (Phase 3 Sprint 3)

## Status
Accepted

## Date
2026-10-05

## Context

VisuCode's long-term roadmap schedules full database infrastructure (PostgreSQL, Prisma ORM, GraphQL API, and Stripe payment processing) for Phase 4.

Phase 3 Sprint 3 addresses the product requirement for a visible free/premium split ahead of Phase 4 (`F-P3S3-01`). Per the Phase 3 quality bar (`docs/phase-3-quality-flags.md`):
> *"Premium is honest. If gating ships before a user table, the UI must not pretend the paywall is secure. Client-only `accessLevel` is spoofable. No fake checkout."*

Introducing temporary mock checkout flows, fake credit card forms, or pretending client-side gating is cryptographically secure would violate engineering integrity and mislead users.

---

## Decision

1. **Explicit Problem Tiering (`F-P3S3-01`)**:
   - Three advanced problems are classified as `accessLevel: 'premium'`:
     - `trapping-rain-water` (Two Pointers, Hard)
     - `minimum-window-substring` (Sliding Window, Hard)
     - `longest-common-subsequence` (Dynamic Programming, Medium)
   - Dual-write consistency is maintained between the problem JSON files on disk (`apps/web/content/problems/*.json`) and `PROBLEM_INDEX` in [`apps/web/lib/services/problem.service.ts`](../../apps/web/lib/services/problem.service.ts).
   - Remaining problems remain `accessLevel: 'free'`.

2. **Honest Preview Gating (`F-P3S3-02`)**:
   - Visiting a premium problem **does not result in a 404**.
   - The problem overview, metadata, examples, constraints, hints, and Complexity Panel remain fully readable on the left panel for educational value.
   - The interactive workspace (Official Dry Run, Live Dry Run, Your Code) is protected by [`apps/web/app/components/premium/PremiumGate.tsx`](../../apps/web/app/components/premium/PremiumGate.tsx).
   - The gate explicitly states:
     > **Client-Side Architecture Preview (Phase 3 Sprint 3)**:
     > True secure server entitlements, user database roles, and payment verification will be introduced in **Phase 4** with the PostgreSQL backend. There is no fake checkout or simulated payment processing.
   - Includes a "Preview Gated Visualizer & Editor" button (`[data-testid="premium-preview-unlock"]`) allowing reviewers and learners to inspect the interactive workspace.

3. **Catalog Filtering & Badge Visibility**:
   - Problems list (`/problems`) introduces an **Access** filter group (`All`, `Free`, `★ Premium`).
   - Cards display `★ Premium` (gold) or `Free` (emerald) badges for immediate visual scanning.
   - Header metadata on problem pages displays the `★ Premium` badge.

4. **Zero Deceptive Patterns**:
   - No mock payment buttons, no fake pricing tables, and no faux checkout steps.
   - Unauthenticated users are provided a standard Auth.js sign-in CTA (`signIn()`).

---

## Consequences

- **Architectural Simplicity**: Avoids throwaway mock billing endpoints before Phase 4.
- **Honest User Trust**: Learners understand the current preview state without confusion.
- **Seamless Phase 4 Migration**: When Phase 4 arrives, only `PremiumGate`'s entitlement check will be wired to the server-verified user subscription returned by GraphQL.
