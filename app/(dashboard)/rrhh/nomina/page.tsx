'use client';

/**
 * CIFRA — Nómina y Administración
 * =====================================
 * FASE 15: Conectado con motor de cálculo real (ISR/IMSS 2026).
 * Permite correr nómina, revisar pre-nómina y cerrar el periodo.
 */

import { useState, useEffect, useTransition } from 'react';
import {
  Calculator, FileDigit, HardDrive, PieChart, Play, RefreshCw,
  ShieldCheck, AlertTriangle, Download, Send, Lock, CheckCircle2,
  XCircle, Search, Server, Activity, Archive, History,
} from 'lucide-react';
import {
  runPayroll,
  getPayrollRun,
  getPayrollHistory,
  closePayrollRun,
  type PayrollRunSummary,
  type PayrollItemRow,
} from './actions';

// ─── Tipos locales ────────────────────────────────────────────────────────────

type ActiveTab = 'calculo' | 'timbrado' | 'activos' | 'reportes';

const MONTHS = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

// ─── Componente ───────────────────────────────────────────────────────────────

export default function NominaAdministracionPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('calculo');
  const [isPending, startTransition] = useTransition();

  // Estado de la corrida actual
  const [currentRun, setCurrentRun] = useState<
    (PayrollRunSummary & { items: PayrollItemRow[] }) | null
  >(null);
  const [history, setHistory] = useState<PayrollRunSummary[]>([]);
  const [loadingRun, setLoadingRun] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selector de periodo
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedType, setSelectedType] = useState<'Q1' | 'Q2' | 'MENSUAL'>('Q1');

  // Búsqueda en tabla
  const [searchQuery, setSearchQuery] = useState('');

  // ── Cargar corrida más reciente al montar ──
  useEffect(() => {
    (async () => {
      setLoadingRun(true);
      try {
        const [run, hist] = await Promise.all([getPayrollRun(), getPayrollHistory()]);
        setCurrentRun(run);
        setHistory(hist);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoadingRun(false);
      }
    })();
  }, []);

  // ── Correr nómina ──
  function handleRunPayroll() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await runPayroll(selectedYear, selectedMonth, selectedType);
        // Recargar la corrida recién creada
        const run = await getPayrollRun();
        const hist = await getPayrollHistory();
        setCurrentRun(run);
        setHistory(hist);
      } catch (e: any) {
        setError(e.message);
      }
    });
  }

  // ── Cerrar periodo ──
  function handleCloseRun() {
    if (!currentRun) return;
    if (!confirm(`¿Cerrar definitivamente la nómina "${currentRun.periodLabel}"? Esta acción no se puede deshacer.`)) return;
    setError(null);
    startTransition(async () => {
      try {
        await closePayrollRun(currentRun.id);
        const run = await getPayrollRun();
        const hist = await getPayrollHistory();
        setCurrentRun(run);
        setHistory(hist);
      } catch (e: any) {
        setError(e.message);
      }
    });
  }

  // ── Filtrar items ──
  const filteredItems = (currentRun?.items ?? []).filter((i) =>
    i.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Métricas del header ──
  const costoTotal = currentRun?.totalBruto ?? 0;
  const netoTotal = currentRun?.totalNeto ?? 0;
  const pendingStamp = currentRun?.status === 'DRAFT' ? (currentRun?.employeeCount ?? 0) : 0;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* ── HEADER ── */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20">
              <Calculator className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">Nómina y Administración</h1>
              <p className="text-neutral-500 font-medium text-sm mt-1">
                ISR 2026 (Anexo 8) · Cuota obrera IMSS · Partida doble automática
              </p>
            </div>
          </div>

          {/* Selector de periodo + botón */}
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white text-sm font-medium px-3 py-2 rounded-xl focus:ring-2 focus:ring-emerald-500"
            >
              {[today.getFullYear() - 1, today.getFullYear()].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white text-sm font-medium px-3 py-2 rounded-xl focus:ring-2 focus:ring-emerald-500"
            >
              {MONTHS.slice(1).map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white text-sm font-medium px-3 py-2 rounded-xl focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Q1">Quincena 1</option>
              <option value="Q2">Quincena 2</option>
              <option value="MENSUAL">Mensual</option>
            </select>
            <button
              onClick={handleRunPayroll}
              disabled={isPending}
              className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black rounded-xl transition-all shadow-lg shadow-emerald-500/20 text-sm"
            >
              {isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {isPending ? 'Procesando...' : 'Correr Nómina'}
            </button>
          </div>
        </header>

        {/* ── ERROR BANNER ── */}
        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl px-5 py-4 flex items-center gap-3">
            <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* ── KPIs ── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Costo Total Nómina</p>
              <p className="text-2xl font-black text-neutral-900 dark:text-white mt-1">
                ${costoTotal.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
              <Calculator className="h-6 w-6 text-neutral-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between border-l-4 border-l-emerald-500">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Neto a Pagar</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                ${netoTotal.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
              <ShieldCheck className="h-6 w-6 text-emerald-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between border-l-4 border-l-blue-500">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Empleados</p>
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                {currentRun?.employeeCount ?? 0}
              </p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
              <FileDigit className="h-6 w-6 text-blue-500" />
            </div>
          </div>

          <div className={`p-5 rounded-2xl border flex items-center justify-between border-l-4 ${
            currentRun?.status === 'CLOSED'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 border-l-emerald-500'
              : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 border-l-amber-500'
          }`}>
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Estado Período</p>
              <p className={`text-lg font-black mt-1 ${
                currentRun?.status === 'CLOSED'
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-amber-700 dark:text-amber-400'
              }`}>
                {currentRun ? (currentRun.status === 'CLOSED' ? 'Cerrado' : 'Borrador') : '—'}
              </p>
              {currentRun && (
                <p className="text-[10px] text-neutral-500 mt-0.5">{currentRun.periodLabel}</p>
              )}
            </div>
            <div className={`p-3 rounded-xl ${
              currentRun?.status === 'CLOSED'
                ? 'bg-emerald-100 dark:bg-emerald-500/20'
                : 'bg-amber-100 dark:bg-amber-500/20'
            }`}>
              {currentRun?.status === 'CLOSED'
                ? <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                : <AlertTriangle className="h-6 w-6 text-amber-500" />
              }
            </div>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="flex overflow-x-auto border-b border-neutral-200 dark:border-neutral-800 pb-2 gap-2">
          {[
            { id: 'calculo',  label: 'Motor de Cálculo',       icon: Calculator },
            { id: 'timbrado', label: 'Timbrado CFDI 4.0',      icon: FileDigit  },
            { id: 'activos',  label: 'Activos Físicos',         icon: HardDrive  },
            { id: 'reportes', label: 'Historial y Reportes',   icon: History    },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'bg-white dark:bg-neutral-900 text-neutral-500 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
              }`}
            >
              <tab.icon className="h-4 w-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* ── CONTENIDO ── */}
        <main className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm min-h-[500px] p-6">

          {/* 1. MOTOR DE CÁLCULO */}
          {activeTab === 'calculo' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white">
                    Pre-Nómina: {currentRun?.periodLabel ?? 'Sin corrida'}
                  </h2>
                  <p className="text-xs text-neutral-500 mt-1">
                    Cálculo automático ISR Anexo 8 · Cuota obrera IMSS 2.40%
                  </p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <Search className="h-4 w-4 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Buscar empleado..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent border-none outline-none text-sm font-medium text-neutral-900 dark:text-white w-40"
                    />
                  </div>
                  {currentRun && currentRun.status === 'DRAFT' && (
                    <button
                      onClick={handleCloseRun}
                      disabled={isPending}
                      className="bg-neutral-950 dark:bg-white text-white dark:text-black font-bold px-4 py-2 rounded-xl text-sm shadow-md transition-transform hover:scale-[1.02] disabled:opacity-50"
                    >
                      Cierre de Periodo
                    </button>
                  )}
                </div>
              </div>

              {loadingRun ? (
                <div className="flex items-center justify-center h-40">
                  <RefreshCw className="h-6 w-6 animate-spin text-emerald-500" />
                </div>
              ) : !currentRun ? (
                <div className="text-center py-16">
                  <Calculator className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                  <p className="text-neutral-500 font-medium">Sin corrida de nómina</p>
                  <p className="text-neutral-400 text-sm mt-1">
                    Selecciona el periodo y haz clic en "Correr Nómina"
                  </p>
                </div>
              ) : (
                <>
                  {/* Totales resumen */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Total Bruto',  value: currentRun.totalBruto,  color: 'text-neutral-900 dark:text-white' },
                      { label: 'Total ISR',    value: currentRun.totalISR,    color: 'text-rose-600 dark:text-rose-400' },
                      { label: 'Total IMSS',   value: currentRun.totalIMSS,   color: 'text-orange-600 dark:text-orange-400' },
                      { label: 'Total Neto',   value: currentRun.totalNeto,   color: 'text-emerald-600 dark:text-emerald-400' },
                    ].map((m) => (
                      <div key={m.label} className="bg-neutral-50 dark:bg-black rounded-2xl p-4 border border-neutral-100 dark:border-neutral-800">
                        <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{m.label}</p>
                        <p className={`text-xl font-black mt-1 ${m.color}`}>
                          ${m.value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Tabla de empleados */}
                  <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-2xl">
                    <table className="min-w-full text-sm text-left whitespace-nowrap">
                      <thead className="bg-neutral-50 dark:bg-black/50 border-b border-neutral-200 dark:border-neutral-800 text-[10px] uppercase text-neutral-500 tracking-widest font-black">
                        <tr>
                          <th className="p-4">Colaborador</th>
                          <th className="p-4 text-right">Salario Bruto</th>
                          <th className="p-4 text-center">Faltas</th>
                          <th className="p-4 text-right text-rose-600">Retención ISR</th>
                          <th className="p-4 text-right text-orange-600">Cuota IMSS</th>
                          <th className="p-4 text-right text-emerald-600 text-xs font-black">Neto a Pagar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                        {filteredItems.map((emp) => (
                          <tr key={emp.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                            <td className="p-4">
                              <p className="font-bold text-neutral-900 dark:text-white">{emp.employeeName}</p>
                              <p className="text-[10px] text-neutral-500 font-mono mt-0.5">{emp.position}</p>
                            </td>
                            <td className="p-4 text-right font-mono font-medium">
                              ${emp.bruto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-4 text-center">
                              {emp.absenceDays > 0 ? (
                                <span className="px-2 py-1 rounded text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
                                  -{emp.absenceDays} día{emp.absenceDays > 1 ? 's' : ''}
                                  {emp.absenceDeduct > 0 && ` (-$${emp.absenceDeduct.toFixed(2)})`}
                                </span>
                              ) : (
                                <span className="px-2 py-1 rounded text-[10px] font-bold bg-neutral-100 text-neutral-500 dark:bg-neutral-800">
                                  0
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-right font-mono text-rose-600 dark:text-rose-400">
                              -${emp.isr.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-4 text-right font-mono text-orange-600 dark:text-orange-400">
                              -${emp.imss.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-4 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 text-base">
                              ${emp.neto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 2. TIMBRADO CFDI 4.0 */}
          {activeTab === 'timbrado' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-center bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 p-5 rounded-2xl gap-4">
                <div className="flex items-start gap-4">
                  <Server className="h-8 w-8 text-blue-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-black text-blue-900 dark:text-blue-100 text-lg">Procesador de Recibos CFDI 4.0</h3>
                    <p className="text-xs text-blue-700 dark:text-blue-400 mt-1 leading-relaxed max-w-xl">
                      El timbrado masivo de nómina requiere CSD vigente y empleados con RFC registrado.
                      Disponible en el siguiente sprint (integración PAC nómina).
                    </p>
                  </div>
                </div>
                <button
                  disabled
                  className="w-full md:w-auto bg-blue-300 dark:bg-blue-900 text-white dark:text-blue-300 font-black px-6 py-3 rounded-xl text-sm opacity-60 cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4" /> Timbrado Masivo (Próximo)
                </button>
              </div>

              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="bg-neutral-100 dark:bg-neutral-800 p-6 rounded-full mb-4">
                  <FileDigit className="h-12 w-12 text-neutral-400" />
                </div>
                <h3 className="font-black text-neutral-700 dark:text-neutral-300 text-lg">CFDI de Nómina (tipo N)</h3>
                <p className="text-neutral-500 text-sm max-w-md mt-2">
                  Esta funcionalidad estará disponible una vez que existan empleados con RFC y CSD registrado.
                  La póliza contable se genera automáticamente al cerrar el período.
                </p>
              </div>
            </div>
          )}

          {/* 3. ACTIVOS FÍSICOS */}
          {activeTab === 'activos' && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="bg-indigo-50 dark:bg-indigo-500/10 p-6 rounded-full mb-4 border border-indigo-100 dark:border-indigo-500/20">
                <HardDrive className="h-12 w-12 text-indigo-500" />
              </div>
              <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-2">Gestión de Activos Físicos</h2>
              <p className="text-neutral-500 text-sm max-w-lg">
                Control de equipos, responsivas digitales y asignación a empleados.
                Disponible en FASE 17 (SCM).
              </p>
            </div>
          )}

          {/* 4. HISTORIAL Y REPORTES */}
          {activeTab === 'reportes' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white">Historial de Nóminas</h2>
                  <p className="text-xs text-neutral-500 mt-1">Todas las corridas de nómina del tenant.</p>
                </div>
              </div>

              {history.length === 0 ? (
                <div className="text-center py-16">
                  <History className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                  <p className="text-neutral-500">Sin historial de nóminas</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-2xl">
                  <table className="min-w-full text-sm text-left whitespace-nowrap">
                    <thead className="bg-neutral-50 dark:bg-black/50 border-b border-neutral-200 dark:border-neutral-800 text-[10px] uppercase text-neutral-500 tracking-widest font-black">
                      <tr>
                        <th className="p-4">Periodo</th>
                        <th className="p-4 text-right">Empleados</th>
                        <th className="p-4 text-right">Total Bruto</th>
                        <th className="p-4 text-right">Total Neto</th>
                        <th className="p-4 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                      {history.map((run) => (
                        <tr key={run.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                          <td className="p-4">
                            <p className="font-bold text-neutral-900 dark:text-white">{run.periodLabel}</p>
                            <p className="text-[10px] text-neutral-500 font-mono mt-0.5">{run.period}</p>
                          </td>
                          <td className="p-4 text-right font-mono">{run.employeeCount}</td>
                          <td className="p-4 text-right font-mono">
                            ${run.totalBruto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            ${run.totalNeto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                              run.status === 'CLOSED'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                            }`}>
                              {run.status === 'CLOSED' ? 'Cerrado' : 'Borrador'}
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

        </main>
      </div>
    </div>
  );
}
