'use client';

/**
 * CIFRA — Terminal del Punto de Venta
 * =========================================
 * Interfaz principal del POS. Catálogo a la izquierda, carrito a la derecha.
 * Toda la calculadora corre client-side via Zustand.
 * Solo llama al servidor en: carga inicial y checkout.
 */

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { usePosStore } from '@/stores/pos-store';
import {
  loadProducts, checkout, createProduct, updateProduct,
  toggleProductActive, deleteProduct, getProductsForManagement,
} from '@/app/(dashboard)/pos/actions';
import type { CheckoutInput } from '@/app/(dashboard)/pos/actions';

// ─── Tipos para gestión ────────────────────────────────
type ManagedProduct = {
  id: string; name: string; sku: string | null; barcode: string | null;
  category: string | null; price: number; cost: number | null;
  stock: number; trackStock: boolean; priceIncludesTax: boolean;
  taxRate: number; isActive: boolean; imageUrl: string | null;
  claveProdServ: string; claveUnidad: string; unidad: string;
  description: string | null;
};

// ─── Modal: Crear / Editar Producto ───────────────────
function ProductFormModal({
  product,
  onClose,
  onSaved,
}: {
  product?: ManagedProduct;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!product;
  const [isPending, start] = useTransition();
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: product?.name ?? '',
    sku: product?.sku ?? '',
    barcode: product?.barcode ?? '',
    category: product?.category ?? '',
    description: product?.description ?? '',
    price: product?.price?.toString() ?? '',
    cost: product?.cost?.toString() ?? '',
    stock: product?.stock?.toString() ?? '0',
    trackStock: product?.trackStock ?? false,
    priceIncludesTax: product?.priceIncludesTax ?? true,
    taxRate: ((product?.taxRate ?? 0.16) * 100).toString(),
    claveProdServ: product?.claveProdServ ?? '84111506',
    claveUnidad: product?.claveUnidad ?? 'H87',
    unidad: product?.unidad ?? 'Pieza',
  });

  function set(key: string, val: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError('El nombre es requerido'); return; }
    if (!form.price || isNaN(Number(form.price))) { setError('Precio inválido'); return; }
    setError('');
    const payload = {
      name: form.name.trim(),
      sku: form.sku || undefined,
      barcode: form.barcode || undefined,
      category: form.category || undefined,
      description: form.description || undefined,
      price: Number(form.price),
      cost: form.cost ? Number(form.cost) : undefined,
      stock: Number(form.stock) || 0,
      trackStock: form.trackStock,
      priceIncludesTax: form.priceIncludesTax,
      taxRate: Number(form.taxRate) / 100,
      claveProdServ: form.claveProdServ || '84111506',
      claveUnidad: form.claveUnidad || 'H87',
      unidad: form.unidad || 'Pieza',
    };
    start(async () => {
      try {
        if (isEdit) {
          await updateProduct(product!.id, payload);
        } else {
          await createProduct(payload);
        }
        onSaved();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al guardar');
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-white">{isEdit ? 'Editar producto' : 'Nuevo producto'}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {error && <p className="text-sm text-red-400 bg-red-900/30 border border-red-800 rounded-lg px-3 py-2">{error}</p>}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs text-zinc-400 font-semibold mb-1 uppercase tracking-wider">Nombre *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 font-semibold mb-1 uppercase tracking-wider">SKU</label>
              <input value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="Ej. PROD-001"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 font-semibold mb-1 uppercase tracking-wider">Código de barras</label>
              <input value={form.barcode} onChange={e => set('barcode', e.target.value)} placeholder="Ej. 7501000000000"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 font-semibold mb-1 uppercase tracking-wider">Categoría</label>
              <input value={form.category} onChange={e => set('category', e.target.value)} placeholder="Ej. Bebidas"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 font-semibold mb-1 uppercase tracking-wider">Precio de venta *</label>
              <input type="number" step="0.01" min="0" value={form.price} onChange={e => set('price', e.target.value)} required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 font-semibold mb-1 uppercase tracking-wider">Costo</label>
              <input type="number" step="0.01" min="0" value={form.cost} onChange={e => set('cost', e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 font-semibold mb-1 uppercase tracking-wider">IVA (%)</label>
              <select value={form.taxRate} onChange={e => set('taxRate', e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none">
                <option value="16">16%</option>
                <option value="8">8% (Frontera)</option>
                <option value="0">0% (Exento)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 font-semibold mb-1 uppercase tracking-wider">Stock inicial</label>
              <input type="number" min="0" value={form.stock} onChange={e => set('stock', e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 font-semibold mb-1 uppercase tracking-wider">Clave SAT (Prod/Serv)</label>
              <input value={form.claveProdServ} onChange={e => set('claveProdServ', e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 font-semibold mb-1 uppercase tracking-wider">Unidad SAT</label>
              <input value={form.unidad} onChange={e => set('unidad', e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none" />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.trackStock} onChange={e => set('trackStock', e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 text-pink-600 focus:ring-pink-500 bg-zinc-800" />
              <span className="text-sm text-zinc-300">Controlar stock</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.priceIncludesTax} onChange={e => set('priceIncludesTax', e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 text-pink-600 focus:ring-pink-500 bg-zinc-800" />
              <span className="text-sm text-zinc-300">Precio incluye IVA</span>
            </label>
          </div>
        </form>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-800">
          <button onClick={onClose} disabled={isPending}
            className="px-5 py-2 text-sm text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={handleSubmit as any} disabled={isPending}
            className="px-6 py-2 text-sm font-bold bg-pink-600 hover:bg-pink-700 text-white rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2">
            {isPending && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Panel: Gestión de Productos ──────────────────────
function ProductManagementPanel({ onClose, onRefreshCatalog }: { onClose: () => void; onRefreshCatalog: () => void }) {
  const [products, setProducts] = useState<ManagedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editTarget, setEditTarget] = useState<ManagedProduct | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [isPending, start] = useTransition();

  async function fetchProducts() {
    setLoading(true);
    try {
      const data = await getProductsForManagement();
      setProducts(data as ManagedProduct[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchProducts(); }, []);

  function handleSaved() {
    setShowNewModal(false);
    setEditTarget(null);
    fetchProducts();
    onRefreshCatalog();
  }

  function handleToggle(id: string) {
    start(async () => {
      await toggleProductActive(id);
      fetchProducts();
      onRefreshCatalog();
    });
  }

  function handleDelete(id: string) {
    if (!confirm('¿Eliminar este producto? Si tiene ventas, se desactivará en su lugar.')) return;
    start(async () => {
      await deleteProduct(id);
      fetchProducts();
      onRefreshCatalog();
    });
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode ?? '').includes(search)
  );

  return (
    <div className="fixed inset-0 z-40 flex">
      {/* Overlay */}
      <div className="flex-1 bg-black/60" onClick={onClose} />

      {/* Panel */}
      <div className="w-[680px] bg-zinc-950 border-l border-zinc-800 flex flex-col h-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <h2 className="text-xl font-bold text-white">Catálogo de Productos</h2>
            <p className="text-xs text-zinc-500 mt-0.5">{products.length} productos · {products.filter(p => p.isActive).length} activos</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white font-bold text-sm rounded-xl transition-colors"
            >
              + Nuevo producto
            </button>
            <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-zinc-800">✕</button>
          </div>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-zinc-800">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, SKU o código de barras..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-zinc-500 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Product list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-zinc-500 text-sm">No hay productos{search ? ' con ese criterio' : ' aún'}</p>
              {!search && (
                <button onClick={() => setShowNewModal(true)}
                  className="mt-4 px-5 py-2 bg-pink-600 hover:bg-pink-700 text-white font-bold text-sm rounded-xl transition-colors">
                  Crear primer producto
                </button>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 bg-zinc-900/90 backdrop-blur-sm">
                <tr className="border-b border-zinc-800">
                  <th className="text-left px-6 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Producto</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Precio</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Stock</th>
                  <th className="text-center px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Estado</th>
                  <th className="text-center px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filtered.map(p => (
                  <tr key={p.id} className={`hover:bg-zinc-800/30 transition-colors ${!p.isActive ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-3">
                      <p className="text-sm font-medium text-white truncate max-w-[200px]">{p.name}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {p.sku && <span className="mr-2">SKU: {p.sku}</span>}
                        {p.category && <span className="text-zinc-600">{p.category}</span>}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="text-sm font-bold text-pink-400">${Number(p.price).toFixed(2)}</p>
                      {p.cost && <p className="text-xs text-zinc-600">Costo: ${Number(p.cost).toFixed(2)}</p>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {p.trackStock ? (
                        <span className={`text-sm font-bold ${p.stock <= 0 ? 'text-red-400' : p.stock <= 5 ? 'text-amber-400' : 'text-zinc-300'}`}>
                          {p.stock}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggle(p.id)}
                        disabled={isPending}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-colors disabled:opacity-50 ${
                          p.isActive
                            ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-800 hover:bg-red-900/50 hover:text-red-400 hover:border-red-800'
                            : 'bg-zinc-800 text-zinc-500 border border-zinc-700 hover:bg-emerald-900/50 hover:text-emerald-400 hover:border-emerald-800'
                        }`}
                      >
                        {p.isActive ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setEditTarget(p)}
                          className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors text-xs"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={isPending}
                          className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-colors text-xs disabled:opacity-40"
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modales dentro del panel */}
      {showNewModal && <ProductFormModal onClose={() => setShowNewModal(false)} onSaved={handleSaved} />}
      {editTarget && <ProductFormModal product={editTarget} onClose={() => setEditTarget(null)} onSaved={handleSaved} />}
    </div>
  );
}

export default function PosTerminal() {
  const store = usePosStore();
  const [isPending, startTransition] = useTransition();
  const [lastTicket, setLastTicket] = useState<{ code: string; total: number; orderId: string } | null>(null);
  const [showManageProducts, setShowManageProducts] = useState(false);

  // Cargar catálogo una vez
  useEffect(() => {
    if (!store.productsLoaded) {
      startTransition(async () => {
        const products = await loadProducts();
        store.setProducts(products as any);
      });
    }
  }, []);

  // Recargar catálogo después de editar productos
  function handleRefreshCatalog() {
    startTransition(async () => {
      const products = await loadProducts();
      store.setProducts(products as any);
    });
  }

  const filteredProducts = store.filteredProducts();

  function handleCheckout() {
    if (store.cart.length === 0) return;
    if (store.amountPaid < store.totals.total && store.paymentMethod === '01') return;

    store.setIsCheckingOut(true);

    const input: CheckoutInput = {
      items: store.totals.items.map((b) => ({
        productId: b.productId,
        productName: b.name,
        quantity: b.quantity,
        unitPrice: b.unitPriceWithoutTax,
        taxRate: b.taxRate,
        taxAmount: b.taxAmount,
        subtotal: b.subtotal,
        total: b.total,
        discount: b.discount,
      })),
      subtotal: store.totals.subtotal,
      totalTax: store.totals.totalTax,
      discount: store.totals.discount,
      total: store.totals.total,
      paymentMethod: store.paymentMethod,
      amountPaid: store.amountPaid,
      changeDue: store.changeDue(),
    };

    startTransition(async () => {
      try {
        const result = await checkout(input);
        setLastTicket({ code: result.ticketCode, total: result.total, orderId: result.orderId });
        store.clearCart();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Error en checkout');
      } finally {
        store.setIsCheckingOut(false);
      }
    });
  }

  return (
    <>
    <div className="flex h-[calc(100vh-80px)] gap-4">
      {/* ═══ CATÁLOGO (Izquierda) ═══ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Barra de búsqueda + botón gestionar */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Buscar producto, SKU o codigo de barras..."
              value={store.searchQuery}
              onChange={(e) => store.setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
            <svg className="absolute left-3 top-3.5 w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button
            onClick={() => setShowManageProducts(true)}
            className="flex items-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-pink-500/50 text-zinc-300 hover:text-white font-medium text-sm rounded-xl transition-all whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Gestionar productos
          </button>
        </div>

        {/* Grid de productos */}
        <div className="flex-1 overflow-y-auto">
          {!store.productsLoaded ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-zinc-500">No hay productos en el catálogo</p>
              <button
                onClick={() => setShowManageProducts(true)}
                className="mt-3 px-5 py-2 bg-pink-600 hover:bg-pink-700 text-white font-bold text-sm rounded-xl transition-colors"
              >
                + Agregar primer producto
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => store.addToCart(product)}
                  className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 text-left hover:border-pink-500/50 hover:bg-zinc-800 transition-all active:scale-95"
                >
                  {product.imageUrl ? (
                    <div className="w-full h-20 bg-zinc-900 rounded-lg mb-3 overflow-hidden">
                      <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-full h-20 bg-zinc-900/50 rounded-lg mb-3 flex items-center justify-center">
                      <span className="text-2xl text-zinc-600">{product.name.charAt(0)}</span>
                    </div>
                  )}
                  <p className="font-medium text-white text-sm truncate">{product.name}</p>
                  {product.category && (
                    <p className="text-xs text-zinc-500 mt-0.5">{product.category}</p>
                  )}
                  <p className="text-pink-400 font-bold mt-1">
                    ${product.price.toFixed(2)}
                    {product.priceIncludesTax && (
                      <span className="text-xs text-zinc-500 font-normal ml-1">IVA incl.</span>
                    )}
                  </p>
                  {product.trackStock && (
                    <p className={`text-xs mt-1 ${product.stock > 0 ? 'text-zinc-500' : 'text-red-400'}`}>
                      Stock: {product.stock}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══ CARRITO (Derecha) ═══ */}
      <div className="w-96 flex flex-col bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
        {/* Header del carrito */}
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="font-bold text-white">
            Ticket {store.cart.length > 0 && `(${store.totals.unitCount})`}
          </h2>
          {store.cart.length > 0 && (
            <button onClick={store.clearCart} className="text-xs text-zinc-500 hover:text-red-400 transition-colors">
              Vaciar
            </button>
          )}
        </div>

        {/* Items del carrito */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {store.cart.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-zinc-600 text-sm">Agrega productos al ticket</p>
            </div>
          ) : (
            <div className="space-y-2">
              {store.totals.items.map((item) => (
                <div key={item.productId} className="flex items-center gap-3 py-2 border-b border-zinc-800/50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{item.name}</p>
                    <p className="text-xs text-zinc-500">
                      ${item.unitPriceWithoutTax.toFixed(2)} + IVA
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => store.updateQuantity(item.productId, store.cart.find(c => c.productId === item.productId)!.quantity - 1)}
                      className="w-7 h-7 bg-zinc-800 rounded text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors flex items-center justify-center text-sm"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm text-white">
                      {store.cart.find(c => c.productId === item.productId)?.quantity}
                    </span>
                    <button
                      onClick={() => store.updateQuantity(item.productId, store.cart.find(c => c.productId === item.productId)!.quantity + 1)}
                      className="w-7 h-7 bg-zinc-800 rounded text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors flex items-center justify-center text-sm"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-sm font-medium text-white w-20 text-right">
                    ${item.total.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totales y Pago */}
        {store.cart.length > 0 && (
          <div className="border-t border-zinc-800 px-4 py-3 space-y-3">
            {/* Desglose */}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal</span>
                <span>${store.totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>IVA</span>
                <span>${store.totals.totalTax.toFixed(2)}</span>
              </div>
              {store.totals.discount > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>Descuento</span>
                  <span>-${store.totals.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-white font-bold text-lg pt-1 border-t border-zinc-800">
                <span>Total</span>
                <span>${store.totals.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Método de pago */}
            <div className="flex gap-2">
              {[
                { code: '01', label: 'Efectivo' },
                { code: '04', label: 'Tarjeta' },
                { code: '03', label: 'Transferencia' },
              ].map((m) => (
                <button
                  key={m.code}
                  onClick={() => {
                    store.setPaymentMethod(m.code);
                    if (m.code !== '01') store.setAmountPaid(store.totals.total);
                  }}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                    store.paymentMethod === m.code
                      ? 'bg-pink-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Monto pagado (solo efectivo) */}
            {store.paymentMethod === '01' && (
              <div>
                <input
                  type="number"
                  placeholder="Monto recibido"
                  value={store.amountPaid || ''}
                  onChange={(e) => store.setAmountPaid(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-right text-lg font-mono focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  min={0}
                  step={0.01}
                />
                {store.amountPaid > 0 && store.changeDue() > 0 && (
                  <p className="text-right text-green-400 font-bold mt-1">
                    Cambio: ${store.changeDue().toFixed(2)}
                  </p>
                )}
              </div>
            )}

            {/* Botón de cobro */}
            <button
              onClick={handleCheckout}
              disabled={
                isPending ||
                store.isCheckingOut ||
                store.cart.length === 0 ||
                (store.paymentMethod === '01' && store.amountPaid < store.totals.total)
              }
              className="w-full py-3 bg-pink-600 hover:bg-pink-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-bold rounded-xl transition-colors text-lg"
            >
              {isPending || store.isCheckingOut ? 'Procesando...' : `Cobrar $${store.totals.total.toFixed(2)}`}
            </button>
          </div>
        )}

        {/* Ticket generado */}
        {lastTicket && (
          <div className="border-t border-zinc-800 px-4 py-4 bg-green-900/20">
            <div className="text-center">
              <p className="text-green-400 font-bold text-sm">Venta completada</p>
              <p className="text-white font-mono text-2xl mt-1">{lastTicket.code}</p>
              <p className="text-zinc-400 text-xs mt-1">
                Total: ${lastTicket.total.toFixed(2)}
              </p>
              {/* ── Acciones post-venta ── */}
              <div className="flex gap-2 mt-3 justify-center flex-wrap">
                <a
                  href={`/api/pos/ticket/${lastTicket.orderId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-xs font-bold rounded-lg transition-colors text-center"
                >
                  🖨️ Ticket
                </a>
                <Link
                  href={`/billing/nueva?posOrderId=${lastTicket.orderId}`}
                  className="flex-1 py-2 px-3 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-lg transition-colors text-center"
                >
                  Facturar
                </Link>
                <button
                  onClick={() => setLastTicket(null)}
                  className="flex-1 py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-lg transition-colors"
                >
                  Nueva venta
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Panel de gestión de productos (slide-in) */}
    {showManageProducts && (
      <ProductManagementPanel
        onClose={() => setShowManageProducts(false)}
        onRefreshCatalog={handleRefreshCatalog}
      />
    )}
    </>
  );
}
