'use client';

/**
 * CIFRA — Portal del Cliente (Autoservicio Avanzado)
 * =====================================================
 * FASE 27: Portal básico con lista de facturas
 * FASE 49: + Pago online Stripe, Estado de cuenta PDF,
 *           Soporte tab, historial de tickets
 */

import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  FileText, Download, CheckCircle2, Clock, XCircle,
  Building2, AlertTriangle, Loader2, ExternalLink,
  CreditCard, MessageSquare, Send, ChevronDown, ChevronUp,
  HeadphonesIcon, PlusCircle, RefreshCw,
} from 'lucide-react';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type InvoiceStatus = 'PAGADA' | 'PENDIENTE' | 'CANCELADA';
type ActiveTab = 'facturas' | 'soporte';

interface PortalInvoice {
  id: string;
  folio: string;
  fecha: string;
  concepto: string;
  total: number;
  moneda: string;
  uuid: string | null;
  paidAt: string | null;
  status: InvoiceStatus;
}

interface SupportMessage {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
}

interface SupportTicket {
  id: string;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
  messages: SupportMessage[];
}

interface PortalData {
  customer: { legalName: string; rfc: string };
  tenant: { name: string; rfc: string; logoUrl: string | null };
  invoices: PortalInvoice[];
  summary: { totalFacturado: number; totalPagado: number; totalPendiente: number };
  expiresAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; icon: React.ElementType; cls: string }> = {
  PAGADA:    { label: 'Pagada',    icon: CheckCircle2, cls: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' },
  PENDIENTE: { label: 'Pendiente', icon: Clock,        cls: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' },
  CANCELADA: { label: 'Cancelada', icon: XCircle,      cls: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500' },
};

const TICKET_STATUS: Record<string, { label: string; cls: string }> = {
  OPEN:        { label: 'Abierto',       cls: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' },
  IN_PROGRESS: { label: 'En progreso',   cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' },
  WAITING:     { label: 'En espera',     cls: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400' },
  RESOLVED:    { label: 'Resuelto',      cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' },
  CLOSED:      { label: 'Cerrado',       cls: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400' },
};

// ─── Componente principal ─────────────────────────────────────────────────────

export default function PortalPage() {
  const { token }       = useParams<{ token: string }>();
  const searchParams    = useSearchParams();
  const [data, setData] = useState<PortalData | null>(null);
  const [error, setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('facturas');

  // Stripe payment
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

  // Support tickets
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc]   = useState('');
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [ticketError, setTicketError] = useState<string | null>(null);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Paid confirmation banner
  const justPaid = searchParams.get('paid') === '1';

  // ── Load portal data ───────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`/api/portal/${token}/invoices`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? 'Error al cargar');
      }
      setData(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Load tickets ───────────────────────────────────────────────────────────
  const loadTickets = useCallback(async () => {
    setLoadingTickets(true);
    try {
      const res = await fetch(`/api/portal/${token}/tickets`);
      if (res.ok) {
        const j = await res.json();
        setTickets(j.tickets ?? []);
      }
    } finally {
      setLoadingTickets(false);
    }
  }, [token]);

  useEffect(() => {
    if (activeTab === 'soporte') loadTickets();
  }, [activeTab, loadTickets]);

  // ── Pay invoice ────────────────────────────────────────────────────────────
  async function handlePay(invoiceId: string) {
    setPayingId(invoiceId);
    setPayError(null);
    try {
      const res = await fetch(`/api/portal/${token}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? 'Error al procesar pago');
      window.location.href = j.checkoutUrl;
    } catch (e: any) {
      setPayError(e.message);
      setPayingId(null);
    }
  }

  // ── Create ticket ──────────────────────────────────────────────────────────
  async function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreatingTicket(true);
    setTicketError(null);
    try {
      const res = await fetch(`/api/portal/${token}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, description: newDesc }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? 'Error al crear ticket');
      }
      setNewTitle('');
      setNewDesc('');
      await loadTickets();
    } catch (e: any) {
      setTicketError(e.message);
    } finally {
      setCreatingTicket(false);
    }
  }

  // ── Reply to ticket ────────────────────────────────────────────────────────
  async function handleReply(ticketId: string) {
    if (!replyBody.trim()) return;
    setSendingReply(true);
    try {
      await fetch(`/api/portal/${token}/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: replyBody }),
      });
      setReplyBody('');
      await loadTickets();
    } finally {
      setSendingReply(false);
    }
  }

  // ── Loading / error states ──────────────────────────────────────────────────
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

      {/* Pago confirmado */}
      {justPaid && (
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl px-5 py-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
            ¡Pago procesado exitosamente! Tu factura ha sido marcada como pagada.
          </p>
        </div>
      )}

      {/* Error de pago */}
      {payError && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl px-5 py-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-sm font-medium text-red-700 dark:text-red-400">{payError}</p>
        </div>
      )}

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

      {/* TABS */}
      <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2">
        {[
          { id: 'facturas', label: 'Facturas',       icon: FileText       },
          { id: 'soporte',  label: 'Mesa de Soporte', icon: HeadphonesIcon },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ActiveTab)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === tab.id
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'bg-white dark:bg-neutral-900 text-neutral-500 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
            }`}
          >
            <tab.icon className="h-4 w-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB: FACTURAS ── */}
      {activeTab === 'facturas' && (
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
              href={`/api/portal/${token}/statement`}
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
                    <th className="px-5 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-sm">
                  {invoices.map((inv) => {
                    const sc   = STATUS_CONFIG[inv.status];
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
                          <div className="flex items-center justify-end gap-2">
                            {/* Pagar con tarjeta */}
                            {inv.status === 'PENDIENTE' && (
                              <button
                                onClick={() => handlePay(inv.id)}
                                disabled={payingId === inv.id}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black rounded-lg transition-all"
                              >
                                {payingId === inv.id
                                  ? <Loader2 className="h-3 w-3 animate-spin" />
                                  : <CreditCard className="h-3 w-3" />
                                }
                                Pagar
                              </button>
                            )}
                            {/* PDF CFDI */}
                            {inv.status !== 'CANCELADA' && (
                              <a
                                href={`/api/reports/cfdi/${inv.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-white text-xs font-bold"
                              >
                                <Download className="h-3.5 w-3.5" />
                                PDF
                              </a>
                            )}
                            {/* SAT verify */}
                            {inv.uuid && (
                              <a
                                href={`https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?id=${inv.uuid}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-neutral-400 hover:text-neutral-600 text-xs"
                                title="Verificar en el SAT"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
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
      )}

      {/* ── TAB: SOPORTE ── */}
      {activeTab === 'soporte' && (
        <div className="space-y-5">
          {/* Nuevo ticket */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm">
            <h3 className="font-black text-neutral-900 dark:text-white flex items-center gap-2 mb-4">
              <PlusCircle className="h-5 w-5 text-emerald-500" />
              Abrir nuevo ticket
            </h3>
            <form onSubmit={handleCreateTicket} className="space-y-3">
              <input
                type="text"
                placeholder="Asunto del ticket"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-2.5 text-sm font-medium text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <textarea
                placeholder="Describe tu problema o pregunta..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={3}
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-2.5 text-sm font-medium text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
              />
              {ticketError && (
                <p className="text-xs text-red-600">{ticketError}</p>
              )}
              <button
                type="submit"
                disabled={creatingTicket || !newTitle.trim()}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-black rounded-xl transition-all"
              >
                {creatingTicket ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Enviar ticket
              </button>
            </form>
          </div>

          {/* Historial de tickets */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="font-black text-neutral-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-neutral-400" />
                Mis tickets
                <span className="text-xs font-bold text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
                  {tickets.length}
                </span>
              </h3>
              <button onClick={loadTickets} disabled={loadingTickets} className="text-neutral-400 hover:text-neutral-600 p-1">
                <RefreshCw className={`h-4 w-4 ${loadingTickets ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loadingTickets ? (
              <div className="py-10 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-500 mx-auto" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="py-12 text-center">
                <MessageSquare className="h-8 w-8 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-500 text-sm">No tienes tickets de soporte.</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {tickets.map((ticket) => {
                  const ts = TICKET_STATUS[ticket.status] ?? TICKET_STATUS.OPEN;
                  const isExpanded = expandedTicket === ticket.id;
                  return (
                    <div key={ticket.id}>
                      <button
                        onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}
                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${ts.cls}`}>{ts.label}</span>
                          <span className="font-bold text-neutral-900 dark:text-white text-sm">{ticket.title}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-neutral-400">
                          <span>{fmtDate(ticket.createdAt)}</span>
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-5 pb-5 space-y-3">
                          {/* Messages */}
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {ticket.messages.map((msg) => (
                              <div key={msg.id} className="bg-neutral-50 dark:bg-neutral-800/60 rounded-xl px-4 py-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-black text-neutral-700 dark:text-neutral-300">{msg.authorName}</span>
                                  <span className="text-[10px] text-neutral-400">{fmtDate(msg.createdAt)}</span>
                                </div>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">{msg.body}</p>
                              </div>
                            ))}
                          </div>

                          {/* Reply */}
                          {ticket.status !== 'CLOSED' && (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Escribe un mensaje..."
                                value={expandedTicket === ticket.id ? replyBody : ''}
                                onChange={(e) => setReplyBody(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleReply(ticket.id)}
                                className="flex-1 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                              />
                              <button
                                onClick={() => handleReply(ticket.id)}
                                disabled={sendingReply || !replyBody.trim()}
                                className="p-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl transition-all"
                              >
                                {sendingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <p className="text-center text-xs text-neutral-400 pb-4">
        Portal de autoservicio · Generado por CIFRA ERP · Enlace válido hasta {fmtDate(data.expiresAt)}
      </p>
    </div>
  );
}
