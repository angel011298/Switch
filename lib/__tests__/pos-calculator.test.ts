/**
 * CIFRA — Tests: Calculadora POS
 * =====================================
 * Valida el desglose inverso (precio con IVA incluido),
 * el desglose directo (precio sin IVA) y los totales del carrito.
 *
 * Ref: LIVA Art. 1, CFF Art. 29-A, Matriz de Errores SAT Anexo 20.
 */

import { describe, it, expect } from 'vitest';
import {
  reverseBreakdown,
  forwardBreakdown,
  calculateCart,
  generateTicketCode,
  type CartItem,
} from '../pos/calculator';

// ─── reverseBreakdown ────────────────────────────────────────────────────────

describe('reverseBreakdown — desglose inverso (precio incluye IVA)', () => {
  it('$116.00 con IVA 16% → subtotal $100.00, IVA $16.00', () => {
    const { subtotal, tax } = reverseBreakdown(116.00, 0.16);
    expect(subtotal).toBe(100.00);
    expect(tax).toBe(16.00);
  });

  it('$100.00 con IVA 16% → subtotal $86.21, IVA $13.79', () => {
    const { subtotal, tax } = reverseBreakdown(100.00, 0.16);
    expect(subtotal).toBe(86.21);
    expect(tax).toBe(13.79);
  });

  it('IVA 8% zona fronteriza: $108.00 → subtotal $100.00, IVA $8.00', () => {
    const { subtotal, tax } = reverseBreakdown(108.00, 0.08);
    expect(subtotal).toBe(100.00);
    expect(tax).toBe(8.00);
  });

  it('tasa cero: el subtotal es el precio completo, IVA = 0', () => {
    const { subtotal, tax } = reverseBreakdown(50.00, 0);
    expect(subtotal).toBe(50.00);
    expect(tax).toBe(0.00);
  });

  it('subtotal + tax == priceWithTax (verificación de cuadre)', () => {
    const price = 249.99;
    const { subtotal, tax } = reverseBreakdown(price, 0.16);
    // Permitir ±1 centavo por redondeo
    expect(Math.abs(subtotal + tax - price)).toBeLessThanOrEqual(0.01);
  });
});

// ─── forwardBreakdown ────────────────────────────────────────────────────────

describe('forwardBreakdown — desglose directo (precio sin IVA)', () => {
  it('$100.00 sin IVA 16% → subtotal $100.00, IVA $16.00', () => {
    const { subtotal, tax } = forwardBreakdown(100.00, 0.16);
    expect(subtotal).toBe(100.00);
    expect(tax).toBe(16.00);
  });

  it('$8,620.69 sin IVA → IVA $1,379.31', () => {
    // Caso real CFDI: base = 10000/1.16
    const { subtotal, tax } = forwardBreakdown(8620.69, 0.16);
    expect(subtotal).toBe(8620.69);
    expect(tax).toBe(1379.31);
  });

  it('tasa cero: IVA = 0', () => {
    const { subtotal, tax } = forwardBreakdown(1500.00, 0);
    expect(subtotal).toBe(1500.00);
    expect(tax).toBe(0.00);
  });
});

// ─── calculateCart ───────────────────────────────────────────────────────────

const makeItem = (overrides: Partial<CartItem> & { displayPrice: number }): CartItem => ({
  productId: 'prod-1',
  name: 'Producto',
  quantity: 1,
  priceIncludesTax: false,
  taxRate: 0.16,
  claveProdServ: '01010101',
  claveUnidad: 'E48',
  ...overrides,
});

describe('calculateCart — carrito vacío', () => {
  it('devuelve ceros con carrito vacío', () => {
    const totals = calculateCart([]);
    expect(totals.subtotal).toBe(0);
    expect(totals.totalTax).toBe(0);
    expect(totals.total).toBe(0);
    expect(totals.itemCount).toBe(0);
    expect(totals.unitCount).toBe(0);
  });
});

describe('calculateCart — un artículo, precio SIN IVA', () => {
  it('1 × $100 (sin IVA 16%) → subtotal $100, IVA $16, total $116', () => {
    const totals = calculateCart([makeItem({ displayPrice: 100.00 })]);
    expect(totals.subtotal).toBe(100.00);
    expect(totals.totalTax).toBe(16.00);
    expect(totals.total).toBe(116.00);
  });

  it('3 × $33.33 (sin IVA) → subtotal $99.99, IVA $16.00, total $115.99', () => {
    const totals = calculateCart([makeItem({ quantity: 3, displayPrice: 33.33 })]);
    expect(totals.subtotal).toBe(99.99);
    expect(totals.totalTax).toBe(16.00);
    expect(totals.total).toBe(115.99);
  });
});

describe('calculateCart — un artículo, precio CON IVA incluido', () => {
  it('1 × $116.00 (incluye IVA 16%) → subtotal $100, IVA $16, total $116', () => {
    const totals = calculateCart([
      makeItem({ displayPrice: 116.00, priceIncludesTax: true }),
    ]);
    expect(totals.subtotal).toBe(100.00);
    expect(totals.totalTax).toBe(16.00);
    expect(totals.total).toBe(116.00);
  });

  it('2 × $116.00 con IVA → subtotal $200, IVA $32, total $232', () => {
    const totals = calculateCart([
      makeItem({ quantity: 2, displayPrice: 116.00, priceIncludesTax: true }),
    ]);
    expect(totals.subtotal).toBe(200.00);
    expect(totals.totalTax).toBe(32.00);
    expect(totals.total).toBe(232.00);
  });
});

describe('calculateCart — múltiples artículos', () => {
  it('carrito mixto con 2 productos', () => {
    const items: CartItem[] = [
      makeItem({ productId: 'p1', quantity: 2, displayPrice: 100.00, priceIncludesTax: false }),
      makeItem({ productId: 'p2', quantity: 1, displayPrice: 232.00, priceIncludesTax: true }),
    ];
    const totals = calculateCart(items);
    // p1: subtotal 200, IVA 32
    // p2: subtotal 200, IVA 32 (232/1.16 = 200)
    expect(totals.subtotal).toBe(400.00);
    expect(totals.totalTax).toBe(64.00);
    expect(totals.total).toBe(464.00);
    expect(totals.itemCount).toBe(2);
    expect(totals.unitCount).toBe(3);
  });
});

describe('calculateCart — descuento global', () => {
  it('aplica descuento al total', () => {
    const totals = calculateCart(
      [makeItem({ displayPrice: 100.00 })],
      10.00
    );
    // subtotal 100 + IVA 16 - descuento 10 = 106
    expect(totals.discount).toBe(10.00);
    expect(totals.total).toBe(106.00);
  });

  it('descuento 0 no afecta el total', () => {
    const totals = calculateCart([makeItem({ displayPrice: 100.00 })], 0);
    expect(totals.total).toBe(116.00);
  });
});

describe('calculateCart — tasa cero', () => {
  it('producto exento de IVA (tasa 0) no genera impuesto', () => {
    const totals = calculateCart([
      makeItem({ displayPrice: 500.00, taxRate: 0 }),
    ]);
    expect(totals.totalTax).toBe(0.00);
    expect(totals.total).toBe(500.00);
  });
});

// ─── generateTicketCode ──────────────────────────────────────────────────────

describe('generateTicketCode', () => {
  it('tiene el formato SW-XXXXXX', () => {
    const code = generateTicketCode();
    expect(code).toMatch(/^SW-[A-Z2-9]{6}$/);
  });

  it('genera códigos distintos en llamadas consecutivas', () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateTicketCode()));
    // Con 20 llamadas a ~2B combinaciones, la probabilidad de colisión es ~0
    expect(codes.size).toBeGreaterThan(18);
  });

  it('no contiene caracteres ambiguos (I, O, 0, 1)', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateTicketCode().replace('SW-', '');
      expect(code).not.toMatch(/[IO01]/);
    }
  });
});
