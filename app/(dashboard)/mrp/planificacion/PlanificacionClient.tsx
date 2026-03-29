'use client';

/**
 * CIFRA — MRP Planificación Client
 * ==================================
 * FASE 33: Órdenes de producción con gestión de status.
 */

import { useState, useTransition } from 'react';
import {
  Factory, Plus, Play, CheckCircle2, XCircle, Loader2,
  X, AlertTriangle, Clock, Package,
} from 'lucide-react';
import {
  createProductionOrder, completeProductionOrder, type ProductionOrderRow, type BomRow,
} from '../actions';

interface Props {
  initialOrders: ProductionOrderRow[];
  boms: BomRow[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PLANNED:     { label: 'Planificada',  color: 'text-neutral-600',  bg: 'bg-neutral-100 dark:bg-neutral-800' },
  IN_PROGRESS: { label: 'En Progreso',  color: 'text-blue-600',     bg: 'bg-blue-50 dark:bg-blue-900/20' },
  COMPLETED:   { label: 'Completada',   color: 'text-emerald-600',  bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  CANCELLED:   { label: 'Cancelada',    color: 'text-red-600',      bg: 'bg-red-50 dark:bg-red-900/20' },
};

const INSPECTION_CONFIG: Record<string, { label: string; color: string }> = {
  PASS:        { label: 'Aprobada',     color: 'text-emerald-600' },
  FAIL:        { label: 'Rechazada',    color: 'text-red-600' },
  CONDITIONAL: { label: 'Condicional',  color: 'text-amber-600' },
  PENDING:     { label: 'Pendiente',    color: 'text-neutral-400' },
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export default function PlanificacionClient({ initialOrders, boms }: Props) {
  const [orders, setOrders] = useState<ProductionOrderRow[]>(initialOrders);
  const [showModal, setShowModal] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Form state
  const [bomId, setBomId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);

  const kpis = {
    planned:     orders.filter(o => o.status === 'PLANNED').length,
    inProgress:  orders.filter(o => o.status === 'IN_PROGRESS').length,
    completed:   orders.filter(o => o.status === 'COMPLETED').length,
    cancelled:   orders.filter(o => o.status === 'CANCELLED').length,
  };

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!bomId || !quantity) return;
    setSaving(true);
    try {
      await createProductionOrder({ bomId, quantity: Number(quantity), startDate: startDate || undefined, endDate: endDate || undefined, notes });
      // Reload
      window.location.reload();
    } finally {
      setSaving(false);
    }
  }

  async function handleComplete(orderId: string) {
    setCompleting(true);
    try {
      await completeProductionOrder(orderId);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'COMPLETED' } : o));
    } finally {
      setCompleting(false);
      setConfirmId(null);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-orange-500/10 p-3 rounded-2xl border border-orange-500/20">
              <Factory className="h-7 w-7 text-orange-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-neutral-900 dark:text-white">Órdenes de Producción</h1>
              <p className="text-neutral-500 text-sm mt-1">{orders.length} órdenes totales</p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-orange-500/20"
          >
            <Plus className="h-4 w-4" /> Nueva Orden
          </button>
        </header>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Planificadas',  value: kpis.planned,    color: 'border-l-neutral-400' },
            { label: 'En Progreso',   value: kpis.inProgress,  color: 'border-l-blue-500' },
            { label: 'Completadas',   value: kpis.completed,   color: 'border-l-emerald-500' },
            { label: 'Canceladas',    value: kpis.cancelled,   color: 'border-l-red-500' },
          ].map(k => (
            <div key={k.label} className={`bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 border-l-4 ${k.color}`}>
              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{k.label}</p>
              <p className="text-3xl font-black text-neutral-900 dark:text-white mt-1">{k.value}</p>
            </div>
          ))}
        </div>

        {/* TABLE */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-50 dark:bg-black/50 text-[10px] uppercase text-neutral-500 tracking-widest font-black border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th className="p-4 text-left">Producto</th>
                  <th className="p-4 text-left">BOM v.</th>
                  <th className="p-4 text-right">Cantidad</th>
                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4 text-center">Inspección</th>
                  <th className="p-4 text-left">Fechas</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                {orders.length === 0 ? (
                  <tr><td colSpan={7} className="p-12 text-center text-neutral-400">
                    <Factory className="h-10 w-10 mx-auto mb-3 text-neutral-300" />
                    No hay órdenes de producción
                  </td></tr>
                ) : orders.map(order => {
                  const status = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PLANNED;
                  const insp = INSPECTION_CONFIG[order.inspectionResult ?? 'PENDING'] ?? INSPECTION_CONFIG.PENDING;
                  return (
                    <tr key={order.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                      <td className="p-4 font-bold text-neutral-900 dark:text-white">{order.productName}</td>
                      <td className="p-4 text-neutral-500 font-mono text-xs">v{order.version}</td>
                      <td className="p-4 text-right font-black font-mono">{order.quantity}</td>
                      <td className="p-4 text-center">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${status.bg} ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`text-xs font-bold ${insp.color}`}>{insp.label}</span>
                      </td>
                      <td className="p-4 text-xs text-neutral-500">
                        {order.startDate && <span>{fmt(order.startDate)}</span>}
                        {order.startDate && order.endDate && <span className="mx-1">→</span>}
                        {order.endDate && <span>{fmt(order.endDate)}</span>}
                        {!order.startDate && !order.endDate && <span className="text-neutral-300">—</span>}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          {order.status === 'PLANNED' && (
                            <button
                              onClick={() => setConfirmId(order.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-lg hover:bg-emerald-100 transition-colors"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Completar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* CONFIRM MODAL */}
      {confirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-sm shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-amber-100 dark:bg-amber-900/30 p-2.5 rounded-xl">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <h3 className="font-black text-neutral-900 dark:text-white">Completar Producción</h3>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
              Esto descontará los componentes del inventario y añadirá el producto terminado al stock.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmId(null)} className="flex-1 py-2.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl text-sm hover:bg-neutral-200 transition-colors">
                Cancelar
              </button>
              <button
                onClick={() => handleComplete(confirmId)}
                disabled={completing}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {completing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW ORDER MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
              <h2 className="text-lg font-black text-neutral-900 dark:text-white">Nueva Orden de Producción</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                <X className="h-5 w-5 text-neutral-500" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-black text-neutral-500 uppercase tracking-widest block mb-2">BOM / Producto *</label>
                <select
                  value={bomId} onChange={e => setBomId(e.target.value)} required
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Selecciona una BOM...</option>
                  {boms.map(b => (
                    <option key={b.id} value={b.id}>{b.productName} (v{b.version})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-black text-neutral-500 uppercase tracking-widest block mb-2">Cantidad *</label>
                <input
                  type="number" value={quantity} onChange={e => setQuantity(e.target.value)} required min="1"
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-neutral-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black text-neutral-500 uppercase tracking-widest block mb-2">Inicio</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-neutral-900 dark:text-white" />
                </div>
                <div>
                  <label className="text-xs font-black text-neutral-500 uppercase tracking-widest block mb-2">Fin estimado</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-neutral-900 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="text-xs font-black text-neutral-500 uppercase tracking-widest block mb-2">Notas</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none text-neutral-900 dark:text-white" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl text-sm hover:bg-neutral-200 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={saving || !bomId || !quantity}
                  className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
