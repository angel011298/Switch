'use client';

import React, { useState, useTransition } from 'react';
import {
  Layers, Plus, Eye, CheckCircle2, XCircle, ChevronRight,
  Loader2, Trash2, Package, Hash, AlertTriangle,
} from 'lucide-react';
import { createBom, getBomDetail } from '../actions';
import type { BomRow, BomDetail } from '../actions';
import type { ProductRow } from '@/app/(dashboard)/scm/inventarios/actions';

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface BomLineInput {
  componentId: string;
  quantity: number;
  unit: string;
}

interface Props {
  initialBoms: BomRow[];
  products: ProductRow[];
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function BomClient({ initialBoms, products }: Props) {
  const [boms, setBoms] = useState<BomRow[]>(initialBoms);
  const [detail, setDetail] = useState<BomDetail | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);

  // ── Modal form state ──
  const [formProductId, setFormProductId] = useState('');
  const [formVersion, setFormVersion] = useState('1.0');
  const [formNotes, setFormNotes] = useState('');
  const [formLines, setFormLines] = useState<BomLineInput[]>([
    { componentId: '', quantity: 1, unit: 'pza' },
  ]);

  function addLine() {
    setFormLines(l => [...l, { componentId: '', quantity: 1, unit: 'pza' }]);
  }

  function removeLine(idx: number) {
    setFormLines(l => l.filter((_, i) => i !== idx));
  }

  function updateLine(idx: number, patch: Partial<BomLineInput>) {
    setFormLines(l => l.map((line, i) => (i === idx ? { ...line, ...patch } : line)));
  }

  function resetModal() {
    setFormProductId('');
    setFormVersion('1.0');
    setFormNotes('');
    setFormLines([{ componentId: '', quantity: 1, unit: 'pza' }]);
    setError(null);
  }

  async function handleViewDetail(id: string) {
    setLoadingDetail(id);
    try {
      const d = await getBomDetail(id);
      setDetail(d);
    } catch {
      // ignore
    } finally {
      setLoadingDetail(null);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validLines = formLines.filter(l => l.componentId && l.quantity > 0);
    if (!formProductId) { setError('Selecciona un producto terminado.'); return; }
    if (validLines.length === 0) { setError('Agrega al menos un componente válido.'); return; }

    startTransition(async () => {
      try {
        await createBom({
          productId: formProductId,
          version: formVersion || '1.0',
          notes: formNotes,
          items: validLines,
        });
        // Optimistic: reload boms from server is handled by revalidatePath,
        // but since this is a client component we simulate a refresh by
        // fetching the updated list from the server action response.
        setShowModal(false);
        resetModal();
        // Trigger a soft reload by updating route
        window.location.reload();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al crear la BOM');
      }
    });
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-zinc-950 p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* ── HEADER ── */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
              <Layers className="h-8 w-8 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">
                Lista de Materiales (BOM)
              </h1>
              <p className="text-neutral-500 font-medium text-sm mt-1">
                {boms.length} BOM{boms.length !== 1 ? 's' : ''} registradas
              </p>
            </div>
          </div>
          <button
            onClick={() => { resetModal(); setShowModal(true); }}
            className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl transition-all shadow-lg shadow-rose-500/20 text-sm"
          >
            <Plus className="h-4 w-4" /> Nueva BOM
          </button>
        </header>

        {/* ── MAIN LAYOUT ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── TABLE ── */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
            {boms.length === 0 ? (
              <div className="p-16 text-center">
                <Layers className="h-12 w-12 text-neutral-300 dark:text-zinc-700 mx-auto mb-4" />
                <p className="text-neutral-500 font-bold">No hay BOMs registradas.</p>
                <p className="text-neutral-400 text-sm mt-1">Crea la primera BOM para comenzar.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-50 dark:bg-black text-[10px] uppercase text-neutral-500 font-black tracking-widest border-b border-neutral-100 dark:border-zinc-800">
                    <tr>
                      <th className="p-4">Producto</th>
                      <th className="p-4">Versión</th>
                      <th className="p-4 text-center">Componentes</th>
                      <th className="p-4">Activa</th>
                      <th className="p-4">Fecha</th>
                      <th className="p-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-zinc-800">
                    {boms.map(bom => (
                      <tr
                        key={bom.id}
                        className={`hover:bg-neutral-50/50 dark:hover:bg-black/20 transition-colors ${
                          detail?.id === bom.id ? 'bg-rose-50/30 dark:bg-rose-900/10' : ''
                        }`}
                      >
                        <td className="p-4">
                          <p className="font-bold text-neutral-900 dark:text-white truncate max-w-[180px]">
                            {bom.productName}
                          </p>
                        </td>
                        <td className="p-4">
                          <span className="font-mono text-xs bg-neutral-100 dark:bg-zinc-800 px-2 py-1 rounded-lg">
                            v{bom.version}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center gap-1 text-xs font-bold">
                            <Package className="h-3.5 w-3.5 text-rose-500" />
                            {bom.itemCount}
                          </span>
                        </td>
                        <td className="p-4">
                          {bom.isActive ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-full">
                              <CheckCircle2 className="h-3 w-3" /> Activa
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-neutral-500 bg-neutral-100 dark:bg-zinc-800 px-2 py-1 rounded-full">
                              <XCircle className="h-3 w-3" /> Inactiva
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-xs text-neutral-500">{fmtDate(bom.createdAt)}</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleViewDetail(bom.id)}
                            disabled={loadingDetail === bom.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] font-black text-rose-600 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 border border-rose-200 dark:border-rose-800 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {loadingDetail === bom.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Eye className="h-3 w-3" />
                            )}
                            Ver
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── DETAIL PANEL ── */}
          <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden">
            {!detail ? (
              <div className="p-8 flex flex-col items-center justify-center h-full min-h-[200px] text-center">
                <ChevronRight className="h-8 w-8 text-neutral-300 dark:text-zinc-700 mb-3" />
                <p className="text-sm font-bold text-neutral-400">Selecciona una BOM para ver el detalle</p>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-black text-neutral-900 dark:text-white">{detail.productName}</h3>
                    <p className="text-xs text-neutral-500 mt-0.5 font-mono">v{detail.version}</p>
                  </div>
                  <button
                    onClick={() => setDetail(null)}
                    className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>

                {detail.notes && (
                  <p className="text-xs text-neutral-500 bg-neutral-50 dark:bg-zinc-800 p-3 rounded-xl leading-relaxed">
                    {detail.notes}
                  </p>
                )}

                <div>
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3">
                    Componentes ({detail.itemCount})
                  </p>
                  <div className="space-y-2">
                    {detail.items.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-zinc-800/50 rounded-xl border border-neutral-100 dark:border-zinc-700"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Package className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                              {item.componentName}
                            </p>
                            {item.componentSku && (
                              <p className="text-[10px] text-neutral-400 font-mono">{item.componentSku}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <p className="text-xs font-black text-neutral-900 dark:text-white">
                            {item.quantity}
                          </p>
                          <p className="text-[10px] text-neutral-400">{item.unit}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MODAL NUEVA BOM ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-100 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-xl font-black text-neutral-900 dark:text-white flex items-center gap-2">
                <Layers className="h-5 w-5 text-rose-500" /> Nueva BOM
              </h2>
              <button
                onClick={() => { setShowModal(false); resetModal(); }}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl text-sm text-rose-600">
                  <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
                </div>
              )}

              {/* Producto terminado */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-1 space-y-1.5">
                  <label className="text-xs font-black text-neutral-500 uppercase tracking-widest">
                    Producto Terminado *
                  </label>
                  <select
                    value={formProductId}
                    onChange={e => setFormProductId(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="">Seleccionar producto...</option>
                    {products.filter(p => p.isActive).map(p => (
                      <option key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ''}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-neutral-500 uppercase tracking-widest">
                    Versión
                  </label>
                  <input
                    type="text"
                    value={formVersion}
                    onChange={e => setFormVersion(e.target.value)}
                    placeholder="1.0"
                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* Notas */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-neutral-500 uppercase tracking-widest">
                  Notas (opcional)
                </label>
                <textarea
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  rows={2}
                  placeholder="Instrucciones, variantes, observaciones..."
                  className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                />
              </div>

              {/* Líneas de componentes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-neutral-500 uppercase tracking-widest">
                    Componentes *
                  </label>
                  <button
                    type="button"
                    onClick={addLine}
                    className="flex items-center gap-1 text-[10px] font-black text-rose-600 hover:text-rose-700"
                  >
                    <Plus className="h-3.5 w-3.5" /> Agregar línea
                  </button>
                </div>

                {/* Header row */}
                <div className="grid grid-cols-12 gap-2 text-[10px] font-black text-neutral-400 uppercase tracking-widest px-1">
                  <div className="col-span-6">Componente</div>
                  <div className="col-span-3">Cantidad</div>
                  <div className="col-span-2">Unidad</div>
                  <div className="col-span-1" />
                </div>

                {formLines.map((line, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-6">
                      <select
                        value={line.componentId}
                        onChange={e => updateLine(idx, { componentId: e.target.value })}
                        className="w-full px-3 py-2 bg-neutral-50 dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                      >
                        <option value="">Seleccionar...</option>
                        {products.filter(p => p.isActive).map(p => (
                          <option key={p.id} value={p.id}>{p.name}{p.sku ? ` — ${p.sku}` : ''}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        min={0.0001}
                        step={0.001}
                        value={line.quantity}
                        onChange={e => updateLine(idx, { quantity: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-neutral-50 dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={line.unit}
                        onChange={e => updateLine(idx, { unit: e.target.value })}
                        placeholder="pza"
                        className="w-full px-3 py-2 bg-neutral-50 dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      {formLines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLine(idx)}
                          className="p-1 text-neutral-400 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetModal(); }}
                  className="flex-1 px-4 py-2.5 bg-neutral-100 dark:bg-zinc-800 text-neutral-700 dark:text-zinc-300 font-bold rounded-xl text-sm hover:bg-neutral-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-sm transition-colors disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Hash className="h-4 w-4" />}
                  Crear BOM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
