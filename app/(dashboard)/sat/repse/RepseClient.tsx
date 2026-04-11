'use client';

import { useState } from 'react';
import { FileCheck, Plus, CheckCircle2, AlertTriangle, Calendar, Users, Loader2 } from 'lucide-react';
import { saveRepseRegistration, createRepseContract } from './actions';

type Registration = { numRepse: string; fechaRegistro: string; fechaVencimiento: string; actividades: string; status: string } | null;
type Contract = { id: string; clienteRfc: string; clienteNombre: string; fechaInicio: string; fechaFin: string | null; numTrabajadores: number; status: string; icsoeCount: number };

function daysUntil(dateStr: string) { return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24)); }

export default function RepseClient({ registration, contracts }: { registration: Registration; contracts: Contract[] }) {
  const [reg, setReg] = useState(registration);
  const [contractList, setContractList] = useState(contracts);
  const [showRegForm, setShowRegForm] = useState(!registration);
  const [showContractModal, setShowContractModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // Registration form state
  const [numRepse, setNumRepse] = useState(registration?.numRepse ?? '');
  const [fechaReg, setFechaReg] = useState(registration?.fechaRegistro?.slice(0, 10) ?? '');
  const [fechaVenc, setFechaVenc] = useState(registration?.fechaVencimiento?.slice(0, 10) ?? '');
  const [actividades, setActividades] = useState(registration?.actividades ?? '');

  // Contract form state
  const [cRfc, setCRfc] = useState('');
  const [cNombre, setCNombre] = useState('');
  const [cObjeto, setCObjeto] = useState('');
  const [cFecha, setCFecha] = useState('');
  const [cTrabajadores, setCTrabajadores] = useState(1);

  async function handleSaveReg() {
    setSaving(true); setMsg('');
    try {
      await saveRepseRegistration({ numRepse, fechaRegistro: fechaReg, fechaVencimiento: fechaVenc, actividades });
      setReg({ numRepse, fechaRegistro: fechaReg, fechaVencimiento: fechaVenc, actividades, status: 'ACTIVE' });
      setShowRegForm(false);
      setMsg('✅ Registro REPSE guardado');
    } catch (err) { setMsg(`❌ ${err instanceof Error ? err.message : 'Error'}`); }
    finally { setSaving(false); }
  }

  async function handleCreateContract() {
    setSaving(true); setMsg('');
    try {
      await createRepseContract({ clienteRfc: cRfc.toUpperCase(), clienteNombre: cNombre, objetoContrato: cObjeto, fechaInicio: cFecha, numTrabajadores: cTrabajadores });
      setShowContractModal(false);
      setMsg('✅ Contrato creado');
      // Reset form
      setCRfc(''); setCNombre(''); setCObjeto(''); setCFecha(''); setCTrabajadores(1);
      window.location.reload();
    } catch (err) { setMsg(`❌ ${err instanceof Error ? err.message : 'Error'}`); }
    finally { setSaving(false); }
  }

  const totalTrabajadores = contractList.filter(c => c.status === 'ACTIVE').reduce((s, c) => s + c.numTrabajadores, 0);
  const daysToRenewal = reg?.fechaVencimiento ? daysUntil(reg.fechaVencimiento) : null;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8 space-y-6">
      <header className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-teal-500/10 p-3 rounded-2xl border border-teal-500/20">
            <FileCheck className="h-8 w-8 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">Módulo REPSE</h1>
            <p className="text-neutral-500 text-sm mt-1">Registro de Prestadoras de Servicios Especializados — STPS</p>
          </div>
        </div>
        <button onClick={() => setShowContractModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl text-sm transition-colors">
          <Plus className="h-4 w-4" /> Nuevo Contrato
        </button>
      </header>

      {msg && <div className={`p-4 rounded-2xl text-sm font-semibold ${msg.startsWith('✅') ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 border border-emerald-200 dark:border-emerald-500/20' : 'bg-red-50 dark:bg-red-500/10 text-red-700 border border-red-200 dark:border-red-500/20'}`}>{msg}</div>}

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800">
          <p className="text-xs font-black text-neutral-500 uppercase tracking-widest">Contratos Activos</p>
          <p className="text-3xl font-black text-neutral-900 dark:text-white mt-1">{contractList.filter(c => c.status === 'ACTIVE').length}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800">
          <p className="text-xs font-black text-neutral-500 uppercase tracking-widest">Personal Subcontratado</p>
          <p className="text-3xl font-black text-teal-600 dark:text-teal-400 mt-1">{totalTrabajadores}</p>
        </div>
        <div className={`p-5 rounded-2xl border ${daysToRenewal !== null && daysToRenewal < 30 ? 'border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/5' : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'}`}>
          <p className="text-xs font-black text-neutral-500 uppercase tracking-widest">Renovación REPSE</p>
          {daysToRenewal !== null ? (
            <p className={`text-2xl font-black mt-1 ${daysToRenewal < 30 ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-900 dark:text-white'}`}>{daysToRenewal < 0 ? 'VENCIDO' : `${daysToRenewal}d`}</p>
          ) : <p className="text-2xl font-black text-neutral-400 mt-1">—</p>}
        </div>
      </div>

      {/* Registration card */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-black text-neutral-900 dark:text-white flex items-center gap-2"><FileCheck className="h-5 w-5 text-teal-500" /> Registro REPSE (STPS)</h2>
          {reg && !showRegForm && <button onClick={() => setShowRegForm(true)} className="text-xs font-bold text-teal-500 hover:text-teal-600">Editar</button>}
        </div>
        {reg && !showRegForm ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><p className="text-xs text-neutral-400">Número REPSE</p><p className="font-black text-neutral-900 dark:text-white">{reg.numRepse}</p></div>
            <div><p className="text-xs text-neutral-400">Registro</p><p className="font-semibold text-neutral-700 dark:text-neutral-300">{new Date(reg.fechaRegistro).toLocaleDateString('es-MX')}</p></div>
            <div><p className="text-xs text-neutral-400">Vencimiento</p><p className="font-semibold text-neutral-700 dark:text-neutral-300">{new Date(reg.fechaVencimiento).toLocaleDateString('es-MX')}</p></div>
            <div><p className="text-xs text-neutral-400">Estado</p><span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"><CheckCircle2 className="h-3 w-3" />{reg.status}</span></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Número REPSE</label><input value={numRepse} onChange={e => setNumRepse(e.target.value)} placeholder="Ej. 12345" className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl px-4 py-2.5 text-sm" /></div>
              <div><label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Fecha Registro</label><input type="date" value={fechaReg} onChange={e => setFechaReg(e.target.value)} className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl px-4 py-2.5 text-sm" /></div>
              <div><label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Fecha Vencimiento</label><input type="date" value={fechaVenc} onChange={e => setFechaVenc(e.target.value)} className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl px-4 py-2.5 text-sm" /></div>
            </div>
            <div><label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Actividades Especializadas</label><textarea value={actividades} onChange={e => setActividades(e.target.value)} rows={3} placeholder="Describe los servicios especializados registrados..." className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl px-4 py-2.5 text-sm resize-none" /></div>
            <div className="flex gap-2">
              <button onClick={handleSaveReg} disabled={saving || !numRepse} className="flex items-center gap-2 px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl text-sm disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Guardar
              </button>
              {reg && <button onClick={() => setShowRegForm(false)} className="px-5 py-2 text-neutral-500 hover:text-neutral-700 font-semibold text-sm">Cancelar</button>}
            </div>
          </div>
        )}
      </div>

      {/* Contracts */}
      {contractList.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden">
          <div className="p-4 border-b border-neutral-100 dark:border-neutral-800"><p className="font-black text-neutral-900 dark:text-white">Contratos de Subcontratación</p></div>
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-800/50">
              <tr>{['RFC Comitente', 'Cliente', 'Inicio', 'Trabajadores', 'ICSOE', 'Estado'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-black text-neutral-500 uppercase tracking-wider">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {contractList.map(c => (
                <tr key={c.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                  <td className="px-4 py-3 font-mono text-xs text-neutral-700 dark:text-neutral-300">{c.clienteRfc}</td>
                  <td className="px-4 py-3 font-semibold text-neutral-900 dark:text-white">{c.clienteNombre}</td>
                  <td className="px-4 py-3 text-neutral-500">{new Date(c.fechaInicio).toLocaleDateString('es-MX')}</td>
                  <td className="px-4 py-3 text-center"><span className="flex items-center gap-1 text-neutral-700 dark:text-neutral-300"><Users className="h-4 w-4" />{c.numTrabajadores}</span></td>
                  <td className="px-4 py-3 text-center text-neutral-500">{c.icsoeCount} reportes</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${c.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800'}`}>{c.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Contract Modal */}
      {showContractModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 w-full max-w-lg shadow-2xl">
            <h3 className="font-black text-xl text-neutral-900 dark:text-white mb-5">Nuevo Contrato REPSE</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">RFC Comitente</label><input value={cRfc} onChange={e => setCRfc(e.target.value)} placeholder="RFC" className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl px-3 py-2 text-sm font-mono uppercase" /></div>
                <div><label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Nombre/Razón Social</label><input value={cNombre} onChange={e => setCNombre(e.target.value)} placeholder="Empresa S.A. de C.V." className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl px-3 py-2 text-sm" /></div>
              </div>
              <div><label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Objeto del Contrato</label><textarea value={cObjeto} onChange={e => setCObjeto(e.target.value)} rows={2} placeholder="Descripción del servicio especializado..." className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl px-3 py-2 text-sm resize-none" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Fecha Inicio</label><input type="date" value={cFecha} onChange={e => setCFecha(e.target.value)} className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Núm. Trabajadores</label><input type="number" min={1} value={cTrabajadores} onChange={e => setCTrabajadores(parseInt(e.target.value) || 1)} className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl px-3 py-2 text-sm" /></div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleCreateContract} disabled={saving || !cRfc || !cNombre} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl text-sm disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Crear Contrato
              </button>
              <button onClick={() => setShowContractModal(false)} className="px-5 py-2.5 text-neutral-500 hover:text-neutral-700 font-semibold text-sm">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
