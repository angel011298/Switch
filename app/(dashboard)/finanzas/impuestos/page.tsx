'use client';

/**
 * Switch OS — Centro de Impuestos
 * =================================
 * FASE 16: IVA/ISR desde Prisma (Invoice + Account).
 * Migrado de tablas legacy Supabase → Prisma puro.
 */

import { useState, useEffect, useTransition } from 'react';
import {
  AlertTriangle, BarChart2, PiggyBank, TrendingUp,
  Loader2, Landmark, RefreshCw, ShieldAlert,
  CheckCircle2, Calendar, FileSpreadsheet, Archive,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { getImpuestosData, type ImpuestosData } from '../actions';

// ─── helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 });
}

const EMPTY: ImpuestosData = {
  ivaTrasladado: 0, ivaAcreditable: 0, ivaAPagar: 0,
  ingresosMes: 0, gastosMes: 0, utilidadBruta: 0, isrProvisional: 0,
  historico: [],
};

// ─── Componente ───────────────────────────────────────────────────────────────

export default function ImpuestosCompliancePage() {
  const [activeTab, setActiveTab] = useState<'proyeccion' | 'compliance' | 'reportes'>('proyeccion');
  const [data, setData] = useState<ImpuestosData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  function cargar() {
    setLoading(true);
    startTransition(async () => {
      try {
        const result = await getImpuestosData();
        setData(result);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    });
  }

  useEffect(() => { cargar(); }, []);

  const mesActual = new Date().toLocaleString('es-MX', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8 transition-colors">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* ── HEADER ── */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20">
              <Landmark className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">Centro de Impuestos</h1>
              <p className="text-neutral-500 font-medium text-sm mt-1 capitalize">
                Proyección fiscal — {mesActual}
              </p>
            </div>
          </div>
          <button
            onClick={cargar}
            disabled={loading || isPending}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all text-sm disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${(loading || isPending) ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </header>

        {/* ── KPI CARDS ── */}
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* IVA Trasladado */}
              <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 border-l-4 border-l-blue-500">
                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">IVA Trasladado</p>
                <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{fmt(data.ivaTrasladado)}</p>
                <p className="text-[10px] text-neutral-400 mt-1">Facturas emitidas del mes</p>
              </div>
              {/* IVA Acreditable */}
              <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 border-l-4 border-l-emerald-500">
                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">IVA Acreditable</p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{fmt(data.ivaAcreditable)}</p>
                <p className="text-[10px] text-neutral-400 mt-1">Gastos deducibles (cta. 110.xx)</p>
              </div>
              {/* IVA a Pagar */}
              <div className={`p-5 rounded-2xl border border-l-4 ${
                data.ivaAPagar > 0
                  ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 border-l-red-500'
                  : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 border-l-emerald-500'
              }`}>
                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">IVA a Enterar</p>
                <p className={`text-2xl font-black mt-1 ${data.ivaAPagar > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {fmt(data.ivaAPagar)}
                </p>
                <p className="text-[10px] text-neutral-400 mt-1">Trasladado − Acreditable</p>
              </div>
              {/* ISR Provisional */}
              <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 border-l-4 border-l-amber-500">
                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">ISR Provisional</p>
                <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{fmt(data.isrProvisional)}</p>
                <p className="text-[10px] text-neutral-400 mt-1">Utilidad × 30% ÷ 12</p>
              </div>
            </div>

            {/* ── TABS ── */}
            <div className="flex overflow-x-auto border-b border-neutral-200 dark:border-neutral-800 pb-2 gap-2">
              {[
                { id: 'proyeccion', label: 'Proyección Fiscal', icon: BarChart2 },
                { id: 'compliance', label: 'Semáforo Fiscal',   icon: ShieldAlert },
                { id: 'reportes',  label: 'Reportes SAT',       icon: FileSpreadsheet },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                      : 'bg-white dark:bg-neutral-900 text-neutral-500 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                  }`}
                >
                  <tab.icon className="h-4 w-4" /> {tab.label}
                </button>
              ))}
            </div>

            {/* ── CONTENIDO ── */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm p-6">

              {/* PROYECCIÓN */}
              {activeTab === 'proyeccion' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-neutral-50 dark:bg-black rounded-2xl p-4 border border-neutral-100 dark:border-neutral-800">
                      <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Ingresos Netos</p>
                      <p className="text-2xl font-black text-neutral-900 dark:text-white mt-1">{fmt(data.ingresosMes)}</p>
                    </div>
                    <div className="bg-neutral-50 dark:bg-black rounded-2xl p-4 border border-neutral-100 dark:border-neutral-800">
                      <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Gastos Deducibles</p>
                      <p className="text-2xl font-black text-neutral-900 dark:text-white mt-1">{fmt(data.gastosMes)}</p>
                    </div>
                    <div className="bg-neutral-50 dark:bg-black rounded-2xl p-4 border border-neutral-100 dark:border-neutral-800">
                      <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Utilidad Bruta</p>
                      <p className={`text-2xl font-black mt-1 ${data.utilidadBruta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {fmt(data.utilidadBruta)}
                      </p>
                    </div>
                  </div>

                  {/* Gráfica histórico */}
                  {data.historico.length > 0 && (
                    <div>
                      <h3 className="text-sm font-black text-neutral-700 dark:text-neutral-300 mb-4">Tendencia últimos 6 meses</h3>
                      <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={data.historico}>
                          <defs>
                            <linearGradient id="gIngresos" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gGastos" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                          <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#71717a' }} />
                          <YAxis tick={{ fontSize: 11, fill: '#71717a' }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                          <Tooltip formatter={(v: number) => fmt(v)} />
                          <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#10b981" fill="url(#gIngresos)" strokeWidth={2} />
                          <Area type="monotone" dataKey="gastos"   name="Gastos"   stroke="#f59e0b" fill="url(#gGastos)"   strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {data.historico.length === 0 && (
                    <div className="text-center py-12">
                      <BarChart2 className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                      <p className="text-neutral-500 font-medium">Sin datos históricos aún</p>
                      <p className="text-neutral-400 text-sm mt-1">Emite facturas o registra gastos para ver la proyección</p>
                    </div>
                  )}
                </div>
              )}

              {/* SEMÁFORO FISCAL */}
              {activeTab === 'compliance' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white">Semáforo de Cumplimiento Fiscal</h2>
                  {[
                    {
                      label: 'IVA — Saldo a favor / cargo',
                      ok: data.ivaAPagar <= 0,
                      detail: data.ivaAPagar > 0
                        ? `Debes enterar ${fmt(data.ivaAPagar)} al SAT este mes`
                        : 'Sin saldo a cargo este período',
                    },
                    {
                      label: 'ISR — Pago provisional estimado',
                      ok: data.isrProvisional < data.ingresosMes * 0.1,
                      detail: `ISR provisional estimado: ${fmt(data.isrProvisional)}`,
                    },
                    {
                      label: 'Margen fiscal',
                      ok: data.utilidadBruta > 0,
                      detail: data.utilidadBruta > 0 ? `Utilidad bruta positiva: ${fmt(data.utilidadBruta)}` : 'Pérdida del período',
                    },
                  ].map((item, i) => (
                    <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl border ${
                      item.ok
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-800'
                        : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-800'
                    }`}>
                      {item.ok
                        ? <CheckCircle2 className="h-6 w-6 text-emerald-500 flex-shrink-0" />
                        : <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0" />
                      }
                      <div>
                        <p className={`font-bold text-sm ${item.ok ? 'text-emerald-900 dark:text-emerald-100' : 'text-red-900 dark:text-red-100'}`}>{item.label}</p>
                        <p className={`text-xs mt-0.5 ${item.ok ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* REPORTES SAT */}
              {activeTab === 'reportes' && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="bg-amber-50 dark:bg-amber-500/10 p-6 rounded-full mb-4 border border-amber-100 dark:border-amber-500/20">
                    <Archive className="h-12 w-12 text-amber-500" />
                  </div>
                  <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-2">Reportes SAT</h2>
                  <p className="text-neutral-500 text-sm max-w-md mb-8">
                    Generación de DIOT, Balanza XML Anexo 24 y Declaración Anual.
                    Disponible en FASE 19 (Production Readiness).
                  </p>
                  <div className="flex gap-3">
                    <button disabled className="px-5 py-2 bg-neutral-200 dark:bg-neutral-800 text-neutral-400 font-bold rounded-xl text-sm cursor-not-allowed">DIOT</button>
                    <button disabled className="px-5 py-2 bg-neutral-200 dark:bg-neutral-800 text-neutral-400 font-bold rounded-xl text-sm cursor-not-allowed">Balanza XML</button>
                  </div>
                </div>
              )}

            </div>
          </>
        )}
      </div>
    </div>
  );
}
