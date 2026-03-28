'use client';

import React, { useState, useTransition, useRef, useEffect } from 'react';
import {
  Plus, X, Send, MessageSquare, Clock, ChevronDown,
  AlertTriangle, CheckCircle2, Circle, Loader2, Lock,
  User, Tag, TicketIcon, RefreshCw, InboxIcon,
} from 'lucide-react';
import {
  TicketRow,
  TicketDetail,
  createTicket,
  addMessage,
  updateTicketStatus,
  getTicketDetail,
} from './actions';

// ─── Types & constants ────────────────────────────────────────────────────────

type Status = 'OPEN' | 'IN_PROGRESS' | 'WAITING' | 'RESOLVED';
type Priority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';

const COLUMNS: { key: Status; label: string; color: string; bg: string; border: string; dot: string }[] = [
  {
    key: 'OPEN',
    label: 'Abiertos',
    color: 'text-blue-700 dark:text-blue-300',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    border: 'border-blue-200 dark:border-blue-800',
    dot: 'bg-blue-500',
  },
  {
    key: 'IN_PROGRESS',
    label: 'En progreso',
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
  {
    key: 'WAITING',
    label: 'En espera',
    color: 'text-purple-700 dark:text-purple-300',
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    border: 'border-purple-200 dark:border-purple-800',
    dot: 'bg-purple-500',
  },
  {
    key: 'RESOLVED',
    label: 'Resueltos',
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500',
  },
];

const PRIORITY_CONFIG: Record<Priority, { label: string; badge: string }> = {
  URGENT: { label: 'Urgente', badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-700' },
  HIGH:   { label: 'Alta',    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border border-orange-200 dark:border-orange-700' },
  MEDIUM: { label: 'Media',   badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700' },
  LOW:    { label: 'Baja',    badge: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border border-green-200 dark:border-green-700' },
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Abierto',
  IN_PROGRESS: 'En progreso',
  WAITING: 'En espera',
  RESOLVED: 'Resuelto',
  CLOSED: 'Cerrado',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: string }) {
  const cfg = PRIORITY_CONFIG[priority as Priority] ?? PRIORITY_CONFIG.MEDIUM;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${cfg.badge}`}>
      {cfg.label}
    </span>
  );
}

function TicketCard({
  ticket,
  selected,
  onClick,
}: {
  ticket: TicketRow;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg border p-3 space-y-2 transition-all duration-150 ${
        selected
          ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 dark:border-indigo-600 ring-1 ring-indigo-300 dark:ring-indigo-700'
          : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-600 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 leading-snug line-clamp-2">
          {ticket.title}
        </p>
        <PriorityBadge priority={ticket.priority} />
      </div>

      {ticket.customerName && (
        <p className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
          <User size={11} />
          {ticket.customerName}
        </p>
      )}

      <div className="flex items-center justify-between text-xs text-neutral-400 dark:text-neutral-500">
        <span className="flex items-center gap-1">
          <MessageSquare size={11} />
          {ticket.messageCount}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={11} />
          {timeAgo(ticket.createdAt)}
        </span>
      </div>
    </button>
  );
}

function KanbanColumn({
  col,
  tickets,
  selectedId,
  onSelectTicket,
}: {
  col: (typeof COLUMNS)[number];
  tickets: TicketRow[];
  selectedId: string | null;
  onSelectTicket: (id: string) => void;
}) {
  return (
    <div className={`flex flex-col rounded-xl border ${col.border} ${col.bg} min-h-[200px]`}>
      {/* Column header */}
      <div className={`flex items-center gap-2 px-3 py-2.5 border-b ${col.border}`}>
        <span className={`w-2 h-2 rounded-full ${col.dot}`} />
        <span className={`text-xs font-semibold uppercase tracking-wide ${col.color}`}>
          {col.label}
        </span>
        <span className={`ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full ${col.bg} ${col.color} border ${col.border}`}>
          {tickets.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2 p-2 flex-1">
        {tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-neutral-400 dark:text-neutral-600">
            <InboxIcon size={20} className="mb-1 opacity-40" />
            <span className="text-xs">Sin tickets</span>
          </div>
        ) : (
          tickets.map(t => (
            <TicketCard
              key={t.id}
              ticket={t}
              selected={selectedId === t.id}
              onClick={() => onSelectTicket(t.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function DetailPanel({
  tickets,
  selectedId,
  onClose,
  onTicketsUpdate,
}: {
  tickets: TicketRow[];
  selectedId: string;
  onClose: () => void;
  onTicketsUpdate: (updater: (prev: TicketRow[]) => TicketRow[]) => void;
}) {
  const [detail, setDetail] = useState<TicketDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [messageBody, setMessageBody] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sendingMessage, startSendMessage] = useTransition();
  const [updatingStatus, startStatusUpdate] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load ticket detail whenever selectedId changes
  useEffect(() => {
    let cancelled = false;
    setLoadingDetail(true);
    setDetail(null);
    setErrorMsg(null);

    getTicketDetail(selectedId).then(d => {
      if (!cancelled) {
        setDetail(d);
        setLoadingDetail(false);
      }
    }).catch(() => {
      if (!cancelled) {
        setErrorMsg('No se pudo cargar el ticket.');
        setLoadingDetail(false);
      }
    });

    return () => { cancelled = true; };
  }, [selectedId]);

  // Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [detail?.messages]);

  const selectedTicket = tickets.find(t => t.id === selectedId);

  function handleStatusChange(newStatus: string) {
    if (!detail) return;
    startStatusUpdate(async () => {
      try {
        await updateTicketStatus(selectedId, newStatus);
        setDetail(prev => prev ? { ...prev, status: newStatus } : prev);
        onTicketsUpdate(prev =>
          prev.map(t => t.id === selectedId ? { ...t, status: newStatus } : t)
        );
      } catch {
        setErrorMsg('Error al actualizar el estado.');
      }
    });
  }

  function handleSendMessage() {
    const body = messageBody.trim();
    if (!body || !detail) return;
    startSendMessage(async () => {
      try {
        await addMessage(selectedId, { body, isInternal });
        const updated = await getTicketDetail(selectedId);
        setDetail(updated);
        // Also sync status update in ticket list
        if (updated) {
          onTicketsUpdate(prev =>
            prev.map(t => t.id === selectedId
              ? { ...t, status: updated.status, messageCount: updated.messageCount, updatedAt: updated.updatedAt }
              : t
            )
          );
        }
        setMessageBody('');
        setIsInternal(false);
      } catch {
        setErrorMsg('Error al enviar el mensaje.');
      }
    });
  }

  const col = COLUMNS.find(c => c.key === (detail?.status as Status)) ?? COLUMNS[0];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
      {/* Panel header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60">
        <TicketIcon size={16} className="text-indigo-500 shrink-0" />
        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate flex-1">
          {selectedTicket?.title ?? 'Ticket'}
        </p>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500"
        >
          <X size={15} />
        </button>
      </div>

      {loadingDetail && (
        <div className="flex items-center justify-center flex-1 text-neutral-400">
          <Loader2 size={22} className="animate-spin" />
        </div>
      )}

      {!loadingDetail && !detail && (
        <div className="flex items-center justify-center flex-1 text-neutral-500 text-sm px-4 text-center">
          {errorMsg ?? 'No se encontró el ticket.'}
        </div>
      )}

      {!loadingDetail && detail && (
        <>
          {/* Meta bar */}
          <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 space-y-2">
            {errorMsg && (
              <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded px-2 py-1">
                {errorMsg}
              </p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <PriorityBadge priority={detail.priority} />
              {/* Status selector */}
              <div className="relative">
                <select
                  value={detail.status}
                  disabled={updatingStatus}
                  onChange={e => handleStatusChange(e.target.value)}
                  className={`appearance-none pl-2 pr-6 py-0.5 text-xs font-semibold rounded border ${col.border} ${col.color} ${col.bg} cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-400`}
                >
                  {Object.entries(STATUS_LABELS).map(([val, lbl]) => (
                    <option key={val} value={val}>{lbl}</option>
                  ))}
                </select>
                {updatingStatus
                  ? <Loader2 size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 animate-spin" />
                  : <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                }
              </div>
              {detail.customerName && (
                <span className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                  <User size={11} />
                  {detail.customerName}
                </span>
              )}
            </div>
            {detail.description && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                {detail.description}
              </p>
            )}
          </div>

          {/* Message thread */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
            {detail.messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-neutral-400 dark:text-neutral-600">
                <MessageSquare size={24} className="mb-2 opacity-40" />
                <p className="text-xs">Sin mensajes aún</p>
              </div>
            )}
            {detail.messages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col gap-0.5 ${msg.isInternal ? 'items-start' : 'items-end'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                    msg.isInternal
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-tl-none border border-neutral-200 dark:border-neutral-700'
                      : 'bg-indigo-600 text-white rounded-tr-none'
                  }`}
                >
                  {msg.isInternal && (
                    <div className="flex items-center gap-1 mb-1">
                      <Lock size={9} className="text-neutral-400" />
                      <span className="text-[10px] text-neutral-400 uppercase tracking-wide font-medium">
                        Nota interna
                      </span>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                </div>
                <div className="flex items-center gap-1.5 px-1">
                  <span className="text-[10px] text-neutral-400">
                    {msg.authorName}
                  </span>
                  <span className="text-[10px] text-neutral-400">·</span>
                  <span className="text-[10px] text-neutral-400">
                    {timeAgo(msg.createdAt)}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply box */}
          <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40 space-y-2">
            <textarea
              value={messageBody}
              onChange={e => setMessageBody(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSendMessage();
              }}
              placeholder="Escribe un mensaje... (Ctrl+Enter para enviar)"
              rows={3}
              className="w-full resize-none rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
            />
            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={e => setIsInternal(e.target.checked)}
                  className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-400"
                />
                <span className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                  <Lock size={11} />
                  Nota interna
                </span>
              </label>
              <button
                onClick={handleSendMessage}
                disabled={sendingMessage || !messageBody.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors"
              >
                {sendingMessage ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                Enviar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── New Ticket Modal ─────────────────────────────────────────────────────────

function NewTicketModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [customerText, setCustomerText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('El título es requerido'); return; }
    setError(null);

    startTransition(async () => {
      try {
        const id = await createTicket({
          title,
          description: description || undefined,
          priority,
        });
        onCreated(id);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al crear el ticket');
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-lg border border-neutral-200 dark:border-neutral-700">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <Plus size={18} className="text-indigo-500" />
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Nuevo ticket
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ej: Error en factura XML F-1042"
              className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Detalla el problema o solicitud..."
              rows={3}
              className="w-full resize-none rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Prioridad
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
                className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              >
                <option value="URGENT">Urgente</option>
                <option value="HIGH">Alta</option>
                <option value="MEDIUM">Media</option>
                <option value="LOW">Baja</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Cliente (opcional)
              </label>
              <input
                type="text"
                value={customerText}
                onChange={e => setCustomerText(e.target.value)}
                placeholder="Nombre del cliente"
                className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
            >
              {isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Crear ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── KPI Bar ──────────────────────────────────────────────────────────────────

function KpiBar({ tickets }: { tickets: TicketRow[] }) {
  const open = tickets.filter(t => t.status === 'OPEN').length;
  const inProgress = tickets.filter(t => t.status === 'IN_PROGRESS').length;
  const today = todayIso();
  const resolvedToday = tickets.filter(
    t => t.status === 'RESOLVED' && t.resolvedAt?.slice(0, 10) === today
  ).length;

  // Rough avg response: average age of open tickets in hours
  const openTickets = tickets.filter(t => t.status === 'OPEN');
  const avgHours = openTickets.length > 0
    ? Math.round(
        openTickets.reduce((sum, t) => {
          return sum + (Date.now() - new Date(t.createdAt).getTime()) / 3_600_000;
        }, 0) / openTickets.length
      )
    : 0;

  const kpis = [
    { label: 'Abiertos', value: open, icon: <Circle size={14} className="text-blue-500" />, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'En progreso', value: inProgress, icon: <RefreshCw size={14} className="text-amber-500" />, color: 'text-amber-600 dark:text-amber-400' },
    { label: 'Resueltos hoy', value: resolvedToday, icon: <CheckCircle2 size={14} className="text-emerald-500" />, color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Tiempo medio', value: avgHours > 0 ? `${avgHours}h` : '—', icon: <Clock size={14} className="text-purple-500" />, color: 'text-purple-600 dark:text-purple-400' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {kpis.map(kpi => (
        <div
          key={kpi.label}
          className="flex items-center gap-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 px-4 py-3"
        >
          <div className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800">
            {kpi.icon}
          </div>
          <div>
            <p className={`text-lg font-bold leading-none ${kpi.color}`}>{kpi.value}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{kpi.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SoporteClient({ initialTickets }: { initialTickets: TicketRow[] }) {
  const [tickets, setTickets] = useState<TicketRow[]>(initialTickets);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  // Group tickets by status
  const byStatus = (status: Status) => tickets.filter(t => t.status === status);

  function handleSelectTicket(id: string) {
    setSelectedId(prev => (prev === id ? null : id));
  }

  function handleNewCreated(id: string) {
    // Optimistically add a placeholder; revalidation will refresh data
    setShowNewModal(false);
    // Reload via a quick page refresh is ideal, but we'll just keep the list
    // until the next navigation. The server already revalidated the path.
    setSelectedId(id);
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-4 md:p-6 space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/40">
            <TicketIcon size={20} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 leading-tight">
              Mesa de Soporte
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Gestión de tickets de atención al cliente
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus size={16} />
          Nuevo ticket
        </button>
      </div>

      {/* KPIs */}
      <KpiBar tickets={tickets} />

      {/* Main layout: Kanban + Detail */}
      <div className={`flex gap-4 ${selectedId ? 'items-start' : ''}`}>
        {/* Kanban board */}
        <div className={`grid gap-3 transition-all duration-200 ${
          selectedId
            ? 'w-2/3 grid-cols-2'
            : 'w-full grid-cols-2 lg:grid-cols-4'
        }`}>
          {COLUMNS.map(col => (
            <KanbanColumn
              key={col.key}
              col={col}
              tickets={byStatus(col.key)}
              selectedId={selectedId}
              onSelectTicket={handleSelectTicket}
            />
          ))}
        </div>

        {/* Detail panel */}
        {selectedId && (
          <div className="w-1/3 sticky top-4" style={{ maxHeight: 'calc(100vh - 7rem)' }}>
            <DetailPanel
              tickets={tickets}
              selectedId={selectedId}
              onClose={() => setSelectedId(null)}
              onTicketsUpdate={setTickets}
            />
          </div>
        )}
      </div>

      {/* Empty state */}
      {tickets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
          <div className="p-4 rounded-full bg-neutral-100 dark:bg-neutral-800">
            <TicketIcon size={32} className="text-neutral-400" />
          </div>
          <p className="text-lg font-semibold text-neutral-700 dark:text-neutral-300">
            Sin tickets de soporte
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm">
            Crea el primer ticket para comenzar a gestionar las solicitudes de tus clientes.
          </p>
          <button
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
          >
            <Plus size={15} />
            Crear primer ticket
          </button>
        </div>
      )}

      {/* New ticket modal */}
      {showNewModal && (
        <NewTicketModal
          onClose={() => setShowNewModal(false)}
          onCreated={handleNewCreated}
        />
      )}
    </div>
  );
}
