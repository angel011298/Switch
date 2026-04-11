'use client';

import { useState } from 'react';
import { ClipboardList, RefreshCw, Download, Loader2, CheckCircle2, FileText } from 'lucide-react';
import { generateDiot, getDiotRecords, exportDiotTxt } from './actions';

type DiotRecord = {
  id: string; rfcProveedor: string; nombreProveedor: string | null;
  montoTotalPagos: any; ivaAcreditable: any; status: string; period: string;
};

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function periodLabel(p: string) {
  const [y, m] = p.split('-');
  return `${MONTHS[parseInt(m) - 1]} ${y}`;
}

export default function DiotClient({ initialRecords, currentPeriod }: { initialRecords: DiotRecord[]; currentPeriod: string }) {
  const [records, setRecords] = useState(initialRecords);
  const [period, setPeriod] = useState(currentPeriod);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [msg, setMsg] = useState('');

  async function handleGenerate() {
    setLoading(true); setMsg('');
    try {
      const result = await generateDiot(period);
      const refreshed = await getDiotRecords(period);
      setRecords(refreshed);
      setMsg(`✅ DIOT generada: ${result.providers} proveedores para ${periodLabel(period)}`);
    } catch (err) {
      setMsg(`❌ ${err instanceof Error ? err.message : 'Error al generar'}`);
    } finally { setLoading(false); }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const txt = await exportDiotTxt(period);
      const blob = new Blob([txt], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `DIOT_${period}.txt`;
      a.click(); URL.revokeObjectURL(url);
    } catch (err) {
      setMsg(`❌ ${err instanceof Error ? err.message : 'Error al exportar'}`);
    } finally { setExporting(false); }
  }

  async function handlePeriodChange(p: string) {
    setPeriod(p); setMsg('');
    setLoading(true);
    try {
      const refreshed = await getDiotRecords(p);
      setRecords(refreshed);
    } finally { setLoading(false); }
  }

  const totalPagos = records.reduce((s, r) => s + parseFloat(r.montoTotalPagos), 0);
  const totalIva = records.reduce((s, r) => s + parseFloat(r.ivaAcreditable), 0);

  // Build period options (last 12 months)
  const periodOptions: string[] = [];
  const d = new Date();
  for (let i = 0; i < 12; i++) {
    periodOptions.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    d.setMonth(d.getMonth() - 1);
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8 space-y-6">
      {/* Header */}
      <header className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-teal-500/10 p-3 rounded-2xl border border-teal-500/20">
            <ClipboardList className="h-8 w-8 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">DIOT Automática</h1>
            <p className="text-neutral-500 text-sm mt-1">Declaración Informativa de Operaciones con Terceros — Art. 32 fracc. VIII LIVA</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={e => handlePeriodChange(e.target.value)}
            className="border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl px-3 py-2 text-sm font-semibold"
          >
            {periodOptions.map(p => <option key={p} value={p}>{periodLabel(p)}</option>)}
          </select>
          <button onClick={handleGenerate} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl text-sm transition-colors disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Generar DIOT
          </button>
          {records.length > 0 && (
            <button onClick={handleExport} disabled={exporting} className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 font-black rounded-xl text-sm transition-colors disabled:opacity-50">
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Descargar TXT
            </button>
          )}
        </div>
      </header>

      {msg && (
        <div className={`p-4 rounded-2xl text-sm font-semibold ${msg.startsWith('✅') ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20'}`}>
          {msg}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800">
          <p className="text-xs font-black text-neutral-500 uppercase tracking-widest">Proveedores</p>
          <p className="text-3xl font-black text-neutral-900 dark:text-white mt-1">{records.length}</p>
          <p className="text-xs text-neutral-400 mt-1">Para {periodLabel(period)}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800">
          <p className="text-xs font-black text-neutral-500 uppercase tracking-widest">Total Pagos</p>
          <p className="text-3xl font-black text-neutral-900 dark:text-white mt-1">${totalPagos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800">
          <p className="text-xs font-black text-neutral-500 uppercase tracking-widest">IVA Acreditable</p>
          <p className="text-3xl font-black text-teal-600 dark:text-teal-400 mt-1">${totalIva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Table */}
      {records.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-16 flex flex-col items-center gap-4">
          <FileText className="h-12 w-12 text-neutral-300 dark:text-neutral-600" />
          <p className="font-black text-neutral-500">Sin datos para {periodLabel(period)}</p>
          <p className="text-sm text-neutral-400">Haz clic en "Generar DIOT" para procesar los CFDIs del periodo</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden">
          <div className="p-4 border-b border-neutral-100 dark:border-neutral-800">
            <p className="font-black text-neutral-900 dark:text-white">Operaciones con Terceros — {periodLabel(period)}</p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-800/50">
              <tr>
                {['RFC Proveedor', 'Nombre', 'Total Pagos', 'IVA Acreditable', 'Estado'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-black text-neutral-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                  <td className="px-4 py-3 font-mono text-xs text-neutral-700 dark:text-neutral-300">{r.rfcProveedor}</td>
                  <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{r.nombreProveedor ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-semibold text-neutral-900 dark:text-white">${parseFloat(r.montoTotalPagos).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-right font-semibold text-teal-600 dark:text-teal-400">${parseFloat(r.ivaAcreditable).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${r.status === 'READY' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'}`}>
                      {r.status === 'READY' && <CheckCircle2 className="h-3 w-3" />}
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
