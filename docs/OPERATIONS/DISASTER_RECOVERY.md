# Disaster Recovery & Rollback Protocols

## 1. Database Point-in-Time Recovery (PITR)

If catastrophic data corruption occurs:
1. Access Supabase Project Dashboard $\to$ **Database** $\to$ **Backups**.
2. Select target Point-in-Time timestamp prior to the incident.
3. Initiate restore to a temporary instance or execute recovery in-place.

---

## 2. Compromised Secret Key Rotation Protocol

If a production secret is leaked or compromised:
1. **Supabase Service Role Key**:
   - In Supabase Dashboard $\to$ **Settings** $\to$ **API**, generate a new service role secret.
   - Immediately update `SUPABASE_SERVICE_ROLE_KEY` in Vercel project environment settings.
   - Trigger a project redeploy.
2. **Resend API Key**:
   - Generate a replacement token in Resend dashboard.
   - Update `RESEND_API_KEY` in Vercel.
3. **UploadThing Token**:
   - Rotate token in UploadThing dashboard and update `UPLOADTHING_TOKEN`.
