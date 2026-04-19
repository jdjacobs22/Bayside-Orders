# Authentication Refactor — Change Log
Date: 2026-04-10
Authorized by: auth-review.md plan

All changes passed `pnpm run build` (TypeScript + Turbopack) with zero errors.

---

## 1. `lib/auth.ts`

**What changed and why:**

| Lines | Change | Reason |
|-------|--------|--------|
| 1–5 | Added `import { role } from "better-auth/plugins/access"` | Needed to register custom role names with the admin plugin |
| 14–20 | Removed `role` from `additionalFields` | The `admin()` plugin owns the role field; having it in both places was the root cause of the databaseHooks workaround |
| 22–25 | Changed `expiresIn` from `60 * 30` (30 min) to `60 * 60 * 8` (8 hours) | 30 minutes caused sessions to expire while users were filling in long work-order forms |
| 22–25 | Changed `updateAge` from `60 * 1` (1 min) to `60 * 15` (15 min) | 1-minute refresh was writing to the sessions table once per minute per active user, unnecessarily |
| 27–28 | Changed `useSecureCookies: false` to `useSecureCookies: process.env.NODE_ENV === "production"` | Cookies on the Vercel (HTTPS) deployment now carry the Secure flag; local HTTP development is unaffected |
| 68–81 | Added `roles`, `defaultRole`, and `adminRoles` options to `admin()` | Better Auth requires that any role listed in `adminRoles` also appear in `roles`. Without this, passing `representante` as an admin role threw a `BetterAuthError` at runtime. `role({})` creates a role with no access-control statements. |
| 84–90 | Added `export type SessionUser` | Provides a typed user shape (including role, nombre, apellido, cell) so the rest of the codebase can replace `session.user as any` with `session.user as SessionUser` |

**Removed entirely:**
- The `databaseHooks.user.create.before` block (previously lines 28–63) — this was a trial-and-error workaround that probed `ctx.body || ctx.params || ctx.input || ctx.data` to find custom fields. Root cause was the role field duplication above. It also contained three `console.log` calls that printed user data (including role and name) to production logs on every user creation.

---

## 2. `app/actions/createUser.ts`

Complete rewrite. Previously 197 lines; now 161 lines.

**What changed and why:**

| Lines | Change | Reason |
|-------|--------|--------|
| 4 | `import { auth, type SessionUser }` | Imports the new `SessionUser` type from auth.ts |
| 18–22 | Added `requireAdmin()` helper | Eliminates the repeated `if (session.user.role !== "admin") throw` pattern that appeared in every function |
| 51–64 | `createUser` now calls `auth.api.createUser(...)` | Replaced `(auth as any).api` dynamic property lookup with a properly typed call. Custom fields (`nombre`, `apellido`, `cell`, `role`) go into `body.data`; the admin plugin spreads `data` into the user record after the default role, so `role` in `data` correctly overrides the "user" default. |
| 78–80 | Return value uses `session.user as SessionUser` | Replaces `(result.user as any).nombre` etc. |
| 104–125 | `deleteUser` now calls `auth.api.removeUser(...)` | Previously called `prisma.user.delete()` directly, which left active sessions and account records in the database. `removeUser` cleans up all related records. |
| 109–111 | Self-deletion guard added | `if (session.user.id === userId) return error` — prevents an admin from accidentally deleting their own account, which would invalidate their live session. |
| 144–160 | `changeUserPassword` now calls `auth.api.setUserPassword(...)` | Replaced `(auth as any).api` dynamic lookup with a properly typed call. |

---

## 3. `app/admin/users/page.tsx`

| Line | Change | Reason |
|------|--------|--------|
| 25 | `!isPending && session && role !== "admin"` → `!isPending && (!session \|\| role !== "admin")` | The original condition had a bug: it only redirected users who had a session with the wrong role. An unauthenticated user (session === null) would not be redirected by the client-side check. The proxy catches unauthenticated users first, but the client guard should be correct on its own. |

---

## 4. `app/admin/add-user/page.tsx`

| Line | Change | Reason |
|------|--------|--------|
| 47 | Same redirect condition fix as above | Same bug: `session &&` removed so unauthenticated users are also redirected |

---

## 5. `app/admin/print/page.tsx`

| Line | Change | Reason |
|------|--------|--------|
| 120 | Same redirect condition fix as above | Same bug |

---

## 6. `components/SignOutButton.tsx`

Complete rewrite. Previously 117 lines; now 29 lines.

**What was removed and why:**

| Removed | Reason |
|---------|--------|
| Manual cookie clearing loop (lines 29–49 original) | `authClient.signOut()` invalidates the session server-side and the server response instructs the browser to expire the session cookie. Manual client-side cookie clearing was redundant. |
| Second cookie clearing call after `signOut()` | Same reason. |
| `localStorage.clear()` and `sessionStorage.clear()` | A nuclear option that would clear any other app state stored in local/session storage. Better Auth does not store sensitive session data in browser storage; the session token is in a cookie. |
| `sessionStorage.setItem("justSignedOut", "true")` | This flag was used by the landing page to trigger autofill prevention. The landing page autofill logic has been removed (see below), making this flag unused. |
| `await new Promise(resolve => setTimeout(resolve, 300))` | The delay was added to "ensure cookies are cleared." Since manual clearing is gone, so is the delay. |
| Redirect changed from `/?signout=true` to `/` | The `?signout=true` query parameter triggered autofill prevention logic in the landing page. That logic has been removed. |

**What remains:**
- `authClient.signOut()` — the only call needed
- `window.location.replace("/")` — hard redirect to prevent back-navigation to authenticated pages

---

## 7. `app/page.tsx`

Complete rewrite. Previously 293 lines; now 148 lines.

**What was removed and why:**

| Removed | Reason |
|---------|--------|
| `useRef` for email and password inputs | Used only for direct DOM manipulation to clear autofill. Unnecessary with `autoComplete="off"`. |
| `isHidingForSignOut` state | Caused a 100ms window where inputs were invisible (`opacity-0 invisible`). |
| `formKey` state and remounting | Remounted the form with a new key on sign-out to reset autofill. Unnecessary. |
| `useSearchParams` and `?signout=true` detection | The query param is no longer appended on sign-out. |
| 4× `setTimeout` calls (at 0ms, 50ms, 200ms, 500ms) | All were calling `clearInputs()` to override browser autofill. This is achieved more simply with `autoComplete="off"`. |
| `sessionStorage.getItem("justSignedOut")` check | The flag is no longer set on sign-out. |
| `router.replace("/", ...)` call to strip query param | No query param to strip. |

**What was added:**
- `autoComplete="off"` on the `<form>` element (line 85)
- `autoComplete="off"` on both `<Input>` fields (lines 91, 103) — previously set to `"new-password"` on the email field (incorrect) and also on password

---

## 8. `lib/auth-client.ts`

Previously 24 lines; now 9 lines.

| Lines | Change | Reason |
|-------|--------|--------|
| Removed lines 10–14, 21–24 | Removed all JSDoc comments and the `forceRefresh` export | `forceRefresh = Date.now()` was a static timestamp that never changed and did not cause re-renders. It was the only export besides `authClient` and had no callers. |

---

## 9. `proxy.ts`

Previously 78 lines; now 45 lines.

**What was removed:**

| Removed | Reason |
|---------|--------|
| All 9 `console.log` statements | Logged every request pathname, session check result, and user role to the console on every protected route request. Produces significant noise in production logs and exposes request metadata. |
| All JSDoc block comments | No functional change; removed to reduce file size. |

**Logic unchanged** — all redirect rules for admin, representante, and captain remain identical.

---

## 10. `app/api/seed/route.ts`

Previously 75 lines; now 71 lines.

| Lines | Change | Reason |
|-------|--------|--------|
| 24, 40 | `auth.api.signUpEmail(...)` replaces `(auth.api as any).signUpEmail(...)` | Removed unnecessary `as any` cast; `signUpEmail` is a properly typed method on `auth.api`. |
| 29–32, 45–48 | Removed `role` from `signUpEmail` body | `signUpEmail`'s `additionalFields` schema accepts `nombre`, `apellido`, `cell` but `role` is no longer in `additionalFields` (it is managed by the admin plugin). The Prisma `update` calls below (lines 55–62) set the correct roles instead. |
| 34, 50 | Empty `catch` blocks replace `catch (e) { console.log(...) }` | Removed production log noise; the only expected error is "user already exists." |
| Removed `console.log("Seeding via API...")` | Production log noise. |

**Token protection (unchanged):** The endpoint was already protected by `SEED_SECRET` before this refactor. `SEED_SECRET` has been added to `.env.local` with a placeholder value.

> **Action required:** Replace the `SEED_SECRET` placeholder in `.env.local` and in the Vercel environment variables with a strong random value before deploying.

---

## 11. `.env.local`

| Change | Reason |
|--------|--------|
| Added `SEED_SECRET=change-me-to-a-strong-random-value` | The seed endpoint was already protected by this variable, but it was not present in the local env file. Without it set, the endpoint returns 401 (correct), but there was no local documentation that the variable existed. |
