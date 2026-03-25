'use client';

/**
 * Switch OS — Dashboard Hub
 * ===========================
 * FASE 12: Migrado de tablas legacy Supabase a Prisma (Invoice + PosOrder + Customer + Employee).
 * Server Actions en ./actions.ts — sin queries directas al cliente.
 */

import { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Wallet,
  Users,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Loader2,
  ShoppingCart,
  Target,
  Zap,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import Link from 'next/link';
import { getDashboardStats, type DashboardStats } from './actions';

function formatoMoneda(valor: number) {
  return valor.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  });
}

export default function DashboardHub() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargarTodo() {
      setLoading(true);
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error('[Dashboard] Error cargando stats:', err);
      } finally {
        setLoading(false);
      }
    }
    cargarTodo();
  }, []);

  const resumen = useMemo(() => {
    if (!stats) return { totalIngresos: 0, totalGastos: 0, utilidad: 0, clientes: 0, empleados: 0 };
    return stats;
  }, [stats]);

  if (loading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
          <p className="text-sm text-neutral-500 font-medium">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Hero */}
      <header>
        <h1 className="text-4xl md:text-5xl font-black text-neutral-950 dark:text-white tracking-tighter leading-tight">
          Un solo movimiento.
          <br />
          <span className="text-emerald-600 italic">Toda tu operación.</span>
        </h1>
        <p className="mt-4 text-base text-neutral-500 dark:text-neutral-400 font-medium max-w-2xl">
          Centro de mando modular donde controlas cada rincón de tu empresa con
          la simplicidad de un interruptor.
        </p>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Utilidad Neta"
          value={formatoMoneda(resumen.utilidad)}
          icon={TrendingUp}
          accent="emerald"
          trend={resumen.utilidad >= 0 ? 'up' : 'down'}
        />
        <KPICard
          label="Clientes Activos"
          value={String(resumen.clientes)}
          icon={Target}
          accent="blue"
          linkHref="/crm"
          linkLabel="Ver CRM"
        />
        <KPICard
          label="Plantilla"
          value={String(resumen.empleados)}
          icon={Users}
          accent="purple"
          linkHref="/rrhh"
          linkLabel="Ver RRHH"
        />
        <div className="bg-neutral-950 dark:bg-white p-6 rounded-2xl shadow-xl">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2 bg-neutral-800 dark:bg-neutral-100 rounded-xl">
              <AlertCircle className="h-5 w-5 text-white dark:text-black" />
            </div>
            <span className="text-[10px] font-black uppercase text-neutral-400 dark:text-neutral-500">
              Deducción
            </span>
          </div>
          <div className="text-2xl font-black text-white dark:text-black">
            {resumen.totalIngresos > 0
              ? ((resumen.totalGastos / resumen.totalIngresos) * 100).toFixed(0)
              : '0'}
            %
          </div>
          <p className="text-xs text-neutral-500 mt-1">Gastos / Ingresos</p>
        </div>
      </div>

      {/* Gráfico + Acciones rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Balance Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl">
          <h2 className="text-lg font-black text-neutral-950 dark:text-white mb-6">
            Balance Financiero
          </h2>
          {resumen.totalIngresos === 0 && resumen.totalGastos === 0 ? (
            <div className="h-[220px] flex flex-col items-center justify-center text-neutral-400 gap-2">
              <Wallet className="h-10 w-10 opacity-30" />
              <p className="text-sm font-medium">Sin datos aún</p>
              <p className="text-xs text-neutral-500">
                Registra ventas en{' '}
                <Link href="/pos" className="text-emerald-600 font-semibold">
                  POS
                </Link>{' '}
                o emite una{' '}
                <Link href="/billing" className="text-emerald-600 font-semibold">
                  factura
                </Link>
              </p>
            </div>
          ) : (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'Ingresos', valor: resumen.totalIngresos },
                    { name: 'Gastos', valor: resumen.totalGastos },
                    { name: 'Utilidad', valor: Math.max(0, resumen.utilidad) },
                  ]}
                >
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(v: number) => formatoMoneda(v)}
                    cursor={{ fill: 'transparent' }}
                  />
                  <Bar dataKey="valor" radius={[10, 10, 10, 10]}>
                    <Cell fill="#10b981" />
                    <Cell fill="#f43f5e" />
                    <Cell fill="#3b82f6" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Acciones Rápidas */}
        <div className="space-y-4">
          <h2 className="text-lg font-black text-neutral-950 dark:text-white">
            Acciones Rápidas
          </h2>
          <QuickAction
            href="/billing"
            icon={FileText}
            label="Emitir CFDI"
            hoverColor="emerald"
          />
          <QuickAction
            href="/pos"
            icon={ShoppingCart}
            label="Abrir Terminal POS"
            hoverColor="pink"
          />
          <QuickAction
            href="/crm"
            icon={Target}
            label="Ver Pipeline CRM"
            hoverColor="purple"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Sub-componentes ────────────────────────────────────

function KPICard({
  label,
  value,
  icon: Icon,
  accent,
  trend,
  linkHref,
  linkLabel,
}: {
  label: string;
  value: string;
  icon: any;
  accent: string;
  trend?: 'up' | 'down';
  linkHref?: string;
  linkLabel?: string;
}) {
  const accentMap: Record<string, { bg: string; text: string }> = {
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600' },
    amber:   { bg: 'bg-amber-50 dark:bg-amber-500/10',   text: 'text-amber-600' },
    blue:    { bg: 'bg-blue-50 dark:bg-blue-500/10',     text: 'text-blue-600' },
    purple:  { bg: 'bg-purple-50 dark:bg-purple-500/10', text: 'text-purple-600' },
  };

  const a = accentMap[accent] || accentMap.emerald;

  return (
    <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800">
      <div className="flex justify-between items-start mb-3">
        <div className={`p-2 rounded-xl ${a.bg}`}>
          <Icon className={`h-5 w-5 ${a.text}`} />
        </div>
        {linkHref ? (
          <Link href={linkHref} className={`text-[10px] font-black uppercase ${a.text} hover:underline`}>
            {linkLabel}
          </Link>
        ) : (
          <span className={`text-[10px] font-black uppercase ${a.text}`}>{label}</span>
        )}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-black text-neutral-950 dark:text-white">{value}</span>
        {trend && (
          <span className={`text-xs font-bold ${trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
            {trend === 'up'
              ? <ArrowUpRight className="h-4 w-4 inline" />
              : <ArrowDownRight className="h-4 w-4 inline" />}
          </span>
        )}
      </div>
      {linkHref && <p className="text-xs text-neutral-500 mt-1">{label}</p>}
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  hoverColor,
}: {
  href: string;
  icon: any;
  label: string;
  hoverColor: string;
}) {
  const hoverMap: Record<string, string> = {
    emerald: 'group-hover:bg-emerald-500',
    pink:    'group-hover:bg-pink-500',
    purple:  'group-hover:bg-purple-500',
    blue:    'group-hover:bg-blue-500',
  };

  return (
    <Link
      href={href}
      className="flex items-center justify-between p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl hover:scale-[1.02] transition-transform group"
    >
      <div className="flex items-center gap-4">
        <div
          className={`p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl ${
            hoverMap[hoverColor] || ''
          } group-hover:text-white transition-colors`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <span className="font-bold text-sm text-neutral-900 dark:text-white">{label}</span>
      </div>
      <Zap className="h-4 w-4 text-neutral-300" />
    </Link>
  );
}
