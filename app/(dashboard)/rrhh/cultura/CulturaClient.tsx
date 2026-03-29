'use client';

import { useState, useTransition } from 'react';
import type { LeaveRequestRow, EmployeeRow } from '../actions';
import { createLeaveRequest, approveLeaveRequest, rejectLeaveRequest } from '../actions';

type TabFilter = 'TODAS' | 'PENDING' | 'APPROVED' | 'REJECTED';

interface RejectState {
  requestId: string;
  reason: string;
}

interface NewRequestForm {
  employeeId: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
}

const LEAVE_TYPE_LABELS: Record<string, string> = {
  VACACIONES: 'Vacaciones',
  PERMISO: 'Permiso',
  INCAPACIDAD: 'Incapacidad',
  DUELO: 'Duelo',
};

const LEAVE_TYPE_CLASSES: Record<string, string> = {
  VACACIONES: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
  PERMISO: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300',
  INCAPACIDAD: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300',
  DUELO: 'bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
};

const STATUS_CLASSES: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300',
  APPROVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
};

function calcDays(start: string, end: string): number {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  if (e < s) return 0;
  return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

function isThisMonth(dateStr: string): boolean {
  const now = new Date();
  const d = new Date(dateStr);
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface Props {
  initialRequests: LeaveRequestRow[];
  employees: EmployeeRow[];
}

export default function CulturaClient({ initialRequests, employees }: Props) {
  const [requests, setRequests] = useState<LeaveRequestRow[]>(initialRequests);
  const [activeTab, setActiveTab] = useState<TabFilter>('TODAS');
  const [showModal, setShowModal] = useState(false);
  const [rejectState, setRejectState] = useState<RejectState | null>(null);
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState<NewRequestForm>({
    employeeId: '',
    type: 'VACACIONES',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [formError, setFormError] = useState('');

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const approvedThisMonth = requests.filter(
    (r) => r.status === 'APPROVED' && isThisMonth(r.createdAt)
  ).length;
  const rejectedCount = requests.filter((r) => r.status === 'REJECTED').length;

  const filtered = activeTab === 'TODAS' ? requests : requests.filter((r) => r.status === activeTab);

  const TABS: { id: TabFilter; label: string }[] = [
    { id: 'TODAS', label: 'Todas' },
    { id: 'PENDING', label: 'Pendientes' },
    { id: 'APPROVED', label: 'Aprobadas' },
    { id: 'REJECTED', label: 'Rechazadas' },
  ];

  function handleApprove(id: string) {
    startTransition(async () => {
      await approveLeaveRequest(id);
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: 'APPROVED', approvedAt: new Date().toISOString() } : r
        )
      );
    });
  }

  function handleRejectSubmit(id: string, reason: string) {
    startTransition(async () => {
      await rejectLeaveRequest(id, reason || undefined);
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: 'REJECTED', rejectedReason: reason } : r
        )
      );
      setRejectState(null);
    });
  }

  async function handleCreate() {
    if (!form.employeeId) { setFormError('Selecciona un empleado.'); return; }
    if (!form.startDate || !form.endDate) { setFormError('Ingresa fechas de inicio y fin.'); return; }
    if (new Date(form.endDate) < new Date(form.startDate)) { setFormError('La fecha fin debe ser igual o posterior al inicio.'); return; }
    setFormError('');
    startTransition(async () => {
      const emp = employees.find((e) => e.id === form.employeeId);
      const id = await createLeaveRequest({
        employeeId: form.employeeId,
        type: form.type,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason || undefined,
      });
      const newRow: LeaveRequestRow = {
        id,
        employeeId: form.employeeId,
        employeeName: emp?.name ?? '—',
        type: form.type,
        startDate: form.startDate,
        endDate: form.endDate,
        days: calcDays(form.startDate, form.endDate),
        reason: form.reason || null,
        status: 'PENDING',
        approvedAt: null,
        rejectedReason: null,
        createdAt: new Date().toISOString(),
      };
      setRequests((prev) => [newRow, ...prev]);
      setShowModal(false);
      setForm({ employeeId: '', type: 'VACACIONES', startDate: '', endDate: '', reason: '' });
    });
  }

  const previewDays = form.startDate && form.endDate ? calcDays(form.startDate, form.endDate) : null;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
          <div>
            <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">Vacaciones y Permisos</h1>
            <p className="text-neutral-500 font-medium text-sm mt-1">
              Gestión de solicitudes de ausencia, aprobaciones y control de días.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-black rounded-xl transition-all shadow-lg shadow-pink-500/20 text-sm"
          >
            + Nueva Solicitud
          </button>
        </header>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-yellow-200 dark:border-yellow-800/50 border-l-4 border-l-yellow-400 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Pendientes de Aprobar</p>
              <p className="text-3xl font-black text-yellow-600 dark:text-yellow-400 mt-1">{pendingCount}</p>
            </div>
            <div className="p-3 bg-yellow-50 dark:bg-yellow-500/10 rounded-xl">
              <svg className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 border-l-4 border-l-emerald-500 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Aprobadas Este Mes</p>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{approvedThisMonth}</p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
              <svg className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-red-200 dark:border-red-800/50 border-l-4 border-l-red-500 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Rechazadas</p>
              <p className="text-3xl font-black text-red-600 dark:text-red-400 mt-1">{rejectedCount}</p>
            </div>
            <div className="p-3 bg-red-50 dark:bg-red-500/10 rounded-xl">
              <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-pink-600 text-white shadow-md shadow-pink-500/20'
                  : 'bg-white dark:bg-neutral-900 text-neutral-500 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 text-[10px] uppercase text-neutral-500 tracking-widest font-black">
                <tr>
                  <th className="p-4">Empleado</th>
                  <th className="p-4">Tipo</th>
                  <th className="p-4">Desde</th>
                  <th className="p-4">Hasta</th>
                  <th className="p-4 text-center">Días</th>
                  <th className="p-4">Motivo</th>
                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-neutral-400 font-medium">
                      No hay solicitudes en esta categoría.
                    </td>
                  </tr>
                )}
                {filtered.map((req) => (
                  <tr key={req.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-neutral-900 dark:text-white">{req.employeeName}</p>
                      <p className="text-[10px] text-neutral-400 mt-0.5 font-mono">{formatDate(req.createdAt)}</p>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${LEAVE_TYPE_CLASSES[req.type] ?? 'bg-neutral-100 text-neutral-600'}`}>
                        {LEAVE_TYPE_LABELS[req.type] ?? req.type}
                      </span>
                    </td>
                    <td className="p-4 text-neutral-700 dark:text-neutral-300 font-medium">{formatDate(req.startDate)}</td>
                    <td className="p-4 text-neutral-700 dark:text-neutral-300 font-medium">{formatDate(req.endDate)}</td>
                    <td className="p-4 text-center">
                      <span className="font-black text-neutral-900 dark:text-white">{req.days}</span>
                    </td>
                    <td className="p-4 max-w-[200px]">
                      <p className="text-neutral-600 dark:text-neutral-400 truncate text-xs">{req.reason ?? '—'}</p>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${STATUS_CLASSES[req.status] ?? 'bg-neutral-100 text-neutral-600'}`}>
                        {STATUS_LABELS[req.status] ?? req.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {req.status === 'PENDING' && (
                        <div className="flex flex-col gap-1 items-center min-w-[160px]">
                          {rejectState?.requestId === req.id ? (
                            <div className="w-full space-y-1">
                              <input
                                className="w-full text-xs border border-neutral-300 dark:border-neutral-700 rounded-lg px-2 py-1 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder-neutral-400 outline-none focus:ring-2 focus:ring-red-400"
                                placeholder="Motivo (opcional)"
                                value={rejectState.reason}
                                onChange={(e) => setRejectState({ ...rejectState, reason: e.target.value })}
                              />
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleRejectSubmit(req.id, rejectState.reason)}
                                  disabled={isPending}
                                  className="flex-1 text-[10px] font-black bg-red-600 hover:bg-red-700 text-white py-1 rounded-lg transition-colors disabled:opacity-60"
                                >
                                  Confirmar
                                </button>
                                <button
                                  onClick={() => setRejectState(null)}
                                  className="flex-1 text-[10px] font-black bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 py-1 rounded-lg transition-colors"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleApprove(req.id)}
                                disabled={isPending}
                                className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-black bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:hover:bg-emerald-500/30 text-emerald-700 dark:text-emerald-400 rounded-lg transition-colors disabled:opacity-60"
                              >
                                ✓ Aprobar
                              </button>
                              <button
                                onClick={() => setRejectState({ requestId: req.id, reason: '' })}
                                disabled={isPending}
                                className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-black bg-red-100 hover:bg-red-200 dark:bg-red-500/20 dark:hover:bg-red-500/30 text-red-700 dark:text-red-400 rounded-lg transition-colors disabled:opacity-60"
                              >
                                ✗ Rechazar
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      {req.status === 'APPROVED' && (
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold text-center">
                          Aprobada {req.approvedAt ? formatDate(req.approvedAt) : ''}
                        </p>
                      )}
                      {req.status === 'REJECTED' && req.rejectedReason && (
                        <p className="text-[10px] text-red-500 font-medium max-w-[160px] truncate" title={req.rejectedReason}>
                          {req.rejectedReason}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Nueva Solicitud Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <h2 className="text-xl font-black text-neutral-900 dark:text-white">Nueva Solicitud de Ausencia</h2>
              <button
                onClick={() => { setShowModal(false); setFormError(''); }}
                className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <svg className="h-5 w-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs font-bold px-4 py-3 rounded-xl">
                  {formError}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Empleado</label>
                <select
                  value={form.employeeId}
                  onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                  className="w-full p-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl font-medium text-neutral-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="">— Seleccionar empleado —</option>
                  {employees.filter((e) => e.active).map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} — {emp.position}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Tipo de Ausencia</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full p-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl font-medium text-neutral-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="VACACIONES">Vacaciones</option>
                  <option value="PERMISO">Permiso</option>
                  <option value="INCAPACIDAD">Incapacidad</option>
                  <option value="DUELO">Duelo</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Fecha Inicio</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full p-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl font-medium text-neutral-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Fecha Fin</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full p-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl font-medium text-neutral-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>
              {previewDays !== null && previewDays > 0 && (
                <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800/40 text-pink-700 dark:text-pink-300 px-4 py-3 rounded-xl text-sm font-bold">
                  Días calculados: <span className="text-2xl font-black">{previewDays}</span> día{previewDays !== 1 ? 's' : ''}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Motivo <span className="normal-case font-medium">(opcional)</span></label>
                <textarea
                  rows={3}
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Describe brevemente el motivo de la solicitud..."
                  className="w-full p-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl font-medium text-neutral-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                />
              </div>
            </div>
            <div className="p-6 pt-0 flex gap-3">
              <button
                onClick={() => { setShowModal(false); setFormError(''); }}
                className="flex-1 py-3 font-bold text-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={isPending}
                className="flex-1 py-3 font-black text-sm bg-pink-600 hover:bg-pink-700 text-white rounded-xl shadow-lg shadow-pink-500/20 transition-colors disabled:opacity-60"
              >
                {isPending ? 'Guardando...' : 'Crear Solicitud'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
