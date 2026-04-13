# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Deployment workflow

**This project deploys exclusively via Vercel.** Code changes pushed to the main branch auto-deploy to `cifra-mx.vercel.app`. Do NOT use `npm run dev`, `npm run build`, or restart processes — edit files and push to git.

When Vercel builds fail, the root cause is almost always a **TypeScript/SWC compile error** (duplicate `const`, bad import, missing type). TypeScript errors are tolerated via `ignoreBuildErrors: true` in `next.config.mjs`, but SWC hard-errors on duplicate declarations still break builds.

Build command on Vercel: `npx prisma generate && next build`

---

## Commands (only for local context)

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

Each **Tenant** has its own isolated data. The `tenantId` is injected into every Prisma query as a filter — this is the **primary** security layer. A **secondary** layer of Row Level Security (RLS) is active in Supabase as defense-in-depth (see `supabase/migrations/20260413000000_enable_rls_tenant_isolation.sql`).

**RLS architecture:**
- 53 tables with a direct `tenantId` column have RLS enabled.
- Policy: `"tenantId" = auth.tenant_id()` where `auth.tenant_id()` reads the `tenant_id` JWT claim injected by the `custom_access_token_hook`.
- Prisma's `DATABASE_URL` uses the `service_role` pooler which **bypasses RLS automatically** in Supabase — no app behavior changes.
- RLS only applies to direct Supabase client queries from `anon`/`authenticated` roles.
- Child tables without direct `tenantId` (InvoiceItem, JournalLine, etc.) remain protected by the application layer.

The `tenantId` is available server-side via `getSwitchSession()` from `lib/auth/session.ts`, which decodes the Supabase JWT.

### Auth & Session

- **Supabase Auth** handles user identity and sessions.
- A **Supabase `custom_access_token_hook`** injects custom claims into the JWT on every login: `tenant_id`, `active_modules`, `is_super_admin`, `user_role`, `sub_status`, `valid_until`, `onboarding_complete`.
- The middleware and all server components rely on these JWT claims — **no DB round-trips for auth checks**.
- `getSwitchSession()` (`lib/auth/session.ts`) is the standard way to get session data in Server Components and Server Actions.
- Supabase Admin operations (deleting users) require `SUPABASE_SERVICE_ROLE_KEY` — stored in `.env.local` and Vercel environment variables.

### Middleware layers (`middleware.ts`)

Five sequential gates on every request (super admins bypass all after gate 1):
1. **Authentication** — redirect to `/login` if no Supabase session
2. **Onboarding** — redirect to `/onboarding` if `onboarding_complete === false`
3. **Paywall** — redirect to `/billing/subscription` if subscription `SUSPENDED` or expired
4. **Module authorization** — redirect to `/dashboard?module_denied=X` if tenant lacks the required `ModuleKey`
5. **RBAC** — redirect to `/dashboard?role_denied=1` if user role lacks permission

`PUBLIC_ROUTES` in `middleware.ts` lists paths that bypass auth entirely. When adding new public pages (landing, legal, portal), they must be added here.

`ALWAYS_ALLOWED` lists routes accessible even when subscription is suspended (currently: `/admin`, `/dashboard`, `/settings`, `/perfil`, `/onboarding`, `/billing/subscription`).

### Route groups

```
app/
  (auth)/          — legacy auth routes
  (dashboard)/     — all authenticated app routes (layout with Sidebar + Header)
    admin/         — Super Admin panel (isSuperAdmin required)
    admin/cuenta/  — Super Admin account page (UI mockup only — NOT wired to backend yet)
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
    configuracion/ — API keys, integrations, language, security settings
  (marketing)/     — Public landing pages
  login/           — Combined login + signup page
  portal/          — Public customer portal (no auth)
  api/
    v1/            — Public REST API (authenticated via API Key in Bearer header)
    bi/            — BI data endpoints (authenticated via Supabase session)
    portal/[token] — Customer portal endpoints (authenticated via one-time token)
    webhooks/      — Stripe + tax update webhooks (no session auth, use webhook secrets)
    reports/       — PDF/Excel report generation (authenticated via Supabase session)
    notifications/ — Notification CRUD (authenticated via Supabase session)
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
| `AuditLog` | Action log with tenantId, actorId, action, severity, oldData/newData |
| `ApiKey` | API keys stored as SHA-256 hash, never plaintext |
| `WebhookEndpoint` | Tenant-defined outbound webhook targets |

Two DB URLs required: `DATABASE_URL` (pooled, for Prisma) and `DIRECT_URL` (direct, for migrations).

### Server Actions pattern

All mutations use Next.js Server Actions (`'use server'`). Each action:
1. Calls `getSwitchSession()` and validates `tenantId`
2. Verifies `isSuperAdmin` when needed
3. Runs Prisma queries with `where: { tenantId }` filter
4. Calls `revalidatePath()` to invalidate the cache

### API Route auth patterns

There are two distinct auth patterns depending on the route type:
- **Internal routes** (`/api/bi/*`, `/api/reports/*`, `/api/notifications/*`, `/api/calendar/*`): Validate via `getSwitchSession()` — return 401 if no session.
- **Public REST API** (`/api/v1/*`): Validate via `Authorization: Bearer <api_key>`. Keys are stored SHA-256 hashed in `ApiKey` model. Check `active`, `expiresAt`, and `scopes` fields.
- **Webhook routes** (`/api/webhooks/stripe`, `/api/webhooks/tax-update`): Validate via signature headers (Stripe-Signature), not session.

**Rate limiting is not yet implemented.** All API routes currently rely solely on auth/tenant filtering. This is a known gap — add it before production traffic increases.

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

## Known gaps (pending implementation)

These features are not yet built:

| Feature | Status | Notes |
|---------|--------|-------|
| Cookie consent banner | Missing | Required before marketing to real users |
| Privacy Policy page | Missing | Add as public route under `/privacidad` |
| Terms of Service page | Missing | Add as public route under `/terminos` |
| Cookie Policy page | Missing | Add as public route under `/cookies` |
| Tenant profile/account settings | **Done** | `/admin/cuenta` wired: `updateTenantProfile()` + `updateUserPassword()` Server Actions in `app/(dashboard)/admin/cuenta/actions.ts` |
| Tenant user can change own password/email | **Done** | `updateUserPassword()` in `app/(dashboard)/admin/cuenta/actions.ts` uses `supabase.auth.admin.updateUserById()` |
| Rate limiting on API routes | Missing | No middleware-level or per-route rate limiting exists |
| Input sanitization library | Missing | RFC/email are normalized manually; no global sanitizer |

When adding legal pages (`/privacidad`, `/terminos`, `/cookies`), add them to `PUBLIC_ROUTES` in `middleware.ts` so unauthenticated visitors can access them.

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

The full development roadmap lives in `.claude/PLAN_MAESTRO_FASES_12_19.md`. The latest completed phase in git is **FASE 53** (security fixes, login redesign, 2FA verify). Fases 54+ are not yet planned — next priorities per product owner are: cookie/legal pages, tenant profile settings, rate limiting, and CFDI real timbrado.
