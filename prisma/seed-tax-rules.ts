/**
 * Switch OS — Seed: Catalogo de Regimenes Fiscales SAT + Reglas de Impuestos
 * ===========================================================================
 * Inserta el catalogo c_RegimenFiscal del Anexo 20 CFDI 4.0
 * y las reglas de impuestos vigentes segun la legislacion 2024-2026.
 *
 * Ejecutar: npx tsx prisma/seed-tax-rules.ts
 *
 * FUNDAMENTO LEGAL:
 * - Catalogo c_RegimenFiscal: Anexo 20 CFDI 4.0 (SAT)
 * - IVA: Ley del IVA Art. 1 (16%), Art. 2-A (0%)
 * - ISR Retenciones: LISR Art. 106, 111-113
 * - RESICO: LISR Art. 113-E a 113-J (Titulo IV, Cap. II, Seccion IV)
 * - RMF 2024-2026: Reglas de caracter general
 */

import { PrismaClient, PersonType, TaxType, OperationType } from '@prisma/client';

const prisma = new PrismaClient();

// ─── CATALOGO DE REGIMENES FISCALES (c_RegimenFiscal SAT) ─

const TAX_REGIMES = [
  // Personas Morales
  { satCode: '601', name: 'General de Ley Personas Morales', personType: PersonType.MORAL },
  { satCode: '603', name: 'Personas Morales con Fines no Lucrativos', personType: PersonType.MORAL },
  { satCode: '620', name: 'Sociedades Cooperativas de Produccion', personType: PersonType.MORAL },
  { satCode: '622', name: 'Actividades Agricolas, Ganaderas, Silvicolas y Pesqueras', personType: PersonType.MORAL },
  { satCode: '623', name: 'Opcional para Grupos de Sociedades', personType: PersonType.MORAL },
  { satCode: '624', name: 'Coordinados', personType: PersonType.MORAL },

  // Personas Fisicas
  { satCode: '605', name: 'Sueldos y Salarios e Ingresos Asimilados', personType: PersonType.FISICA },
  { satCode: '606', name: 'Arrendamiento', personType: PersonType.FISICA },
  { satCode: '607', name: 'Regimen de Enajenacion o Adquisicion de Bienes', personType: PersonType.FISICA },
  { satCode: '608', name: 'Demas Ingresos', personType: PersonType.FISICA },
  { satCode: '610', name: 'Residentes en el Extranjero sin Establecimiento Permanente', personType: PersonType.FISICA },
  { satCode: '611', name: 'Ingresos por Dividendos (Socios y Accionistas)', personType: PersonType.FISICA },
  { satCode: '612', name: 'Personas Fisicas con Actividades Empresariales y Profesionales', personType: PersonType.FISICA },
  { satCode: '614', name: 'Ingresos por Intereses', personType: PersonType.FISICA },
  { satCode: '615', name: 'Regimen de los Ingresos por Obtencion de Premios', personType: PersonType.FISICA },
  { satCode: '616', name: 'Sin Obligaciones Fiscales', personType: PersonType.FISICA },
  { satCode: '621', name: 'Incorporacion Fiscal (Historico)', personType: PersonType.FISICA },
  { satCode: '625', name: 'Regimen de las Actividades Empresariales con Ingresos por Plataformas Tecnologicas', personType: PersonType.FISICA },
  { satCode: '626', name: 'Regimen Simplificado de Confianza (RESICO)', personType: PersonType.FISICA },
];

// Fecha de inicio comun para reglas vigentes (RMF 2024)
const VALID_FROM = new Date('2024-01-01T00:00:00Z');

// ─── REGLAS DE IMPUESTOS ────────────────────────────────

interface TaxRuleSeed {
  code: string;
  name: string;
  description: string;
  taxType: TaxType;
  operationType: OperationType;
  rate: number;
  isPercentage: boolean;
  isWithholding: boolean;
  emitterPersonType?: PersonType;
  receiverPersonType?: PersonType;
  applicableRegimeCodes: string[]; // SAT codes de regimenes donde aplica
}

const TAX_RULES: TaxRuleSeed[] = [
  // ══════════════════════════════════════════════════════
  // IVA TRASLADADO — Art. 1 LIVA (Tasa General 16%)
  // ══════════════════════════════════════════════════════
  {
    code: 'IVA_GENERAL_16_PROD',
    name: 'IVA 16% Venta de Productos',
    description: 'Art. 1 LIVA. Tasa general del 16% aplicable a la enajenacion de bienes en territorio nacional.',
    taxType: TaxType.IVA,
    operationType: OperationType.SALE_PRODUCT,
    rate: 0.16,
    isPercentage: true,
    isWithholding: false,
    applicableRegimeCodes: ['601', '603', '612', '620', '621', '622', '624', '625', '626'],
  },
  {
    code: 'IVA_GENERAL_16_SERV',
    name: 'IVA 16% Prestacion de Servicios',
    description: 'Art. 1 LIVA. Tasa general del 16% aplicable a la prestacion de servicios independientes.',
    taxType: TaxType.IVA,
    operationType: OperationType.SALE_SERVICE,
    rate: 0.16,
    isPercentage: true,
    isWithholding: false,
    applicableRegimeCodes: ['601', '603', '612', '620', '621', '622', '624', '625', '626'],
  },
  {
    code: 'IVA_GENERAL_16_LEASE',
    name: 'IVA 16% Arrendamiento',
    description: 'Art. 1 LIVA. Tasa general del 16% aplicable al arrendamiento de bienes inmuebles.',
    taxType: TaxType.IVA,
    operationType: OperationType.LEASE,
    rate: 0.16,
    isPercentage: true,
    isWithholding: false,
    applicableRegimeCodes: ['601', '606', '612'],
  },

  // ══════════════════════════════════════════════════════
  // IVA COMPRAS — Para deduccion de gastos
  // ══════════════════════════════════════════════════════
  {
    code: 'IVA_GENERAL_16_COMPRA_PROD',
    name: 'IVA 16% Compra de Productos',
    description: 'Art. 1 LIVA. IVA acreditable en la adquisicion de bienes.',
    taxType: TaxType.IVA,
    operationType: OperationType.PURCHASE_PRODUCT,
    rate: 0.16,
    isPercentage: true,
    isWithholding: false,
    applicableRegimeCodes: ['601', '603', '612', '620', '622', '624', '626'],
  },
  {
    code: 'IVA_GENERAL_16_COMPRA_SERV',
    name: 'IVA 16% Adquisicion de Servicios',
    description: 'Art. 1 LIVA. IVA acreditable en la adquisicion de servicios profesionales.',
    taxType: TaxType.IVA,
    operationType: OperationType.PURCHASE_SERVICE,
    rate: 0.16,
    isPercentage: true,
    isWithholding: false,
    applicableRegimeCodes: ['601', '603', '612', '620', '622', '624', '626'],
  },

  // ══════════════════════════════════════════════════════
  // RETENCIONES IVA — Art. 1-A LIVA
  // Persona Moral que recibe servicios de Persona Fisica
  // ══════════════════════════════════════════════════════
  {
    code: 'RET_IVA_PM_PF_SERV',
    name: 'Retencion IVA 2/3 (Servicios PF a PM)',
    description: 'Art. 1-A fraccion II inciso a) LIVA. Las personas morales que reciban servicios personales independientes de personas fisicas retendran las 2/3 partes del IVA trasladado (10.6667%).',
    taxType: TaxType.RETENCION_IVA,
    operationType: OperationType.SALE_SERVICE,
    rate: 0.106667,
    isPercentage: true,
    isWithholding: true,
    emitterPersonType: PersonType.FISICA,
    receiverPersonType: PersonType.MORAL,
    applicableRegimeCodes: ['612', '625', '626'],
  },

  // ══════════════════════════════════════════════════════
  // RETENCIONES ISR — Art. 106 LISR (Servicios profesionales)
  // ══════════════════════════════════════════════════════
  {
    code: 'RET_ISR_PF_SERV_10',
    name: 'Retencion ISR 10% (Servicios PF-PFAE a PM)',
    description: 'Art. 106 parrafo 2 LISR. Las personas morales que efectuen pagos por honorarios a personas fisicas con actividad empresarial (PFAE, regimen 612) retendran el 10% del monto.',
    taxType: TaxType.RETENCION_ISR,
    operationType: OperationType.SALE_SERVICE,
    rate: 0.10,
    isPercentage: true,
    isWithholding: true,
    emitterPersonType: PersonType.FISICA,
    receiverPersonType: PersonType.MORAL,
    applicableRegimeCodes: ['612'],
  },

  // ══════════════════════════════════════════════════════
  // RETENCION ISR RESICO — Art. 113-J LISR
  // Tasa del 1.25% cuando RESICO factura a Persona Moral
  // ══════════════════════════════════════════════════════
  {
    code: 'RET_ISR_RESICO_125',
    name: 'Retencion ISR 1.25% (RESICO a PM)',
    description: 'Art. 113-J LISR. Las personas morales que efectuen pagos a contribuyentes RESICO retendran el 1.25% sobre el monto sin IVA. Esta tasa preferencial aplica exclusivamente al Regimen Simplificado de Confianza (626).',
    taxType: TaxType.RETENCION_ISR,
    operationType: OperationType.SALE_SERVICE,
    rate: 0.0125,
    isPercentage: true,
    isWithholding: true,
    emitterPersonType: PersonType.FISICA,
    receiverPersonType: PersonType.MORAL,
    applicableRegimeCodes: ['626'],
  },
  {
    code: 'RET_ISR_RESICO_125_PROD',
    name: 'Retencion ISR 1.25% (RESICO Productos a PM)',
    description: 'Art. 113-J LISR. Retencion del 1.25% aplicable a enajenacion de bienes por contribuyentes RESICO cuando el receptor es Persona Moral.',
    taxType: TaxType.RETENCION_ISR,
    operationType: OperationType.SALE_PRODUCT,
    rate: 0.0125,
    isPercentage: true,
    isWithholding: true,
    emitterPersonType: PersonType.FISICA,
    receiverPersonType: PersonType.MORAL,
    applicableRegimeCodes: ['626'],
  },

  // ══════════════════════════════════════════════════════
  // RETENCION ISR ARRENDAMIENTO — Art. 116 LISR
  // ══════════════════════════════════════════════════════
  {
    code: 'RET_ISR_ARREND_10',
    name: 'Retencion ISR 10% (Arrendamiento PF a PM)',
    description: 'Art. 116 LISR. Las personas morales que paguen rentas a personas fisicas retendran el 10% del monto sin IVA como pago provisional de ISR.',
    taxType: TaxType.RETENCION_ISR,
    operationType: OperationType.LEASE,
    rate: 0.10,
    isPercentage: true,
    isWithholding: true,
    emitterPersonType: PersonType.FISICA,
    receiverPersonType: PersonType.MORAL,
    applicableRegimeCodes: ['606'],
  },

  // ══════════════════════════════════════════════════════
  // RETENCION IVA ARRENDAMIENTO — Art. 1-A LIVA
  // ══════════════════════════════════════════════════════
  {
    code: 'RET_IVA_ARREND_PM_PF',
    name: 'Retencion IVA 2/3 (Arrendamiento PF a PM)',
    description: 'Art. 1-A fraccion II inciso a) LIVA. Las personas morales que paguen arrendamiento a personas fisicas retendran las 2/3 partes del IVA.',
    taxType: TaxType.RETENCION_IVA,
    operationType: OperationType.LEASE,
    rate: 0.106667,
    isPercentage: true,
    isWithholding: true,
    emitterPersonType: PersonType.FISICA,
    receiverPersonType: PersonType.MORAL,
    applicableRegimeCodes: ['606'],
  },

  // ══════════════════════════════════════════════════════
  // COMISIONES — Retenciones
  // ══════════════════════════════════════════════════════
  {
    code: 'IVA_GENERAL_16_COMISION',
    name: 'IVA 16% Comisiones',
    description: 'Art. 1 LIVA. IVA trasladado en servicios de comision mercantil o intermediacion.',
    taxType: TaxType.IVA,
    operationType: OperationType.COMMISSION,
    rate: 0.16,
    isPercentage: true,
    isWithholding: false,
    applicableRegimeCodes: ['601', '612', '625', '626'],
  },
  {
    code: 'RET_ISR_COMISION_10',
    name: 'Retencion ISR 10% (Comisiones PF a PM)',
    description: 'Art. 106 LISR. Retencion de ISR aplicable a comisiones pagadas por personas morales a personas fisicas.',
    taxType: TaxType.RETENCION_ISR,
    operationType: OperationType.COMMISSION,
    rate: 0.10,
    isPercentage: true,
    isWithholding: true,
    emitterPersonType: PersonType.FISICA,
    receiverPersonType: PersonType.MORAL,
    applicableRegimeCodes: ['612'],
  },
];

// ─── EJECUCION ──────────────────────────────────────────

async function main() {
  console.log('══════════════════════════════════════════');
  console.log('  Switch OS — Seed de Reglas Fiscales SAT');
  console.log('══════════════════════════════════════════\n');

  // 1. Insertar regimenes fiscales
  console.log('📋 Insertando catalogo c_RegimenFiscal del SAT...\n');
  const regimeMap = new Map<string, string>(); // satCode → id

  for (const regime of TAX_REGIMES) {
    const result = await prisma.taxRegime.upsert({
      where: { satCode: regime.satCode },
      update: { name: regime.name, personType: regime.personType, isActive: true },
      create: { satCode: regime.satCode, name: regime.name, personType: regime.personType },
    });
    regimeMap.set(regime.satCode, result.id);
    console.log(`   ✅ [${regime.satCode}] ${regime.name} (${regime.personType})`);
  }

  console.log(`\n   Total: ${TAX_REGIMES.length} regimenes\n`);

  // 2. Insertar reglas de impuestos
  console.log('📐 Insertando reglas de impuestos vigentes...\n');

  for (const rule of TAX_RULES) {
    // Upsert de la regla
    const taxRule = await prisma.taxRule.upsert({
      where: { code: rule.code },
      update: {
        name: rule.name,
        description: rule.description,
        taxType: rule.taxType,
        operationType: rule.operationType,
        rate: rule.rate,
        isPercentage: rule.isPercentage,
        isWithholding: rule.isWithholding,
        emitterPersonType: rule.emitterPersonType ?? null,
        receiverPersonType: rule.receiverPersonType ?? null,
        validFrom: VALID_FROM,
        validTo: null,
      },
      create: {
        code: rule.code,
        name: rule.name,
        description: rule.description,
        taxType: rule.taxType,
        operationType: rule.operationType,
        rate: rule.rate,
        isPercentage: rule.isPercentage,
        isWithholding: rule.isWithholding,
        emitterPersonType: rule.emitterPersonType ?? null,
        receiverPersonType: rule.receiverPersonType ?? null,
        validFrom: VALID_FROM,
        validTo: null,
      },
    });

    // Vincular a regimenes aplicables
    for (const satCode of rule.applicableRegimeCodes) {
      const regimeId = regimeMap.get(satCode);
      if (!regimeId) continue;

      await prisma.taxRuleRegime.upsert({
        where: {
          taxRuleId_taxRegimeId: {
            taxRuleId: taxRule.id,
            taxRegimeId: regimeId,
          },
        },
        update: {},
        create: {
          taxRuleId: taxRule.id,
          taxRegimeId: regimeId,
        },
      });
    }

    const rateDisplay = rule.isPercentage
      ? `${(rule.rate * 100).toFixed(4)}%`
      : `$${rule.rate} fija`;
    const whLabel = rule.isWithholding ? ' [RETENCION]' : '';
    console.log(`   ✅ ${rule.code.padEnd(30)} → ${rateDisplay}${whLabel}`);
  }

  console.log(`\n   Total: ${TAX_RULES.length} reglas\n`);
  console.log('🎉 Seed de reglas fiscales completado.');
  console.log('   Las reglas son vigentes desde 2024-01-01 (RMF 2024).\n');
}

main()
  .catch((e) => {
    console.error('💥 Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
