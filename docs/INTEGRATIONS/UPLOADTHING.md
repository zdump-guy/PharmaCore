# Integration: UploadThing (File Upload & CDN)

## 1. Overview & Purpose
UploadThing handles staff file uploads (PDF handouts, audio recordings, lecture voice notes, course thumbnails) directly to a dedicated S3-backed CDN (`utfs.io`).

---

## 2. Configuration & Keys

| Variable | Scope | Purpose | Sensitive |
|---|---|---|:---:|
| `UPLOADTHING_TOKEN` | Server-Only | Unified UploadThing authentication token for server routes. | Yes |
| `UPLOADTHING_SECRET` / `UPLOADTHING_APP_ID` | Server-Only | Legacy UploadThing API credentials (supported as fallback). | Yes |

---

## 3. Implementation & Security Model

- **Backend Handler**: `pages/api/uploadthing.ts` delegates to `server/uploadthing.ts`.
- **Pre-Upload Auth Middleware**: Validates user session and verifies `get_user_role() IN ('dev', 'super_admin', 'mentor')`.
- **Allowed MIME Types**: Restricted to `application/pdf` (32MB), audio files (16MB), and images (8MB).
