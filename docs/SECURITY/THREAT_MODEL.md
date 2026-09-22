# STRIDE Threat Model & Security Analysis

## 1. STRIDE Threat Assessment Matrix

| Threat Category (STRIDE) | Attack Vector | Potential Impact | Implemented Mitigations |
|---|---|---|---|
| **Spoofing Identity** | Attacker impersonates an instructor or another student. | Unauthorized course modification or answering questions as instructor. | Supabase cryptographic JWTs, strict Bearer header token validation, non-recursive `get_user_role()` DB check. |
| **Tampering with Data** | Student attempts to self-approve course enrollment or change role to `super_admin`. | Privilege escalation and unauthorized curriculum access. | Database RLS policy `Students can request enrollment` strictly requires `status = 'pending'`, role check constraints. |
| **Repudiation** | Staff member denies performing administrative deletion or broadcast. | Lack of accountability for administrative actions. | `public.analytics_events` logging, audit metadata (`updated_by`, `resolved_by`), serverless execution logs. |
| **Information Disclosure** | Scraping student email addresses from public community Q&A. | Privacy leak and unsolicited phishing targeting students. | Column Level Security (CLS) revokes direct `SELECT` on `author_email` on `public.community_questions`. |
| **Denial of Service (DoS)**| Automated bots flooding question/feedback forms with spam. | Server resource exhaustion, email quota depletion, DB bloat. | Cloudflare Turnstile token validation + in-memory sliding window rate limiting on all write endpoints. |
| **Elevation of Privilege** | Student manipulates client-side form payloads to execute admin APIs. | Unauthorized access to admin management console. | Server-side role inspection on all `/api/admin/*` routes; client-side route guards in `pages/admin/index.tsx`. |
