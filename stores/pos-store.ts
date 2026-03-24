/**
 * Switch OS — Zustand Store del POS
 * ====================================
 * Estado global del Punto de Venta.
 * El catálogo se cachea en el cliente para operación offline-first.
 * La calculadora corre 100% client-side sin llamadas al servidor.
 */

import { create } from 'zustand';
import {
  calculateCart,
  type CartItem,
  type CartTotals,
} from '@/lib/pos/calculator';

// ─── TIPOS ─────────────────────────────────────────────

export interface PosProduct {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  category: string | null;
  price: number;
  priceIncludesTax: boolean;
  taxRate: number;
  stock: number;
  trackStock: boolean;
  claveProdServ: string;
  claveUnidad: string;
  unidad: string | null;
  imageUrl: string | null;
  isActive: boolean;
}

interface PosState {
  // Catálogo (cacheado del servidor)
  products: PosProduct[];
  productsLoaded: boolean;
  searchQuery: string;

  // Carrito
  cart: CartItem[];
  totals: CartTotals;
  discount: number;

  // Pago
  paymentMethod: string;
  amountPaid: number;

  // UI
  isCheckingOut: boolean;

  // Acciones del catálogo
  setProducts: (products: PosProduct[]) => void;
  setSearchQuery: (query: string) => void;

  // Acciones del carrito
  addToCart: (product: PosProduct, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setDiscount: (amount: number) => void;

  // Acciones de pago
  setPaymentMethod: (method: string) => void;
  setAmountPaid: (amount: number) => void;
  setIsCheckingOut: (value: boolean) => void;

  // Computed
  filteredProducts: () => PosProduct[];
  changeDue: () => number;
}

// ─── TOTALES VACÍOS ────────────────────────────────────

const EMPTY_TOTALS: CartTotals = {
  items: [],
  subtotal: 0,
  totalTax: 0,
  discount: 0,
  total: 0,
  itemCount: 0,
  unitCount: 0,
};

// ─── STORE ─────────────────────────────────────────────

export const usePosStore = create<PosState>((set, get) => ({
  // Estado inicial
  products: [],
  productsLoaded: false,
  searchQuery: '',
  cart: [],
  totals: EMPTY_TOTALS,
  discount: 0,
  paymentMethod: '01', // Efectivo
  amountPaid: 0,
  isCheckingOut: false,

  // ─── Catálogo ────────────────────────────────────
  setProducts: (products) => set({ products, productsLoaded: true }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  filteredProducts: () => {
    const { products, searchQuery } = get();
    if (!searchQuery.trim()) return products.filter((p) => p.isActive);

    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.isActive &&
        (p.name.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.barcode?.includes(q) ||
          p.category?.toLowerCase().includes(q))
    );
  },

  // ─── Carrito ─────────────────────────────────────
  addToCart: (product, quantity = 1) => {
    const { cart, discount } = get();
    const existing = cart.find((i) => i.productId === product.id);

    let newCart: CartItem[];
    if (existing) {
      newCart = cart.map((i) =>
        i.productId === product.id
          ? { ...i, quantity: i.quantity + quantity }
          : i
      );
    } else {
      newCart = [
        ...cart,
        {
          productId: product.id,
          name: product.name,
          quantity,
          displayPrice: product.price,
          priceIncludesTax: product.priceIncludesTax,
          taxRate: product.taxRate,
          claveProdServ: product.claveProdServ,
          claveUnidad: product.claveUnidad,
          unidad: product.unidad ?? undefined,
          imageUrl: product.imageUrl ?? undefined,
        },
      ];
    }

    const totals = calculateCart(newCart, discount);
    set({ cart: newCart, totals, amountPaid: 0 });
  },

  removeFromCart: (productId) => {
    const { cart, discount } = get();
    const newCart = cart.filter((i) => i.productId !== productId);
    const totals = calculateCart(newCart, discount);
    set({ cart: newCart, totals, amountPaid: 0 });
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(productId);
      return;
    }
    const { cart, discount } = get();
    const newCart = cart.map((i) =>
      i.productId === productId ? { ...i, quantity } : i
    );
    const totals = calculateCart(newCart, discount);
    set({ cart: newCart, totals, amountPaid: 0 });
  },

  clearCart: () =>
    set({
      cart: [],
      totals: EMPTY_TOTALS,
      discount: 0,
      amountPaid: 0,
      paymentMethod: '01',
      isCheckingOut: false,
    }),

  setDiscount: (amount) => {
    const { cart } = get();
    const totals = calculateCart(cart, amount);
    set({ discount: amount, totals });
  },

  // ─── Pago ────────────────────────────────────────
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setAmountPaid: (amount) => set({ amountPaid: amount }),
  setIsCheckingOut: (value) => set({ isCheckingOut: value }),

  changeDue: () => {
    const { amountPaid, totals } = get();
    const change = amountPaid - totals.total;
    return change > 0 ? Math.round(change * 100) / 100 : 0;
  },
}));
