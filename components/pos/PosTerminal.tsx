'use client';

/**
 * Switch OS — Terminal del Punto de Venta
 * =========================================
 * Interfaz principal del POS. Catálogo a la izquierda, carrito a la derecha.
 * Toda la calculadora corre client-side via Zustand.
 * Solo llama al servidor en: carga inicial y checkout.
 */

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { usePosStore } from '@/stores/pos-store';
import { loadProducts, checkout } from '@/app/(dashboard)/pos/actions';
import type { CheckoutInput } from '@/app/(dashboard)/pos/actions';

export default function PosTerminal() {
  const store = usePosStore();
  const [isPending, startTransition] = useTransition();
  const [lastTicket, setLastTicket] = useState<{ code: string; total: number; orderId: string } | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);

  // Cargar catálogo una vez
  useEffect(() => {
    if (!store.productsLoaded) {
      startTransition(async () => {
        const products = await loadProducts();
        store.setProducts(products as any);
      });
    }
  }, []);

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
    <div className="flex h-[calc(100vh-80px)] gap-4">
      {/* ═══ CATÁLOGO (Izquierda) ═══ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Barra de búsqueda */}
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
        </div>

        {/* Grid de productos */}
        <div className="flex-1 overflow-y-auto">
          {!store.productsLoaded ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-zinc-500">No hay productos en el catalogo</p>
              <p className="text-zinc-600 text-sm mt-1">Agrega productos desde el panel de administracion</p>
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
              {/* ── Interconexión POS → CFDI ── */}
              <div className="flex gap-2 mt-3 justify-center">
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
  );
}
