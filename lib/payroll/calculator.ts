/**
 * CIFRA — Motor de Cálculo de Nómina
 * =========================================
 * Implementa el cálculo de ISR y cuota obrera IMSS para México 2026.
 *
 * ALGORITMO:
 *   1. Determinar salario del periodo (mensual ÷ 2 si quincenal)
 *   2. Calcular ISR mensual usando tabla SAT 2026
 *   3. Restar Subsidio al Empleo si aplica
 *   4. Calcular cuota obrera IMSS
 *   5. Descontar faltas proporcionales
 *   6. Neto = Bruto - ISR - IMSS - Deducciones
 *
 * Ref: Anexo 8 RMF 2026, Ley del IMSS, LISR Art. 96
 */

// ─── TABLAS ISR MENSUAL 2026 ───────────────────────────────────────────────
// Fuente: Anexo 8 de la Resolución Miscelánea Fiscal 2026
// (Mismas tablas que 2024/2025 — no hubo cambios)

interface IsrBracket {
  lowerLimit: number;
  upperLimit: number;
  fixedTax: number;
  marginalRate: number; // porcentaje como decimal 0.xx
}

const ISR_TABLE_MONTHLY: IsrBracket[] = [
  { lowerLimit: 0.01,      upperLimit: 746.04,     fixedTax: 0.00,       marginalRate: 0.0192 },
  { lowerLimit: 746.05,    upperLimit: 6_332.05,   fixedTax: 14.32,      marginalRate: 0.0640 },
  { lowerLimit: 6_332.06,  upperLimit: 11_128.01,  fixedTax: 371.83,     marginalRate: 0.1088 },
  { lowerLimit: 11_128.02, upperLimit: 12_935.82,  fixedTax: 893.63,     marginalRate: 0.1600 },
  { lowerLimit: 12_935.83, upperLimit: 15_487.71,  fixedTax: 1_182.88,   marginalRate: 0.1792 },
  { lowerLimit: 15_487.72, upperLimit: 31_236.49,  fixedTax: 1_640.18,   marginalRate: 0.2136 },
  { lowerLimit: 31_236.50, upperLimit: 49_233.00,  fixedTax: 4_997.65,   marginalRate: 0.2352 },
  { lowerLimit: 49_233.01, upperLimit: 93_993.90,  fixedTax: 9_228.69,   marginalRate: 0.3000 },
  { lowerLimit: 93_993.91, upperLimit: 125_325.20, fixedTax: 22_665.17,  marginalRate: 0.3200 },
  { lowerLimit: 125_325.21,upperLimit: 375_975.61, fixedTax: 32_691.18,  marginalRate: 0.3400 },
  { lowerLimit: 375_975.62,upperLimit: 751_951.00, fixedTax: 117_912.32, marginalRate: 0.3500 },
  { lowerLimit: 751_951.01,upperLimit: Infinity,   fixedTax: 249_988.20, marginalRate: 0.3500 },
];

// Subsidio al empleo mensual 2026 (Art. Octavo Transitorio LISR)
interface SubsidioRow {
  upperLimit: number;
  subsidy: number;
}

const SUBSIDIO_TABLE: SubsidioRow[] = [
  { upperLimit: 1_768.96,  subsidy: 407.02  },
  { upperLimit: 2_653.38,  subsidy: 406.83  },
  { upperLimit: 3_472.84,  subsidy: 406.62  },
  { upperLimit: 3_537.87,  subsidy: 392.77  },
  { upperLimit: 4_446.15,  subsidy: 382.46  },
  { upperLimit: 4_717.18,  subsidy: 354.23  },
  { upperLimit: 5_335.42,  subsidy: 324.87  },
  { upperLimit: 6_224.67,  subsidy: 294.63  },
  { upperLimit: 7_113.90,  subsidy: 253.54  },
  { upperLimit: 7_382.33,  subsidy: 217.61  },
  { upperLimit: Infinity,  subsidy: 0        },
];

// IMSS cuota obrera 2026 (porcentaje del salario mensual integrado)
// Enfermedad y Maternidad (prestaciones en especie + dinero): 0.40% + 0.25%
// Invalidez y Vida: 0.625%
// Cesantía en edad avanzada y vejez: 1.125%
// Retiro, guardería, etc.: 0% (patrón)
// Total obrero simplificado: 2.40% (conservador, incluye pequeña fracción variable)
const IMSS_RATE_OBRERA = 0.024;

// Días laborables estándar por quincena y mes
const WORKDAYS_MONTHLY = 30;
const WORKDAYS_QUINCENAL = 15;

// ─── UTILIDADES ─────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// ─── CÁLCULO ISR MENSUAL ────────────────────────────────────────────────────

/**
 * Calcula el ISR mensual bruto usando la tabla del Anexo 8.
 * @param monthlyIncome Ingreso mensual gravable
 * @returns ISR causado (antes de subsidio)
 */
export function calculateISRMonthly(monthlyIncome: number): number {
  const bracket = ISR_TABLE_MONTHLY.find(
    (b) => monthlyIncome >= b.lowerLimit && monthlyIncome <= b.upperLimit
  );
  if (!bracket) return 0;

  const excess = monthlyIncome - bracket.lowerLimit;
  const isr = bracket.fixedTax + excess * bracket.marginalRate;
  return round2(Math.max(0, isr));
}

/**
 * Calcula el subsidio al empleo mensual aplicable.
 */
export function calculateSubsidio(monthlyIncome: number): number {
  const row = SUBSIDIO_TABLE.find((r) => monthlyIncome <= r.upperLimit);
  return row?.subsidy ?? 0;
}

/**
 * ISR neto mensual (ya aplicado el subsidio al empleo).
 */
export function calculateNetISRMonthly(monthlyIncome: number): number {
  const isrCausado = calculateISRMonthly(monthlyIncome);
  const subsidio = calculateSubsidio(monthlyIncome);
  return round2(Math.max(0, isrCausado - subsidio));
}

// ─── CÁLCULO IMSS CUOTA OBRERA ──────────────────────────────────────────────

/**
 * Cuota obrera IMSS mensual (2.40% del salario mensual).
 */
export function calculateIMSSObrera(monthlyIncome: number): number {
  return round2(monthlyIncome * IMSS_RATE_OBRERA);
}

// ─── TIPOS PÚBLICOS ──────────────────────────────────────────────────────────

export interface PayrollCalculationInput {
  employeeId: string;
  employeeName: string;
  position: string;
  salary: number;         // Salario mensual en la BD
  salaryType: string;     // 'MENSUAL' | 'QUINCENAL'
  absenceDays?: number;   // Días de falta en el período
}

export interface PayrollCalculationResult {
  employeeId: string;
  employeeName: string;
  position: string;
  bruto: number;           // Salario del periodo
  isr: number;             // Retención ISR del periodo
  imss: number;            // Cuota obrera IMSS del periodo
  absenceDays: number;
  absenceDeduct: number;   // Deducción proporcional por faltas
  neto: number;            // Neto a pagar
}

// ─── CALCULADORA PRINCIPAL ───────────────────────────────────────────────────

/**
 * Calcula nómina de un empleado para un periodo dado.
 *
 * Para empleados QUINCENAL: El salario en BD es quincenal.
 * Para empleados MENSUAL: El salario en BD es mensual.
 *
 * ISR y IMSS se calculan sobre base mensual y se prorratean al periodo.
 */
export function calculateEmployeePayroll(
  input: PayrollCalculationInput
): PayrollCalculationResult {
  const absenceDays = input.absenceDays ?? 0;
  const isQuincenal = input.salaryType === 'QUINCENAL';

  // Salario del periodo (bruto antes de deducciones)
  const periodSalary = round2(input.salary);

  // Base mensual para calcular ISR e IMSS
  const monthlyBase = isQuincenal
    ? round2(periodSalary * 2)   // Quincenal → doble para base mensual
    : periodSalary;              // Mensual directo

  // Calcular ISR mensual y prorratear al periodo
  const isrMonthly = calculateNetISRMonthly(monthlyBase);
  const isrPeriod = isQuincenal ? round2(isrMonthly / 2) : isrMonthly;

  // Calcular IMSS mensual y prorratear al periodo
  const imssMonthly = calculateIMSSObrera(monthlyBase);
  const imssPeriod = isQuincenal ? round2(imssMonthly / 2) : imssMonthly;

  // Deducción proporcional por faltas
  const workdays = isQuincenal ? WORKDAYS_QUINCENAL : WORKDAYS_MONTHLY;
  const dailySalary = round2(periodSalary / workdays);
  const absenceDeduct = round2(dailySalary * absenceDays);

  // Bruto efectivo (ya descontadas faltas del salario bruto)
  const bruto = round2(periodSalary - absenceDeduct);

  // ISR ajustado si hay faltas (proporcional)
  const isrAdjusted = absenceDays > 0
    ? round2(isrPeriod * (bruto / periodSalary))
    : isrPeriod;

  // Neto final
  const neto = round2(bruto - isrAdjusted - imssPeriod);

  return {
    employeeId: input.employeeId,
    employeeName: input.employeeName,
    position: input.position,
    bruto,
    isr: isrAdjusted,
    imss: imssPeriod,
    absenceDays,
    absenceDeduct,
    neto: Math.max(0, neto),
  };
}

// ─── HELPER: LABEL DE PERIODO ────────────────────────────────────────────────

export type PeriodType = 'Q1' | 'Q2' | 'MENSUAL';

/**
 * Genera el ID y label de un periodo dado el año, mes y tipo.
 * @param year   Año (ej. 2026)
 * @param month  Mes 1-12
 * @param type   'Q1' | 'Q2' | 'MENSUAL'
 */
export function buildPeriod(
  year: number,
  month: number,
  type: PeriodType
): { period: string; periodLabel: string; startDate: Date; endDate: Date } {
  const monthNames = [
    '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  const monthPad = String(month).padStart(2, '0');

  if (type === 'Q1') {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month - 1, 15);
    return {
      period: `${year}-${monthPad}-Q1`,
      periodLabel: `Quincena 1 — ${monthNames[month]} ${year}`,
      startDate,
      endDate,
    };
  } else if (type === 'Q2') {
    const startDate = new Date(year, month - 1, 16);
    const endDate = new Date(year, month, 0); // last day of month
    return {
      period: `${year}-${monthPad}-Q2`,
      periodLabel: `Quincena 2 — ${monthNames[month]} ${year}`,
      startDate,
      endDate,
    };
  } else {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    return {
      period: `${year}-${monthPad}`,
      periodLabel: `${monthNames[month]} ${year}`,
      startDate,
      endDate,
    };
  }
}
