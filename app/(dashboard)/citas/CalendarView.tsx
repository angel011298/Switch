'use client';

/**
 * CIFRA — Calendario Nativo
 * ==========================
 * FASE 30: Vista mensual/semanal con CalendarEvent desde API.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Calendar, ChevronLeft, ChevronRight, Plus, X, Loader2,
  Clock, FileText, Users, Package, Zap, Edit3, Trash2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalEvent {
  id: string;
  title: string;
  description: string | null;
  start: string;
  end: string;
  allDay: boolean;
  type: string;
  color: string;
  relatedId: string | null;
  relatedType: string | null;
}

type ViewMode = 'month' | 'week';

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  MANUAL:        { label: 'Manual',           color: '#6366f1', icon: Clock },
  INVOICE_DUE:   { label: 'Vencimiento CFDI', color: '#ef4444', icon: FileText },
  PAYROLL_DATE:  { label: 'Nómina',           color: '#10b981', icon: Users },
  DEAL_FOLLOWUP: { label: 'Seguimiento CRM',  color: '#f59e0b', icon: Zap },
  DELIVERY:      { label: 'Entrega',          color: '#3b82f6', icon: Package },
};

const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const HOUR_SLOTS = Array.from({ length: 24 }, (_, i) => i);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

// ─── Modal de Evento ──────────────────────────────────────────────────────────

function EventModal({
  event,
  defaultDate,
  onClose,
  onSave,
  onDelete,
}: {
  event: CalEvent | null;
  defaultDate: Date;
  onClose: () => void;
  onSave: (data: Partial<CalEvent>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}) {
  const [title, setTitle] = useState(event?.title ?? '');
  const [description, setDescription] = useState(event?.description ?? '');
  const [start, setStart] = useState(
    event?.start ? event.start.slice(0, 16) : new Date(defaultDate.setHours(9, 0, 0, 0)).toISOString().slice(0, 16)
  );
  const [end, setEnd] = useState(
    event?.end ? event.end.slice(0, 16) : new Date(defaultDate.setHours(10, 0, 0, 0)).toISOString().slice(0, 16)
  );
  const [type, setType] = useState(event?.type ?? 'MANUAL');
  const [allDay, setAllDay] = useState(event?.allDay ?? false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSave({ id: event?.id, title, description, start, end, allDay, type, color: TYPE_CONFIG[type]?.color });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!event?.id || !onDelete) return;
    setSaving(true);
    try {
      await onDelete(event.id);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-lg font-black text-neutral-900 dark:text-white">
            {event ? 'Editar evento' : 'Nuevo evento'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <X className="h-5 w-5 text-neutral-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Título */}
          <div>
            <label className="text-xs font-black text-neutral-500 uppercase tracking-widest block mb-2">Título *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ej: Reunión con cliente"
              className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              autoFocus
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="text-xs font-black text-neutral-500 uppercase tracking-widest block mb-2">Tipo</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setType(key)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                    type === key
                      ? 'border-transparent text-white'
                      : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                  }`}
                  style={type === key ? { backgroundColor: cfg.color } : {}}
                >
                  <cfg.icon className="h-3.5 w-3.5" />
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Todo el día */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} className="rounded" />
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Todo el día</span>
          </label>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-black text-neutral-500 uppercase tracking-widest block mb-2">Inicio</label>
              <input
                type={allDay ? 'date' : 'datetime-local'}
                value={allDay ? start.slice(0, 10) : start}
                onChange={e => setStart(allDay ? e.target.value : e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-black text-neutral-500 uppercase tracking-widest block mb-2">Fin</label>
              <input
                type={allDay ? 'date' : 'datetime-local'}
                value={allDay ? end.slice(0, 10) : end}
                onChange={e => setEnd(allDay ? e.target.value : e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="text-xs font-black text-neutral-500 uppercase tracking-widest block mb-2">Notas</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="Descripción opcional..."
              className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
        </div>

        <div className="p-6 pt-0 flex items-center justify-between gap-3">
          {event && onDelete && (
            confirmDelete ? (
              <div className="flex gap-2">
                <button onClick={handleDelete} disabled={saving} className="px-3 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors">
                  Confirmar
                </button>
                <button onClick={() => setConfirmDelete(false)} className="px-3 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-sm font-bold rounded-xl">
                  Cancelar
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            )
          )}
          <div className="flex gap-3 ml-auto">
            <button onClick={onClose} className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold text-sm rounded-xl hover:bg-neutral-200 transition-colors">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim() || saving}
              className="px-6 py-2 bg-indigo-600 text-white font-black text-sm rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {event ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function CalendarView() {
  const [view, setView] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [editingEvent, setEditingEvent] = useState<CalEvent | null>(null);

  // Compute range for fetching
  const fetchRange = useCallback(() => {
    if (view === 'month') {
      const from = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const to   = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
      return { from: from.toISOString(), to: to.toISOString() };
    } else {
      const weekStart = startOfWeek(currentDate);
      const weekEnd   = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
      return { from: weekStart.toISOString(), to: weekEnd.toISOString() };
    }
  }, [view, currentDate]);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const { from, to } = fetchRange();
      const res = await fetch(`/api/calendar?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('[Calendar] load error', e);
    } finally {
      setLoading(false);
    }
  }, [fetchRange]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  async function handleSave(data: Partial<CalEvent>) {
    if (data.id) {
      await fetch(`/api/calendar/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } else {
      await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    }
    await loadEvents();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/calendar/${id}`, { method: 'DELETE' });
    await loadEvents();
  }

  function navigate(dir: -1 | 1) {
    const d = new Date(currentDate);
    if (view === 'month') {
      d.setMonth(d.getMonth() + dir);
    } else {
      d.setDate(d.getDate() + dir * 7);
    }
    setCurrentDate(d);
  }

  function openCreate(date: Date) {
    setSelectedDate(date);
    setEditingEvent(null);
    setModalOpen(true);
  }

  function openEdit(event: CalEvent) {
    setEditingEvent(event);
    setModalOpen(true);
  }

  // ── MONTH VIEW ──────────────────────────────────────────────────────────────

  function renderMonthView() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    const cells: (Date | null)[] = [
      ...Array(firstDay).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
    ];

    // Pad to 6 rows × 7 cols
    while (cells.length < 42) cells.push(null);

    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-neutral-200 dark:border-neutral-800">
          {DAYS_ES.map(d => (
            <div key={d} className="py-2 text-center text-[10px] font-black text-neutral-400 uppercase tracking-widest">
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 grid grid-cols-7 grid-rows-6 overflow-hidden">
          {cells.slice(0, 42).map((date, i) => {
            const dayEvents = date ? events.filter(e => isSameDay(new Date(e.start), date)) : [];
            const isToday = date ? isSameDay(date, today) : false;
            const isCurrentMonth = date?.getMonth() === month;

            return (
              <div
                key={i}
                onClick={() => date && openCreate(date)}
                className={`border-r border-b border-neutral-100 dark:border-neutral-800/50 p-1.5 overflow-hidden cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors min-h-[80px] ${
                  !isCurrentMonth ? 'opacity-30' : ''
                }`}
              >
                {date && (
                  <>
                    <div className={`text-xs font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday
                        ? 'bg-indigo-600 text-white'
                        : 'text-neutral-700 dark:text-neutral-300'
                    }`}>
                      {date.getDate()}
                    </div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map(ev => (
                        <div
                          key={ev.id}
                          onClick={e => { e.stopPropagation(); openEdit(ev); }}
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80"
                          style={{ backgroundColor: ev.color + '33', color: ev.color }}
                        >
                          {ev.allDay ? '' : formatTime(ev.start) + ' '}
                          {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-[10px] text-neutral-400 pl-1">+{dayEvents.length - 3} más</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── WEEK VIEW ───────────────────────────────────────────────────────────────

  function renderWeekView() {
    const weekStart = startOfWeek(currentDate);
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
    const today = new Date();

    return (
      <div className="flex-1 overflow-auto">
        {/* Day headers */}
        <div className="grid grid-cols-8 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 bg-white dark:bg-neutral-900 z-10">
          <div className="w-12" />
          {days.map(d => (
            <div key={d.toISOString()} className={`py-2 text-center border-l border-neutral-100 dark:border-neutral-800 ${
              isSameDay(d, today) ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
            }`}>
              <p className="text-[10px] font-black text-neutral-400 uppercase">{DAYS_ES[d.getDay()]}</p>
              <p className={`text-lg font-black ${isSameDay(d, today) ? 'text-indigo-600' : 'text-neutral-900 dark:text-white'}`}>
                {d.getDate()}
              </p>
            </div>
          ))}
        </div>

        {/* Hour rows */}
        <div>
          {HOUR_SLOTS.map(hour => (
            <div key={hour} className="grid grid-cols-8 border-b border-neutral-50 dark:border-neutral-800/30 min-h-[50px]">
              <div className="w-12 px-2 pt-1 text-[10px] text-neutral-400 font-medium">
                {hour === 0 ? '' : `${hour}:00`}
              </div>
              {days.map(day => {
                const hourEvents = events.filter(e => {
                  const start = new Date(e.start);
                  return isSameDay(start, day) && start.getHours() === hour;
                });
                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => {
                      const d = new Date(day);
                      d.setHours(hour, 0, 0, 0);
                      openCreate(d);
                    }}
                    className={`border-l border-neutral-100 dark:border-neutral-800 px-1 py-0.5 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/20 transition-colors ${
                      isSameDay(day, today) ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''
                    }`}
                  >
                    {hourEvents.map(ev => (
                      <div
                        key={ev.id}
                        onClick={e => { e.stopPropagation(); openEdit(ev); }}
                        className="text-[10px] font-semibold px-1.5 py-1 rounded mb-0.5 cursor-pointer hover:opacity-80 truncate"
                        style={{ backgroundColor: ev.color + '33', color: ev.color, borderLeft: `2px solid ${ev.color}` }}
                      >
                        {ev.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── HEADER TITLE ────────────────────────────────────────────────────────────
  const headerTitle = view === 'month'
    ? `${MONTHS_ES[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    : (() => {
        const ws = startOfWeek(currentDate);
        const we = new Date(ws.getTime() + 6 * 86400000);
        return `${ws.getDate()} – ${we.getDate()} ${MONTHS_ES[we.getMonth()]} ${we.getFullYear()}`;
      })();

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">

      {/* TOOLBAR */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500/10 p-2.5 rounded-2xl border border-indigo-500/20">
            <Calendar className="h-6 w-6 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-xl font-black text-neutral-900 dark:text-white">Calendario</h1>
            <p className="text-sm text-neutral-500 font-medium">{headerTitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1">
            {(['month', 'week'] as ViewMode[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all capitalize ${
                  view === v
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                {v === 'month' ? 'Mes' : 'Semana'}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
              <ChevronLeft className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1.5 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              Hoy
            </button>
            <button onClick={() => navigate(1)} className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
              <ChevronRight className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
            </button>
          </div>

          {/* New event */}
          <button
            onClick={() => openCreate(new Date())}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-indigo-500/20"
          >
            <Plus className="h-4 w-4" />
            Nuevo evento
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-6 py-2 border-b border-neutral-100 dark:border-neutral-800/50 overflow-x-auto shrink-0">
        {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5 shrink-0">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
            <span className="text-[10px] font-medium text-neutral-500">{cfg.label}</span>
          </div>
        ))}
      </div>

      {/* Calendar body */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        view === 'month' ? renderMonthView() : renderWeekView()
      )}

      {/* Modal */}
      {modalOpen && (
        <EventModal
          event={editingEvent}
          defaultDate={selectedDate}
          onClose={() => { setModalOpen(false); setEditingEvent(null); }}
          onSave={handleSave}
          onDelete={editingEvent ? handleDelete : undefined}
        />
      )}
    </div>
  );
}
