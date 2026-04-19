# Authentication Review: Bayside PV Work Order System

---

## Correction Notice

An earlier version of this review incorrectly flagged `proxy.ts` as a critical error, claiming Next.js does not recognize that filename and the middleware layer was "silently dead." **This was wrong.**

The project uses **Next.js 16.0.8**. In Next.js 16, `proxy.ts` is the official top-level file convention for request interception (replacing `middleware.ts` from earlier versions). The `proxyClientMaxBodySize` setting in `next.config.ts` is consistent with this. `proxy.ts` is running correctly. The route protection logic in that file is active.

The plan has been revised below to remove that false finding entirely.

---

## Authentication Flow Chart

```
┌─────────────────────────────────────────────────────────────┐
│                      USER REQUEST                           │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              LAYER 1: NEXT.JS PROXY (proxy.ts)              │
│                                                             │
│  Intercepts: /admin/:path* and /captain/:path*              │
│                                                             │
│  auth.api.getSession(headers) ──► no session?               │
│                                       └─► redirect to /     │
│                                                             │
│  /admin routes:                                             │
│    role = admin or representante → allow                    │
│    role = anything else          → redirect to /            │
│    role = representante + restricted path → redirect /admin │
│      restricted: /admin/users, /admin/add-user,             │
│                  /admin/print                               │
│                                                             │
│  /captain routes:                                           │
│    role = captain → allow                                   │
│    role = anything else → redirect to /                     │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│            LAYER 2: SERVER COMPONENT / API ROUTE            │
│                                                             │
│  Pages WITH server-side session check:                      │
│    • app/admin/page.tsx ✓ (redundant after proxy, but safe) │
│    • app/api/users/route.ts ✓                               │
│                                                             │
│  Pages WITHOUT server-side session check                    │
│  (rely entirely on proxy for protection):                   │
│    • app/admin/create/page.tsx  (client component)          │
│    • app/admin/list/page.tsx    (client component)          │
│    • app/admin/users/page.tsx   (client component)          │
│    • app/admin/add-user/page.tsx (client component)         │
│    • app/admin/print/page.tsx   (client component)          │
│    • app/admin/order/[id]/page.tsx                          │
│    • app/captain/page.tsx                                   │
│    • app/captain/order/[id]/page.tsx                        │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│        LAYER 3: CLIENT COMPONENT SESSION CHECK              │
│            (useEffect + authClient.useSession)              │
│                                                             │
│  Pattern used in: users/, add-user/, print/                 │
│                                                             │
│  if (!isPending && session && role !== "admin")             │
│       → router.push("/admin")                               │
│                                                             │
│  BUG: Does NOT redirect if session === null                 │
│  (condition: "session &&" means unauthenticated users       │
│   bypass the client check — proxy catches them instead,     │
│   but this is a latent bug if proxy behavior ever changes)  │
│  RACE: Page content renders briefly before redirect fires   │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│           LAYER 4: SERVER ACTIONS (most reliable)           │
│                                                             │
│  auth.api.getSession({ headers: await headers() })          │
│                                                             │
│  createUser.ts:   admin only                                │
│  getUsers.ts:     admin only                                │
│  deleteUser.ts:   admin only (but uses raw Prisma delete!)  │
│  changePassword:  admin only (uses (auth as any) cast)      │
│                                                             │
│  work-order.ts:   role-aware (admin/representante/captain)  │
│  uploadReceipt:   ownership check for captain               │
│  email.ts:        admin only                                │
└─────────────────────────────────────────────────────────────┘

SIGN-IN FLOW:
  User → app/page.tsx → authClient.signIn.email()
                      → Better Auth validates credentials
                      → Sets session cookie
                      → window.location.href = "/admin" | "/captain"

SIGN-OUT FLOW:
  User → SignOutButton → manually clears cookies (unnecessary)
                       → authClient.signOut() (correct)
                       → clears ALL localStorage/sessionStorage (excessive)
                       → 300ms delay
                       → window.location.replace("/?signout=true")
```

---

## Issues Found

### HIGH

**1. `deleteUser` bypasses Better Auth — orphaned sessions**

`createUser.ts:131`:
```typescript
await prisma.user.delete({ where: { id: userId } });
```
This deletes the user directly from the database, bypassing Better Auth. Active sessions and auth account records for that user are **not cleaned up**. The deleted user's session cookie would remain valid until it expires naturally. Better Auth provides `auth.api.admin.removeUser()` for exactly this purpose.

**2. `(auth as any).api` unsafe type cast in createUser.ts**

Lines 57-58 and 175-176 cast `auth` to `any` to access admin methods:
```typescript
const api = (auth as any).api;
const adminCreateUser = api.admin?.createUser || api.createUser;
```
Better Auth's `admin` plugin properly types `auth.api.admin.createUser()`. The cast to `any` silences TypeScript — if the API changes, errors won't surface at compile time. The fallback `|| api.createUser` also suggests the correct path was uncertain when this was written.

**3. Client-side redirect bug in `users/`, `add-user/`, `print/` pages**

All three use this pattern:
```typescript
if (!isPending && session && session.user?.role !== "admin") {
  router.push("/admin");
}
```
The condition `session &&` means: if there is no session, the redirect does NOT fire. An unauthenticated user reaching these pages (e.g., if proxy behavior changed) would not be redirected by the client check. The proxy currently catches this case, but the client-side guard should be correct on its own. The condition should be:
```typescript
if (!isPending && (!session || session.user?.role !== "admin")) {
  router.push("/admin");
}
```

---

### MEDIUM

**4. `role` field defined twice — in `additionalFields` AND via `admin()` plugin**

`lib/auth.ts` declares `role` as an `additionalField` with `input: true`, while also loading the `admin()` plugin which has its own built-in role management. Better Auth's admin plugin natively manages a `role` field on the user model. Defining it again in `additionalFields` creates ambiguity. The `databaseHooks` workaround below likely exists because of confusion arising from this duplication.

**5. `databaseHooks` is a fragile workaround**

The `before` hook on user creation (`lib/auth.ts` lines 31-62) attempts to patch custom fields by probing multiple context paths:
```typescript
const body = ctx.body || ctx.params || ctx.input || ctx.data || {};
```
This trial-and-error approach, combined with the `context as any` cast and three `console.log` calls printing user data, strongly indicates this was written to fix a symptom rather than the root cause. The root cause is likely the role/additionalFields duplication above.

**6. `console.log` statements printing user data in production**

`lib/auth.ts` (lines 40-41, 58): Prints full user objects and request bodies to the console on every user creation. This exposes PII in production logs.

`proxy.ts` (lines 25, 31, 34, 44, 49, 59, 67, 71): Logs every request pathname and user role on every intercepted request.

**7. `useSecureCookies: false` hardcoded**

`lib/auth.ts:70`: The `Secure` cookie attribute is disabled globally. The app is deployed on Vercel over HTTPS. In production, session cookies should carry the `Secure` flag. This should be conditional:
```typescript
useSecureCookies: process.env.NODE_ENV === "production"
```

**8. `deleteUser` has no self-deletion guard**

There is no check preventing an admin from deleting their own account, which would invalidate their active session immediately.

---

### LOW / CLEANUP

**9. Over-engineered SignOutButton**

The sign-out process manually clears cookies before calling `authClient.signOut()`, then clears ALL localStorage and sessionStorage, then waits 300ms. Better Auth's `signOut()` invalidates the session server-side and instructs the browser to clear the session cookie in its response. The manual cookie clearing and storage wipe are unnecessary and the `localStorage.clear()` is a nuclear option that could break unrelated app state.

**10. Landing page autofill prevention is excessive**

`app/page.tsx` has 4 `setTimeout` calls (at 0, 50, 200, 500ms) to clear form inputs after sign-out, plus a `formKey` remount pattern. The standard approach is `autoComplete="off"` on the form combined with clearing React state — not multiple timers and direct DOM manipulation.

**11. `forceRefresh` export from `auth-client.ts` is unused/meaningless**

```typescript
export const forceRefresh = Date.now();
```
This is a static timestamp set at module load time. It never changes and doesn't cause re-renders. Should be removed unless there's a specific import that depends on it.

**12. Session expires in 30 minutes with 1-minute DB write cycle**

`updateAge: 60 * 1` means Better Auth writes to the sessions table every minute to extend the session. For users filling in long work order forms, 30 minutes may also be too short. Consider `expiresIn: 60 * 60 * 8` (8 hours) and `updateAge: 60 * 15` (15 minutes).

**13. `/api/seed` endpoint has no auth protection**

Creates admin/captain accounts with hardcoded `password123` if they don't exist. The endpoint is publicly accessible. Should be removed or gated behind a secret token.

**14. `session.user.role` never typed — `as any` cast used in 10+ locations**

Every role check in the codebase casts session.user to `any`. Better Auth supports `inferSession` type inference. A single type augmentation file would eliminate all these casts.

---

## Proposed Plan (awaiting authorization)

### Phase 1 — High: Fix Auth API usage
1. Replace `(auth as any).api` casts with proper typed calls: `auth.api.admin.createUser(...)`, `auth.api.admin.setUserPassword(...)`.
2. Replace `prisma.user.delete()` in `deleteUser` with `auth.api.admin.removeUser()` to properly clean up sessions and accounts. Add a self-deletion guard.
3. Fix the client-side redirect condition in `users/`, `add-user/`, and `print/` pages so it also redirects unauthenticated users (not just wrong-role users).

### Phase 2 — Medium: Simplify and fix auth configuration
4. Resolve the `role` field duplication — decide whether to use Better Auth's admin plugin role management or a pure custom `additionalField`. Eliminate the `databaseHooks` workaround once the root cause is fixed.
5. Add type safety: use Better Auth's `inferSession` or a type augmentation file so `session.user.role` is typed everywhere without `as any`.
6. Change `useSecureCookies` to `process.env.NODE_ENV === "production"`.
7. Remove `console.log` statements from `auth.ts` and `proxy.ts` (or wrap in `process.env.NODE_ENV !== "production"` guards).

### Phase 3 — Cleanup
8. Simplify `SignOutButton` — remove manual cookie clearing and `localStorage.clear()`, let `authClient.signOut()` do its job.
9. Simplify landing page autofill prevention — remove the multiple `setTimeout` timers.
10. Adjust session duration (e.g., 8 hours / 15-minute refresh).
11. Remove or protect the `/api/seed` endpoint.
12. Remove the `forceRefresh` export from `auth-client.ts`.
