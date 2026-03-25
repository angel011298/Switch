'use client';

/**
 * Switch OS — BI & Analytics Dashboard
 * ======================================
 * FASE 18: KPIs y gráficas reales desde Prisma.
 * Revenue (CFDI) + POS + CRM Pipeline + Top Productos.
 */

import { useState, useEffect, useTransition } from 'react';
import {
  BarChart3, TrendingUp, TrendingDown, RefreshCw, Loader2,
  DollarSign, ShoppingCart, Users, Target, Trophy,
  Package, Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
} from 'recharts';
import {
  getBiKpis, getMonthlyRevenue, getTopProducts, getPipelineFunnel,
  type BiKpis, type MonthlyData, type TopProduct, type FunnelStage,
} from './actions';

// ─── helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
}
function fmtShort(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}k`;
  return fmt(n);
}

const EMPTY_KPIS: BiKpis = {
  revenueTotal: 0, revenueThisMonth: 0, revenueLastMonth: 0, revenueMoM: 0,
  posTotal: 0, posThisMonth: 0, posOrdersThisMonth: 0,
  customersTotal: 0, customersNewThisMonth: 0,
  pipelineValue: 0, wonValue: 0,
};

// ─── Componente ───────────────────────────────────────────────────────────────

export default function BiPage() {
  const [tab, setTab] = useState<'overview' | 'productos' | 'pipeline'>('overview');
  const [isPending, startTransition] = useTransition();

  const [kpis,     setKpis]     = useState<BiKpis>(EMPTY_KPIS);
  const [monthly,  setMonthly]  = useState<MonthlyData[]>([]);
  const [products, setProducts] = useState<TopProduct[]>([]);
  const [funnel,   setFunnel]   = useState<FunnelStage[]>([]);
  const [loading,  setLoading]  = useState(true);

  function load() {
    setLoading(true);
    startTransition(async () => {
      try {
        const [k, m, p, f] = await Promise.all([
          getBiKpis(),
          getMonthlyRevenue(6),
          getTopProducts(8),
          getPipelineFunnel(),
        ]);
        setKpis(k);
        setMonthly(m);
        setProducts(p);
        setFunnel(f);
      } finally {
        setLoading(false);
      }
    });
  }

  useEffect(() => { load(); }, []);

  const mesActual = new Date().toLocaleString('es-MX', { month: 'long', year: 'numeric' });
  const MoMIcon  = kpis.revenueMoM >= 0 ? TrendingUp : TrendingDown;
  const MoMColor = kpis.revenueMoM >= 0 ? 'text-emerald-500' : 'text-red-500';

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8 transition-colors">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* ── HEADER ── */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-blue-500/10 p-3 rounded-2xl border border-blue-500/20">
              <BarChart3 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">BI & Analytics</h1>
              <p className="text-neutral-500 font-medium text-sm mt-1 capitalize">{mesActual}</p>
            </div>
          </div>
          <button onClick={load} disabled={loading || isPending}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl hover:bg-neutral-200 transition-all text-sm disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${(loading || isPending) ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </header>

        {/* ── KPIs PRINCIPALES ── */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            {/* Fila 1: Revenue + POS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Revenue este mes */}
              <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 border-l-4 border-l-blue-500">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Facturación Mes</p>
                  <DollarSign className="h-5 w-5 text-blue-500/40" />
                </div>
                <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{fmt(kpis.revenueThisMonth)}</p>
                <div className={`flex items-center gap-1 mt-1 text-xs font-bold ${MoMColor}`}>
                  <MoMIcon className="h-3 w-3" />
                  {Math.abs(kpis.revenueMoM).toFixed(1)}% vs mes anterior
                </div>
              </div>

              {/* POS este mes */}
              <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 border-l-4 border-l-emerald-500">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Ventas POS Mes</p>
                  <ShoppingCart className="h-5 w-5 text-emerald-500/40" />
                </div>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{fmt(kpis.posThisMonth)}</p>
                <p className="text-xs text-neutral-400 mt-1">{kpis.posOrdersThisMonth} tickets</p>
              </div>

              {/* Clientes */}
              <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 border-l-4 border-l-purple-500">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Clientes</p>
                  <Users className="h-5 w-5 text-purple-500/40" />
                </div>
                <p className="text-2xl font-black text-purple-600 dark:text-purple-400">{kpis.customersTotal}</p>
                <p className="text-xs text-neutral-400 mt-1">+{kpis.customersNewThisMonth} este mes</p>
              </div>

              {/* Pipeline */}
              <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 border-l-4 border-l-amber-500">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Pipeline CRM</p>
                  <Target className="h-5 w-5 text-amber-500/40" />
                </div>
                <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{fmt(kpis.pipelineValue)}</p>
                <p className="text-xs text-emerald-500 font-bold mt-1">Ganado: {fmt(kpis.wonValue)}</p>
              </div>
            </div>

            {/* Fila 2: Acumulados */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Facturación Total Histórica</p>
                <p className="text-xl font-black text-neutral-900 dark:text-white mt-1">{fmt(kpis.revenueTotal)}</p>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Ventas POS Total Histórico</p>
                <p className="text-xl font-black text-neutral-900 dark:text-white mt-1">{fmt(kpis.posTotal)}</p>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Ingresos Combinados Mes</p>
                <p className="text-xl font-black text-neutral-900 dark:text-white mt-1">
                  {fmt(kpis.revenueThisMonth + kpis.posThisMonth)}
                </p>
              </div>
            </div>

            {/* ── TABS ── */}
            <div className="flex overflow-x-auto border-b border-neutral-200 dark:border-neutral-800 pb-2 gap-2">
              {[
                { id: 'overview',  label: 'Tendencia',      icon: TrendingUp },
                { id: 'productos', label: 'Top Productos',  icon: Package    },
                { id: 'pipeline',  label: 'Funnel CRM',     icon: Target     },
              ].map((t) => (
                <button key={t.id} onClick={() => setTab(t.id as any)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                    tab === t.id
                      ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                      : 'bg-white dark:bg-neutral-900 text-neutral-500 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                  }`}>
                  <t.icon className="h-4 w-4" /> {t.label}
                </button>
              ))}
            </div>

            {/* ── CONTENIDO TABS ── */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm p-6">

              {/* TENDENCIA MENSUAL */}
              {tab === 'overview' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white">Ingresos últimos 6 meses</h2>
                  {monthly.length === 0 || monthly.every(m => m.total === 0) ? (
                    <div className="text-center py-12">
                      <BarChart3 className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                      <p className="text-neutral-500 font-medium">Sin datos de ingresos aún</p>
                      <p className="text-neutral-400 text-sm mt-1">Emite facturas o registra ventas POS para ver la tendencia</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={monthly}>
                        <defs>
                          <linearGradient id="gFacturas" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}   />
                          </linearGradient>
                          <linearGradient id="gPos" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}   />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#71717a' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#71717a' }} tickFormatter={fmtShort} />
                        <Tooltip formatter={(v: number) => fmt(v)} />
                        <Legend />
                        <Area type="monotone" dataKey="facturas" name="Facturas CFDI" stroke="#3b82f6" fill="url(#gFacturas)" strokeWidth={2} />
                        <Area type="monotone" dataKey="pos"      name="Ventas POS"   stroke="#10b981" fill="url(#gPos)"      strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}

              {/* TOP PRODUCTOS */}
              {tab === 'productos' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white">Top Productos por Unidades Vendidas</h2>
                  {products.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                      <p className="text-neutral-500 font-medium">Sin ventas POS registradas</p>
                      <p className="text-neutral-400 text-sm mt-1">Los productos más vendidos aparecerán aquí</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {products.map((p, i) => {
                        const maxUnits = products[0]?.unitsSold ?? 1;
                        const pct = (p.unitsSold / maxUnits) * 100;
                        return (
                          <div key={p.productId} className="flex items-center gap-4">
                            <span className="text-xs font-black text-neutral-400 w-5">{i + 1}</span>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <div>
                                  <span className="text-sm font-bold text-neutral-900 dark:text-white">{p.name}</span>
                                  {p.sku && <span className="text-[10px] text-neutral-400 ml-2 font-mono">{p.sku}</span>}
                                </div>
                                <div className="text-right">
                                  <span className="text-sm font-black text-neutral-700 dark:text-neutral-300">{p.unitsSold.toLocaleString('es-MX')} uds</span>
                                  <span className="text-[10px] text-neutral-400 ml-2">{fmt(p.revenue)}</span>
                                </div>
                              </div>
                              <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                                <div className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                                  style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* FUNNEL CRM */}
              {tab === 'pipeline' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white">Funnel de Ventas CRM</h2>
                  {funnel.length === 0 || funnel.every(f => f.count === 0) ? (
                    <div className="text-center py-12">
                      <Target className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                      <p className="text-neutral-500 font-medium">Sin oportunidades en el pipeline</p>
                      <p className="text-neutral-400 text-sm mt-1">
                        Ve a <a href="/crm/pipeline" className="text-purple-500 hover:underline">Pipeline CRM</a> para agregar oportunidades
                      </p>
                    </div>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={funnel} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 11, fill: '#71717a' }} tickFormatter={(v) => String(v)} />
                          <YAxis type="category" dataKey="stage" width={100} tick={{ fontSize: 11, fill: '#71717a' }} />
                          <Tooltip formatter={(v: number, name: string) => name === 'count' ? [`${v} deals`, 'Deals'] : [fmt(v), 'Valor']} />
                          <Bar dataKey="count" name="count" radius={[0, 4, 4, 0]}>
                            {funnel.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>

                      {/* Tabla resumen */}
                      <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-2xl">
                        <table className="min-w-full text-sm">
                          <thead className="bg-neutral-50 dark:bg-black/50 text-[10px] uppercase text-neutral-500 tracking-widest font-black border-b border-neutral-200 dark:border-neutral-800">
                            <tr>
                              <th className="p-3 text-left">Etapa</th>
                              <th className="p-3 text-center">Deals</th>
                              <th className="p-3 text-right">Valor</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                            {funnel.map((stage) => (
                              <tr key={stage.stage} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                                <td className="p-3 flex items-center gap-2">
                                  <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: stage.color }} />
                                  <span className="font-medium text-neutral-900 dark:text-white">{stage.stage}</span>
                                </td>
                                <td className="p-3 text-center font-bold">{stage.count}</td>
                                <td className="p-3 text-right font-mono font-bold">{fmt(stage.value)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="border-t-2 border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-black/30">
                            <tr>
                              <td className="p-3 font-black text-xs uppercase text-neutral-500">Total</td>
                              <td className="p-3 text-center font-black">{funnel.reduce((s, f) => s + f.count, 0)}</td>
                              <td className="p-3 text-right font-black font-mono">{fmt(funnel.reduce((s, f) => s + f.value, 0))}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}

            </div>
          </>
        )}
      </div>
    </div>
  );
}
