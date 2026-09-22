# ADR-0002 — Supabase PostgreSQL with Non-Recursive RLS & RBAC

## Status
Accepted

## Date
2026-08-16

## Context
PharmaCore requires a multi-tier role authorization model (`dev`, `super_admin`, `mentor`, `student`, `anon`). In traditional PostgreSQL RLS setups, querying `public.users` within an RLS policy on `public.users` causes infinite recursion (PostgreSQL error `42P17`).

## Decision
We implemented a non-recursive `SECURITY DEFINER` function:
```sql
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;
```
All table RLS policies query `public.get_user_role()` instead of sub-selecting from `public.users`.

## Rationale
- Eliminates RLS recursion entirely.
- Centralizes role lookups with query plan caching via `STABLE`.
- Enforces strict security through `SET search_path = public`.

## Consequences
- Requires granting `EXECUTE` on `public.get_user_role()` to `anon, authenticated, service_role`.
