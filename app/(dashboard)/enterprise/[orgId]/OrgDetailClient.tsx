'use client';

/**
 * CIFRA — Enterprise Org Detail Dashboard
 * FASE 40 (FINAL): Dashboard consolidado de subsidiarias de una organización
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Users,
  FileText,
  TrendingUp,
  UserCheck,
  Plus,
  Trash2,
  ExternalLink,
  Trophy,
  AlertCircle,
  Loader2,
  X,
  Info,
  ChevronRight,
  BarChart2,
} from 'lucide-react';
import type { OrgTenantRow, ConsolidatedKpis } from '../actions';
import { addTenantToOrg, removeTenantFromOrg } from '../actions';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Palette of left-border + badge colors per company index
const COMPANY_COLORS = [
  { border: 'border-l-violet-500',  bg: 'bg-violet-50 dark:bg-violet-500/10',  text: 'text-violet-700 dark:text-violet-300',  bar: 'bg-violet-500'  },
  { border: 'border-l-blue-500',    bg: 'bg-blue-50 dark:bg-blue-500/10',      text: 'text-blue-700 dark:text-blue-300',      bar: 'bg-blue-500'    },
  { border: 'border-l-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10',text: 'text-emerald-700 dark:text-emerald-300',bar: 'bg-emerald-500' },
  { border: 'border-l-orange-500',  bg: 'bg-orange-50 dark:bg-orange-500/10',  text: 'text-orange-700 dark:text-orange-300',  bar: 'bg-orange-500'  },
  { border: 'border-l-pink-500',    bg: 'bg-pink-50 dark:bg-pink-500/10',      text: 'text-pink-700 dark:text-pink-300',      bar: 'bg-pink-500'    },
  { border: 'border-l-cyan-500',    bg: 'bg-cyan-50 dark:bg-cyan-500/10',      text: 'text-cyan-700 dark:text-cyan-300',      bar: 'bg-cyan-500'    },
  { border: 'border-l-amber-500',   bg: 'bg-amber-50 dark:bg-amber-500/10',    text: 'text-amber-700 dark:text-amber-300',    bar: 'bg-amber-500'   },
  { border: 'border-l-rose-500',    bg: 'bg-rose-50 dark:bg-rose-500/10',      text: 'text-rose-700 dark:text-rose-300',      bar: 'bg-rose-500'    },
];

function getColor(idx: number) {
  return COMPANY_COLORS[idx % COMPANY_COLORS.length];
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent: string;
}

function KpiCard({ label, value, sub, icon, accent }: KpiCardProps) {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-2">
            {label}
          </p>
          <p className={`text-2xl font-black leading-none ${accent}`}>
            {value}
          </p>
          {sub && (
            <p className="text-xs text-neutral-400 mt-1.5">{sub}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${accent.includes('emerald') ? 'bg-emerald-50 dark:bg-emerald-500/10' : accent.includes('blue') ? 'bg-blue-50 dark:bg-blue-500/10' : accent.includes('violet') ? 'bg-violet-50 dark:bg-violet-500/10' : 'bg-orange-50 dark:bg-orange-500/10'}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ─── Revenue Bar Chart (pure CSS) ─────────────────────────────────────────────

interface RevenueBarChartProps {
  tenants: OrgTenantRow[];
}

function RevenueBarChart({ tenants }: RevenueBarChartProps) {
  const maxRevenue = Math.max(...tenants.map((t) => t.monthlyRevenue), 1);
  const sorted = [...tenants].sort((a, b) => b.monthlyRevenue - a.monthlyRevenue);

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <BarChart2 size={18} className="text-violet-500" />
        <h3 className="font-black text-neutral-900 dark:text-white text-sm">
          Distribución de ingresos — este mes
        </h3>
      </div>

      {sorted.every((t) => t.monthlyRevenue === 0) ? (
        <div className="flex flex-col items-center py-8 text-neutral-400 text-sm gap-2">
          <BarChart2 size={32} className="opacity-30" />
          <p>Sin ingresos registrados este mes</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((tenant, idx) => {
            const pct = maxRevenue > 0 ? (tenant.monthlyRevenue / maxRevenue) * 100 : 0;
            const color = getColor(idx);
            const label = tenant.alias ?? tenant.tenantName;

            return (
              <div key={tenant.id}>
                <div className="flex items-center justify-between mb-1.5 gap-2">
                  <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 truncate max-w-[55%]">
                    {label}
                  </span>
                  <span className="text-sm font-black text-neutral-900 dark:text-white flex-shrink-0">
                    {formatCurrency(tenant.monthlyRevenue)}
                  </span>
                </div>
                <div className="h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${color.bar}`}
                    style={{ width: `${Math.max(pct, pct > 0 ? 2 : 0)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Agregar empresa modal ────────────────────────────────────────────────────

interface AddTenantModalProps {
  open: boolean;
  orgId: string;
  onClose: () => void;
  onAdded: () => void;
}

function AddTenantModal({ open, orgId, onClose, onAdded }: AddTenantModalProps) {
  const [tenantId, setTenantId] = useState('');
  const [alias, setAlias] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClose() {
    if (isPending) return;
    setTenantId('');
    setAlias('');
    setError(null);
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!tenantId.trim()) { setError('El ID de empresa es requerido'); return; }

    startTransition(async () => {
      try {
        await addTenantToOrg(orgId, { tenantId: tenantId.trim(), alias: alias.trim() || undefined });
        handleClose();
        onAdded();
      } catch (err: any) {
        setError(err.message ?? 'Error al agregar la empresa');
      }
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl">
              <Plus className="text-emerald-600 dark:text-emerald-400" size={20} />
            </div>
            <div>
              <h2 className="font-black text-neutral-900 dark:text-white text-lg leading-none">
                Agregar empresa
              </h2>
              <p className="text-neutral-500 text-xs mt-0.5">
                Vincula una subsidiaria a este grupo
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isPending}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-sm text-red-700 dark:text-red-400">
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Info */}
          <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl">
            <Info size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              Puedes encontrar el ID de tu empresa en{' '}
              <strong>Configuración &gt; Mi cuenta</strong>
            </p>
          </div>

          {/* Tenant ID */}
          <div>
            <label className="block text-xs font-black text-neutral-600 dark:text-neutral-400 uppercase tracking-widest mb-2">
              ID de empresa CIFRA *
            </label>
            <input
              type="text"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              placeholder="cly1abc23def456..."
              disabled={isPending}
              className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-mono text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all disabled:opacity-60"
            />
          </div>

          {/* Alias */}
          <div>
            <label className="block text-xs font-black text-neutral-600 dark:text-neutral-400 uppercase tracking-widest mb-2">
              Alias (opcional)
            </label>
            <input
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="Ej: Filial Norte, Holding MX..."
              disabled={isPending}
              className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all disabled:opacity-60"
            />
            <p className="text-xs text-neutral-400 mt-1.5">
              Nombre corto que aparecerá en el dashboard consolidado
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="flex-1 px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || !tenantId.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-500/25"
            >
              {isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Agregando...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Agregar empresa
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface OrgDetailClientProps {
  orgId: string;
  initialTenants: OrgTenantRow[];
  kpis: ConsolidatedKpis;
}

export default function OrgDetailClient({ orgId, initialTenants, kpis }: OrgDetailClientProps) {
  const router = useRouter();
  const [tenants, setTenants] = useState<OrgTenantRow[]>(initialTenants);
  const [showAddModal, setShowAddModal] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [, startRemoveTransition] = useTransition();

  // Derive org name from first tenant if available (fallback to ID)
  const orgDisplayName = `Organización ${orgId.slice(0, 8)}`;

  function handleAdded() {
    router.refresh();
    // Optimistic: page will reload tenants from server on next render cycle
  }

  function handleRemove(orgTenantId: string, tenantName: string) {
    if (!confirm(`¿Quitar "${tenantName}" de este grupo? Los datos de la empresa no se eliminarán.`)) return;
    setRemoveError(null);
    setRemovingId(orgTenantId);

    startRemoveTransition(async () => {
      try {
        await removeTenantFromOrg(orgTenantId);
        setTenants((prev) => prev.filter((t) => t.id !== orgTenantId));
        router.refresh();
      } catch (err: any) {
        setRemoveError(err.message ?? 'Error al quitar la empresa');
      } finally {
        setRemovingId(null);
      }
    });
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          {/* Back button */}
          <button
            onClick={() => router.push('/enterprise')}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors flex-shrink-0"
          >
            <ArrowLeft size={16} />
            Grupos
          </button>

          {/* Title */}
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-black text-neutral-950 dark:text-white">
                {orgDisplayName}
              </h1>
              <span className="px-3 py-1 bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 text-xs font-black rounded-full uppercase tracking-wider">
                Plan Enterprise
              </span>
            </div>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
              Dashboard consolidado — {kpis.companiesCount}{' '}
              {kpis.companiesCount === 1 ? 'empresa' : 'empresas'} vinculadas
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-sm transition-colors shadow-md shadow-emerald-500/25 flex-shrink-0 hover:-translate-y-0.5 transform duration-150"
        >
          <Plus size={16} />
          Agregar empresa
        </button>
      </div>

      {/* ── Error banner ─────────────────────────────────────── */}
      {removeError && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-sm text-red-700 dark:text-red-400">
          <AlertCircle size={16} className="flex-shrink-0" />
          {removeError}
          <button onClick={() => setRemoveError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── 4 KPI Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Ingresos totales este mes"
          value={formatCurrency(kpis.totalRevenue)}
          sub="Suma de todas las subsidiarias"
          icon={<TrendingUp size={22} className="text-emerald-600" />}
          accent="text-emerald-600 dark:text-emerald-400"
        />
        <KpiCard
          label="Total empleados"
          value={kpis.totalEmployees.toLocaleString('es-MX')}
          sub="Empleados activos consolidados"
          icon={<Users size={22} className="text-blue-600" />}
          accent="text-blue-600 dark:text-blue-400"
        />
        <KpiCard
          label="Total facturas"
          value={kpis.totalInvoices.toLocaleString('es-MX')}
          sub="CFDIs emitidos (acumulado)"
          icon={<FileText size={22} className="text-violet-600" />}
          accent="text-violet-600 dark:text-violet-400"
        />
        <KpiCard
          label="Total clientes"
          value={kpis.totalCustomers.toLocaleString('es-MX')}
          sub="Clientes únicos consolidados"
          icon={<UserCheck size={22} className="text-orange-600" />}
          accent="text-orange-600 dark:text-orange-400"
        />
      </div>

      {/* ── Top company highlight ─────────────────────────────── */}
      {kpis.topCompany && kpis.totalRevenue > 0 && (
        <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-500/10 dark:to-yellow-500/5 border border-amber-200 dark:border-amber-500/30 rounded-2xl shadow-sm">
          <div className="p-3 bg-amber-100 dark:bg-amber-500/20 rounded-2xl flex-shrink-0">
            <Trophy size={24} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-0.5">
              Empresa con mayor revenue este mes
            </p>
            <p className="text-xl font-black text-neutral-900 dark:text-white truncate">
              {kpis.topCompany}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">TOP</p>
            <p className="text-xs text-amber-500">#1 Revenue</p>
          </div>
        </div>
      )}

      {/* ── Two-column: table + chart ─────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Table — spans 2 cols */}
        <div className="xl:col-span-2">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden">
            {/* Table header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-violet-500" />
                <h2 className="font-black text-neutral-900 dark:text-white">
                  Empresas vinculadas
                </h2>
                <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 text-xs font-black rounded-md">
                  {tenants.length}
                </span>
              </div>
            </div>

            {tenants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mb-4">
                  <Building2 size={28} className="text-neutral-400" />
                </div>
                <h3 className="font-black text-neutral-900 dark:text-white text-base mb-2">
                  Sin empresas vinculadas
                </h3>
                <p className="text-neutral-500 text-sm max-w-xs mb-6">
                  Agrega tu primera subsidiaria para ver el dashboard consolidado
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl transition-colors shadow-md shadow-emerald-500/20"
                >
                  <Plus size={15} />
                  Agregar empresa
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-neutral-50 dark:bg-black/30 text-[10px] font-black uppercase tracking-widest text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
                      <th className="px-6 py-3 text-left">Empresa</th>
                      <th className="px-4 py-3 text-left hidden sm:table-cell">RFC</th>
                      <th className="px-4 py-3 text-left hidden md:table-cell">Alias</th>
                      <th className="px-4 py-3 text-right">Empleados</th>
                      <th className="px-4 py-3 text-right hidden lg:table-cell">Facturas</th>
                      <th className="px-4 py-3 text-right">Ingresos mes</th>
                      <th className="px-4 py-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {tenants.map((tenant, idx) => {
                      const color = getColor(idx);
                      const isRemoving = removingId === tenant.id;

                      return (
                        <tr
                          key={tenant.id}
                          className={`hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors border-l-4 ${color.border} ${isRemoving ? 'opacity-50' : ''}`}
                        >
                          {/* Empresa */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${color.bg}`}>
                                <span className={`text-sm font-black ${color.text}`}>
                                  {(tenant.alias ?? tenant.tenantName).charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className="font-black text-sm text-neutral-900 dark:text-white truncate max-w-[140px]">
                                  {tenant.tenantName}
                                </p>
                                <p className="text-[10px] text-neutral-400 font-mono truncate">
                                  {tenant.tenantId.slice(0, 14)}...
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* RFC */}
                          <td className="px-4 py-4 hidden sm:table-cell">
                            <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400">
                              {tenant.tenantRfc ?? '—'}
                            </span>
                          </td>

                          {/* Alias */}
                          <td className="px-4 py-4 hidden md:table-cell">
                            {tenant.alias ? (
                              <span className={`px-2 py-1 rounded-md text-[10px] font-black ${color.bg} ${color.text}`}>
                                {tenant.alias}
                              </span>
                            ) : (
                              <span className="text-neutral-400 text-xs">—</span>
                            )}
                          </td>

                          {/* Empleados */}
                          <td className="px-4 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Users size={12} className="text-neutral-400 flex-shrink-0" />
                              <span className="font-black text-sm text-neutral-900 dark:text-white">
                                {tenant.employeeCount.toLocaleString('es-MX')}
                              </span>
                            </div>
                          </td>

                          {/* Facturas */}
                          <td className="px-4 py-4 text-right hidden lg:table-cell">
                            <div className="flex items-center justify-end gap-1">
                              <FileText size={12} className="text-neutral-400 flex-shrink-0" />
                              <span className="font-black text-sm text-neutral-900 dark:text-white">
                                {tenant.invoiceCount.toLocaleString('es-MX')}
                              </span>
                            </div>
                          </td>

                          {/* Ingresos */}
                          <td className="px-4 py-4 text-right">
                            <span className="font-black text-sm text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(tenant.monthlyRevenue)}
                            </span>
                          </td>

                          {/* Acciones */}
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Abrir */}
                              <button
                                onClick={() => router.push('/dashboard')}
                                title="Abrir empresa"
                                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-black text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                              >
                                <ExternalLink size={13} />
                                Abrir
                              </button>

                              {/* Quitar */}
                              <button
                                onClick={() => handleRemove(tenant.id, tenant.alias ?? tenant.tenantName)}
                                disabled={isRemoving}
                                title="Quitar empresa del grupo"
                                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-black text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {isRemoving
                                  ? <Loader2 size={13} className="animate-spin" />
                                  : <Trash2 size={13} />}
                                Quitar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Revenue chart — 1 col */}
        <div className="xl:col-span-1 space-y-4">
          <RevenueBarChart tenants={tenants} />

          {/* Quick stats card */}
          {tenants.length > 0 && (
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="font-black text-neutral-900 dark:text-white text-sm flex items-center gap-2">
                <ChevronRight size={16} className="text-violet-500" />
                Resumen del grupo
              </h3>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-500">Empresas activas</span>
                  <span className="font-black text-neutral-900 dark:text-white">{tenants.length}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-500">Facturación promedio</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">
                    {tenants.length > 0
                      ? formatCurrency(kpis.totalRevenue / tenants.length)
                      : '$0'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-500">Promedio empleados</span>
                  <span className="font-black text-neutral-900 dark:text-white">
                    {tenants.length > 0
                      ? Math.round(kpis.totalEmployees / tenants.length).toLocaleString('es-MX')
                      : 0}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-500">Facturas por empresa</span>
                  <span className="font-black text-neutral-900 dark:text-white">
                    {tenants.length > 0
                      ? Math.round(kpis.totalInvoices / tenants.length).toLocaleString('es-MX')
                      : 0}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal ─────────────────────────────────────────────── */}
      <AddTenantModal
        open={showAddModal}
        orgId={orgId}
        onClose={() => setShowAddModal(false)}
        onAdded={handleAdded}
      />
    </div>
  );
}
