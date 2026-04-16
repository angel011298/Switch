'use client';

import { useState, useTransition } from 'react';
import {
  createManualAuditEvent,
  MANUAL_EVENT_ACTIONS,
} from '@/app/(dashboard)/admin/event-log-actions';
import {
  ClipboardList, X, AlertCircle, Loader2, CheckCircle2,
  Calendar, MapPin, Tag, FileText, Clock
} from 'lucide-react';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Tenant {
  id: string;
  name: string;
  rfc: string | null;
}

interface Props {
  tenants: Tenant[];
  preselectedTenantId?: string;
  onClose: () => void;
  onCreated: () => void;
}

// ─── Agrupar acciones ─────────────────────────────────────────────────────────

const ACTION_GROUPS = MANUAL_EVENT_ACTIONS.reduce<
  Record<string, { value: string; label: string }[]>
>((acc, item) => {
  if (!acc[item.group]) acc[item.group] = [];
  acc[item.group].push({ value: item.value, label: item.label });
  return acc;
}, {});

const SEVERITY_OPTIONS = [
  { value: 'info',     label: 'Info',     color: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-500/10   border-blue-200 dark:border-blue-500/20' },
  { value: 'warning',  label: 'Warning',  color: 'text-amber-600',  bg: 'bg-amber-50 dark:bg-amber-500/10  border-amber-200 dark:border-amber-500/20' },
  { value: 'critical', label: 'Critical', color: 'text-red-600',    bg: 'bg-red-50 dark:bg-red-500/10     border-red-200 dark:border-red-500/20' },
];

// ─── Componente ───────────────────────────────────────────────────────────────

export default function ManualEventLogModal({
  tenants,
  preselectedTenantId,
  onClose,
  onCreated,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fecha/hora por defecto = ahora
  const nowDate = new Date();
  const localDate = nowDate.toISOString().slice(0, 10);
  const localTime = nowDate.toTimeString().slice(0, 5);

  const [tenantId,   setTenantId]   = useState(preselectedTenantId ?? '');
  const [action,     setAction]     = useState('');
  const [resource,   setResource]   = useState('Tenant');
  const [resourceId, setResourceId] = useState('');
  const [eventDateStr, setEventDateStr] = useState(localDate);
  const [eventTimeStr, setEventTimeStr] = useState(localTime);
  const [severity,   setSeverity]   = useState<'info' | 'warning' | 'critical'>('info');
  const [notes,      setNotes]      = useState('');
  const [ip,         setIp]         = useState('');
  const [location,   setLocation]   = useState('');

  const selectedAction = MANUAL_EVENT_ACTIONS.find((a) => a.value === action);

  const handleSubmit = () => {
    setError(null);
    if (!tenantId) { setError('Selecciona el tenant.'); return; }
    if (!action)   { setError('Selecciona la acción del evento.'); return; }
    if (!notes.trim()) { setError('Las notas son requeridas.'); return; }

    // Construir ISO desde fecha + hora local
    const eventDateISO = new Date(`${eventDateStr}T${eventTimeStr}:00`).toISOString();

    startTransition(async () => {
      const result = await createManualAuditEvent({
        tenantId,
        action,
        resource,
        resourceId: resourceId || undefined,
        eventDate: eventDateISO,
        severity,
        manualNotes: notes,
        ip: ip || undefined,
        location: location || undefined,
      });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onCreated();
        }, 1200);
      } else {
        setError(result.error ?? 'Error desconocido');
      }
    });
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white dark:bg-neutral-900 rounded-[2rem] p-10 flex flex-col items-center gap-4 border border-neutral-200 dark:border-neutral-800 shadow-2xl">
          <div className="bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-full">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
          <p className="text-lg font-black text-neutral-900 dark:text-white">Evento registrado</p>
          <p className="text-sm text-neutral-500">El evento fue asentado en la auditoría.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-xl max-h-[90vh] rounded-[2rem] shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-950 text-white rounded-t-[2rem] shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-amber-400 p-2 rounded-xl">
              <ClipboardList className="h-5 w-5 text-neutral-950" />
            </div>
            <div>
              <h2 className="text-lg font-black">Registro de Evento Manual</h2>
              <p className="text-xs text-amber-400 font-bold uppercase tracking-widest">
                Auditoría Retroactiva · Super Admin
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Aviso */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-200 dark:border-amber-500/20">
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
              El campo <strong>Fecha del evento</strong> puede ser retroactivo (pasado). El sistema registra
              automáticamente el <strong>created_at</strong> real de esta entrada.
            </p>
          </div>

          {/* Tenant */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              Tenant *
            </label>
            <select
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              className="input-field"
            >
              <option value="">Seleccionar tenant...</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}{t.rfc ? ` — ${t.rfc}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha y hora del evento */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> Fecha y Hora del Evento *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={eventDateStr}
                onChange={(e) => setEventDateStr(e.target.value)}
                className="input-field"
              />
              <input
                type="time"
                value={eventTimeStr}
                onChange={(e) => setEventTimeStr(e.target.value)}
                className="input-field"
              />
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Sin límite de tiempo en el pasado. Ingresa la fecha real en que ocurrió el evento.
            </p>
          </div>

          {/* Tipo de acción */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1">
              <Tag className="h-3.5 w-3.5" /> Tipo de Evento *
            </label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="input-field"
            >
              <option value="">Seleccionar tipo de evento...</option>
              {Object.entries(ACTION_GROUPS).map(([group, items]) => (
                <optgroup key={group} label={group}>
                  {items.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Recurso */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Recurso
              </label>
              <select
                value={resource}
                onChange={(e) => setResource(e.target.value)}
                className="input-field"
              >
                {['Tenant', 'User', 'Subscription', 'Invoice', 'Module', 'Employee', 'Payment', 'Security', 'General'].map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                ID del Recurso
              </label>
              <input
                type="text"
                value={resourceId}
                onChange={(e) => setResourceId(e.target.value)}
                placeholder="UUID o referencia (opcional)"
                className="input-field text-xs font-mono"
              />
            </div>
          </div>

          {/* Severidad */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-2">
              Severidad *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {SEVERITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSeverity(opt.value as any)}
                  className={`py-2 rounded-xl border-2 text-xs font-bold transition-all ${
                    severity === opt.value
                      ? `${opt.bg} border-current ${opt.color}`
                      : 'border-neutral-200 dark:border-neutral-700 text-neutral-500'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" /> Notas / Descripción *
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Describe el evento con detalle: qué pasó, quién estuvo involucrado, referencias o número de transferencia, etc."
              className="input-field resize-none"
            />
          </div>

          {/* Datos opcionales */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> Ubicación (opcional)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ciudad, País"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                IP (opcional)
              </label>
              <input
                type="text"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                placeholder="192.168.1.1"
                className="input-field font-mono"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-200 dark:border-red-500/20">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
              <p className="text-xs text-red-700 dark:text-red-300 font-medium">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-neutral-200 dark:border-neutral-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || !tenantId || !action || !notes.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-amber-400 text-neutral-950 text-sm font-black rounded-xl disabled:opacity-40 hover:bg-amber-500 transition-colors shadow-lg shadow-amber-400/25"
          >
            {isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Registrando...</>
            ) : (
              <><ClipboardList className="h-4 w-4" /> Registrar Evento</>
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        .input-field {
          width: 100%;
          padding: 0.625rem 0.875rem;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: #111827;
          outline: none;
          transition: all 0.15s;
        }
        .input-field:focus {
          border-color: #f59e0b;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
        }
        :global(.dark) .input-field {
          background: #0a0a0a;
          border-color: #262626;
          color: white;
        }
        :global(.dark) .input-field:focus {
          border-color: #f59e0b;
        }
      `}</style>
    </div>
  );
}
