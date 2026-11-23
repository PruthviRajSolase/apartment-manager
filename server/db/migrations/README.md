# Database migrations

These files recreate the **current** schema on a fresh PostgreSQL database.
They are for new installs and disaster recovery only.

- The server does **not** run them automatically.
- They were **not** run against the existing `apartment_manager` database when the old `schema.sql` was split into these files.
- Do not run them on a database that already contains these tables — `CREATE TABLE` will fail.

## Apply order (on an empty database only)

From the `server/` folder:

```
psql -d apartment_manager -f db/migrations/001_create_societies.sql
psql -d apartment_manager -f db/migrations/002_create_units.sql
psql -d apartment_manager -f db/migrations/003_create_users.sql
psql -d apartment_manager -f db/migrations/004_create_payments.sql
psql -d apartment_manager -f db/migrations/005_create_issues.sql
```

| File | Creates | Depends on |
|---|---|---|
| 001 | `societies` | nothing |
| 002 | `units` | societies |
| 003 | `users` | societies, units |
| 004 | `payments` | societies, users |
| 005 | `issues` | societies, users |
