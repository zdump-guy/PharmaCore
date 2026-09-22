# PharmaCore — Database Architecture & Storage

## 1. Overview

PharmaCore is backed by **PostgreSQL 15** managed through **Supabase**. The database layer is architected with strict Row Level Security (RLS), Column Level Security (CLS), idempotent schema migrations, and high-performance composite indexes.

---

## 2. Database Documentation Index

| Section | Focus Area | Description |
|---|---|---|
| [**Schema Reference**](./SCHEMA.md) | Table-by-Table Reference | Detailed field definitions, data types, defaults, and constraints for all 13 tables. |
| [**Entity Relationships**](./RELATIONSHIPS.md) | ER Diagrams & Integrity | Mermaid ER diagrams, foreign key cascades, and orphan prevention rules. |
| [**Migration History**](./MIGRATIONS.md) | Changelog & Rollbacks | Chronological log of migrations (`00` to `03`) and deployment procedures. |
| [**Queries & Indexes**](./QUERIES_AND_INDEXES.md) | Performance Tuning | Complete reference for all 20 indexes and optimized query access patterns. |

---

## 3. Database Core Rules

1. **Strict Dependency Order**: Tables are created in strict foreign-key order (`users` $\to$ `courses` $\to$ `lectures` $\to$ `resources` $\to$ `quizzes` $\to$ `questions`).
2. **Non-Recursive RLS**: All administrative RLS policies query the `get_user_role()` function rather than re-selecting from `public.users` in a nested query.
3. **Idempotent Migrations**: All migration scripts use `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, and exception-handled constraint creation blocks.
