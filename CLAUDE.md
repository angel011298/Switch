# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Deployment workflow

**This project deploys exclusively via Vercel.** Code changes pushed to the main branch auto-deploy to `cifra-mx.vercel.app`. There is no need to run a local dev server. Do NOT use `npm run dev`, `npm run build`, or restart processes — just edit the files and Vercel picks them up on git push.

When Vercel builds fail, the root cause is almost always a **TypeScript/SWC compile error** (duplicate `const`, bad import, missing type). TypeScript errors are currently tolerated via `ignoreBuildErrors: true` in `next.config.mjs`, but SWC hard-errors on duplicate declarations still break builds.

Build command on Vercel: `npx prisma generate && next build`

---

## Commands (only for local context, not used in normal workflow)

```bash
npm run test           # Run all Vitest tests
npm run test:watch     # Watch mode
npm run seed           # Seed Prisma DB
npm run seed:tax       # Seed tax rules catalog
npx prisma generate    # Regenerate Prisma client after schema changes
npx prisma db push     # Push schema changes to Supabase Postgres
```

Tests live in `lib/__tests__/` and use Vitest.

---

## Architecture overview

### Multi-tenant SaaS

Each **Tenant** has its own isolated data. The `tenantId` is injected into every Prisma query as a filter — there is no Row Level Security fallback for most models. The `tenantId` is available server-side via `getSwitchSession()` from `lib/auth/session.ts`, which decodes the Supabase JWT.

### Auth & Session

- **Supabase Auth** handles user identity and sessions.
- A **Supabase `custom_access_token_hook`** injects custom claims into the JWT on every login: `tenant_id`, `active_modules`, `is_super_admin`, `user_role`, `sub_status`, `valid_until`, `onboarding_complete`.
- The middleware and all server components rely on these JWT claims — **no DB round-trips for auth checks**.
- `getSwitchSession()` (`lib/auth/session.ts`) is the standard way to get session data in Server Components and Server Actions.
- Supabase Admin operations (deleting users) require `SUPABASE_SERVICE_ROLE_KEY` — stored in `.env.local` and in Vercel environment variables.

### Middleware layers (`middleware.ts`)

Four sequential gates on every request:
1. **Authentication** — redirect to `/login` if no Supabase session
2. **Onboarding** — redirect to `/onboarding` if `onboarding_complete === false`
3. **Paywall** — redirect to `/billing/subscription` if subscription `SUSPENDED` or expired
4. **Module authorization** — redirect to `/dashboard?module_denied=X` if tenant lacks the required `ModuleKey`
5. **RBAC** — redirect to `/dashboard?role_denied=1` if user role lacks permission

Super admins bypass all gates after authentication.

### Route groups

```
app/
  (auth)/          — legacy auth routes
  (dashboard)/     — all authenticated app routes (layout with Sidebar + Header)
    admin/         — Super Admin panel (isSuperAdmin required)
    onboarding/    — Mandatory first-run wizard
    dashboard/     — Main dashboard
    billing/       — CFDI invoicing
    finanzas/      — Finance, taxes, collections, accounting
    rrhh/          — Payroll, HCM
    crm/           — CRM, pipeline, marketing, support
    scm/           — Inventory, purchasing, logistics
    mrp/           — Manufacturing, BOM, quality
    proyectos/     — Project management
    bi/            — Business Intelligence
    pos/           — Point of sale
    ai/            — CIFRA AI Copilot
    enterprise/    — Multi-company (Organization model)
  (marketing)/     — Public landing pages
  login/           — Combined login + signup page
  portal/          — Public customer portal (no auth)
  api/             — API routes (webhooks/stripe, webhooks/trigger, v1/*)
```

### Database (Prisma + Supabase Postgres)

Schema at `prisma/schema.prisma`. Key models:

| Model | Purpose |
|-------|---------|
| `Tenant` | Root entity — holds `rfc`, `legalName`, `onboardingComplete`, `taxRegimeId` |
| `User` | Auth user linked to Tenant — `isSuperAdmin`, `role` (ADMIN/MANAGER/OPERATIVE) |
| `TenantModule` | Many-to-many Tenant ↔ ModuleKey, `isActive` flag |
| `Subscription` | Stripe subscription status + `validUntil` |
| `Invoice` / `InvoiceItem` | CFDI 4.0 invoices |
| `JournalEntry` / `JournalLine` | Double-entry accounting |
| `PayrollRun` / `PayrollItem` | Payroll calculation runs |
| `Employee` | HR + payroll base |
| `StockMovement` | Inventory transactions (links to POS, SCM, MRP) |

Two DB URLs required: `DATABASE_URL` (pooled, for Prisma) and `DIRECT_URL` (direct, for migrations).

### Server Actions pattern

All mutations use Next.js Server Actions (`'use server'`). Each action:
1. Calls `getSwitchSession()` and validates `tenantId`
2. Verifies `isSuperAdmin` when needed
3. Runs Prisma queries with `where: { tenantId }` filter
4. Calls `revalidatePath()` to invalidate the cache

### Module system

`lib/modules/registry.ts` defines `MODULE_DEFS` (all 20 modules with icon, label, color, routes). `getActiveGroups(activeModules)` returns the filtered sidebar nav. The middleware uses `ROUTE_MODULE_MAP` to enforce module access.

### Branding / Logo

- **Logo images** (light/dark): `public/logo-light.png`, `public/logo-dark.png` — used in Sidebar and login page.
- **Favicon**: auto-generated from `app/icon.tsx` (Next.js App Router) — renders a Δ delta symbol.
- The login page is a two-column layout: left panel (`MarketingPanel` component) + right form.
- Sidebar logo is wrapped in `<Link href="/dashboard">` — clicking it always returns to the main dashboard.

### Super Admin

The super admin email is hardcoded as `553angelortiz@gmail.com` in `app/login/actions.ts`. The admin panel at `/admin` provides: tenant list, module toggles per tenant, pending payment review, and permanent tenant deletion (cascade: Supabase Auth users + Prisma records).

---

## Key environment variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin key (server-only, for user deletion) |
| `DATABASE_URL` | Prisma pooled connection (Supabase) |
| `DIRECT_URL` | Prisma direct connection (for migrations) |
| `NEXT_PUBLIC_SITE_URL` | Production URL (`https://cifra-mx.vercel.app`) |
| `STRIPE_SECRET_KEY` | Stripe backend key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |

---

## Plan Maestro

The full development roadmap (Fases 12–43) lives in `.claude/PLAN_MAESTRO_FASES_12_19.md`. That file is the single source of truth for completed phases, architectural decisions, and next steps. Fases 12–40 are complete (37 PRs merged). Fases 41–43 are pending (Onboarding Fiscal OCR, Planes/Stripe MXN, CFDI Timbrado real).
