# ADR-0005 — In-Memory Sliding Window Rate Limiting Engine

## Status
Accepted

## Date
2026-09-01

## Context
Public write endpoints (questions, feedback, signup) require protection against automated spam and DoS flooding. Introducing external Redis dependencies would add infrastructure overhead for initial deployments.

## Decision
We implemented a self-contained in-memory sliding window rate limiter in `lib/rateLimit.ts` with real-IP extraction header precedence and automatic memory eviction.

## Rationale
- Zero additional cloud infrastructure or latency overhead.
- Protects each serverless instance against burst floods.
- Clear migration path to Upstash Redis for distributed global synchronization when scaled.
