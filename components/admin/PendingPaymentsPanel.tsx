'use client';

import { useState, useTransition } from 'react';
import {
  Banknote, CheckCircle2, XCircle, Clock, Eye,
  FileText, AlertTriangle, ChevronDown, ChevronUp,
} from 'lucide-react';
import { approvePaymentProof, rejectPaymentProof } from '@/app/(dashboard)/billing/subscription/actions';

interface Proof {
  id: string;
  amount: number;
  transferRef: string | null;
  paidAt: Date;
  createdAt: Date;
  fileName: string;
  fileType: string;
  fileBase64: string;
  tenant: { id: string; name: string; rfc: string | null };
}

interface Props {
  proofs: Proof[];
}

export default function PendingPaymentsPanel({ proofs: initialProofs }: Props) {
  const [proofs, setProofs] = useState(initialProofs);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [daysOverride, setDaysOverride] = useState<Record<string, number>>({});
  const [isPending, startTransition] = useTransition();
  const [messages, setMessages] = useState<Record<string, { type: 'ok' | 'err'; text: string }>>({});

  function setMsg(id: string, type: 'ok' | 'err', text: string) {
    setMessages((prev) => ({ ...prev, [id]: { type, text } }));
  }

  function removeProof(id: string) {
    setProofs((prev) => prev.filter((p) => p.id !== id));
  }

  function handleApprove(proof: Proof) {
    const days = daysOverride[proof.id] ?? 30;
    startTransition(async () => {
      const res = await approvePaymentProof(proof.id, days);
      if (res.ok) {
        setMsg(proof.id, 'ok', `✅ Aprobado — +${days} días sumados`);
        setTimeout(() => removeProof(proof.id), 2000);
      } else {
        setMsg(proof.id, 'err', res.error ?? 'Error');
      }
    });
  }

  function handleReject(proof: Proof) {
    if (!rejectNote.trim()) {
      setMsg(proof.id, 'err', 'Escribe el motivo del rechazo');
      return;
    }
    startTransition(async () => {
      const res = await rejectPaymentProof(proof.id, rejectNote);
      if (res.ok) {
        setMsg(proof.id, 'ok', '❌ Rechazado — se notificó al tenant');
        setTimeout(() => removeProof(proof.id), 2000);
      } else {
        setMsg(proof.id, 'err', res.error ?? 'Error');
      }
    });
  }

  function getFileUrl(proof: Proof): string {
    return `data:${proof.fileType};base64,${proof.fileBase64}`;
  }

  if (proofs.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-10 text-center">
        <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
        <p className="font-bold text-neutral-700 dark:text-neutral-300">
          Sin pagos pendientes
        </p>
        <p className="text-sm text-neutral-500 mt-1">
          Todos los comprobantes han sido procesados.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {proofs.map((proof) => {
        const isExpanded = expandedId === proof.id;
        const isRejecting = rejectingId === proof.id;
        const msg = messages[proof.id];
        const days = daysOverride[proof.id] ?? 30;
        const isPdf = proof.fileType === 'application/pdf';

        return (
          <div
            key={proof.id}
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden"
          >
            {/* Cabecera */}
            <div className="p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="bg-amber-100 dark:bg-amber-500/20 p-3 rounded-xl flex-shrink-0">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-black text-neutral-900 dark:text-white truncate">
                    {proof.tenant.name}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    RFC: {proof.tenant.rfc ?? 'N/D'} · Enviado el{' '}
                    {new Date(proof.createdAt).toLocaleDateString('es-MX', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <p className="font-black text-lg text-neutral-900 dark:text-white">
                    ${Number(proof.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-neutral-500">MXN</p>
                </div>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : proof.id)}
                  className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  {isExpanded
                    ? <ChevronUp className="h-4 w-4" />
                    : <ChevronDown className="h-4 w-4" />
                  }
                </button>
              </div>
            </div>

            {/* Detalles expandidos */}
            {isExpanded && (
              <div className="border-t border-neutral-200 dark:border-neutral-800 p-5 space-y-4">
                {/* Info del pago */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-xl">
                    <p className="text-xs text-neutral-500 mb-1">Fecha de pago</p>
                    <p className="font-semibold">
                      {new Date(proof.paidAt).toLocaleDateString('es-MX', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </p>
                  </div>
                  {proof.transferRef && (
                    <div className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-xl">
                      <p className="text-xs text-neutral-500 mb-1">Clave SPEI</p>
                      <p className="font-mono font-semibold text-xs">{proof.transferRef}</p>
                    </div>
                  )}
                  <div className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-xl">
                    <p className="text-xs text-neutral-500 mb-1">Archivo</p>
                    <p className="font-semibold text-xs truncate">{proof.fileName}</p>
                  </div>
                </div>

                {/* Vista previa del comprobante */}
                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                    Comprobante adjunto
                  </p>
                  {isPdf ? (
                    <a
                      href={getFileUrl(proof)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-sm font-semibold hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                    >
                      <FileText className="h-4 w-4 text-red-500" />
                      Ver PDF
                      <Eye className="h-4 w-4 opacity-50" />
                    </a>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getFileUrl(proof)}
                      alt="Comprobante de pago"
                      className="max-h-48 rounded-xl border border-neutral-200 dark:border-neutral-700 object-contain"
                    />
                  )}
                </div>

                {/* Mensaje de resultado */}
                {msg && (
                  <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold ${
                    msg.type === 'ok'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30'
                      : 'bg-red-50 text-red-700 dark:bg-red-950/30'
                  }`}>
                    {msg.type === 'ok'
                      ? <CheckCircle2 className="h-4 w-4" />
                      : <AlertTriangle className="h-4 w-4" />
                    }
                    {msg.text}
                  </div>
                )}

                {/* Días a otorgar */}
                <div className="flex items-center gap-3">
                  <label className="text-sm font-semibold whitespace-nowrap">
                    Días a otorgar:
                  </label>
                  <div className="flex gap-2">
                    {[30, 60, 90, 365].map((d) => (
                      <button
                        key={d}
                        onClick={() => setDaysOverride((prev) => ({ ...prev, [proof.id]: d }))}
                        className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-colors ${
                          days === d
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 hover:border-emerald-400'
                        }`}
                      >
                        {d === 365 ? '1 año' : `${d}d`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Acciones */}
                {!isRejecting ? (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(proof)}
                      disabled={isPending}
                      className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Aprobar +{days} días
                    </button>
                    <button
                      onClick={() => { setRejectingId(proof.id); setRejectNote(''); }}
                      disabled={isPending}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-100 hover:bg-red-200 dark:bg-red-950/30 dark:hover:bg-red-950/50 text-red-700 dark:text-red-400 font-bold py-3 rounded-xl transition-colors"
                    >
                      <XCircle className="h-4 w-4" />
                      Rechazar
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <textarea
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                      placeholder="Motivo del rechazo (ej. CLABE incorrecta, monto diferente…)"
                      rows={2}
                      className="w-full border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleReject(proof)}
                        disabled={isPending}
                        className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-colors text-sm"
                      >
                        Confirmar rechazo
                      </button>
                      <button
                        onClick={() => setRejectingId(null)}
                        className="px-4 py-2.5 border border-neutral-300 dark:border-neutral-700 rounded-xl text-sm font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
