# Troubleshooting & Debugging Guide

## 1. Supabase RLS Permission Denials

- **Symptom**: PostgreSQL returns error `42501 (insufficient_privilege)`.
- **Diagnosis**:
  1. Inspect whether the calling user has a row in `public.users`.
  2. Test `SELECT public.get_user_role();` in Supabase SQL editor as the target user.
  3. For mentors, verify that a record exists in `public.mentor_course_assignments` for the target course.

---

## 2. Rate Limit Triage

- **Symptom**: Legitimate users receive HTTP `429 Too Many Requests`.
- **Diagnosis**:
  1. Check `Retry-After` response header.
  2. Check if a proxy or shared IP is sending high request volume.
  3. In `lib/rateLimit.ts`, inspect real-IP header resolution order (`x-vercel-forwarded-for` -> `cf-connecting-ip` -> `x-real-ip` -> `x-forwarded-for` -> `socket.remoteAddress`).

---

## 3. Resend Email Dispatch Failures

- **Symptom**: Mentor notifications or announcement emails are not delivered.
- **Diagnosis**:
  1. Inspect `RESEND_API_KEY` validity in environment variables.
  2. Verify sender domain verification in Resend dashboard (`RESEND_FROM_EMAIL`).
  3. Check student `email_notifications_enabled` preference in `public.users`.
