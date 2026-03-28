'use client';

/**
 * CIFRA — Facturación CFDI 4.0
 * ===================================
 * FASE 13: Lista de facturas + estado del CSD + acciones rápidas.
 * Motor CFDI completo desde FASE 7 — ahora con UI accesible.
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  FileText, Plus, Settings, Download, XCircle,
  AlertCircle, CheckCircle, Clock, Loader2, RefreshCw,
  FileX, ShieldCheck,
} from 'lucide-react';
import {
  getInvoiceList,
  getCsdStatus,
  downloadInvoiceXml,
  cancelInvoiceAction,
  type InvoiceListItem,
  type CsdStatusInfo,
} from './actions';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatCurrency(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Mexico_City',
  });
}

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  DRAFT:     { label: 'Borrador',  classes: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400' },
  SEALED:    { label: 'Sellado',   classes: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' },
  STAMPED:   { label: 'Timbrado',  classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' },
  CANCELLED: { label: 'Cancelado', classes: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' },
  ERROR:     { label: 'Error',     classes: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' },
};

// ─── Componente principal ─────────────────────────────────────────────────────

export default function BillingPage() {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [csd, setCsd] = useState<CsdStatusInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [{ invoices: list }, csdInfo] = await Promise.all([
        getInvoiceList(),
        getCsdStatus(),
      ]);
      setInvoices(list);
      setCsd(csdInfo);
    } catch (err) {
      console.error('[Billing] Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleDownloadXml(inv: InvoiceListItem) {
    setDownloadingId(inv.id);
    try {
      const { xml, filename } = await downloadInvoiceXml(inv.id);
      // Disparar descarga en el navegador
      const blob = new Blob([xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Error descargando XML');
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleCancel(inv: InvoiceListItem) {
    if (!confirm(`¿Cancelar la factura ${inv.serie ?? 'F'}-${inv.folio}? Esta acción no se puede deshacer.`)) return;
    setCancelingId(inv.id);
    try {
      await cancelInvoiceAction(inv.id, '02'); // Motivo 02: Comprobante emitido con errores con relación
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Error cancelando factura');
    } finally {
      setCancelingId(null);
    }
  }

  const csdOk = csd?.exists && !csd.isExpired;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">

      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-neutral-950 dark:text-white">
            Facturación CFDI 4.0
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
            Emite y administra tus Comprobantes Fiscales Digitales
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/billing/csd"
            className="flex items-center gap-2 px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <Settings size={16} />
            {csd?.exists ? 'Ver CSD' : 'Configurar CSD'}
          </Link>
          <Link
            href="/billing/nueva"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-colors ${
              csdOk
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20'
                : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed pointer-events-none'
            }`}
          >
            <Plus size={16} />
            Nueva Factura
          </Link>
        </div>
      </div>

      {/* ── Banner CSD ─────────────────────────────────────── */}
      {!loading && (
        <>
          {!csd?.exists && (
            <div className="flex items-start gap-4 p-4 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 rounded-2xl">
              <AlertCircle className="text-orange-500 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="font-bold text-orange-900 dark:text-orange-300 text-sm">
                  CSD no configurado
                </p>
                <p className="text-orange-800 dark:text-orange-400 text-xs mt-1">
                  Para emitir facturas necesitas subir tu Certificado de Sello Digital (.cer + .key).
                </p>
              </div>
              <Link
                href="/billing/csd"
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black rounded-lg transition-colors whitespace-nowrap"
              >
                Configurar ahora
              </Link>
            </div>
          )}

          {csd?.exists && csd.isExpired && (
            <div className="flex items-start gap-4 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="font-bold text-red-900 dark:text-red-300 text-sm">
                  CSD vencido
                </p>
                <p className="text-red-800 dark:text-red-400 text-xs mt-1">
                  Tu certificado venció el {csd.validTo ? formatDate(csd.validTo) : '—'}.
                  Renueva tu CSD en el SAT y súbelo de nuevo.
                </p>
              </div>
              <Link href="/billing/csd" className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-black rounded-lg transition-colors whitespace-nowrap">
                Renovar CSD
              </Link>
            </div>
          )}

          {csdOk && (
            <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl text-sm">
              <ShieldCheck className="text-emerald-600" size={18} />
              <p className="text-emerald-800 dark:text-emerald-400">
                <strong>CSD activo</strong> — Certificado{' '}
                <span className="font-mono text-xs">{csd.noCertificado}</span>
                {' '}· Vigente hasta {csd.validTo ? formatDate(csd.validTo) : '—'}
              </p>
            </div>
          )}
        </>
      )}

      {/* ── Tabla de facturas ──────────────────────────────── */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden">

        {/* Header de la tabla */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="font-black text-neutral-900 dark:text-white">
            Comprobantes emitidos
          </h2>
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-neutral-400">
            <Loader2 size={24} className="animate-spin" />
            <span className="text-sm font-medium">Cargando facturas...</span>
          </div>
        ) : invoices.length === 0 ? (
          /* ── Estado vacío ── */
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="bg-neutral-100 dark:bg-neutral-800 p-5 rounded-2xl mb-4">
              <FileX className="h-10 w-10 text-neutral-400" />
            </div>
            <h3 className="font-black text-neutral-900 dark:text-white text-lg mb-2">
              Sin facturas emitidas
            </h3>
            <p className="text-neutral-500 text-sm max-w-xs mb-6">
              {csdOk
                ? 'Emite tu primer CFDI haciendo clic en "Nueva Factura".'
                : 'Configura tu CSD primero para empezar a facturar.'}
            </p>
            {csdOk ? (
              <Link
                href="/billing/nueva"
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-sm transition-colors"
              >
                <Plus size={16} />
                Emitir primera factura
              </Link>
            ) : (
              <Link
                href="/billing/csd"
                className="flex items-center gap-2 px-6 py-3 bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-100 text-white dark:text-black font-black rounded-xl text-sm transition-colors"
              >
                <Settings size={16} />
                Configurar CSD
              </Link>
            )}
          </div>
        ) : (
          /* ── Tabla con datos ── */
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-50 dark:bg-black/30 text-[10px] font-black uppercase tracking-widest text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
                  <th className="px-6 py-3 text-left">Folio</th>
                  <th className="px-4 py-3 text-left">Receptor</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {invoices.map((inv) => {
                  const s = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.DRAFT;
                  const folio = `${inv.serie ?? 'F'}-${String(inv.folio).padStart(8, '0')}`;
                  const isProcessing = cancelingId === inv.id || downloadingId === inv.id;

                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
                    >
                      {/* Folio */}
                      <td className="px-6 py-4">
                        <div className="font-mono font-black text-sm text-neutral-900 dark:text-white">
                          {folio}
                        </div>
                        {inv.uuid && (
                          <div className="font-mono text-[10px] text-neutral-400 mt-0.5 truncate max-w-[140px]">
                            {inv.uuid}
                          </div>
                        )}
                      </td>

                      {/* Receptor */}
                      <td className="px-4 py-4">
                        <div className="font-semibold text-sm text-neutral-900 dark:text-white truncate max-w-[180px]">
                          {inv.receptorNombre}
                        </div>
                        <div className="font-mono text-xs text-neutral-500 mt-0.5">
                          {inv.receptorRfc}
                        </div>
                      </td>

                      {/* Total */}
                      <td className="px-4 py-4 text-right">
                        <span className="font-black text-sm text-neutral-900 dark:text-white">
                          {formatCurrency(inv.total)}
                        </span>
                        <div className="text-[10px] text-neutral-400 mt-0.5 text-right">
                          {inv.tipoComprobante === 'I' ? 'Ingreso' : inv.tipoComprobante} · {inv.metodoPago}
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-black ${s.classes}`}>
                          {s.label}
                        </span>
                      </td>

                      {/* Fecha */}
                      <td className="px-4 py-4 text-sm text-neutral-600 dark:text-neutral-400">
                        {formatDate(inv.fechaEmision)}
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-1">
                          {/* Descargar XML */}
                          {inv.status === 'STAMPED' && (
                            <button
                              onClick={() => handleDownloadXml(inv)}
                              disabled={isProcessing}
                              title="Descargar XML"
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors disabled:opacity-50"
                            >
                              {downloadingId === inv.id
                                ? <Loader2 size={15} className="animate-spin" />
                                : <Download size={15} />}
                            </button>
                          )}

                          {/* Cancelar */}
                          {inv.status === 'STAMPED' && (
                            <button
                              onClick={() => handleCancel(inv)}
                              disabled={isProcessing}
                              title="Cancelar factura"
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
                            >
                              {cancelingId === inv.id
                                ? <Loader2 size={15} className="animate-spin" />
                                : <XCircle size={15} />}
                            </button>
                          )}
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
  );
}
