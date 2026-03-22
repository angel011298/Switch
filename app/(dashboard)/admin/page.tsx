import { redirect } from 'next/navigation';
import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { ShieldAlert, Building2, Users, Blocks, Activity } from 'lucide-react';
import TenantModuleManager from '@/components/admin/TenantModuleManager';

export const metadata = { title: 'Admin Maestro | Switch OS' };

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

  // Traer todos los tenants con sus modulos activos y conteo de usuarios
  const tenants = await prisma.tenant.findMany({
    include: {
      modules: {
        orderBy: { moduleKey: 'asc' },
      },
      users: {
        select: { id: true, email: true, name: true, role: true },
      },
      subscription: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const totalUsers = tenants.reduce((acc, t) => acc + t.users.length, 0);
  const totalModulesActive = tenants.reduce(
    (acc, t) => acc + t.modules.filter((m) => m.isActive).length,
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          label="Suscripciones"
          value={String(tenants.filter((t) => t.subscription).length)}
          accent="amber"
        />
      </div>

      {/* Lista de Tenants con Manager de modulos */}
      <section>
        <h2 className="text-xl font-black text-neutral-900 dark:text-white mb-4">
          Organizaciones Registradas
        </h2>
        <div className="space-y-4">
          {tenants.map((tenant) => (
            <TenantModuleManager
              key={tenant.id}
              tenant={{
                id: tenant.id,
                name: tenant.name,
                rfc: tenant.rfc,
                createdAt: tenant.createdAt.toISOString(),
                userCount: tenant.users.length,
                users: tenant.users.map((u) => ({
                  name: u.name,
                  email: u.email,
                  role: u.role,
                })),
                modules: tenant.modules.map((m) => ({
                  id: m.id,
                  moduleKey: m.moduleKey,
                  isActive: m.isActive,
                })),
                subscriptionStatus: tenant.subscription?.status ?? null,
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
    blue: { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-500/10', text: 'text-purple-600' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600' },
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
