'use client';

/**
 * CIFRA — SCM Inventarios
 * ============================
 * FASE 17: Gestión real de productos, almacenes y movimientos de stock.
 * Migrado de datos mock → Prisma puro.
 */

import { useState, useEffect, useTransition } from 'react';
import {
  Package, Warehouse, AlertTriangle,
  Plus, RefreshCw, Loader2,
  Lock, Unlock, History, Search,
  CheckCircle2, X, SlidersHorizontal,
} from 'lucide-react';
import {
  getProductCatalog, getInventarioKpis, getWarehouses,
  getStockMovements, adjustStock, createProduct, createWarehouse,
  toggleWarehouseLock, getOrCreateDefaultWarehouse,
  type ProductRow, type WarehouseRow, type StockMovementRow, type InventarioKpis,
} from './actions';

// ─── helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 });
}
const MOVEMENT_LABELS: Record<string, string> = {
  ENTRADA: 'Entrada',  SALIDA: 'Salida',
  AJUSTE_POS: 'Ajuste +', AJUSTE_NEG: 'Ajuste −',
  TRANSFERENCIA: 'Transferencia', DEVOLUCION: 'Devolución',
};
const MOVEMENT_COLORS: Record<string, string> = {
  ENTRADA: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-400',
  SALIDA:  'text-rose-600 bg-rose-100 dark:bg-rose-500/20 dark:text-rose-400',
  AJUSTE_POS: 'text-blue-600 bg-blue-100 dark:bg-blue-500/20 dark:text-blue-400',
  AJUSTE_NEG: 'text-amber-600 bg-amber-100 dark:bg-amber-500/20 dark:text-amber-400',
  TRANSFERENCIA: 'text-purple-600 bg-purple-100 dark:bg-purple-500/20 dark:text-purple-400',
  DEVOLUCION: 'text-orange-600 bg-orange-100 dark:bg-orange-500/20 dark:text-orange-400',
};

const EMPTY_KPIS: InventarioKpis = {
  totalProducts: 0, activeProducts: 0, lowStockCount: 0,
  outOfStockCount: 0, totalValue: 0, totalUnits: 0,
};

// ─── Componente ───────────────────────────────────────────────────────────────

export default function InventariosPage() {
  const [tab, setTab] = useState<'catalogo' | 'almacenes' | 'movimientos' | 'alertas'>('catalogo');
  const [isPending, startTransition] = useTransition();

  const [kpis,       setKpis]       = useState<InventarioKpis>(EMPTY_KPIS);
  const [products,   setProducts]   = useState<ProductRow[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseRow[]>([]);
  const [movements,  setMovements]  = useState<StockMovementRow[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [search,     setSearch]     = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Modales
  const [showAdjustModal,    setShowAdjustModal]    = useState(false);
  const [showProductModal,   setShowProductModal]   = useState(false);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [selectedProduct,    setSelectedProduct]    = useState<ProductRow | null>(null);

  // Formularios
  const [adjustForm, setAdjustForm] = useState({
    type: 'ENTRADA' as 'ENTRADA' | 'SALIDA' | 'AJUSTE_POS' | 'AJUSTE_NEG' | 'DEVOLUCION',
    quantity: '',
    reference: '',
    notes: '',
    warehouseId: '',
  });
  const [productForm, setProductForm] = useState({
    name: '', sku: '', barcode: '', category: '',
    price: '', cost: '', minStock: '0', trackStock: false,
    claveProdServ: '43231500',
  });
  const [warehouseForm, setWarehouseForm] = useState({
    name: '', code: '', address: '', isDefault: false,
  });

  // ── Carga de datos ──
  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [k, p, w, m, whId] = await Promise.all([
        getInventarioKpis(),
        getProductCatalog(),
        getWarehouses(),
        getStockMovements(50),
        getOrCreateDefaultWarehouse(),
      ]);
      setKpis(k);
      setProducts(p);
      setWarehouses(w);
      setMovements(m);
      setAdjustForm((f) => ({ ...f, warehouseId: whId }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // ── Ajuste de stock ──
  function handleAdjust(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProduct || !adjustForm.warehouseId) return;
    setError(null);
    startTransition(async () => {
      try {
        await adjustStock({
          warehouseId: adjustForm.warehouseId,
          productId:   selectedProduct.id,
          type:        adjustForm.type,
          quantity:    parseFloat(adjustForm.quantity),
          reference:   adjustForm.reference || undefined,
          notes:       adjustForm.notes || undefined,
        });
        setShowAdjustModal(false);
        setAdjustForm((f) => ({ ...f, quantity: '', reference: '', notes: '' }));
        await load();
      } catch (err: any) {
        setError(err.message);
      }
    });
  }

  // ── Crear producto ──
  function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await createProduct({
          name: productForm.name,
          sku:  productForm.sku || undefined,
          barcode: productForm.barcode || undefined,
          category: productForm.category || undefined,
          price: parseFloat(productForm.price),
          cost:  productForm.cost ? parseFloat(productForm.cost) : undefined,
          minStock: parseInt(productForm.minStock) || 0,
          trackStock: productForm.trackStock,
          claveProdServ: productForm.claveProdServ,
        });
        setShowProductModal(false);
        setProductForm({ name: '', sku: '', barcode: '', category: '', price: '', cost: '', minStock: '0', trackStock: false, claveProdServ: '43231500' });
        await load();
      } catch (err: any) {
        setError(err.message);
      }
    });
  }

  // ── Crear almacén ──
  function handleCreateWarehouse(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await createWarehouse({
          name: warehouseForm.name,
          code: warehouseForm.code,
          address: warehouseForm.address || undefined,
          isDefault: warehouseForm.isDefault,
        });
        setShowWarehouseModal(false);
        setWarehouseForm({ name: '', code: '', address: '', isDefault: false });
        await load();
      } catch (err: any) {
        setError(err.message);
      }
    });
  }

  // ── Filtrado ──
  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[];
  const filteredProducts = products.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode ?? '').toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCategory || p.category === filterCategory;
    return matchSearch && matchCat;
  });

  const lowStockProducts   = products.filter((p) => p.isLowStock);
  const outOfStockProducts = products.filter((p) => p.trackStock && p.stock <= 0);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8 transition-colors">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* ── HEADER ── */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-orange-500/10 p-3 rounded-2xl border border-orange-500/20">
              <Warehouse className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">Inventarios SCM</h1>
              <p className="text-neutral-500 font-medium text-sm mt-1">
                {kpis.totalProducts} productos · {warehouses.length} almacén{warehouses.length !== 1 ? 'es' : ''}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowProductModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/20 text-sm">
              <Plus className="h-4 w-4" /> Nuevo Producto
            </button>
            <button onClick={load} disabled={loading}
              className="flex items-center gap-2 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl hover:bg-neutral-200 transition-all text-sm disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* ── ERROR ── */}
        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl px-5 py-4 text-sm font-medium text-red-700 dark:text-red-400 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)}><X className="h-4 w-4" /></button>
          </div>
        )}

        {/* ── KPIs ── */}
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
              <div className="col-span-2 bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 border-l-4 border-l-orange-500">
                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Valoración</p>
                <p className="text-2xl font-black text-orange-600 dark:text-orange-400 mt-1">{fmt(kpis.totalValue)}</p>
                <p className="text-[10px] text-neutral-400 mt-1">Σ Stock × Costo</p>
              </div>
              <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Productos</p>
                <p className="text-2xl font-black text-neutral-900 dark:text-white mt-1">{kpis.totalProducts}</p>
              </div>
              <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Unidades</p>
                <p className="text-2xl font-black text-neutral-900 dark:text-white mt-1">{kpis.totalUnits.toLocaleString('es-MX')}</p>
              </div>
              <div className={`p-5 rounded-2xl border ${
                kpis.lowStockCount > 0
                  ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-800 border-l-4 border-l-amber-500'
                  : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'
              }`}>
                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Bajo mínimo</p>
                <p className={`text-2xl font-black mt-1 ${kpis.lowStockCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-900 dark:text-white'}`}>
                  {kpis.lowStockCount}
                </p>
              </div>
              <div className={`p-5 rounded-2xl border ${
                kpis.outOfStockCount > 0
                  ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-800 border-l-4 border-l-red-500'
                  : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'
              }`}>
                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Sin stock</p>
                <p className={`text-2xl font-black mt-1 ${kpis.outOfStockCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-neutral-900 dark:text-white'}`}>
                  {kpis.outOfStockCount}
                </p>
              </div>
            </div>

            {/* ── TABS ── */}
            <div className="flex overflow-x-auto border-b border-neutral-200 dark:border-neutral-800 pb-2 gap-2">
              {([
                { id: 'catalogo',    label: 'Catálogo',    icon: Package,       badge: kpis.totalProducts },
                { id: 'almacenes',   label: 'Almacenes',   icon: Warehouse,     badge: warehouses.length },
                { id: 'movimientos', label: 'Movimientos', icon: History,       badge: null },
                { id: 'alertas',     label: 'Alertas',     icon: AlertTriangle, badge: kpis.lowStockCount + kpis.outOfStockCount },
              ] as const).map((t) => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                    tab === t.id
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                      : 'bg-white dark:bg-neutral-900 text-neutral-500 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                  }`}>
                  <t.icon className="h-4 w-4" />
                  {t.label}
                  {t.badge !== null && t.badge > 0 && (
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                      tab === t.id ? 'bg-white/20 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                    }`}>{t.badge}</span>
                  )}
                </button>
              ))}
            </div>

            {/* ── CONTENIDO ── */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm p-6">

              {/* CATÁLOGO */}
              {tab === 'catalogo' && (
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                      <input type="text" placeholder="Buscar por nombre, SKU o código de barras..."
                        value={search} onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-orange-500" />
                    </div>
                    <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
                      className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-orange-500">
                      <option value="">Todas las categorías</option>
                      {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {filteredProducts.length === 0 ? (
                    <div className="text-center py-16">
                      <Package className="h-14 w-14 text-neutral-300 mx-auto mb-3" />
                      <p className="text-neutral-500 font-medium">Sin productos{search ? ' que coincidan' : ''}</p>
                      <p className="text-neutral-400 text-sm mt-1">Usa "Nuevo Producto" para agregar tu catálogo</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-2xl">
                      <table className="min-w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-neutral-50 dark:bg-black/50 border-b border-neutral-200 dark:border-neutral-800 text-[10px] uppercase text-neutral-500 tracking-widest font-black">
                          <tr>
                            <th className="p-4">Producto</th>
                            <th className="p-4">Categoría</th>
                            <th className="p-4 text-right">Precio</th>
                            <th className="p-4 text-right">Costo</th>
                            <th className="p-4 text-right">Margen</th>
                            <th className="p-4 text-center">Stock</th>
                            <th className="p-4 text-center">Estado</th>
                            <th className="p-4"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                          {filteredProducts.map((p) => (
                            <tr key={p.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                              <td className="p-4">
                                <p className="font-bold text-neutral-900 dark:text-white">{p.name}</p>
                                {p.sku && <p className="text-[10px] text-neutral-500 font-mono">{p.sku}</p>}
                              </td>
                              <td className="p-4">
                                <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-[10px] font-bold text-neutral-500">
                                  {p.category ?? '—'}
                                </span>
                              </td>
                              <td className="p-4 text-right font-mono">{fmt(p.price)}</td>
                              <td className="p-4 text-right font-mono text-neutral-500">{p.cost != null ? fmt(p.cost) : '—'}</td>
                              <td className="p-4 text-right">
                                {p.margin != null ? (
                                  <span className={`font-bold ${p.margin < 10 ? 'text-red-500' : p.margin < 30 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                    {p.margin.toFixed(1)}%
                                  </span>
                                ) : '—'}
                              </td>
                              <td className="p-4 text-center">
                                {p.trackStock ? (
                                  <span className={`px-2 py-1 rounded text-xs font-black ${
                                    p.stock <= 0
                                      ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                                      : p.isLowStock
                                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                  }`}>
                                    {p.stock}
                                  </span>
                                ) : (
                                  <span className="text-neutral-400 text-xs">∞</span>
                                )}
                              </td>
                              <td className="p-4 text-center">
                                {p.isActive
                                  ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                                  : <span className="text-xs text-neutral-400">Inactivo</span>
                                }
                              </td>
                              <td className="p-4">
                                {p.trackStock && (
                                  <button
                                    onClick={() => { setSelectedProduct(p); setShowAdjustModal(true); }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-500/20 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                                    <SlidersHorizontal className="h-3 w-3" /> Ajustar
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ALMACENES */}
              {tab === 'almacenes' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-neutral-900 dark:text-white">Almacenes</h2>
                    <button onClick={() => setShowWarehouseModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm transition-all">
                      <Plus className="h-4 w-4" /> Nuevo Almacén
                    </button>
                  </div>

                  {warehouses.length === 0 ? (
                    <div className="text-center py-12">
                      <Warehouse className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                      <p className="text-neutral-500 font-medium">Sin almacenes configurados</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {warehouses.map((wh) => (
                        <div key={wh.id} className={`p-5 rounded-2xl border ${
                          wh.isLocked
                            ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-800'
                            : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'
                        }`}>
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-black text-neutral-900 dark:text-white">{wh.name}</p>
                              <p className="text-xs font-mono text-neutral-500 mt-0.5">{wh.code}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {wh.isDefault && (
                                <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded text-[10px] font-black">PRINCIPAL</span>
                              )}
                              {wh.isLocked && <Lock className="h-4 w-4 text-amber-500" />}
                            </div>
                          </div>
                          {wh.address && <p className="text-xs text-neutral-500 mb-3">{wh.address}</p>}
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-neutral-500">{wh.movementsCount} movimientos</span>
                            <button
                              onClick={() => startTransition(async () => {
                                try { await toggleWarehouseLock(wh.id); await load(); }
                                catch (e: any) { setError(e.message); }
                              })}
                              className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg transition-colors ${
                                wh.isLocked
                                  ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-200'
                                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
                              }`}>
                              {wh.isLocked
                                ? <><Unlock className="h-3 w-3" /> Desbloquear</>
                                : <><Lock className="h-3 w-3" /> Bloquear</>
                              }
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* MOVIMIENTOS */}
              {tab === 'movimientos' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white">Últimos 50 Movimientos</h2>
                  {movements.length === 0 ? (
                    <div className="text-center py-12">
                      <History className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                      <p className="text-neutral-500 font-medium">Sin movimientos registrados</p>
                      <p className="text-neutral-400 text-sm mt-1">Los ajustes de inventario aparecerán aquí</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-2xl">
                      <table className="min-w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-neutral-50 dark:bg-black/50 border-b border-neutral-200 dark:border-neutral-800 text-[10px] uppercase text-neutral-500 tracking-widest font-black">
                          <tr>
                            <th className="p-4">Fecha</th>
                            <th className="p-4">Tipo</th>
                            <th className="p-4">Producto</th>
                            <th className="p-4">Almacén</th>
                            <th className="p-4 text-right">Antes</th>
                            <th className="p-4 text-center">Δ</th>
                            <th className="p-4 text-right">Después</th>
                            <th className="p-4">Referencia</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                          {movements.map((m) => (
                            <tr key={m.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                              <td className="p-4 text-xs text-neutral-500">
                                {new Date(m.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="p-4">
                                <span className={`px-2 py-1 rounded text-[10px] font-black ${MOVEMENT_COLORS[m.type] ?? 'bg-neutral-100 text-neutral-600'}`}>
                                  {MOVEMENT_LABELS[m.type] ?? m.type}
                                </span>
                              </td>
                              <td className="p-4">
                                <p className="font-medium text-neutral-900 dark:text-white">{m.productName}</p>
                                {m.productSku && <p className="text-[10px] text-neutral-500 font-mono">{m.productSku}</p>}
                              </td>
                              <td className="p-4 text-xs text-neutral-500">{m.warehouseName}</td>
                              <td className="p-4 text-right font-mono text-neutral-500">{m.quantityBefore}</td>
                              <td className="p-4 text-center">
                                <span className={`font-black text-sm ${m.quantity > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                  {m.quantity > 0 ? '+' : ''}{m.quantity}
                                </span>
                              </td>
                              <td className="p-4 text-right font-mono font-bold text-neutral-900 dark:text-white">{m.quantityAfter}</td>
                              <td className="p-4 text-xs text-neutral-500 font-mono">{m.reference ?? '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ALERTAS */}
              {tab === 'alertas' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white">Alertas de Inventario</h2>

                  {outOfStockProducts.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-black text-red-600 dark:text-red-400 flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        Sin Stock ({outOfStockProducts.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {outOfStockProducts.map((p) => (
                          <div key={p.id} className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-800 rounded-2xl">
                            <div>
                              <p className="font-bold text-sm text-red-900 dark:text-red-100">{p.name}</p>
                              <p className="text-xs text-red-600 dark:text-red-400">{p.sku ?? p.id.slice(0, 8)}</p>
                            </div>
                            <div className="text-right">
                              <span className="px-2 py-1 bg-red-200 dark:bg-red-500/30 text-red-700 dark:text-red-300 rounded text-xs font-black">0</span>
                              <p className="text-[10px] text-red-500 mt-1">mín: {p.minStock}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {lowStockProducts.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-black text-amber-600 dark:text-amber-400 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Bajo Mínimo ({lowStockProducts.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {lowStockProducts.map((p) => (
                          <div key={p.id} className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-800 rounded-2xl">
                            <div>
                              <p className="font-bold text-sm text-amber-900 dark:text-amber-100">{p.name}</p>
                              <p className="text-xs text-amber-600 dark:text-amber-400">{p.sku ?? p.id.slice(0, 8)}</p>
                            </div>
                            <div className="text-right">
                              <span className="px-2 py-1 bg-amber-200 dark:bg-amber-500/30 text-amber-700 dark:text-amber-300 rounded text-xs font-black">{p.stock}</span>
                              <p className="text-[10px] text-amber-500 mt-1">mín: {p.minStock}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {outOfStockProducts.length === 0 && lowStockProducts.length === 0 && (
                    <div className="text-center py-12">
                      <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
                      <p className="font-bold text-emerald-700 dark:text-emerald-400">¡Inventario saludable!</p>
                      <p className="text-sm text-neutral-500 mt-1">Todos los productos con stock tracking tienen niveles adecuados</p>
                    </div>
                  )}
                </div>
              )}

            </div>
          </>
        )}

        {/* ── MODAL AJUSTE STOCK ── */}
        {showAdjustModal && selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-black text-lg text-neutral-900 dark:text-white">Ajuste de Stock</h3>
                  <p className="text-sm text-neutral-500">{selectedProduct.name} · Actual: <strong>{selectedProduct.stock}</strong></p>
                </div>
                <button onClick={() => setShowAdjustModal(false)} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleAdjust} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">Tipo de movimiento</label>
                  <select value={adjustForm.type} onChange={(e) => setAdjustForm((f) => ({ ...f, type: e.target.value as typeof adjustForm.type }))}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-orange-500">
                    <option value="ENTRADA">Entrada (compra / recepción)</option>
                    <option value="SALIDA">Salida (despacho manual)</option>
                    <option value="AJUSTE_POS">Ajuste positivo</option>
                    <option value="AJUSTE_NEG">Ajuste negativo</option>
                    <option value="DEVOLUCION">Devolución de cliente</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">Cantidad <span className="text-red-500">*</span></label>
                    <input type="number" placeholder="0" value={adjustForm.quantity}
                      onChange={(e) => setAdjustForm((f) => ({ ...f, quantity: e.target.value }))}
                      required min={1}
                      className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-orange-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">Almacén</label>
                    <select value={adjustForm.warehouseId} onChange={(e) => setAdjustForm((f) => ({ ...f, warehouseId: e.target.value }))}
                      className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-orange-500">
                      {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">Referencia</label>
                  <input type="text" placeholder="Ej: OC-2026-001" value={adjustForm.reference}
                    onChange={(e) => setAdjustForm((f) => ({ ...f, reference: e.target.value }))}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">Notas</label>
                  <input type="text" placeholder="Observaciones opcionales" value={adjustForm.notes}
                    onChange={(e) => setAdjustForm((f) => ({ ...f, notes: e.target.value }))}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-orange-500" />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowAdjustModal(false)}
                    className="px-4 py-2 text-sm font-bold text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded-xl">Cancelar</button>
                  <button type="submit" disabled={isPending}
                    className="px-5 py-2 text-sm font-black text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-colors disabled:opacity-50">
                    {isPending ? 'Procesando...' : 'Confirmar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── MODAL NUEVO PRODUCTO ── */}
        {showProductModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 my-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-lg text-neutral-900 dark:text-white">Nuevo Producto</h3>
                <button onClick={() => setShowProductModal(false)} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleCreateProduct} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">Nombre <span className="text-red-500">*</span></label>
                    <input type="text" value={productForm.name} onChange={(e) => setProductForm((f) => ({ ...f, name: e.target.value }))} required placeholder="Ej: Laptop Dell Inspiron"
                      className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-orange-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">SKU</label>
                    <input type="text" value={productForm.sku} onChange={(e) => setProductForm((f) => ({ ...f, sku: e.target.value }))} placeholder="LPT-001"
                      className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-orange-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">Código de barras</label>
                    <input type="text" value={productForm.barcode} onChange={(e) => setProductForm((f) => ({ ...f, barcode: e.target.value }))} placeholder="7501234567890"
                      className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-orange-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">Precio de venta <span className="text-red-500">*</span></label>
                    <input type="number" value={productForm.price} onChange={(e) => setProductForm((f) => ({ ...f, price: e.target.value }))} required min={0.01} step={0.01} placeholder="1200.00"
                      className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-orange-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">Costo</label>
                    <input type="number" value={productForm.cost} onChange={(e) => setProductForm((f) => ({ ...f, cost: e.target.value }))} min={0} step={0.01} placeholder="800.00"
                      className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-orange-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">Categoría</label>
                    <input type="text" value={productForm.category} onChange={(e) => setProductForm((f) => ({ ...f, category: e.target.value }))} placeholder="Electrónica"
                      className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-orange-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">Stock mínimo</label>
                    <input type="number" value={productForm.minStock} onChange={(e) => setProductForm((f) => ({ ...f, minStock: e.target.value }))} min={0}
                      className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-orange-500" />
                  </div>
                  <div className="col-span-2 flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <input type="checkbox" id="trackStock" checked={productForm.trackStock}
                      onChange={(e) => setProductForm((f) => ({ ...f, trackStock: e.target.checked }))}
                      className="w-4 h-4 accent-orange-500" />
                    <label htmlFor="trackStock" className="text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer">
                      Controlar stock (descontar en ventas POS)
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowProductModal(false)}
                    className="px-4 py-2 text-sm font-bold text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded-xl">Cancelar</button>
                  <button type="submit" disabled={isPending}
                    className="px-5 py-2 text-sm font-black text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-colors disabled:opacity-50">
                    {isPending ? 'Guardando...' : 'Crear Producto'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── MODAL NUEVO ALMACÉN ── */}
        {showWarehouseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-lg text-neutral-900 dark:text-white">Nuevo Almacén</h3>
                <button onClick={() => setShowWarehouseModal(false)} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleCreateWarehouse} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">Nombre <span className="text-red-500">*</span></label>
                  <input type="text" value={warehouseForm.name} onChange={(e) => setWarehouseForm((f) => ({ ...f, name: e.target.value }))} required placeholder="Almacén Centro"
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">Código <span className="text-red-500">*</span></label>
                  <input type="text" value={warehouseForm.code} onChange={(e) => setWarehouseForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} required placeholder="ALM-02"
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-mono text-neutral-900 dark:text-white focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">Dirección</label>
                  <input type="text" value={warehouseForm.address} onChange={(e) => setWarehouseForm((f) => ({ ...f, address: e.target.value }))} placeholder="Calle, Colonia, Ciudad"
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-orange-500" />
                </div>
                <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
                  <input type="checkbox" id="isDefault" checked={warehouseForm.isDefault}
                    onChange={(e) => setWarehouseForm((f) => ({ ...f, isDefault: e.target.checked }))}
                    className="w-4 h-4 accent-orange-500" />
                  <label htmlFor="isDefault" className="text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer">
                    Establecer como almacén principal
                  </label>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowWarehouseModal(false)}
                    className="px-4 py-2 text-sm font-bold text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded-xl">Cancelar</button>
                  <button type="submit" disabled={isPending}
                    className="px-5 py-2 text-sm font-black text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-colors disabled:opacity-50">
                    {isPending ? 'Guardando...' : 'Crear'}
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
