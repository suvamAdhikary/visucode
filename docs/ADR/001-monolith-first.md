# ADR-001: Monolith-First Architecture

## Status
Accepted

## Date
2026-02-26

## Context
Building VisuCode as a startup product with multiple backend services planned (Problem Service, Code Executor, AI Hints, etc.). The temptation is to start with microservices from day 1.

## Decision
Start as a **Next.js monolith** in Phase 1. All data served from local JSON files through a service abstraction layer. Extract to microservices only when complexity demands it (Phase 2+).

## Rationale
1. **Faster to market** — Ship a working product in weeks, not months
2. **Avoid premature optimization** — We don't know traffic patterns yet
3. **Service abstraction layer** — Components call `getProblem()`, not `fetch('/api/problems')`. Swapping JSON → GraphQL requires changing ONE file per entity
4. **Documented migration** — Each extraction becomes an ADR and a PR, showcasing real system design thinking
5. **Industry standard** — Shopify, Netflix, Uber all started as monoliths

## Consequences
- Phase 1 is a single Next.js deployment (Vercel)
- All data models include future-proof fields (userId, accessLevel, role)
- Service layer is the only data access point — no direct JSON imports in components
- Each Phase 2+ extraction is a documented architectural decision
