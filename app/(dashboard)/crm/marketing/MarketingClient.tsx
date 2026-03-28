'use client';

import React, { useState, useTransition } from 'react';
import {
  Megaphone, Mail, Send, Trash2, Eye, Plus, Users,
  X, AlertTriangle, CheckCircle2, Loader2, BarChart3,
  FileText, Clock, EyeOff,
} from 'lucide-react';
import type { CampaignRow } from './actions';
import { createCampaign, sendCampaign, deleteCampaign } from './actions';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; classes: string }> = {
    DRAFT:     { label: 'Borrador',    classes: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400' },
    SENT:      { label: 'Enviada',     classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
    SCHEDULED: { label: 'Programada', classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' },
    CANCELLED: { label: 'Cancelada',  classes: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400' },
  };
  const cfg = map[status] ?? map.DRAFT;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${cfg.classes}`}>
      {cfg.label}
    </span>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Mexico_City',
  });
}

// ─── New Campaign Modal ───────────────────────────────────────────────────────

interface NewCampaignModalProps {
  onClose: () => void;
  onCreated: (row: CampaignRow) => void;
}

function NewCampaignModal({ onClose, onCreated }: NewCampaignModalProps) {
  const [name, setName]       = useState('');
  const [subject, setSubject] = useState('');
  const [htmlBody, setHtml]   = useState('');
  const [preview, setPreview] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const id = await createCampaign({ name, subject, htmlBody });
        const newRow: CampaignRow = {
          id,
          name,
          subject,
          status: 'DRAFT',
          sentAt: null,
          recipientCount: 0,
          openCount: 0,
          clickCount: 0,
          createdAt: new Date().toISOString(),
        };
        onCreated(newRow);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al crear campaña');
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500/10 p-2.5 rounded-xl border border-orange-500/20">
              <Mail className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-neutral-950 dark:text-white">Nueva Campaña</h2>
              <p className="text-xs text-neutral-500">Crea un correo masivo para tus clientes activos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-400 px-4 py-3 rounded-xl text-sm font-medium">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-black text-neutral-500 uppercase tracking-widest mb-1.5">
              Nombre de la campaña
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej. Promo Fin de Mes — Abril 2026"
              className="w-full bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-2.5 text-sm font-medium text-neutral-900 dark:text-white outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-neutral-500 uppercase tracking-widest mb-1.5">
              Asunto del correo
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Ej. 🎉 Oferta exclusiva para ti, {{nombre}}"
              className="w-full bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-2.5 text-sm font-medium text-neutral-900 dark:text-white outline-none focus:border-orange-500 transition-colors"
            />
            <p className="text-[10px] text-neutral-400 mt-1">
              Usa <code className="bg-neutral-100 dark:bg-neutral-800 px-1 rounded">{'{{nombre}}'}</code> para personalizar con el nombre del cliente.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-black text-neutral-500 uppercase tracking-widest">
                Cuerpo HTML del correo
              </label>
              <button
                type="button"
                onClick={() => setPreview(p => !p)}
                className="flex items-center gap-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
              >
                {preview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {preview ? 'Editar' : 'Previsualizar'}
              </button>
            </div>

            {preview ? (
              <div
                className="w-full min-h-[240px] bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 overflow-auto text-sm"
                dangerouslySetInnerHTML={{ __html: htmlBody || '<p class="text-neutral-400 italic">Sin contenido aún...</p>' }}
              />
            ) : (
              <textarea
                rows={10}
                value={htmlBody}
                onChange={e => setHtml(e.target.value)}
                placeholder={'<h1>Hola {{nombre}},</h1>\n<p>Tenemos una oferta especial para ti.</p>'}
                className="w-full bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm font-mono text-neutral-900 dark:text-white outline-none focus:border-orange-500 transition-colors resize-y"
              />
            )}
            <p className="text-[10px] text-neutral-400 mt-1">
              HTML estándar. El sistema envuelve el cuerpo en la plantilla de marca CIFRA.
            </p>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-200 dark:border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-5 py-2 text-sm font-bold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl transition-colors border border-neutral-200 dark:border-neutral-700 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={(e) => { e.preventDefault(); handleSubmit(e as unknown as React.FormEvent); }}
            disabled={isPending || !name.trim() || !subject.trim()}
            className="flex items-center gap-2 px-6 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-xl transition-all shadow-lg shadow-orange-500/20 text-sm"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {isPending ? 'Guardando...' : 'Crear campaña'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Send Confirmation Modal ──────────────────────────────────────────────────

interface SendConfirmModalProps {
  campaign: CampaignRow;
  onClose: () => void;
  onSent: (id: string, result: { sent: number; failed: number }) => void;
}

type SendState = 'idle' | 'sending' | 'done' | 'error';

function SendConfirmModal({ campaign, onClose, onSent }: SendConfirmModalProps) {
  const [state, setState]   = useState<SendState>('idle');
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSend() {
    setState('sending');
    setErrMsg(null);
    startTransition(async () => {
      try {
        const res = await sendCampaign(campaign.id);
        setResult(res);
        setState('done');
        onSent(campaign.id, res);
      } catch (err: unknown) {
        setErrMsg(err instanceof Error ? err.message : 'Error al enviar');
        setState('error');
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          {state === 'done' && result ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="bg-emerald-500/10 p-4 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                </div>
              </div>
              <h3 className="text-xl font-black text-neutral-900 dark:text-white">¡Campaña enviada!</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-4">
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{result.sent}</p>
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-500 uppercase tracking-wider mt-1">Enviados</p>
                </div>
                <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 rounded-xl p-4">
                  <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{result.failed}</p>
                  <p className="text-xs font-bold text-rose-700 dark:text-rose-500 uppercase tracking-wider mt-1">Fallidos</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-neutral-950 dark:bg-white text-white dark:text-black font-black rounded-xl hover:opacity-90 transition-opacity text-sm"
              >
                Cerrar
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="bg-orange-500/10 p-3 rounded-xl border border-orange-500/20 shrink-0">
                  <Send className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-neutral-900 dark:text-white">Confirmar envío</h3>
                  <p className="text-sm text-neutral-500 mt-1">
                    Se enviará <span className="font-bold text-neutral-800 dark:text-neutral-200">&ldquo;{campaign.name}&rdquo;</span> a todos los clientes activos con email registrado. Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500 font-medium">Asunto</span>
                  <span className="font-bold text-neutral-900 dark:text-white truncate max-w-[55%] text-right">{campaign.subject}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500 font-medium">Estado</span>
                  <StatusBadge status={campaign.status} />
                </div>
              </div>

              {state === 'error' && errMsg && (
                <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-400 px-4 py-3 rounded-xl text-sm font-medium">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {errMsg}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={onClose}
                  disabled={isPending}
                  className="flex-1 py-2.5 text-sm font-bold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl transition-colors border border-neutral-200 dark:border-neutral-700 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSend}
                  disabled={isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black rounded-xl transition-all shadow-lg shadow-orange-500/20 text-sm"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Enviar ahora
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────

interface Props {
  initialCampaigns: CampaignRow[];
}

export default function MarketingClient({ initialCampaigns }: Props) {
  const [campaigns, setCampaigns]             = useState<CampaignRow[]>(initialCampaigns);
  const [showNewModal, setShowNewModal]       = useState(false);
  const [sendTarget, setSendTarget]           = useState<CampaignRow | null>(null);
  const [deletingId, setDeletingId]           = useState<string | null>(null);
  const [deleteError, setDeleteError]         = useState<string | null>(null);
  const [isPending, startTransition]          = useTransition();

  // ── KPI derivations ──
  const drafts     = campaigns.filter(c => c.status === 'DRAFT').length;
  const sent       = campaigns.filter(c => c.status === 'SENT').length;
  const totalReciп = campaigns.reduce((sum, c) => sum + c.recipientCount, 0);

  // ── Handlers ──
  function handleCreated(row: CampaignRow) {
    setCampaigns(prev => [row, ...prev]);
    setShowNewModal(false);
  }

  function handleSent(id: string, result: { sent: number; failed: number }) {
    setCampaigns(prev =>
      prev.map(c =>
        c.id === id
          ? { ...c, status: 'SENT', sentAt: new Date().toISOString(), recipientCount: result.sent }
          : c
      )
    );
  }

  function handleDelete(campaign: CampaignRow) {
    setDeleteError(null);
    setDeletingId(campaign.id);
    startTransition(async () => {
      try {
        await deleteCampaign(campaign.id);
        setCampaigns(prev => prev.filter(c => c.id !== campaign.id));
      } catch (err: unknown) {
        setDeleteError(err instanceof Error ? err.message : 'Error al eliminar');
      } finally {
        setDeletingId(null);
      }
    });
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* ── HEADER ─────────────────────────────────────────────────────────── */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-orange-500/10 p-3 rounded-2xl border border-orange-500/20">
              <Megaphone className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">Campañas de Email</h1>
              <p className="text-neutral-500 font-medium text-sm mt-1 flex items-center gap-2">
                <Mail className="h-4 w-4" /> Email masivo personalizado a clientes activos del CRM.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl transition-all shadow-lg shadow-orange-500/20 text-sm"
          >
            <Plus className="h-4 w-4" />
            Nueva campaña
          </button>
        </header>

        {/* ── KPI CARDS ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Borradores</p>
              <p className="text-3xl font-black text-neutral-900 dark:text-white mt-1">{drafts}</p>
              <p className="text-[10px] text-neutral-400 mt-1 font-bold">Pendientes de envío</p>
            </div>
            <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
              <FileText className="h-6 w-6 text-neutral-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between border-l-4 border-l-emerald-500">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Enviadas</p>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{sent}</p>
              <p className="text-[10px] text-emerald-500 mt-1 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Campañas completadas
              </p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
              <Send className="h-6 w-6 text-emerald-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-neutral-900 to-black dark:from-orange-950 dark:to-black p-5 rounded-2xl border border-neutral-800 flex items-center justify-between text-white border-l-4 border-l-orange-500">
            <div>
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Total Destinatarios</p>
              <p className="text-3xl font-black text-white mt-1">{totalReciп.toLocaleString('es-MX')}</p>
              <p className="text-[10px] text-orange-400 mt-1 font-bold flex items-center gap-1">
                <Users className="h-3 w-3" /> Correos enviados acumulado
              </p>
            </div>
            <div className="p-3 bg-orange-500/20 rounded-xl">
              <Users className="h-6 w-6 text-orange-400" />
            </div>
          </div>
        </div>

        {/* ── DELETE ERROR BANNER ─────────────────────────────────────────────── */}
        {deleteError && (
          <div className="flex items-center gap-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-400 px-5 py-3 rounded-2xl text-sm font-medium">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {deleteError}
            <button onClick={() => setDeleteError(null)} className="ml-auto"><X className="h-4 w-4" /></button>
          </div>
        )}

        {/* ── CAMPAIGNS TABLE ─────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm overflow-hidden">
          {/* Table header bar */}
          <div className="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <h2 className="font-black text-neutral-900 dark:text-white text-lg">Todas las campañas</h2>
              <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs font-black px-2.5 py-0.5 rounded-full">
                {campaigns.length}
              </span>
            </div>
          </div>

          {campaigns.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-24 text-center px-6">
              <div className="bg-orange-500/10 p-5 rounded-full border border-orange-500/20 mb-5">
                <Megaphone className="h-12 w-12 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl font-black text-neutral-900 dark:text-white mb-2">
                Sin campañas todavía
              </h3>
              <p className="text-neutral-500 text-sm max-w-md leading-relaxed mb-6">
                Crea tu primera campaña de email masivo para enviar promociones, avisos o boletines a todos tus clientes activos del CRM.
              </p>
              <button
                onClick={() => setShowNewModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl transition-all shadow-lg shadow-orange-500/20 text-sm"
              >
                <Plus className="h-4 w-4" />
                Crear primera campaña
              </button>
            </div>
          ) : (
            /* Table */
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
                    <th className="text-left px-6 py-3 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Nombre</th>
                    <th className="text-left px-6 py-3 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Asunto</th>
                    <th className="text-left px-6 py-3 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Estado</th>
                    <th className="text-center px-6 py-3 text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                      <span className="flex items-center justify-center gap-1"><Users className="h-3 w-3" /> Destinatarios</span>
                    </th>
                    <th className="text-center px-6 py-3 text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                      <span className="flex items-center justify-center gap-1"><Eye className="h-3 w-3" /> Aperturas</span>
                    </th>
                    <th className="text-left px-6 py-3 text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Fecha envío</span>
                    </th>
                    <th className="text-center px-6 py-3 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {campaigns.map((campaign) => (
                    <tr
                      key={campaign.id}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors group"
                    >
                      {/* Name */}
                      <td className="px-6 py-4">
                        <p className="font-bold text-sm text-neutral-900 dark:text-white max-w-[200px] truncate">
                          {campaign.name}
                        </p>
                        <p className="text-[10px] text-neutral-400 mt-0.5">
                          Creada {formatDate(campaign.createdAt)}
                        </p>
                      </td>

                      {/* Subject */}
                      <td className="px-6 py-4">
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-[220px] truncate">
                          {campaign.subject}
                        </p>
                      </td>

                      {/* Status badge */}
                      <td className="px-6 py-4">
                        <StatusBadge status={campaign.status} />
                      </td>

                      {/* Recipient count */}
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-black text-neutral-900 dark:text-white">
                          {campaign.recipientCount.toLocaleString('es-MX')}
                        </span>
                      </td>

                      {/* Open count */}
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-bold text-neutral-600 dark:text-neutral-400">
                          {campaign.openCount.toLocaleString('es-MX')}
                        </span>
                        {campaign.recipientCount > 0 && campaign.openCount > 0 && (
                          <span className="block text-[10px] text-neutral-400">
                            {Math.round((campaign.openCount / campaign.recipientCount) * 100)}%
                          </span>
                        )}
                      </td>

                      {/* Sent at */}
                      <td className="px-6 py-4">
                        <span className="text-sm text-neutral-500">
                          {formatDate(campaign.sentAt)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {campaign.status === 'DRAFT' && (
                            <button
                              onClick={() => setSendTarget(campaign)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-lg text-xs transition-all shadow-sm shadow-orange-500/20"
                              title="Enviar campaña"
                            >
                              <Send className="h-3.5 w-3.5" />
                              Enviar
                            </button>
                          )}
                          {campaign.status === 'DRAFT' && (
                            <button
                              onClick={() => handleDelete(campaign)}
                              disabled={deletingId === campaign.id || isPending}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 font-black rounded-lg text-xs transition-colors border border-rose-200 dark:border-rose-800/50 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Eliminar campaña"
                            >
                              {deletingId === campaign.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                              Eliminar
                            </button>
                          )}
                          {campaign.status !== 'DRAFT' && (
                            <span className="text-[10px] text-neutral-400 font-medium italic">
                              Sin acciones
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* ── MODALS ───────────────────────────────────────────────────────────── */}
      {showNewModal && (
        <NewCampaignModal
          onClose={() => setShowNewModal(false)}
          onCreated={handleCreated}
        />
      )}

      {sendTarget && (
        <SendConfirmModal
          campaign={sendTarget}
          onClose={() => setSendTarget(null)}
          onSent={(id, result) => {
            handleSent(id, result);
          }}
        />
      )}
    </div>
  );
}
