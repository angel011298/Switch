'use client';

import { useState } from 'react';
import { Bell, AlertTriangle, CheckCircle2, Clock, Calendar, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { generateFiscalCalendar, dismissAlert } from './actions';

type Alert = { id: string; type: string; title: string; description: string; dueDate: string; daysAhead: number; status: string; channel: string };

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING:   { label: 'Pendiente', color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' },
  SENT:      { label: 'Enviada',   color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' },
  DISMISSED: { label: 'Descartada', color: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400' },
  OVERDUE:   { label: 'Vencida',   color: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' },
};

const TYPE_ICONS: Record<string, typeof Bell> = {
  IVA_MENSUAL: Bell, ISR_MENSUAL: Bell, IMSS_BIMESTRAL: Calendar,
  DIOT: CheckCircle2, DECLARACION_ANUAL: AlertTriangle, REPSE: Clock, NOM035: Clock,
};

function daysUntil(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function AlertasClient({ initialAlerts, currentYear }: { initialAlerts: Alert[]; currentYear: number }) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [generating, setGenerating] = useState(false);
  const [dismissingId, setDismissingId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  const today = new Date();
  const todayCount = alerts.filter(a => a.status === 'PENDING' && daysUntil(a.dueDate) <= 0).length;
  const weekCount = alerts.filter(a => a.status === 'PENDING' && daysUntil(a.dueDate) > 0 && daysUntil(a.dueDate) <= 7).length;
  const monthCount = alerts.filter(a => a.status === 'PENDING' && daysUntil(a.dueDate) > 7 && daysUntil(a.dueDate) <= 30).length;

  async function handleGenerate() {
    setGenerating(true); setMsg('');
    try {
      const result = await generateFiscalCalendar(currentYear);
      setMsg(`✅ Calendario ${currentYear} generado: ${result.created} obligaciones fiscales programadas`);
      // Reload page state
      window.location.reload();
    } catch (err) {
      setMsg(`❌ ${err instanceof Error ? err.message : 'Error'}`);
    } finally { setGenerating(false); }
  }

  async function handleDismiss(id: string) {
    setDismissingId(id);
    try {
      await dismissAlert(id);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'DISMISSED' } : a));
    } finally { setDismissingId(null); }
  }

  const active = alerts.filter(a => a.status !== 'DISMISSED');

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8 space-y-6">
      <header className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20">
            <Bell className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">Alertas Fiscales</h1>
            <p className="text-neutral-500 text-sm mt-1">Calendario de obligaciones automático con 7, 3 y 1 día de anticipación</p>
          </div>
        </div>
        <button onClick={handleGenerate} disabled={generating} className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl text-sm transition-colors disabled:opacity-50">
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Generar Calendario {currentYear}
        </button>
      </header>

      {msg && <div className={`p-4 rounded-2xl text-sm font-semibold ${msg.startsWith('✅') ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 border border-emerald-200 dark:border-emerald-500/20' : 'bg-red-50 dark:bg-red-500/10 text-red-700 border border-red-200 dark:border-red-500/20'}`}>{msg}</div>}

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-red-200 dark:border-red-500/20 border-l-4 border-l-red-500">
          <p className="text-xs font-black text-red-500 uppercase tracking-widest">Vencen Hoy</p>
          <p className="text-3xl font-black text-red-600 dark:text-red-400 mt-1">{todayCount}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-amber-200 dark:border-amber-500/20 border-l-4 border-l-amber-500">
          <p className="text-xs font-black text-amber-500 uppercase tracking-widest">Esta Semana</p>
          <p className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">{weekCount}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800">
          <p className="text-xs font-black text-neutral-500 uppercase tracking-widest">Este Mes</p>
          <p className="text-3xl font-black text-neutral-900 dark:text-white mt-1">{monthCount}</p>
        </div>
      </div>

      {active.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-16 flex flex-col items-center gap-4">
          <Bell className="h-12 w-12 text-neutral-300 dark:text-neutral-600" />
          <p className="font-black text-neutral-500">Sin alertas programadas</p>
          <p className="text-sm text-neutral-400">Haz clic en "Generar Calendario {currentYear}" para crear todas las alertas del año</p>
        </div>
      ) : (
        <div className="space-y-3">
          {active.map(a => {
            const days = daysUntil(a.dueDate);
            const Icon = TYPE_ICONS[a.type] ?? Bell;
            const cfg = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.PENDING;
            const urgency = days <= 0 ? 'border-l-red-500' : days <= 3 ? 'border-l-amber-500' : days <= 7 ? 'border-l-yellow-400' : 'border-l-neutral-300 dark:border-l-neutral-700';
            return (
              <div key={a.id} className={`bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 border-l-4 ${urgency} p-4 rounded-2xl flex items-center gap-4`}>
                <div className="bg-neutral-100 dark:bg-neutral-800 p-2 rounded-xl shrink-0">
                  <Icon className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-neutral-900 dark:text-white text-sm">{a.title}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">{a.description}</p>
                </div>
                <div className="shrink-0 flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs font-bold text-neutral-500">{new Date(a.dueDate).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    <p className={`text-xs font-black ${days <= 0 ? 'text-red-500' : days <= 7 ? 'text-amber-500' : 'text-neutral-400'}`}>
                      {days <= 0 ? `Venció hace ${Math.abs(days)}d` : days === 1 ? '¡Mañana!' : `En ${days} días`}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
                  <button onClick={() => handleDismiss(a.id)} disabled={dismissingId === a.id} className="text-neutral-300 dark:text-neutral-700 hover:text-neutral-500 dark:hover:text-neutral-400 transition-colors">
                    {dismissingId === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
