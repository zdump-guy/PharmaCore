# Operations Runbook & SRE Procedures

## 1. Emergency Maintenance Mode Activation

When performing critical database migrations or disaster recovery:
1. In the Supabase SQL Editor or via Developer Console (`DeveloperConsole.tsx`), update `public.site_content`:
   ```sql
   UPDATE public.site_content 
   SET content = jsonb_set(content, '{maintenance_mode}', 'true'::jsonb)
   WHERE id = 'global_settings';
   ```
2. The application will render `components/MaintenanceScreen.tsx` for all non-developer visitors.

---

## 2. Admin User Provisioning

To provision a new Super Admin or Mentor:
1. As Developer (`dev`), navigate to `/admin` $\to$ **Users** tab.
2. Fill out user email, full name, temporary password, and assign role (`super_admin` or `mentor`).
3. If assigning a Mentor, select the specific assigned courses.
4. The system provisions the user with `must_change_password = true`, requiring a password reset on first login.

---

## 3. Disabling Student Self-Registration

If platform student capacity is reached:
1. Navigate to `/admin` $\to$ **Settings** $\to$ **Registration**.
2. Toggle "Allow Open Registration" to `Off`.
3. The API endpoint `/api/admin/settings/signup` will update global state, and `/api/students/signup` will immediately block new registrations.
