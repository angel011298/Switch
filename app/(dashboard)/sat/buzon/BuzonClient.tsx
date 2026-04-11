'use client';

import { useState } from 'react';
import { Download, ShieldCheck, AlertCircle, CheckCircle2, RefreshCw, Loader2, FileText } from 'lucide-react';
import { saveSatCredential, triggerSatDownload } from './actions';

type Credential = { rfc: string; cerFileName: string | null; isValid: boolean; lastDownloadAt: string | null } | null;
type SatDownload = { id: string; uuid: string; tipo: string; total: number; fechaTimbrado: string; direction: string; status: string };

const TIPO_COLORS: Record<string, string> = {
  I: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  E: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
  P: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  N: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
  T: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
};

const TIPO_LABEL: Record<string, string> = { I: 'Ingreso', E: 'Egreso', P: 'Pago', N: 'Nómina', T: 'Traslado' };

export default function BuzonClient({ credential, downloads }: { credential: Credential; downloads: SatDownload[] }) {
  const [rfc, setRfc] = useState(credential?.rfc ?? '');
  const [cerFile, setCerFile] = useState('');
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [msg, setMsg] = useState('');

  async function handleSave() {
    if (!rfc.trim()) return;
    setSaving(true); setMsg('');
    try {
      await saveSatCredential({ rfc: rfc.trim().toUpperCase(), cerFileName: cerFile || 'cer_pendiente.cer' });
      setMsg('✅ Configuración guardada. Sube tu e.firma para activar la descarga.');
    } catch (err) {
      setMsg(`❌ ${err instanceof Error ? err.message : 'Error'}`);
    } finally { setSaving(false); }
  }

  async function handleDownload() {
    setDownloading(true); setMsg('');
    try {
      await triggerSatDownload();
    } catch (err) {
      setMsg(`⚠️ ${err instanceof Error ? err.message : 'Error'}`);
    } finally { setDownloading(false); }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8 space-y-6">
      {/* Header */}
      <header className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-teal-500/10 p-3 rounded-2xl border border-teal-500/20">
            <Download className="h-8 w-8 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">Buzón Tributario SAT</h1>
            <p className="text-neutral-500 text-sm mt-1">Descarga automática de XMLs — Ingresos, Egresos, Nómina y Pagos</p>
          </div>
        </div>
        <button
          onClick={handleDownload}
          disabled={!credential?.isValid || downloading}
          className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl text-sm transition-colors disabled:opacity-40"
        >
          {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Descargar del SAT
        </button>
      </header>

      {msg && (
        <div className={`p-4 rounded-2xl text-sm font-semibold ${msg.startsWith('✅') ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'}`}>
          {msg}
        </div>
      )}

      {/* Credential status */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl">
        <h2 className="font-black text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-teal-500" />
          Conexión con el SAT
        </h2>
        {credential?.isValid ? (
          <div className="flex items-center gap-3 text-sm">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">Conectado como <span className="font-mono font-black">{credential.rfc}</span></span>
            {credential.lastDownloadAt && <span className="text-neutral-400">· Última descarga: {new Date(credential.lastDownloadAt).toLocaleDateString('es-MX')}</span>}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 rounded-2xl border border-amber-200 dark:border-amber-500/20">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-bold text-amber-700 dark:text-amber-400">Configura tu e.firma (FIEL) del SAT</p>
                <p className="text-amber-600 dark:text-amber-500 mt-1">Para descargar automáticamente tus CFDIs del buzón tributario, necesitas registrar tu RFC y subir tu certificado e.firma.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">RFC del Contribuyente</label>
                <input value={rfc} onChange={e => setRfc(e.target.value)} placeholder="XAXX010101000" maxLength={13} className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl px-4 py-2.5 text-sm font-mono uppercase" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Archivo .cer (e.firma)</label>
                <input value={cerFile} onChange={e => setCerFile(e.target.value)} placeholder="mi_efirma.cer (nombre del archivo)" className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl px-4 py-2.5 text-sm" />
              </div>
            </div>
            <button onClick={handleSave} disabled={saving || !rfc.trim()} className="flex items-center gap-2 px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl text-sm transition-colors disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Guardar Configuración
            </button>
          </div>
        )}
      </div>

      {/* Downloads table */}
      {downloads.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-16 flex flex-col items-center gap-4">
          <FileText className="h-12 w-12 text-neutral-300 dark:text-neutral-600" />
          <p className="font-black text-neutral-500">Sin CFDIs descargados aún</p>
          <p className="text-sm text-neutral-400">Configura tu e.firma y descarga los CFDIs del SAT</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden">
          <div className="p-4 border-b border-neutral-100 dark:border-neutral-800">
            <p className="font-black text-neutral-900 dark:text-white">{downloads.length} CFDIs descargados</p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-800/50">
              <tr>
                {['UUID', 'Tipo', 'Total', 'Fecha', 'Dirección', 'Estado'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-black text-neutral-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {downloads.map(d => (
                <tr key={d.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                  <td className="px-4 py-3 font-mono text-xs text-neutral-500">{d.uuid.slice(0, 8)}...</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${TIPO_COLORS[d.tipo] ?? 'bg-neutral-100 text-neutral-600'}`}>{TIPO_LABEL[d.tipo] ?? d.tipo}</span></td>
                  <td className="px-4 py-3 font-semibold text-right text-neutral-900 dark:text-white">${d.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-neutral-500">{new Date(d.fechaTimbrado).toLocaleDateString('es-MX')}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${d.direction === 'EMITIDO' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'}`}>{d.direction}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-400">{d.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
