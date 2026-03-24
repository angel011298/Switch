/**
 * Switch OS — Calculadora POS con Desglose Inverso
 * ==================================================
 * Toda la aritmética del POS corre 100% en el cliente.
 * Sin llamadas al servidor en cada click.
 *
 * DESGLOSE INVERSO:
 * Si el precio incluye IVA ($116.00), calcula:
 *   Subtotal = 116.00 / 1.16 = $100.00
 *   IVA      = 116.00 - 100.00 = $16.00
 *
 * Precisión: Redondeo a 2 decimales en cada paso
 * para evitar discrepancias de centavos (Matriz de Errores SAT).
 *
 * Ref: LIVA Art. 1 (tasa general), CFF Art. 29-A (requisitos CFDI)
 */

export interface CartItem {
  productId: string;
  name: string;
  quantity: number;
  /** Precio tal como lo ve el cajero (puede incluir o no IVA) */
  displayPrice: number;
  priceIncludesTax: boolean;
  taxRate: number;         // 0.16 = 16%
  claveProdServ: string;
  claveUnidad: string;
  unidad?: string;
  imageUrl?: string;
}

export interface CartItemBreakdown {
  productId: string;
  name: string;
  quantity: number;
  unitPriceWithoutTax: number;   // Precio unitario SIN IVA
  unitPriceWithTax: number;      // Precio unitario CON IVA
  taxRate: number;
  subtotal: number;              // quantity × unitPriceWithoutTax
  taxAmount: number;             // quantity × impuesto unitario
  total: number;                 // subtotal + taxAmount
  discount: number;
}

export interface CartTotals {
  items: CartItemBreakdown[];
  subtotal: number;              // Suma de subtotales (sin IVA)
  totalTax: number;              // Suma de impuestos
  discount: number;
  total: number;                 // subtotal + totalTax - discount
  itemCount: number;             // Número de líneas
  unitCount: number;             // Suma de cantidades
}

// ─── REDONDEO ──────────────────────────────────────────

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// ─── DESGLOSE INVERSO ──────────────────────────────────

/**
 * Desglose inverso: dado un precio con IVA incluido,
 * calcula el subtotal y el impuesto.
 *
 * Fórmula:
 *   subtotal = precioConIva / (1 + tasa)
 *   impuesto = precioConIva - subtotal
 *
 * Ejemplo con IVA 16%:
 *   $100.00 con IVA → subtotal = $86.21, IVA = $13.79
 *   Verificación: 86.21 × 1.16 = 100.00 ✓
 */
export function reverseBreakdown(
  priceWithTax: number,
  taxRate: number
): { subtotal: number; tax: number } {
  const subtotal = round2(priceWithTax / (1 + taxRate));
  const tax = round2(priceWithTax - subtotal);
  return { subtotal, tax };
}

/**
 * Desglose directo: precio sin IVA → calcula el impuesto.
 */
export function forwardBreakdown(
  priceWithoutTax: number,
  taxRate: number
): { subtotal: number; tax: number } {
  const subtotal = round2(priceWithoutTax);
  const tax = round2(subtotal * taxRate);
  return { subtotal, tax };
}

// ─── CÁLCULO DEL CARRITO ───────────────────────────────

/**
 * Calcula todos los totales del carrito.
 * Corre 100% en el cliente, sin llamadas al servidor.
 */
export function calculateCart(
  items: CartItem[],
  globalDiscount: number = 0
): CartTotals {
  const breakdowns: CartItemBreakdown[] = items.map((item) => {
    // Paso 1: Obtener precio unitario sin IVA
    let unitPriceWithoutTax: number;
    let unitPriceWithTax: number;

    if (item.priceIncludesTax) {
      // DESGLOSE INVERSO
      const { subtotal } = reverseBreakdown(item.displayPrice, item.taxRate);
      unitPriceWithoutTax = subtotal;
      unitPriceWithTax = round2(item.displayPrice);
    } else {
      // DESGLOSE DIRECTO
      unitPriceWithoutTax = round2(item.displayPrice);
      unitPriceWithTax = round2(item.displayPrice * (1 + item.taxRate));
    }

    // Paso 2: Calcular línea
    const subtotal = round2(item.quantity * unitPriceWithoutTax);
    const taxAmount = round2(subtotal * item.taxRate);
    const total = round2(subtotal + taxAmount);

    return {
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      unitPriceWithoutTax,
      unitPriceWithTax,
      taxRate: item.taxRate,
      subtotal,
      taxAmount,
      total,
      discount: 0,
    };
  });

  const subtotal = round2(breakdowns.reduce((s, b) => s + b.subtotal, 0));
  const totalTax = round2(breakdowns.reduce((s, b) => s + b.taxAmount, 0));
  const discount = round2(globalDiscount);
  const total = round2(subtotal + totalTax - discount);
  const unitCount = items.reduce((s, i) => s + i.quantity, 0);

  return {
    items: breakdowns,
    subtotal,
    totalTax,
    discount,
    total,
    itemCount: breakdowns.length,
    unitCount,
  };
}

// ─── GENERADOR DE CÓDIGO DE TICKET ─────────────────────

/**
 * Genera un código alfanumérico único para el ticket POS.
 * Formato: "SW-XXXXXX" (6 caracteres alfanuméricos)
 * ~2 mil millones de combinaciones posibles.
 */
export function generateTicketCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sin I,O,0,1 para evitar confusión
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SW-${code}`;
}
