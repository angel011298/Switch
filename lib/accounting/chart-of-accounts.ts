/**
 * CIFRA — Catálogo de Cuentas SAT (Anexo 24)
 * ================================================
 * Catálogo base de cuentas contables conforme al Anexo 24 del SAT.
 * Se usa para hacer seed del catálogo al crear un tenant.
 *
 * Niveles:
 *   1 = Grupo (100, 200, 300...)
 *   2 = Cuenta mayor (101, 102...)
 *   3 = Subcuenta (101.01, 101.02...)
 *
 * Ref: CFF Art. 28 Fracción III, Anexo 24 RMF.
 */

import type { AccountType } from '@prisma/client';

export interface SeedAccount {
  code: string;
  name: string;
  accountType: AccountType;
  parentCode: string | null;
  level: number;
}

export const SAT_CHART_OF_ACCOUNTS: SeedAccount[] = [
  // ═══════════════════════════════════════════
  // 1XX — ACTIVO
  // ═══════════════════════════════════════════
  { code: '100', name: 'Activo', accountType: 'ASSET', parentCode: null, level: 1 },

  // Activo Circulante
  { code: '101', name: 'Efectivo y equivalentes de efectivo', accountType: 'ASSET', parentCode: '100', level: 2 },
  { code: '101.01', name: 'Caja', accountType: 'ASSET', parentCode: '101', level: 3 },
  { code: '101.02', name: 'Bancos nacionales', accountType: 'ASSET', parentCode: '101', level: 3 },
  { code: '101.03', name: 'Bancos extranjeros', accountType: 'ASSET', parentCode: '101', level: 3 },

  { code: '102', name: 'Inversiones temporales', accountType: 'ASSET', parentCode: '100', level: 2 },

  { code: '105', name: 'Clientes', accountType: 'ASSET', parentCode: '100', level: 2 },
  { code: '105.01', name: 'Clientes nacionales', accountType: 'ASSET', parentCode: '105', level: 3 },
  { code: '105.02', name: 'Clientes extranjeros', accountType: 'ASSET', parentCode: '105', level: 3 },

  { code: '106', name: 'Deudores diversos', accountType: 'ASSET', parentCode: '100', level: 2 },
  { code: '106.01', name: 'Funcionarios y empleados', accountType: 'ASSET', parentCode: '106', level: 3 },

  { code: '107', name: 'Estimación de cuentas incobrables', accountType: 'CONTRA_ASSET', parentCode: '100', level: 2 },

  { code: '108', name: 'Almacén / Inventarios', accountType: 'ASSET', parentCode: '100', level: 2 },
  { code: '108.01', name: 'Inventario de mercancías', accountType: 'ASSET', parentCode: '108', level: 3 },
  { code: '108.02', name: 'Inventario de materias primas', accountType: 'ASSET', parentCode: '108', level: 3 },

  { code: '110', name: 'IVA acreditable', accountType: 'ASSET', parentCode: '100', level: 2 },
  { code: '110.01', name: 'IVA acreditable pagado', accountType: 'ASSET', parentCode: '110', level: 3 },
  { code: '110.02', name: 'IVA pendiente de acreditar', accountType: 'ASSET', parentCode: '110', level: 3 },

  { code: '113', name: 'Anticipo a proveedores', accountType: 'ASSET', parentCode: '100', level: 2 },

  // Activo No Circulante
  { code: '120', name: 'Terrenos', accountType: 'ASSET', parentCode: '100', level: 2 },
  { code: '121', name: 'Edificios', accountType: 'ASSET', parentCode: '100', level: 2 },
  { code: '122', name: 'Maquinaria y equipo', accountType: 'ASSET', parentCode: '100', level: 2 },
  { code: '123', name: 'Equipo de transporte', accountType: 'ASSET', parentCode: '100', level: 2 },
  { code: '124', name: 'Mobiliario y equipo de oficina', accountType: 'ASSET', parentCode: '100', level: 2 },
  { code: '125', name: 'Equipo de cómputo', accountType: 'ASSET', parentCode: '100', level: 2 },

  { code: '126', name: 'Depreciación acumulada', accountType: 'CONTRA_ASSET', parentCode: '100', level: 2 },
  { code: '126.01', name: 'Depreciación acum. de edificios', accountType: 'CONTRA_ASSET', parentCode: '126', level: 3 },
  { code: '126.02', name: 'Depreciación acum. de maquinaria', accountType: 'CONTRA_ASSET', parentCode: '126', level: 3 },
  { code: '126.03', name: 'Depreciación acum. de equipo de transporte', accountType: 'CONTRA_ASSET', parentCode: '126', level: 3 },
  { code: '126.04', name: 'Depreciación acum. de equipo de oficina', accountType: 'CONTRA_ASSET', parentCode: '126', level: 3 },
  { code: '126.05', name: 'Depreciación acum. de equipo de cómputo', accountType: 'CONTRA_ASSET', parentCode: '126', level: 3 },

  // ═══════════════════════════════════════════
  // 2XX — PASIVO
  // ═══════════════════════════════════════════
  { code: '200', name: 'Pasivo', accountType: 'LIABILITY', parentCode: null, level: 1 },

  { code: '201', name: 'Proveedores', accountType: 'LIABILITY', parentCode: '200', level: 2 },
  { code: '201.01', name: 'Proveedores nacionales', accountType: 'LIABILITY', parentCode: '201', level: 3 },
  { code: '201.02', name: 'Proveedores extranjeros', accountType: 'LIABILITY', parentCode: '201', level: 3 },

  { code: '205', name: 'Acreedores diversos', accountType: 'LIABILITY', parentCode: '200', level: 2 },
  { code: '206', name: 'Anticipo de clientes', accountType: 'LIABILITY', parentCode: '200', level: 2 },

  { code: '208', name: 'IVA trasladado', accountType: 'LIABILITY', parentCode: '200', level: 2 },
  { code: '208.01', name: 'IVA trasladado cobrado', accountType: 'LIABILITY', parentCode: '208', level: 3 },
  { code: '208.02', name: 'IVA trasladado no cobrado', accountType: 'LIABILITY', parentCode: '208', level: 3 },

  { code: '210', name: 'ISR por pagar', accountType: 'LIABILITY', parentCode: '200', level: 2 },
  { code: '211', name: 'IVA por pagar', accountType: 'LIABILITY', parentCode: '200', level: 2 },
  { code: '212', name: 'Impuestos y derechos por pagar', accountType: 'LIABILITY', parentCode: '200', level: 2 },

  { code: '213', name: 'ISR retenido por sueldos', accountType: 'LIABILITY', parentCode: '200', level: 2 },
  { code: '214', name: 'IVA retenido', accountType: 'LIABILITY', parentCode: '200', level: 2 },
  { code: '215', name: 'ISR retenido por servicios profesionales', accountType: 'LIABILITY', parentCode: '200', level: 2 },

  { code: '216', name: 'Cuotas IMSS por pagar', accountType: 'LIABILITY', parentCode: '200', level: 2 },
  { code: '217', name: 'Cuotas Infonavit por pagar', accountType: 'LIABILITY', parentCode: '200', level: 2 },

  // Pasivo a largo plazo
  { code: '250', name: 'Préstamos bancarios a largo plazo', accountType: 'LIABILITY', parentCode: '200', level: 2 },

  // ═══════════════════════════════════════════
  // 3XX — CAPITAL
  // ═══════════════════════════════════════════
  { code: '300', name: 'Capital contable', accountType: 'EQUITY', parentCode: null, level: 1 },

  { code: '301', name: 'Capital social', accountType: 'EQUITY', parentCode: '300', level: 2 },
  { code: '302', name: 'Reserva legal', accountType: 'EQUITY', parentCode: '300', level: 2 },
  { code: '303', name: 'Resultado de ejercicios anteriores', accountType: 'EQUITY', parentCode: '300', level: 2 },
  { code: '304', name: 'Resultado del ejercicio', accountType: 'EQUITY', parentCode: '300', level: 2 },

  // ═══════════════════════════════════════════
  // 4XX — INGRESOS
  // ═══════════════════════════════════════════
  { code: '400', name: 'Ingresos', accountType: 'REVENUE', parentCode: null, level: 1 },

  { code: '401', name: 'Ventas y/o servicios', accountType: 'REVENUE', parentCode: '400', level: 2 },
  { code: '401.01', name: 'Ventas de mercancías', accountType: 'REVENUE', parentCode: '401', level: 3 },
  { code: '401.02', name: 'Ingresos por servicios', accountType: 'REVENUE', parentCode: '401', level: 3 },

  { code: '402', name: 'Devoluciones, descuentos y bonificaciones sobre ventas', accountType: 'CONTRA_REVENUE', parentCode: '400', level: 2 },

  { code: '403', name: 'Otros ingresos', accountType: 'REVENUE', parentCode: '400', level: 2 },
  { code: '403.01', name: 'Intereses ganados', accountType: 'REVENUE', parentCode: '403', level: 3 },
  { code: '403.02', name: 'Utilidad cambiaria', accountType: 'REVENUE', parentCode: '403', level: 3 },

  // ═══════════════════════════════════════════
  // 5XX — COSTOS
  // ═══════════════════════════════════════════
  { code: '500', name: 'Costos', accountType: 'EXPENSE', parentCode: null, level: 1 },

  { code: '501', name: 'Costo de ventas', accountType: 'EXPENSE', parentCode: '500', level: 2 },
  { code: '501.01', name: 'Costo de mercancía vendida', accountType: 'EXPENSE', parentCode: '501', level: 3 },

  // ═══════════════════════════════════════════
  // 6XX — GASTOS
  // ═══════════════════════════════════════════
  { code: '600', name: 'Gastos', accountType: 'EXPENSE', parentCode: null, level: 1 },

  { code: '601', name: 'Gastos de operación', accountType: 'EXPENSE', parentCode: '600', level: 2 },
  { code: '601.01', name: 'Sueldos y salarios', accountType: 'EXPENSE', parentCode: '601', level: 3 },
  { code: '601.02', name: 'Gratificaciones (aguinaldo)', accountType: 'EXPENSE', parentCode: '601', level: 3 },
  { code: '601.03', name: 'Vacaciones', accountType: 'EXPENSE', parentCode: '601', level: 3 },
  { code: '601.04', name: 'Prima vacacional', accountType: 'EXPENSE', parentCode: '601', level: 3 },
  { code: '601.05', name: 'PTU', accountType: 'EXPENSE', parentCode: '601', level: 3 },
  { code: '601.06', name: 'IMSS patronal', accountType: 'EXPENSE', parentCode: '601', level: 3 },
  { code: '601.07', name: 'Infonavit patronal', accountType: 'EXPENSE', parentCode: '601', level: 3 },

  { code: '602', name: 'Gastos de administración', accountType: 'EXPENSE', parentCode: '600', level: 2 },
  { code: '602.01', name: 'Servicios profesionales (honorarios)', accountType: 'EXPENSE', parentCode: '602', level: 3 },
  { code: '602.02', name: 'Arrendamiento de inmuebles', accountType: 'EXPENSE', parentCode: '602', level: 3 },
  { code: '602.03', name: 'Teléfono e internet', accountType: 'EXPENSE', parentCode: '602', level: 3 },
  { code: '602.04', name: 'Energía eléctrica', accountType: 'EXPENSE', parentCode: '602', level: 3 },
  { code: '602.05', name: 'Papelería y artículos de oficina', accountType: 'EXPENSE', parentCode: '602', level: 3 },
  { code: '602.06', name: 'Mantenimiento y conservación', accountType: 'EXPENSE', parentCode: '602', level: 3 },
  { code: '602.07', name: 'Seguros y fianzas', accountType: 'EXPENSE', parentCode: '602', level: 3 },
  { code: '602.08', name: 'Gastos de viaje', accountType: 'EXPENSE', parentCode: '602', level: 3 },
  { code: '602.09', name: 'Comisiones bancarias', accountType: 'EXPENSE', parentCode: '602', level: 3 },

  { code: '603', name: 'Gastos de venta', accountType: 'EXPENSE', parentCode: '600', level: 2 },
  { code: '603.01', name: 'Publicidad y propaganda', accountType: 'EXPENSE', parentCode: '603', level: 3 },
  { code: '603.02', name: 'Fletes y acarreos', accountType: 'EXPENSE', parentCode: '603', level: 3 },
  { code: '603.03', name: 'Comisiones sobre ventas', accountType: 'EXPENSE', parentCode: '603', level: 3 },

  { code: '610', name: 'Gastos financieros', accountType: 'EXPENSE', parentCode: '600', level: 2 },
  { code: '610.01', name: 'Intereses pagados', accountType: 'EXPENSE', parentCode: '610', level: 3 },
  { code: '610.02', name: 'Pérdida cambiaria', accountType: 'EXPENSE', parentCode: '610', level: 3 },

  { code: '611', name: 'Depreciación del ejercicio', accountType: 'EXPENSE', parentCode: '600', level: 2 },
];
