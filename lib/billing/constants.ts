/**
 * Switch OS — Constantes de Facturación y Pagos
 * ===============================================
 * Datos bancarios para recepción de pagos vía SPEI.
 * Actualizar cuando cambien los datos del banco destino.
 */

export const SWITCH_BANK_ACCOUNTS = [
  {
    bank: 'BBVA Bancomer',
    accountHolder: 'Angel Ortiz (Switch OS)',
    clabe: '012180015567890123', // ← Reemplazar con CLABE real
    accountNumber: '0155678901',
    concept: 'SWITCH-[RFC_TENANT]', // RFC del tenant va al final
  },
  // Se puede agregar una segunda cuenta para diversificacion
] as const;

export const SWITCH_PLANS = {
  standard: {
    name: 'Switch OS Standard',
    monthlyPrice: 499,   // MXN / mes
    annualPrice:  4990,  // MXN / año (2 meses gratis)
    currency: 'MXN',
    features: [
      'Todos los módulos incluidos',
      'Facturación CFDI 4.0 ilimitada',
      'POS + Auto-facturación',
      'CRM + Onboarding fiscal QR',
      'Contabilidad Partida Doble',
      'Soporte por correo electrónico',
    ],
  },
} as const;

export type PlanKey = keyof typeof SWITCH_PLANS;

/** Dias que se suman al validUntil al aprobar un pago mensual */
export const DAYS_PER_MONTHLY_PAYMENT = 30;
/** Dias que se suman al validUntil al aprobar un pago anual */
export const DAYS_PER_ANNUAL_PAYMENT = 365;
