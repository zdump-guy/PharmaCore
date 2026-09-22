# Secrets Management & Configuration Reference

## 1. Environment Variable Reference Matrix

| Variable Name | Client-Exposed? | Required in Prod? | Purpose | Default / Fallback |
|---|:---:|:---:|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Yes | Supabase project API gateway endpoint. | — |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Yes | Public Supabase anonymous key. | — |
| `SUPABASE_SERVICE_ROLE_KEY` | **No (Server Only)** | Yes | Privileged service key for serverless admin client. | — |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`| Yes | Yes | Cloudflare Turnstile public widget key. | Dummy test key in dev |
| `TURNSTILE_SECRET_KEY` | **No (Server Only)** | Yes | Secret key to verify Turnstile challenges. | Dummy test key in dev |
| `RESEND_API_KEY` | **No (Server Only)** | Yes | Resend transactional email API token. | Logs to console in dev |
| `RESEND_FROM_EMAIL` | **No (Server Only)** | Yes | Sender email address for notifications. | `notifications@pharmacore.edu` |
| `UPLOADTHING_TOKEN` | **No (Server Only)** | Yes | Unified UploadThing authentication token. | — |
| `NEXT_PUBLIC_SITE_URL` | Yes | Optional | Canonical production URL for SEO/OG tags. | `NEXT_PUBLIC_VERCEL_URL` |

---

## 2. Zero-Leakage Policy & Best Practices

1. **`NEXT_PUBLIC_` Prefix Isolation**: Only variables that are safe for public browser inspection may carry the `NEXT_PUBLIC_` prefix.
2. **Never Commit Secrets**: `.env.local` is explicitly listed in `.gitignore`. Only sanitized template files (`.env.example`) are committed to version control.
3. **Key Rotation Plan**:
   - In the event of an accidental secret disclosure, rotate the affected key immediately in the provider console (Supabase, Resend, or UploadThing) and update Vercel environment variables.
