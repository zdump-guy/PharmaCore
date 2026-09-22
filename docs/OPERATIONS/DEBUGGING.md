# Troubleshooting & Debugging Guide

## 1. Cloudflare Turnstile Verification Failures

- **Symptom**: Form submission returns `400 Bad Request: Invalid Turnstile challenge`.
- **Diagnosis**:
  1. Check browser console for Turnstile iframe load errors.
  2. Verify that `NEXT_PUBLIC_TURNSTILE_SITE_KEY` matches the site key in Cloudflare dashboard.
  3. Verify `TURNSTILE_SECRET_KEY` in server environment.
  4. In local development, verify `lib/turnstile.ts` fallback is active when using dummy keys.

---

## 2. Supabase RLS Permission Denials

- **Symptom**: PostgreSQL returns error `42501 (insufficient_privilege)`.
- **Diagnosis**:
  1. Inspect whether the calling user has a row in `public.users`.
  2. Test `SELECT public.get_user_role();` in Supabase SQL editor as the target user.
  3. For mentors, verify that a record exists in `public.mentor_course_assignments` for the target course.

---

## 3. Rate Limit Triage

- **Symptom**: Legitimate users receive HTTP `429 Too Many Requests`.
- **Diagnosis**:
  1. Check `Retry-After` response header.
  2. Check if a proxy or shared IP is sending high request volume.
  3. In `lib/rateLimit.ts`, inspect real-IP header resolution.
