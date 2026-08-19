# Backend — student accounts & admin CMS

Prisma + Supabase Postgres layer for student login, saved progress, and a
minimal admin panel. The public study site is unchanged; this adds accounts on
top of it.

**Accounts are optional.** Signed-out visitors get exactly the site they always
had — every deck, fully offline, progress in localStorage. Signing in only adds
one thing: that progress is mirrored to the account, so a deck started on a
phone can be finished on a laptop.

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
- `Progress` — one row per (`studentId`, `resourceKey`), holding the same JSON
  blob the browser keeps in localStorage (`status`, `mode`, `idx`, `lessonId`,
  `orderIds`) plus the client's `updatedAt` stamp.

## Progress sync

### Whose progress is it

A browser is a device, not a person — two students share one localStorage. So
every stored blob is namespaced by identity, and `progressKey()` /
`lastStudiedKey()` take that identity as a **required** argument so no call site
can quietly forget it:

| Signed out | `koveline:v3:progress:<resourceKey>` |
| Signed in  | `koveline:v3:u:<studentId>:progress:<resourceKey>` |

Everything that reads progress — the deck, the home page's per-unit counts and
"continue where you left off", the custom test's "questions I got wrong" — takes
its identity from `useSession()` and re-reads when that identity changes. The
deck waits for the session to resolve before its first read, so the previous
person's marks never flash on screen.

Signing out leaves that student's namespace on disk (theirs, and useful
offline); the next person sees only the signed-out store. The one crossing point
is deliberate: **the first sign-in of an account that has nothing saved anywhere
adopts the anonymous namespace** — the "I studied for a week, then made an
account" case. It moves rather than copies, so a second account on the same
browser cannot claim the same work.

### Conflicts and stamps

The deck engine has always written its state to localStorage. Blobs now also
carry an `updatedAt` epoch stamp, and that stamp is the whole conflict story: **per deck, the newer stamp
wins**, on both sides. Merging mark-by-mark was rejected — it resurrects cards a
student deliberately reset.

The flow, all in the browser:

1. `SessionProvider` asks `/api/auth/me` once per page load. Reading the cookie
   in the root layout instead would make every page in this otherwise static
   site dynamic, so the shell renders anonymously and fills in.
2. If someone is signed in, it `PUT`s every local deck to `/api/progress`, and
   the response — the full merged state — is written back over any local blob
   the server holds a newer copy of. Then `syncStamp` is bumped.
3. `DeckEngine` watches `syncStamp` and adopts the stored blob **only** if it is
   newer than what is on screen, so a deck already being studied is never yanked
   out from under the reader.
4. While studying, each real change writes localStorage and (when signed in)
   queues a debounced push. Visits that change nothing never re-stamp a deck,
   which is what stops a device from winning conflicts just by loading a page.

Offline or signed out, every push is a no-op that fails quietly — localStorage
is still the source of truth, and the next load re-syncs.

The service worker skips `/api/*` entirely and never stores `/account`,
`/admin` or `/login` responses, so nothing per-session lands in a shared cache.

## Files

| Path | Purpose |
| --- | --- |
| `prisma/schema.prisma`, `prisma.config.ts` | schema + CLI datasource |
| `lib/prisma.ts` | Prisma client singleton (pg adapter) |
| `lib/auth.ts` | hashing, `createSession`, `destroySession`, `getCurrentStudent`, `getCurrentAdmin` |
| `lib/auth-cookie.ts` | cookie name (Edge-safe, no server-only deps) |
| `lib/validation.ts` | zod request schemas |
| `lib/progress-sync.ts` | browser side of progress sync (list, merge, debounced push) |
| `components/session-provider.tsx` | client session context + the once-per-load sync |
| `components/nav-account.tsx` | the navbar sign-in link / account menu |
| `app/account/clear-progress.tsx` | "clear saved progress", server + this device |
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
npm run db:push                  # create/update the tables in Supabase
                                 # (adds `Progress` if you are upgrading)
npm run db:seed-admin -- you@example.com 'a-strong-password' 'Your Name'
npm run dev                      # sign in at /login → admin lands on /admin
```

## API

| Method | Route | Auth | Body |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | — | `{ email, password }` |
| POST | `/api/auth/signup` | — | `{ email, password, name? }` |
| POST | `/api/auth/logout` | session | — |
| GET | `/api/auth/me` | — | — (returns `{ student: … \| null }`) |
| GET | `/api/progress` | session | — |
| PUT | `/api/progress` | session | `{ entries: [{ key, data, updatedAt }] }` → merged state |
| DELETE | `/api/progress` | session | — (clears that student's saved progress) |
| GET | `/api/admin/students` | admin | — |
| POST | `/api/admin/students` | admin | `{ email, password, name?, role? }` |
| PATCH | `/api/admin/students/:id` | admin | `{ name?, role?, disabled?, password? }` |
| DELETE | `/api/admin/students/:id` | admin | — |

Login is account-enumeration-safe (same error for unknown email vs wrong
password). An admin can't disable, demote, or delete their own account.
Password resets and disabling revoke that student's existing sessions.
