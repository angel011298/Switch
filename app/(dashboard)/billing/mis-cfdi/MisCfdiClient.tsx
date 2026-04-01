'use client';

import { useState, useTransition } from 'react';
import {
  FileText, Download, CheckCircle2, Ban, AlertTriangle,
  RefreshCw, Search, Link as LinkIcon, Filter, X
} from 'lucide-react';
import { CfdiRow, CfdiKpis, syncCfdiFromSat, markCfdiAccountingMapped } from './actions';

interface Props {
  cfdi: CfdiRow[];
  kpis: CfdiKpis;
}

function fmt(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function TipoBadge({ tipo }: { tipo: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    I: { label: 'Ingreso', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' },
    E: { label: 'Egreso',  cls: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400' },
    T: { label: 'Traslado',cls: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400' },
    P: { label: 'Pago',    cls: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400' },
    N: { label: 'Nómina',  cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' },
  };
  const { label, cls } = map[tipo] ?? { label: tipo, cls: 'bg-neutral-100 text-neutral-600' };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${cls}`}>
      {label}
    </span>
  );
}

export default function MisCfdiClient({ cfdi, kpis }: Props) {
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  const [showMappingModal, setShowMappingModal] = useState<string | null>(null);
  const [ccForm, setCcForm] = useState('');
  const [ctaForm, setCtaForm] = useState('');
  const [toastMsg, setToastMsg] = useState<{ msg: string; err: boolean } | null>(null);

  const toast = (msg: string, err = false) => {
    setToastMsg({ msg, err });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleSync = () => {
    startTransition(async () => {
      const res = await syncCfdiFromSat();
      toast(res.message, !res.ok);
    });
  };

  const handleMap = (e: React.FormEvent, id: string) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await markCfdiAccountingMapped(id, ccForm, ctaForm);
      if (res.ok) {
        toast('CFDI mapeado a contabilidad exitosamente');
        setShowMappingModal(null);
        setCcForm('');
        setCtaForm('');
        window.location.reload();
      } else {
        toast(res.error ?? 'Error', true);
      }
    });
  };

  const filtered = cfdi.filter((c) => {
    if (filterTipo && c.tipoComprobante !== filterTipo) return false;
    if (filterStatus && c.status !== filterStatus) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!c.emisorRfc.toLowerCase().includes(term) && !c.emisorNombre?.toLowerCase().includes(term)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8 transition-colors">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-blue-500/10 p-3 rounded-2xl border border-blue-500/20">
              <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">Mis CFDI</h1>
              <p className="text-neutral-500 font-medium text-sm mt-1">Facturas recibidas, validación EFOS y mapeo contable</p>
            </div>
          </div>
          <button
            onClick={handleSync}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black rounded-xl transition-all text-sm shadow-lg shadow-blue-600/20"
          >
            {isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {isPending ? 'Sincronizando...' : 'Sincronizar con SAT'}
          </button>
        </header>

        {toastMsg && (
          <div className={`border rounded-2xl px-5 py-4 flex items-center gap-3 text-sm font-medium ${
            toastMsg.err 
              ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400' 
              : 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
          }`}>
            {toastMsg.err ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            {toastMsg.msg}
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Total Recibidos', value: kpis.total, color: 'text-neutral-900 dark:text-white' },
            { label: 'Importe Total', value: fmt(kpis.totalImporte), color: 'text-neutral-900 dark:text-white' },
            { label: 'Vigentes', value: kpis.vigentes, color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Cancelados', value: kpis.cancelados, color: 'text-red-600 dark:text-red-400' },
            { label: 'Alertas EFOS', value: kpis.efosAlert, color: 'text-amber-600 dark:text-amber-400' },
            { label: 'Sin Mapear', value: kpis.sinMapear, color: 'text-blue-600 dark:text-blue-400' }
          ].map(k => (
            <div key={k.label} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4">
              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">{k.label}</p>
              <p className={`text-xl font-black ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
          
          {/* Barra de Filtros */}
          <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex flex-col md:flex-row gap-4 items-center justify-between bg-neutral-50/50 dark:bg-black/20">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input 
                type="text"
                placeholder="Buscar por RFC o Razón Social..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <select 
                value={filterTipo} 
                onChange={e => setFilterTipo(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-bold text-neutral-700 dark:text-neutral-300"
              >
                <option value="">Tipo: Todos</option>
                <option value="I">I - Ingreso</option>
                <option value="E">E - Egreso</option>
                <option value="P">P - Pago</option>
              </select>
              <select 
                value={filterStatus} 
                onChange={e => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-bold text-neutral-700 dark:text-neutral-300"
              >
                <option value="">Estado: Todos</option>
                <option value="VIGENTE">Vigente</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead>
                <tr className="bg-neutral-50 dark:bg-black/40 text-[10px] uppercase text-neutral-500 tracking-widest font-black border-b border-neutral-100 dark:border-neutral-800">
                  <th className="px-6 py-3">UUID / Fecha</th>
                  <th className="px-6 py-3">Emisor</th>
                  <th className="px-6 py-3">Tipo</th>
                  <th className="px-6 py-3 text-right">Total</th>
                  <th className="px-6 py-3 text-center">Estado</th>
                  <th className="px-6 py-3 text-center">Alertas</th>
                  <th className="px-6 py-3 text-center">Contabilidad</th>
                  <th className="px-6 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                {filtered.map((c) => (
                  <tr key={c.id} className={`hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors ${c.isEfos ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                    <td className="px-6 py-3">
                      <p className="font-mono text-xs font-bold text-neutral-900 dark:text-white" title={c.uuid}>
                        {c.uuid.split('-')[0]}…{c.uuid.split('-').pop()}
                      </p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">{fmtDate(c.fechaEmision)}</p>
                    </td>
                    <td className="px-6 py-3">
                      <p className="font-bold text-neutral-900 dark:text-white max-w-[200px] truncate" title={c.emisorNombre || ''}>
                        {c.emisorNombre || c.emisorRfc}
                      </p>
                      {c.emisorNombre && <p className="text-[10px] text-neutral-400 font-mono mt-0.5">{c.emisorRfc}</p>}
                    </td>
                    <td className="px-6 py-3"><TipoBadge tipo={c.tipoComprobante} /></td>
                    <td className="px-6 py-3 text-right font-mono font-black text-neutral-900 dark:text-white">
                      {fmt(c.total)}
                    </td>
                    <td className="px-6 py-3 text-center">
                      {c.status === 'VIGENTE' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="h-3 w-3" /> VIGENTE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/10 px-2 py-0.5 rounded-full">
                          <Ban className="h-3 w-3" /> CANCELADO
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-center">
                      {c.isEfos ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-white bg-red-500 px-2 py-0.5 rounded-full animate-pulse shadow-sm shadow-red-500/50">
                          <AlertTriangle className="h-3 w-3" /> EFOS
                        </span>
                      ) : (
                        <span className="text-neutral-300 dark:text-neutral-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-center">
                      {c.accountingMapped ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-blue-600 dark:text-blue-400" title={`CC: ${c.costCenter} | Cta: ${c.accountCode}`}>
                          <CheckCircle2 className="h-3 w-3" /> Mapeado
                        </span>
                      ) : (
                        <button 
                          onClick={() => setShowMappingModal(c.id)}
                          className="inline-flex items-center gap-1 text-[10px] font-black text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                        >
                          <LinkIcon className="h-3 w-3" /> Mapear
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <button 
                        disabled={!c.xmlUrl}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors" 
                        title="Descargar XML"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-neutral-500 font-medium">
                      No se encontraron comprobantes con esos filtros
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Mapeo Contable */}
      {showMappingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form 
            onSubmit={(e) => handleMap(e, showMappingModal)}
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl w-full max-w-sm p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-lg text-neutral-900 dark:text-white">Mapeo Contable</h3>
              <button
                type="button"
                onClick={() => setShowMappingModal(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-neutral-500 uppercase tracking-widest mb-1">Centro de Costo (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej. VTS-NTE"
                  value={ccForm}
                  onChange={e => setCcForm(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-neutral-500 uppercase tracking-widest mb-1">Cuenta Contable (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej. 601.01.001"
                  value={ctaForm}
                  onChange={e => setCtaForm(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowMappingModal(null)}
                className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold text-sm rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-sm rounded-xl transition-all shadow-lg shadow-blue-600/20"
              >
                {isPending ? 'Guardando...' : 'Confirmar Mapeo'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
