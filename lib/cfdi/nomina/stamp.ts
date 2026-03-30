/**
 * CIFRA — Motor de Timbrado de Nómina CFDI 4.0
 * ================================================
 * Orquesta el timbrado de un recibo de nómina:
 * 1. Carga PayrollItem + Employee + Tenant
 * 2. Construye XML con Complemento Nómina v1.2
 * 3. Calcula cadena original (incluye nómina complement)
 * 4. Firma con CSD del tenant
 * 5. Envía a PAC para timbrado
 * 6. Persiste resultado en PayrollItem
 */

import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { getCsd } from '../csd/vault';
import { decryptPrivateKey } from '../csd/key-reader';
import { buildNominaCfdiXml, type NominaInput } from './builder';
import { buildNominaCadenaOriginal } from './cadena-original';
import { signCadenaOriginal } from '../seal/digital-seal';
import { MockPac } from '../pac/mock-pac';
import { SwSapienPac } from '../pac/sw-sapien';
import type { PacAdapter } from '../pac/adapter';

function getPac(): PacAdapter {
  const swToken    = process.env.SW_SAPIEN_TOKEN;
  const swUser     = process.env.SW_SAPIEN_USER;
  const swPassword = process.env.SW_SAPIEN_PASSWORD;
  const envUrl     = process.env.SW_SAPIEN_URL ?? '';
  const isSandbox  = envUrl.includes('test') || !envUrl;
  if (swToken || (swUser && swPassword)) {
    return new SwSapienPac({ token: swToken, user: swUser, password: swPassword, sandbox: isSandbox });
  }
  return new MockPac();
}

export interface NominaStampResult {
  success: boolean;
  uuid?: string | null;
  xmlTimbrado?: string;
  sello?: string;
  error?: string;
}

export async function stampPayrollItem(
  tenantId: string,
  payrollItemId: string
): Promise<NominaStampResult> {
  // ── 1. Cargar datos ──────────────────────────────────────────────────────
  const item = await prisma.payrollItem.findUnique({
    where: { id: payrollItemId },
    include: {
      employee: true,
      payrollRun: true,
    },
  });

  if (!item || item.payrollRun.tenantId !== tenantId) {
    return { success: false, error: 'Recibo no encontrado' };
  }

  // Ya timbrado — idempotente
  if (item.cfdiStatus === 'STAMPED') {
    return { success: true, uuid: item.cfdiUuid, xmlTimbrado: item.cfdiXml ?? undefined };
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { taxRegime: true },
  });

  if (!tenant?.rfc || !tenant.legalName || !tenant.taxRegime || !tenant.zipCode) {
    return { success: false, error: 'Configuración fiscal del tenant incompleta (RFC/Razón Social/Régimen/CP)' };
  }

  // ── 2. Cargar CSD ─────────────────────────────────────────────────────────
  let csd: Awaited<ReturnType<typeof getCsd>>;
  let privateKey: crypto.KeyObject;
  try {
    csd = await getCsd(tenantId);
    privateKey = decryptPrivateKey(csd.keyDer, csd.password);
  } catch (e) {
    return { success: false, error: `CSD no configurado: ${(e as Error).message}` };
  }

  // ── 3. Folio ──────────────────────────────────────────────────────────────
  const stampedCount = await prisma.payrollItem.count({
    where: { payrollRun: { tenantId }, cfdiStatus: 'STAMPED' },
  });
  const folio = stampedCount + 1;

  // ── 4. Datos del periodo ──────────────────────────────────────────────────
  const run = item.payrollRun;
  const isQuincenal      = run.period.includes('Q');
  const numDiasPagados   = isQuincenal ? 15 : 30;
  const periodicidadPago = isQuincenal ? '04' : '05';
  const fechaInicialPago = run.startDate.toISOString().split('T')[0];
  const fechaFinalPago   = run.endDate.toISOString().split('T')[0];
  const fechaPago        = fechaFinalPago;
  const fecha            = new Date().toISOString().replace('Z', '').split('.')[0];

  // ── 5. Datos calculados ───────────────────────────────────────────────────
  const bruto   = Number(item.bruto);
  const isr     = Number(item.isr);
  const imss    = Number(item.imss);
  const salarioDiarioIntegrado = bruto / numDiasPagados;

  const emp = item.employee;

  const nominaInput: NominaInput = {
    noCertificado:        csd.noCertificado,
    certificado:          csd.base64Cert,
    lugarExpedicion:      tenant.zipCode,
    serie:                'N',
    folio,
    fecha,

    emisorRfc:            tenant.rfc,
    emisorNombre:         tenant.legalName,
    emisorRegimenFiscal:  tenant.taxRegime.satCode,
    registroPatronal:     (tenant as any).registroPatronal ?? undefined,

    receptorRfc:          emp.rfc ?? 'XAXX010101000',
    receptorNombre:       emp.name,
    receptorCurp:         emp.curp,
    receptorZip:          tenant.zipCode,
    numEmpleado:          emp.id.slice(-8).toUpperCase(),
    departamento:         emp.department ?? undefined,
    puesto:               emp.position,
    claveEntFed:          'CMX',

    tipoNomina:           'O',
    fechaPago,
    fechaInicialPago,
    fechaFinalPago,
    numDiasPagados,
    periodicidadPago,

    bruto,
    isr,
    imss,
    salarioDiarioIntegrado,
  };

  // ── 6. Construir XML sin sello, calcular cadena, firmar ───────────────────
  const xmlSinSello     = buildNominaCfdiXml(nominaInput);
  const cadenaOriginal  = buildNominaCadenaOriginal(nominaInput);
  const sello           = signCadenaOriginal(cadenaOriginal, privateKey);

  nominaInput.sello     = sello;
  const xmlSellado      = buildNominaCfdiXml(nominaInput);

  // ── 7. Timbrar con PAC ────────────────────────────────────────────────────
  const pac = getPac();
  let stampResult: Awaited<ReturnType<typeof pac.stamp>>;
  try {
    stampResult = await pac.stamp(xmlSellado);
  } catch (e) {
    const errMsg = `Error de red con PAC: ${(e as Error).message}`;
    await prisma.payrollItem.update({
      where: { id: payrollItemId },
      data: { cfdiStatus: 'ERROR', cfdiError: errMsg },
    });
    return { success: false, error: errMsg };
  }

  if (!stampResult.success) {
    await prisma.payrollItem.update({
      where: { id: payrollItemId },
      data: { cfdiStatus: 'ERROR', cfdiError: stampResult.error },
    });
    return { success: false, error: stampResult.error };
  }

  // ── 8. Persistir ──────────────────────────────────────────────────────────
  await prisma.payrollItem.update({
    where: { id: payrollItemId },
    data: {
      cfdiStatus:        'STAMPED',
      cfdiUuid:          stampResult.uuid,
      cfdiXml:           stampResult.xmlTimbrado ?? xmlSellado,
      cfdiSello:         sello,
      cfdiNoCertificado: csd.noCertificado,
      rfcProvCertif:     stampResult.rfcProvCertif,
      fechaTimbrado:     stampResult.fechaTimbrado
        ? new Date(stampResult.fechaTimbrado)
        : new Date(),
      cfdiError:         null,
    },
  });

  return {
    success:     true,
    uuid:        stampResult.uuid,
    xmlTimbrado: stampResult.xmlTimbrado ?? xmlSellado,
    sello,
  };
}

// ─── Timbrado masivo de una corrida ──────────────────────────────────────────

export interface StampRunResult {
  total:   number;
  stamped: number;
  errors:  number;
  details: Array<{ employeeName: string; uuid?: string | null; error?: string }>;
}

export async function stampPayrollRun(
  tenantId: string,
  runId: string
): Promise<StampRunResult> {
  const run = await prisma.payrollRun.findUnique({
    where: { id: runId },
    include: { items: { include: { employee: true } } },
  });

  if (!run || run.tenantId !== tenantId) {
    throw new Error('Corrida de nómina no encontrada');
  }
  if (run.status !== 'CLOSED') {
    throw new Error('Solo se pueden timbrar nóminas cerradas');
  }

  const pendingItems = run.items.filter((i) => i.cfdiStatus !== 'STAMPED');

  const result: StampRunResult = {
    total:   run.items.length,
    stamped: run.items.filter((i) => i.cfdiStatus === 'STAMPED').length,
    errors:  0,
    details: [],
  };

  for (const item of pendingItems) {
    const res = await stampPayrollItem(tenantId, item.id);
    if (res.success) {
      result.stamped++;
      result.details.push({ employeeName: item.employee.name, uuid: res.uuid });
    } else {
      result.errors++;
      result.details.push({ employeeName: item.employee.name, error: res.error });
    }
  }

  return result;
}
