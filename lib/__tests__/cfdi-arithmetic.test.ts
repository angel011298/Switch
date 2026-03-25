/**
 * Switch OS — Tests: Aritmética CFDI
 * =====================================
 * Valida las funciones de redondeo y cálculo fiscal conforme
 * a la Matriz de Errores del Anexo 20 del SAT.
 */

import { describe, it, expect } from 'vitest';
import {
  roundSat,
  truncateSat,
  computeImporte,
  computeTax,
  formatDecimals,
  formatRate,
} from '../cfdi/arithmetic';

// ─── roundSat ────────────────────────────────────────────────────────────────

describe('roundSat', () => {
  it('redondea a 2 decimales por defecto', () => {
    expect(roundSat(1.005)).toBe(1.01);
    expect(roundSat(1.004)).toBe(1.00);
    expect(roundSat(100.0)).toBe(100.00);
  });

  it('redondea hacia arriba en punto medio (half-up)', () => {
    expect(roundSat(0.125, 2)).toBe(0.13);
    expect(roundSat(0.005, 2)).toBe(0.01);
  });

  it('funciona con N decimales', () => {
    expect(roundSat(1.123456789, 6)).toBe(1.123457);
    expect(roundSat(0.16, 6)).toBe(0.16);
  });

  it('maneja ceros', () => {
    expect(roundSat(0)).toBe(0);
    expect(roundSat(0.00000001)).toBe(0);
  });

  it('maneja valores negativos', () => {
    expect(roundSat(-1.005)).toBe(-1.00);
    expect(roundSat(-99.999)).toBe(-100.00);
  });
});

// ─── truncateSat ─────────────────────────────────────────────────────────────

describe('truncateSat', () => {
  it('trunca a 6 decimales por defecto (sin redondear)', () => {
    expect(truncateSat(0.1666666666)).toBe(0.166666);
    expect(truncateSat(0.1599999)).toBe(0.159999);
  });

  it('no redondea hacia arriba', () => {
    // IVA 16% = 0.160000... (exacto)
    expect(truncateSat(0.16)).toBe(0.16);
    // Tasa ISR que no es exacta
    expect(truncateSat(0.053333333)).toBe(0.053333);
  });

  it('funciona con N decimales', () => {
    expect(truncateSat(3.14159265, 4)).toBe(3.1415);
  });
});

// ─── computeImporte ──────────────────────────────────────────────────────────

describe('computeImporte', () => {
  it('calcula cantidad × valorUnitario redondeado a 2 decimales', () => {
    expect(computeImporte(3, 100.00)).toBe(300.00);
    expect(computeImporte(1, 1500.50)).toBe(1500.50);
  });

  it('redondea correctamente', () => {
    expect(computeImporte(3, 33.333)).toBe(100.00); // 99.999 → 100.00
    expect(computeImporte(7, 14.285714)).toBe(100.00);
  });

  it('caso típico: 1 servicio a $8,620.69 (sin IVA de $10,000 con IVA)', () => {
    // $10,000 incluye IVA → base = 10000 / 1.16 = 8620.689655...
    const base = 10_000 / 1.16;
    expect(computeImporte(1, base)).toBe(8620.69);
  });
});

// ─── computeTax ──────────────────────────────────────────────────────────────

describe('computeTax', () => {
  it('calcula IVA 16% correctamente', () => {
    expect(computeTax(100.00, 0.16)).toBe(16.00);
    expect(computeTax(8620.69, 0.16)).toBe(1379.31);
    // 8620.69 × 0.16 = 1379.3104 → 1379.31 ✓
  });

  it('calcula IVA 8% (zona fronteriza)', () => {
    expect(computeTax(1000.00, 0.08)).toBe(80.00);
  });

  it('calcula tasa cero', () => {
    expect(computeTax(5000.00, 0)).toBe(0.00);
  });

  it('redondea tasas que generan fracciones', () => {
    expect(computeTax(33.33, 0.16)).toBe(5.33); // 5.3328 → 5.33
    expect(computeTax(100.005, 0.16)).toBe(16.00); // 16.0008 → 16.00
  });
});

// ─── formatDecimals ──────────────────────────────────────────────────────────

describe('formatDecimals', () => {
  it('formatea con exactamente 2 decimales', () => {
    expect(formatDecimals(100)).toBe('100.00');
    expect(formatDecimals(1379.31)).toBe('1379.31');
    expect(formatDecimals(0)).toBe('0.00');
  });

  it('formatea con N decimales personalizados', () => {
    expect(formatDecimals(0.16, 6)).toBe('0.160000');
    expect(formatDecimals(8620.69, 2)).toBe('8620.69');
  });
});

// ─── formatRate ──────────────────────────────────────────────────────────────

describe('formatRate', () => {
  it('formatea tasa a 6 decimales', () => {
    expect(formatRate(0.16)).toBe('0.160000');
    expect(formatRate(0.08)).toBe('0.080000');
    expect(formatRate(0)).toBe('0.000000');
  });
});

// ─── Integración: Factura completa ───────────────────────────────────────────

describe('Integración: Cálculo de factura completa', () => {
  it('factura con 2 conceptos cuadra correctamente', () => {
    // Concepto 1: 5 unidades × $200 = $1,000 → IVA $160
    const cant1 = 5, precio1 = 200;
    const importe1 = computeImporte(cant1, precio1);
    const iva1 = computeTax(importe1, 0.16);

    // Concepto 2: 2 unidades × $750.50 = $1,501 → IVA $240.16
    const cant2 = 2, precio2 = 750.50;
    const importe2 = computeImporte(cant2, precio2);
    const iva2 = computeTax(importe2, 0.16);

    const subtotal = roundSat(importe1 + importe2);
    const totalIva = roundSat(iva1 + iva2);
    const total    = roundSat(subtotal + totalIva);

    expect(importe1).toBe(1000.00);
    expect(iva1).toBe(160.00);
    expect(importe2).toBe(1501.00);
    expect(iva2).toBe(240.16);
    expect(subtotal).toBe(2501.00);
    expect(totalIva).toBe(400.16);
    expect(total).toBe(2901.16);
  });
});
