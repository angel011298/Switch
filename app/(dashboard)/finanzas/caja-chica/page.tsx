'use client';

/**
 * Switch OS — Caja Chica
 * ========================
 * FASE 16: Fondo fijo con CRUD de gastos desde Prisma.
 * Póliza contable automática por cada gasto registrado.
 */

import { useState, useEffect, useTransition } from 'react';
import {
  Banknote, Plus, Trash2, AlertTriangle, CheckCircle2,
  Loader2, ScrollText, FileBarChart2, Settings2, X,
  Scale, History, Receipt,
} from 'lucide-react';
import {
  getOrCreateFund,
  addExpense,
  getExpenses,
  deleteExpense,
  updateFundAmount,
  CATEGORIES,
  type FundSummary,
  type ExpenseRow,
} from './actions';

// ─── helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 });
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function CajaChicaPage() {
  const [activeTab, setActiveTab] = useState<'registro' | 'historial' | 'arqueo' | 'politicas'>('registro');
  const [isPending, startTransition] = useTransition();

  const [fund, setFund] = useState<FundSummary | null>(null);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Formulario gasto
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    concept: '',
    amount: '',
    category: 'General',
    receiptRef: '',
  });

  // Modal editar fondo
  const [showFundModal, setShowFundModal] = useState(false);
  const [newFundAmount, setNewFundAmount] = useState('');

  // ── Cargar ──
  async function load() {
    setLoading(true);
    try {
      const f = await getOrCreateFund();
      const ex = await getExpenses(f.id, 1);
      setFund(f);
      setExpenses(ex);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // ── Registrar gasto ──
  function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!fund) return;
    setError(null);
    startTransition(async () => {
      try {
        await addExpense({
          fundId: fund.id,
          date: form.date,
          concept: form.concept,
          amount: parseFloat(form.amount),
          category: form.category,
          receiptRef: form.receiptRef || undefined,
        });
        setForm({ date: new Date().toISOString().split('T')[0], concept: '', amount: '', category: 'General', receiptRef: '' });
        await load();
      } catch (err: any) {
        setError(err.message);
      }
    });
  }

  // ── Eliminar gasto ──
  function handleDelete(id: string) {
    if (!confirm('¿Eliminar este gasto?')) return;
    startTransition(async () => {
      try {
        await deleteExpense(id);
        await load();
      } catch (err: any) {
        setError(err.message);
      }
    });
  }

  // ── Editar fondo ──
  function handleUpdateFund(e: React.FormEvent) {
    e.preventDefault();
    if (!fund) return;
    startTransition(async () => {
      try {
        await updateFundAmount(fund.id, parseFloat(newFundAmount));
        setShowFundModal(false);
        await load();
      } catch (err: any) {
        setError(err.message);
      }
    });
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
    </div>
  );

  const pctUsado = fund ? ((fund.totalGastos / fund.fundAmount) * 100) : 0;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8 transition-colors">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* ── HEADER ── */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20">
              <Banknote className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">Caja Chica</h1>
              <p className="text-neutral-500 font-medium text-sm mt-1">
                Fondo fijo {fund ? fmt(fund.fundAmount) : ''} · LISR Art. 27 · Póliza automática
              </p>
            </div>
          </div>
          <button
            onClick={() => { setNewFundAmount(String(fund?.fundAmount ?? 10000)); setShowFundModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl hover:bg-neutral-200 transition-all text-sm"
          >
            <Settings2 className="h-4 w-4" /> Ajustar fondo
          </button>
        </header>

        {/* ── ERROR ── */}
        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl px-5 py-4 text-sm font-medium text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* ── KPIs ── */}
        {fund && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 border-l-4 border-l-amber-500">
              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Fondo Fijo</p>
              <p className="text-2xl font-black text-neutral-900 dark:text-white mt-1">{fmt(fund.fundAmount)}</p>
            </div>
            <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 border-l-4 border-l-rose-500">
              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Gastado (mes)</p>
              <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{fmt(fund.totalGastos)}</p>
            </div>
            <div className={`p-5 rounded-2xl border border-l-4 ${
              fund.requiereReposicion
                ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 border-l-red-500'
                : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 border-l-emerald-500'
            }`}>
              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Saldo Disponible</p>
              <p className={`text-2xl font-black mt-1 ${fund.requiereReposicion ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {fmt(fund.saldoDisponible)}
              </p>
              {fund.requiereReposicion && (
                <p className="text-[10px] text-red-600 dark:text-red-400 mt-1 font-bold">⚠ Requiere reposición</p>
              )}
            </div>
            <div className={`p-5 rounded-2xl border border-l-4 ${
              fund.noDeducibles > 0
                ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 border-l-amber-500'
                : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 border-l-neutral-300'
            }`}>
              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">No Deducibles</p>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{fund.noDeducibles}</p>
              <p className="text-[10px] text-neutral-400 mt-1">Gastos &gt;$2,000 efectivo</p>
            </div>
          </div>
        )}

        {/* Barra de uso del fondo */}
        {fund && (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4">
            <div className="flex justify-between text-xs font-bold mb-2">
              <span className="text-neutral-500">Uso del fondo</span>
              <span className={pctUsado > 80 ? 'text-red-500' : 'text-neutral-700 dark:text-neutral-300'}>
                {pctUsado.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  pctUsado > 80 ? 'bg-red-500' : pctUsado > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, pctUsado)}%` }}
              />
            </div>
          </div>
        )}

        {/* ── TABS ── */}
        <div className="flex overflow-x-auto border-b border-neutral-200 dark:border-neutral-800 pb-2 gap-2">
          {[
            { id: 'registro',  label: 'Registro Rápido',   icon: Plus         },
            { id: 'historial', label: 'Historial',          icon: History      },
            { id: 'arqueo',    label: 'Arqueo de Caja',    icon: Scale        },
            { id: 'politicas', label: 'Políticas LISR',    icon: ScrollText   },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                  : 'bg-white dark:bg-neutral-900 text-neutral-500 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
              }`}
            >
              <tab.icon className="h-4 w-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* ── CONTENIDO ── */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm p-6">

          {/* REGISTRO */}
          {activeTab === 'registro' && (
            <div className="space-y-6">
              <h2 className="text-xl font-black text-neutral-900 dark:text-white">Registrar Gasto</h2>
              <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                    Fecha <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    required
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                    Categoría
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                    Concepto <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Compra de papelería"
                    value={form.concept}
                    onChange={(e) => setForm((f) => ({ ...f, concept: e.target.value }))}
                    required
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                    Monto <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="500.00"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    required min={0.01} step={0.01}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  />
                  {form.amount && parseFloat(form.amount) > 2000 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Gasto &gt;$2,000 no deducible (LISR Art. 27)
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                    Folio de comprobante
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: REC-2026-001"
                    value={form.receiptRef}
                    onChange={(e) => setForm((f) => ({ ...f, receiptRef: e.target.value }))}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex items-center gap-2 px-6 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-black rounded-xl transition-all shadow-lg shadow-amber-500/20 text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    {isPending ? 'Registrando...' : 'Registrar gasto'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* HISTORIAL */}
          {activeTab === 'historial' && (
            <div className="space-y-4">
              <h2 className="text-xl font-black text-neutral-900 dark:text-white">Historial del Mes</h2>
              {expenses.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-500 font-medium">Sin gastos registrados este mes</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-2xl">
                  <table className="min-w-full text-sm text-left whitespace-nowrap">
                    <thead className="bg-neutral-50 dark:bg-black/50 border-b border-neutral-200 dark:border-neutral-800 text-[10px] uppercase text-neutral-500 tracking-widest font-black">
                      <tr>
                        <th className="p-4">Fecha</th>
                        <th className="p-4">Concepto</th>
                        <th className="p-4">Categoría</th>
                        <th className="p-4">Folio</th>
                        <th className="p-4 text-right">Monto</th>
                        <th className="p-4 text-center">Deducible</th>
                        <th className="p-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                      {expenses.map((exp) => (
                        <tr key={exp.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                          <td className="p-4 text-xs text-neutral-500">
                            {new Date(exp.date).toLocaleDateString('es-MX')}
                          </td>
                          <td className="p-4 font-medium text-neutral-900 dark:text-white">{exp.concept}</td>
                          <td className="p-4">
                            <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-[10px] font-bold text-neutral-600 dark:text-neutral-400">
                              {exp.category}
                            </span>
                          </td>
                          <td className="p-4 text-xs text-neutral-500 font-mono">{exp.receiptRef ?? '—'}</td>
                          <td className="p-4 text-right font-mono font-bold">{fmt(exp.amount)}</td>
                          <td className="p-4 text-center">
                            {exp.esNoDeducible
                              ? <AlertTriangle className="h-4 w-4 text-amber-500 mx-auto" />
                              : <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                            }
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => handleDelete(exp.id)}
                              disabled={isPending}
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-black/50">
                      <tr>
                        <td colSpan={4} className="p-4 text-xs font-black text-neutral-600 dark:text-neutral-400 uppercase tracking-widest">Total del mes</td>
                        <td className="p-4 text-right font-mono font-black text-rose-600 dark:text-rose-400">
                          {fmt(expenses.reduce((s, e) => s + e.amount, 0))}
                        </td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ARQUEO */}
          {activeTab === 'arqueo' && fund && (
            <div className="space-y-4">
              <h2 className="text-xl font-black text-neutral-900 dark:text-white">Arqueo de Caja</h2>
              <div className="max-w-md space-y-3">
                {[
                  { label: 'Fondo fijo autorizado',  value: fund.fundAmount,      color: 'text-neutral-900 dark:text-white' },
                  { label: 'Total gastado (mes)',     value: -fund.totalGastos,   color: 'text-rose-600 dark:text-rose-400' },
                  { label: 'Saldo disponible',        value: fund.saldoDisponible, color: fund.requiereReposicion ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400' },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center py-3 border-b border-neutral-100 dark:border-neutral-800">
                    <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{row.label}</span>
                    <span className={`font-black font-mono ${row.color}`}>{fmt(Math.abs(row.value))}</span>
                  </div>
                ))}
              </div>
              {fund.requiereReposicion && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl p-4 flex items-center gap-3 mt-4">
                  <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">
                    El saldo disponible es menor al 20% del fondo fijo. Se recomienda solicitar reposición.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* POLÍTICAS */}
          {activeTab === 'politicas' && (
            <div className="space-y-4">
              <h2 className="text-xl font-black text-neutral-900 dark:text-white">Políticas Fiscales (LISR)</h2>
              <div className="space-y-3">
                {[
                  {
                    title: 'Art. 27 Fracc. III — Límite efectivo',
                    detail: 'Gastos en efectivo superiores a $2,000 MXN no son deducibles fiscalmente.',
                    icon: AlertTriangle, color: 'amber',
                  },
                  {
                    title: 'Art. 27 — Comprobante fiscal',
                    detail: 'Todo gasto mayor a $2,000 requiere CFDI. Los tickets y notas simples no son válidos.',
                    icon: ScrollText, color: 'blue',
                  },
                  {
                    title: 'Fondo fijo — Reposición',
                    detail: 'El fondo debe reponerse cuando el saldo baje del 20% del monto autorizado.',
                    icon: Banknote, color: 'emerald',
                  },
                ].map((policy, i) => (
                  <div key={i} className={`flex items-start gap-4 p-4 rounded-2xl bg-${policy.color}-50 dark:bg-${policy.color}-500/10 border border-${policy.color}-200 dark:border-${policy.color}-800`}>
                    <policy.icon className={`h-5 w-5 text-${policy.color}-500 flex-shrink-0 mt-0.5`} />
                    <div>
                      <p className={`font-bold text-sm text-${policy.color}-900 dark:text-${policy.color}-100`}>{policy.title}</p>
                      <p className={`text-xs text-${policy.color}-700 dark:text-${policy.color}-400 mt-1`}>{policy.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* ── MODAL FONDO ── */}
        {showFundModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-lg text-neutral-900 dark:text-white">Ajustar Fondo Fijo</h3>
                <button onClick={() => setShowFundModal(false)} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleUpdateFund} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">Nuevo monto del fondo</label>
                  <input
                    type="number"
                    value={newFundAmount}
                    onChange={(e) => setNewFundAmount(e.target.value)}
                    required min={1} step={1}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setShowFundModal(false)} className="px-4 py-2 text-sm font-bold text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded-xl transition-colors">Cancelar</button>
                  <button type="submit" disabled={isPending} className="px-5 py-2 text-sm font-black text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-colors disabled:opacity-50">
                    {isPending ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
