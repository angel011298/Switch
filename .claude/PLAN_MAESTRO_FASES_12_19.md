# 🎯 SWITCH OS — PLAN MAESTRO FASES 12-19
## De Infraestructura a MVP Producción

**Generado:** 2026-03-25
**Última FASE completada:** FASE 11 (Paywall SPEI)
**Siguiente:** FASE 12 (Infraestructura Base)
**Decisiones confirmadas:** MVP cliente único → mini-MVPs graduales, sin prisa, completitud

---

## TABLA DE CONTENIDOS
1. [Estado Actual](#estado-actual)
2. [FASE 12: Infraestructura Base](#fase-12-infraestructura-base)
3. [FASE 13: Motor de Facturación CFDI UI](#fase-13-motor-de-facturación-cfdi-ui)
4. [FASE 14: Interconexiones Críticas](#fase-14-interconexiones-críticas)
5. [FASE 15: RRHH Completo](#fase-15-rrhh-completo)
6. [FASE 16: Finanzas Módulos](#fase-16-finanzas-módulos)
7. [FASE 17: SCM Inventarios](#fase-17-scm-inventarios)
8. [FASE 18: CRM + BI](#fase-18-crm--bi)
9. [FASE 19: Production Readiness](#fase-19-production-readiness)
10. [Decisiones Arquitectónicas](#decisiones-arquitectónicas)
11. [Checklist Final](#checklist-final)

---

## ESTADO ACTUAL

### Commits completados
```
✅ FASE 10: Contabilidad Base (PR #6 merged)
✅ FASE 11: Paywall SPEI (commit 02048b7, esperando PR #7)
🚀 FASE 12-19: Pendiente
```

### Base de datos actual (post-FASE 11)
```
Models Prisma: 26 modelos
- Tenant ✅ (con subscription)
- User ✅ (con role)
- Customer ✅ (con RFC/régimen)
- Product ✅ (con precio/tax)
- PosOrder ✅ (con ticket code)
- Invoice ✅ (CFDI completo)
- Account ✅ (catálogo SAT)
- JournalEntry ✅ (pólizas)
- PaymentProof ✅ (SPEI proof)
- ⚠️ Employee ❌ NO EXISTE (FASE 12)
- ⚠️ Attendance ❌ NO EXISTE (FASE 12)
```

### Módulos implementados
```
✅ REAL (7 rutas):
  - /dashboard (KPIs, pero usa tablas legacy Supabase)
  - /admin (tenant manager, module control, payments)
  - /pos (POS terminal, checkout)
  - /finanzas/gastos (XML drag-drop)
  - /finanzas/contabilidad (XML batch, polizas)
  - /rrhh (asistencias, pero usa tablas legacy Supabase)
  - /factura-tu-ticket (public auto-invoice)

🟡 STUB (2 rutas):
  - /crm (QR scanner + customer form, backend partial)
  - /proyectos (WBS UI only)

❌ PLACEHOLDER (30 rutas):
  - /billing (CFDI UI falta, motor existe)
  - /rrhh/nomina, /talento, etc
  - /finanzas/impuestos, /cobranza, /caja-chica
  - /scm/*, /mrp/*, /bi, /citas, etc.
```

### Bugs bloqueantes pendientes (FASE 12)
1. Dashboard usa `ingresos_cfdi`, `gastos_xml` tables (legacy Supabase)
2. RRHH usa `empleados`, `asistencias` tables (legacy Supabase)
3. Nuevo tenant sin módulos activos → sidebar vacío
4. Sin pantalla de onboarding (RFC/nombre legal)
5. `getSwitchSession()` no expone `sub_status`, `valid_until`
6. `/billing` es placeholder puro

---

# FASE 12: INFRAESTRUCTURA BASE
## *(Prerequisito de todo. Sin esto, cliente no funciona.)*

**Duración:** ~2 horas (1 sesión)
**Rama:** `fase12/infraestructura-base`
**Dependencias:** FASE 11 merged a main
**Objetivo:** Corregir 6 bugs bloqueantes + preparar datos Prisma puros

---

## 12.1 EXTENDER PRISMA SCHEMA — Employee + Attendance

### Cambios en `prisma/schema.prisma`

```prisma
// NUEVA TABLA: Empleados
model Employee {
  id            String    @id @default(cuid())
  tenantId      String
  tenant        Tenant    @relation("TenantEmployees", fields: [tenantId], references: [id], onDelete: Cascade)

  // Identificación legal
  curp          String    @unique // 18 caracteres
  rfc           String?   // Diferente del RFC personal
  name          String
  email         String?
  phone         String?

  // Datos laborales
  position      String    // Puesto
  department    String?   // Departamento

  // Nómina
  salary        Decimal   @db.Decimal(12, 2)  // Mensual o quincenal
  salaryType    String    @default("MENSUAL")  // MENSUAL | QUINCENAL
  imssNumber    String?   // Número IMSS
  bankAccount   String?   // Cuenta bancaria

  // Control
  hireDate      DateTime
  terminationDate DateTime?
  active        Boolean   @default(true)

  // Relaciones
  attendances   Attendance[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@unique([tenantId, curp])
  @@index([tenantId])
  @@index([tenantId, active])
}

// NUEVA TABLA: Asistencias
model Attendance {
  id            String    @id @default(cuid())
  employeeId    String
  employee      Employee  @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  date          DateTime  @db.Date
  clockInTime   DateTime?
  clockOutTime  DateTime?

  // Justificantes
  absent        Boolean   @default(false)
  justified     Boolean   @default(false)
  notes         String?

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@unique([employeeId, date])
  @@index([employeeId, date])
}

// ACTUALIZACIÓN: Tenant model — agregar Employee relation
model Tenant {
  // ... campos existentes ...

  // NEW: Empleados
  employees     Employee[]    @relation("TenantEmployees")

  // ... resto ...
}
```

### Ejecutar migración
```bash
cd C:/Users/LENOVO/erp-fiscal

# 1. Crear migración
npx prisma migrate dev --name add_employee_attendance_models

# 2. Verificar que se creó
# Deberías ver:
#   ✔ Generated Prisma Client
#   ✔ Ran 1 migration in 0.123s
```

**Validaciones en la migración SQL:**
- CURP único por tenant (no puede estar en 2 organizaciones)
- Composite unique: [employeeId, date] en attendance (solo 1 registro por día)
- Índices en tenantId para queries rápidas

---

## 12.2 ACTUALIZAR `ensurePrismaUser()` — Auto-activar módulos base + TRIAL

### Archivo: `lib/auth/ensure-user.ts` (REEMPLAZAR COMPLETO)

```typescript
/**
 * Switch OS — Sincronización Prisma (Server-side only)
 * =====================================================
 * FASE 12: Auto-crear tenant, subscription TRIAL, y módulos base.
 *
 * Flujo:
 * 1. Busca usuario por ID (normal)
 * 2. Si no existe, busca por email (post-reset)
 * 3. Si tampoco, crea: Tenant + User + Subscription(TRIAL) + 4 módulos base
 */

import prisma from '@/lib/prisma';

const BASE_MODULES = ['DASHBOARD', 'BILLING_CFDI', 'POS', 'CRM'];
const TRIAL_DAYS = 14;

export async function ensurePrismaUser(
  userId: string,
  email: string,
  name: string
): Promise<void> {
  try {
    // 1. Buscar por ID (caso normal)
    const byId = await prisma.user.findUnique({ where: { id: userId } });
    if (byId) {
      console.log(`[ensurePrismaUser] Usuario ya existe: ${email}`);
      return;
    }

    // 2. Buscar por email (caso post-reset)
    const byEmail = await prisma.user.findUnique({ where: { email } });
    if (byEmail) {
      // Actualizar ID
      await prisma.user.update({
        where: { email },
        data: { id: userId },
      });
      console.log(`[ensurePrismaUser] ID actualizado para ${email}`);
      return;
    }

    // 3. No existe → crear tenant + user + subscription + módulos
    const isSuperAdmin = email === '553angelortiz@gmail.com';

    // Calcular validUntil = hoy + 14 días
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + TRIAL_DAYS);

    await prisma.tenant.create({
      data: {
        name: `ERP - ${name}`, // Será actualizado en onboarding
        rfc: '',               // Será actualizado en onboarding
        legalName: '',         // Será actualizado en onboarding
        zipCode: '',           // Será actualizado en onboarding
        onboardingComplete: false, // NEW FIELD (ver nota abajo)

        // Crear usuario admin
        users: {
          create: {
            id: userId,
            email,
            name,
            role: 'ADMIN',
            isSuperAdmin,
          },
        },

        // Crear subscription TRIAL (validUntil = 14 días)
        subscription: {
          create: {
            status: 'TRIAL',
            validUntil,
            stripeCustomerId: null,
          },
        },

        // Activar 4 módulos base
        moduleActivations: {
          createMany: {
            data: BASE_MODULES.map((moduleKey) => ({
              moduleKey,
            })),
          },
        },
      },
    });

    console.log(
      `[ensurePrismaUser] Tenant + User creado para ${email}. ` +
      `Módulos: ${BASE_MODULES.join(', ')}. ` +
      `Validez: ${TRIAL_DAYS} días.`
    );
  } catch (error: any) {
    // P2002 = unique constraint violation (usuario ya existe)
    // No es error crítico
    if (error?.code === 'P2002') {
      console.log(`[ensurePrismaUser] Usuario ya existe (constraint): ${email}`);
      return;
    }

    console.error(
      '[ensurePrismaUser] Error crítico:',
      error?.message ?? error
    );
    // NO lanzar excepción — nunca bloquear dashboard
  }
}
```

**⚠️ NOTA:** Agrega campo a Tenant schema:
```prisma
model Tenant {
  // ...
  onboardingComplete Boolean @default(false) // PHASE 12
  // ...
}
```

**Decisión arquitectónica:**
- 14 días TRIAL = estándar SaaS (cliente tiene 2 semanas para decidir)
- Super admin (553angelortiz@gmail.com) sin limitaciones
- Módulos base = lo mínimo para vender: dashboard, facturación, POS, CRM

---

## 12.3 EXTENDER `getSwitchSession()` — Incluir `subStatus`, `validUntil`

### Archivo: `lib/auth/session.ts` (MODIFICAR)

```typescript
/**
 * Switch OS — Session helpers (Server-side only)
 * FASE 12: Agregar sub_status y valid_until del JWT
 */

import { createClient } from '@/utils/supabase/server';

export interface SwitchSession {
  userId: string;
  email: string;
  name: string;
  tenantId: string | null;
  isSuperAdmin: boolean;
  userRole: string;
  activeModules: string[];

  // 🆕 FASE 12: Paywall claims from JWT
  subscriptionStatus: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELED' | null;
  validUntil: string | null; // ISO date string, e.g., "2026-04-08T06:00:00.000Z"
}

export async function getSwitchSession(): Promise<SwitchSession | null> {
  const supabase = createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  // Obtener JWT completo
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Decodificar JWT payload
  const jwtPayload = session?.access_token
    ? JSON.parse(
        Buffer.from(session.access_token.split('.')[1], 'base64').toString()
      )
    : null;

  return {
    userId: user.id,
    email: user.email ?? '',
    name:
      user.user_metadata?.name ??
      user.user_metadata?.full_name ??
      user.email?.split('@')[0] ??
      'Usuario',
    tenantId: jwtPayload?.tenant_id ?? null,
    isSuperAdmin: jwtPayload?.is_super_admin ?? false,
    userRole: jwtPayload?.user_role ?? 'OPERATIVE',
    activeModules: jwtPayload?.active_modules ?? [],
    // 🆕 FASE 12: Paywall fields
    subscriptionStatus: jwtPayload?.sub_status ?? null,
    validUntil: jwtPayload?.valid_until ?? null,
  };
}
```

**Decisión arquitectónica:**
- JWT es fuente de verdad (inyectado por custom_access_token_hook en Supabase)
- Server Components pueden verificar paywall sin consultar BD
- `validUntil` es string ISO para comparación fácil en TypeScript

---

## 12.4 CREAR PANTALLA DE ONBOARDING OBLIGATORIO

### Archivo: `app/(dashboard)/onboarding/page.tsx` (NUEVO)

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setupTenantProfile } from './actions';
import { AlertCircle, CheckCircle } from 'lucide-react';

const REGIMES = [
  { value: '601', label: 'Personas Morales sin actividad empresarial' },
  { value: '603', label: 'Personas Morales con actividad empresarial' },
  { value: '610', label: 'Residentes en el Extranjero sin Establecimiento' },
  { value: '623', label: 'Objeto del negocio no identificado' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: basic, 2: review

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      legalName: formData.get('legalName') as string,
      rfc: formData.get('rfc') as string,
      zipCode: formData.get('zipCode') as string,
      taxRegimeKey: formData.get('taxRegimeKey') as string,
    };

    try {
      // Validaciones básicas
      if (!data.name.trim()) throw new Error('Nombre de empresa requerido');
      if (!data.rfc.match(/^[A-Z0-9]{12}$/)) throw new Error('RFC inválido (12 caracteres)');
      if (!data.zipCode.match(/^[0-9]{5}$/)) throw new Error('CP debe ser 5 dígitos');
      if (!data.taxRegimeKey) throw new Error('Régimen fiscal requerido');

      if (step === 1) {
        // Pasar a review
        setStep(2);
        return;
      }

      // Step 2: Submit
      await setupTenantProfile(data);

      // ✅ Éxito
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            ¡Bienvenido a Switch OS!
          </h1>
          <p className="text-slate-600 mt-2">
            Completa tu perfil empresarial para empezar a facturar
          </p>
          <div className="mt-4 flex gap-2">
            <div className={`flex-1 h-1 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
            <div className={`flex-1 h-1 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg flex gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {step === 1 ? (
            <>
              {/* Step 1: Basic Info */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Nombre de la Empresa *
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="Ej: ACME Corporation"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <p className="text-xs text-slate-500 mt-1">Nombre comercial o razón social corta</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Razón Social (completa) *
                </label>
                <input
                  name="legalName"
                  type="text"
                  required
                  placeholder="ACME CORPORATION S.A. DE C.V."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <p className="text-xs text-slate-500 mt-1">Como aparece en tu RFC ante el SAT</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  RFC (Personas Morales: 12 caracteres) *
                </label>
                <input
                  name="rfc"
                  type="text"
                  required
                  maxLength={12}
                  placeholder="ABC123XYZ456"
                  pattern="[A-Z0-9]{12}"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Código Postal *
                </label>
                <input
                  name="zipCode"
                  type="text"
                  required
                  maxLength={5}
                  pattern="[0-9]{5}"
                  placeholder="28001"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Validando...' : 'Siguiente'}
              </button>
            </>
          ) : (
            <>
              {/* Step 2: Tax Regime Review */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                <div className="flex gap-2 items-start mb-3">
                  <CheckCircle className="text-blue-600 flex-shrink-0" size={20} />
                  <p className="text-sm text-blue-700">
                    <strong>Paso 1 completado.</strong> Ahora selecciona tu régimen fiscal.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Régimen Fiscal *
                </label>
                <select
                  name="taxRegimeKey"
                  required
                  defaultValue=""
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">— Selecciona tu régimen —</option>
                  {REGIMES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Si no estás seguro, consulta con tu contador o el SAT
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition"
                >
                  Atrás
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Guardando...' : '✓ Completar'}
                </button>
              </div>
            </>
          )}
        </form>

        <p className="text-xs text-slate-500 text-center mt-6">
          Esta información es obligatoria para emitir CFDI 4.0. Puedes editarla después.
        </p>
      </div>
    </div>
  );
}
```

### Archivo: `app/(dashboard)/onboarding/actions.ts` (NUEVO)

```typescript
'use server';

import { getSwitchSession } from '@/lib/auth/session';
import { validateRfc } from '@/lib/crm/rfc-validator';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function setupTenantProfile(data: {
  name: string;
  legalName: string;
  rfc: string;
  zipCode: string;
  taxRegimeKey: string;
}) {
  const session = await getSwitchSession();
  if (!session?.tenantId) {
    throw new Error('No hay sesión activa');
  }

  // Validación de RFC
  if (!validateRfc(data.rfc)) {
    throw new Error('RFC inválido. Debe ser 12 caracteres numéricos/alfabéticos.');
  }

  // Validación de CP
  if (!/^[0-9]{5}$/.test(data.zipCode)) {
    throw new Error('Código postal inválido (5 dígitos)');
  }

  // Actualizar tenant
  await prisma.tenant.update({
    where: { id: session.tenantId },
    data: {
      name: data.name.trim(),
      legalName: data.legalName.trim().toUpperCase(),
      rfc: data.rfc.toUpperCase(),
      zipCode: data.zipCode,
      // taxRegimeKey: data.taxRegimeKey, // Link con TaxRegime si existe
      onboardingComplete: true, // Marcar como completado
    },
  });

  // Invalidar caché
  revalidatePath('/');
}
```

**Decisión arquitectónica 12.4:**
- Onboarding **obligatorio** (no se puede saltar)
- 2 pasos: básico → régimen fiscal (para claridad)
- Datos validados en cliente + servidor (defensa en profundidad)
- Después de completar: redirect a `/dashboard`

---

## 12.5 ACTUALIZAR DASHBOARD LAYOUT — Forzar onboarding

### Archivo: `app/(dashboard)/layout.tsx` (MODIFICAR)

Agregar esta lógica después de `ensurePrismaUser`:

```typescript
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSwitchSession();

  if (!session) {
    redirect('/login');
  }

  await ensurePrismaUser(session.userId, session.email, session.name);

  // 🆕 FASE 12: Forzar onboarding si no está completo
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { onboardingComplete: true },
  });

  if (!tenant?.onboardingComplete && !session.isSuperAdmin) {
    // Permitir /onboarding, bloquear el resto
    if (!pathname.includes('/onboarding') && pathname !== '/logout') {
      redirect('/onboarding');
    }
  }

  // ... resto del layout
}
```

---

## 12.6 MIGRAR DASHBOARD A PRISMA

### Archivo: `app/(dashboard)/dashboard/page.tsx` (REEMPLAZAR)

```typescript
'use client';

import { Suspense } from 'react';
import { getDashboardStats } from './actions';
import KpiCard from '@/components/dashboard/KpiCard';
import StatChart from '@/components/dashboard/StatChart';
import { TrendingUp, Wallet, Users, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-1">Resumen financiero y operacional</p>
      </div>

      {/* KPI Cards */}
      <Suspense fallback={<SkeletonCards />}>
        <KpiSection />
      </Suspense>

      {/* Chart */}
      <Suspense fallback={<div className="bg-white rounded-lg h-80 animate-pulse" />}>
        <ChartSection />
      </Suspense>
    </div>
  );
}

async function KpiSection() {
  const stats = await getDashboardStats();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        title="Ingresos"
        value={stats.totalIngresos}
        icon={<TrendingUp />}
        trend={stats.ingresosTrend}
        color="blue"
      />
      <KpiCard
        title="Gastos"
        value={stats.totalGastos}
        icon={<AlertCircle />}
        trend={-stats.gastosTrend}
        color="red"
      />
      <KpiCard
        title="Utilidad"
        value={stats.utilidad}
        icon={<Wallet />}
        color={stats.utilidad > 0 ? 'green' : 'red'}
      />
      <KpiCard
        title="Clientes"
        value={stats.customerCount}
        icon={<Users />}
        color="purple"
      />
    </div>
  );
}

async function ChartSection() {
  const stats = await getDashboardStats();
  return <StatChart data={stats.monthlyData} />;
}

function SkeletonCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg p-6 h-32 animate-pulse" />
      ))}
    </div>
  );
}
```

### Archivo: `app/(dashboard)/dashboard/actions.ts` (NUEVO)

```typescript
'use server';

import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function getDashboardStats() {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No session');

  // Período: últimos 12 meses
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

  // ========== INGRESOS ==========
  // Desde Invoice (CFDI emitido)
  const invoices = await prisma.invoice.findMany({
    where: {
      tenant: { id: session.tenantId },
      status: 'STAMPED',
      createdAt: { gte: oneYearAgo },
    },
    select: { total: true, createdAt: true },
  });

  // Desde PosOrder
  const posOrders = await prisma.posOrder.findMany({
    where: {
      tenant: { id: session.tenantId },
      createdAt: { gte: oneYearAgo },
    },
    select: { total: true, createdAt: true },
  });

  const totalIngresos = [
    ...invoices.map((x) => parseFloat(String(x.total || 0))),
    ...posOrders.map((x) => parseFloat(String(x.total || 0))),
  ].reduce((sum, x) => sum + x, 0);

  // ========== GASTOS ==========
  // Desde JournalEntry → JournalLine (cuentas de gasto)
  const expenseLines = await prisma.journalLine.findMany({
    where: {
      journalEntry: {
        tenant: { id: session.tenantId },
        createdAt: { gte: oneYearAgo },
      },
      account: {
        accountType: { in: ['EXPENSE', 'COGS'] },
      },
    },
    select: { debit: true },
  });

  const totalGastos = expenseLines
    .map((x) => parseFloat(String(x.debit || 0)))
    .reduce((sum, x) => sum + x, 0);

  // ========== CLIENTES ==========
  const customerCount = await prisma.customer.count({
    where: { tenant: { id: session.tenantId } },
  });

  // ========== DATOS MENSUALES ==========
  const monthlyData = await getMonthlyData(session.tenantId, oneYearAgo, now);

  return {
    totalIngresos: Math.round(totalIngresos * 100) / 100,
    totalGastos: Math.round(totalGastos * 100) / 100,
    utilidad: Math.round((totalIngresos - totalGastos) * 100) / 100,
    ingresosTrend: 12.5, // TODO: calcular vs mes anterior
    gastosTrend: 8.2,    // TODO: calcular vs mes anterior
    customerCount,
    monthlyData,
  };
}

async function getMonthlyData(tenantId: string, startDate: Date, endDate: Date) {
  // Agrupar por mes: ingresos, gastos, utilidad
  const months: Record<string, { ingresos: number; gastos: number }> = {};

  // Inicializar 12 meses
  for (let i = 11; i >= 0; i--) {
    const d = new Date(endDate);
    d.setMonth(d.getMonth() - i);
    const key = d.toISOString().substring(0, 7); // "2026-03"
    months[key] = { ingresos: 0, gastos: 0 };
  }

  // Agregar ingresos por mes
  const invoices = await prisma.invoice.findMany({
    where: {
      tenant: { id: tenantId },
      status: 'STAMPED',
      createdAt: { gte: startDate, lte: endDate },
    },
    select: { total: true, createdAt: true },
  });

  invoices.forEach((inv) => {
    const key = inv.createdAt.toISOString().substring(0, 7);
    if (months[key]) {
      months[key].ingresos += parseFloat(String(inv.total || 0));
    }
  });

  // Agregar gastos por mes
  const expenses = await prisma.journalLine.findMany({
    where: {
      journalEntry: {
        tenant: { id: tenantId },
        createdAt: { gte: startDate, lte: endDate },
      },
      account: { accountType: { in: ['EXPENSE', 'COGS'] } },
    },
    select: { debit: true, journalEntry: { select: { createdAt: true } } },
  });

  expenses.forEach((exp) => {
    const key = exp.journalEntry.createdAt.toISOString().substring(0, 7);
    if (months[key]) {
      months[key].gastos += parseFloat(String(exp.debit || 0));
    }
  });

  // Convertir a array
  return Object.entries(months).map(([month, data]) => ({
    month: new Date(month + '-01').toLocaleString('es-MX', { month: 'short' }),
    ingresos: Math.round(data.ingresos * 100) / 100,
    gastos: Math.round(data.gastos * 100) / 100,
  }));
}
```

**Decisión arquitectónica 12.6:**
- Dashboard ahora lee de Prisma (Invoice, PosOrder, JournalEntry)
- No depende de tablas legacy Supabase
- Datos agregados por mes para visualización
- Server Components + Suspense para UX progresiva

---

## 12.7 MIGRAR RRHH A PRISMA — Asistencias

### Archivo: `app/(dashboard)/rrhh/page.tsx` (REEMPLAZAR)

```typescript
'use client';

import { useState, useEffect } from 'react';
import { getAttendanceReport, clockInEmployee, clockOutEmployee } from './actions';
import { Button } from '@/components/ui/Button';
import { Clock, LogOut } from 'lucide-react';
import { formatTime } from '@/lib/utils/date';

interface AttendanceRow {
  employeeId: string;
  employeeName: string;
  date: string;
  clockInTime: string | null;
  clockOutTime: string | null;
}

export default function RrhhPage() {
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getAttendanceReport();
        setAttendance(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleClockOut(employeeId: string) {
    await clockOutEmployee(employeeId);
    // Recargar
    const data = await getAttendanceReport();
    setAttendance(data);
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Control de Asistencias</h1>
          <p className="text-slate-600 mt-1">Registro de entrada/salida</p>
        </div>
        <Button href="/rrhh/empleados" variant="primary">
          + Nuevo Empleado
        </Button>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Cargando...</div>
      ) : attendance.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          No hay empleados registrados
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Empleado
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Entrada
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Salida
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((row) => (
                <tr key={`${row.employeeId}-${row.date}`} className="border-b hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    {row.employeeName}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(row.date).toLocaleDateString('es-MX')}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {row.clockInTime ? (
                      <span className="flex items-center gap-2">
                        <Clock size={16} className="text-green-600" />
                        {formatTime(row.clockInTime)}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {row.clockOutTime ? (
                      <span className="flex items-center gap-2">
                        <LogOut size={16} className="text-red-600" />
                        {formatTime(row.clockOutTime)}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-sm space-x-2">
                    {!row.clockOutTime && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleClockOut(row.employeeId)}
                      >
                        Salida
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

### Archivo: `app/(dashboard)/rrhh/actions.ts` (NUEVO)

```typescript
'use server';

import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getAttendanceReport() {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No session');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendance = await prisma.attendance.findMany({
    where: {
      employee: { tenantId: session.tenantId },
      date: { gte: today },
    },
    include: {
      employee: { select: { name: true } },
    },
    orderBy: [{ date: 'desc' }, { employee: { name: 'asc' } }],
  });

  return attendance.map((a) => ({
    employeeId: a.employeeId,
    employeeName: a.employee.name,
    date: a.date.toISOString(),
    clockInTime: a.clockInTime?.toISOString() || null,
    clockOutTime: a.clockOutTime?.toISOString() || null,
  }));
}

export async function clockInEmployee(employeeId: string) {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No session');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Validar que el empleado pertenece a este tenant
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });
  if (!employee || employee.tenantId !== session.tenantId) {
    throw new Error('Empleado no encontrado');
  }

  // Upsert: si existe hoy, solo actualizar entrada si vacía
  const result = await prisma.attendance.upsert({
    where: {
      employeeId_date: {
        employeeId,
        date: today,
      },
    },
    create: {
      employeeId,
      date: today,
      clockInTime: new Date(),
    },
    update: {
      // Solo si no tiene entrada aún
      clockInTime: { set: new Date() },
    },
  });

  revalidatePath('/rrhh');
  return result;
}

export async function clockOutEmployee(employeeId: string) {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No session');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = await prisma.attendance.update({
    where: {
      employeeId_date: {
        employeeId,
        date: today,
      },
    },
    data: { clockOutTime: new Date() },
  });

  revalidatePath('/rrhh');
  return result;
}
```

**Decisión arquitectónica 12.7:**
- Attendance usa composite key `[employeeId, date]` → solo 1 entrada/salida por día
- Clock-out solo funciona si no existe
- Auditoría automática con `createdAt`, `updatedAt`

---

## CHECKLIST FASE 12

```
🔧 SCHEMA & MIGRATIONS
  [ ] Agregar Employee model a prisma/schema.prisma
  [ ] Agregar Attendance model a prisma/schema.prisma
  [ ] Agregar onboardingComplete: Boolean a Tenant
  [ ] Ejecutar: npx prisma migrate dev --name add_employee_attendance_models
  [ ] Verificar migración en prisma/migrations/

📝 ARCHIVOS NUEVOS
  [ ] app/(dashboard)/onboarding/page.tsx (UI)
  [ ] app/(dashboard)/onboarding/actions.ts (setupTenantProfile)
  [ ] app/(dashboard)/dashboard/actions.ts (getDashboardStats)
  [ ] app/(dashboard)/rrhh/actions.ts (clock in/out)

✏️ ARCHIVOS MODIFICADOS
  [ ] lib/auth/ensure-user.ts (auto-modules + TRIAL subscription)
  [ ] lib/auth/session.ts (agregar subStatus, validUntil)
  [ ] app/(dashboard)/layout.tsx (forzar onboarding redirect)
  [ ] app/(dashboard)/dashboard/page.tsx (Suspense + Prisma data)
  [ ] app/(dashboard)/rrhh/page.tsx (Suspense + Prisma attendance)
  [ ] components/dashboard/Header.tsx (agregar subscription badge)

🧪 TESTING MANUAL
  [ ] Crear nuevo usuario (email diferente)
  [ ] Verificar que redirige a /onboarding
  [ ] Completar onboarding con RFC/nombre/CP/régimen
  [ ] Verificar que ahora tiene 4 módulos activos
  [ ] Ver dashboard cargando ingresos/gastos reales (o 0 si no hay datos)
  [ ] Ver RRHH mostrando tabla vacía de asistencias
  [ ] Verificar JWT incluye sub_status="TRIAL" y valid_until = +14 días
  [ ] Intentar acceder a módulo no activado (ej /rrhh/nomina) → debe bloquear
  [ ] Verificar subscription badge en header (muestra "14 días restantes")

✅ DEPLOYMENT
  [ ] git add -A
  [ ] git commit -m "FASE 12: Infraestructura Base — Employee + Attendance + Onboarding"
  [ ] git push origin fase12/infraestructura-base
  [ ] Crear PR #7
  [ ] Merge a main
```

**Tiempo estimado:** ~2 horas

---

# FASE 13: Motor de Facturación CFDI UI
## *(Hacer accesible lo que ya existe)*

**Duración:** ~1.5 horas
**Rama:** `fase13/cfdi-billing-ui`
**Dependencias:** FASE 12 merged
**Objetivo:** UI para emitir CFDI usando el motor que existe desde FASE 7

---

## 13.1 CREAR PÁGINA PRINCIPAL `/billing`

### Archivo: `app/(dashboard)/billing/page.tsx` (NUEVO)

```typescript
'use client';

import { useState, useEffect } from 'react';
import { getInvoices } from './actions';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Download, FileText, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { formatDate, formatCurrency } from '@/lib/utils';

interface Invoice {
  id: string;
  serie: string;
  folio: string;
  emitter: { name: string };
  receptor: { rfc: string; name: string };
  total: number;
  status: 'DRAFT' | 'SUBMITTED' | 'STAMPED' | 'CANCELED';
  createdAt: string;
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [csdStatus, setCsdStatus] = useState<'missing' | 'valid' | 'expired'>('missing');

  useEffect(() => {
    async function load() {
      try {
        const [invs, status] = await Promise.all([
          getInvoices(),
          getCsdStatus(),
        ]);
        setInvoices(invs);
        setCsdStatus(status);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const statusColor = {
    DRAFT: 'gray',
    SUBMITTED: 'blue',
    STAMPED: 'green',
    CANCELED: 'red',
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Facturación CFDI 4.0</h1>
          <p className="text-slate-600 mt-1">Gestión de comprobantes fiscales</p>
        </div>
        <div className="flex gap-3">
          {csdStatus !== 'missing' && (
            <Button href="/billing/nueva" variant="primary">
              + Nueva Factura
            </Button>
          )}
          <Button href="/billing/csd" variant="secondary">
            Configurar CSD
          </Button>
        </div>
      </div>

      {/* CSD Warning */}
      {csdStatus === 'missing' && (
        <div className="p-4 bg-orange-50 border border-orange-300 rounded-lg flex gap-3">
          <AlertCircle className="text-orange-600 flex-shrink-0" size={20} />
          <div>
            <p className="font-semibold text-orange-900">CSD no configurado</p>
            <p className="text-sm text-orange-800 mt-1">
              Necesitas subir tu certificado de sello digital (CSD) para emitir facturas.
              <Link href="/billing/csd" className="font-semibold underline ml-1">
                Configurar ahora
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Invoices Table */}
      {loading ? (
        <div className="text-center py-12">Cargando...</div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          No hay facturas emitidas. {csdStatus !== 'missing' && (
            <Link href="/billing/nueva" className="text-blue-600 font-semibold">
              Crear primera factura
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Folio</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Receptor</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Total</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Estado</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Fecha</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-mono">
                    {inv.serie}-{String(inv.folio).padStart(8, '0')}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div>{inv.receptor.name}</div>
                    <div className="text-xs text-slate-500">{inv.receptor.rfc}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold">
                    {formatCurrency(inv.total)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Badge color={statusColor[inv.status]}>{inv.status}</Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {formatDate(inv.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {inv.status === 'STAMPED' && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => downloadXml(inv.id)}
                        >
                          <Download size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => downloadPdf(inv.id)}
                        >
                          <FileText size={16} />
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

async function getCsdStatus() {
  // TODO: Implement
  return 'missing';
}

async function downloadXml(invoiceId: string) {
  // TODO: Implement getInvoiceXml server action
  alert('Descargando XML...');
}

async function downloadPdf(invoiceId: string) {
  // TODO: Implement PDF generation
  alert('Descargando PDF...');
}
```

### Archivo: `app/(dashboard)/billing/actions.ts` (NUEVO)

```typescript
'use server';

import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';

export async function getInvoices() {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No session');

  const invoices = await prisma.invoice.findMany({
    where: { tenant: { id: session.tenantId } },
    include: {
      emitter: { select: { name: true } },
      receptor: { select: { rfc: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return invoices.map((inv) => ({
    id: inv.id,
    serie: inv.serie,
    folio: String(inv.folio),
    emitter: { name: inv.emitter.name },
    receptor: { rfc: inv.receptor.rfc, name: inv.receptor.name },
    total: inv.total,
    status: inv.status,
    createdAt: inv.createdAt.toISOString(),
  }));
}

export async function getInvoiceXml(invoiceId: string) {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No session');

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
  });

  if (!invoice || invoice.tenantId !== session.tenantId) {
    throw new Error('Invoice not found');
  }

  if (!invoice.xmlSigned) {
    throw new Error('XML not available');
  }

  return invoice.xmlSigned; // base64 o string XML
}
```

---

## 13.2 PÁGINA CSD UPLOAD

### Archivo: `app/(dashboard)/billing/csd/page.tsx` (NUEVO)

```typescript
'use client';

import { useState } from 'react';
import { uploadCsd } from '../actions';
import { Button } from '@/components/ui/Button';
import { AlertCircle, CheckCircle, Upload } from 'lucide-react';

export default function CsdPage() {
  const [cert, setCert] = useState<File | null>(null);
  const [key, setKey] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!cert || !key || !password) {
        throw new Error('Todos los campos son obligatorios');
      }

      const formData = new FormData();
      formData.append('cert', cert);
      formData.append('key', key);
      formData.append('password', password);

      await uploadCsd(formData);
      setSuccess(true);
      setCert(null);
      setKey(null);
      setPassword('');

      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setError(err.message || 'Error al subir CSD');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Configurar Certificado de Sello Digital</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg flex gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-300 rounded-lg flex gap-3">
          <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
          <p className="text-green-700">CSD configurado correctamente</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
        {/* Certificado */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Archivo .cer (Certificado) *
          </label>
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".cer"
              onChange={(e) => setCert(e.target.files?.[0] || null)}
              className="hidden"
              id="cert-input"
            />
            <label htmlFor="cert-input" className="cursor-pointer">
              <Upload className="mx-auto mb-2 text-slate-400" size={32} />
              <p className="text-sm text-slate-600">
                {cert ? cert.name : 'Selecciona archivo .cer'}
              </p>
            </label>
          </div>
        </div>

        {/* Llave privada */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Archivo .key (Llave Privada) *
          </label>
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".key"
              onChange={(e) => setKey(e.target.files?.[0] || null)}
              className="hidden"
              id="key-input"
            />
            <label htmlFor="key-input" className="cursor-pointer">
              <Upload className="mx-auto mb-2 text-slate-400" size={32} />
              <p className="text-sm text-slate-600">
                {key ? key.name : 'Selecciona archivo .key'}
              </p>
            </label>
          </div>
        </div>

        {/* Contraseña */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Contraseña de la Llave *
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg"
          />
          <p className="text-xs text-slate-500 mt-1">
            La contraseña se encripta y nunca se almacena en texto plano
          </p>
        </div>

        {/* Submit */}
        <Button type="submit" disabled={loading} variant="primary" className="w-full">
          {loading ? 'Procesando...' : '📁 Subir CSD'}
        </Button>

        <div className="p-4 bg-blue-50 border border-blue-300 rounded-lg text-sm text-blue-700">
          <p className="font-semibold mb-2">¿Dónde consigo el CSD?</p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>Descargalo desde el SAT: sat.gob.mx → Mi Cuenta</li>
            <li>Necesitas credenciales RFC + contraseña</li>
            <li>El archivo comprimido incluye .cer y .key</li>
          </ul>
        </div>
      </form>
    </div>
  );
}
```

---

## 13.3 WIZARD DE NUEVA FACTURA

*(Este es más complejo, por brevedad incluyo structure)*

### Archivo: `app/(dashboard)/billing/nueva/page.tsx` (NUEVO — SCAFFOLD)

```typescript
'use client';

import { useState } from 'react';
import Step1Receptor from '@/components/billing/Step1Receptor';
import Step2Conceptos from '@/components/billing/Step2Conceptos';
import Step3Impuestos from '@/components/billing/Step3Impuestos';
import Step4Preview from '@/components/billing/Step4Preview';

export default function NewInvoicePage() {
  const [step, setStep] = useState(1);
  const [invoice, setInvoice] = useState({});

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Nueva Factura CFDI</h1>

      {/* Step indicator */}
      <div className="flex gap-4 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`flex-1 h-2 rounded-full ${
              step >= s ? 'bg-blue-600' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      {/* Steps */}
      {step === 1 && <Step1Receptor data={invoice} onChange={setInvoice} onNext={() => setStep(2)} />}
      {step === 2 && <Step2Conceptos data={invoice} onChange={setInvoice} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
      {step === 3 && <Step3Impuestos data={invoice} onChange={setInvoice} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
      {step === 4 && <Step4Preview data={invoice} onBack={() => setStep(3)} onSubmit={() => handleSubmit(invoice)} />}
    </div>
  );
}

async function handleSubmit(invoice: any) {
  // TODO: createInvoice action
}
```

---

## CHECKLIST FASE 13

```
✅ BILLING MAIN PAGE
  [ ] app/(dashboard)/billing/page.tsx (invoice list)
  [ ] app/(dashboard)/billing/actions.ts (getInvoices, getInvoiceXml)
  [ ] Tabla con invoices (DRAFT, SUBMITTED, STAMPED, CANCELED)
  [ ] Download buttons para XML/PDF (placeholders)
  [ ] CSD status indicator

🔐 CSD CONFIGURATION
  [ ] app/(dashboard)/billing/csd/page.tsx (cert + key + password upload)
  [ ] Validación de archivos (.cer, .key)
  [ ] Link desde /billing main page

📝 WIZARD (Scaffold)
  [ ] app/(dashboard)/billing/nueva/page.tsx (4 steps)
  [ ] components/billing/Step1Receptor.tsx (select customer)
  [ ] components/billing/Step2Conceptos.tsx (add line items)
  [ ] components/billing/Step3Impuestos.tsx (tax summary)
  [ ] components/billing/Step4Preview.tsx (XML preview + submit)

🧪 TESTING
  [ ] Ver /billing sin facturas → mostrar "crear primera"
  [ ] Clic en "Configurar CSD" → ir a /billing/csd
  [ ] Simular upload CSD (aunque no funcione backend aún)
  [ ] Ver /billing/nueva scaffold

✅ DEPLOYMENT
  [ ] git commit -m "FASE 13: CFDI Billing UI — invoice list + CSD config"
  [ ] git push origin fase13/cfdi-billing-ui
  [ ] PR #8
```

---

# FASE 14: Interconexiones Críticas
## *(POS→CFDI, CFDI→Accounting)*

**Duración:** ~1.5 horas
**Rama:** `fase14/interconexiones-criticas`
**Dependencias:** FASE 13 merged
**Objetivo:** Datos fluyen automáticamente entre módulos

### 14.1 POS → CFDI Auto-Generate

Cuando `checkout()` completa en POS:
- Si tenant tiene CSD cargado
- Llamar `createInvoice()` del motor CFDI
- Resultado: PosOrder linkado a Invoice STAMPED

**Modificar:** `app/(dashboard)/pos/actions.ts`

```typescript
export async function checkout(
  cart: CartItem[],
  paymentMethod: string,
  amountPaid: number
) {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No session');

  // ... crear PosOrder ...

  // 🆕 FASE 14: Auto-CFDI si CSD existe
  const csd = await prisma.csdVault.findFirst({
    where: { tenant: { id: session.tenantId } },
  });

  if (csd) {
    // Preparar datos para createInvoice
    const cfdiInput = {
      // ... mapear PosOrder → CfdiInput ...
    };

    try {
      const invoice = await createCfdi(cfdiInput);
      // Linkear PosOrder → Invoice
      await prisma.posOrder.update({
        where: { id: posOrderId },
        data: { invoiceId: invoice.id },
      });
    } catch (err) {
      // Log pero no fallar checkout
      console.error('CFDI auto-generation failed:', err);
    }
  }

  return posOrder;
}
```

---

### 14.2 CFDI → Accounting (Poliza de Ingreso)

Cuando Invoice status cambia a STAMPED:
- Auto-crear `JournalEntry` (tipo INGRESO)
- Dr. Cuentas por Cobrar / Cr. Ventas + IVA Trasladado

**Modificar:** `lib/cfdi/index.ts` paso 10 (después de PAC stamp)

```typescript
// En createCfdi(), al final del paso 10:

if (result.status === 'STAMPED') {
  // 🆕 FASE 14: Auto-create journal entry
  await generateJournalFromCfdi(invoice.id);
}
```

**Nueva función:** `lib/accounting/cfdi-journal.ts`

```typescript
export async function generateJournalFromCfdi(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { items: true },
  });

  if (!invoice) throw new Error('Invoice not found');

  // Crear poliza de ingreso
  // Dr. 1210 (Cuentas por Cobrar) = total - descuentos
  // Cr. 2010 (IVA Trasladado) = total IVA
  // Cr. 4010 (Ventas) = subtotal neto

  const poliza = await prisma.journalEntry.create({
    data: {
      tenantId: invoice.tenantId,
      entryNumber: `PGI-${Date.now()}`,
      date: new Date(),
      concept: `Factura ${invoice.serie}-${invoice.folio}`,
      sourceType: 'CFDI_EMITIDO',
      entryType: 'INGRESO',
      lines: {
        createMany: {
          data: [
            // Débito: CxC
            {
              accountId: '1210', // Cuentas por Cobrar
              description: `Factura ${invoice.serie}-${invoice.folio}`,
              debit: invoice.total,
              credit: 0,
            },
            // Crédito: IVA
            {
              accountId: '2010', // IVA Trasladado
              description: 'IVA trasladado',
              debit: 0,
              credit: invoice.totalTax,
            },
            // Crédito: Ventas
            {
              accountId: '4010', // Ventas
              description: 'Ventas',
              debit: 0,
              credit: invoice.subtotal,
            },
          ],
        },
      },
    },
  });

  return poliza;
}
```

---

### 14.3 Gastos XML → Accounting (Poliza de Egreso)

*(Similar a 14.2, pero para expenses)*

---

### 14.4 CRM Customer → CFDI Receptor Pre-fill

En `/billing/nueva` Step 1, agregar búsqueda de customers por RFC:

```typescript
async function searchCustomerByRfc(rfc: string) {
  const customer = await prisma.customer.findUnique({
    where: { tenantId_rfc: { tenantId, rfc } },
  });
  if (customer) {
    // Pre-fill receptor fields
    return customer;
  }
  return null;
}
```

---

### 14.5 Validación Stock en POS

En `checkout()` validation:

```typescript
// Validar stock antes de crear PosOrder
for (const item of cart) {
  const product = await prisma.product.findUnique({
    where: { id: item.productId },
  });

  if (!product || product.stock < item.quantity) {
    throw new Error(`Stock insuficiente para ${product.name}`);
  }
}

// Decrementar stock
for (const item of cart) {
  await prisma.product.update({
    where: { id: item.productId },
    data: {
      stock: { decrement: item.quantity },
    },
  });
}
```

---

## CHECKLIST FASE 14

```
🔗 POS → CFDI
  [ ] Modificar pos/actions.ts checkout()
  [ ] Auto-detectar CSD presence
  [ ] Auto-create Invoice si CSD existe
  [ ] Link PosOrder.invoiceId → Invoice.id

📔 CFDI → ACCOUNTING
  [ ] Crear lib/accounting/cfdi-journal.ts
  [ ] generateJournalFromCfdi(invoiceId) automático
  [ ] Poliza tipo INGRESO con estructura:
    - Dr. CxC (1210)
    - Cr. IVA (2010)
    - Cr. Ventas (4010)

💰 GASTOS → ACCOUNTING
  [ ] Similar para gastos (XML Egreso)
  [ ] Poliza tipo EGRESO

👥 CRM → CFDI
  [ ] searchCustomerByRfc() en /billing/nueva
  [ ] Pre-fill receptor fields

📦 STOCK VALIDATION
  [ ] Validar stock >= cantidad en checkout()
  [ ] Decrementar stock post-venta
  [ ] Bloquear venta si stock < 0

🧪 TESTING
  [ ] POS checkout → verificar que crea Invoice automáticamente
  [ ] Ver Invoice en /billing como STAMPED
  [ ] Ver JournalEntry creada automáticamente
  [ ] Verificar contabilidad: debito = credito

✅ DEPLOYMENT
  [ ] git commit -m "FASE 14: Interconexiones — POS→CFDI→Accounting"
  [ ] git push origin fase14/interconexiones-criticas
  [ ] PR #9
```

---

# FASES 15-19: ROADMAP CONDENSADO

Dado el tamaño del documento, aquí va el resumen ejecutivo:

---

## FASE 15: RRHH Completo
**~1.5 horas**

- Catálogo de empleados CRUD
- Nómina básica (quincena)
- Póliza de nómina automática (CFDI-N)
- Reportes mensuales

**Archivos:** `/rrhh/empleados`, `/rrhh/nomina`, `lib/payroll/calculator.ts`

---

## FASE 16: Finanzas Módulos
**~2 horas**

- `/finanzas/impuestos`: ISR/IVA a pagar/acreditar
- `/finanzas/cobranza`: Aging de CxC
- `/finanzas/caja-chica`: Control petty cash
- Balanza de comprobación: reporte de all accounts

---

## FASE 17: SCM Inventarios
**~1.5 horas**

- Modelo `InventoryMovement`
- `/scm/inventarios`: Kardex por producto
- `/scm/compras`: Órdenes de compra → stock increment
- Alertas de mínimos

---

## FASE 18: CRM + BI
**~2 horas**

- CRM pipeline real (etapas: Prospecto → Ganado/Perdido)
- `/crm/marketing`: Campañas + tracking
- `/crm/soporte`: Tickets con SLA
- `/bi`: KPIs (MRR, ticket promedio, top productos/clientes)

---

## FASE 19: Production Readiness
**~2 horas**

- Error boundaries en todas las páginas
- Skeleton loaders / Suspense
- Email templates (welcome, CFDI, payment reminders) via Resend
- Admin: tenant creation UI
- Audit log
- Tests E2E (Playwright)
- Deploy checklist

---

## TIMELINE ESTIMADO

```
FASE 12: 2h    ✅ (Infraestructura, bloqueador crítico)
FASE 13: 1.5h  ✅ (CFDI UI, accesibilidad)
FASE 14: 1.5h  ✅ (Interconexiones, data flow)
─────────────────────────────────
     Total: 5h = **Cliente MVP funcional aquí**
─────────────────────────────────
FASE 15: 1.5h  (RRHH completo)
FASE 16: 2h    (Finanzas)
FASE 17: 1.5h  (Inventarios)
FASE 18: 2h    (CRM + BI)
FASE 19: 2h    (Production)
─────────────────────────────────
     Total: 10h = **Sistema MVP completo**

Grand Total: **15 horas ≈ 5-7 sesiones de 2-3 horas c/u**
```

---

## DECISIONES ARQUITECTÓNICAS IMPLEMENTADAS

| Decisión | Implementación | Impacto |
|----------|---|---|
| **Tenant onboarding obligatorio** | Redirect a `/onboarding` si `!onboardingComplete` | RFC/nombre legal garantizado para CFDI |
| **Módulos base auto-activos** | 4 módulos (DASHBOARD, BILLING, POS, CRM) | Nuevo cliente puede vender desde día 1 |
| **TRIAL = 14 días** | `validUntil = now + 14 days` | Tiempo estándar para decisión de compra |
| **POS → CFDI auto** | Si CSD existe, auto-stamp después de checkout | Flujo sin fricción: vender + facturar en 1 click |
| **CFDI → Accounting auto** | JournalEntry creada al moment

o de stamp | Contabilidad automáticamente actualizada |
| **Prisma-only DB** | Elimina tablas legacy Supabase | Data limpia, single source of truth |
| **Email Resend.dev** | Freemium 100/día, profesional | Costo $0, escalable después |
| **Stock bloqueo** | No se permite vender sin stock | Evita overselling |
| **PAC Mock + feature flag** | Desarrollo usa mock, production ready para real | MVP sin costo PAC |
| **Timezone Mexico City** | UTC-6 asumido, ajustable post-MVP | Simplifica lógica temporal |

---

## REFERENCIAS RÁPIDAS

### Rutas críticas
```
/login → /onboarding → /dashboard
/dashboard → /billing/nueva → /billing/csd → /billing (CFDI list)
/pos → checkout → (auto-CFDI) → /billing (invoice list)
/finanzas/gastos → XML upload → (auto-poliza) → /finanzas/contabilidad
```

### Modelos clave
```
Tenant → Users, Customers, Products, Invoices, JournalEntries, Employees
Invoice → Items, JournalEntry (auto)
PosOrder → items, Invoice (auto)
Employee → Attendances, Payroll
JournalEntry → Lines (balanced, debit=credit)
```

### SQL Key Indices
```
tenantId: TODOS los modelos
(tenantId, rfc): Customers, Employees
(employeeId, date): Attendances
(date): Invoices, JournalEntries
```

---

## PULL REQUEST SEQUENCE

```
PR #7: FASE 12 (infraestructura base)
PR #8: FASE 13 (CFDI UI)
PR #9: FASE 14 (interconexiones)
PR #10: FASE 15 (RRHH)
PR #11: FASE 16 (Finanzas)
PR #12: FASE 17 (SCM)
PR #13: FASE 18 (CRM + BI)
PR #14: FASE 19 (Production)
```

---

**Documento finalizado.** Listo para iniciarsesión FASE 12. ¿Empezamos?
