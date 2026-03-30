'use client';

import { useState, useTransition } from 'react';
import {
  Building2, ChevronDown, Users, Loader2,
  Power, PowerOff, Zap, Trash2, AlertTriangle,
} from 'lucide-react';
import { MODULE_DEFS, type ModuleKey } from '@/lib/modules/registry';
import {
  toggleTenantModule,
  activateAllModules,
  deactivateAllModules,
  deleteTenant,
} from '@/app/(dashboard)/admin/actions';

// ─── Tipos ───────────────────────────────────────────────

interface TenantData {
  id: string;
  name: string;
  rfc: string | null;
  createdAt: string;
  userCount: number;
  users: { name: string; email: string; role: string }[];
  modules: { id: string; moduleKey: string; isActive: boolean }[];
  subscriptionStatus: string | null;
}

interface Props {
  tenant: TenantData;
}

const ALL_MODULE_KEYS: ModuleKey[] = [
  'DASHBOARD', 'CALENDAR', 'BI',
  'HCM', 'PAYROLL', 'TALENT',
  'FINANCE', 'TAXES', 'COLLECTIONS',
  'BILLING_CFDI', 'POS',
  'CRM', 'MARKETING', 'SUPPORT',
  'SCM', 'INVENTORY', 'LOGISTICS',
  'MRP', 'QUALITY', 'PROJECTS',
];

// ─── Componente ──────────────────────────────────────────

export default function TenantModuleManager({ tenant }: Props) {
  const [isOpen, setIsOpen]       = useState(false);
  const [isPending, startTransition] = useTransition();
  const [optimisticModules, setOptimisticModules] = useState(tenant.modules);

  // Estado de confirmación de borrado
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError]     = useState('');

  const SUPER_ADMIN_EMAIL = '553angelortiz@gmail.com';
  const isSuperAdminTenant = tenant.users.some((u) => u.email === SUPER_ADMIN_EMAIL);
  const activeCount = optimisticModules.filter((m) => m.isActive).length;
  const statusColor =
    tenant.subscriptionStatus === 'ACTIVE'
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
      : tenant.subscriptionStatus === 'TRIAL'
      ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
      : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400';

  // ── Handlers módulos ─────────────────────────────────────

  const handleToggle = (moduleKey: string, currentActive: boolean) => {
    setOptimisticModules((prev) => {
      const existing = prev.find((m) => m.moduleKey === moduleKey);
      if (existing) return prev.map((m) => m.moduleKey === moduleKey ? { ...m, isActive: !currentActive } : m);
      return [...prev, { id: 'temp', moduleKey, isActive: true }];
    });
    startTransition(async () => {
      try {
        await toggleTenantModule(tenant.id, moduleKey, !currentActive);
      } catch {
        setOptimisticModules(tenant.modules);
      }
    });
  };

  const handleActivateAll = () => {
    setOptimisticModules(ALL_MODULE_KEYS.map((key) => ({ id: 'temp', moduleKey: key, isActive: true })));
    startTransition(async () => {
      try { await activateAllModules(tenant.id); }
      catch { setOptimisticModules(tenant.modules); }
    });
  };

  const handleDeactivateAll = () => {
    setOptimisticModules((prev) => prev.map((m) => ({ ...m, isActive: false })));
    startTransition(async () => {
      try { await deactivateAllModules(tenant.id); }
      catch { setOptimisticModules(tenant.modules); }
    });
  };

  // ── Handler eliminar tenant ──────────────────────────────

  const handleDelete = async () => {
    setDeleteLoading(true);
    setDeleteError('');
    const result = await deleteTenant(tenant.id);
    if (result.success) {
      // El componente desaparecerá por revalidatePath en el server action
    } else {
      setDeleteError(result.error ?? 'Error desconocido');
      setDeleteLoading(false);
      setDeleteConfirm(false);
    }
  };

  const isModuleActive = (key: string) =>
    optimisticModules.find((m) => m.moduleKey === key)?.isActive ?? false;

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden transition-all">

      {/* Header del Tenant (clickeable para expandir) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-neutral-500" />
          </div>
          <div>
            <h3 className="font-black text-neutral-900 dark:text-white text-base">{tenant.name}</h3>
            <div className="flex items-center gap-3 mt-1">
              {tenant.rfc && (
                <span className="text-[11px] font-mono text-neutral-500">RFC: {tenant.rfc}</span>
              )}
              <span className="flex items-center gap-1 text-[11px] text-neutral-500">
                <Users className="h-3 w-3" />
                {tenant.userCount} usuario{tenant.userCount !== 1 ? 's' : ''}
              </span>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${statusColor}`}>
                {tenant.subscriptionStatus ?? 'Sin plan'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-neutral-500">
            {activeCount}/{ALL_MODULE_KEYS.length} módulos
          </span>
          {isPending && <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />}
          <ChevronDown className={`h-5 w-5 text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Panel expandible */}
      {isOpen && (
        <div className="border-t border-neutral-200 dark:border-neutral-800 p-5 space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">

          {/* Acciones masivas de módulos */}
          <div className="flex items-center gap-3">
            <button onClick={handleActivateAll} disabled={isPending}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-xs rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors disabled:opacity-50">
              <Zap className="h-3.5 w-3.5" />
              Activar Todos
            </button>
            <button onClick={handleDeactivateAll} disabled={isPending}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-bold text-xs rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors disabled:opacity-50">
              <PowerOff className="h-3.5 w-3.5" />
              Desactivar Todos
            </button>
          </div>

          {/* Grid de módulos */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {ALL_MODULE_KEYS.map((key) => {
              const def    = MODULE_DEFS[key];
              const active = isModuleActive(key);
              return (
                <button key={key} onClick={() => handleToggle(key, active)} disabled={isPending}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all disabled:opacity-60 ${
                    active
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30'
                      : 'bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700 opacity-60 hover:opacity-100'
                  }`}>
                  <div className={`p-1.5 rounded-lg ${active ? 'bg-emerald-100 dark:bg-emerald-500/20' : 'bg-neutral-200 dark:bg-neutral-700'}`}>
                    {active
                      ? <Power    className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      : <PowerOff className="h-3.5 w-3.5 text-neutral-400" />}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold truncate ${active ? 'text-emerald-900 dark:text-emerald-300' : 'text-neutral-500'}`}>
                      {def.label}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Usuarios del tenant */}
          {tenant.users.length > 0 && (
            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">
                Usuarios del Tenant
              </p>
              <div className="flex flex-wrap gap-2">
                {tenant.users.map((user) => (
                  <div key={user.email} className="flex items-center gap-2 bg-neutral-50 dark:bg-neutral-800 px-3 py-1.5 rounded-lg">
                    <div className="h-6 w-6 rounded-md bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-[10px] font-black text-neutral-600 dark:text-neutral-300">
                      {user.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">{user.name}</p>
                      <p className="text-[10px] text-neutral-400">{user.email}</p>
                    </div>
                    <span className="text-[9px] font-black uppercase text-neutral-400 bg-neutral-100 dark:bg-neutral-700 px-1.5 py-0.5 rounded">
                      {user.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ZONA DE PELIGRO: Eliminar tenant (oculto para el super admin) ── */}
          {!isSuperAdminTenant && <div className="pt-4 border-t border-red-100 dark:border-red-900/30">
            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <AlertTriangle className="h-3 w-3" />
              Zona de Peligro
            </p>

            {deleteError && (
              <div className="mb-3 p-2.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-xs text-red-600 dark:text-red-400">
                {deleteError}
              </div>
            )}

            {!deleteConfirm ? (
              <button
                onClick={() => { setDeleteConfirm(true); setDeleteError(''); }}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-bold text-xs rounded-xl border border-red-200 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Eliminar Tenant Definitivamente
              </button>
            ) : (
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-black text-red-700 dark:text-red-400">
                      ¿Confirmas la eliminación permanente?
                    </p>
                    <p className="text-xs text-red-600/80 dark:text-red-400/70 mt-1 leading-relaxed">
                      Se eliminarán <strong>{tenant.userCount} usuario{tenant.userCount !== 1 ? 's' : ''}</strong>,
                      todos los módulos, datos financieros y registros de <strong>{tenant.name}</strong>.
                      Esta acción <strong>NO se puede deshacer</strong>.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDelete}
                    disabled={deleteLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-colors disabled:opacity-60"
                  >
                    {deleteLoading
                      ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Eliminando…</>
                      : <><Trash2 className="h-3.5 w-3.5" />Sí, eliminar permanentemente</>
                    }
                  </button>
                  <button
                    onClick={() => { setDeleteConfirm(false); setDeleteError(''); }}
                    disabled={deleteLoading}
                    className="px-4 py-2 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 font-medium transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>}

        </div>
      )}
    </div>
  );
}
