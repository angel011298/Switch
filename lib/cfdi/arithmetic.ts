/**
 * CIFRA — Aritmética de Alta Precisión para CFDI
 * ===================================================
 * Funciones de redondeo conformes a la Matriz de Errores del SAT.
 *
 * Reglas clave:
 * - Importes: 2 decimales (redondeo bancario)
 * - Tasas: 6 decimales (truncamiento)
 * - Cantidades: hasta 6 decimales
 * - Tipo de cambio: hasta 4 decimales
 *
 * Ref: Anexo 20 CFDI 4.0, Matriz de errores.
 */

/**
 * Redondea un valor a N decimales (default 2).
 * Usa el método de redondeo estándar (half-up) que exige el SAT.
 */
export function roundSat(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Trunca un valor a N decimales (sin redondear).
 * Usado para tasas fiscales que deben presentarse a 6 decimales exactos.
 */
export function truncateSat(value: number, decimals: number = 6): number {
  const factor = Math.pow(10, decimals);
  return Math.trunc(value * factor) / factor;
}

/**
 * Calcula el importe de un concepto: cantidad × valorUnitario.
 * Resultado redondeado a 2 decimales según Matriz de Errores.
 */
export function computeImporte(cantidad: number, valorUnitario: number): number {
  return roundSat(cantidad * valorUnitario);
}

/**
 * Calcula el impuesto trasladado sobre una base.
 * base × tasa, redondeado a 2 decimales.
 */
export function computeTax(base: number, tasa: number): number {
  return roundSat(base * tasa);
}

/**
 * Formatea un número a string con exactamente N decimales.
 * El SAT requiere que los valores en XML tengan decimales explícitos.
 */
export function formatDecimals(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

/**
 * Formatea una tasa a 6 decimales (requerido por Anexo 20).
 */
export function formatRate(value: number): string {
  return value.toFixed(6);
}
