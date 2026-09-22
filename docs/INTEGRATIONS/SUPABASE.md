# Integration: Supabase (PostgreSQL, Auth & Realtime)

## 1. Overview & Purpose
Supabase provides the foundational data and identity layer for PharmaCore, encompassing a managed PostgreSQL database, JWT-based user authentication, and WebSocket Realtime publications.

---

## 2. Configuration & Secrets

| Variable | Scope | Purpose | Sensitive |
|---|---|---|:---:|
| `NEXT_PUBLIC_SUPABASE_URL` | Client & Server | Supabase project API gateway URL. | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client & Server | Public anonymous key subject to RLS policies. | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-Only | Privileged master key bypassing RLS for administrative operations. | Yes |

---

## 3. Clients Architecture

1. **Anonymous / Client SDK (`lib/supabaseClient.ts`)**:
   - Initialized with `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - Used for public queries and client-side auth state listeners.
   - All queries are restricted by Row Level Security and Column Level Security.

2. **Privileged Server SDK (`lib/supabaseAdmin.ts`)**:
   - Initialized with `SUPABASE_SERVICE_ROLE_KEY`.
   - Used exclusively inside serverless API routes (`pages/api/`) after verifying user permissions.
   - Never bundled into client-side JavaScript.

---

## 4. Failure Modes & Recovery

- **Connection Drop**: Supabase client automatically retries failed network queries with exponential backoff.
- **JWT Expiry**: The client SDK automatically uses the `refresh_token` stored in local storage to acquire fresh access tokens without forcing user logout.
