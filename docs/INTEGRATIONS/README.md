# External Integrations & Services Reference

This directory documents the configuration, integration architecture, security boundaries, and failure modes for all external third-party services utilized by PharmaCore.

---

## Integration Index

| Integration | Primary Responsibility | Documentation |
|---|---|---|
| **Supabase** | PostgreSQL database, JWT authentication, and Realtime event streams. | [SUPABASE.md](./SUPABASE.md) |
| **Resend** | Transactional email delivery for Q&A notifications and broadcasts. | [RESEND.md](./RESEND.md) |
| **UploadThing** | Secure presigned file ingress for audio records and PDF handouts. | [UPLOADTHING.md](./UPLOADTHING.md) |
| **Vercel** | Edge network hosting, serverless compute, and Web Vitals analytics. | [VERCEL.md](./VERCEL.md) |
