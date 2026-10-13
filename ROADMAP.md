# 🗺️ VisuCode Roadmap

**Last Updated: October 13, 2026**

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

**Key Decision**: Monolith-first architecture — no premature microservices, GraphQL, or backend. JSON files as data source to ship fast and validate demand.

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

## 🚧 In Progress

### Phase 2.5 — Portfolio & CI Infrastructure (Current Sprint)

**Goal**: Make VisuCode production-ready as a portfolio showcase

- 🚧 GitHub Actions CI pipeline:
  - Lint job (ESLint across all projects)
  - Test job (Jest with coverage reporting)
  - Build job (Next.js production build)
  - CI status badge in README
- 🚧 Enhanced README:
  - CI badge, license badge
  - Live demo link prominently placed
  - Screenshot/GIF placeholder for visual preview
- 🚧 ROADMAP.md documenting Done/In Progress/Next/Later with key decisions

**Key Decision**: CI before scaling — ensure code quality gates are in place before expanding team or adding contributors.

---

## 📅 Next

### Live Dry Run — User-Generated Visualizations

**Goal**: Let users visualize their own code, not just pre-authored dry runs

**Plan**: [`docs/phase-live-dry-run-quality-flags.md`](docs/phase-live-dry-run-quality-flags.md)  
**ADR**: [`docs/ADR/002-live-dry-run-tracer.md`](docs/ADR/002-live-dry-run-tracer.md)

#### Sprint 1: JavaScript Tracer Foundation
- Input preflight validation (syntax check, timeout detection)
- Worker-based tracer with capabilities detection and early abort
- Playground stepper UI for step-through execution
- Diagnostics popup for buggy code (infinite loops, runtime errors)

#### Sprint 2: On-the-Fly Visualization
- 1D array inference from snapshots (`[1, 2, 3]`)
- 2D array/matrix visualization (`[[1, 2], [3, 4]]`)
- Object structure rendering (nested objects, arrays)

#### Sprint 3: Data Structure Heuristics
- Linked list detection (objects with `.next` pointers)
- Binary tree detection (objects with `.left`/`.right`)
- Problem page "Dry run my code" button

#### Sprint 4: Complexity Analysis (parallel with Sprints 2-3)
- Official time/space complexity panel
- "Why this complexity" explanations
- Small Big-O visualization (graph showing growth rates)

**Key Decision**: Tracer runs in Web Worker to prevent UI blocking. Authored JSON dry runs remain as official solution tapes — user code visualizations are supplementary for learning.

**Later Enhancement** (`F-LDR-X-01`): Good/bad code analysis comparing user solutions with optimal patterns.

---

### Phase 3 — User System & Progress Tracking

**Goal**: Persistent progress and identity without forcing sign-up

**Plan**: [`docs/phase-3-quality-flags.md`](docs/phase-3-quality-flags.md)  
**ADR**: [`docs/ADR/003-client-side-anonymous-progress.md`](docs/ADR/003-client-side-anonymous-progress.md), [`docs/ADR/004-authjs-v5-identity-and-merge.md`](docs/ADR/004-authjs-v5-identity-and-merge.md)

#### Sprint 1: Anonymous Progress
- `progress.service` with localStorage persistence
- Profile page showing completion stats (problems solved, patterns practiced)
- No authentication required — instant value

#### Sprint 2: Auth.js Integration
- GitHub OAuth provider
- Google OAuth provider
- Merge anonymous progress on first sign-in
- Session management with JWT

#### Sprint 3: Premium UI Scaffolding
- "Premium" badge on selected problems (JSON-driven)
- Gated content UI (modal/paywall screen)
- No actual payment processing yet — deferred to Phase 4

**Key Decision**: Anonymous-first approach removes friction. Auth.js v5 chosen for OAuth provider flexibility and session management.

---

## 🔮 Later

### Phase 4 — Backend & GraphQL

**Goal**: Scalable data layer and premium content enforcement

- [ ] GraphQL API with Apollo Server
- [ ] PostgreSQL database with Prisma ORM
- [ ] Redis for caching and rate limiting
- [ ] Service layer abstraction maintained → zero UI changes needed
- [ ] Stripe integration for premium subscriptions
- [ ] Real entitlement checks (not just UI-level gates)

**Key Decision**: Service abstraction from Phase 1 pays off — swapping JSON for GraphQL = change one file, no component refactoring.

---

### Phase 5 — Scale & Performance

**Goal**: Support 1000+ element visualizations and real-time features

- [ ] Rust → WASM Canvas visualizer
  - Handles large datasets (10K+ array elements, massive graphs)
  - GPU-accelerated rendering via WebGL
- [ ] Real-time multiplayer dry runs (collaborative learning)
- [ ] WebSocket server for live sessions
- [ ] Admin analytics dashboard (user metrics, problem difficulty calibration)

**Key Decision**: Canvas/WebGL only when DOM animations hit limits. Premature optimization avoided until we hit actual performance bottlenecks.

---

## 🎯 Success Metrics

We track qualitative validation over vanity metrics:

- **Phase 1-2**: Direct user feedback (5 interviews minimum per phase)
- **Live Dry Run**: Time-to-first-visualization < 10 seconds
- **Phase 3**: Anonymous-to-authenticated conversion rate
- **Phase 4**: Premium subscription retention after first month
- **Phase 5**: Visualizer performance at 10K elements < 100ms render time

---

## 🔑 Key Architectural Decisions

### 1. Monolith-First ([ADR-001](docs/ADR/001-monolith-first.md))
Start with Next.js monolith, split into microservices only when specific scaling constraints emerge (e.g., tracer needs isolated compute).

### 2. Local JSON → GraphQL Migration Path
Service abstraction layer (`problem.service.ts`, `lesson.service.ts`) means data source is swappable without touching React components.

### 3. Server Components by Default
Next.js App Router — server components for static content (landing, problem descriptions), client components only for interactivity (visualizers).

### 4. Worker-Based Execution
All user code runs in Web Workers to prevent main thread blocking and enable sandboxing.

### 5. Anonymous-First UX
Let users try full features without signup. Authentication is opt-in for persistence and premium content.

---

## 📬 Feedback

Have suggestions or want to prioritize a feature? Open a [GitHub Discussion](https://github.com/suvamAdhikary/visucode/discussions) or reach out via [email](mailto:contact@visucode.dev).
