/**
 * CIFRA — Calendario de Obligaciones Fiscales México
 * ======================================================
 * Genera las obligaciones fiscales pendientes para un tenant
 * basado en el régimen fiscal y la fecha actual.
 *
 * Fuentes: SAT, IMSS, INFONAVIT — legislación vigente 2026.
 */

export type ObligationType =
  | 'ISR_PROVISIONAL'     // Declaración provisional ISR mensual
  | 'IVA_MENSUAL'         // Declaración de IVA mensual
  | 'DIOT'                // Declaración Informativa de Operaciones con Terceros
  | 'IMSS_CUOTAS'         // Cuotas IMSS bimestrales
  | 'INFONAVIT'           // Aportaciones INFONAVIT bimestrales
  | 'ISR_ANUAL'           // Declaración anual ISR
  | 'RESICO_BIMESTRAL'    // Declaración bimestral RESICO (PF)
  | 'PTUFISICA'           // Pago de PTU personas físicas
  | 'PTUMORAL'            // Pago de PTU personas morales
  | 'CFDI_NOMINA';        // Entrega de recibos de nómina digitales (CFDI 3.3/4.0)

export type ObligationStatus = 'UPCOMING' | 'DUE_SOON' | 'OVERDUE' | 'COMPLETED';

export interface FiscalObligation {
  id: string;
  type: ObligationType;
  label: string;
  description: string;
  dueDate: Date;
  period: string;           // Ej: "Enero 2026", "1er Bimestre 2026"
  authority: 'SAT' | 'IMSS' | 'INFONAVIT';
  status: ObligationStatus;
  daysLeft: number;         // Negativo = vencida
  link?: string;            // URL al portal oficial
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

const BIMESTRES = [
  { label: '1er Bimestre', months: [1, 2], dueMonth: 3, dueDay: 17 },
  { label: '2do Bimestre', months: [3, 4], dueMonth: 5, dueDay: 17 },
  { label: '3er Bimestre', months: [5, 6], dueMonth: 7, dueDay: 17 },
  { label: '4to Bimestre', months: [7, 8], dueMonth: 9, dueDay: 17 },
  { label: '5to Bimestre', months: [9, 10], dueMonth: 11, dueDay: 17 },
  { label: '6to Bimestre', months: [11, 12], dueMonth: 2, dueDay: 17, nextYear: true },
];

const MONTH_NAMES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function getStatus(daysLeft: number): ObligationStatus {
  if (daysLeft < 0)  return 'OVERDUE';
  if (daysLeft <= 7) return 'DUE_SOON';
  return 'UPCOMING';
}

function obligation(
  id: string,
  type: ObligationType,
  label: string,
  description: string,
  dueDate: Date,
  period: string,
  authority: FiscalObligation['authority'],
  priority: FiscalObligation['priority'],
  link?: string,
): FiscalObligation {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysLeft = daysBetween(today, dueDate);
  return { id, type, label, description, dueDate, period, authority, status: getStatus(daysLeft), daysLeft, link, priority };
}

/**
 * Genera obligaciones para los próximos N días (default 90).
 * @param regimeCode  Código SAT del régimen fiscal (ej. "601", "612")
 * @param hasPayroll  Si el tenant tiene empleados registrados
 * @param windowDays  Ventana de días hacia el futuro
 */
export function generateFiscalObligations(
  regimeCode: string | null,
  hasPayroll: boolean,
  windowDays = 90,
): FiscalObligation[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() + windowDays);

  const obligations: FiscalObligation[] = [];
  const year = today.getFullYear();
  const month = today.getMonth() + 1; // 1-based

  // ── Declaraciones mensuales ISR + IVA (Régimen General, meses pasados) ──────
  const isGeneralRegime = !regimeCode || ['601', '603', '605', '606', '608', '611', '616'].includes(regimeCode);
  const isResico = regimeCode === '625';

  if (isGeneralRegime) {
    for (let m = month - 2; m <= month + 3; m++) {
      const refMonth = m <= 0 ? m + 12 : m > 12 ? m - 12 : m;
      const refYear  = m <= 0 ? year - 1 : m > 12 ? year + 1 : year;
      const dueMonth = refMonth === 12 ? 1 : refMonth + 1;
      const dueYear  = refMonth === 12 ? refYear + 1 : refYear;
      const due = new Date(dueYear, dueMonth - 1, 17);
      if (due < new Date(today.getFullYear(), today.getMonth() - 1, 1)) continue;
      if (due > cutoff) continue;

      const period = `${MONTH_NAMES[refMonth]} ${refYear}`;

      obligations.push(obligation(
        `isr-${refYear}-${refMonth}`,
        'ISR_PROVISIONAL',
        'ISR Provisional Mensual',
        `Declaración y pago provisional de ISR correspondiente a ${period}`,
        due, period, 'SAT', 'HIGH',
        'https://www.sat.gob.mx/tramites/operacion/27568/presenta-tu-declaracion-provisional-o-definitiva-de-impuestos-federales',
      ));

      obligations.push(obligation(
        `iva-${refYear}-${refMonth}`,
        'IVA_MENSUAL',
        'IVA Mensual',
        `Declaración y pago de IVA correspondiente a ${period}`,
        due, period, 'SAT', 'HIGH',
        'https://www.sat.gob.mx/tramites/operacion/27568/presenta-tu-declaracion-provisional-o-definitiva-de-impuestos-federales',
      ));

      obligations.push(obligation(
        `diot-${refYear}-${refMonth}`,
        'DIOT',
        'DIOT Mensual',
        `Declaración Informativa de Operaciones con Terceros de ${period}`,
        due, period, 'SAT', 'MEDIUM',
        'https://www.sat.gob.mx/tramites/operacion/27568/presenta-la-declaracion-informativa-de-operaciones-con-terceros-diot',
      ));
    }
  }

  // ── RESICO bimestral (solo régimen 625) ──────────────────────────────────────
  if (isResico) {
    for (const bim of BIMESTRES) {
      const dueYear = bim.nextYear ? year + 1 : year;
      const due = new Date(dueYear, bim.dueMonth - 1, bim.dueDay);
      if (due < new Date(today.getFullYear(), today.getMonth() - 1, 1)) continue;
      if (due > cutoff) continue;
      obligations.push(obligation(
        `resico-${dueYear}-${bim.dueMonth}`,
        'RESICO_BIMESTRAL',
        'RESICO Bimestral',
        `Pago bimestral del Régimen Simplificado de Confianza — ${bim.label} ${year}`,
        due, `${bim.label} ${year}`, 'SAT', 'HIGH',
        'https://www.sat.gob.mx/tramites/operacion/30530',
      ));
    }
  }

  // ── IMSS + INFONAVIT bimestral (solo si tiene nómina) ───────────────────────
  if (hasPayroll) {
    for (const bim of BIMESTRES) {
      const dueYear = bim.nextYear ? year + 1 : year;
      const due = new Date(dueYear, bim.dueMonth - 1, bim.dueDay);
      if (due < new Date(today.getFullYear(), today.getMonth() - 2, 1)) continue;
      if (due > cutoff) continue;
      obligations.push(obligation(
        `imss-${dueYear}-${bim.dueMonth}`,
        'IMSS_CUOTAS',
        'Cuotas IMSS',
        `Pago de cuotas obrero-patronales IMSS — ${bim.label} ${year}`,
        due, `${bim.label} ${year}`, 'IMSS', 'HIGH',
        'https://idse.imss.gob.mx',
      ));
      obligations.push(obligation(
        `infonavit-${dueYear}-${bim.dueMonth}`,
        'INFONAVIT',
        'Aportaciones INFONAVIT',
        `Aportaciones patronales INFONAVIT — ${bim.label} ${year}`,
        due, `${bim.label} ${year}`, 'INFONAVIT', 'HIGH',
        'https://patronos.infonavit.org.mx',
      ));
    }
  }

  // ── Declaración anual (personas morales: marzo 31, físicas: abril 30) ────────
  const annualMoral = new Date(year, 2, 31);   // 31 marzo
  const annualFisica = new Date(year, 3, 30);  // 30 abril
  if (annualMoral >= today && annualMoral <= cutoff) {
    obligations.push(obligation(
      `isr-anual-moral-${year}`,
      'ISR_ANUAL',
      'Declaración Anual — Persona Moral',
      `ISR anual personas morales ejercicio fiscal ${year - 1}`,
      annualMoral, `Ejercicio ${year - 1}`, 'SAT', 'HIGH',
      'https://www.sat.gob.mx/tramites/operacion/27568',
    ));
  }
  if (annualFisica >= today && annualFisica <= cutoff) {
    obligations.push(obligation(
      `isr-anual-fisica-${year}`,
      'ISR_ANUAL',
      'Declaración Anual — Persona Física',
      `ISR anual personas físicas ejercicio fiscal ${year - 1}`,
      annualFisica, `Ejercicio ${year - 1}`, 'SAT', 'HIGH',
      'https://www.sat.gob.mx/tramites/operacion/27568',
    ));
  }

  // ── PTU (31 mayo morales, 30 junio físicas) ────────────────────────────────
  const ptuMoral = new Date(year, 4, 31);
  const ptuFisica = new Date(year, 5, 30);
  if (ptuMoral >= today && ptuMoral <= cutoff) {
    obligations.push(obligation(
      `ptu-moral-${year}`, 'PTUMORAL', 'PTU — Personas Morales',
      `Plazo máximo para distribuir utilidades a empleados (Art. 122 LFT)`,
      ptuMoral, `Ejercicio ${year - 1}`, 'SAT', 'MEDIUM',
    ));
  }
  if (ptuFisica >= today && ptuFisica <= cutoff) {
    obligations.push(obligation(
      `ptu-fisica-${year}`, 'PTUFISICA', 'PTU — Personas Físicas',
      `Plazo máximo para distribuir utilidades a empleados (Art. 122 LFT)`,
      ptuFisica, `Ejercicio ${year - 1}`, 'SAT', 'MEDIUM',
    ));
  }

  // Ordenar por fecha de vencimiento
  return obligations.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}

export const OBLIGATION_COLORS: Record<ObligationStatus, string> = {
  OVERDUE:   'border-rose-500 bg-rose-500/10 text-rose-400',
  DUE_SOON:  'border-amber-500 bg-amber-500/10 text-amber-400',
  UPCOMING:  'border-blue-500/30 bg-blue-500/5 text-blue-400',
  COMPLETED: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400',
};

export const AUTHORITY_COLORS: Record<FiscalObligation['authority'], string> = {
  SAT:       'bg-rose-500/10 text-rose-400 border border-rose-500/20',
  IMSS:      'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  INFONAVIT: 'bg-violet-500/10 text-violet-400 border border-violet-500/20',
};
