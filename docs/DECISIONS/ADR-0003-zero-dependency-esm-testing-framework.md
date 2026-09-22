# ADR-0003 — Zero-Dependency Native Node.js ESM Testing Framework

## Status
Accepted

## Date
2026-08-20

## Context
Standard testing frameworks (Jest, Vitest) introduce large dependency footprints (>150MB of node_modules, Babel/SWC transpilation layers, and long cold-start initialization times).

## Decision
We built a custom, zero-dependency Node.js ESM test runner in `tests/helpers/test_framework.mjs`.

## Rationale
- Zero additional npm dependencies.
- Sub-3-second execution time for 9 comprehensive test suites across 200+ test assertions.
- Operates natively in Node.js 20+ ESM.

## Consequences
- Requires using our standardized assertion primitives (`describe`, `it`, `expect`).
