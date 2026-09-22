# PharmaCore — API Reference & Gateway

## 1. Overview

PharmaCore exposes **21 internal Next.js Serverless API endpoints** under `pages/api/` and integrates with 5 external cloud APIs.

---

## 2. API Index

| Category | Endpoint Count | Focus Area |
|---|:---:|---|
| [**Internal APIs**](./INTERNAL_APIS.md) | 21 | Student registration, enrollment, notifications, Q&A, feedback, curriculum authoring, and analytics. |
| [**External APIs**](./EXTERNAL_APIS.md) | 5 | Supabase PostgREST & Auth, Resend, UploadThing, Cloudflare Turnstile, and YouTube. |

---

## 3. Standard Response Formats

### Success Response Envelope (HTTP 200 / 201)
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully."
}
```

### Error Response Envelope (HTTP 400 / 401 / 403 / 404 / 429 / 500)
```json
{
  "success": false,
  "error": "Error identifier or code",
  "message": "Human-readable description of what failed."
}
```

---

## 4. HTTP Status Code Taxonomy

| Code | Status | Meaning in PharmaCore |
|---|---|---|
| `200` | OK | Request succeeded and returned requested payload. |
| `201` | Created | Resource successfully created (question, feedback, enrollment). |
| `400` | Bad Request | Zod validation failed, missing parameters, or invalid format. |
| `401` | Unauthorized | Missing or expired Supabase Bearer token. |
| `403` | Forbidden | Valid token but insufficient role privileges (`get_user_role()`). |
| `404` | Not Found | Target course, lecture, or user record does not exist. |
| `405` | Method Not Allowed | HTTP method is not supported on this endpoint. |
| `429` | Too Many Requests | Rate limit threshold exceeded; check `Retry-After` header. |
| `500` | Internal Server Error | Unhandled server exception (sanitized in production). |
