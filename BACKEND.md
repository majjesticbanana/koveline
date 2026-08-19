# Backend — student accounts & admin CMS

Prisma + Supabase Postgres layer for student login and a minimal admin panel.
The public study site is unchanged; this adds accounts on top of it.

## Stack

- **Prisma 7** with the **`pg` driver adapter** (Prisma 7 no longer reads the
  connection URL from the schema — it comes from `prisma.config.ts` for the CLI
  and from the adapter in `lib/prisma.ts` at runtime).
- **Supabase Postgres**, two URLs in `.env`:
  - `DATABASE_URL` — pgbouncer transaction pooler (`:6543`), used at runtime.
  - `DIRECT_URL` — session pooler (`:5432`), used for `db push` / migrations.
- **bcryptjs** for password hashing, **opaque DB-backed sessions** (no JWT) in an
  httpOnly cookie. Revoking = deleting the `Session` row.

## Data model (`prisma/schema.prisma`)

- `Student` — `email` (unique), `passwordHash`, `name?`, `role` (`STUDENT` |
  `ADMIN`), `disabled`, timestamps.
- `Session` — opaque `token` (unique), `studentId`, `expiresAt`. Cascade-deletes
  with the student.

## Files

| Path | Purpose |
| --- | --- |
| `prisma/schema.prisma`, `prisma.config.ts` | schema + CLI datasource |
| `lib/prisma.ts` | Prisma client singleton (pg adapter) |
| `lib/auth.ts` | hashing, `createSession`, `destroySession`, `getCurrentStudent`, `getCurrentAdmin` |
| `lib/auth-cookie.ts` | cookie name (Edge-safe, no server-only deps) |
| `lib/validation.ts` | zod request schemas |
| `middleware.ts` | gates `/admin` and `/account` on cookie presence |
| `app/api/auth/*` | `login`, `logout`, `signup` |
| `app/api/admin/students/*` | list / create / update / delete (admin only) |
| `app/login`, `app/account`, `app/admin` | UI |
| `scripts/seed-admin.ts` | create/promote the first admin |

## Setup

```bash
# 1. env — make sure DATABASE_URL and DIRECT_URL are valid.
#    NOTE: the DB password contains '@', so it MUST be percent-encoded as %40
#    in both URLs (already done in .env).

npm install                      # runs `prisma generate` (postinstall)
npm run db:push                  # create the tables in Supabase
npm run db:seed-admin -- you@example.com 'a-strong-password' 'Your Name'
npm run dev                      # sign in at /login → admin lands on /admin
```

## API

| Method | Route | Auth | Body |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | — | `{ email, password }` |
| POST | `/api/auth/signup` | — | `{ email, password, name? }` |
| POST | `/api/auth/logout` | session | — |
| GET | `/api/admin/students` | admin | — |
| POST | `/api/admin/students` | admin | `{ email, password, name?, role? }` |
| PATCH | `/api/admin/students/:id` | admin | `{ name?, role?, disabled?, password? }` |
| DELETE | `/api/admin/students/:id` | admin | — |

Login is account-enumeration-safe (same error for unknown email vs wrong
password). An admin can't disable, demote, or delete their own account.
Password resets and disabling revoke that student's existing sessions.
