'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import {
  FileText, Download, CheckCircle2, Clock, XCircle,
  Building2, AlertTriangle, Loader2, ExternalLink
} from 'lucide-react';

type InvoiceStatus = 'PAGADA' | 'PENDIENTE' | 'CANCELADA';

interface PortalInvoice {
  id: string;
  folio: string;
  fecha: string;
  concepto: string;
  total: number;
  moneda: string;
  uuid: string | null;
  status: InvoiceStatus;
}

interface PortalData {
  customer: { legalName: string; rfc: string };
  tenant: { name: string; rfc: string; logoUrl: string | null };
  invoices: PortalInvoice[];
  summary: { totalFacturado: number; totalPagado: number; totalPendiente: number };
  expiresAt: string;
}

const fmt = (n: number) =>
  '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; icon: React.ElementType; cls: string }> = {
  PAGADA:    { label: 'Pagada',    icon: CheckCircle2,    cls: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' },
  PENDIENTE: { label: 'Pendiente', icon: Clock,           cls: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' },
  CANCELADA: { label: 'Cancelada', icon: XCircle,         cls: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500' },
};

export default function PortalPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData]       = useState<PortalData | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/portal/${token}/invoices`)
      .then(async (res) => {
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error ?? 'Error al cargar');
        }
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="bg-red-100 dark:bg-red-500/20 p-4 rounded-2xl inline-flex mb-4">
            <AlertTriangle className="h-10 w-10 text-red-500" />
          </div>
          <h1 className="text-xl font-black text-neutral-900 dark:text-white mb-2">Enlace no disponible</h1>
          <p className="text-neutral-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { customer, tenant, invoices, summary } = data;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">

      {/* HEADER — Branding del emisor */}
      <header className="flex items-center justify-between bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          {tenant.logoUrl ? (
            <Image src={tenant.logoUrl} alt={tenant.name} width={48} height={48} className="rounded-xl object-contain" />
          ) : (
            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
          )}
          <div>
            <p className="font-black text-neutral-900 dark:text-white text-lg leading-tight">{tenant.name}</p>
            <p className="text-xs text-neutral-500 font-mono">RFC: {tenant.rfc}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Portal del Cliente</p>
          <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mt-0.5">{customer.legalName}</p>
          <p className="text-xs text-neutral-500 font-mono">{customer.rfc}</p>
        </div>
      </header>

      {/* RESUMEN */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Facturado', value: summary.totalFacturado, color: 'text-neutral-900 dark:text-white' },
          { label: 'Total Pagado',    value: summary.totalPagado,    color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Saldo Pendiente', value: summary.totalPendiente, color: summary.totalPendiente > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-900 dark:text-white' },
        ].map((card) => (
          <div key={card.label} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 text-center shadow-sm">
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">{card.label}</p>
            <p className={`text-2xl font-black ${card.color}`}>{fmt(card.value)}</p>
          </div>
        ))}
      </div>

      {/* TABLA DE FACTURAS */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-neutral-400" />
            <h2 className="font-black text-neutral-900 dark:text-white">
              Facturas
              <span className="ml-2 text-xs font-bold text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
                {invoices.length}
              </span>
            </h2>
          </div>
          <a
            href={`/api/reports/estado-cuenta?format=pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-neutral-950 dark:bg-white text-white dark:text-black text-xs font-black rounded-xl hover:scale-[1.02] transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            Estado de Cuenta PDF
          </a>
        </div>

        {invoices.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="h-10 w-10 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
            <p className="text-neutral-500 text-sm">No hay facturas registradas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-neutral-50 dark:bg-black/40 text-xs font-bold text-neutral-500 uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th className="px-5 py-3">Folio</th>
                  <th className="px-5 py-3">Fecha</th>
                  <th className="px-5 py-3">Concepto</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3 text-center">Estado</th>
                  <th className="px-5 py-3 text-right">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-sm">
                {invoices.map((inv) => {
                  const sc = STATUS_CONFIG[inv.status];
                  const Icon = sc.icon;
                  return (
                    <tr key={inv.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                      <td className="px-5 py-3 font-mono font-bold text-neutral-900 dark:text-white">{inv.folio}</td>
                      <td className="px-5 py-3 text-neutral-500 whitespace-nowrap">{fmtDate(inv.fecha)}</td>
                      <td className="px-5 py-3 text-neutral-700 dark:text-neutral-300 max-w-[200px] truncate">{inv.concepto}</td>
                      <td className="px-5 py-3 text-right font-bold text-neutral-900 dark:text-white whitespace-nowrap">
                        {fmt(inv.total)} <span className="text-xs text-neutral-400">{inv.moneda}</span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${sc.cls}`}>
                          <Icon className="h-3 w-3" />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {inv.status !== 'CANCELADA' && (
                          <a
                            href={`/api/reports/cfdi/${inv.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline text-xs font-bold"
                          >
                            <Download className="h-3.5 w-3.5" />
                            PDF
                          </a>
                        )}
                        {inv.uuid && (
                          <a
                            href={`https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?id=${inv.uuid}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 inline-flex items-center gap-1 text-neutral-400 hover:text-neutral-600 text-xs"
                            title="Verificar en el SAT"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <p className="text-center text-xs text-neutral-400 pb-4">
        Este portal es de solo lectura · Generado por CIFRA ERP · Enlace válido hasta {fmtDate(data.expiresAt)}
      </p>
    </div>
  );
}
