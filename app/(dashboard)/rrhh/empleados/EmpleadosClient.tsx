'use client';

/**
 * CIFRA — Catálogo de Empleados (Client)
 * FASE 34: KPIs, búsqueda, asistencia del día, clock-in/out
 */

import { useState, useTransition } from 'react';
import {
  Users, UserCheck, UserMinus, Search, Clock, LogIn, LogOut,
  FileText, CheckCircle2, Circle, Loader2, CalendarClock,
  Link2, Mail, Copy,
} from 'lucide-react';
import type { EmployeeRow, RrhhKpis } from '../actions';
import { clockIn, clockOut, generateEmployeePortalLink, sendEmployeePortalLinkToEmployee } from '../actions';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  initialEmployees: EmployeeRow[];
  kpis: RrhhKpis;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtMXN(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  icon: Icon,
  colorClass,
  bgClass,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
}) {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${bgClass}`}>
        <Icon className={`h-6 w-6 ${colorClass}`} />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{label}</p>
        <p className={`text-2xl font-black mt-0.5 ${colorClass}`}>{value}</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type FilterTab = 'todos' | 'activos' | 'inactivos';

export default function EmpleadosClient({ initialEmployees, kpis }: Props) {
  const [isPending, startTransition] = useTransition();
  const [employees, setEmployees] = useState<EmployeeRow[]>(initialEmployees);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<FilterTab>('todos');
  const [actionError, setActionError] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  // Portal del empleado: estado por empleado ('idle'|'loading'|'copied'|'sent'|'error')
  const [portalState, setPortalState] = useState<Record<string, string>>({});

  // ── Filter ──
  const filtered = employees.filter((e) => {
    const matchesTab =
      tab === 'todos' ? true :
      tab === 'activos' ? e.active :
      !e.active;

    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      e.name.toLowerCase().includes(q) ||
      e.position.toLowerCase().includes(q) ||
      (e.department ?? '').toLowerCase().includes(q);

    return matchesTab && matchesSearch;
  });

  // ── Clock In ──
  function handleClockIn(emp: EmployeeRow) {
    setActionError(null);
    setLoadingId(emp.id);
    startTransition(async () => {
      try {
        await clockIn(emp.id);
        // Optimistic update
        setEmployees((prev) =>
          prev.map((e) => (e.id === emp.id ? { ...e, attendanceToday: true } : e))
        );
      } catch (err: unknown) {
        setActionError(err instanceof Error ? err.message : 'Error al registrar entrada');
      } finally {
        setLoadingId(null);
      }
    });
  }

  // ── Clock Out ──
  function handleClockOut(emp: EmployeeRow) {
    setActionError(null);
    setLoadingId(emp.id);
    startTransition(async () => {
      try {
        await clockOut(emp.id);
        // Keep attendanceToday=true, clock-out is just a timestamp update
        setEmployees((prev) =>
          prev.map((e) => (e.id === emp.id ? { ...e } : e))
        );
      } catch (err: unknown) {
        setActionError(err instanceof Error ? err.message : 'Error al registrar salida');
      } finally {
        setLoadingId(null);
      }
    });
  }

  // ── Portal del Empleado ──
  function handleCopyPortalLink(emp: EmployeeRow) {
    setPortalState(s => ({ ...s, [emp.id]: 'loading' }));
    startTransition(async () => {
      try {
        const url = await generateEmployeePortalLink(emp.id);
        await navigator.clipboard.writeText(url);
        setPortalState(s => ({ ...s, [emp.id]: 'copied' }));
        setTimeout(() => setPortalState(s => ({ ...s, [emp.id]: 'idle' })), 3000);
      } catch {
        setPortalState(s => ({ ...s, [emp.id]: 'error' }));
        setTimeout(() => setPortalState(s => ({ ...s, [emp.id]: 'idle' })), 3000);
      }
    });
  }

  function handleSendPortalEmail(emp: EmployeeRow) {
    setPortalState(s => ({ ...s, [`${emp.id}_email`]: 'loading' }));
    startTransition(async () => {
      try {
        const result = await sendEmployeePortalLinkToEmployee(emp.id);
        setPortalState(s => ({ ...s, [`${emp.id}_email`]: result.sent ? 'sent' : 'copied' }));
        if (!result.sent && result.portalUrl) {
          await navigator.clipboard.writeText(result.portalUrl).catch(() => {});
        }
        setTimeout(() => setPortalState(s => ({ ...s, [`${emp.id}_email`]: 'idle' })), 3000);
      } catch {
        setPortalState(s => ({ ...s, [`${emp.id}_email`]: 'error' }));
        setTimeout(() => setPortalState(s => ({ ...s, [`${emp.id}_email`]: 'idle' })), 3000);
      }
    });
  }

  const tabCls = (t: FilterTab) =>
    `px-5 py-2 rounded-xl text-sm font-bold transition-all ${
      tab === t
        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
    }`;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* ── HEADER ── */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20">
              <Users className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">
                Catálogo de Empleados
              </h1>
              <p className="text-neutral-500 font-medium text-sm mt-1">
                Gestión de personal, asistencia del día y documentos.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-400 dark:text-neutral-500 font-medium">
            <CalendarClock className="h-4 w-4" />
            {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        </header>

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            label="Total Empleados"
            value={kpis.totalEmployees}
            icon={Users}
            colorClass="text-neutral-700 dark:text-neutral-300"
            bgClass="bg-neutral-100 dark:bg-neutral-800"
          />
          <KpiCard
            label="Activos"
            value={kpis.activeEmployees}
            icon={UserCheck}
            colorClass="text-emerald-600 dark:text-emerald-400"
            bgClass="bg-emerald-50 dark:bg-emerald-500/10"
          />
          <KpiCard
            label="Presentes Hoy"
            value={kpis.presentToday}
            icon={Clock}
            colorClass="text-blue-600 dark:text-blue-400"
            bgClass="bg-blue-50 dark:bg-blue-500/10"
          />
          <KpiCard
            label="Vacaciones Pend."
            value={kpis.pendingLeaves}
            icon={CalendarClock}
            colorClass="text-amber-600 dark:text-amber-400"
            bgClass="bg-amber-50 dark:bg-amber-500/10"
          />
        </div>

        {/* ── ERROR BANNER ── */}
        {actionError && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl px-5 py-3 text-sm font-medium text-red-700 dark:text-red-400 flex items-center justify-between">
            <span>{actionError}</span>
            <button
              onClick={() => setActionError(null)}
              className="text-red-400 hover:text-red-600 font-black ml-4 text-lg leading-none"
            >
              ×
            </button>
          </div>
        )}

        {/* ── FILTERS ── */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-2">
            <button onClick={() => setTab('todos')} className={tabCls('todos')}>
              Todos ({employees.length})
            </button>
            <button onClick={() => setTab('activos')} className={tabCls('activos')}>
              Activos ({employees.filter((e) => e.active).length})
            </button>
            <button onClick={() => setTab('inactivos')} className={tabCls('inactivos')}>
              Inactivos ({employees.filter((e) => !e.active).length})
            </button>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-3 py-2 rounded-xl w-full sm:w-auto sm:min-w-[260px]">
            <Search className="h-4 w-4 text-neutral-400 shrink-0" />
            <input
              type="text"
              placeholder="Buscar por nombre, puesto, depto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-sm font-medium text-neutral-900 dark:text-white flex-1 min-w-0"
            />
          </div>
        </div>

        {/* ── TABLE ── */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm">
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <Users className="h-12 w-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
              <p className="text-neutral-500 font-medium text-sm">
                {search ? 'Sin resultados para la búsqueda' : 'Sin empleados en esta categoría'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-neutral-50 dark:bg-black/40 border-b border-neutral-200 dark:border-neutral-800 text-[10px] uppercase tracking-widest text-neutral-500 font-black">
                  <tr>
                    <th className="px-6 py-3">Empleado</th>
                    <th className="px-6 py-3">Depto</th>
                    <th className="px-6 py-3 text-right">Salario</th>
                    <th className="px-6 py-3 text-center">Estado</th>
                    <th className="px-6 py-3 text-center">Asistencia hoy</th>
                    <th className="px-6 py-3 text-center">Docs</th>
                    <th className="px-6 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                  {filtered.map((emp) => {
                    const isLoading = loadingId === emp.id && isPending;
                    return (
                      <tr
                        key={emp.id}
                        className={`hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors ${
                          !emp.active ? 'opacity-50' : ''
                        }`}
                      >
                        {/* Nombre + Puesto */}
                        <td className="px-6 py-4">
                          <p className="font-bold text-neutral-900 dark:text-white">{emp.name}</p>
                          <p className="text-[11px] text-neutral-500 mt-0.5">{emp.position}</p>
                          {emp.email && (
                            <p className="text-[10px] text-neutral-400 mt-0.5">{emp.email}</p>
                          )}
                        </td>

                        {/* Depto */}
                        <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400 text-xs">
                          {emp.department ?? <span className="text-neutral-300 dark:text-neutral-600">—</span>}
                        </td>

                        {/* Salario */}
                        <td className="px-6 py-4 text-right">
                          <p className="font-bold text-neutral-900 dark:text-white text-xs">
                            {fmtMXN(emp.salary)}
                          </p>
                          <p className="text-[10px] text-neutral-400 mt-0.5">{emp.salaryType}</p>
                        </td>

                        {/* Estado activo/inactivo */}
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                              emp.active
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500'
                            }`}
                          >
                            {emp.active ? (
                              <><UserCheck className="h-3 w-3" /> Activo</>
                            ) : (
                              <><UserMinus className="h-3 w-3" /> Inactivo</>
                            )}
                          </span>
                        </td>

                        {/* Asistencia hoy */}
                        <td className="px-6 py-4 text-center">
                          {emp.attendanceToday ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                              <CheckCircle2 className="h-4 w-4" /> Presente
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-neutral-400 text-xs">
                              <Circle className="h-4 w-4" /> Sin registro
                            </span>
                          )}
                        </td>

                        {/* Docs count */}
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1 text-neutral-500 text-xs">
                            <FileText className="h-3.5 w-3.5" />
                            {emp.documentsCount}
                          </span>
                        </td>

                        {/* Acciones: clock-in / clock-out */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
                            ) : emp.active ? (
                              emp.attendanceToday ? (
                                <button
                                  onClick={() => handleClockOut(emp)}
                                  disabled={isPending}
                                  title="Registrar salida"
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 dark:text-amber-400 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 transition-colors disabled:opacity-40"
                                >
                                  <LogOut className="h-3.5 w-3.5" /> Salida
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleClockIn(emp)}
                                  disabled={isPending}
                                  title="Registrar entrada"
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 transition-colors disabled:opacity-40"
                                >
                                  <LogIn className="h-3.5 w-3.5" /> Entrada
                                </button>
                              )
                            ) : (
                              <span className="text-[10px] text-neutral-300 dark:text-neutral-700 font-medium">
                                Inactivo
                              </span>
                            )}

                            {/* Botones portal empleado — solo empleados activos */}
                            {emp.active && (
                              <>
                                <button
                                  onClick={() => handleCopyPortalLink(emp)}
                                  disabled={isPending || portalState[emp.id] === 'loading'}
                                  title="Copiar link del portal"
                                  className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-40
                                    ${portalState[emp.id] === 'copied'
                                      ? 'text-emerald-400 bg-emerald-500/10'
                                      : 'text-blue-400 bg-blue-500/10 hover:bg-blue-500/20'}`}
                                >
                                  {portalState[emp.id] === 'copied'
                                    ? <><CheckCircle2 className="h-3 w-3" /> Copiado</>
                                    : portalState[emp.id] === 'loading'
                                    ? <Loader2 className="h-3 w-3 animate-spin" />
                                    : <><Copy className="h-3 w-3" /> Link</>}
                                </button>

                                {emp.email && (
                                  <button
                                    onClick={() => handleSendPortalEmail(emp)}
                                    disabled={isPending || portalState[`${emp.id}_email`] === 'loading'}
                                    title={`Enviar portal por email a ${emp.email}`}
                                    className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-40
                                      ${portalState[`${emp.id}_email`] === 'sent'
                                        ? 'text-emerald-400 bg-emerald-500/10'
                                        : 'text-violet-400 bg-violet-500/10 hover:bg-violet-500/20'}`}
                                  >
                                    {portalState[`${emp.id}_email`] === 'sent'
                                      ? <><CheckCircle2 className="h-3 w-3" /> Enviado</>
                                      : portalState[`${emp.id}_email`] === 'loading'
                                      ? <Loader2 className="h-3 w-3 animate-spin" />
                                      : <><Mail className="h-3 w-3" /> Email</>}
                                  </button>
                                )}
                              </>
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

          {/* Footer row count */}
          {filtered.length > 0 && (
            <div className="px-6 py-3 border-t border-neutral-100 dark:border-neutral-800/50 text-[11px] text-neutral-400 font-medium">
              Mostrando {filtered.length} de {employees.length} empleados
              {kpis.expiringSoonDocs > 0 && (
                <span className="ml-4 text-amber-500 font-bold">
                  · {kpis.expiringSoonDocs} documento(s) próximo(s) a vencer
                </span>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
