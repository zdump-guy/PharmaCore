# PharmaCore — Security Architecture & Threat Defense

## 1. Security Philosophy

PharmaCore treats security as an **engineered property of the system**, adhering to a zero-trust, defense-in-depth model across the Edge, Application, Database, and Storage tiers.

---

## 2. Security Documentation Index

| Document | Focus Area | Description |
|---|---|---|
| [**Security Model**](./SECURITY_MODEL.md) | Defense-in-Depth Topology | Multi-layered perimeter security, trust boundaries, and isolation. |
| [**Threat Model**](./THREAT_MODEL.md) | STRIDE Threat Matrix | Systematic threat identification across all endpoints and actor roles. |
| [**Authentication & RBAC**](./AUTHENTICATION_AND_RBAC.md) | Role Matrix & Permissions | Non-recursive role resolver, session security, and privilege separation. |
| [**Input Validation & Sanitization**](./INPUT_VALIDATION_AND_SANITIZATION.md) | Injection Immunity | Zod schema validation, Unicode control character scrubbing, and XSS defense. |
| [**Secrets & Configuration**](./SECRETS_AND_CONFIG.md) | Zero-Leak Policy | Environment variable isolation matrix and key rotation procedures. |
| [**Security Audit Checklist**](./SECURITY_AUDIT_CHECKLIST.md) | 22-Domain Compliance | Authoritative matrix mapping 22 security domains to passing test suites. |
