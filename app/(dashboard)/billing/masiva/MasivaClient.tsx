'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, XCircle, Download, Loader2, BarChart3 } from 'lucide-react';
import { processMasiveUpload, type MasivaBillingRow, type MasivaResult } from './actions';

const TEMPLATE_CSV = `rfcReceptor,nombreReceptor,usoCfdi,concepto,cantidad,precioUnitario,descuento,claveUnidad,claveProducto
XAXX010101000,Público en General,G03,Consultoría de Software,1,5000,0,E48,84111506
VBAE910704RX7,Empresa Ejemplo SA,G01,Soporte Técnico,1,2500,0,E48,81112100`;

function downloadTemplate() {
  const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'plantilla_facturacion_masiva.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function parseCSV(text: string): MasivaBillingRow[] {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ''; });
    return {
      rfcReceptor: row.rfcReceptor,
      nombreReceptor: row.nombreReceptor,
      usoCfdi: row.usoCfdi,
      concepto: row.concepto,
      cantidad: parseFloat(row.cantidad) || 1,
      precioUnitario: parseFloat(row.precioUnitario) || 0,
      descuento: parseFloat(row.descuento) || 0,
      claveUnidad: row.claveUnidad,
      claveProducto: row.claveProducto,
    };
  });
}

export default function MasivaClient() {
  const [rows, setRows] = useState<MasivaBillingRow[]>([]);
  const [results, setResults] = useState<MasivaResult[] | null>(null);
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseCSV(text);
        setRows(parsed);
        setResults(null);
      } catch {
        alert('Error al leer el archivo. Verifica el formato CSV.');
      }
    };
    reader.readAsText(file);
  }

  async function handleProcess() {
    if (!rows.length) return;
    setProcessing(true);
    try {
      const res = await processMasiveUpload(rows);
      setResults(res);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al procesar');
    } finally {
      setProcessing(false);
    }
  }

  const okCount = results?.filter(r => r.status === 'OK').length ?? 0;
  const errCount = results?.filter(r => r.status === 'ERROR').length ?? 0;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <header className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-cyan-500/10 p-3 rounded-2xl border border-cyan-500/20">
              <Upload className="h-8 w-8 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">Facturación Masiva</h1>
              <p className="text-neutral-500 text-sm mt-1">Emite hasta 500 CFDI en un solo proceso desde CSV o Excel</p>
            </div>
          </div>
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-semibold rounded-xl text-sm transition-colors"
          >
            <Download className="h-4 w-4" />
            Descargar Plantilla
          </button>
        </header>

        {/* Upload area */}
        {!rows.length && !results && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            onClick={() => fileRef.current?.click()}
            className={`bg-white dark:bg-neutral-900 border-2 border-dashed rounded-3xl p-16 flex flex-col items-center gap-4 cursor-pointer transition-colors ${
              dragOver ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-500/10' : 'border-neutral-200 dark:border-neutral-700 hover:border-cyan-300 dark:hover:border-cyan-700'
            }`}
          >
            <div className="bg-cyan-100 dark:bg-cyan-500/20 p-5 rounded-2xl">
              <FileText className="h-12 w-12 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div className="text-center">
              <p className="text-lg font-black text-neutral-900 dark:text-white">Arrastra tu archivo CSV aquí</p>
              <p className="text-neutral-500 text-sm mt-1">o haz clic para seleccionar — máximo 500 filas</p>
            </div>
            <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>
        )}

        {/* Preview */}
        {rows.length > 0 && !results && (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden">
            <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <p className="font-black text-neutral-900 dark:text-white">{rows.length} facturas cargadas</p>
                <p className="text-xs text-neutral-400 mt-0.5">Revisa antes de procesar</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setRows([])} className="px-4 py-2 text-sm font-semibold text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={handleProcess}
                  disabled={processing}
                  className="flex items-center gap-2 px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-black rounded-xl text-sm transition-colors disabled:opacity-50"
                >
                  {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {processing ? 'Procesando...' : `Procesar ${rows.length} facturas`}
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                  <tr>
                    {['#', 'RFC Receptor', 'Nombre', 'Concepto', 'Cantidad', 'Precio Unit.', 'Total Est.'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-black text-neutral-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {rows.slice(0, 20).map((row, i) => (
                    <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                      <td className="px-4 py-3 text-neutral-400">{i + 1}</td>
                      <td className="px-4 py-3 font-mono text-xs text-neutral-700 dark:text-neutral-300">{row.rfcReceptor}</td>
                      <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{row.nombreReceptor}</td>
                      <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{row.concepto}</td>
                      <td className="px-4 py-3 text-center text-neutral-700 dark:text-neutral-300">{row.cantidad}</td>
                      <td className="px-4 py-3 text-right font-semibold text-neutral-700 dark:text-neutral-300">${row.precioUnitario.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-right font-black text-neutral-900 dark:text-white">${(row.cantidad * row.precioUnitario * 1.16).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                  {rows.length > 20 && (
                    <tr><td colSpan={7} className="px-4 py-3 text-center text-sm text-neutral-400">... y {rows.length - 20} filas más</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 rounded-2xl flex items-center gap-4">
                <BarChart3 className="h-8 w-8 text-neutral-400" />
                <div><p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Total</p><p className="text-2xl font-black text-neutral-900 dark:text-white">{results.length}</p></div>
              </div>
              <div className="bg-white dark:bg-neutral-900 border border-emerald-200 dark:border-emerald-800/50 border-l-4 border-l-emerald-500 p-5 rounded-2xl flex items-center gap-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                <div><p className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Exitosas</p><p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{okCount}</p></div>
              </div>
              <div className="bg-white dark:bg-neutral-900 border border-red-200 dark:border-red-800/50 border-l-4 border-l-red-500 p-5 rounded-2xl flex items-center gap-4">
                <XCircle className="h-8 w-8 text-red-500" />
                <div><p className="text-xs font-bold text-red-500 uppercase tracking-widest">Errores</p><p className="text-2xl font-black text-red-600 dark:text-red-400">{errCount}</p></div>
              </div>
            </div>
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden">
              <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <p className="font-black text-neutral-900 dark:text-white">Resultados del procesamiento</p>
                <button onClick={() => { setRows([]); setResults(null); }} className="text-sm font-semibold text-cyan-600 hover:text-cyan-700">Nueva carga</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                    <tr>
                      {['#', 'RFC', 'Concepto', 'Total', 'Estado', 'Mensaje'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-black text-neutral-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {results.map((r) => (
                      <tr key={r.index} className={r.status === 'ERROR' ? 'bg-red-50 dark:bg-red-500/5' : ''}>
                        <td className="px-4 py-3 text-neutral-400">{r.index + 1}</td>
                        <td className="px-4 py-3 font-mono text-xs text-neutral-700 dark:text-neutral-300">{r.rfcReceptor}</td>
                        <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{r.concepto}</td>
                        <td className="px-4 py-3 font-semibold text-right">${r.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${r.status === 'OK' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'}`}>
                            {r.status === 'OK' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            {r.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-neutral-500">{r.message ?? (r.invoiceId ? `ID: ${r.invoiceId.slice(0, 8)}...` : '—')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
