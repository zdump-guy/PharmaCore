# ADR-0006 — UploadThing for Authenticated Staff File Ingress

## Status
Accepted

## Date
2026-09-07

## Context
Staff instructors need to upload audio recordings (voice notes) and PDF handouts without routing large multi-megabyte binary payloads through Next.js serverless API memory limits.

## Decision
We integrated **UploadThing** via `server/uploadthing.ts` and `@uploadthing/react`, enforcing staff authentication before presigned upload tokens are issued.

## Rationale
- Direct chunked client-to-CDN upload eliminates serverless compute memory bottlenecks.
- Built-in MIME-type validation and file size caps (32MB PDF, 16MB Audio).
- Isolated asset domain (`utfs.io`) prevents malicious file execution on the application server.
