'use client';

/**
 * CIFRA — BI & Analytics Dashboard
 * ======================================
 * FASE 28: KPIs reales desde API routes dedicadas.
 * FASE 50: Fiscal ISR/IVA, Margen Bruto, Flujo de Caja, PDF ejecutivo, Export Sheets.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, TrendingUp, TrendingDown, RefreshCw, Loader2,
  DollarSign, ShoppingCart, Users, Target, Package,
  AlertTriangle, Download, ChevronDown, FileText, Receipt,
  TrendingUp as ChartUp, Waves,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
  PieChart, Pie, ComposedChart, Line,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface KpisData {
  mrr: number;
  facturadoMes: number;
  facturadoMesAnterior: number;
  momPct: number;
  posVentasMes: number;
  empleadosActivos: number;
  dealsAbiertos: number;
  dealsGanados: number;
}

interface MonthlyIO {
  mes: string;
  ingresos: number;
  egresos: number;
}

interface TopProduct {
  productId: string;
  name: string;
  sku: string | null;
  unitsSold: number;
  revenue: number;
}

interface FunnelStage {
  stage: string;
  count: number;
  value: number;
  color: string;
  isWon: boolean;
  isLost: boolean;
}

interface AgingBucket {
  bucket: string;
  count: number;
  monto: number;
}

interface FiscalRow {
  mes: string;
  isr: number;
  imss: number;
  ivaTrasl: number;
  ivaAcred: number;
  ivaNeto: number;
}

interface FiscalData {
  rows: FiscalRow[];
  totales: {
    totalIsr: number;
    totalImss: number;
    totalIvaTrasl: number;
    totalIvaAcred: number;
    totalIvaNeto: number;
  };
}

interface MargenRow {
  mes: string;
  revenue: number;
  cogs: number;
  margen: number;
  margenPct: number;
  hasCost: boolean;
}

interface MargenData {
  rows: MargenRow[];
  totales: {
    totalRevenue: number;
    totalCogs: number;
    totalMargen: number;
    totalMargenPct: number;
    hasCostData: boolean;
  };
}

interface FlujoCajaRow {
  label: string;
  ingresos: number;
  egresos: number;
  neto: number;
  saldo: number;
  tipo: 'real' | 'proyeccion';
}

interface FlujoCajaData {
  historico: FlujoCajaRow[];
  proyeccion: FlujoCajaRow[];
  promedioSemanal: { ingresos: number; egresos: number; neto: number };
  saldoActual: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
}
function fmtShort(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return fmt(n);
}

const PERIOD_OPTIONS = [
  { label: '3 meses', value: 3 },
  { label: '6 meses', value: 6 },
  { label: '12 meses', value: 12 },
  { label: 'Año actual', value: new Date().getMonth() + 1 },
];

const EMPTY_KPIS: KpisData = {
  mrr: 0, facturadoMes: 0, facturadoMesAnterior: 0, momPct: 0,
  posVentasMes: 0, empleadosActivos: 0, dealsAbiertos: 0, dealsGanados: 0,
};

const AGING_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#7f1d1d'];

// ─── Component ────────────────────────────────────────────────────────────────

export default function BiPage() {
  const [tab, setTab] = useState<'overview' | 'productos' | 'pipeline' | 'cobranza' | 'fiscal' | 'margen' | 'flujo'>('overview');
  const [months, setMonths] = useState(6);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const [kpis, setKpis] = useState<KpisData>(EMPTY_KPIS);
  const [monthly, setMonthly] = useState<MonthlyIO[]>([]);
  const [products, setProducts] = useState<TopProduct[]>([]);
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);
  const [aging, setAging] = useState<AgingBucket[]>([]);
  const [fiscal, setFiscal] = useState<FiscalData | null>(null);
  const [margen, setMargen] = useState<MargenData | null>(null);
  const [flujo, setFlujo] = useState<FlujoCajaData | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [kpisRes, ioRes, prodRes, funnelRes, agingRes, fiscalRes, margenRes, flujoRes] = await Promise.all([
        fetch('/api/bi/kpis').then(r => r.json()),
        fetch(`/api/bi/ingresos-egresos?months=${months}`).then(r => r.json()),
        fetch(`/api/bi/top-productos?months=${months}&limit=8`).then(r => r.json()),
        fetch('/api/bi/funnel-crm').then(r => r.json()),
        fetch('/api/bi/cobranza-aging').then(r => r.json()),
        fetch(`/api/bi/fiscal?months=${months}`).then(r => r.json()),
        fetch(`/api/bi/margen-bruto?months=${months}`).then(r => r.json()),
        fetch('/api/bi/flujo-caja').then(r => r.json()),
      ]);
      setKpis(kpisRes);
      setMonthly(ioRes);
      setProducts(prodRes);
      setFunnel(funnelRes);
      setAging(agingRes);
      setFiscal(fiscalRes);
      setMargen(margenRes);
      setFlujo(flujoRes);
    } catch (e) {
      console.error('[BI] Error loading data:', e);
    } finally {
      setLoading(false);
    }
  }, [months]);

  useEffect(() => { load(); }, [load]);

  const mesActual = new Date().toLocaleString('es-MX', { month: 'long', year: 'numeric' });
  const MoMIcon = kpis.momPct >= 0 ? TrendingUp : TrendingDown;
  const MoMColor = kpis.momPct >= 0 ? 'text-emerald-500' : 'text-red-500';

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch(`/api/bi/export-excel?months=${months}`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bi-report-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('[BI] Export error:', e);
    } finally {
      setExporting(false);
    }
  }

  async function handleExportPdf() {
    setExportingPdf(true);
    try {
      const res = await fetch('/api/reports/ejecutivo-mensual');
      if (!res.ok) throw new Error('PDF failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ReporteEjecutivo_${new Date().toISOString().slice(0, 7)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('[BI] PDF error:', e);
    } finally {
      setExportingPdf(false);
    }
  }

  // Combinar historico + proyeccion para la gráfica de flujo de caja
  const flujoCombinado = flujo
    ? [
        ...flujo.historico.map(r => ({ ...r, saldoReal: r.saldo, saldoProy: null as number | null })),
        ...flujo.proyeccion.map(r => ({ ...r, saldoReal: null as number | null, saldoProy: r.saldo })),
      ]
    : [];

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
          <div className="flex items-center gap-3 flex-wrap">
            {/* Period selector */}
            <div className="relative">
              <select
                value={months}
                onChange={e => setMonths(Number(e.target.value))}
                className="appearance-none pl-4 pr-10 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl text-sm cursor-pointer hover:bg-neutral-50 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PERIOD_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
            </div>

            {/* PDF Ejecutivo */}
            <button
              onClick={handleExportPdf}
              disabled={loading || exportingPdf}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 font-bold rounded-xl hover:bg-red-100 transition-all text-sm disabled:opacity-50"
            >
              {exportingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              PDF
            </button>

            {/* Export CSV / Sheets */}
            <button
              onClick={handleExport}
              disabled={loading || exporting}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-bold rounded-xl hover:bg-emerald-100 transition-all text-sm disabled:opacity-50"
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Excel / Sheets
            </button>

            {/* Refresh */}
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl hover:bg-neutral-200 transition-all text-sm disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>
        </header>

        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[0,1,2,3].map(i => (
                <div key={i} className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 animate-pulse h-28" />
              ))}
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 animate-pulse h-72" />
          </div>
        ) : (
          <>
            {/* ── KPI CARDS ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

              <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 border-l-4 border-l-blue-500">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Facturación Mes</p>
                  <DollarSign className="h-5 w-5 text-blue-500/40" />
                </div>
                <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{fmt(kpis.facturadoMes)}</p>
                <div className={`flex items-center gap-1 mt-1 text-xs font-bold ${MoMColor}`}>
                  <MoMIcon className="h-3 w-3" />
                  {Math.abs(kpis.momPct).toFixed(1)}% vs mes anterior
                </div>
              </div>

              <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 border-l-4 border-l-emerald-500">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Ventas POS Mes</p>
                  <ShoppingCart className="h-5 w-5 text-emerald-500/40" />
                </div>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{fmt(kpis.posVentasMes)}</p>
                <p className="text-xs text-neutral-400 mt-1">Ingresos combinados: {fmt(kpis.facturadoMes + kpis.posVentasMes)}</p>
              </div>

              <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 border-l-4 border-l-purple-500">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Empleados Activos</p>
                  <Users className="h-5 w-5 text-purple-500/40" />
                </div>
                <p className="text-2xl font-black text-purple-600 dark:text-purple-400">{kpis.empleadosActivos}</p>
                <p className="text-xs text-neutral-400 mt-1">Nómina activa</p>
              </div>

              <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 border-l-4 border-l-amber-500">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Deals CRM</p>
                  <Target className="h-5 w-5 text-amber-500/40" />
                </div>
                <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{kpis.dealsAbiertos}</p>
                <p className="text-xs text-emerald-500 font-bold mt-1">{kpis.dealsGanados} ganados</p>
              </div>
            </div>

            {/* ── TABS ── */}
            <div className="flex overflow-x-auto gap-2 pb-1">
              {[
                { id: 'overview',  label: 'Ingresos/Egresos', icon: TrendingUp },
                { id: 'fiscal',    label: 'Fiscal ISR/IVA',   icon: Receipt },
                { id: 'margen',    label: 'Margen Bruto',     icon: ChartUp },
                { id: 'flujo',     label: 'Flujo de Caja',    icon: Waves },
                { id: 'productos', label: 'Top Productos',    icon: Package },
                { id: 'pipeline',  label: 'Funnel CRM',       icon: Target },
                { id: 'cobranza',  label: 'Aging Cobranza',   icon: AlertTriangle },
              ].map(t => (
                <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                    tab === t.id
                      ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                      : 'bg-white dark:bg-neutral-900 text-neutral-500 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                  }`}>
                  <t.icon className="h-4 w-4" /> {t.label}
                </button>
              ))}
            </div>

            {/* ── TAB CONTENT ── */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm p-6">

              {/* INGRESOS / EGRESOS */}
              {tab === 'overview' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white">
                    Ingresos vs Egresos — últimos {months} meses
                  </h2>
                  {monthly.length === 0 || monthly.every(m => m.ingresos === 0 && m.egresos === 0) ? (
                    <div className="text-center py-12">
                      <BarChart3 className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                      <p className="text-neutral-500 font-medium">Sin pólizas contables en este período</p>
                      <p className="text-neutral-400 text-sm mt-1">Emite facturas o cierra corridas de nómina para ver datos</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={monthly}>
                        <defs>
                          <linearGradient id="gIngresos" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gEgresos" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#71717a' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#71717a' }} tickFormatter={fmtShort} />
                        <Tooltip formatter={(v: number) => fmt(v)} />
                        <Legend />
                        <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#3b82f6" fill="url(#gIngresos)" strokeWidth={2} />
                        <Area type="monotone" dataKey="egresos" name="Egresos" stroke="#ef4444" fill="url(#gEgresos)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}

              {/* ── FISCAL ISR / IVA ── */}
              {tab === 'fiscal' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white">
                    Reporte Fiscal — últimos {months} meses
                  </h2>

                  {/* Totales fiscales */}
                  {fiscal && (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {[
                          { label: 'ISR Acumulado',     value: fiscal.totales.totalIsr,      color: 'border-l-amber-500',  text: 'text-amber-600 dark:text-amber-400' },
                          { label: 'IMSS Acumulado',    value: fiscal.totales.totalImss,     color: 'border-l-purple-500', text: 'text-purple-600 dark:text-purple-400' },
                          { label: 'IVA Trasladado',    value: fiscal.totales.totalIvaTrasl, color: 'border-l-blue-500',   text: 'text-blue-600 dark:text-blue-400' },
                          { label: 'IVA Acreditable',   value: fiscal.totales.totalIvaAcred, color: 'border-l-emerald-500',text: 'text-emerald-600 dark:text-emerald-400' },
                          { label: 'IVA a Pagar (neto)',value: fiscal.totales.totalIvaNeto,  color: 'border-l-red-500',    text: 'text-red-600 dark:text-red-400' },
                        ].map(k => (
                          <div key={k.label} className={`bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700 border-l-4 ${k.color}`}>
                            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">{k.label}</p>
                            <p className={`text-lg font-black ${k.text}`}>{fmt(k.value)}</p>
                          </div>
                        ))}
                      </div>

                      {/* Gráfica ISR vs IVA por mes */}
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={fiscal.rows} barGap={4}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                          <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#71717a' }} />
                          <YAxis tick={{ fontSize: 11, fill: '#71717a' }} tickFormatter={fmtShort} />
                          <Tooltip formatter={(v: number) => fmt(v)} />
                          <Legend />
                          <Bar dataKey="isr"      name="ISR"           fill="#f59e0b" radius={[3,3,0,0]} />
                          <Bar dataKey="imss"     name="IMSS"          fill="#8b5cf6" radius={[3,3,0,0]} />
                          <Bar dataKey="ivaTrasl" name="IVA Trasladado" fill="#3b82f6" radius={[3,3,0,0]} />
                          <Bar dataKey="ivaNeto"  name="IVA Neto Pagar" fill="#ef4444" radius={[3,3,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>

                      {/* Tabla detalle */}
                      <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-2xl">
                        <table className="min-w-full text-sm">
                          <thead className="bg-neutral-50 dark:bg-black/50 text-[10px] uppercase text-neutral-500 tracking-widest font-black border-b border-neutral-200 dark:border-neutral-800">
                            <tr>
                              <th className="p-3 text-left">Mes</th>
                              <th className="p-3 text-right">ISR</th>
                              <th className="p-3 text-right">IMSS</th>
                              <th className="p-3 text-right">IVA Trasladado</th>
                              <th className="p-3 text-right">IVA Acreditable</th>
                              <th className="p-3 text-right">IVA Neto</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                            {fiscal.rows.map((r, i) => (
                              <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                                <td className="p-3 font-bold text-neutral-900 dark:text-white">{r.mes}</td>
                                <td className="p-3 text-right font-mono text-amber-600">{fmt(r.isr)}</td>
                                <td className="p-3 text-right font-mono text-purple-600">{fmt(r.imss)}</td>
                                <td className="p-3 text-right font-mono text-blue-600">{fmt(r.ivaTrasl)}</td>
                                <td className="p-3 text-right font-mono text-emerald-600">{fmt(r.ivaAcred)}</td>
                                <td className="p-3 text-right font-mono font-black text-red-600">{fmt(r.ivaNeto)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="border-t-2 border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-black/30">
                            <tr>
                              <td className="p-3 font-black text-xs uppercase text-neutral-500">Total</td>
                              <td className="p-3 text-right font-black font-mono text-amber-600">{fmt(fiscal.totales.totalIsr)}</td>
                              <td className="p-3 text-right font-black font-mono text-purple-600">{fmt(fiscal.totales.totalImss)}</td>
                              <td className="p-3 text-right font-black font-mono text-blue-600">{fmt(fiscal.totales.totalIvaTrasl)}</td>
                              <td className="p-3 text-right font-black font-mono text-emerald-600">{fmt(fiscal.totales.totalIvaAcred)}</td>
                              <td className="p-3 text-right font-black font-mono text-red-600">{fmt(fiscal.totales.totalIvaNeto)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── MARGEN BRUTO ── */}
              {tab === 'margen' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white">
                    Costo de Ventas y Margen Bruto — últimos {months} meses
                  </h2>

                  {margen && (
                    <>
                      {!margen.totales.hasCostData && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-sm text-amber-700 dark:text-amber-400">
                          Sin costo definido en productos POS. Configura el campo &quot;Costo&quot; en cada producto para ver el margen real.
                        </div>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: 'Revenue Total',  value: margen.totales.totalRevenue, color: 'border-l-blue-500',   text: 'text-blue-600 dark:text-blue-400' },
                          { label: 'Costo de Ventas',value: margen.totales.totalCogs,    color: 'border-l-red-500',    text: 'text-red-600 dark:text-red-400' },
                          { label: 'Margen Bruto',   value: margen.totales.totalMargen,  color: 'border-l-emerald-500',text: 'text-emerald-600 dark:text-emerald-400' },
                          { label: 'Margen %',       value: margen.totales.totalMargenPct, color: 'border-l-purple-500', text: 'text-purple-600 dark:text-purple-400', isPct: true },
                        ].map(k => (
                          <div key={k.label} className={`bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700 border-l-4 ${k.color}`}>
                            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">{k.label}</p>
                            <p className={`text-lg font-black ${k.text}`}>
                              {'isPct' in k && k.isPct ? `${k.value}%` : fmt(k.value)}
                            </p>
                          </div>
                        ))}
                      </div>

                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={margen.rows} barGap={4}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                          <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#71717a' }} />
                          <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#71717a' }} tickFormatter={fmtShort} />
                          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#71717a' }} tickFormatter={v => `${v}%`} domain={[0, 100]} />
                          <Tooltip formatter={(v: number, name: string) => name === 'Margen %' ? `${v}%` : fmt(v)} />
                          <Legend />
                          <Bar yAxisId="left" dataKey="revenue" name="Revenue"     fill="#3b82f6" radius={[3,3,0,0]} />
                          <Bar yAxisId="left" dataKey="cogs"    name="Costo Ventas" fill="#ef4444" radius={[3,3,0,0]} />
                          <Bar yAxisId="left" dataKey="margen"  name="Margen Bruto" fill="#10b981" radius={[3,3,0,0]} />
                          <Line yAxisId="right" type="monotone" dataKey="margenPct" name="Margen %" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                        </BarChart>
                      </ResponsiveContainer>

                      <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-2xl">
                        <table className="min-w-full text-sm">
                          <thead className="bg-neutral-50 dark:bg-black/50 text-[10px] uppercase text-neutral-500 tracking-widest font-black border-b border-neutral-200 dark:border-neutral-800">
                            <tr>
                              <th className="p-3 text-left">Mes</th>
                              <th className="p-3 text-right">Revenue</th>
                              <th className="p-3 text-right">Costo Ventas</th>
                              <th className="p-3 text-right">Margen Bruto</th>
                              <th className="p-3 text-right">Margen %</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                            {margen.rows.map((r, i) => (
                              <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                                <td className="p-3 font-bold text-neutral-900 dark:text-white">{r.mes}</td>
                                <td className="p-3 text-right font-mono text-blue-600">{fmt(r.revenue)}</td>
                                <td className="p-3 text-right font-mono text-red-600">{fmt(r.cogs)}</td>
                                <td className="p-3 text-right font-mono text-emerald-600 font-black">{fmt(r.margen)}</td>
                                <td className="p-3 text-right font-black text-purple-600">{r.margenPct}%</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="border-t-2 border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-black/30">
                            <tr>
                              <td className="p-3 font-black text-xs uppercase text-neutral-500">Total</td>
                              <td className="p-3 text-right font-black font-mono text-blue-600">{fmt(margen.totales.totalRevenue)}</td>
                              <td className="p-3 text-right font-black font-mono text-red-600">{fmt(margen.totales.totalCogs)}</td>
                              <td className="p-3 text-right font-black font-mono text-emerald-600">{fmt(margen.totales.totalMargen)}</td>
                              <td className="p-3 text-right font-black text-purple-600">{margen.totales.totalMargenPct}%</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── FLUJO DE CAJA ── */}
              {tab === 'flujo' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-neutral-900 dark:text-white">
                      Flujo de Caja — Histórico + Proyección 90 días
                    </h2>
                    {flujo && (
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <span className="h-3 w-3 rounded-full bg-blue-500 inline-block" />
                          <span className="text-neutral-500 font-medium">Real</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="h-3 w-3 rounded-full bg-violet-400 border-2 border-dashed border-violet-400 inline-block" />
                          <span className="text-neutral-500 font-medium">Proyección</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {flujo && (
                    <>
                      {/* KPIs de flujo */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {[
                          { label: 'Saldo Acumulado Actual', value: flujo.saldoActual, color: flujo.saldoActual >= 0 ? 'border-l-emerald-500' : 'border-l-red-500', text: flujo.saldoActual >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400' },
                          { label: 'Ingreso Semanal Prom.',  value: flujo.promedioSemanal.ingresos, color: 'border-l-blue-500',   text: 'text-blue-600 dark:text-blue-400' },
                          { label: 'Flujo Neto Semanal',    value: flujo.promedioSemanal.neto,     color: flujo.promedioSemanal.neto >= 0 ? 'border-l-emerald-500' : 'border-l-red-500', text: flujo.promedioSemanal.neto >= 0 ? 'text-emerald-600' : 'text-red-600' },
                        ].map(k => (
                          <div key={k.label} className={`bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700 border-l-4 ${k.color}`}>
                            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">{k.label}</p>
                            <p className={`text-xl font-black ${k.text}`}>{fmt(k.value)}</p>
                          </div>
                        ))}
                      </div>

                      {/* Gráfica saldo acumulado */}
                      <div>
                        <p className="text-sm font-bold text-neutral-500 mb-2">Saldo Acumulado Proyectado (semanas)</p>
                        <ResponsiveContainer width="100%" height={280}>
                          <ComposedChart data={flujoCombinado}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                            <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#71717a' }} interval={1} />
                            <YAxis tick={{ fontSize: 11, fill: '#71717a' }} tickFormatter={fmtShort} />
                            <Tooltip formatter={(v: number) => v != null ? fmt(v) : '—'} />
                            <Legend />
                            <Area
                              type="monotone" dataKey="saldoReal" name="Saldo Real"
                              stroke="#3b82f6" fill="#3b82f620" strokeWidth={2} connectNulls={false}
                            />
                            <Area
                              type="monotone" dataKey="saldoProy" name="Saldo Proyectado"
                              stroke="#8b5cf6" fill="#8b5cf620" strokeWidth={2} strokeDasharray="6 3" connectNulls={false}
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Gráfica ingresos vs egresos semanales */}
                      <div>
                        <p className="text-sm font-bold text-neutral-500 mb-2">Ingresos vs Egresos Semanales</p>
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={flujoCombinado}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                            <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#71717a' }} interval={1} />
                            <YAxis tick={{ fontSize: 11, fill: '#71717a' }} tickFormatter={fmtShort} />
                            <Tooltip formatter={(v: number) => fmt(v)} />
                            <Legend />
                            <Bar dataKey="ingresos" name="Ingresos" fill="#3b82f6" radius={[3,3,0,0]}
                              opacity={undefined}
                            />
                            <Bar dataKey="egresos" name="Egresos" fill="#ef4444" radius={[3,3,0,0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <p className="text-xs text-neutral-400 italic">
                        * Proyección basada en promedio de las últimas 12 semanas. Las barras sombreadas representan estimaciones.
                      </p>
                    </>
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
                      <p className="text-neutral-500 font-medium">Sin ventas POS en el período</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {products.map((p, i) => {
                        const maxUnits = products[0]?.unitsSold ?? 1;
                        const pct = (p.unitsSold / maxUnits) * 100;
                        return (
                          <div key={p.productId || i} className="flex items-center gap-4">
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
                                <div className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500" style={{ width: `${pct}%` }} />
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
                    </div>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={funnel} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 11, fill: '#71717a' }} />
                          <YAxis type="category" dataKey="stage" width={110} tick={{ fontSize: 11, fill: '#71717a' }} />
                          <Tooltip formatter={(v: number) => [v, 'Deals']} />
                          <Bar dataKey="count" name="Deals" radius={[0, 4, 4, 0]}>
                            {funnel.map((f, i) => <Cell key={i} fill={f.color} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
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
                            {funnel.map(stage => (
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

              {/* AGING COBRANZA */}
              {tab === 'cobranza' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white">Aging de Cobranza — Facturas Pendientes</h2>
                  {aging.every(a => a.count === 0) ? (
                    <div className="text-center py-12">
                      <AlertTriangle className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                      <p className="text-neutral-500 font-medium">Sin facturas pendientes de cobro</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={aging}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                          <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: '#71717a' }} />
                          <YAxis tick={{ fontSize: 11, fill: '#71717a' }} tickFormatter={fmtShort} />
                          <Tooltip formatter={(v: number) => fmt(v)} />
                          <Bar dataKey="monto" name="Monto" radius={[4, 4, 0, 0]}>
                            {aging.map((_, i) => <Cell key={i} fill={AGING_COLORS[i % AGING_COLORS.length]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>

                      <div className="space-y-3">
                        {aging.map((bucket, i) => (
                          <div key={bucket.bucket}
                            className="flex items-center justify-between p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                            <div className="flex items-center gap-3">
                              <div className="h-4 w-4 rounded-full flex-shrink-0" style={{ backgroundColor: AGING_COLORS[i % AGING_COLORS.length] }} />
                              <div>
                                <p className="font-bold text-sm text-neutral-900 dark:text-white">{bucket.bucket}</p>
                                <p className="text-xs text-neutral-400">{bucket.count} factura{bucket.count !== 1 ? 's' : ''}</p>
                              </div>
                            </div>
                            <p className="font-black text-base text-neutral-900 dark:text-white font-mono">{fmt(bucket.monto)}</p>
                          </div>
                        ))}
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900">
                          <p className="font-black text-sm">TOTAL PENDIENTE</p>
                          <p className="font-black text-lg font-mono">{fmt(aging.reduce((s, a) => s + a.monto, 0))}</p>
                        </div>
                      </div>
                    </div>
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
