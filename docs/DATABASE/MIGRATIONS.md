# Database Migration History & Rollback Procedures

## 1. Migration Log & History

| Migration Script | Milestone | Key Changes Introduced | Status |
|---|:---:|---|:---:|
| `supabase/00_complete_production_schema.sql` | M2 | Consolidated schema: 12 base tables, non-recursive `get_user_role()`, `handle_new_user()` trigger, 20 high-performance indexes, RLS policies. | Applied |
| `supabase/01_audio_records_and_quiz_pdf_migration.sql` | M4 | Added `public.audio_records` table and `pdf_url` / `solution_pdf_url` columns to `public.quizzes`. | Applied |
| `supabase/02_anonymous_qa_and_rate_limits.sql` | M3 | Added `is_anonymous` column to `community_questions` and Column Level Security (CLS) protecting `author_email`. | Applied |
| `supabase/03_notifications_and_qa_hub.sql` | M5 | Added `public.notifications` table and `email_notifications_enabled` column on `public.users`. | Applied |

---

## 2. Migration Execution Standard

Every migration script is required to satisfy 4 invariants:
1. **Idempotence**: Scripts must be re-runnable on both empty and populated databases without throwing duplicate table or constraint exceptions (`IF NOT EXISTS`, `DROP CONSTRAINT IF EXISTS`).
2. **Transaction Scoping**: Migrations must wrap all operations inside `BEGIN; ... COMMIT;` blocks to ensure atomic execution.
3. **Role Defaulting**: Any user insertion must strictly default role to `'student'` to prevent privilege escalation.
4. **Security Definer Function Hardening**: Functions running with `SECURITY DEFINER` must explicitly declare `SET search_path = public` to prevent search path hijacking.

---

## 3. Rollback & Disaster Recovery Procedures

### Reverting Column Additions
```sql
BEGIN;
ALTER TABLE public.users DROP COLUMN IF EXISTS email_notifications_enabled;
ALTER TABLE public.quizzes DROP COLUMN IF EXISTS pdf_url;
ALTER TABLE public.quizzes DROP COLUMN IF EXISTS solution_pdf_url;
COMMIT;
```

### Reverting Table Creation
```sql
BEGIN;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.audio_records CASCADE;
COMMIT;
```
