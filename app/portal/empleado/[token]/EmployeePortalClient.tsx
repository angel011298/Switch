'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import {
  User, FileText, Calendar, Clock, PlusCircle, Download,
  CheckCircle2, XCircle, AlertCircle, LogOut, ChevronRight,
  Briefcase, Building2,
} from 'lucide-react';
import { submitLeaveRequest } from './actions';

type ActiveTab = 'nomina' | 'asistencia' | 'permisos';

interface PayrollSlip {
  id: string;
  bruto: number;
  neto: number;
  isr: number;
  imss: number;
  absenceDays: number;
  absenceDeduct: number;
  cfdiUuid: string | null;
  cfdiStatus: string;
  payrollRun: { periodLabel: string; payDate: Date | null; periodEnd: Date };
}

interface LeaveRequest {
  id: string;
  type: string;
  startDate: Date;
  endDate: Date;
  days: number;
  reason: string | null;
  status: string;
  createdAt: Date;
  rejectedReason: string | null;
}

interface Attendance {
  id: string;
  date: Date;
  checkIn: Date | null;
  checkOut: Date | null;
  status: string;
}

interface Employee {
  id: string;
  name: string;
  position: string;
  department: string | null;
  hireDate: Date;
  salary: number;
  salaryType: string;
  email: string | null;
  employeeNumber: string | null;
  payrollItems: PayrollSlip[];
  leaveRequests: LeaveRequest[];
  attendances: Attendance[];
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

const fmtDate = (d: Date | null) =>
  d ? new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(new Date(d)) : '—';

const STATUS_BADGE: Record<string, string> = {
  PENDING:  'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  APPROVED: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  REJECTED: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente', APPROVED: 'Aprobado', REJECTED: 'Rechazado',
};

const LEAVE_TYPES = ['VACACIONES', 'PERMISO', 'INCAPACIDAD', 'DUELO'];
const LEAVE_LABELS: Record<string, string> = {
  VACACIONES: 'Vacaciones', PERMISO: 'Permiso', INCAPACIDAD: 'Incapacidad', DUELO: 'Duelo',
};

export default function EmployeePortalClient({
  employee, tenant, token,
}: { employee: Employee; tenant: { name: string; logoUrl: string | null }; token: string }) {
  const [tab, setTab] = useState<ActiveTab>('nomina');
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [isPending, startTrans] = useTransition();
  const [leaveSuccess, setLeaveSuccess] = useState('');
  const [leaveError, setLeaveError]     = useState('');

  function handleLeaveSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTrans(async () => {
      const res = await submitLeaveRequest(token, {
        type:      fd.get('type') as string,
        startDate: fd.get('startDate') as string,
        endDate:   fd.get('endDate') as string,
        reason:    fd.get('reason') as string,
      });
      if (res.ok) {
        setLeaveSuccess('Solicitud enviada correctamente. Tu área de RRHH la revisará pronto.');
        setShowLeaveForm(false);
        (e.target as HTMLFormElement).reset();
      } else {
        setLeaveError(res.error ?? 'Error al enviar la solicitud');
      }
    });
  }

  const TABS = [
    { id: 'nomina' as const,    label: 'Recibos de Nómina', icon: FileText },
    { id: 'asistencia' as const, label: 'Asistencias',       icon: Clock    },
    { id: 'permisos' as const,  label: 'Permisos',           icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {tenant.logoUrl ? (
              <Image src={tenant.logoUrl} alt={tenant.name} width={32} height={32} className="rounded-md" />
            ) : (
              <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center font-bold text-sm">
                {tenant.name[0]}
              </div>
            )}
            <div>
              <p className="text-xs text-slate-400">{tenant.name}</p>
              <p className="font-semibold text-sm">Portal del Empleado</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <User className="w-4 h-4" />
            <span className="text-sm hidden sm:block">{employee.name}</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Tarjeta de empleado */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold flex-shrink-0">
            {employee.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">{employee.name}</h1>
            <p className="text-slate-400 text-sm flex items-center gap-1">
              <Briefcase className="w-3 h-3" /> {employee.position}
            </p>
            {employee.department && (
              <p className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                <Building2 className="w-3 h-3" /> {employee.department}
              </p>
            )}
          </div>
          <div className="text-right text-sm hidden sm:block">
            <p className="text-slate-400 text-xs">Ingreso</p>
            <p className="font-medium">{fmtDate(employee.hireDate)}</p>
            {employee.employeeNumber && (
              <p className="text-slate-500 text-xs mt-1">#{employee.employeeNumber}</p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl bg-neutral-900 border border-neutral-800 p-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <t.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Nómina */}
        {tab === 'nomina' && (
          <div className="space-y-3">
            {employee.payrollItems.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p>No hay recibos disponibles aún</p>
              </div>
            ) : (
              employee.payrollItems.map(slip => (
                <div key={slip.id} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold">{slip.payrollRun.periodLabel}</p>
                      <p className="text-slate-500 text-xs">{fmtDate(slip.payrollRun.payDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-400">{fmt(slip.neto)}</p>
                      <p className="text-slate-500 text-xs">Neto a pagar</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs border-t border-neutral-800 pt-3">
                    <div className="text-center">
                      <p className="text-slate-400">Bruto</p>
                      <p className="font-medium">{fmt(slip.bruto)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-400">ISR</p>
                      <p className="font-medium text-rose-400">-{fmt(slip.isr)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-400">IMSS</p>
                      <p className="font-medium text-rose-400">-{fmt(slip.imss)}</p>
                    </div>
                  </div>
                  {slip.cfdiUuid && (
                    <p className="text-xs text-slate-600 mt-2 font-mono truncate">
                      UUID: {slip.cfdiUuid}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Asistencia */}
        {tab === 'asistencia' && (
          <div className="space-y-2">
            {employee.attendances.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Clock className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p>No hay registros de asistencia</p>
              </div>
            ) : (
              employee.attendances.map(att => (
                <div key={att.id} className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center flex-shrink-0">
                    {att.status === 'PRESENT' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : att.status === 'ABSENT' ? (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{fmtDate(att.date)}</p>
                    <p className="text-xs text-slate-500">
                      {att.checkIn ? `Entrada: ${new Date(att.checkIn).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}` : 'Sin registro'}
                      {att.checkOut ? ` · Salida: ${new Date(att.checkOut).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}` : ''}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">{att.status}</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Permisos y Vacaciones */}
        {tab === 'permisos' && (
          <div className="space-y-4">
            {leaveSuccess && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                {leaveSuccess}
              </div>
            )}
            {leaveError && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-400">
                <XCircle className="w-4 h-4 flex-shrink-0" />
                {leaveError}
              </div>
            )}

            <button
              onClick={() => setShowLeaveForm(v => !v)}
              className="w-full flex items-center justify-between rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-blue-400 hover:bg-blue-500/20 transition-colors"
            >
              <span className="flex items-center gap-2 font-medium text-sm">
                <PlusCircle className="w-4 h-4" /> Nueva solicitud de permiso / vacaciones
              </span>
              <ChevronRight className={`w-4 h-4 transition-transform ${showLeaveForm ? 'rotate-90' : ''}`} />
            </button>

            {showLeaveForm && (
              <form onSubmit={handleLeaveSubmit} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 space-y-4">
                <h3 className="font-semibold text-sm">Nueva Solicitud</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Tipo</label>
                    <select
                      name="type"
                      required
                      className="w-full rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    >
                      {LEAVE_TYPES.map(t => (
                        <option key={t} value={t}>{LEAVE_LABELS[t]}</option>
                      ))}
                    </select>
                  </div>
                  <div />
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Fecha inicio</label>
                    <input
                      type="date" name="startDate" required
                      className="w-full rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Fecha fin</label>
                    <input
                      type="date" name="endDate" required
                      className="w-full rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Motivo (opcional)</label>
                  <textarea
                    name="reason" rows={2}
                    className="w-full rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowLeaveForm(false)}
                    className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={isPending}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50">
                    {isPending ? 'Enviando...' : 'Enviar solicitud'}
                  </button>
                </div>
              </form>
            )}

            {/* Lista de solicitudes previas */}
            {employee.leaveRequests.map(req => (
              <div key={req.id} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm">{LEAVE_LABELS[req.type] ?? req.type}</p>
                    <p className="text-slate-400 text-xs">
                      {fmtDate(req.startDate)} — {fmtDate(req.endDate)}
                      <span className="ml-2">({req.days} día{req.days !== 1 ? 's' : ''})</span>
                    </p>
                    {req.reason && <p className="text-slate-500 text-xs mt-1">{req.reason}</p>}
                    {req.rejectedReason && (
                      <p className="text-rose-400 text-xs mt-1">Motivo rechazo: {req.rejectedReason}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[req.status] ?? STATUS_BADGE.PENDING}`}>
                    {STATUS_LABEL[req.status] ?? req.status}
                  </span>
                </div>
              </div>
            ))}

            {employee.leaveRequests.length === 0 && !showLeaveForm && (
              <div className="text-center py-8 text-slate-500">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No hay solicitudes previas</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
