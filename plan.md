Act as a Principal Systems Architect. We are onboarding this existing codebase into an Agentic Memory Architecture to enable seamless, token-efficient multi-session development.

Your objective is to inspect the project and bootstrap three persistent markdown files inside a new `.agent/` directory:
1. `.agent/ARCHITECTURE.md`
2. `.agent/DECISIONS.md`
3. `.agent/SESSION_STATE.md`

### Inspection Instructions
Do NOT read raw binaries, lockfiles, or large source files line-by-line. Instead, inspect only:
- Root config files (`package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `docker-compose.yml`, etc.)
- Top-level directory structure and routing/module layout
- The last 5–10 git commits (`git log -n 8 --oneline`) and current git status (`git status --short`)
- Any existing `README.md` or `.env.example`

---

### Deliverable 1: `.agent/ARCHITECTURE.md`
Keep this under 350 tokens. It must act as static, immutable context across all future sessions:
- **Core Stack:** Language, runtime, framework, UI library, database/ORM, state management.
- **Project Structure:** 1-sentence description per primary top-level directory.
- **Key Invariants & Constraints:** Strict rules (e.g., "Use Server Actions, never Route Handlers for mutations", "Strict TypeScript, no `any`", "Tailwind v4 only").
- **Core Commands:** Dev, build, test, lint, and database migrations.

### Deliverable 2: `.agent/DECISIONS.md`
Extract 3–6 foundational architectural decisions visible from the current code layout into append-only ADR format:
- `ADR-001 (Baseline)`: Primary framework/database choice and why.
- `ADR-002 (Baseline)`: Authentication/routing strategy.
- `ADR-003 (Baseline)`: Folder structure or data-fetching pattern.

### Deliverable 3: `.agent/SESSION_STATE.md`
Synthesize the current active state based on recent commits or uncommitted work:
- **Current Milestone:** High-level feature currently under construction.
- **Active Branch & Last Commit:** Exact git references.
- **Done Recently:** What was completed in the last few commits.
- **Next Immediate Steps:** The next 2–3 atomic, concrete tasks to pick up.
- **Active Pitfalls & Blockers:** Known issues, broken tests, or anti-patterns to avoid.

---

Output the raw markdown content for all three files, wrapped clearly so they can be written directly to disk.