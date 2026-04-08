# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm run dev          # Start development server (Turbopack)
pnpm run build        # Production build
pnpm run lint         # ESLint
pnpm run test         # Vitest in watch mode
pnpm run test:run     # Vitest single run
```

Run a single test file:
```bash
npx vitest run tests/lib/schemas.test.ts
```

After schema changes, regenerate Prisma client:
```bash
npx prisma generate
npx prisma migrate dev
```

## Architecture

**Work order management system** for Bayside PV (boat tour company). Admins create and manage charter work orders; captains fill in post-trip expense/payment details.

### Tech Stack
- **Next.js App Router** with React Server Components and Server Actions
- **Better Auth** (not NextAuth) for authentication — email/password, sessions stored in DB
- **Prisma 7** with PostgreSQL (Neon) via `pg` connection pooling
- **Cloudflare R2** for photo/receipt uploads (via AWS S3 SDK)
- **Resend** for email receipts
- **Zod + React Hook Form** for form validation

### Key Directories
- `app/admin/` — Admin dashboard (create/edit/view work orders)
- `app/captain/` — Captain interface (post-trip reporting, expense entry)
- `app/actions/` — Server Actions: `work-order.ts`, `email.ts`, `create-user.ts`
- `lib/` — Core utilities: `auth.ts`, `db.ts`, `schemas.ts`, `r2-client.ts`
- `prisma/` — Schema and migrations; Prisma client output goes to `lib/prisma-client/`
- `tests/` — Vitest tests (unit, action, component)

### Authentication & Authorization
- Middleware in `proxy.ts` protects `/admin/*` and `/captain/*` — redirects unauthenticated users to `/`
- Role stored on the `User` model: `admin`, `captain`, or `representante`
- Session fetched server-side via `auth.api.getSession(headers)` inside Server Components and Server Actions
- Trusted origins configured dynamically (localhost IPs, Cloudflare tunnel, Vercel) — see `BETTER_AUTH_URL`, `CLOUDFLARE_TUNNEL_URL`, `TRUSTED_ORIGINS` env vars

### Data Model
Core model is `WorkOrder` (~40 fields). Key relationships:
- `WorkOrder → User` (captain assignment via `captainId`)
- `WorkOrder → Receipt[]` (uploaded photos linked to expense types)

### Form Architecture
`WorkOrderForm.tsx` operates in three modes passed as a prop:
- `admin-create` — full form, all fields
- `admin-edit` — full form, pre-populated
- `captain-edit` — restricted to expenses, hours, and payment fields

Validation schemas are role-aware: `getAdminSchema()` vs `getCaptainSchema()` in `lib/schemas.ts`. Zod preprocessors handle Prisma `Decimal` → `number` conversion.

### Serialization
Prisma returns `Decimal` and `Date` objects that can't be passed directly from Server Components to Client Components. Use `serializePrisma()` from `lib/utils.ts` to recursively convert them before passing as props.

### File Uploads
Images are compressed client-side (`browser-image-compression`), then uploaded via `uploadPhotoToR2()` server action as `FormData`. Files stored at `work-orders/{orderId}/{gastoType}-{timestamp}-{random}.ext` in R2. Receipt records saved to DB with URL.

### Email
Receipts use a React email template (`components/emails/ReceiptEmail.tsx`) rendered server-side. Sent via Resend with BCC to a fixed address. Company logo attached as inline attachment.
