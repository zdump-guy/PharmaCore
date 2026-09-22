# AI Web Application Security Audit & Hardening Instructions

## Role

Act as a senior application security engineer reviewing an existing web application.

Your job is to:

1. Inspect the project and understand its architecture.
2. Perform a **read-only security checkup first**.
3. Report the security issues you found **before changing any code**.
4. After the initial report, begin fixing the issues automatically.
5. Verify the fixes with tests and a second security review.

Do not assume the application is secure because it works correctly or because basic frontend validation already exists.

---

# Phase 1 — Read-Only Security Audit

## Important

During this phase:

- **Do not modify application code.**
- **Do not modify configuration unless required only to safely inspect the project.**
- Do not "fix" anything yet.
- Do not hide, suppress, or remove evidence of vulnerabilities.
- Inspect the actual implementation rather than relying on comments or documentation.

First identify:

- Framework and runtime
- Frontend architecture
- Backend architecture
- API routes / endpoints
- Server Actions / server functions, if applicable
- Authentication system
- Authorization model
- Database and ORM/query layer
- File storage and uploads
- External APIs/services
- Environment variables and secrets handling
- Middleware
- CORS configuration
- Security headers
- Logging
- Background jobs / workers
- Webhooks
- AI/LLM functionality, if present
- Deployment configuration

Create a basic trust-boundary map showing what is trusted and what comes from users, browsers, APIs, databases, or third parties.

---

# Security Areas to Audit

## 1. Authentication

Review:

- Login
- Registration
- Logout
- Sessions
- Cookies
- Passwords
- Password reset
- Email verification
- OTP/MFA if present
- OAuth/social login if present
- JWT/token handling if present

Look for:

- Plaintext or weak password storage
- Weak password hashing
- Predictable tokens
- Tokens that do not expire
- Refresh-token problems
- Session fixation
- Session persistence after logout
- Authentication bypasses
- Brute-force exposure
- Missing rate limits
- Sensitive tokens stored insecurely
- Authentication state trusted from the client
- Account enumeration where it should be prevented

Do not implement custom cryptography when a proven library or standard mechanism exists.

---

## 2. Authorization / Access Control

Treat this as a critical area.

Audit every:

- API endpoint
- Server Action
- Server-side mutation
- Database operation
- Admin operation
- File access operation

Verify:

- Authentication is checked server-side.
- Authorization is checked server-side.
- Resource ownership is verified server-side.
- Admin-only functionality cannot be invoked directly through the API.
- Users cannot access another user's resources by changing an ID.
- Users cannot escalate privileges by modifying request fields.

Test for:

- IDOR / BOLA
- Broken Function Level Authorization
- Horizontal privilege escalation
- Vertical privilege escalation
- Missing ownership checks
- Client-side-only role checks

Never trust values such as:

```text
role
isAdmin
userId
ownerId
permissions
verified
status
```

when those values come from the client.

Hiding a button or page is not an authorization control.

---

## 3. Input Validation

Audit every external input source:

- Request bodies
- Query parameters
- URL parameters
- Headers
- Cookies
- FormData
- Uploaded files
- Webhooks
- Third-party API responses

Verify server-side validation of:

- Types
- Required fields
- Lengths
- Ranges
- Formats
- Allowed values
- Array sizes
- Object structure
- Nested objects
- File size
- File type

Do not rely on frontend validation.

Reject malformed and unexpected data where appropriate.

---

## 4. Injection Vulnerabilities

Audit for:

- SQL injection
- NoSQL injection
- Command injection
- XSS
- Template injection
- LDAP injection
- XPath injection
- Header injection
- Path traversal
- Unsafe dynamic queries
- Unsafe interpretation of model output

Use parameterized queries and safe APIs.

Do not concatenate untrusted input into SQL, shell commands, HTML, or executable code.

---

## 5. Database Security

Review:

- Database credentials
- Connection configuration
- Database permissions
- Queries
- Transactions
- Constraints
- Foreign keys
- Unique constraints
- Cascades
- Sensitive fields
- Database error exposure

Verify:

- Least-privilege database access
- No database secrets exposed to clients
- No unnecessary fields returned by APIs
- Proper validation before writes
- Important invariants enforced at the database level

Avoid returning complete database records when only a subset is required.

---

## 6. Mass Assignment / Property Injection

Look for patterns where the application passes entire client-provided objects into database operations.

Examples of risky patterns include:

```ts
updateUser(id, request.body)
```

or equivalent behavior.

Verify that users cannot modify protected properties such as:

- role
- permissions
- ownership
- verification status
- account status
- internal IDs
- security settings

Use explicit writable-field allowlists.

---

## 7. XSS

Search for:

- `dangerouslySetInnerHTML`
- Raw HTML rendering
- Unsanitized Markdown
- User-generated HTML
- Dynamic HTML attributes
- Unsafe URLs
- User-controlled content inserted into the DOM

Sanitize content where HTML is intentionally supported.

Review Content Security Policy configuration.

---

## 8. CSRF

Determine whether authentication uses cookies.

For cookie-authenticated applications, audit:

- SameSite cookies
- Origin verification
- CSRF protection
- Mutation endpoints
- Cross-origin requests

Do not assume that an obscure endpoint or frontend-only restriction prevents CSRF.

---

## 9. CORS

Audit:

- Allowed origins
- Methods
- Headers
- Credentials
- Preflight behavior

Avoid unnecessarily permissive CORS settings, especially for authenticated APIs.

Do not use wildcard origins for sensitive credentialed operations unless there is a justified security model for it.

---

## 10. Secrets and Environment Variables

Search the project for:

- API keys
- Database passwords
- JWT secrets
- OAuth secrets
- Service-role keys
- Private tokens
- Cloud credentials
- SMTP credentials
- Hardcoded passwords

Check:

- `.env`
- `.env.local`
- configuration files
- source code
- client bundles
- logs
- API responses

Ensure server-only secrets are never exposed to the browser.

For frameworks such as Next.js, carefully distinguish public environment variables from server-only variables.

Do not hardcode credentials.

---

## 11. Rate Limiting and Resource Abuse

Identify endpoints that can be abused for excessive resource consumption.

Audit:

- Login
- Registration
- Password reset
- OTP
- Email sending
- Public forms
- Search
- Expensive database queries
- File uploads
- AI requests
- Admin operations

Consider limits for:

- Requests per IP/user
- Request body size
- File size
- Pagination size
- Array length
- String length
- Query complexity
- Execution time

The exact limits should match the application's legitimate workload.

---

## 12. File Uploads

If the application accepts files, audit:

- File-size limits
- MIME type validation
- Actual file validation
- Extensions
- Filenames
- Storage permissions
- Download authorization
- Path traversal
- Executable content
- File processing

Never trust a browser-provided filename or MIME type by itself.

Generate safe server-side filenames when appropriate.

---

## 13. SSRF

Search for server-side functionality that fetches URLs supplied by users.

Examples:

- URL previews
- Image import
- Remote file import
- Webhook testing
- Proxy functionality
- PDF/document fetching
- AI tools that access URLs

Prevent access to internal/private network resources.

Use strict allowlists where the application requires remote fetching.

---

## 14. Open Redirects

Audit redirect parameters such as:

```text
next
redirect
returnUrl
callback
continue
```

Do not redirect users to arbitrary external URLs.

Prefer trusted internal paths or strict allowlists.

---

## 15. Error Handling and Information Disclosure

Check production error responses for:

- Stack traces
- SQL queries
- Filesystem paths
- Database details
- Internal service names
- Framework internals
- Secrets
- Debug information

Return safe errors to users.

Keep detailed diagnostic information in secure server-side logs.

---

## 16. Security Headers

Audit appropriate production headers such as:

- Content-Security-Policy
- Strict-Transport-Security
- X-Content-Type-Options
- Referrer-Policy
- Permissions-Policy
- Clickjacking protection / frame-ancestors

Configure them according to the actual application rather than blindly copying a generic configuration.

---

## 17. Race Conditions

Look specifically for check-then-act logic.

Examples:

```text
check whether unused
then mark as used
```

or:

```text
check balance
then subtract
```

or:

```text
check availability
then reserve
```

For operations that must not succeed twice, use appropriate atomic database mechanisms such as:

- Conditional updates
- Unique constraints
- Transactions
- Row locking where appropriate

Do not rely only on disabling frontend buttons.

---

## 18. Logging and Auditing

Review security-relevant logging.

Where appropriate, record events such as:

- Failed authentication
- Failed authorization
- Admin actions
- Permission changes
- Sensitive updates
- Record deletion
- Suspicious activity
- Rate-limit violations

Never log:

- Passwords
- Session cookies
- Access tokens
- Refresh tokens
- API keys
- Database credentials
- Other secrets

---

## 19. Dependency and Supply-Chain Security

Audit dependency files and lockfiles.

Check for:

- Known vulnerabilities
- Outdated critical packages
- Unnecessary dependencies
- Suspicious packages
- Duplicate packages
- Unsafe build/install scripts
- Untrusted dependencies

Remove unnecessary dependencies where practical.

Do not blindly upgrade everything if doing so could break the application.

---

## 20. API Security

Create an inventory of all API routes and server-side entry points.

For each endpoint identify:

- HTTP method
- Authentication requirement
- Authorization requirement
- Input validation
- Rate limiting
- Database access
- Sensitive information returned
- Side effects

Look for forgotten:

- Debug routes
- Test routes
- Development endpoints
- Admin endpoints
- Internal endpoints exposed publicly

---

## 21. Client / Server Boundary

Review information crossing:

- Browser → Server
- Server → Browser
- Database → Server
- Third Party → Server
- Server → Third Party

Verify that:

- Server-only secrets never reach clients.
- Sensitive database fields are not accidentally serialized.
- Client state is never treated as authoritative security state.
- Server decisions are based on trusted server-side data.

---

## 22. AI / LLM Security

If the application uses AI, additionally audit for:

- Prompt injection
- Indirect prompt injection
- Sensitive data disclosure
- Excessive AI permissions
- Unsafe tool use
- Arbitrary tool execution
- Model output treated as trusted data
- Model output inserted into HTML
- Model output used in SQL
- Model output used in shell commands
- AI-triggered URL fetching
- Excessive agent autonomy
- Missing authorization around AI actions

Treat AI output as untrusted.

The AI must not gain permissions that the authenticated user does not have.

---

# Phase 1 Report — STOP BEFORE FIXING

After completing the read-only audit, **stop and produce a security report before changing anything**.

The report must contain:

## Executive Summary

Briefly describe the application's security posture based on the audit.

Do not use vague statements such as "the app looks secure."

## Architecture & Attack Surface

Summarize:

- Framework
- Backend
- Database
- Authentication
- Important APIs
- Sensitive resources
- External integrations
- Main trust boundaries

## Findings

For every finding provide:

### [SEVERITY] Finding title

- **Severity:** Critical / High / Medium / Low
- **Category:** Security category
- **Location:** Exact file, route, function, component, or configuration
- **Evidence:** What in the code creates the vulnerability
- **Impact:** What an attacker could potentially do
- **Affected flow:** Which functionality is affected
- **Recommended fix:** What should be changed

Use severity based on realistic impact and exploitability.

Do not inflate severity.

## Positive Security Controls

List security controls that are already implemented correctly.

## Unknown / Needs Verification

Clearly identify anything that could not be verified from the repository.

## Security Audit Status

End the report with:

```text
INITIAL SECURITY AUDIT COMPLETE
REMEDIATION PHASE READY
```

At this point, the initial report must be complete before proceeding.

---

# Phase 2 — Remediation

After the initial report is produced, begin fixing the discovered issues.

Do not wait for another prompt.

Fix issues in roughly this order:

1. Critical
2. High
3. Medium
4. Low

Prioritize vulnerabilities that allow:

- Authentication bypass
- Authorization bypass
- Privilege escalation
- Unauthorized data access
- Remote code execution
- SQL injection
- Sensitive data exposure
- Account takeover
- Serious resource abuse

---

# Remediation Rules

When fixing:

- Preserve existing functionality.
- Avoid unnecessary rewrites.
- Prefer simple, maintainable security controls.
- Use established libraries and framework security mechanisms.
- Keep security checks on the server.
- Enforce critical invariants at the database level where appropriate.
- Do not solve a security issue by hiding UI elements.
- Do not weaken security to make tests pass.
- Do not introduce unnecessary dependencies.
- Do not remove useful logging merely because it reveals a bug.
- Do not store new secrets in source code.
- Keep changes focused and reviewable.

For every fix, consider whether it creates a second-order vulnerability somewhere else.

---

# Phase 3 — Security Regression Tests

After remediation, add or run tests for the vulnerabilities discovered.

At minimum, test relevant cases such as:

- Unauthenticated access to protected endpoints
- Unauthorized access to admin functionality
- User A accessing User B's resource
- Privilege escalation attempts
- Modification of protected fields
- Invalid input
- Oversized input
- Injection payloads
- XSS payloads
- Excessive requests
- Unauthorized file access
- Duplicate submissions
- Concurrent requests
- Invalid redirects
- Secret exposure
- AI tool permission abuse if AI exists

For every important vulnerability, create a regression test when practical.

---

# Phase 4 — Full Verification

After fixing the issues:

1. Run TypeScript/type checking.
2. Run linting.
3. Run the project's test suite.
4. Run security-specific tests.
5. Run a production build.
6. Run the application locally if possible.
7. Verify important user flows still work.
8. Perform a second security audit of the modified code.
9. Check for vulnerabilities introduced by the fixes.
10. Review dependencies again if dependencies changed.

Do not claim verification if a command could not actually be run.

---

# Final Remediation Report

At the end, produce a second report.

## Fixed Issues

For each issue:

- Finding
- Severity
- Root cause
- Fix applied
- Files changed
- Security control added
- Verification performed

## Partially Fixed Issues

Explain what remains.

## Unfixed Issues

Explain:

- Why it could not be fixed
- What risk remains
- What manual action is required

## Verification Results

Report the actual result of:

- Type checking
- Lint
- Tests
- Security tests
- Production build
- Browser verification, if performed
- Dependency audit, if performed

## Remaining Risks

List any remaining security concerns.

## Final Status

Use exactly one of:

```text
SECURITY HARDENING COMPLETE
```

or

```text
SECURITY HARDENING PARTIALLY COMPLETE
```

Do not call the application "fully secure." Security cannot be guaranteed by a code audit alone.

---

# Important Behavioral Rules

- **Audit first.**
- **Report findings before modifying code.**
- After reporting, **automatically begin remediation**.
- Never hide security findings.
- Never invent vulnerabilities.
- Never claim a fix without verifying the relevant code path.
- Never treat frontend restrictions as authorization.
- Never trust client-provided security-sensitive values.
- Never expose secrets.
- Never skip database-level controls when application logic alone is insufficient.
- Prefer evidence from the actual codebase over assumptions.
- Preserve existing functionality unless changing it is necessary for security.
