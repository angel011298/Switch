'use server';

/**
 * CIFRA — Acciones del Contrato Digital
 * ==========================================
 * Maneja la recopilación de datos legales y la firma digital
 * para la generación del contrato de licenciamiento y NDA.
 */

import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { PersonType } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// Regex RFC SAT (Persona Física: 13 chars, Moral: 12 chars)
const RFC_FISICA_RE = /^[A-ZÑ&]{4}\d{6}[A-Z0-9]{3}$/;
const RFC_MORAL_RE  = /^[A-ZÑ&]{3}\d{6}[A-Z0-9]{3}$/;
const CURP_RE       = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;

function isValidRfc(rfc: string, type: PersonType): boolean {
  return type === 'FISICA' ? RFC_FISICA_RE.test(rfc) : RFC_MORAL_RE.test(rfc);
}

// ─── OBTENER DATOS DEL CONTRATO ───────────────────────────────────────────────

export async function getContractData() {
  const session = await getSwitchSession();
  if (!session?.tenantId) return null;

  return prisma.contractSignature.findUnique({
    where: { tenantId: session.tenantId },
  });
}

// ─── GUARDAR DATOS DEL CONTRATO (UPSERT) ─────────────────────────────────────

export async function saveContractData(data: {
  personType: PersonType;
  // Persona Física
  fullName?: string;
  curp?: string;
  domicilioFiscal?: string;
  rfcFisica?: string;
  emailFisica?: string;
  phoneFisica?: string;
  // Persona Moral — Empresa
  razonSocial?: string;
  rfcEmpresa?: string;
  domicilioLegal?: string;
  // Persona Moral — Representante Legal
  nombreRepresentante?: string;
  rfcRepresentante?: string;
  emailRepresentante?: string;
  celularRepresentante?: string;
  // Acreditación
  numEscritura?: string;
  fechaEscritura?: string;
  nombreNotario?: string;
  numNotaria?: string;
  ciudadNotaria?: string;
  folioMercantil?: string;
  fechaInscripcionRPC?: string;
}) {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No hay sesión activa');

  const tenantId = session.tenantId;

  // Validar RFC
  if (data.personType === 'FISICA') {
    if (!data.rfcFisica)   throw new Error('RFC requerido');
    if (!isValidRfc(data.rfcFisica.toUpperCase(), 'FISICA'))
      throw new Error('RFC inválido para Persona Física (debe ser de 13 posiciones)');
    if (data.curp && !CURP_RE.test(data.curp.toUpperCase()))
      throw new Error('CURP inválido (18 caracteres con el formato del RENAPO)');
  } else {
    if (!data.rfcEmpresa)  throw new Error('RFC de la empresa requerido');
    if (!isValidRfc(data.rfcEmpresa.toUpperCase(), 'MORAL'))
      throw new Error('RFC inválido para Persona Moral (debe ser de 12 posiciones)');
    if (data.rfcRepresentante && !isValidRfc(data.rfcRepresentante.toUpperCase(), 'FISICA'))
      throw new Error('RFC del representante inválido');
  }

  await prisma.contractSignature.upsert({
    where: { tenantId },
    update: {
      personType: data.personType,
      fullName:             data.fullName,
      curp:                 data.curp?.toUpperCase(),
      domicilioFiscal:      data.domicilioFiscal,
      rfcFisica:            data.rfcFisica?.toUpperCase(),
      emailFisica:          data.emailFisica,
      phoneFisica:          data.phoneFisica,
      razonSocial:          data.razonSocial,
      rfcEmpresa:           data.rfcEmpresa?.toUpperCase(),
      domicilioLegal:       data.domicilioLegal,
      nombreRepresentante:  data.nombreRepresentante,
      rfcRepresentante:     data.rfcRepresentante?.toUpperCase(),
      emailRepresentante:   data.emailRepresentante,
      celularRepresentante: data.celularRepresentante,
      numEscritura:         data.numEscritura,
      fechaEscritura:       data.fechaEscritura ? new Date(data.fechaEscritura) : undefined,
      nombreNotario:        data.nombreNotario,
      numNotaria:           data.numNotaria,
      ciudadNotaria:        data.ciudadNotaria,
      folioMercantil:       data.folioMercantil,
      fechaInscripcionRPC:  data.fechaInscripcionRPC ? new Date(data.fechaInscripcionRPC) : undefined,
    },
    create: {
      tenantId,
      personType: data.personType,
      fullName:             data.fullName,
      curp:                 data.curp?.toUpperCase(),
      domicilioFiscal:      data.domicilioFiscal,
      rfcFisica:            data.rfcFisica?.toUpperCase(),
      emailFisica:          data.emailFisica,
      phoneFisica:          data.phoneFisica,
      razonSocial:          data.razonSocial,
      rfcEmpresa:           data.rfcEmpresa?.toUpperCase(),
      domicilioLegal:       data.domicilioLegal,
      nombreRepresentante:  data.nombreRepresentante,
      rfcRepresentante:     data.rfcRepresentante?.toUpperCase(),
      emailRepresentante:   data.emailRepresentante,
      celularRepresentante: data.celularRepresentante,
      numEscritura:         data.numEscritura,
      fechaEscritura:       data.fechaEscritura ? new Date(data.fechaEscritura) : undefined,
      nombreNotario:        data.nombreNotario,
      numNotaria:           data.numNotaria,
      ciudadNotaria:        data.ciudadNotaria,
      folioMercantil:       data.folioMercantil,
      fechaInscripcionRPC:  data.fechaInscripcionRPC ? new Date(data.fechaInscripcionRPC) : undefined,
    },
  });

  revalidatePath('/billing/contrato');
}

// ─── GUARDAR FIRMA Y FINALIZAR ────────────────────────────────────────────────

export async function submitSignature(data: {
  signatureType: 'DRAW' | 'EFIRMA';
  signatureData?: string;   // Base64 PNG del canvas
  efirmaFileName?: string;  // Nombre del archivo .cer
}) {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No hay sesión activa');

  const contract = await prisma.contractSignature.findUnique({
    where: { tenantId: session.tenantId },
  });

  if (!contract) throw new Error('Completa los datos del contrato primero');

  if (data.signatureType === 'DRAW' && !data.signatureData) {
    throw new Error('Dibuja tu firma para continuar');
  }
  if (data.signatureType === 'EFIRMA' && !data.efirmaFileName) {
    throw new Error('Selecciona tu archivo de e.firma (.cer) para continuar');
  }

  await prisma.contractSignature.update({
    where: { tenantId: session.tenantId },
    data: {
      signatureType: data.signatureType,
      signatureData: data.signatureData,
      efirmaFileName: data.efirmaFileName,
      signedAt: new Date(),
      status: 'SIGNED',
    },
  });

  revalidatePath('/billing/subscription');
  return { success: true };
}
