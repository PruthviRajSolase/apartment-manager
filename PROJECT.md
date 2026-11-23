# Project Brief — Apartment / Society Maintenance & Issue Management System

Companion files: `PROGRESS.md` (done / next) and `DECISIONS.md` (choices already made; do not reverse without asking).
Read all three at the start of every session.

**Note:** this file was written from the original chat brief on 2026-11-23. The brief claimed Phase 4 backend work was "not yet built", but code + database showed it was built and committed. Those statements have been corrected below. `DECISIONS.md` records this.

## 1. What this project is
A web application that replaces scattered paper, WhatsApp and spreadsheet-based apartment/society management with one centralized, simple, reliable, low-cost, maintainable and expandable system.
Focus: maintenance tracking, payment tracking/verification, issue reporting, billing, expense management. Advanced security and complex infrastructure are NOT the focus at this stage.

## 2. About the owner (how to work with them)
- Complete beginner at web development, learning JS/React/Node separately. The AI writes most of the code.
- Before implementing, present a short plan (files to change, DB changes, API routes) and wait for approval.
- After implementing, explain in plain language what was built and how to test it.
- Prefer small, surgical changes over rewrites. Do not refactor unrelated code.
- Be direct and concise. Do not over-engineer.
- Commit to git after each working feature.

## 3. Hard constraints
- Development cost Rs 0 wherever realistically possible: free/open-source tools, frameworks, DB, free hosting tiers.
- Unavoidable future costs (production hosting, domain, SMS/OTP, payment gateway, storage) are acceptable later, not now.
- Web application, not a per-apartment Flutter APK. May become a mobile experience later (PWA or similar).
- Residents include older, non-tech-savvy people: UI must be very simple with quick access to key features.

## 4. Tech stack (decided)
- Frontend: React (Vite), ESLint
- Backend: Node.js + Express
- Database: PostgreSQL (local DB: `apartment_manager`), via `pg` + `dotenv`
- Auth: bcrypt password hashing, JWT (8h expiry)
- Other: cors enabled; API tested with Thunder Client in VS Code
- Project root: `D:\Apartment_Manager` with `client/` and `server/` folders, git initialized

## 5. Architecture
- True multi-tenant SaaS from day one: many societies on one system. Every society-owned row is scoped by `society_id`. `society_id` comes from the verified JWT, never from client input.
- Central portal with a main administrator/authority account.
- Roles (configurable per apartment): Main Administrator, Society Head, Secretary, Treasurer, Maintenance Manager, other staff, Residents. Dashboards and access are role-based.
- Only `admin` and `resident` are implemented in code today.

## 6. Core business rules
Resident onboarding:
- No open signup for residents. Admin pre-creates room/unit numbers and assigns members.
- System sends login credentials to the resident's mobile number. (Not sent automatically yet — the temporary password is shown once on screen; SMS is post-v1.)
- Login is mobile number + password. OTP was dropped to avoid SMS cost.
- Credential flow: initial credentials, forced password change on first login, after which users cannot change their own password; only a higher authority can reset it. (Higher-authority reset route is not built yet.)

Single active session per account:
- A second login is blocked while the account has an active session.
- A session counts as dead after an inactivity timeout (30 min starting value) so users never get locked out.
- Implemented with `session_id` and `last_active_at` columns on `users`, checked in the auth middleware.

Maintenance payments (v1 is manual):
- Resident uploads payment screenshot + UTR; admin approves or rejects; status updates automatically on approval.
- Automated verification (UTR matching, auto receipts) is a FUTURE version, not v1.

Issue reporting:
- Ticket flow: Reported -> Acknowledged -> Assigned -> In Progress -> Resolved -> Closed.

## 7. Build phases
1 Planning
2 Basic app (frontend, backend, DB, navigation)
3 Authentication
4 Resident management
5 Maintenance
6 Issue management
7 Billing
8 Expense management
9 Dashboards & reports
10 Testing & deployment

## 8. Current state
Backend / database:
- Express server connected to local PostgreSQL via `pg` + `dotenv`.
- Tables: `societies`, `users`, `units`, `payments`, `issues`. Test data exists for societies/users/units; payments and issues are empty.
- `mobile_number`, `unit_id`, `must_change_password`, `session_id`, `last_active_at` columns exist on `users`.
- Society signup creates society + admin in one transaction; bcrypt hashing.
- Email/mobile login issues a JWT (8h expiry). `verifyToken` protects routes and scopes `society_id` from the token.
- Single-session logic: second login blocked (409), logout frees the session, 30-min idle timeout frees it without explicit logout.
- `must_change_password` is enforced server-side in `verifyToken` on all protected routes except logout and set-initial-password.
- Units + residents routes exist (admin-only writes, society-scoped reads, including `GET /api/residents`).
- `GET /api/users` is admin-only and returns real DB rows scoped by the token's society.
- The schema lives in numbered files under `server/db/migrations/` (one per table). They are for fresh installs only and are not run automatically; the existing database was not touched when the old single `schema.sql` was split.

Frontend:
- Vite + React app in `client/`, ESLint configured.
- Login accepts mobile number or email; friendly errors for wrong details, duplicate mobile, and blocked second login.
- Forced first-login password-change screen.
- Admin screens for units and residents, including one-time display of the temporary password.
- Small `api.js` helper adds the token and redirects to login on 401.
- 10-digit mobile validation on both client and server.

## 9. Future ideas (POST-V1, DO NOT BUILD NOW)
Automated payment verification/receipts, notifications (email/SMS/WhatsApp), maintenance reminders, auto monthly maintenance generation, advanced reports, announcements, staff/vendor management, visitor/parking management, document management, multi-society admin features, subscription SaaS model.

## 10. Working rules for the AI
1. Read this file, `PROGRESS.md` and `DECISIONS.md` at the start of every session.
2. One feature at a time. Plan first, wait for approval, then implement.
3. Never trust a client-supplied `society_id`; always derive it from the token.
4. After each feature: give the owner exact steps to test it (including as different roles and across two societies to confirm tenant isolation), commit to git, update `PROGRESS.md`.
5. If something here conflicts with what you find in the code, stop and ask rather than guessing.
