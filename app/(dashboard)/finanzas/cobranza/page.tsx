'use client';

/**
 * Switch OS — Cobranza y Aging CxC
 * ===================================
 * FASE 16: Aging de Cuentas por Cobrar desde Prisma.
 * Migrado de tablas legacy Supabase → Prisma puro.
 */

import { useState, useEffect, useTransition } from 'react';
import {
  TrendingUp, Hourglass, AlertTriangle, Loader2,
  Wallet, FileCheck2, Banknote, Layers, CheckCircle2, RefreshCw,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
} from 'recharts';
import { getCobranzaData, type CobranzaData, type InvoiceAgingRow } from '../actions';

// ─── helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 });
}

const EMPTY: CobranzaData = { cobrado: 0, porCobrar: 0, vencido: 0, repsPendientes: 0, invoices: [] };

// ─── Componente ───────────────────────────────────────────────────────────────

export default function CobranzaPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'facturas' | 'aging'>('dashboard');
  const [data, setData] = useState<CobranzaData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  function cargar() {
    setLoading(true);
    startTransition(async () => {
      try {
        const result = await getCobranzaData();
        setData(result);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    });
  }

  useEffect(() => { cargar(); }, []);

  // Aging buckets
  const aging = {
    corriente:  data.invoices.filter((i) => i.metodoPago === 'PPD' && i.diasVencido <= 0),
    dias30:     data.invoices.filter((i) => i.metodoPago === 'PPD' && i.diasVencido > 0  && i.diasVencido <= 30),
    dias60:     data.invoices.filter((i) => i.metodoPago === 'PPD' && i.diasVencido > 30 && i.diasVencido <= 60),
    dias90plus: data.invoices.filter((i) => i.metodoPago === 'PPD' && i.diasVencido > 60),
  };

  const agingChart = [
    { label: 'Corriente',  value: aging.corriente.reduce((s, i) => s + i.total, 0),  color: '#10b981' },
    { label: '1-30 días',  value: aging.dias30.reduce((s, i) => s + i.total, 0),     color: '#f59e0b' },
    { label: '31-60 días', value: aging.dias60.reduce((s, i) => s + i.total, 0),     color: '#f97316' },
    { label: '+60 días',   value: aging.dias90plus.reduce((s, i) => s + i.total, 0), color: '#ef4444' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8 transition-colors">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* ── HEADER ── */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-blue-500/10 p-3 rounded-2xl border border-blue-500/20">
              <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">Cobranza y CxC</h1>
              <p className="text-neutral-500 font-medium text-sm mt-1">Aging de facturas · PPD · Complementos de pago</p>
            </div>
          </div>
          <button
            onClick={cargar}
            disabled={loading || isPending}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl hover:bg-neutral-200 transition-all text-sm disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${(loading || isPending) ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </header>

        {/* ── KPIs ── */}
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 border-l-4 border-l-emerald-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Cobrado</p>
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{fmt(data.cobrado)}</p>
                    <p className="text-[10px] text-neutral-400 mt-1">Facturas PUE timbradas</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-emerald-500/40" />
                </div>
              </div>
              <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 border-l-4 border-l-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Por Cobrar</p>
                    <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{fmt(data.porCobrar)}</p>
                    <p className="text-[10px] text-neutral-400 mt-1">PPD vigentes</p>
                  </div>
                  <Hourglass className="h-8 w-8 text-blue-500/40" />
                </div>
              </div>
              <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 border-l-4 border-l-red-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Vencido</p>
                    <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">{fmt(data.vencido)}</p>
                    <p className="text-[10px] text-neutral-400 mt-1">PPD &gt;30 días sin REP</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500/40" />
                </div>
              </div>
              <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 border-l-4 border-l-amber-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">REPs Pendientes</p>
                    <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{data.repsPendientes}</p>
                    <p className="text-[10px] text-neutral-400 mt-1">Complementos por generar</p>
                  </div>
                  <FileCheck2 className="h-8 w-8 text-amber-500/40" />
                </div>
              </div>
            </div>

            {/* ── TABS ── */}
            <div className="flex overflow-x-auto border-b border-neutral-200 dark:border-neutral-800 pb-2 gap-2">
              {[
                { id: 'dashboard', label: 'Resumen',         icon: Wallet   },
                { id: 'facturas',  label: 'Facturas Abiertas', icon: Layers   },
                { id: 'aging',     label: 'Aging CxC',        icon: BarChart },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                      : 'bg-white dark:bg-neutral-900 text-neutral-500 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                  }`}
                >
                  <tab.icon className="h-4 w-4" /> {tab.label}
                </button>
              ))}
            </div>

            {/* ── CONTENIDO ── */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm p-6">

              {/* DASHBOARD */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white">Distribución de Cartera</h2>
                  {agingChart.every(b => b.value === 0) ? (
                    <div className="text-center py-12">
                      <Banknote className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                      <p className="text-neutral-500 font-medium">Sin facturas PPD activas</p>
                      <p className="text-neutral-400 text-sm mt-1">Las facturas emitidas con método PPD aparecerán aquí</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={agingChart}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#71717a' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#71717a' }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v: number) => fmt(v)} />
                        <Bar dataKey="value" name="Monto" radius={[4, 4, 0, 0]}
                          fill="#3b82f6"
                          label={{ position: 'top', formatter: (v: number) => v > 0 ? fmt(v) : '', fontSize: 10, fill: '#71717a' }}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}

              {/* FACTURAS ABIERTAS */}
              {activeTab === 'facturas' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white">Facturas con Saldo Abierto (PPD)</h2>
                  {data.invoices.filter(i => i.metodoPago === 'PPD').length === 0 ? (
                    <div className="text-center py-12">
                      <FileCheck2 className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                      <p className="text-neutral-500 font-medium">Sin facturas PPD pendientes</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-2xl">
                      <table className="min-w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-neutral-50 dark:bg-black/50 border-b border-neutral-200 dark:border-neutral-800 text-[10px] uppercase text-neutral-500 tracking-widest font-black">
                          <tr>
                            <th className="p-4">Folio</th>
                            <th className="p-4">Cliente</th>
                            <th className="p-4">Emisión</th>
                            <th className="p-4 text-right">Total</th>
                            <th className="p-4 text-center">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                          {data.invoices.filter(i => i.metodoPago === 'PPD').map((inv) => (
                            <tr key={inv.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                              <td className="p-4 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                                {inv.serie ?? ''}{String(inv.folio).padStart(4, '0')}
                              </td>
                              <td className="p-4">
                                <p className="font-bold text-neutral-900 dark:text-white">{inv.receptorNombre}</p>
                                <p className="text-[10px] text-neutral-500">{inv.receptorRfc}</p>
                              </td>
                              <td className="p-4 text-xs text-neutral-500">
                                {new Date(inv.fechaEmision).toLocaleDateString('es-MX')}
                              </td>
                              <td className="p-4 text-right font-mono font-bold">{fmt(inv.total)}</td>
                              <td className="p-4 text-center">
                                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                                  inv.diasVencido <= 0
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                                    : inv.diasVencido <= 30
                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                                    : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                                }`}>
                                  {inv.diasVencido <= 0
                                    ? 'Vigente'
                                    : `+${inv.diasVencido}d`
                                  }
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* AGING */}
              {activeTab === 'aging' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white">Reporte Aging</h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Corriente', items: aging.corriente, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-800' },
                      { label: '1–30 días', items: aging.dias30,    color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-800' },
                      { label: '31–60 días',items: aging.dias60,    color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-800' },
                      { label: '+60 días',  items: aging.dias90plus,color: 'text-red-600 dark:text-red-400',       bg: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-800' },
                    ].map((bucket) => (
                      <div key={bucket.label} className={`p-4 rounded-2xl border ${bucket.bg}`}>
                        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{bucket.label}</p>
                        <p className={`text-2xl font-black mt-1 ${bucket.color}`}>
                          {fmt(bucket.items.reduce((s, i) => s + i.total, 0))}
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">{bucket.items.length} factura{bucket.items.length !== 1 ? 's' : ''}</p>
                      </div>
                    ))}
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
