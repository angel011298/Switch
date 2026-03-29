'use client';

/**
 * CIFRA — MRP Calidad Client
 * ============================
 * FASE 33: Registro y listado de inspecciones de calidad.
 */

import { useState } from 'react';
import {
  ClipboardCheck, Plus, CheckCircle2, XCircle, AlertCircle,
  Loader2, X, Package, CalendarDays,
} from 'lucide-react';
import {
  addQualityInspection,
  type ProductionOrderRow,
} from '../actions';

type InspectionRow = {
  id: string;
  result: string;
  notes: string | null;
  inspectedAt: string | null;
  createdAt: string;
  productName: string;
  orderQuantity: number;
  orderStatus: string;
  productionOrderId: string;
};

interface Props {
  initialInspections: InspectionRow[];
  orders: ProductionOrderRow[];
}

const RESULT_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; Icon: React.ElementType }> = {
  PASS:        { label: 'Aprobada',    color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20',  border: 'border-emerald-200 dark:border-emerald-800', Icon: CheckCircle2 },
  FAIL:        { label: 'Rechazada',   color: 'text-red-700 dark:text-red-400',         bg: 'bg-red-50 dark:bg-red-900/20',           border: 'border-red-200 dark:border-red-800',         Icon: XCircle },
  CONDITIONAL: { label: 'Condicional', color: 'text-amber-700 dark:text-amber-400',     bg: 'bg-amber-50 dark:bg-amber-900/20',       border: 'border-amber-200 dark:border-amber-800',     Icon: AlertCircle },
};

const ORDER_STATUS_LABEL: Record<string, string> = {
  PLANNED:     'Planificada',
  IN_PROGRESS: 'En Progreso',
  COMPLETED:   'Completada',
  CANCELLED:   'Cancelada',
};

function fmt(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function CalidadClient({ initialInspections, orders }: Props) {
  const [inspections, setInspections] = useState<InspectionRow[]>(initialInspections);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [orderId, setOrderId] = useState('');
  const [result, setResult] = useState<'PASS' | 'FAIL' | 'CONDITIONAL'>('PASS');
  const [notes, setNotes] = useState('');

  // KPIs
  const kpis = {
    total:       inspections.length,
    pass:        inspections.filter(i => i.result === 'PASS').length,
    fail:        inspections.filter(i => i.result === 'FAIL').length,
    conditional: inspections.filter(i => i.result === 'CONDITIONAL').length,
  };

  function resetForm() {
    setOrderId('');
    setResult('PASS');
    setNotes('');
    setError(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!orderId) return;
    setSaving(true);
    setError(null);
    try {
      await addQualityInspection({ productionOrderId: orderId, result, notes });
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar inspección');
      setSaving(false);
    }
  }

  // Completion-eligible orders only (avoid re-inspecting cancelled)
  const eligibleOrders = orders.filter(o => o.status !== 'CANCELLED');

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-violet-500/10 p-3 rounded-2xl border border-violet-500/20">
              <ClipboardCheck className="h-7 w-7 text-violet-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-neutral-900 dark:text-white">Control de Calidad</h1>
              <p className="text-neutral-500 text-sm mt-1">{inspections.length} inspecciones registradas</p>
            </div>
          </div>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-violet-500/20"
          >
            <Plus className="h-4 w-4" /> Nueva Inspección
          </button>
        </header>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total',        value: kpis.total,       color: 'border-l-neutral-400' },
            { label: 'Aprobadas',    value: kpis.pass,        color: 'border-l-emerald-500' },
            { label: 'Rechazadas',   value: kpis.fail,        color: 'border-l-red-500' },
            { label: 'Condicionales',value: kpis.conditional, color: 'border-l-amber-500' },
          ].map(k => (
            <div key={k.label} className={`bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 border-l-4 ${k.color}`}>
              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{k.label}</p>
              <p className="text-3xl font-black text-neutral-900 dark:text-white mt-1">{k.value}</p>
            </div>
          ))}
        </div>

        {/* INSPECTIONS LIST */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-50 dark:bg-black/50 text-[10px] uppercase text-neutral-500 tracking-widest font-black border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th className="p-4 text-left">Producto</th>
                  <th className="p-4 text-right">Cantidad</th>
                  <th className="p-4 text-center">Resultado</th>
                  <th className="p-4 text-center">Estado Orden</th>
                  <th className="p-4 text-left">Notas</th>
                  <th className="p-4 text-left">Inspeccionado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                {inspections.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-neutral-400">
                      <ClipboardCheck className="h-10 w-10 mx-auto mb-3 text-neutral-300" />
                      No hay inspecciones registradas
                    </td>
                  </tr>
                ) : inspections.map(insp => {
                  const rc = RESULT_CONFIG[insp.result] ?? RESULT_CONFIG.PASS;
                  const Icon = rc.Icon;
                  return (
                    <tr key={insp.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                      <td className="p-4 font-bold text-neutral-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-neutral-400 shrink-0" />
                          {insp.productName}
                        </div>
                      </td>
                      <td className="p-4 text-right font-mono font-black text-neutral-700 dark:text-neutral-300">
                        {insp.orderQuantity}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${rc.bg} ${rc.color} ${rc.border}`}>
                          <Icon className="h-3.5 w-3.5" />
                          {rc.label}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-xs font-medium text-neutral-500">
                          {ORDER_STATUS_LABEL[insp.orderStatus] ?? insp.orderStatus}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-neutral-500 max-w-[200px] truncate">
                        {insp.notes ?? <span className="text-neutral-300">—</span>}
                      </td>
                      <td className="p-4 text-xs text-neutral-500">
                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5 text-neutral-400" />
                          {fmt(insp.inspectedAt ?? insp.createdAt)}
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

      {/* NEW INSPECTION MODAL */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-md shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
              <h2 className="text-lg font-black text-neutral-900 dark:text-white">Nueva Inspección de Calidad</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="h-5 w-5 text-neutral-500" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">

              {/* Order selector */}
              <div>
                <label className="text-xs font-black text-neutral-500 uppercase tracking-widest block mb-2">
                  Orden de Producción *
                </label>
                <select
                  value={orderId}
                  onChange={e => setOrderId(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">Selecciona una orden...</option>
                  {eligibleOrders.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.productName} — {o.quantity} uds ({ORDER_STATUS_LABEL[o.status] ?? o.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Result selector */}
              <div>
                <label className="text-xs font-black text-neutral-500 uppercase tracking-widest block mb-2">
                  Resultado *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['PASS', 'FAIL', 'CONDITIONAL'] as const).map(r => {
                    const rc = RESULT_CONFIG[r];
                    const Icon = rc.Icon;
                    const selected = result === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setResult(r)}
                        className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-xs font-black transition-all ${
                          selected
                            ? `${rc.bg} ${rc.border} ${rc.color}`
                            : 'border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:border-neutral-300'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        {rc.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-black text-neutral-500 uppercase tracking-widest block mb-2">
                  Notas
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Observaciones de la inspección..."
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none text-neutral-900 dark:text-white placeholder:text-neutral-400"
                />
              </div>

              {/* Error */}
              {error && (
                <p className="text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 rounded-xl">
                  {error}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl text-sm hover:bg-neutral-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || !orderId}
                  className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-black rounded-xl text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
