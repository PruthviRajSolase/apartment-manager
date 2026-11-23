# Progress

Source of truth: this file, `DECISIONS.md`, and the code/database.
The original project brief in chat is out of date — it lists Phase 4 backend work as "not built" even though it is built and committed. See `DECISIONS.md`.

## Current database state (checked 2026-11-23)
- Local PostgreSQL database: `apartment_manager`
- Tables: `societies`, `users`, `units`, `payments`, `issues`
- Rows: 2 societies, 5 users, 3 units, 0 payments, 0 issues
- `users.mobile_number`, `users.unit_id`, `users.must_change_password`, `users.session_id`, `users.last_active_at` all exist

## Done

### Phase 1 — Planning
- Project brief, build phases and constraints agreed.

### Phase 2 — Basic app
- Express server on port 5000, CORS, JSON body parsing, connected to PostgreSQL via `pg` + `dotenv`.
- Vite + React frontend in `client/`, ESLint configured.
- `GET /api/users` returns real DB rows; frontend renders them live.

### Phase 3 — Authentication
- `POST /api/auth/signup` — creates a society + its admin in one DB transaction; bcrypt password hash.
- `POST /api/auth/login` — accepts `email` OR `mobileNumber` plus password; JWT (8h expiry).
- `verifyToken` middleware protects routes; `society_id` always comes from the JWT, never from client input.
- `GET /api/users` is scoped by `society_id` from the token.
- Single active session: `session_id` + `last_active_at` on `users`; second login blocked with HTTP 409; logout clears the session; 30-minute idle timeout frees it automatically. Config lives in `server/config.js`.
- `POST /api/auth/logout` (protected).
- All tested with Thunder Client.

### Phase 4 — Resident management (BACKEND DONE, UI NOT DONE)
- `units` table with `UNIQUE(society_id, unit_number)`.
- `POST /api/units` (admin only), `GET /api/units` (any logged-in user).
- `requireRole(...)` middleware.
- `POST /api/residents` (admin only) — checks the unit belongs to the caller's society, creates a `resident` user with a temporary password, sets `must_change_password = true`, returns the temp password in the API response.
- `POST /api/auth/set-initial-password` (protected) — resident sets their own password once, then `must_change_password` becomes false.
- Commits: `fe8d298`, `a682323`.

### Housekeeping (2026-11-23)
- Created this file and `DECISIONS.md`.
- Removed an accidental duplicate `/set-initial-password` route from `server/routes/auth.js`.

## Not done yet
- Phase 4 UI: unit list/create, resident list/create, first-login password-change screen, signup screen.
- Admin-only password reset (residents cannot change their own password after the initial set, but the reset route does not exist yet).
- Actually delivering credentials to the resident's mobile number — the temp password is only returned in the API response right now.
- Phases 5–10: maintenance, issues, billing, expenses, dashboards/reports, testing & deployment.

## Next
1. Phase 4 UI — plan pending owner approval.
2. Then admin-only password reset.
3. Then Phase 5 maintenance.

## Testing notes
- Backend: `cd server && npm run dev` (port 5000).
- Frontend: `cd client && npm run dev`.
- API testing: Thunder Client in VS Code.
- After each feature, test as two different societies to confirm tenant isolation.
