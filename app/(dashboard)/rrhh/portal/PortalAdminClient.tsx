'use client';

import { useState } from 'react';
import { UserCheck, Link2, Copy, CheckCircle2, Clock, AlertTriangle, Loader2, Users, Calendar } from 'lucide-react';
import { generatePortalToken, approveLeaveRequest } from './actions';

type Employee = { id: string; name: string; position: string; department: string; hasActiveToken: boolean; token: string | null; tokenExpiresAt: string | null };
type LeaveReq = { id: string; employeeName: string; employeePosition: string; type: string; days: number; reason: string | null; startDate: string; endDate: string; status: string; createdAt: string };

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cifra-mx.vercel.app';

const LEAVE_TYPE_LABELS: Record<string, string> = {
  VACACIONES: 'Vacaciones', PERMISO: 'Permiso', INCAPACIDAD: 'Incapacidad', DUELO: 'Duelo',
};

export default function PortalAdminClient({ employees, leaveRequests }: { employees: Employee[]; leaveRequests: LeaveReq[] }) {
  const [empList, setEmpList] = useState(employees);
  const [requests, setRequests] = useState(leaveRequests);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  const activePortal = empList.filter(e => e.hasActiveToken).length;
  const pendingReqs = requests.filter(r => r.status === 'PENDING').length;

  async function handleGenerate(employeeId: string) {
    setLoadingId(employeeId);
    try {
      const token = await generatePortalToken(employeeId);
      setEmpList(prev => prev.map(e => e.id === employeeId ? { ...e, hasActiveToken: true, token: token.token, tokenExpiresAt: token.expiresAt.toISOString() } : e));
    } catch (err) {
      setMsg(`❌ ${err instanceof Error ? err.message : 'Error'}`);
    } finally { setLoadingId(null); }
  }

  function handleCopy(token: string, id: string) {
    const url = `${SITE_URL}/portal/empleado/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  async function handleApprove(id: string, approved: boolean) {
    setLoadingId(id);
    try {
      await approveLeaveRequest(id, approved);
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: approved ? 'APPROVED' : 'REJECTED' } : r));
    } catch (err) {
      setMsg(`❌ ${err instanceof Error ? err.message : 'Error'}`);
    } finally { setLoadingId(null); }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8 space-y-6">
      <header className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20">
            <UserCheck className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">Portal del Empleado</h1>
            <p className="text-neutral-500 text-sm mt-1">Autoservicio: recibos de nómina, asistencias y solicitudes de permiso</p>
          </div>
        </div>
      </header>

      {msg && <div className="p-4 rounded-2xl text-sm font-semibold bg-red-50 dark:bg-red-500/10 text-red-700 border border-red-200">{msg}</div>}

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800">
          <p className="text-xs font-black text-neutral-500 uppercase tracking-widest">Total Empleados</p>
          <p className="text-3xl font-black text-neutral-900 dark:text-white mt-1">{employees.length}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-500/20 border-l-4 border-l-emerald-500">
          <p className="text-xs font-black text-emerald-500 uppercase tracking-widest">Portal Activo</p>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{activePortal}</p>
        </div>
        <div className={`p-5 rounded-2xl border ${pendingReqs > 0 ? 'border-amber-200 dark:border-amber-500/20 border-l-4 border-l-amber-500' : 'border-neutral-200 dark:border-neutral-800'}`}>
          <p className="text-xs font-black text-amber-500 uppercase tracking-widest">Solicitudes Pendientes</p>
          <p className={`text-3xl font-black mt-1 ${pendingReqs > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-900 dark:text-white'}`}>{pendingReqs}</p>
        </div>
      </div>

      {/* Pending requests */}
      {requests.filter(r => r.status === 'PENDING').length > 0 && (
        <div className="bg-white dark:bg-neutral-900 border border-amber-200 dark:border-amber-500/20 rounded-3xl overflow-hidden">
          <div className="p-4 border-b border-amber-100 dark:border-amber-500/10 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <p className="font-black text-neutral-900 dark:text-white">Solicitudes de Permiso Pendientes</p>
          </div>
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {requests.filter(r => r.status === 'PENDING').map(r => (
              <div key={r.id} className="p-4 flex items-center gap-4">
                <div className="flex-1">
                  <p className="font-bold text-neutral-900 dark:text-white">{r.employeeName} <span className="text-neutral-400 font-normal">— {r.employeePosition}</span></p>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    <span className="font-semibold text-amber-600">{LEAVE_TYPE_LABELS[r.type] ?? r.type}</span> · {r.days} días · {new Date(r.startDate).toLocaleDateString('es-MX')} al {new Date(r.endDate).toLocaleDateString('es-MX')}
                  </p>
                  {r.reason && <p className="text-xs text-neutral-400 mt-0.5 italic">"{r.reason}"</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(r.id, true)} disabled={loadingId === r.id} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors disabled:opacity-50">
                    {loadingId === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}Aprobar
                  </button>
                  <button onClick={() => handleApprove(r.id, false)} disabled={loadingId === r.id} className="flex items-center gap-1 px-3 py-1.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs transition-colors border border-red-200 dark:border-red-500/20">
                    Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Employees table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden">
        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-2">
          <Users className="h-5 w-5 text-neutral-400" />
          <p className="font-black text-neutral-900 dark:text-white">Empleados ({employees.length})</p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 dark:bg-neutral-800/50">
            <tr>
              {['Empleado', 'Puesto', 'Portal', 'Enlace', 'Acciones'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-black text-neutral-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {empList.map(emp => (
              <tr key={emp.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-600 flex items-center justify-center text-xs font-black text-neutral-600 dark:text-neutral-300">
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-neutral-900 dark:text-white">{emp.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-neutral-500">{emp.position}</td>
                <td className="px-4 py-3">
                  {emp.hasActiveToken ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                      <Clock className="h-3 w-3" />Sin portal
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {emp.token && (
                    <button onClick={() => handleCopy(emp.token!, emp.id)} className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                      {copiedId === emp.id ? <><CheckCircle2 className="h-3 w-3 text-emerald-500" />¡Copiado!</> : <><Copy className="h-3 w-3" />Copiar enlace</>}
                    </button>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleGenerate(emp.id)}
                    disabled={loadingId === emp.id}
                    className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
                  >
                    {loadingId === emp.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Link2 className="h-3 w-3" />}
                    {emp.hasActiveToken ? 'Renovar' : 'Generar'} enlace
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
