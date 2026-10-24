# 🗺️ VisuCode Roadmap

**Last Updated: October 2026**

This roadmap outlines the development journey of VisuCode from MVP to a production-ready DSA learning platform. Each phase builds incrementally, validating assumptions before adding complexity.

---

## ✅ Done

### Phase 1 — MVP Foundation (Completed)

**Goal**: Validate core value proposition with minimal viable product

- ✅ Nx monorepo architecture with `@visucode/web` and `libs/shared-types`
- ✅ Landing page with design system and hero section
- ✅ Learn pages: tracks → lessons → animated exercises
- ✅ Problem browser with URL-based filters (difficulty, pattern, category)
- ✅ **Dry Run Viewer** (core feature):
  - Array visualizer with pointer labels and swap animations
  - Step controller with play/pause, speed control, keyboard shortcuts
  - Variable inspector showing live state changes
  - Code highlighting synchronized to execution line
- ✅ Zustand stores for visualizer state and user preferences
- ✅ Vercel deployment with automatic deploys from `main` branch
- ✅ Initial problem set across multiple patterns

**Key Decision**: Monolith-first architecture ([ADR-001](docs/ADR/001-monolith-first.md)) — no premature microservices, GraphQL, or backend. JSON files as data source to ship fast and validate demand.

---

### Phase 2 — Content & Rich Visualizers (Completed)

**Goal**: Expand problem coverage and data structure visualization capabilities

- ✅ Pattern detail pages with strategy explanations
- ✅ Core problems across 12+ patterns:
  - Two Pointers, Sliding Window, Binary Search
  - Linked Lists, Trees, Hash Maps, Stacks/Queues
  - Intervals, Graph/BFS, Heaps, Tries
  - Dynamic Programming, Backtracking
- ✅ Monaco editor integration for code playground
- ✅ Client-side test runner with worker-based execution
- ✅ **Specialized visualizers** for each data structure:
  - Linked list with node pointers and cycle detection
  - Binary tree and BST with level-order layout
  - Hash map with bucket visualization
  - Stack/queue with push/pop animations
  - Interval timeline with merge/overlap highlighting
  - Graph with adjacency list and BFS/DFS traversal
  - Trie with prefix path highlighting
  - Min/max heap with parent-child relationships
  - DP table with cell dependencies
  - Backtracking decision tree

**Key Decision**: DOM-based visualizers over Canvas for accessibility and GPU-accelerated CSS animations. Canvas planned for Phase 5 when rendering 1000+ elements.

---

### Live Dry Run Engine — User-Generated Visualizations (Completed)

**Goal**: Enable users to dry run and visualize their own custom JavaScript code

**Plan**: [`docs/phase-live-dry-run-quality-flags.md`](docs/phase-live-dry-run-quality-flags.md) · **ADR**: [`docs/ADR/002-live-dry-run-tracer.md`](docs/ADR/002-live-dry-run-tracer.md)

- ✅ **Sprint 1 — JavaScript Tracer Foundation**:
  - Input preflight validation (syntax validation, infinite loop protection, timeout detection)
  - Dedicated Web Worker tracer with execution caps and early abort
  - Playground stepper UI for stepping through user execution
  - Diagnostics popup for runtime exceptions and syntax errors
- ✅ **Sprint 2 — On-the-Fly Visualization**:
  - 1D array state inference from runtime snapshots
  - 2D array / matrix visualization
  - Object structure rendering
- ✅ **Sprint 3 — Data Structure Heuristics & Problem Integration**:
  - Linked list detection (objects with `.next` pointer chains)
  - Binary tree detection (nodes with `.left` / `.right`)
  - Problem page "Dry Run My Code" live tab
- ✅ **Sprint 4 — Complexity Analysis**:
  - Official Complexity Panel with asymptotic Big-O runtime and auxiliary space analysis
  - Granular "Why this complexity" breakdowns
  - Big-O growth curve chart visualizing scalability classifications

**Key Decision**: Tracer runs strictly inside a Web Worker to prevent UI lockup. Pre-authored JSON dry runs remain as official solution tapes, while user code execution provides interactive experimentation.

---

### Phase 3 — User System, Identity & Premium Preview (Completed)

**Goal**: Frictionless anonymous learning, seamless identity upgrades, and honest premium tiering

**Plan**: [`docs/phase-3-quality-flags.md`](docs/phase-3-quality-flags.md) · **ADRs**: [`docs/ADR/003-client-side-anonymous-progress.md`](docs/ADR/003-client-side-anonymous-progress.md), [`docs/ADR/004-authjs-v5-identity-and-merge.md`](docs/ADR/004-authjs-v5-identity-and-merge.md), [`docs/ADR/005-premium-ui-preview.md`](docs/ADR/005-premium-ui-preview.md)

- ✅ **Sprint 1 — Anonymous-First Progress**:
  - `progress.service` client-side state engine with localStorage persistence
  - Reactive updates using `useSyncExternalStore`
  - Profile page with completion statistics (problems solved, tracks followed)
  - Instant value without requiring upfront authentication
- ✅ **Sprint 2 — Auth.js v5 Integration & Lossless Account Merge**:
  - NextAuth v5 (Auth.js beta) configured with GitHub and Google OAuth providers
  - JWT session strategy with production secret enforcement (`AUTH_SECRET`)
  - Lossless anonymous account merge engine: combines anonymous progress with authenticated accounts on login via set union (`F-P3S2-02`)
- ✅ **Sprint 3 — Premium UI Architecture Preview & Honest Gating**:
  - Explicit problem tiering marking advanced problems (`trapping-rain-water`, `minimum-window-substring`, `longest-common-subsequence`) as `accessLevel: 'premium'`
  - Honest preview gate (`PremiumGate.tsx`): left column (descriptions, hints, complexity explainer) remains fully open; interactive workspace is protected by an honest preview gate
  - Zero deceptive patterns: no fake checkouts, no simulated billing flows; clear disclosure that real database entitlements launch in Phase 4 (`F-P3S3-02`)
  - Problem catalog Access filter (`All`, `Free`, `★ Premium`) and pattern page premium badges

**Key Decision**: Anonymous-first UX removes all initial barriers. Auth.js v5 handles OAuth and lossless migration. Paywalls remain completely honest ahead of Phase 4 database billing.

---

### CI/CD & Portfolio Showcase (Completed)

**Goal**: Establish automated quality pipelines and production portfolio readiness

- ✅ GitHub Actions CI workflow running on all pushes and PRs:
  - Linting (ESLint across workspace)
  - Testing with Jest and coverage reporting
  - Production Next.js build verification on Node.js 20
- ✅ Documentation preview showcase with high-resolution screenshot (`docs/screenshots/preview.png`)
- ✅ MIT Open Source License (`LICENSE`)
- ✅ Synchronized architecture documentation, ADRs, and roadmaps

---

## 📅 Next

### Phase 4 — Backend Infrastructure, Database & Production Entitlements

**Goal**: Scalable data layer, persistent user database, and server-verified billing

- [ ] **PostgreSQL Database & Prisma ORM**:
  - Persistent user accounts and cross-device cloud progress synchronization
  - Problem metadata and solutions stored in relational models
- [ ] **GraphQL API (Apollo Server / Yoga)**:
  - Service abstraction layer swap (`problem.service.ts`, `progress.service.ts`) with zero UI component changes
- [ ] **Redis Layer**:
  - Query caching and submission rate limiting
- [ ] **Stripe Subscription Billing**:
  - Real server-verified entitlement checks replacing client-side preview gating
  - Webhook handlers for subscription lifecycles (activation, cancellation, grace periods)

**Key Decision**: The service abstraction layer established in Phase 1 pays off — transitioning from local JSON and localStorage to GraphQL and PostgreSQL requires updating service files with zero UI regressions.

---

## 🔮 Later

### Phase 5 — Scale & Performance

**Goal**: Support 1,000+ element visualizations and collaborative learning features

- [ ] **Rust → WASM Canvas Visualizer**:
  - High-performance rendering for 10K+ array elements and massive graph topologies
  - GPU-accelerated rendering via WebGL
- [ ] **Real-Time Multiplayer Dry Runs**:
  - Synchronized step-through execution with peers
  - WebSocket coordination server for pair programming and classroom study
- [ ] **Admin Analytics & Problem Telemetry**:
  - Difficulty calibration from anonymous step completion rates
  - Common bug pattern detection from tracer diagnostics

---

## 🎯 Engineering Standards & Target Metrics

We prioritize verified engineering rigor and honest evaluation over unproven metrics:

### Proven Engineering Standards (Phases 1–3)
- **CI Quality Gate**: Automated test suite passing in GitHub Actions on every push and PR
- **Strict Typing**: Zero TypeScript compiler errors across all monorepo packages (`tsc --noEmit`)
- **Thread Safety**: 100% Web Worker sandboxing preventing user code from blocking the UI thread
- **Lossless State Transitions**: Verified set-union logic preserving anonymous progress upon OAuth sign-in
- **Honest Gating**: Zero deceptive mock payment flows or fake checkouts ahead of Phase 4 database entitlements

### Target Metrics (Future Phases)
- **Phase 4 Target**: Low-latency GraphQL queries and resilient webhook delivery for billing events
- **Phase 5 Target**: 60 FPS hardware-accelerated Canvas rendering for large data sets (10,000+ elements)

---

## 🔑 Key Architectural Decisions

1. **Monolith-First ([ADR-001](docs/ADR/001-monolith-first.md))**  
   Start with Next.js App Router monolith; extract microservices only when specific compute bottlenecks (e.g. distributed code execution) arise.

2. **Web Worker Code Sandboxing ([ADR-002](docs/ADR/002-live-dry-run-tracer.md))**  
   User-submitted code is instrumented and executed in dedicated Web Workers with preflight timeouts and step caps, never blocking the main UI thread.

3. **Anonymous-First Progress Persistence ([ADR-003](docs/ADR/003-client-side-anonymous-progress.md))**  
   Learners get full utility immediately using local storage without forced sign-ups.

4. **Auth.js v5 Identity & Lossless Merge ([ADR-004](docs/ADR/004-authjs-v5-identity-and-merge.md))**  
   Stateless JWT session authentication with automated set-union merging of local progress upon OAuth login.

5. **Honest Premium UI Architecture Preview ([ADR-005](docs/ADR/005-premium-ui-preview.md))**  
   Transparent client-side gating preview without deceptive mock checkouts, paving a clear migration path to Phase 4 PostgreSQL entitlements.

---

## 📬 Feedback & Contributing

Have suggestions or questions? Open a [GitHub Issue](https://github.com/suvamAdhikary/visucode/issues) or reach out to the project maintainer.
