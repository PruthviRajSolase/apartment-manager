# Decisions

Recorded choices. Do not reverse any of these without asking the owner first.

## Stack and constraints
- Frontend: React (Vite), ESLint. Backend: Node.js + Express. Database: PostgreSQL (local DB `apartment_manager`) via `pg` + `dotenv`.
- Auth: bcrypt password hashing, JWT with 8h expiry, `cors` enabled.
- Development cost Rs 0 where realistically possible: free/open-source tools and free tiers. Unavoidable future costs (production hosting, domain, SMS/OTP, payment gateway, storage) are deferred, not built now.
- Web application, not a per-apartment Flutter APK. May become a mobile experience later (PWA or similar).
- API tested with Thunder Client in VS Code.

## Architecture
- True multi-tenant SaaS from day one: many societies on one system. Every society-owned row is scoped by `society_id`.
- `society_id` is ALWAYS derived from the verified JWT — never accepted from client input.
- Central portal with a main administrator/authority account.
- Role-based dashboards and access. Planned roles: Main Administrator, Society Head, Secretary, Treasurer, Maintenance Manager, other staff, Residents.
- IMPORTANT: only `admin` and `resident` are actually implemented in code today. Do not assume the other roles work yet.

## Resident onboarding and credentials
- No open signup for residents. Admin pre-creates unit numbers and assigns members.
- Login is mobile number + password for residents. Admins currently log in with email + password; the backend accepts either identifier in one route.
- OTP was dropped to avoid SMS cost.
- Credential flow: system-generated initial credentials, forced password change on first login (`must_change_password`), after which users cannot change their own password — only a higher authority can reset it. Admin reset issues a new one-time temp password, sets `must_change_password = true`, and clears the resident's session so the old token dies immediately.
- Resident creation currently returns the temporary password in the API response. No SMS delivery — notifications are post-v1.

## Sessions
- Single active session per account. A second login is blocked (HTTP 409) while the account has an active session.
- A session counts as dead after 30 minutes of inactivity so users never get locked out. Starting value is in `server/config.js` (`SESSION_IDLE_MINUTES`).
- Implemented with `session_id` and `last_active_at` columns on `users`, checked in `verifyToken`.

## Payments (v1)
- Manual verification only: resident uploads payment screenshot + UTR; admin approves or rejects; status updates automatically on approval.
- Automated UTR matching and auto receipts are FUTURE, not v1.

## Issues (v1)
- Ticket flow: Reported -> Acknowledged -> Assigned -> In Progress -> Resolved -> Closed.
- Note: the current `issues.status` column defaults to `'open'`. Align it with the named flow when Phase 6 is built.

## Implementation details already chosen
- `users.email` is `NOT NULL UNIQUE`, so resident rows get a placeholder: `${mobileNumber}@no-email.local`.
- Roles are stored as a plain `VARCHAR` in `users.role`, not a database enum, to keep them configurable.

## Post-v1 ideas (do NOT build now)
Automated payment verification/receipts, notifications (email/SMS/WhatsApp), maintenance reminders, auto monthly maintenance generation, advanced reports, announcements, staff/vendor management, visitor/parking management, document management, multi-society admin features, subscription SaaS model.

## Database migrations
- The schema is stored as numbered files in `server/db/migrations/`, one file per table (001 societies, 002 units, 003 users, 004 payments, 005 issues), applied in that order on a fresh database.
- They are documentation for fresh installs/disaster recovery only. There is no automatic migration runner, and they were NOT applied to the existing `apartment_manager` database.

## Session decisions (2026-11-23)
- The original brief is stale about Phase 4. Code + database are treated as the source of truth.
- The duplicated `/set-initial-password` route in `server/routes/auth.js` was an accidental paste and was removed.
- The project is hosted publicly at `https://github.com/PruthviRajSolase/apartment-manager`. Secrets stay out via `.gitignore`.
- `GET /api/users` is admin-only; residents must not call it.
- Force logout is a separate admin action from password reset: reset also ends the session, while force logout ends a session without changing any password.
- The global 401 clear-and-redirect in `api.js` does not apply to `/api/auth/login` or `/api/auth/signup`; those must show their own error messages on the same screen.
