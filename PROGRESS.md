# Progress

Source of truth: this file, `DECISIONS.md`, `PROJECT.md`, and the code/database.
The original chat brief was stale about Phase 4; the correction is recorded in `DECISIONS.md`.

## Current database state
- Local PostgreSQL database: `apartment_manager`
- Tables: `societies`, `users`, `units`, `payments`, `issues`
- Last checked 2026-11-23: 2 societies, 5 users, 3 units, 0 payments, 0 issues
- `users.mobile_number`, `unit_id`, `must_change_password`, `session_id`, `last_active_at` all exist

## Done

### Phase 1 — Planning
- Project brief, build phases and constraints agreed. Canonical brief now lives in `PROJECT.md`.

### Phase 2 — Basic app
- Express server on port 5000, CORS, JSON body parsing, connected to PostgreSQL via `pg` + `dotenv`.
- Vite + React frontend in `client/`, ESLint configured.
- `GET /api/users` returns real DB rows scoped by the token's `society_id`.

### Phase 3 — Authentication
- `POST /api/auth/signup` — society + admin in one DB transaction; bcrypt hashing.
- `POST /api/auth/login` — accepts `email` OR `mobileNumber` + password; JWT (8h expiry); 10-digit mobile validation.
- `verifyToken` protects routes, scopes `society_id` from the JWT, enforces the 30-minute idle session, and now blocks every protected route with `403 PASSWORD_CHANGE_REQUIRED` while `must_change_password` is true. Only `/api/auth/set-initial-password` and `/api/auth/logout` are exempt.
- Single active session: second login gets HTTP 409; logout clears the session; idle timeout frees it automatically. Setting in `server/config.js`.
- `POST /api/auth/set-initial-password`, `POST /api/auth/logout`.

### Phase 4 — Resident management (backend + UI done)
Backend:
- `units` table with `UNIQUE(society_id, unit_number)`.
- `GET /api/units`, `POST /api/units` (admin only).
- `GET /api/residents` (admin only, society scoped, never selects a password hash, reports `must_change_password` and `has_active_session`), `POST /api/residents` (admin only; verifies the unit belongs to the caller's society; 10-digit mobile validation; friendly 409 on duplicate mobile).
- `POST /api/residents/:id/reset-password` (admin only, own society only) — new bcrypt hash, new one-time temp password, `must_change_password = true`, and session cleared. `POST /api/residents/:id/force-logout` (admin only, own society only) — clears the session without changing the password.
- Temporary password: bcrypt hash stored, plain value returned once in the create response, never logged or stored.
- `requireRole(...)` middleware.
- Backend commits: `fe8d298`, `a682323`.

Frontend:
- Login accepts one "mobile number or email" field. Friendly errors for wrong details, blocked second login (409), and server problems.
- `client/src/api.js` attaches the Bearer token, handles network failures, and clears the session + redirects to login on 401.
- Forced first-login password screen (`SetInitialPassword.jsx`).
- Admin screen (`ManageResidents.jsx`) to add/list units and residents, with a unit dropdown and a one-time temporary-password panel.
- Each resident row has **Reset password** and **Force logout** buttons with confirmation prompts; both reuse the same one-time password panel where relevant.
- Simple large-button styling, role-based nav, responsive layout.
- 10-digit mobile validation on both client and server.

### Cleanup commit
- `GET /api/users` is now admin-only (`verifyToken` + `requireRole('admin')`), still society scoped.
- Frontend no longer calls `/api/users` as a resident and hides the user list for them.
- Signup now validates email format and a minimum 8-character password.
- Replaced the single `server/db/schema.sql` with numbered files in `server/db/migrations/` (001 societies through 005 issues) plus a README. These describe the current schema for fresh installs; they are not run automatically and were not applied to the live DB.
- GitHub remote: `origin` → `https://github.com/PruthviRajSolase/apartment-manager.git` (public).

### Housekeeping
- Created `PROGRESS.md`, `DECISIONS.md`, `PROJECT.md`.
- Removed an accidental duplicate `/set-initial-password` route from `server/routes/auth.js`.
- Fixed a git filename case mismatch: `client/src/login.jsx` is now tracked as `Login.jsx`, matching the import in `App.jsx` (Windows ignored the difference; Linux would not).

## Not done yet
- Signup screen (society creation is still Thunder Client / API only).
- Actual delivery of credentials to the resident's mobile number (shown on screen only).
- Phases 5–10: maintenance, issues, billing, expenses, dashboards/reports, testing & deployment.

## Next
1. Signup screen.
2. Phase 5 maintenance.

## Testing notes
- Backend: `cd server && npm run dev` (port 5000).
- Frontend: `cd client && npm run dev`.
- API testing: Thunder Client in VS Code.
- After each feature, test as two different societies to confirm tenant isolation.
- See "Verification" below for what was automated on 2026-11-23 and what still needs a human at the keyboard.

## Verification (2026-11-23)
### Cleanup commit — automated (all passed)
- `npm run lint` and `npm run build`.
- 10 API checks: bad email and short password rejected at signup, valid signup still works, admin can use `/api/users`, resident gets a role-based 403, resident creation/login/password set still work.
- Confirmed no code references the removed `schema.sql`; DB counts unchanged after throwaway data cleanup.

### Reset + force logout commit — automated (all passed)
- `npm run lint` and `npm run build`.
- 17 API checks: reset returns a 10-character one-time password with no hash, old token becomes 401, old password fails, new temp password logs in and re-triggers the forced password gate, role check works, force logout makes the token 401 and clears the session flag, admin B cannot reset or log out society A's resident (404), bad id 400, resident cannot call admin routes.
- Source scanned: no password or temp password is logged or stored in localStorage. DB counts unchanged after cleanup.

### Earlier Phase 4 verification — automated (all passed)
- `npm run lint` and `npm run build` in `client/`.
- 28 API-level checks against a temporary local server with throwaway data: signup of two societies, admin/mobile/resident login, unit and resident creation, one-time password response with no hash, duplicate mobile 409, 10-digit validation, cross-society isolation of units/residents and unit-ownership check, server-side password gate on three different routes (403), logout exemption, set-initial-password and gate release, wrong password 401, second-login 409, invalid token 401, logout/re-login.
- Throwaway rows were deleted afterwards; DB counts returned to 2 societies / 5 users / 3 units / 0 payments / 0 issues.

Manual (need a real browser):
- Clicking through admin: create unit, add resident, copy the one-time password.
- Resident mobile login and the forced password screen.
- Duplicate-mobile and blocked-login error messages rendering in the UI.
- 401 redirect behaviour from a stale/expired token.
- Visual check on a narrow screen for older users.
- Clicking **Reset password** and **Force logout** for a resident, including the confirmation prompts and the one-time password panel.
- Confirming a resident who has been force-logged-out is sent back to the login screen.
