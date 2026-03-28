# 🎯 CIFRA ERP — PLAN MAESTRO FASES 12-40
## De Infraestructura a Producto SaaS Enterprise

**Generado:** 2026-03-25 | **Actualizado:** 2026-03-28
**Última FASE completada:** FASE 25 (RBAC — PR #22 merged)
**Siguiente:** FASE 26 (Notificaciones en Tiempo Real)
**Objetivo:** Producto SaaS completo · Clientes activos · Escalabilidad enterprise

---

## TABLA DE CONTENIDOS
### ✅ Fases Completadas
1. [Estado Actual](#estado-actual)
2. FASE 12–19: MVP Sistema Completo *(ver secciones en el documento)*
3. FASE 20–25: Producto SaaS Lanzado *(ver secciones en el documento)*

### 🚀 Próximas Fases
16. [FASE 26: Notificaciones en Tiempo Real](#fase-26-notificaciones-en-tiempo-real)
17. [FASE 27: Portal del Cliente](#fase-27-portal-del-cliente)
18. [FASE 28: BI Dashboard Real](#fase-28-bi-dashboard-real)
19. [FASE 29: POS Completo](#fase-29-pos-completo)
20. [FASE 30: Calendario / Citas](#fase-30-calendario--citas)
21. [FASE 31: SCM Compras + Logística](#fase-31-scm-compras--logística)
22. [FASE 32: CRM Marketing + Soporte](#fase-32-crm-marketing--soporte)
23. [FASE 33: MRP Real](#fase-33-mrp-real)
24. [FASE 34: RRHH Asistencia + Documentos](#fase-34-rrhh-asistencia--documentos)
25. [FASE 35: Multi-idioma (i18n)](#fase-35-multi-idioma-i18n)
26. [FASE 36: PWA + Offline](#fase-36-pwa--offline)
27. [FASE 37: Integraciones Externas](#fase-37-integraciones-externas)
28. [FASE 38: AI Copilot](#fase-38-ai-copilot)
29. [FASE 39: Marketplace de Integraciones](#fase-39-marketplace-de-integraciones)
30. [FASE 40: Enterprise Multi-empresa](#fase-40-enterprise-multi-empresa)

31. [Decisiones Arquitectónicas](#decisiones-arquitectónicas)

---

## ESTADO ACTUAL

### Commits completados
```
✅ FASE 10: Contabilidad Base (PR #6 merged)
✅ FASE 11: Paywall SPEI (PR #7 merged)
✅ FASE 12: Infraestructura Base — Employee + Onboarding + Dashboard Prisma (PR #8 merged)
✅ FASE 13: Motor Facturación CFDI UI — Billing list + CSD config + Wizard (PR #9 merged)
✅ FASE 14: Interconexiones POS↔CFDI↔Contabilidad + Validación stock (PR #10 merged)
✅ FASE 15: RRHH Completo — Nómina ISR/IMSS 2026 + Catálogo Empleados (PR #11 merged)
✅ FASE 16: Finanzas Módulos — Impuestos, Cobranza, Caja Chica desde Prisma (PR #12 merged)
✅ FASE 17: SCM Inventarios — Warehouse + StockMovement + Catálogo real (PR #13 merged)
✅ FASE 18: CRM Pipeline Kanban + BI Dashboard con datos Prisma (PR #14 merged)
✅ FASE 19: Production Readiness — Error Boundaries, Security Headers, 63 Tests (PR #15 merged)
✅ FASE 20: Deploy a Producción — Vercel + CI/CD + Health Check (PR #16 merged)
✅ FASE 21: Onboarding Wizard 3 pasos + Email bienvenida (PR #17 merged)
✅ FASE 22: Stripe Billing — Checkout + Webhook + Portal + Pricing UI (PR #18 merged)
✅ FASE 23: Landing Page CIFRA — Hero + Módulos + Perfiles + Precios (PR #20 merged)
✅ FASE 24: Reportes PDF/Excel — CFDI, Estado de Cuenta, Nómina (PR #21 merged)
✅ FASE 25: RBAC — Roles, permisos por ruta, AuditLog, UserRoleManager (PR #22 merged)
✅ FASE 26: Notificaciones — Notification model, 4 API routes, NotificationCenter, 4 triggers (PR #23 merged)
🚀 FASE 27-40: Pendiente
```

### Base de datos actual (post-FASE 19)
```
Models Prisma: 36+ modelos
- Tenant ✅ (con subscription, onboardingComplete)
- User ✅ (con role)
- Customer ✅ (con RFC/régimen, deals CRM)
- Product ✅ (minStock, stockMovements)
- PosOrder ✅ (con ticket code, items)
- Invoice ✅ (CFDI 4.0 completo)
- Account ✅ (catálogo SAT)
- JournalEntry ✅ (pólizas, partida doble)
- PaymentProof ✅ (SPEI proof)
- Employee ✅ (con CURP, IMSS, salary)
- Attendance ✅ (clock in/out por día)
- PayrollRun / PayrollLine ✅ (nómina ISR/IMSS)
- PettyCashFund / PettyCashExpense ✅ (caja chica)
- Warehouse ✅ (almacenes con lock para inventario físico)
- StockMovement ✅ (auditoría de movimientos)
- PipelineColumn ✅ (kanban etapas)
- Deal ✅ (CRM deals con probabilidad)
- Subscription ✅ (Stripe — stripeSubscriptionId, stripePriceId, status)
- AuditLog ✅ (FASE 25 — tenantId, actorId, action, severity, oldData/newData)
```

### Módulos implementados (post-FASE 25)
```
✅ REAL — Prisma-only, datos reales:
  - /dashboard (KPIs: ingresos, gastos, clientes, utilidad)
  - /admin (tenant manager, module control)
  - /pos (POS terminal, checkout, ticket)
  - /billing (CFDI 4.0 emisión + lista + CSD upload)
  - /finanzas/gastos (XML drag-drop)
  - /finanzas/contabilidad (XML batch, pólizas)
  - /finanzas/impuestos (IVA/ISR proyección + aging)
  - /finanzas/cobranza (aging CxC 4 buckets)
  - /finanzas/caja-chica (petty cash LISR)
  - /rrhh (asistencias Prisma)
  - /rrhh/empleados (catálogo + CRUD)
  - /rrhh/nomina (cálculo ISR/IMSS 2026)
  - /scm/inventarios (catálogo + almacenes + movimientos)
  - /crm/pipeline (Kanban 6 etapas + deals)
  - /bi (BI dashboard: tendencia, top productos, funnel)
  - /factura-tu-ticket (public auto-invoice)

✅ BLOQUEADORES RESUELTOS (FASES 20-25):
  1. ✅ URL pública en producción — cifra-mx.vercel.app (FASE 20)
  2. ✅ Registro público de tenants con wizard onboarding (FASE 21)
  3. ✅ Stripe Billing — checkout, webhooks, portal (FASE 22)
  4. ✅ Landing Page pública con pricing (FASE 23)
  5. ✅ Exportación PDF/Excel — CFDI, Estado de Cuenta, Nómina (FASE 24)
  6. ✅ RBAC — roles ADMIN/MANAGER/OPERATIVE, audit log (FASE 25)

🎯 SIGUIENTE NIVEL (FASES 26-40):
  - Notificaciones, Portal Cliente, BI real, POS completo, Calendario
  - SCM Compras, CRM Soporte/Marketing, MRP, RRHH Asistencia
  - i18n, PWA, Integraciones externas, AI Copilot, Multi-empresa
```

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
 * CIFRA — Sincronización Prisma (Server-side only)
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
 * CIFRA — Session helpers (Server-side only)
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
            ¡Bienvenido a CIFRA!
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
FASE 15: 1.5h  ✅ (RRHH completo)
FASE 16: 2h    ✅ (Finanzas)
FASE 17: 1.5h  ✅ (Inventarios)
FASE 18: 2h    ✅ (CRM + BI)
FASE 19: 2h    ✅ (Production Readiness)
─────────────────────────────────
     Total: 10h ✅ = **Sistema MVP completo**
─────────────────────────────────
FASE 20: 2h    (Deploy a Producción — URL pública)
FASE 21: 2h    (Onboarding público + Registro tenant)
FASE 22: 2.5h  (Stripe Billing — planes + webhooks)
FASE 23: 1.5h  (Landing Page — adquisición clientes)
FASE 24: 2h    (Reportes PDF / Excel)
FASE 25: 2h    (RBAC — Roles y Permisos)
─────────────────────────────────
     Total: 12h = **Producto SaaS lanzable**

Grand Total acumulado: **27 horas ≈ 9-13 sesiones de 2-3 horas c/u**
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
PR #7:  FASE 12 — Infraestructura Base            ✅ merged
PR #8:  FASE 13 — CFDI Billing UI                 ✅ merged
PR #9:  FASE 14 — Interconexiones POS↔CFDI        ✅ merged
PR #10: FASE 15 — RRHH + Nómina ISR/IMSS          ✅ merged
PR #11: FASE 16 — Finanzas Módulos                ✅ merged
PR #12: FASE 17 — SCM Inventarios                 ✅ merged
PR #13: FASE 18 — CRM Pipeline + BI               ✅ merged
PR #14: FASE 19 — Production Readiness            ✅ merged
PR #15: FASE 19 — [abierto, pendiente merge]      🔄 open
────────────────────────────────────────────────────
PR #16: FASE 20 — Deploy a Producción             ⏳ próximo
PR #17: FASE 21 — Onboarding Público              ⏳ pendiente
PR #18: FASE 22 — Stripe Billing                  ⏳ pendiente
PR #19: FASE 23 — Landing Page                    ⏳ pendiente
PR #20: FASE 24 — Reportes PDF / Excel            ⏳ pendiente
PR #21: FASE 25 — RBAC Roles y Permisos           ⏳ pendiente
```

---

**FASEs 12-19 completadas.** Continuando con FASEs 20-25 para lanzamiento SaaS.

---

# FASE 20: DEPLOY A PRODUCCIÓN
## *(Sin URL pública no hay producto)*

**Duración:** ~2 horas
**Rama:** `fase20/deploy-produccion`
**Dependencias:** FASE 19 merged a main
**Objetivo:** CIFRA accesible en internet con dominio real, CI/CD automatizado y Prisma migrate en deploy

---

## 20.1 VARIABLES DE ENTORNO — Checklist completo

### Archivo: `.env.production` (referencia, NO commitear)

```bash
# ─── BASE DE DATOS ──────────────────────────────────
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

# ─── AUTENTICACIÓN (Supabase) ───────────────────────
NEXT_PUBLIC_SUPABASE_URL="https://[ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# ─── EMAIL (nodemailer) ─────────────────────────────
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="noreply@cifra.mx"
SMTP_PASS="[app-password]"
SMTP_FROM="CIFRA <noreply@cifra.mx>"

# ─── STRIPE ─────────────────────────────────────────
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# ─── APP ─────────────────────────────────────────────
NEXT_PUBLIC_APP_URL="https://app.cifra.mx"
NODE_ENV="production"

# ─── CSD VAULT (encriptación) ───────────────────────
CSD_ENCRYPTION_KEY="[32-byte-hex]"
```

**Decisión:** Prisma requiere dos URLs en producción con Supabase:
- `DATABASE_URL` → pgBouncer (connection pooling) para queries normales
- `DIRECT_URL` → conexión directa para migraciones

---

## 20.2 VERCEL — Configuración del proyecto

### Pasos de setup en vercel.com

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Login y vincular proyecto
vercel login
vercel link   # Seleccionar org → crear nuevo proyecto "switch-os"

# 3. Subir variables de entorno (una por una o masivo)
vercel env add DATABASE_URL production
vercel env add DIRECT_URL production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# ... resto de variables ...

# 4. Verificar build local con variables de producción
vercel build --prod
```

### Archivo: `vercel.json` (NUEVO)

```json
{
  "framework": "nextjs",
  "buildCommand": "npx prisma generate && next build",
  "installCommand": "npm ci",
  "regions": ["iad1"],
  "functions": {
    "app/**": {
      "maxDuration": 30
    }
  }
}
```

**Decisión:** `npx prisma generate` en `buildCommand` asegura que el Prisma Client se regenere en cada deploy con el schema correcto. No se usa `prisma migrate deploy` aquí — se corre manualmente o en CI antes del deploy.

---

## 20.3 GITHUB ACTIONS — CI/CD Pipeline

### Archivo: `.github/workflows/deploy.yml` (NUEVO)

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  # ─── CI: Tests + TypeScript ──────────────────────────
  ci:
    name: Tests & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - name: TypeScript check
        run: npx tsc --noEmit

      - name: Unit tests
        run: npm test

  # ─── Migrate DB (solo en push a main) ────────────────
  migrate:
    name: Prisma Migrate
    needs: ci
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    env:
      DIRECT_URL: ${{ secrets.DIRECT_URL }}
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - name: Apply migrations
        run: npx prisma migrate deploy

  # ─── Deploy a Vercel ─────────────────────────────────
  deploy:
    name: Deploy Production
    needs: migrate
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm install -g vercel@latest

      - name: Pull Vercel env
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

### Secrets requeridos en GitHub repo → Settings → Secrets

```
VERCEL_TOKEN          (desde vercel.com → Account Settings → Tokens)
VERCEL_ORG_ID         (desde vercel.json o vercel.com)
VERCEL_PROJECT_ID     (desde vercel.json o vercel.com)
DATABASE_URL          (para prisma migrate deploy)
DIRECT_URL            (para prisma migrate deploy)
```

---

## 20.4 PRISMA SCHEMA — Configuración dual-URL

### Modificar `prisma/schema.prisma`

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")   // 🆕 Para migraciones en producción
}
```

**Decisión:** `directUrl` bypassa pgBouncer solo para migraciones DDL. Queries normales siguen usando el pool.

---

## 20.5 DOMINIO Y DNS

### Configuración en Vercel

```
1. Vercel Dashboard → proyecto → Settings → Domains
2. Agregar: app.cifra.mx
3. En proveedor DNS (Cloudflare / GoDaddy / etc.):
   CNAME app → cname.vercel-dns.com.
4. Verificar SSL automático (Let's Encrypt por Vercel)
```

### Subdominios recomendados

| Subdominio | Propósito |
|---|---|
| `app.cifra.mx` | Aplicación principal |
| `cifra.mx` | Landing page (FASE 23) |
| `api.cifra.mx` | Futuro: API pública |

---

## 20.6 HEALTH CHECK — Endpoint de monitoreo

### Archivo: `app/api/health/route.ts` (NUEVO)

```typescript
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const start = Date.now();

  try {
    // Ping a la base de datos
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - start;

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      db: { status: 'ok', latencyMs: dbLatency },
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local',
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: 'error',
        db: { status: 'error', error: String(err) },
      },
      { status: 503 }
    );
  }
}
```

**Uso:** Vercel puede hacer ping a `https://app.cifra.mx/api/health` para uptime monitoring.

---

## CHECKLIST FASE 20

```
🌐 VERCEL
  [ ] Crear proyecto en vercel.com → vincular repo GitHub
  [ ] Agregar todas las env vars de producción
  [ ] Configurar buildCommand: "npx prisma generate && next build"
  [ ] Agregar vercel.json al repo

🗄️ BASE DE DATOS
  [ ] Agregar directUrl a prisma/schema.prisma
  [ ] Ejecutar npx prisma migrate deploy en Supabase prod
  [ ] Verificar que tablas existen en Supabase prod (Table Editor)

🔄 CI/CD
  [ ] Crear .github/workflows/deploy.yml
  [ ] Agregar secrets: VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID
  [ ] Agregar secrets: DATABASE_URL, DIRECT_URL
  [ ] Hacer push a main → verificar que pipeline corre (CI → Migrate → Deploy)

🌍 DOMINIO
  [ ] Configurar app.cifra.mx en Vercel
  [ ] Actualizar DNS en proveedor
  [ ] Verificar HTTPS/SSL activo
  [ ] Probar redirect / → /dashboard en prod

🔍 MONITOREO
  [ ] Crear app/api/health/route.ts
  [ ] Verificar respuesta en https://app.cifra.mx/api/health
  [ ] Configurar alerta de uptime (UptimeRobot gratis o Vercel Monitoring)

🧪 SMOKE TESTS EN PRODUCCIÓN
  [ ] Login con cuenta real de Supabase prod
  [ ] Crear cliente en /crm
  [ ] Crear venta en /pos
  [ ] Emitir CFDI en /billing
  [ ] Ver dashboard con datos reales

✅ DEPLOYMENT
  [ ] git commit -m "FASE 20: Deploy — vercel.json + CI/CD + health check"
  [ ] PR #16 → merge a main → deploy automático
```

**Tiempo estimado:** ~2 horas

---

# FASE 21: ONBOARDING PÚBLICO + REGISTRO DE TENANT
## *(Primer contacto del cliente con el producto)*

**Duración:** ~2 horas
**Rama:** `fase21/onboarding-publico`
**Dependencias:** FASE 20 merged (app en producción)
**Objetivo:** Cualquier persona puede registrarse, crear su tenant y estar operativo en < 5 minutos

---

## 21.1 FLUJO COMPLETO DE REGISTRO

```
/register (email + contraseña)
    │
    ▼
Supabase Auth crea user
    │
    ▼
/onboarding/paso-1 (nombre empresa + RFC + CP)
    │
    ▼
/onboarding/paso-2 (régimen fiscal + giro)
    │
    ▼
/onboarding/paso-3 (plan selection → FASE 22)
    │
    ▼
/dashboard (tenant activo con TRIAL 14 días)
```

---

## 21.2 PÁGINA DE REGISTRO PÚBLICO

### Archivo: `app/(auth)/register/page.tsx` (NUEVO)

```typescript
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { role: 'ADMIN' }, // Primer usuario siempre es Admin del tenant
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Redirigir a onboarding — ensurePrismaUser creará el tenant automáticamente
    router.push('/onboarding');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <span className="text-white text-2xl font-bold">S</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Crear cuenta CIFRA</h1>
          <p className="text-slate-600 mt-1 text-sm">14 días gratis · Sin tarjeta de crédito</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tu@empresa.mx"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 text-sm"
          >
            {loading ? 'Creando cuenta...' : 'Comenzar prueba gratis →'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-blue-600 font-semibold hover:underline">
            Iniciar sesión
          </Link>
        </p>

        <p className="text-center text-xs text-slate-400 mt-4">
          Al registrarte aceptas los{' '}
          <Link href="/terminos" className="underline">Términos de Servicio</Link>
          {' '}y la{' '}
          <Link href="/privacidad" className="underline">Política de Privacidad</Link>
        </p>
      </div>
    </div>
  );
}
```

---

## 21.3 WIZARD DE ONBOARDING (3 pasos)

### Archivo: `app/(dashboard)/onboarding/page.tsx` (MEJORAR)

El onboarding existente (FASE 12) tiene 2 pasos. Extender a 3:

```
Paso 1: Datos básicos (nombre, razón social, RFC, CP)
Paso 2: Configuración fiscal (régimen, giro SAT, moneda)
Paso 3: Primer módulo (¿cómo vas a usar CIFRA?)
         ┌── POS y Facturación  → activa POS + BILLING
         ├── Operaciones completas → activa todos
         └── Solo contabilidad → activa solo FINANZAS
```

### Archivo: `app/(dashboard)/onboarding/actions.ts` (EXTENDER)

```typescript
'use server';

import { getSwitchSession } from '@/lib/auth/session';
import { validateRfc } from '@/lib/crm/rfc-validator';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { sendWelcomeEmail } from '@/lib/email/mailer';

// Módulos según perfil de uso seleccionado en paso 3
const MODULE_PRESETS: Record<string, string[]> = {
  POS_BILLING: ['DASHBOARD', 'POS', 'BILLING', 'CRM', 'SCM'],
  FULL_OPS: ['DASHBOARD', 'POS', 'BILLING', 'CRM', 'SCM', 'RRHH', 'FINANZAS', 'BI'],
  ACCOUNTING_ONLY: ['DASHBOARD', 'BILLING', 'FINANZAS'],
};

export async function completeOnboarding(data: {
  // Paso 1
  name: string;
  legalName: string;
  rfc: string;
  zipCode: string;
  // Paso 2
  taxRegimeKey: string;
  giro: string;
  currency: string;
  // Paso 3
  useProfile: 'POS_BILLING' | 'FULL_OPS' | 'ACCOUNTING_ONLY';
}) {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No hay sesión activa');

  if (!validateRfc(data.rfc)) {
    throw new Error('RFC inválido');
  }

  const modules = MODULE_PRESETS[data.useProfile] ?? MODULE_PRESETS.FULL_OPS;

  await prisma.$transaction(async (tx) => {
    // Actualizar tenant con todos los datos del wizard
    await tx.tenant.update({
      where: { id: session.tenantId! },
      data: {
        name: data.name.trim(),
        legalName: data.legalName.trim().toUpperCase(),
        rfc: data.rfc.toUpperCase(),
        zipCode: data.zipCode,
        onboardingComplete: true,
      },
    });

    // Activar módulos según perfil
    for (const moduleName of modules) {
      await tx.moduleAccess.upsert({
        where: { tenantId_module: { tenantId: session.tenantId!, module: moduleName } },
        create: { tenantId: session.tenantId!, module: moduleName, active: true },
        update: { active: true },
      });
    }
  });

  // Enviar email de bienvenida (best-effort)
  try {
    await sendWelcomeEmail({
      to: session.email,
      tenantName: data.name,
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    });
  } catch {
    // No bloquear si falla el email
  }

  revalidatePath('/dashboard');
}
```

---

## 21.4 EMAIL DE BIENVENIDA

### Agregar a `lib/email/mailer.ts`

```typescript
export interface WelcomeEmailInput {
  to: string;
  tenantName: string;
  trialEndsAt: Date;
}

export async function sendWelcomeEmail(input: WelcomeEmailInput) {
  const transporter = createTransporter();
  const daysLeft = Math.ceil(
    (input.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: input.to,
    subject: `¡Bienvenido a CIFRA, ${input.tenantName}! 🎉`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <div style="background:#2563eb;padding:32px;text-align:center;border-radius:8px 8px 0 0">
          <h1 style="color:white;margin:0;font-size:24px">¡Tu cuenta está lista!</h1>
        </div>
        <div style="padding:32px;background:white;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
          <p>Hola,</p>
          <p>
            <strong>${input.tenantName}</strong> ya está configurado en CIFRA.
            Tienes <strong>${daysLeft} días de prueba gratuita</strong> para explorar
            todos los módulos.
          </p>
          <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:16px;margin:24px 0">
            <p style="margin:0;font-weight:600;color:#0369a1">¿Por dónde empezar?</p>
            <ul style="margin:8px 0 0;padding-left:20px;color:#0c4a6e">
              <li>Registra tu primer cliente en <strong>/crm</strong></li>
              <li>Haz tu primera venta en <strong>/pos</strong></li>
              <li>Emite tu primera factura CFDI en <strong>/billing</strong></li>
            </ul>
          </div>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
             style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;
                    border-radius:8px;text-decoration:none;font-weight:600">
            Ir al Dashboard →
          </a>
        </div>
      </div>
    `,
  });
}
```

---

## CHECKLIST FASE 21

```
📝 PÁGINAS
  [ ] app/(auth)/register/page.tsx (registro público)
  [ ] Mejorar app/(dashboard)/onboarding/page.tsx (3 pasos)
  [ ] Paso 3: selección de perfil de uso (POS/Full/Contable)

⚙️ ACTIONS
  [ ] completeOnboarding() con MODULE_PRESETS
  [ ] Prisma transaction: update tenant + upsert módulos
  [ ] sendWelcomeEmail() (best-effort)

📧 EMAIL
  [ ] Agregar sendWelcomeEmail() a mailer.ts
  [ ] Probar plantilla HTML

🔀 RUTAS
  [ ] /register → redirige a /onboarding tras signup
  [ ] /login → link a /register para nuevos usuarios
  [ ] next.config.ts: agregar /register a rutas públicas (no requiere auth)

🧪 TESTING
  [ ] Registrar nuevo usuario desde /register
  [ ] Completar wizard de 3 pasos
  [ ] Verificar módulos activos según perfil seleccionado
  [ ] Recibir email de bienvenida
  [ ] Verificar que llega a /dashboard operativo

✅ DEPLOYMENT
  [ ] git commit -m "FASE 21: Onboarding público — registro + wizard 3 pasos + welcome email"
  [ ] PR #17
```

**Tiempo estimado:** ~2 horas

---

# FASE 22: STRIPE BILLING
## *(Sin cobro no hay negocio)*

**Duración:** ~2.5 horas
**Rama:** `fase22/stripe-billing`
**Dependencias:** FASE 21 merged
**Objetivo:** Tenants pueden suscribirse, pagar con tarjeta, y sus módulos se activan/desactivan automáticamente según el plan

---

## 22.1 PLANES DE SUSCRIPCIÓN

| Plan | Precio MXN/mes | Módulos incluidos | Límites |
|---|---|---|---|
| **Starter** | $599 | Dashboard, POS, Billing, CRM | 1 usuario, 100 CFDI/mes |
| **Pro** | $1,299 | Todos (+ RRHH, Finanzas, SCM, BI) | 5 usuarios, ilimitado CFDI |
| **Enterprise** | $2,999 | Todos + soporte prioritario | Ilimitado usuarios |

---

## 22.2 MODELOS PRISMA — Suscripción Stripe

### Agregar a `prisma/schema.prisma`

```prisma
model StripeSubscription {
  id                   String   @id @default(cuid())
  tenantId             String   @unique
  tenant               Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  stripeCustomerId     String   @unique
  stripeSubscriptionId String?  @unique
  stripePriceId        String?
  plan                 String   @default("TRIAL")  // TRIAL | STARTER | PRO | ENTERPRISE
  status               String   @default("trialing") // trialing | active | past_due | canceled
  currentPeriodStart   DateTime?
  currentPeriodEnd     DateTime?
  cancelAtPeriodEnd    Boolean  @default(false)
  trialEnd             DateTime?

  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  @@index([tenantId])
  @@index([stripeCustomerId])
}

// Agregar a Tenant:
model Tenant {
  // ... campos existentes ...
  stripeSubscription StripeSubscription?
}
```

### Migración

```bash
npx prisma migrate dev --name fase22_stripe_subscription
```

---

## 22.3 CONSTANTES DE PRECIOS

### Archivo: `lib/billing/stripe-plans.ts` (NUEVO)

```typescript
export const STRIPE_PLANS = {
  STARTER: {
    name: 'Starter',
    priceId: process.env.STRIPE_PRICE_STARTER!,
    priceMxn: 599,
    modules: ['DASHBOARD', 'POS', 'BILLING', 'CRM'],
    maxUsers: 1,
    maxCfdiPerMonth: 100,
  },
  PRO: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRICE_PRO!,
    priceMxn: 1299,
    modules: ['DASHBOARD', 'POS', 'BILLING', 'CRM', 'SCM', 'RRHH', 'FINANZAS', 'BI'],
    maxUsers: 5,
    maxCfdiPerMonth: null, // ilimitado
  },
  ENTERPRISE: {
    name: 'Enterprise',
    priceId: process.env.STRIPE_PRICE_ENTERPRISE!,
    priceMxn: 2999,
    modules: ['DASHBOARD', 'POS', 'BILLING', 'CRM', 'SCM', 'RRHH', 'FINANZAS', 'BI'],
    maxUsers: null, // ilimitado
    maxCfdiPerMonth: null,
  },
} as const;

export type PlanKey = keyof typeof STRIPE_PLANS;
```

---

## 22.4 CHECKOUT — Server Action

### Archivo: `app/(dashboard)/billing/subscription/actions.ts` (NUEVO)

```typescript
'use server';

import Stripe from 'stripe';
import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { STRIPE_PLANS, type PlanKey } from '@/lib/billing/stripe-plans';
import { redirect } from 'next/navigation';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

export async function createCheckoutSession(planKey: PlanKey) {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No session');

  const plan = STRIPE_PLANS[planKey];
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    include: { stripeSubscription: true },
  });

  if (!tenant) throw new Error('Tenant no encontrado');

  // Obtener o crear customer en Stripe
  let customerId = tenant.stripeSubscription?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.email,
      name: tenant.legalName ?? tenant.name,
      metadata: { tenantId: tenant.id },
    });
    customerId = customer.id;

    // Guardar customer ID
    await prisma.stripeSubscription.upsert({
      where: { tenantId: tenant.id },
      create: {
        tenantId: tenant.id,
        stripeCustomerId: customerId,
        plan: 'TRIAL',
        status: 'trialing',
      },
      update: { stripeCustomerId: customerId },
    });
  }

  // Crear sesión de checkout
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: plan.priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/subscription?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/subscription`,
    subscription_data: {
      metadata: { tenantId: tenant.id, plan: planKey },
    },
    locale: 'es',
  });

  redirect(checkoutSession.url!);
}

export async function createPortalSession() {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No session');

  const sub = await prisma.stripeSubscription.findUnique({
    where: { tenantId: session.tenantId },
  });

  if (!sub?.stripeCustomerId) throw new Error('Sin suscripción activa');

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/subscription`,
  });

  redirect(portalSession.url);
}
```

---

## 22.5 WEBHOOK — Stripe Events

### Archivo: `app/api/stripe/webhook/route.ts` (NUEVO)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import prisma from '@/lib/prisma';
import { STRIPE_PLANS } from '@/lib/billing/stripe-plans';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const tenantId = sub.metadata.tenantId;
      const planKey = sub.metadata.plan as string;

      if (!tenantId) break;

      // Actualizar estado de suscripción
      await prisma.stripeSubscription.update({
        where: { tenantId },
        data: {
          stripeSubscriptionId: sub.id,
          status: sub.status,
          plan: planKey,
          currentPeriodStart: new Date(sub.current_period_start * 1000),
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        },
      });

      // Activar módulos del plan
      const planModules = STRIPE_PLANS[planKey as keyof typeof STRIPE_PLANS]?.modules ?? [];
      for (const moduleName of planModules) {
        await prisma.moduleAccess.upsert({
          where: { tenantId_module: { tenantId, module: moduleName } },
          create: { tenantId, module: moduleName, active: true },
          update: { active: true },
        });
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const tenantId = sub.metadata.tenantId;
      if (!tenantId) break;

      // Desactivar todos los módulos del tenant (excepto DASHBOARD)
      await prisma.moduleAccess.updateMany({
        where: { tenantId, module: { not: 'DASHBOARD' } },
        data: { active: false },
      });

      await prisma.stripeSubscription.update({
        where: { tenantId },
        data: { status: 'canceled', plan: 'TRIAL' },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
```

---

## CHECKLIST FASE 22

```
🗄️ SCHEMA
  [ ] Agregar StripeSubscription model a prisma/schema.prisma
  [ ] npx prisma migrate dev --name fase22_stripe_subscription

💳 STRIPE SETUP
  [ ] Crear productos y precios en stripe.com (Starter/Pro/Enterprise)
  [ ] Copiar price IDs → .env (STRIPE_PRICE_STARTER, etc.)
  [ ] Configurar webhook en Stripe Dashboard → URL: /api/stripe/webhook
  [ ] Copiar STRIPE_WEBHOOK_SECRET → .env

⚙️ CÓDIGO
  [ ] lib/billing/stripe-plans.ts (constantes de planes)
  [ ] app/(dashboard)/billing/subscription/actions.ts (checkout + portal)
  [ ] app/api/stripe/webhook/route.ts (customer.subscription.*)
  [ ] app/(dashboard)/billing/subscription/page.tsx (pricing UI)

🔒 PAYWALL
  [ ] Actualizar middleware.ts para verificar plan activo
  [ ] Bloquear módulos si status = 'canceled' o 'past_due'
  [ ] Banner de "suscripción vencida" en dashboard

🧪 TESTING
  [ ] Usar Stripe CLI: stripe listen --forward-to localhost:3000/api/stripe/webhook
  [ ] Completar checkout con tarjeta de prueba 4242 4242 4242 4242
  [ ] Verificar que módulos se activan en BD
  [ ] Cancelar suscripción → verificar módulos desactivados
  [ ] Probar portal de facturación

✅ DEPLOYMENT
  [ ] git commit -m "FASE 22: Stripe Billing — checkout, webhook, paywall por plan"
  [ ] PR #18
```

**Tiempo estimado:** ~2.5 horas

---

# FASE 23: LANDING PAGE
## *(La puerta de entrada para nuevos clientes)*

**Duración:** ~1.5 horas
**Rama:** `fase23/landing-page`
**Dependencias:** FASE 22 merged (para mostrar precios reales)
**Objetivo:** Página de marketing en cifra.mx que convierte visitantes en registros

---

## 23.1 ESTRUCTURA DE LA LANDING

```
/ (root — cifra.mx)
├── Hero: "El ERP/CRM para empresas mexicanas"
├── Sección Features: 6 módulos con iconos
├── Sección Social Proof: métricas / testimonios
├── Sección Precios: cards Starter / Pro / Enterprise
├── FAQ: 5 preguntas frecuentes
└── Footer: legal, redes, contacto
```

### Archivo: `app/(marketing)/layout.tsx` (NUEVO)

```typescript
// Layout separado para páginas de marketing (sin sidebar de dashboard)
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}
```

---

## 23.2 HERO SECTION

### Archivo: `app/(marketing)/page.tsx` (NUEVO — fragmento)

```typescript
export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-24 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <span className="inline-block bg-white/20 text-white text-sm font-semibold
                           px-4 py-1 rounded-full mb-6">
            🇲🇽 Cumplimiento SAT · CFDI 4.0 · ISR/IMSS 2026
          </span>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
            El ERP que sí entiende<br />
            <span className="text-yellow-300">el SAT mexicano</span>
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-10">
            Factura CFDI 4.0, calcula nómina ISR/IMSS, controla inventario y
            gestiona tu pipeline de ventas — todo en una sola plataforma.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a href="/register"
               className="bg-white text-blue-700 font-bold px-8 py-4 rounded-xl
                          hover:bg-blue-50 transition text-lg shadow-lg">
              Comenzar gratis 14 días →
            </a>
            <a href="#precios"
               className="border border-white/40 text-white font-semibold px-8 py-4
                          rounded-xl hover:bg-white/10 transition text-lg">
              Ver precios
            </a>
          </div>
          <p className="mt-4 text-blue-200 text-sm">Sin tarjeta de crédito · Cancela cuando quieras</p>
        </div>
      </section>

      <FeaturesSection />
      <PricingSection />
      <FaqSection />
    </>
  );
}
```

---

## 23.3 SECCIÓN DE CARACTERÍSTICAS

```typescript
const FEATURES = [
  {
    icon: '🧾',
    title: 'Facturación CFDI 4.0',
    desc: 'Emite y cancela facturas directamente, conectado a tu PAC. Validación RFC automática.',
  },
  {
    icon: '🏪',
    title: 'Punto de Venta',
    desc: 'POS táctil con desglose de IVA automático. Ticket imprimible y auto-factura.',
  },
  {
    icon: '👥',
    title: 'Nómina ISR/IMSS',
    desc: 'Cálculo automatizado con tablas SAT 2026. Póliza contable automática al timbrar.',
  },
  {
    icon: '📦',
    title: 'Inventarios SCM',
    desc: 'Almacenes múltiples, movimientos auditados, alertas de stock mínimo.',
  },
  {
    icon: '📊',
    title: 'CRM Pipeline',
    desc: 'Kanban de oportunidades con valor ponderado. Embudo visual para tu equipo de ventas.',
  },
  {
    icon: '📈',
    title: 'BI y Reportes',
    desc: 'Dashboard ejecutivo con tendencias, top productos y funnel de conversión.',
  },
];
```

---

## 23.4 SECCIÓN DE PRECIOS

```typescript
// Importar precios desde las constantes de Stripe (FASE 22)
import { STRIPE_PLANS } from '@/lib/billing/stripe-plans';

function PricingSection() {
  return (
    <section id="precios" className="py-24 bg-slate-50 px-4">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-4xl font-bold text-center text-slate-900 mb-4">
          Precios transparentes
        </h2>
        <p className="text-center text-slate-600 mb-12">
          Sin costos ocultos. Cancela en cualquier momento.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Cards generados desde STRIPE_PLANS */}
        </div>
      </div>
    </section>
  );
}
```

---

## 23.5 SEO Y METADATA

### Archivo: `app/(marketing)/page.tsx` — metadata

```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CIFRA — ERP y CRM para empresas mexicanas | CFDI 4.0',
  description:
    'ERP completo para México: facturación CFDI 4.0, nómina ISR/IMSS, inventarios, CRM y punto de venta. 14 días gratis.',
  keywords: ['ERP México', 'CFDI 4.0', 'facturación electrónica', 'nómina IMSS', 'CRM'],
  openGraph: {
    title: 'CIFRA — ERP para México',
    description: 'Factura CFDI, calcula nómina y gestiona tu negocio completo.',
    url: 'https://cifra.mx',
    siteName: 'CIFRA',
    locale: 'es_MX',
    type: 'website',
  },
};
```

---

## CHECKLIST FASE 23

```
📄 PÁGINAS
  [ ] app/(marketing)/layout.tsx (layout sin sidebar)
  [ ] app/(marketing)/page.tsx (landing completa)
  [ ] components/marketing/MarketingNav.tsx (logo + CTA "Probar gratis")
  [ ] components/marketing/FeaturesSection.tsx
  [ ] components/marketing/PricingSection.tsx (usa STRIPE_PLANS)
  [ ] components/marketing/FaqSection.tsx
  [ ] components/marketing/MarketingFooter.tsx

🔗 ROUTING
  [ ] Configurar cifra.mx → landing (vercel.json domains)
  [ ] Configurar app.cifra.mx → /dashboard
  [ ] /register enlaza desde landing CTA

🔍 SEO
  [ ] metadata en page.tsx (title, description, OG)
  [ ] app/(marketing)/sitemap.ts
  [ ] app/(marketing)/robots.ts

🧪 TESTING
  [ ] Ver landing en móvil y desktop
  [ ] Clic en "Comenzar gratis" → lleva a /register
  [ ] Clic en "Ver precios" → scroll a sección precios
  [ ] Verificar meta tags con og:image

✅ DEPLOYMENT
  [ ] git commit -m "FASE 23: Landing Page — hero + features + pricing + SEO"
  [ ] PR #19
```

**Tiempo estimado:** ~1.5 horas

---

# FASE 24: REPORTES PDF / EXCEL
## *(El contador necesita papel)*

**Duración:** ~2 horas
**Rama:** `fase24/reportes-exportacion`
**Dependencias:** FASE 23 merged
**Objetivo:** Los 5 reportes más críticos exportables en PDF y Excel, listos para el SAT y el contador

---

## 24.1 LIBRERÍA DE PDF

### Instalación

```bash
npm install @react-pdf/renderer
npm install -D @types/react-pdf
```

**Decisión:** `@react-pdf/renderer` permite diseñar PDFs con componentes React. Corre en el servidor (Server Actions) sin problemas con Next.js 14. Alternativa `puppeteer` requiere Chromium (pesado en Vercel).

---

## 24.2 REPORTES PRIORITARIOS

| Reporte | Formato | Módulo origen | Uso |
|---|---|---|---|
| CFDI / Factura | PDF | Billing / Invoice | Enviar al cliente |
| Recibo de Nómina | PDF | RRHH / PayrollLine | Entregar al empleado |
| Balanza de Comprobación | Excel | Finanzas / Accounts | Contador / SAT |
| Estado de Cuenta CxC | PDF | Finanzas / Cobranza | Cliente moroso |
| Kardex de Inventario | Excel | SCM / StockMovement | Inventario físico |

---

## 24.3 TEMPLATE PDF — CFDI/FACTURA

### Archivo: `lib/pdf/templates/invoice-pdf.tsx` (NUEVO)

```typescript
import {
  Document, Page, Text, View, StyleSheet, Font, Image,
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 9 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  logo: { fontSize: 18, fontWeight: 'bold', color: '#2563eb' },
  title: { fontSize: 14, fontWeight: 'bold', color: '#1e293b', marginBottom: 12 },
  table: { width: '100%', marginTop: 12 },
  tableHeader: {
    flexDirection: 'row', backgroundColor: '#1e3a5f',
    color: 'white', padding: '6 8',
  },
  tableRow: { flexDirection: 'row', borderBottom: '1px solid #e2e8f0', padding: '5 8' },
  totals: { marginTop: 16, alignItems: 'flex-end' },
  cfdiInfo: {
    marginTop: 16, padding: 10,
    border: '1px solid #e2e8f0', borderRadius: 4,
    backgroundColor: '#f8fafc',
  },
});

interface InvoicePdfProps {
  invoice: {
    uuid: string;
    serie: string;
    folio: string;
    fecha: string;
    emisor: { rfc: string; nombre: string; regimenFiscal: string };
    receptor: { rfc: string; nombre: string; usoCfdi: string };
    conceptos: Array<{
      descripcion: string; cantidad: number;
      valorUnitario: number; importe: number; impuesto: number;
    }>;
    subtotal: number;
    totalIva: number;
    total: number;
    metodoPago: string;
    formaPago: string;
  };
}

export function InvoicePdf({ invoice }: InvoicePdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>CIFRA</Text>
            <Text style={{ fontSize: 8, color: '#64748b', marginTop: 2 }}>
              {invoice.emisor.nombre}
            </Text>
            <Text style={{ fontSize: 8, color: '#64748b' }}>
              RFC: {invoice.emisor.rfc}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1e3a5f' }}>
              FACTURA
            </Text>
            <Text style={{ fontSize: 11, color: '#2563eb' }}>
              {invoice.serie}-{invoice.folio}
            </Text>
            <Text style={{ fontSize: 8, color: '#64748b', marginTop: 2 }}>
              Fecha: {invoice.fecha}
            </Text>
          </View>
        </View>

        {/* Receptor */}
        <View style={{ marginBottom: 12, padding: 8, backgroundColor: '#f1f5f9', borderRadius: 4 }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>RECEPTOR</Text>
          <Text>{invoice.receptor.nombre}</Text>
          <Text style={{ color: '#475569' }}>RFC: {invoice.receptor.rfc}</Text>
          <Text style={{ color: '#475569' }}>Uso CFDI: {invoice.receptor.usoCfdi}</Text>
        </View>

        {/* Tabla de conceptos */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={{ flex: 3 }}>Descripción</Text>
            <Text style={{ flex: 1, textAlign: 'right' }}>Cant.</Text>
            <Text style={{ flex: 1, textAlign: 'right' }}>Precio U.</Text>
            <Text style={{ flex: 1, textAlign: 'right' }}>Importe</Text>
          </View>
          {invoice.conceptos.map((c, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={{ flex: 3 }}>{c.descripcion}</Text>
              <Text style={{ flex: 1, textAlign: 'right' }}>{c.cantidad}</Text>
              <Text style={{ flex: 1, textAlign: 'right' }}>
                ${c.valorUnitario.toFixed(2)}
              </Text>
              <Text style={{ flex: 1, textAlign: 'right' }}>
                ${c.importe.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totales */}
        <View style={styles.totals}>
          <View style={{ flexDirection: 'row', gap: 20 }}>
            <Text style={{ color: '#475569' }}>Subtotal:</Text>
            <Text style={{ fontWeight: 'bold' }}>${invoice.subtotal.toFixed(2)}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 20 }}>
            <Text style={{ color: '#475569' }}>IVA 16%:</Text>
            <Text>${invoice.totalIva.toFixed(2)}</Text>
          </View>
          <View style={{
            flexDirection: 'row', gap: 20, marginTop: 4,
            borderTop: '2px solid #1e3a5f', paddingTop: 4,
          }}>
            <Text style={{ fontWeight: 'bold', fontSize: 11 }}>TOTAL:</Text>
            <Text style={{ fontWeight: 'bold', fontSize: 11, color: '#2563eb' }}>
              ${invoice.total.toFixed(2)} MXN
            </Text>
          </View>
        </View>

        {/* CFDI Info */}
        <View style={styles.cfdiInfo}>
          <Text style={{ fontWeight: 'bold', marginBottom: 4, fontSize: 8 }}>
            INFORMACIÓN FISCAL CFDI 4.0
          </Text>
          <Text style={{ fontSize: 7, color: '#475569' }}>UUID: {invoice.uuid}</Text>
          <Text style={{ fontSize: 7, color: '#475569' }}>
            Método de pago: {invoice.metodoPago} | Forma: {invoice.formaPago}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
```

---

## 24.4 API ROUTE — Descargar PDF

### Archivo: `app/api/pdf/invoice/[id]/route.ts` (NUEVO)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { InvoicePdf } from '@/lib/pdf/templates/invoice-pdf';
import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSwitchSession();
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: {
      tenant: true,
      customer: true,
      items: { include: { product: true } },
    },
  });

  if (!invoice || invoice.tenantId !== session.tenantId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Construir input para el template PDF
  const pdfInput = {
    uuid: invoice.uuid ?? 'DRAFT',
    serie: invoice.serie ?? 'A',
    folio: invoice.folio ?? '1',
    fecha: invoice.createdAt.toLocaleDateString('es-MX'),
    emisor: {
      rfc: invoice.tenant.rfc ?? '',
      nombre: invoice.tenant.legalName ?? invoice.tenant.name,
      regimenFiscal: '601',
    },
    receptor: {
      rfc: invoice.customer?.rfc ?? 'XAXX010101000',
      nombre: invoice.customer?.name ?? 'Público en General',
      usoCfdi: 'G03',
    },
    conceptos: invoice.items.map((item) => ({
      descripcion: item.description,
      cantidad: item.quantity,
      valorUnitario: parseFloat(String(item.unitPrice)),
      importe: parseFloat(String(item.amount)),
      impuesto: parseFloat(String(item.taxAmount ?? 0)),
    })),
    subtotal: parseFloat(String(invoice.subtotal)),
    totalIva: parseFloat(String(invoice.totalTax ?? 0)),
    total: parseFloat(String(invoice.total)),
    metodoPago: invoice.paymentMethod ?? 'PUE',
    formaPago: invoice.paymentForm ?? '03',
  };

  const buffer = await renderToBuffer(<InvoicePdf invoice={pdfInput} />);

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="CFDI-${invoice.serie}-${invoice.folio}.pdf"`,
    },
  });
}
```

---

## 24.5 EXCEL — Balanza de Comprobación

### Instalación

```bash
npm install exceljs
```

### Archivo: `app/api/excel/balanza/route.ts` (NUEVO)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getSwitchSession();
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accounts = await prisma.account.findMany({
    where: { tenantId: session.tenantId },
    include: {
      journalLines: {
        select: { debit: true, credit: true },
      },
    },
    orderBy: { code: 'asc' },
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CIFRA';
  const sheet = workbook.addWorksheet('Balanza de Comprobación');

  // Encabezados
  sheet.columns = [
    { header: 'Código', key: 'code', width: 12 },
    { header: 'Nombre', key: 'name', width: 35 },
    { header: 'Tipo', key: 'type', width: 14 },
    { header: 'Débito', key: 'debit', width: 16, style: { numFmt: '$#,##0.00' } },
    { header: 'Crédito', key: 'credit', width: 16, style: { numFmt: '$#,##0.00' } },
    { header: 'Saldo', key: 'balance', width: 16, style: { numFmt: '$#,##0.00' } },
  ];

  // Estilo encabezado
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = {
    type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' },
  };

  // Datos
  for (const account of accounts) {
    const totalDebit = account.journalLines.reduce(
      (s, l) => s + parseFloat(String(l.debit ?? 0)), 0
    );
    const totalCredit = account.journalLines.reduce(
      (s, l) => s + parseFloat(String(l.credit ?? 0)), 0
    );
    const balance = totalDebit - totalCredit;

    sheet.addRow({
      code: account.code,
      name: account.name,
      type: account.accountType,
      debit: totalDebit,
      credit: totalCredit,
      balance: Math.abs(balance),
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="Balanza-${new Date().toISOString().slice(0, 7)}.xlsx"`,
    },
  });
}
```

---

## CHECKLIST FASE 24

```
📦 INSTALACIÓN
  [ ] npm install @react-pdf/renderer exceljs
  [ ] npm install -D @types/react-pdf

📄 TEMPLATES PDF
  [ ] lib/pdf/templates/invoice-pdf.tsx (factura CFDI)
  [ ] lib/pdf/templates/payslip-pdf.tsx (recibo de nómina)
  [ ] lib/pdf/templates/aging-pdf.tsx (estado CxC)

📊 EXCEL
  [ ] app/api/excel/balanza/route.ts
  [ ] app/api/excel/kardex/route.ts

🔗 API ROUTES PDF
  [ ] app/api/pdf/invoice/[id]/route.ts
  [ ] app/api/pdf/payslip/[id]/route.ts

🎯 BOTONES EN UI
  [ ] billing/page.tsx → botón "PDF" en cada fila de factura
  [ ] rrhh/nomina → botón "Recibo PDF" por empleado
  [ ] finanzas/contabilidad → botón "Exportar Balanza XLSX"
  [ ] scm/inventarios → botón "Kardex XLSX"

🧪 TESTING
  [ ] Descargar PDF de factura → abre correctamente en Acrobat
  [ ] Descargar recibo de nómina → datos correctos de ISR/IMSS
  [ ] Exportar balanza Excel → abre en Excel/Sheets con formato
  [ ] Verificar que las rutas API retornan 401 sin sesión

✅ DEPLOYMENT
  [ ] git commit -m "FASE 24: Reportes PDF/Excel — factura, nómina, balanza, kardex"
  [ ] PR #20
```

**Tiempo estimado:** ~2 horas

---

# FASE 25: RBAC — ROLES Y PERMISOS
## *(Seguridad multi-usuario dentro del tenant)*

**Duración:** ~2 horas
**Rama:** `fase25/rbac-roles`
**Dependencias:** FASE 24 merged
**Objetivo:** Cada usuario dentro del tenant tiene un rol con permisos específicos por módulo

---

## 25.1 MODELO DE ROLES

| Rol | Módulos | Permisos |
|---|---|---|
| **ADMIN** | Todos | Leer, escribir, eliminar, configurar |
| **CONTADOR** | Finanzas, Billing, BI | Leer, exportar; no puede vender |
| **VENDEDOR** | CRM, POS, Billing | Crear ventas + facturas; no ve nómina |
| **CAJERO** | POS solamente | Solo checkout; no ve precios de costo |
| **VISOR** | Todos (read-only) | Solo lectura, sin crear ni eliminar |

---

## 25.2 MODELOS PRISMA

### Agregar a `prisma/schema.prisma`

```prisma
enum UserRole {
  ADMIN
  CONTADOR
  VENDEDOR
  CAJERO
  VISOR
}

model TenantUser {
  id         String   @id @default(cuid())
  tenantId   String
  tenant     Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  userId     String
  // user    User     @relation(...)  // Supabase auth user
  role       UserRole @default(VISOR)
  active     Boolean  @default(true)
  invitedAt  DateTime @default(now())
  acceptedAt DateTime?

  @@unique([tenantId, userId])
  @@index([tenantId])
}

// Agregar a Tenant:
model Tenant {
  // ...
  tenantUsers TenantUser[]
}
```

### Migración

```bash
npx prisma migrate dev --name fase25_rbac_roles
```

---

## 25.3 DEFINICIÓN DE PERMISOS

### Archivo: `lib/auth/permissions.ts` (NUEVO)

```typescript
export type Action = 'read' | 'create' | 'update' | 'delete' | 'export';
export type Resource =
  | 'invoices' | 'customers' | 'products' | 'pos_orders'
  | 'employees' | 'payroll' | 'journal_entries' | 'reports'
  | 'pipeline' | 'warehouses' | 'settings' | 'users';

type PermissionMatrix = Record<string, Record<Resource, Action[]>>;

export const PERMISSIONS: PermissionMatrix = {
  ADMIN: {
    invoices:        ['read', 'create', 'update', 'delete', 'export'],
    customers:       ['read', 'create', 'update', 'delete'],
    products:        ['read', 'create', 'update', 'delete'],
    pos_orders:      ['read', 'create', 'update', 'delete'],
    employees:       ['read', 'create', 'update', 'delete'],
    payroll:         ['read', 'create', 'update', 'delete', 'export'],
    journal_entries: ['read', 'create', 'update', 'delete', 'export'],
    reports:         ['read', 'export'],
    pipeline:        ['read', 'create', 'update', 'delete'],
    warehouses:      ['read', 'create', 'update', 'delete'],
    settings:        ['read', 'update'],
    users:           ['read', 'create', 'update', 'delete'],
  },
  CONTADOR: {
    invoices:        ['read', 'export'],
    customers:       ['read'],
    products:        ['read'],
    pos_orders:      ['read', 'export'],
    employees:       ['read'],
    payroll:         ['read', 'export'],
    journal_entries: ['read', 'create', 'update', 'export'],
    reports:         ['read', 'export'],
    pipeline:        ['read'],
    warehouses:      ['read'],
    settings:        [],
    users:           [],
  },
  VENDEDOR: {
    invoices:        ['read', 'create'],
    customers:       ['read', 'create', 'update'],
    products:        ['read'],
    pos_orders:      ['read', 'create'],
    employees:       [],
    payroll:         [],
    journal_entries: [],
    reports:         ['read'],
    pipeline:        ['read', 'create', 'update'],
    warehouses:      ['read'],
    settings:        [],
    users:           [],
  },
  CAJERO: {
    invoices:        [],
    customers:       ['read', 'create'],
    products:        ['read'],
    pos_orders:      ['read', 'create'],
    employees:       [],
    payroll:         [],
    journal_entries: [],
    reports:         [],
    pipeline:        [],
    warehouses:      ['read'],
    settings:        [],
    users:           [],
  },
  VISOR: {
    invoices:        ['read'],
    customers:       ['read'],
    products:        ['read'],
    pos_orders:      ['read'],
    employees:       ['read'],
    payroll:         ['read'],
    journal_entries: ['read'],
    reports:         ['read'],
    pipeline:        ['read'],
    warehouses:      ['read'],
    settings:        [],
    users:           [],
  },
};

/**
 * Verifica si un rol tiene permiso para una acción sobre un recurso.
 */
export function can(
  role: string,
  resource: Resource,
  action: Action
): boolean {
  const rolePerms = PERMISSIONS[role];
  if (!rolePerms) return false;
  return rolePerms[resource]?.includes(action) ?? false;
}
```

---

## 25.4 GUARD EN SERVER ACTIONS

### Archivo: `lib/auth/require-permission.ts` (NUEVO)

```typescript
import { getSwitchSession } from './session';
import prisma from '@/lib/prisma';
import { can, type Action, type Resource } from './permissions';

/**
 * Lanza error si el usuario no tiene permiso.
 * Usar al inicio de cualquier Server Action sensible.
 *
 * @example
 * await requirePermission('invoices', 'create');
 */
export async function requirePermission(
  resource: Resource,
  action: Action
): Promise<void> {
  const session = await getSwitchSession();
  if (!session?.tenantId || !session?.userId) {
    throw new Error('No autenticado');
  }

  const tenantUser = await prisma.tenantUser.findUnique({
    where: {
      tenantId_userId: {
        tenantId: session.tenantId,
        userId: session.userId,
      },
    },
    select: { role: true },
  });

  const role = tenantUser?.role ?? 'VISOR';

  if (!can(role, resource, action)) {
    throw new Error(
      `No tienes permiso para ${action} en ${resource}. Rol actual: ${role}`
    );
  }
}
```

### Uso en Server Actions existentes

```typescript
// Ejemplo: proteger createDeal() en CRM
export async function createDeal(input: DealInput) {
  await requirePermission('pipeline', 'create'); // 🆕 Guard
  // ... resto del código ...
}

// Ejemplo: proteger stampInvoice()
export async function stampInvoice(invoiceId: string) {
  await requirePermission('invoices', 'create'); // 🆕 Guard
  // ... resto del código ...
}
```

---

## 25.5 INVITACIÓN DE USUARIOS

### Archivo: `app/(dashboard)/admin/users/actions.ts` (NUEVO)

```typescript
'use server';

import { getSwitchSession } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/require-permission';
import prisma from '@/lib/prisma';
import { sendInviteEmail } from '@/lib/email/mailer';
import { randomBytes } from 'crypto';

export async function inviteUser(data: { email: string; role: string }) {
  await requirePermission('users', 'create');
  const session = await getSwitchSession();

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días

  // Guardar invitación pendiente (se acepta al hacer login/register)
  await prisma.userInvitation.create({
    data: {
      tenantId: session!.tenantId!,
      email: data.email,
      role: data.role,
      token,
      expiresAt,
    },
  });

  await sendInviteEmail({
    to: data.email,
    tenantName: session!.tenantName ?? 'tu empresa',
    role: data.role,
    inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL}/register?invite=${token}`,
  });
}
```

---

## CHECKLIST FASE 25

```
🗄️ SCHEMA
  [ ] Agregar enum UserRole (ADMIN/CONTADOR/VENDEDOR/CAJERO/VISOR)
  [ ] Agregar modelo TenantUser (tenantId, userId, role)
  [ ] Agregar modelo UserInvitation (token, email, role, expiresAt)
  [ ] npx prisma migrate dev --name fase25_rbac_roles

🔐 LÓGICA DE PERMISOS
  [ ] lib/auth/permissions.ts (matriz PERMISSIONS + can())
  [ ] lib/auth/require-permission.ts (guard para Server Actions)
  [ ] Aplicar requirePermission() en 10+ Server Actions críticas:
      - createDeal(), stampInvoice(), addExpense(), adjustStock()
      - calculatePayroll(), deleteCustomer(), createWarehouse()

👥 UI GESTIÓN DE USUARIOS
  [ ] app/(dashboard)/admin/users/page.tsx
      - Lista de usuarios del tenant con rol actual
      - Botón "Invitar usuario" → modal con email + rol
      - Botón "Cambiar rol" → dropdown in-line
  [ ] app/(dashboard)/admin/users/actions.ts (inviteUser, changeRole)

📧 EMAIL
  [ ] sendInviteEmail() en mailer.ts
  [ ] Plantilla HTML con enlace de invitación

🔗 FLOW DE ACEPTACIÓN
  [ ] app/(auth)/register/page.tsx detectar ?invite=TOKEN
  [ ] Al registrar, vincular userId con TenantUser del token
  [ ] Invalidar token después de usar

🧪 TESTING
  [ ] Admin invita a un contador → recibe email
  [ ] Contador acepta invitación → puede ver finanzas pero no nómina
  [ ] Cajero intenta acceder a /rrhh → error 403
  [ ] Vendedor intenta eliminar factura → error de permiso
  [ ] Admin cambia rol de contador a vendedor → permisos cambian en tiempo real

✅ DEPLOYMENT
  [ ] git commit -m "FASE 25: RBAC — roles, permisos, invitaciones multi-usuario"
  [ ] PR #21
```

**Tiempo estimado:** ~2 horas

---

## DECISIONES ARQUITECTÓNICAS — FASES 20-25

| Decisión | Implementación | Impacto |
|---|---|---|
| **Dual URL Prisma** | `DATABASE_URL` (pgBouncer) + `DIRECT_URL` (migraciones) | Migrations seguras en prod sin romper pool |
| **CI antes de migrate** | GitHub Actions: tests → migrate → deploy (en orden) | Nunca se despliega código roto |
| **Health check endpoint** | `/api/health` con latencia de BD | Monitoreo uptime desde Vercel |
| **Stripe metadata** | `tenantId` + `plan` en `subscription.metadata` | Webhook sabe a qué tenant actualizar |
| **Módulos como paywall** | `ModuleAccess` activo/inactivo según plan Stripe | Un webhook activa o desactiva módulos |
| **PDF en servidor** | `@react-pdf/renderer` en API Routes | Sin Chromium, compatible con Vercel Edge |
| **Excel con ExcelJS** | Generado en servidor, streamed como buffer | Sin dependencias nativas, funciona serverless |
| **RBAC en Server Actions** | `requirePermission()` al inicio de cada action | Seguridad en la capa de datos, no solo UI |
| **Invitaciones por token** | `UserInvitation` con token + expiry 7 días | Flujo seguro sin exponer userId |
| **Roles en BD, no JWT** | `TenantUser.role` leído en cada request | Cambiar rol tiene efecto inmediato sin re-login |

---

## ROADMAP VISUAL COMPLETO

```
FASES 12-19 ✅ ─── MVP Sistema Completo
FASES 20-25 ✅ ─── Producto SaaS Lanzado (cifra-mx.vercel.app)
                              │
                              ▼
              ┌───────────────────────────────────┐
              │   PRIORIDAD ALTA — Core Producto   │
              └───────────────────────────────────┘
FASE 26 (M)   Notificaciones    Badge en header, 5 tipos de alerta
FASE 27 (M)   Portal Cliente    /portal/[token] sin login al ERP
FASE 28 (M)   BI Real           Prisma → Recharts, KPIs reales
FASE 29 (L)   POS Completo      UI cobro, carrito, ticket PDF
FASE 30 (L)   Calendario        Vistas mes/semana, eventos automáticos
                              │
                              ▼
              ┌──────────────────────────────────────┐
              │  PRIORIDAD MEDIA — Módulos Completos  │
              └──────────────────────────────────────┘
FASE 31 (L)   SCM Compras       PurchaseOrder → StockMovement auto
FASE 32 (L)   CRM Full          Campañas email + Tickets SLA
FASE 33 (L)   MRP Real          BOM, órdenes producción, calidad
FASE 34 (L)   RRHH+             Checador, Storage docs, NPS
                              │
                              ▼
              ┌──────────────────────────────────────┐
              │    PRIORIDAD BAJA — Crecimiento       │
              └──────────────────────────────────────┘
FASE 35 (L)   i18n              ES/EN con next-intl
FASE 36 (L)   PWA               Offline mode + Push notifications
FASE 37 (XL)  Integraciones     SAT webservice + CLABE + WhatsApp
FASE 38 (L)   AI Copilot        Claude API sobre datos del tenant
FASE 39 (XL)  Marketplace       CONTPAQi, Shopify, MercadoLibre
FASE 40 (XL)  Enterprise        Multi-empresa, consolidación, holding
                              │
                              ▼
                    🏆 PRODUCTO ENTERPRISE COMPLETO
```

---

## FASES 26–40 — DETALLE

---

# FASE 26: NOTIFICACIONES EN TIEMPO REAL
## *(Alerta proactiva — el sistema habla con el usuario)*

**Duración estimada:** ~2 días (M)
**Rama:** `fase26/notificaciones`
**Dependencias:** FASE 25 merged
**Objetivo:** Centro de notificaciones en el header con badge, polling y 5 tipos de alerta automática.

### Modelo Prisma
```prisma
model Notification {
  id         String   @id @default(cuid())
  tenantId   String
  userId     String?  // null = broadcast a todo el tenant
  type       String   // INVOICE_DUE | PAYMENT_RECEIVED | LOW_STOCK | DEAL_WON | PAYROLL_READY
  title      String
  body       String
  read       Boolean  @default(false)
  link       String?  // URL de destino al hacer click
  createdAt  DateTime @default(now())
  @@index([tenantId, userId, read])
  @@index([tenantId, createdAt])
}
```

### Entregables
```
🗄️ SCHEMA
  [ ] Modelo Notification en prisma/schema.prisma
  [ ] Migración: prisma/migrations/.../migration.sql

🔌 API
  [ ] GET  /api/notifications        → lista no-leídas del usuario
  [ ] PATCH /api/notifications/[id]/read → marcar como leída
  [ ] PATCH /api/notifications/read-all  → marcar todas leídas
  [ ] POST  /api/notifications/trigger   → crear notificación (interno)

🔔 COMPONENTE
  [ ] components/layout/NotificationCenter.tsx (client)
      - Campana con badge de count no-leídas
      - Dropdown con lista (max 20)
      - Clic en notificación → navegar a link + marcar leída
      - Botón "Marcar todas como leídas"
      - Polling cada 30 segundos con useEffect

📡 DISPARADORES AUTOMÁTICOS (Server Actions)
  [ ] Al timbrar factura → notif PAYMENT_RECEIVED al ADMIN
  [ ] Al calcular nómina → notif PAYROLL_READY a RRHH
  [ ] Al ganar deal en pipeline → notif DEAL_WON al dueño
  [ ] Al agregar StockMovement que baja del mínimo → LOW_STOCK
  [ ] Cron diario → facturas con vencimiento en 3 días → INVOICE_DUE

🎨 INTEGRACIÓN EN LAYOUT
  [ ] Agregar <NotificationCenter /> en app/(dashboard)/layout.tsx
```

---

# FASE 27: PORTAL DEL CLIENTE
## *(El cliente ve sus documentos sin acceso al ERP)*

**Duración estimada:** ~2 días (M)
**Rama:** `fase27/portal-cliente`
**Dependencias:** FASE 24 (PDF reports) merged
**Objetivo:** URL pública `/portal/[token]` donde el cliente puede ver sus facturas, descargar CFDIs y consultar su estado de cuenta, sin login al ERP.

### Modelo Prisma
```prisma
model CustomerPortalToken {
  id           String   @id @default(cuid())
  customerId   String
  customer     Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  token        String   @unique @default(cuid())
  expiresAt    DateTime
  lastAccessAt DateTime?
  createdAt    DateTime @default(now())
  @@index([token])
}
```

### Entregables
```
🗄️ SCHEMA
  [ ] Modelo CustomerPortalToken
  [ ] Relación en Customer model

🔌 API
  [ ] POST /api/portal/generate-link?customerId=xxx → crea token + devuelve URL
  [ ] GET  /api/portal/[token]/invoices → facturas del cliente (sin auth ERP)
  [ ] GET  /api/portal/[token]/estado-cuenta → resumen de saldos

🌐 PÁGINAS PÚBLICAS (sin auth)
  [ ] app/portal/[token]/page.tsx
      - Validar token + expiresAt
      - Mostrar: nombre empresa emisora + logo
      - Lista de facturas con estado (PAGADA/PENDIENTE/VENCIDA)
      - Botón "Descargar PDF" por factura (reutiliza API FASE 24)
      - Botón "Descargar Estado de Cuenta" completo
  [ ] app/portal/[token]/layout.tsx (sin sidebar, branding limpio)

📧 GENERACIÓN Y ENVÍO
  [ ] Botón "Enviar portal" en /finanzas/cobranza por cliente
  [ ] Email con link al portal (expira en 30 días)
  [ ] Server Action: generatePortalLink(customerId)
```

---

# FASE 28: BI DASHBOARD REAL
## *(Datos reales de Prisma en los gráficos)*

**Duración estimada:** ~2 días (M)
**Rama:** `fase28/bi-real`
**Dependencias:** FASES 13, 14, 15, 16 (datos en BD)
**Objetivo:** Reemplazar arrays vacíos en /bi con 5 API routes que consultan Prisma y alimentan los charts de Recharts.

### API Routes a crear
```
GET /api/bi/ingresos-egresos   → monthly: { mes, ingresos, egresos }[] (JournalEntry)
GET /api/bi/top-productos       → { nombre, unidades, monto }[] (InvoiceItem)
GET /api/bi/funnel-crm          → { etapa, count, monto }[] (Deal por PipelineColumn)
GET /api/bi/kpis                → { mrr, facturadoMes, cobradoMes, empleados, dealsAbiertos }
GET /api/bi/cobranza-aging      → { bucket, monto }[] (facturas vencidas por rango días)
```

### Entregables
```
🔌 API
  [ ] app/api/bi/ingresos-egresos/route.ts  (últimos 6 meses desde JournalEntry)
  [ ] app/api/bi/top-productos/route.ts     (top 5 por InvoiceItem.importe sum)
  [ ] app/api/bi/funnel-crm/route.ts        (Deal GROUP BY PipelineColumn)
  [ ] app/api/bi/kpis/route.ts             (agregados rápidos multi-modelo)
  [ ] app/api/bi/cobranza-aging/route.ts    (Invoice vencidas GROUP BY rango)

📊 UI /bi
  [ ] Reemplazar useState([]) con fetch a las 5 rutas
  [ ] Skeleton loaders mientras carga
  [ ] Filtro de periodo: 3m / 6m / 12m / año actual
  [ ] Exportar datos como Excel (reutiliza ExcelJS de FASE 24)
  [ ] Tarjetas KPI con delta vs periodo anterior (↑↓)
```

---

# FASE 29: POS COMPLETO
## *(Terminal de punto de venta funcional)*

**Duración estimada:** ~1 semana (L)
**Rama:** `fase29/pos-completo`
**Dependencias:** FASE 14 (POS↔CFDI), FASE 17 (inventario)
**Objetivo:** Construir UI completa de POS: búsqueda productos, carrito, formas de pago, ticket PDF, y creación automática de Invoice Draft.

### Entregables
```
🎨 UI /pos
  [ ] Layout dos paneles: izquierdo (catálogo) + derecho (carrito)
  [ ] Búsqueda/filtro de productos en tiempo real
  [ ] Carrito: agregar, quitar, cambiar cantidad, descuento por línea
  [ ] Cálculo automático subtotal + IVA + total
  [ ] Modal de pago:
      - Efectivo (campo "recibido" + cambio automático)
      - Tarjeta (campo referencia)
      - Transferencia (campo CLABE)
  [ ] Selección de cliente (opcional, buscador)

🔌 SERVER ACTIONS
  [ ] createPosOrder(cartItems, paymentMethod, customerId?)
      → PosOrder + PosOrderItems en BD
      → StockMovement por cada producto (tipo OUT)
      → Invoice DRAFT si hay cliente con RFC

📄 TICKET PDF
  [ ] components/pos/TicketPDF.tsx (@react-pdf/renderer)
      - Logo empresa, folio, fecha, hora
      - Items con cantidad × precio
      - Subtotal, IVA, Total
      - Forma de pago + cambio
      - QR de verificación (si es CFDI)
  [ ] Descarga automática al cerrar venta
  [ ] Botón "Reimprimir" en historial

📋 HISTORIAL
  [ ] /pos/historial → lista de ventas del día/semana
  [ ] Filtros por fecha, cajero, forma de pago
  [ ] Totales del turno (corte de caja)
```

---

# FASE 30: CALENDARIO / CITAS
## *(Vista temporal unificada del ERP)*

**Duración estimada:** ~1 semana (L)
**Rama:** `fase30/calendario`
**Dependencias:** FASE 26 (Notificaciones) recomendado
**Objetivo:** Módulo /citas completo con vistas mes/semana/día, creación de eventos, y eventos automáticos desde el ERP (facturas vencidas, pagos pendientes, nómina).

### Modelo Prisma
```prisma
model CalendarEvent {
  id          String   @id @default(cuid())
  tenantId    String
  userId      String?
  title       String
  description String?
  start       DateTime
  end         DateTime
  allDay      Boolean  @default(false)
  type        String   @default("MANUAL")
  // MANUAL | INVOICE_DUE | PAYROLL_DATE | DEAL_FOLLOWUP | DELIVERY
  color       String?
  relatedId   String?  // ID del recurso relacionado (factura, deal, etc.)
  relatedType String?  // 'Invoice' | 'Deal' | 'PayrollRun'
  createdAt   DateTime @default(now())
  @@index([tenantId, start])
}
```

### Entregables
```
🗄️ SCHEMA
  [ ] Modelo CalendarEvent + migración

🔌 API
  [ ] GET  /api/calendar?from=&to= → eventos en rango de fechas
  [ ] POST /api/calendar           → crear evento
  [ ] PUT  /api/calendar/[id]      → editar evento
  [ ] DELETE /api/calendar/[id]    → eliminar evento

🗓️ UI /citas
  [ ] Vista mensual (grid 7×5 con eventos por día)
  [ ] Vista semanal (columnas por día, hora en eje Y)
  [ ] Modal crear/editar evento (título, fecha inicio/fin, tipo, color)
  [ ] Clic en evento → detalle + link al recurso relacionado

🔗 INTEGRACIÓN AUTOMÁTICA
  [ ] Al timbrar factura con vencimiento → CalendarEvent INVOICE_DUE
  [ ] Al cerrar PayrollRun → CalendarEvent PAYROLL_DATE
  [ ] Al crear Deal con followup_date → CalendarEvent DEAL_FOLLOWUP
```

---

# FASE 31: SCM COMPRAS + LOGÍSTICA
## *(Ciclo completo de abastecimiento)*

**Duración estimada:** ~1 semana (L)
**Rama:** `fase31/scm-compras-logistica`
**Dependencias:** FASE 17 (inventario)

### Modelos Prisma
```prisma
model PurchaseOrder { id, tenantId, supplierId, status, items[], total, ... }
model PurchaseOrderItem { purchaseOrderId, productId, quantity, unitCost, ... }
model Supplier { id, tenantId, name, rfc, email, ... }
model Shipment { id, tenantId, purchaseOrderId, status, trackingNumber, ... }
```

### Entregables
```
[ ] /scm/compras — lista de órdenes de compra con status
[ ] Modal nueva orden: proveedor, productos, cantidades, precio
[ ] Al "Recibir mercancía" → StockMovement IN automático
[ ] PDF de orden de compra (@react-pdf/renderer)
[ ] /scm/logistica — shipments con tracking, origen/destino
[ ] CRUD proveedores
```

---

# FASE 32: CRM MARKETING + SOPORTE
## *(Ciclo completo de cliente)*

**Duración estimada:** ~1 semana (L)
**Rama:** `fase32/crm-marketing-soporte`

### Modelos Prisma
```prisma
model Campaign { id, tenantId, name, subject, html, status, sentAt, recipients[], ... }
model SupportTicket { id, tenantId, customerId, title, status, priority, sla, messages[], ... }
model SupportMessage { id, ticketId, authorId, body, createdAt, ... }
```

### Entregables
```
[ ] /crm/marketing — lista campañas, editor HTML, segmentación por cliente
[ ] Envío masivo vía Resend (o Nodemailer existente)
[ ] /crm/soporte — tablero Kanban tickets (OPEN/IN_PROGRESS/RESOLVED)
[ ] Hilo de mensajes por ticket
[ ] SLA timer (alerta si > 24h sin respuesta)
[ ] Email auto-reply al crear ticket
```

---

# FASE 33: MRP REAL
## *(Manufactura y control de producción)*

**Duración estimada:** ~1 semana (L)
**Rama:** `fase33/mrp-real`

### Modelos Prisma
```prisma
model BOM { id, tenantId, productId, version, items[] }
model BOMItem { bomId, componentId, quantity, unit }
model ProductionOrder { id, tenantId, bomId, quantity, status, startDate, endDate }
model QualityInspection { id, productionOrderId, result, notes, inspectedAt }
```

### Entregables
```
[ ] /mrp/bom — árbol de componentes drag & drop
[ ] /mrp/planificacion — órdenes de producción, timeline Gantt simple
[ ] Al completar orden → descontar componentes del inventario (StockMovement OUT)
[ ] /mrp/calidad — inspecciones por lote, no-conformidades
```

---

# FASE 34: RRHH ASISTENCIA + DOCUMENTOS + CULTURA
## *(Capital humano completo)*

**Duración estimada:** ~1 semana (L)
**Rama:** `fase34/rrhh-plus`

### Entregables
```
[ ] /rrhh — checador visual (reloj entrada/salida con Attendance existente)
[ ] /rrhh/documentos — upload contratos/credenciales a Supabase Storage
[ ] /rrhh/cultura — encuesta NPS empleado (1-10 + comentario libre)
[ ] Reporte mensual de asistencias en Excel (reutiliza ExcelJS)
[ ] Vacaciones: solicitud → aprobación por ADMIN → descuento días
```

---

# FASE 35: MULTI-IDIOMA (i18n)
**Duración estimada:** ~1 semana (L) | **Rama:** `fase35/i18n`
```
[ ] next-intl instalado y configurado
[ ] /messages/es.json — todos los strings en español
[ ] /messages/en.json — traducción al inglés
[ ] Toggle ES/EN en el header (persiste en cookie)
[ ] Fechas y montos formateados según locale
```

---

# FASE 36: PWA + OFFLINE
**Duración estimada:** ~1 semana (L) | **Rama:** `fase36/pwa`
```
[ ] manifest.json con íconos y theme_color
[ ] Service Worker (next-pwa o custom)
[ ] Offline mode: consulta inventario + historial POS sin internet
[ ] Web Push API: suscripción + envío desde servidor
[ ] IndexedDB cache para datos críticos
```

---

# FASE 37: INTEGRACIONES EXTERNAS
**Duración estimada:** ~2 semanas (XL) | **Rama:** `fase37/integraciones`
```
[ ] SAT: consulta estatus CFDI vía webservice (verificacfdi.sat.gob.mx)
[ ] Bancos: validación CLABE (18 dígitos + dígito verificador)
[ ] Conciliación bancaria: upload CSV/OFX del banco → match vs JournalEntry
[ ] WhatsApp Business API: envío facturas + notificaciones por WA
[ ] Webhook genérico: recibir eventos de terceros (n8n, Zapier)
```

---

# FASE 38: AI COPILOT (CIFRA IA)
**Duración estimada:** ~1 semana (L) | **Rama:** `fase38/ai-copilot`
```
[ ] Widget flotante en todas las páginas del dashboard
[ ] Integración con Claude API (Anthropic claude-sonnet-4-6)
[ ] Contexto RAG: últimas 50 facturas + inventario + nómina del tenant
[ ] Preguntas de ejemplo:
    "¿Cuánto facturé este mes vs el anterior?"
    "¿Qué productos están por agotarse?"
    "¿Cuál es mi utilidad neta del trimestre?"
[ ] Streaming de respuesta (SSE / ReadableStream)
[ ] Historial de conversación por sesión
```

---

# FASE 39: MARKETPLACE DE INTEGRACIONES
**Duración estimada:** ~2 semanas (XL) | **Rama:** `fase39/marketplace`
```
[ ] /settings/integraciones — panel con conectores disponibles
[ ] CONTPAQi Nube — exportar pólizas contables en formato DIOT
[ ] Shopify — sync productos e inventario bidireccional
[ ] WooCommerce — sync pedidos → PosOrder automático
[ ] MercadoLibre — sync órdenes + actualización stock
[ ] Cada conector: OAuth o API Key + webhook de eventos
```

---

# FASE 40: ENTERPRISE MULTI-EMPRESA
**Duración estimada:** ~2 semanas (XL) | **Rama:** `fase40/multi-empresa`

### Modelo Prisma
```prisma
model UserTenantMembership {
  id       String @id @default(cuid())
  userId   String
  tenantId String
  role     Role
  @@unique([userId, tenantId])
}
```

### Entregables
```
[ ] Un usuario puede pertenecer a múltiples tenants
[ ] Selector de empresa en el header (dropdown con switch instantáneo)
[ ] Reportes consolidados cross-tenant (ingresos grupo holding)
[ ] Permisos granulares por empresa (ADMIN en empresa A, OPERATIVE en empresa B)
[ ] Facturación Stripe grupal (un plan que cubre N empresas)
[ ] Exportación consolidada: balance general grupo + estado de resultados grupo
```
