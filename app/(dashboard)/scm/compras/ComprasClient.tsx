'use client';

/**
 * CIFRA — SCM Compras Client Component
 * ======================================
 * FASE 31: Tabla de órdenes de compra con modales para crear OC y recibir mercancía.
 */

import { useState, useTransition } from 'react';
import {
  ShoppingCart,
  Plus,
  PackageCheck,
  Truck,
  CheckCircle2,
  XCircle,
  Trash2,
  ChevronDown,
  Loader2,
  X,
  Package,
  ClipboardList,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import {
  createPurchaseOrder,
  receiveGoods,
  updateOrderStatus,
  createSupplier,
  type PurchaseOrderRow,
  type SupplierRow,
} from './actions';

// ─── TIPOS LOCALES ────────────────────────────────────────────────────────────

type StatusFilter = 'TODAS' | 'DRAFT' | 'SENT' | 'PARTIAL' | 'RECEIVED' | 'CANCELLED';

interface OrderItem {
  productName: string;
  quantity: number;
  unitCost: number;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
}

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  DRAFT:     { label: 'Borrador',  cls: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400' },
  SENT:      { label: 'Enviada',   cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  PARTIAL:   { label: 'Parcial',   cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  RECEIVED:  { label: 'Recibida',  cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
  CANCELLED: { label: 'Cancelada', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400' },
};

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, cls: 'bg-neutral-100 text-neutral-600' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${meta.cls}`}>
      {meta.label}
    </span>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

interface Props {
  initialOrders: PurchaseOrderRow[];
  initialSuppliers: SupplierRow[];
}

export default function ComprasClient({ initialOrders, initialSuppliers }: Props) {
  const [orders, setOrders] = useState<PurchaseOrderRow[]>(initialOrders);
  const [suppliers, setSuppliers] = useState<SupplierRow[]>(initialSuppliers);
  const [activeTab, setActiveTab] = useState<StatusFilter>('TODAS');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // ── Modal: Nueva OC ──
  const [showNewOC, setShowNewOC] = useState(false);
  const [ocSupplierId, setOcSupplierId] = useState('');
  const [ocExpectedAt, setOcExpectedAt] = useState('');
  const [ocNotes, setOcNotes] = useState('');
  const [ocItems, setOcItems] = useState<OrderItem[]>([{ productName: '', quantity: 1, unitCost: 0 }]);
  const [ocLoading, setOcLoading] = useState(false);

  // ── Modal: Nuevo Proveedor ──
  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [spName, setSpName] = useState('');
  const [spRfc, setSpRfc] = useState('');
  const [spEmail, setSpEmail] = useState('');
  const [spPhone, setSpPhone] = useState('');
  const [spContact, setSpContact] = useState('');
  const [spLoading, setSpLoading] = useState(false);

  // ── Modal: Recibir Mercancía ──
  const [receiveOrder, setReceiveOrder] = useState<PurchaseOrderRow | null>(null);
  const [receiveQtys, setReceiveQtys] = useState<Record<string, number>>({});
  const [receiveLoading, setReceiveLoading] = useState(false);

  // ─── FILTRO ────────────────────────────────────────────────────────────────

  const filtered = activeTab === 'TODAS'
    ? orders
    : orders.filter(o => o.status === activeTab);

  // ─── KPIs ─────────────────────────────────────────────────────────────────

  const totalOC       = orders.length;
  const enTransito    = orders.filter(o => o.status === 'SENT' || o.status === 'PARTIAL').length;
  const recibidas     = orders.filter(o => o.status === 'RECEIVED').length;
  const valorTotal    = orders.filter(o => o.status !== 'CANCELLED').reduce((s, o) => s + o.total, 0);

  // ─── HANDLERS: Nueva OC ───────────────────────────────────────────────────

  function addItem() {
    setOcItems(prev => [...prev, { productName: '', quantity: 1, unitCost: 0 }]);
  }

  function removeItem(idx: number) {
    setOcItems(prev => prev.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: keyof OrderItem, value: string | number) {
    setOcItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }

  const ocTotal = ocItems.reduce((s, i) => s + (i.quantity || 0) * (i.unitCost || 0), 0);

  async function handleCreateOC() {
    setError(null);
    const validItems = ocItems.filter(i => i.productName.trim() && i.quantity > 0 && i.unitCost >= 0);
    if (validItems.length === 0) {
      setError('Agrega al menos un producto válido con nombre y cantidad.');
      return;
    }
    setOcLoading(true);
    try {
      await createPurchaseOrder({
        supplierId: ocSupplierId || undefined,
        notes: ocNotes || undefined,
        expectedAt: ocExpectedAt || undefined,
        items: validItems,
      });
      // Optimistic: reload from server via revalidation, but also fetch
      const { getPurchaseOrders } = await import('./actions');
      const fresh = await getPurchaseOrders();
      setOrders(fresh);
      setShowNewOC(false);
      resetOCForm();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al crear la orden');
    } finally {
      setOcLoading(false);
    }
  }

  function resetOCForm() {
    setOcSupplierId('');
    setOcExpectedAt('');
    setOcNotes('');
    setOcItems([{ productName: '', quantity: 1, unitCost: 0 }]);
  }

  // ─── HANDLERS: Nuevo Proveedor ────────────────────────────────────────────

  async function handleCreateSupplier() {
    setError(null);
    if (!spName.trim()) { setError('El nombre del proveedor es requerido.'); return; }
    setSpLoading(true);
    try {
      await createSupplier({ name: spName, rfc: spRfc, email: spEmail, phone: spPhone, contactName: spContact });
      const { getSuppliers } = await import('./actions');
      const fresh = await getSuppliers();
      setSuppliers(fresh);
      setShowNewSupplier(false);
      setSpName(''); setSpRfc(''); setSpEmail(''); setSpPhone(''); setSpContact('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar proveedor');
    } finally {
      setSpLoading(false);
    }
  }

  // ─── HANDLERS: Recibir Mercancía ──────────────────────────────────────────

  function openReceive(order: PurchaseOrderRow) {
    setReceiveOrder(order);
    setReceiveQtys({});
    setError(null);
  }

  async function handleReceiveGoods() {
    if (!receiveOrder) return;
    setError(null);
    const payload = Object.entries(receiveQtys)
      .map(([itemId, quantityReceived]) => ({ itemId, quantityReceived: Number(quantityReceived) }))
      .filter(r => r.quantityReceived > 0);

    if (payload.length === 0) {
      setError('Ingresa al menos una cantidad mayor a 0.');
      return;
    }
    setReceiveLoading(true);
    try {
      await receiveGoods(receiveOrder.id, payload);
      const { getPurchaseOrders } = await import('./actions');
      const fresh = await getPurchaseOrders();
      setOrders(fresh);
      setReceiveOrder(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al registrar recepción');
    } finally {
      setReceiveLoading(false);
    }
  }

  // ─── HANDLERS: Cancelar Orden ─────────────────────────────────────────────

  function handleCancel(orderId: string) {
    if (!confirm('¿Cancelar esta orden de compra?')) return;
    startTransition(async () => {
      try {
        await updateOrderStatus(orderId, 'CANCELLED');
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'CANCELLED' } : o));
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Error al cancelar');
      }
    });
  }

  // ─── HANDLERS: Marcar como Enviada ────────────────────────────────────────

  function handleMarkSent(orderId: string) {
    startTransition(async () => {
      try {
        await updateOrderStatus(orderId, 'SENT');
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'SENT' } : o));
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Error al actualizar estado');
      }
    });
  }

  // ─── RENDER ───────────────────────────────────────────────────────────────

  const tabs: { id: StatusFilter; label: string }[] = [
    { id: 'TODAS',     label: 'Todas' },
    { id: 'DRAFT',     label: 'Borrador' },
    { id: 'SENT',      label: 'Enviadas' },
    { id: 'PARTIAL',   label: 'Parcial' },
    { id: 'RECEIVED',  label: 'Recibidas' },
    { id: 'CANCELLED', label: 'Canceladas' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* ── HEADER ── */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-orange-500/10 p-3 rounded-2xl border border-orange-500/20">
              <ShoppingCart className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">
                SCM | Órdenes de Compra
              </h1>
              <p className="text-neutral-500 font-medium text-sm mt-1">
                Gestión de proveedores, órdenes de compra y recepción de mercancía.
              </p>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => { setShowNewSupplier(true); setError(null); }}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 font-bold rounded-xl text-sm hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              <Plus className="h-4 w-4" /> Nuevo Proveedor
            </button>
            <button
              onClick={() => { setShowNewOC(true); setError(null); resetOCForm(); }}
              className="flex items-center gap-2 px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl transition-all shadow-lg shadow-orange-500/20 text-sm"
            >
              <ShoppingCart className="h-4 w-4" /> Nueva OC
            </button>
          </div>
        </header>

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Total OC</p>
              <p className="text-3xl font-black text-neutral-900 dark:text-white mt-1">{totalOC}</p>
            </div>
            <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
              <ClipboardList className="h-6 w-6 text-neutral-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 border-l-4 border-l-blue-500 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">En Tránsito</p>
              <p className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-1">{enTransito}</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
              <Truck className="h-6 w-6 text-blue-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 border-l-4 border-l-emerald-500 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Recibidas</p>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{recibidas}</p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
              <PackageCheck className="h-6 w-6 text-emerald-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 border-l-4 border-l-orange-500 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Valor Total</p>
              <p className="text-2xl font-black text-orange-600 dark:text-orange-400 mt-1">{fmt(valorTotal)}</p>
            </div>
            <div className="p-3 bg-orange-50 dark:bg-orange-500/10 rounded-xl">
              <DollarSign className="h-6 w-6 text-orange-500" />
            </div>
          </div>
        </div>

        {/* ── ERROR GLOBAL ── */}
        {error && (
          <div className="flex items-start gap-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-2xl p-4 text-sm font-medium">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto shrink-0"><X className="h-4 w-4" /></button>
          </div>
        )}

        {/* ── TABLA ── */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm overflow-hidden">

          {/* Status Tabs */}
          <div className="flex gap-1 p-4 border-b border-neutral-200 dark:border-neutral-800 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                {tab.label}
                {tab.id !== 'TODAS' && (
                  <span className="ml-1.5 opacity-75">
                    ({orders.filter(o => o.status === tab.id).length})
                  </span>
                )}
                {tab.id === 'TODAS' && (
                  <span className="ml-1.5 opacity-75">({orders.length})</span>
                )}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-neutral-50 dark:bg-black/50 border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th className="px-4 py-3 font-bold text-neutral-500 text-xs uppercase tracking-wider">#OC</th>
                  <th className="px-4 py-3 font-bold text-neutral-500 text-xs uppercase tracking-wider">Proveedor</th>
                  <th className="px-4 py-3 font-bold text-neutral-500 text-xs uppercase tracking-wider text-center">Items</th>
                  <th className="px-4 py-3 font-bold text-neutral-500 text-xs uppercase tracking-wider text-right">Total</th>
                  <th className="px-4 py-3 font-bold text-neutral-500 text-xs uppercase tracking-wider text-center">Estado</th>
                  <th className="px-4 py-3 font-bold text-neutral-500 text-xs uppercase tracking-wider">Fecha Esperada</th>
                  <th className="px-4 py-3 font-bold text-neutral-500 text-xs uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-neutral-400 text-sm">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      No hay órdenes en esta categoría.
                    </td>
                  </tr>
                )}
                {filtered.map(order => (
                  <tr key={order.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                    <td className="px-4 py-4">
                      <span className="font-mono font-black text-orange-600 dark:text-orange-400 text-sm">
                        OC-{String(order.orderNumber).padStart(4, '0')}
                      </span>
                      <div className="text-[10px] text-neutral-400 mt-0.5">{fmtDate(order.createdAt)}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-semibold text-neutral-900 dark:text-white">
                        {order.supplierName ?? <span className="text-neutral-400 italic">Sin proveedor</span>}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 font-bold text-xs text-neutral-700 dark:text-neutral-300">
                        {order.itemCount}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-black text-neutral-900 dark:text-white">
                      {fmt(order.total)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-4 text-neutral-500 text-sm">
                      {fmtDate(order.expectedAt)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 justify-end flex-wrap">
                        {order.status === 'DRAFT' && (
                          <button
                            onClick={() => handleMarkSent(order.id)}
                            disabled={isPending}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold rounded-lg text-xs hover:bg-blue-200 dark:hover:bg-blue-800/60 transition-colors disabled:opacity-50"
                          >
                            <ChevronDown className="h-3 w-3 rotate-[-90deg]" /> Enviar
                          </button>
                        )}
                        {(order.status === 'SENT' || order.status === 'PARTIAL') && (
                          <button
                            onClick={() => openReceive(order)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold rounded-lg text-xs hover:bg-emerald-200 dark:hover:bg-emerald-800/60 transition-colors"
                          >
                            <PackageCheck className="h-3 w-3" /> Recibir
                          </button>
                        )}
                        {order.status !== 'CANCELLED' && order.status !== 'RECEIVED' && (
                          <button
                            onClick={() => handleCancel(order.id)}
                            disabled={isPending}
                            className="flex items-center gap-1 px-3 py-1.5 bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 font-bold rounded-lg text-xs hover:bg-rose-200 dark:hover:bg-rose-800/60 transition-colors disabled:opacity-50"
                          >
                            <XCircle className="h-3 w-3" /> Cancelar
                          </button>
                        )}
                        {order.status === 'RECEIVED' && (
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                            <CheckCircle2 className="h-4 w-4" /> Completa
                          </span>
                        )}
                        {order.status === 'CANCELLED' && (
                          <span className="text-neutral-400 text-xs italic">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: NUEVA ORDEN DE COMPRA
      ═══════════════════════════════════════════════════════════════════════ */}
      {showNewOC && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
              <h2 className="text-xl font-black text-neutral-900 dark:text-white flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-orange-500" /> Nueva Orden de Compra
              </h2>
              <button
                onClick={() => setShowNewOC(false)}
                className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="h-5 w-5 text-neutral-400" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 p-6 space-y-5">

              {/* Proveedor + botón nuevo */}
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                  Proveedor
                </label>
                <div className="flex gap-2">
                  <select
                    value={ocSupplierId}
                    onChange={e => setOcSupplierId(e.target.value)}
                    className="flex-1 border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-black rounded-xl px-3 py-2.5 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">— Sin proveedor —</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}{s.rfc ? ` (${s.rfc})` : ''}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => { setShowNewSupplier(true); setError(null); }}
                    className="px-3 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-bold rounded-xl text-xs hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors whitespace-nowrap"
                  >
                    + Nuevo
                  </button>
                </div>
              </div>

              {/* Fecha esperada */}
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                  Fecha Esperada de Entrega
                </label>
                <input
                  type="date"
                  value={ocExpectedAt}
                  onChange={e => setOcExpectedAt(e.target.value)}
                  className="w-full border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-black rounded-xl px-3 py-2.5 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Notas */}
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                  Notas
                </label>
                <textarea
                  value={ocNotes}
                  onChange={e => setOcNotes(e.target.value)}
                  rows={2}
                  placeholder="Instrucciones especiales, condiciones de pago..."
                  className="w-full border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-black rounded-xl px-3 py-2.5 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                />
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                    Productos / Artículos
                  </label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" /> Agregar línea
                  </button>
                </div>

                <div className="space-y-2">
                  {/* Column headers */}
                  <div className="grid grid-cols-12 gap-2 px-1">
                    <div className="col-span-6 text-[10px] font-bold text-neutral-400 uppercase">Producto</div>
                    <div className="col-span-2 text-[10px] font-bold text-neutral-400 uppercase text-center">Qty</div>
                    <div className="col-span-3 text-[10px] font-bold text-neutral-400 uppercase text-right">Costo Unit.</div>
                    <div className="col-span-1" />
                  </div>

                  {ocItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-neutral-50 dark:bg-black/40 border border-neutral-200 dark:border-neutral-800 rounded-xl p-2">
                      <div className="col-span-6">
                        <input
                          type="text"
                          value={item.productName}
                          onChange={e => updateItem(idx, 'productName', e.target.value)}
                          placeholder="Nombre del producto"
                          className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2.5 py-1.5 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2 py-1.5 text-sm text-center text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitCost}
                          onChange={e => updateItem(idx, 'unitCost', parseFloat(e.target.value) || 0)}
                          className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2.5 py-1.5 text-sm text-right text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        {ocItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="p-1 text-rose-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="flex justify-end mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                  <span className="text-sm font-bold text-neutral-500 mr-4">Total:</span>
                  <span className="text-lg font-black text-orange-600 dark:text-orange-400">{fmt(ocTotal)}</span>
                </div>
              </div>

              {/* Error inline */}
              {error && (
                <div className="text-sm text-rose-600 dark:text-rose-400 font-medium bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-3">
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-neutral-200 dark:border-neutral-800">
              <button
                onClick={() => setShowNewOC(false)}
                className="flex-1 px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 font-bold rounded-xl text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateOC}
                disabled={ocLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl text-sm transition-colors shadow-lg shadow-orange-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {ocLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                Crear Orden de Compra
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: NUEVO PROVEEDOR
      ═══════════════════════════════════════════════════════════════════════ */}
      {showNewSupplier && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl w-full max-w-md">

            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
              <h2 className="text-lg font-black text-neutral-900 dark:text-white">Nuevo Proveedor</h2>
              <button onClick={() => setShowNewSupplier(false)} className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                <X className="h-5 w-5 text-neutral-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {[
                { label: 'Nombre *', value: spName, setter: setSpName, placeholder: 'Nombre del proveedor', required: true },
                { label: 'RFC', value: spRfc, setter: setSpRfc, placeholder: 'ABC123456XYZ', required: false },
                { label: 'Email', value: spEmail, setter: setSpEmail, placeholder: 'contacto@empresa.mx', required: false },
                { label: 'Teléfono', value: spPhone, setter: setSpPhone, placeholder: '+52 55 1234 5678', required: false },
                { label: 'Nombre de Contacto', value: spContact, setter: setSpContact, placeholder: 'Nombre del encargado', required: false },
              ].map(field => (
                <div key={field.label}>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                    {field.label}
                  </label>
                  <input
                    type="text"
                    value={field.value}
                    onChange={e => field.setter(e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-black rounded-xl px-3 py-2.5 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              ))}

              {error && (
                <div className="text-sm text-rose-600 dark:text-rose-400 font-medium bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-3">
                  {error}
                </div>
              )}
            </div>

            <div className="flex gap-3 p-6 border-t border-neutral-200 dark:border-neutral-800">
              <button
                onClick={() => setShowNewSupplier(false)}
                className="flex-1 px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 font-bold rounded-xl text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateSupplier}
                disabled={spLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-950 dark:bg-white text-white dark:text-black font-black rounded-xl text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {spLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Guardar Proveedor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: RECIBIR MERCANCÍA
      ═══════════════════════════════════════════════════════════════════════ */}
      {receiveOrder && (
        <ReceiveModal
          order={receiveOrder}
          receiveQtys={receiveQtys}
          setReceiveQtys={setReceiveQtys}
          onClose={() => setReceiveOrder(null)}
          onConfirm={handleReceiveGoods}
          loading={receiveLoading}
          error={error}
          setError={setError}
        />
      )}
    </div>
  );
}

// ─── MODAL RECIBIR MERCANCÍA (sub-componente) ─────────────────────────────────

interface ReceiveModalProps {
  order: PurchaseOrderRow;
  receiveQtys: Record<string, number>;
  setReceiveQtys: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  error: string | null;
  setError: (e: string | null) => void;
}

function ReceiveModal({
  order,
  receiveQtys,
  setReceiveQtys,
  onClose,
  onConfirm,
  loading,
  error,
  setError,
}: ReceiveModalProps) {
  const [detail, setDetail] = useState<import('./actions').PurchaseOrderDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(true);

  // Load detail on mount
  useState(() => {
    (async () => {
      try {
        const { getPurchaseOrderDetail } = await import('./actions');
        const d = await getPurchaseOrderDetail(order.id);
        setDetail(d);
      } catch {
        // noop
      } finally {
        setLoadingDetail(false);
      }
    })();
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h2 className="text-xl font-black text-neutral-900 dark:text-white flex items-center gap-2">
              <PackageCheck className="h-5 w-5 text-emerald-500" /> Recibir Mercancía
            </h2>
            <p className="text-xs text-neutral-500 mt-1 font-mono">
              OC-{String(order.orderNumber).padStart(4, '0')} &bull; {order.supplierName ?? 'Sin proveedor'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <X className="h-5 w-5 text-neutral-400" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6">
          {loadingDetail ? (
            <div className="flex items-center justify-center py-12 text-neutral-400">
              <Loader2 className="h-6 w-6 animate-spin mr-2" /> Cargando artículos...
            </div>
          ) : !detail || detail.items.length === 0 ? (
            <p className="text-center text-neutral-400 py-12">No hay artículos en esta orden.</p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-2 px-1 mb-1">
                <div className="col-span-5 text-[10px] font-bold text-neutral-400 uppercase">Producto</div>
                <div className="col-span-2 text-[10px] font-bold text-neutral-400 uppercase text-center">Pedido</div>
                <div className="col-span-2 text-[10px] font-bold text-neutral-400 uppercase text-center">Ya Recibido</div>
                <div className="col-span-3 text-[10px] font-bold text-neutral-400 uppercase text-center">Recibir Ahora</div>
              </div>

              {detail.items.map(item => {
                const pending = Math.max(0, item.quantity - item.quantityReceived);
                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 gap-2 items-center bg-neutral-50 dark:bg-black/40 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3"
                  >
                    <div className="col-span-5">
                      <p className="font-semibold text-neutral-900 dark:text-white text-sm truncate">{item.productName}</p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">Pendiente: {pending}</p>
                    </div>
                    <div className="col-span-2 text-center font-mono text-sm font-bold text-neutral-700 dark:text-neutral-300">
                      {item.quantity}
                    </div>
                    <div className="col-span-2 text-center font-mono text-sm font-semibold text-amber-600 dark:text-amber-400">
                      {item.quantityReceived}
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        min="0"
                        max={pending}
                        value={receiveQtys[item.id] ?? ''}
                        onChange={e => setReceiveQtys(prev => ({
                          ...prev,
                          [item.id]: parseFloat(e.target.value) || 0,
                        }))}
                        placeholder="0"
                        className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2.5 py-1.5 text-sm text-center text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {error && (
            <div className="mt-4 text-sm text-rose-600 dark:text-rose-400 font-medium bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
              <button onClick={() => setError(null)} className="ml-auto"><X className="h-3.5 w-3.5" /></button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-neutral-200 dark:border-neutral-800">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 font-bold rounded-xl text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || loadingDetail}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-sm transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageCheck className="h-4 w-4" />}
            Confirmar Recepción
          </button>
        </div>
      </div>
    </div>
  );
}
