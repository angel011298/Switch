import { redirect } from 'next/navigation';
import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { ShieldAlert, Building2, Users, Blocks, Activity, Banknote } from 'lucide-react';
import TenantModuleManager from '@/components/admin/TenantModuleManager';
import PendingPaymentsPanel from '@/components/admin/PendingPaymentsPanel';

export const metadata = { title: 'Admin Maestro | CIFRA' };

/**
 * Panel de Super Admin — Server Component.
 * Solo accesible con is_super_admin: true en el JWT.
 * Muestra la lista de Tenants y permite prender/apagar modulos.
 */
export default async function AdminPage() {
  const session = await getSwitchSession();

  if (!session || !session.isSuperAdmin) {
    redirect('/dashboard');
  }

  // Traer todos los tenants + comprobantes pendientes en paralelo
  const [tenants, pendingProofs] = await Promise.all([
    prisma.tenant.findMany({
      include: {
        modules: { orderBy: { moduleKey: 'asc' } },
        memberships: {
          include: {
            user: { select: { id: true, email: true, name: true, createdAt: true } }
          }
        },
        subscription: { select: { status: true, validUntil: true, planId: true, stripeSubscriptionId: true, stripePriceId: true } },
        taxRegime: { select: { code: true, description: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.paymentProof.findMany({
      where: { status: 'PENDING' },
      include: { tenant: { select: { id: true, name: true, rfc: true } } },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const totalUsers = tenants.reduce((acc, t: any) => acc + t.memberships.length, 0);
  const totalModulesActive = tenants.reduce(
    (acc, t: any) => acc + t.modules.filter((m: any) => m.isActive).length,
    0
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <header className="flex items-center gap-4 bg-neutral-950 dark:bg-neutral-900 text-white p-6 rounded-2xl shadow-xl">
        <div className="bg-emerald-500 p-3 rounded-xl">
          <ShieldAlert className="h-8 w-8 text-neutral-950" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight">Centro de Mando</h1>
          <p className="text-emerald-500 font-bold text-sm uppercase tracking-widest mt-1">
            Modo Super Admin Activo
          </p>
        </div>
      </header>

      {/* Metricas globales */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <MetricCard
          icon={Building2}
          label="Tenants"
          value={String(tenants.length)}
          accent="blue"
        />
        <MetricCard
          icon={Users}
          label="Usuarios Totales"
          value={String(totalUsers)}
          accent="emerald"
        />
        <MetricCard
          icon={Blocks}
          label="Modulos Activos"
          value={String(totalModulesActive)}
          accent="purple"
        />
        <MetricCard
          icon={Activity}
          label="Suscripciones Activas"
          value={String(tenants.filter((t: any) => t.subscription?.status === 'ACTIVE').length)}
          accent="amber"
        />
        <MetricCard
          icon={Banknote}
          label="Pagos Pendientes"
          value={String(pendingProofs.length)}
          accent={pendingProofs.length > 0 ? 'red' : 'emerald'}
        />
      </div>

      {/* ─── Pagos Pendientes ─────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-neutral-900 dark:text-white flex items-center gap-2">
            <Banknote className="h-5 w-5 text-amber-500" />
            Pagos Pendientes de Revisión
            {pendingProofs.length > 0 && (
              <span className="bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold px-2 py-0.5 rounded-full">
                {pendingProofs.length}
              </span>
            )}
          </h2>
        </div>
        <PendingPaymentsPanel
          proofs={pendingProofs.map((p) => ({
            id: p.id,
            amount: Number(p.amount),
            transferRef: p.transferRef,
            paidAt: p.paidAt,
            createdAt: p.createdAt,
            fileName: p.fileName,
            fileType: p.fileType,
            fileBase64: p.fileBase64,
            tenant: p.tenant,
          }))}
        />
      </section>

      {/* Lista de Tenants con Manager de modulos */}
      <section>
        <h2 className="text-xl font-black text-neutral-900 dark:text-white mb-4">
          Organizaciones Registradas
        </h2>
        <div className="space-y-4">
          {tenants.map((tenant: any) => (
            <TenantModuleManager
              key={tenant.id}
              tenant={{
                id: tenant.id,
                name: tenant.name,
                rfc: tenant.rfc,
                legalName: (tenant as any).legalName ?? null,
                personType: (tenant as any).personType ?? null,
                zipCode: (tenant as any).zipCode ?? null,
                registroPatronal: (tenant as any).registroPatronal ?? null,
                onboardingComplete: (tenant as any).onboardingComplete ?? false,
                // Geocerca
                workLat: (tenant as any).workLat ?? null,
                workLon: (tenant as any).workLon ?? null,
                workAddress: (tenant as any).workAddress ?? null,
                radioToleranceMeters: (tenant as any).radioToleranceMeters ?? 100,
                // Stripe
                stripeCustomerId: (tenant as any).stripeCustomerId ?? null,
                createdAt: tenant.createdAt.toISOString(),
                userCount: tenant.memberships.length,
                users: tenant.memberships.map((m: any) => ({
                  name: m.user.name,
                  email: m.user.email,
                  role: m.role,
                  createdAt: m.user.createdAt.toISOString(),
                })),
                modules: tenant.modules.map((m: any) => ({
                  id: m.id,
                  moduleKey: m.moduleKey,
                  isActive: m.isActive,
                })),
                subscriptionStatus: tenant.subscription?.status ?? null,
                subscriptionValidUntil: tenant.subscription?.validUntil?.toISOString() ?? null,
                subscriptionPlan: tenant.subscription?.planId ?? null,
                stripeSubscriptionId: tenant.subscription?.stripeSubscriptionId ?? null,
                taxRegimeCode: (tenant as any).taxRegime?.code ?? null,
                taxRegimeDescription: (tenant as any).taxRegime?.description ?? null,
              }}
            />
          ))}

          {tenants.length === 0 && (
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-12 text-center">
              <Building2 className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-500 font-medium">
                No hay tenants registrados aun.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// ─── Sub-componente ─────────────────────────────────────

function MetricCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: any;
  label: string;
  value: string;
  accent: string;
}) {
  const colors: Record<string, { bg: string; text: string }> = {
    blue:    { bg: 'bg-blue-50 dark:bg-blue-500/10',    text: 'text-blue-600' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600' },
    purple:  { bg: 'bg-purple-50 dark:bg-purple-500/10',  text: 'text-purple-600' },
    amber:   { bg: 'bg-amber-50 dark:bg-amber-500/10',   text: 'text-amber-600' },
    red:     { bg: 'bg-red-50 dark:bg-red-500/10',       text: 'text-red-600' },
  };
  const c = colors[accent] || colors.blue;

  return (
    <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800">
      <div className={`p-2 rounded-xl ${c.bg} w-fit mb-3`}>
        <Icon className={`h-5 w-5 ${c.text}`} />
      </div>
      <p className="text-2xl font-black text-neutral-900 dark:text-white">{value}</p>
      <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mt-1">
        {label}
      </p>
    </div>
  );
}
