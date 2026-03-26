'use client';

/**
 * Switch OS — CRM Pipeline Kanban
 * =================================
 * FASE 18: Tablero Kanban de oportunidades con datos reales de Prisma.
 * Arrastrar deals entre columnas (simulado con menú contextual).
 */

import { useState, useEffect, useTransition } from 'react';
import {
  Target, Plus, RefreshCw, Loader2, X, ChevronRight,
  DollarSign, TrendingUp, Users, Trophy, AlertTriangle,
  Phone, Mail, Calendar, Trash2, Edit3, MoveRight,
} from 'lucide-react';
import {
  getPipelineWithDeals, getPipelineKpis, createDeal,
  moveDeal, updateDeal, deleteDeal, getCustomersForSelect,
  type ColumnWithDeals, type DealRow, type PipelineKpis,
} from './actions';

// ─── helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
}
function fmtDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

const EMPTY_KPIS: PipelineKpis = {
  totalPipelineValue: 0, weightedValue: 0, dealsCount: 0,
  wonDealsCount: 0, lostDealsCount: 0, winRate: 0, avgDealSize: 0,
};

// ─── Componente principal ─────────────────────────────────────────────────────

export default function PipelinePage() {
  const [isPending, startTransition] = useTransition();
  const [columns,   setColumns]   = useState<ColumnWithDeals[]>([]);
  const [kpis,      setKpis]      = useState<PipelineKpis>(EMPTY_KPIS);
  const [customers, setCustomers] = useState<Array<{ id: string; legalName: string; rfc: string }>>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  // Modales
  const [showNewDeal,   setShowNewDeal]   = useState(false);
  const [showEditDeal,  setShowEditDeal]  = useState(false);
  const [showMoveDeal,  setShowMoveDeal]  = useState(false);
  const [selectedDeal,  setSelectedDeal]  = useState<DealRow | null>(null);
  const [newDealColId,  setNewDealColId]  = useState<string>('');

  // Formulario nuevo deal
  const EMPTY_FORM = { title: '', value: '', probability: '50', contactName: '', contactEmail: '', contactPhone: '', notes: '', expectedCloseDate: '', customerId: '' };
  const [form, setForm] = useState(EMPTY_FORM);

  // ── Carga ──
  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [cols, k, custs] = await Promise.all([
        getPipelineWithDeals(),
        getPipelineKpis(),
        getCustomersForSelect(),
      ]);
      setColumns(cols);
      setKpis(k);
      setCustomers(custs);
      if (cols.length > 0 && !newDealColId) setNewDealColId(cols[0].id);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // ── Crear deal ──
  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await createDeal({
          title:       form.title,
          columnId:    newDealColId,
          value:       form.value ? parseFloat(form.value) : 0,
          probability: form.probability ? parseInt(form.probability) : 50,
          contactName:  form.contactName  || undefined,
          contactEmail: form.contactEmail || undefined,
          contactPhone: form.contactPhone || undefined,
          notes:        form.notes        || undefined,
          expectedCloseDate: form.expectedCloseDate || undefined,
          customerId:   form.customerId   || undefined,
        });
        setForm(EMPTY_FORM);
        setShowNewDeal(false);
        await load();
      } catch (err: any) { setError(err.message); }
    });
  }

  // ── Editar deal ──
  function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDeal) return;
    setError(null);
    startTransition(async () => {
      try {
        await updateDeal(selectedDeal.id, {
          title:       form.title,
          value:       form.value ? parseFloat(form.value) : 0,
          probability: parseInt(form.probability),
          contactName:  form.contactName  || undefined,
          contactEmail: form.contactEmail || undefined,
          contactPhone: form.contactPhone || undefined,
          notes:        form.notes || undefined,
          expectedCloseDate: form.expectedCloseDate || null,
        });
        setShowEditDeal(false);
        await load();
      } catch (err: any) { setError(err.message); }
    });
  }

  // ── Mover deal ──
  function handleMove(targetColumnId: string) {
    if (!selectedDeal) return;
    setError(null);
    startTransition(async () => {
      try {
        await moveDeal(selectedDeal.id, targetColumnId);
        setShowMoveDeal(false);
        await load();
      } catch (err: any) { setError(err.message); }
    });
  }

  // ── Eliminar deal ──
  function handleDelete(dealId: string) {
    if (!confirm('¿Eliminar esta oportunidad?')) return;
    startTransition(async () => {
      try {
        await deleteDeal(dealId);
        await load();
      } catch (err: any) { setError(err.message); }
    });
  }

  // ── Abrir modal editar ──
  function openEdit(deal: DealRow) {
    setSelectedDeal(deal);
    setForm({
      title:        deal.title,
      value:        String(deal.value),
      probability:  String(deal.probability),
      contactName:  deal.contactName  ?? '',
      contactEmail: deal.contactEmail ?? '',
      contactPhone: deal.contactPhone ?? '',
      notes:        deal.notes        ?? '',
      expectedCloseDate: deal.expectedCloseDate ? deal.expectedCloseDate.split('T')[0] : '',
      customerId:   '',
    });
    setShowEditDeal(true);
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-6 transition-colors">
      <div className="max-w-[1800px] mx-auto space-y-5">

        {/* ── HEADER ── */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-purple-500/10 p-3 rounded-2xl border border-purple-500/20">
              <Target className="h-7 w-7 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-neutral-950 dark:text-white tracking-tight">Pipeline de Ventas</h1>
              <p className="text-neutral-500 font-medium text-sm mt-0.5">
                {kpis.dealsCount} oportunidades activas · Win rate {kpis.winRate.toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setNewDealColId(columns[0]?.id ?? ''); setShowNewDeal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-purple-500/20">
              <Plus className="h-4 w-4" /> Nueva Oportunidad
            </button>
            <button onClick={load} disabled={loading}
              className="p-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-200 transition-all disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 text-neutral-600 dark:text-neutral-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* ── ERROR ── */}
        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl px-5 py-3 text-sm font-medium text-red-700 dark:text-red-400 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)}><X className="h-4 w-4" /></button>
          </div>
        )}

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Pipeline</p>
                <p className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1">{fmt(kpis.totalPipelineValue)}</p>
              </div>
              <DollarSign className="h-7 w-7 text-purple-500/30" />
            </div>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Ponderado</p>
                <p className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">{fmt(kpis.weightedValue)}</p>
              </div>
              <TrendingUp className="h-7 w-7 text-blue-500/30" />
            </div>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 border-l-4 border-l-emerald-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Win Rate</p>
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{kpis.winRate.toFixed(1)}%</p>
                <p className="text-[10px] text-neutral-400">{kpis.wonDealsCount} ganados</p>
              </div>
              <Trophy className="h-7 w-7 text-emerald-500/30" />
            </div>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Ticket Promedio</p>
                <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">{fmt(kpis.avgDealSize)}</p>
              </div>
              <Users className="h-7 w-7 text-amber-500/30" />
            </div>
          </div>
        </div>

        {/* ── KANBAN ── */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {columns.map((col) => (
              <div key={col.id} className="flex-shrink-0 w-72">
                {/* Cabecera columna */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: col.color }} />
                    <span className="font-black text-sm text-neutral-800 dark:text-white">{col.name}</span>
                    <span className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-[10px] font-black text-neutral-500">{col.deals.length}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono font-bold text-neutral-600 dark:text-neutral-400">{fmt(col.totalValue)}</p>
                  </div>
                </div>

                {/* Cards */}
                <div className="space-y-3 min-h-[200px]">
                  {col.deals.map((deal) => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      columnColor={col.color}
                      columns={columns}
                      onEdit={() => openEdit(deal)}
                      onMove={() => { setSelectedDeal(deal); setShowMoveDeal(true); }}
                      onDelete={() => handleDelete(deal.id)}
                    />
                  ))}

                  {/* Botón agregar en esta columna */}
                  {!col.isLost && (
                    <button
                      onClick={() => { setNewDealColId(col.id); setShowNewDeal(true); }}
                      className="w-full py-2 border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-400 hover:border-purple-400 hover:text-purple-500 transition-colors flex items-center justify-center gap-1">
                      <Plus className="h-3 w-3" /> Agregar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── MODAL NUEVO DEAL ── */}
      {showNewDeal && (
        <DealModal
          title="Nueva Oportunidad"
          form={form}
          setForm={setForm}
          columns={columns}
          newDealColId={newDealColId}
          setNewDealColId={setNewDealColId}
          customers={customers}
          onSubmit={handleCreate}
          onClose={() => { setShowNewDeal(false); setForm(EMPTY_FORM); }}
          isPending={isPending}
          showColumnSelector={true}
        />
      )}

      {/* ── MODAL EDITAR DEAL ── */}
      {showEditDeal && selectedDeal && (
        <DealModal
          title="Editar Oportunidad"
          form={form}
          setForm={setForm}
          columns={columns}
          newDealColId={selectedDeal.columnId}
          setNewDealColId={() => {}}
          customers={customers}
          onSubmit={handleEdit}
          onClose={() => { setShowEditDeal(false); setSelectedDeal(null); }}
          isPending={isPending}
          showColumnSelector={false}
        />
      )}

      {/* ── MODAL MOVER DEAL ── */}
      {showMoveDeal && selectedDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-lg text-neutral-900 dark:text-white">Mover a Etapa</h3>
              <button onClick={() => setShowMoveDeal(false)}><X className="h-5 w-5 text-neutral-400" /></button>
            </div>
            <p className="text-sm text-neutral-500 mb-4">{selectedDeal.title}</p>
            <div className="space-y-2">
              {columns.filter((c) => c.id !== selectedDeal.columnId).map((col) => (
                <button key={col.id} onClick={() => handleMove(col.id)} disabled={isPending}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 hover:bg-purple-50 dark:hover:bg-purple-500/10 border border-neutral-200 dark:border-neutral-700 hover:border-purple-300 dark:hover:border-purple-500/50 transition-all text-left group">
                  <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: col.color }} />
                  <span className="font-bold text-sm text-neutral-700 dark:text-neutral-300 group-hover:text-purple-700 dark:group-hover:text-purple-400">{col.name}</span>
                  <ChevronRight className="h-4 w-4 text-neutral-400 ml-auto" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── DealCard ─────────────────────────────────────────────────────────────────

function DealCard({ deal, columnColor, columns, onEdit, onMove, onDelete }: {
  deal: DealRow;
  columnColor: string;
  columns: ColumnWithDeals[];
  onEdit: () => void;
  onMove: () => void;
  onDelete: () => void;
}) {
  const [showActions, setShowActions] = useState(false);

  const isOverdue = deal.expectedCloseDate && !deal.wonAt && !deal.lostAt &&
    new Date(deal.expectedCloseDate) < new Date();

  return (
    <div
      className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group cursor-pointer"
      style={{ borderLeftWidth: '3px', borderLeftColor: columnColor }}
      onClick={() => setShowActions(!showActions)}
    >
      {/* Título + acciones */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="font-bold text-sm text-neutral-900 dark:text-white leading-tight">{deal.title}</p>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button onClick={onEdit}   className="p-1 rounded text-neutral-400 hover:text-blue-500 transition-colors"><Edit3   className="h-3.5 w-3.5" /></button>
          <button onClick={onMove}   className="p-1 rounded text-neutral-400 hover:text-purple-500 transition-colors"><MoveRight className="h-3.5 w-3.5" /></button>
          <button onClick={onDelete} className="p-1 rounded text-neutral-400 hover:text-red-500 transition-colors"><Trash2  className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      {/* Valor */}
      <p className="text-lg font-black" style={{ color: columnColor }}>{fmt(deal.value)}</p>

      {/* Probabilidad */}
      <div className="mt-2 mb-3">
        <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
          <div className="h-1.5 rounded-full transition-all" style={{ width: `${deal.probability}%`, backgroundColor: columnColor }} />
        </div>
        <p className="text-[10px] text-neutral-400 mt-1">{deal.probability}% probabilidad</p>
      </div>

      {/* Contacto */}
      {deal.contactName && (
        <p className="text-xs text-neutral-500 flex items-center gap-1 mb-1">
          <Users className="h-3 w-3" /> {deal.contactName}
        </p>
      )}
      {deal.customerName && (
        <p className="text-xs text-neutral-500 truncate mb-1">{deal.customerName}</p>
      )}

      {/* Fecha cierre */}
      {deal.expectedCloseDate && (
        <p className={`text-[10px] flex items-center gap-1 mt-2 font-medium ${
          isOverdue ? 'text-red-500' : 'text-neutral-400'
        }`}>
          {isOverdue && <AlertTriangle className="h-3 w-3" />}
          <Calendar className="h-3 w-3" />
          {fmtDate(deal.expectedCloseDate)}
        </p>
      )}

      {deal.wonAt  && <p className="text-[10px] text-emerald-500 font-bold mt-1">✓ Ganado {fmtDate(deal.wonAt)}</p>}
      {deal.lostAt && <p className="text-[10px] text-neutral-400 mt-1">✗ Perdido {fmtDate(deal.lostAt)}</p>}
    </div>
  );
}

// ─── DealModal (crear / editar) ───────────────────────────────────────────────

function DealModal({ title, form, setForm, columns, newDealColId, setNewDealColId, customers, onSubmit, onClose, isPending, showColumnSelector }: {
  title: string;
  form: Record<string, string>;
  setForm: (fn: (f: any) => any) => void;
  columns: ColumnWithDeals[];
  newDealColId: string;
  setNewDealColId: (id: string) => void;
  customers: Array<{ id: string; legalName: string; rfc: string }>;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  isPending: boolean;
  showColumnSelector: boolean;
}) {
  const field = (key: string) => ({
    value: form[key] ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f: any) => ({ ...f, [key]: e.target.value })),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 my-8">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-black text-lg text-neutral-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">Título <span className="text-red-500">*</span></label>
            <input type="text" {...field('title')} required placeholder="Ej: Implementación ERP — Empresa ABC"
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-purple-500" />
          </div>

          {showColumnSelector && (
            <div>
              <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">Etapa</label>
              <select value={newDealColId} onChange={(e) => setNewDealColId(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-purple-500">
                {columns.filter((c) => !c.isLost).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">Valor estimado</label>
              <input type="number" {...field('value')} min={0} step={1} placeholder="50000"
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">Probabilidad %</label>
              <input type="number" {...field('probability')} min={0} max={100} placeholder="50"
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-purple-500" />
            </div>
          </div>

          {customers.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">Cliente (opcional)</label>
              <select {...field('customerId')}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-purple-500">
                <option value="">— Sin cliente —</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.legalName} ({c.rfc})</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">Contacto</label>
              <input type="text" {...field('contactName')} placeholder="Juan Pérez"
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">Teléfono</label>
              <input type="tel" {...field('contactPhone')} placeholder="55 1234 5678"
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-purple-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">Email</label>
            <input type="email" {...field('contactEmail')} placeholder="juan@empresa.com"
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-purple-500" />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">Fecha estimada de cierre</label>
            <input type="date" {...field('expectedCloseDate')}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-purple-500" />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">Notas</label>
            <textarea {...field('notes')} rows={2} placeholder="Observaciones de la oportunidad..."
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-purple-500 resize-none" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded-xl">Cancelar</button>
            <button type="submit" disabled={isPending}
              className="px-5 py-2 text-sm font-black text-white bg-purple-500 hover:bg-purple-600 rounded-xl transition-colors disabled:opacity-50">
              {isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
