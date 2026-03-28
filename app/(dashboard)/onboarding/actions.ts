'use server';

/**
 * CIFRA — Onboarding Actions
 * ================================
 * FASE 12: Captura el perfil fiscal del Tenant (RFC, razón social, CP, régimen).
 * Esta información es OBLIGATORIA para emitir CFDI 4.0 (Anexo 20).
 */

import { getSwitchSession } from '@/lib/auth/session';
import { validateRfc } from '@/lib/crm/rfc-validator';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function setupTenantProfile(data: {
  name: string;
  legalName: string;
  rfc: string;
  zipCode: string;
  taxRegimeKey: string;
}) {
  const session = await getSwitchSession();
  if (!session?.tenantId) {
    throw new Error('No hay sesión activa');
  }

  // Limpiar y normalizar datos
  const rfc = data.rfc.trim().toUpperCase();
  const legalName = data.legalName.trim().toUpperCase();
  const name = data.name.trim();
  const zipCode = data.zipCode.trim();

  // Validar RFC con regex SAT
  if (!validateRfc(rfc)) {
    throw new Error(
      'RFC inválido. Personas Morales: 12 caracteres alfanuméricos.'
    );
  }

  // Validar CP
  if (!/^[0-9]{5}$/.test(zipCode)) {
    throw new Error('Código postal inválido (debe ser 5 dígitos numéricos)');
  }

  // Validar campos requeridos
  if (!name) throw new Error('Nombre de empresa requerido');
  if (!legalName) throw new Error('Razón social requerida');
  if (!data.taxRegimeKey) throw new Error('Régimen fiscal requerido');

  // Buscar TaxRegime por clave SAT (c_RegimenFiscal)
  const taxRegime = await prisma.taxRegime.findFirst({
    where: { satCode: data.taxRegimeKey },
  });

  // Actualizar Tenant con datos fiscales
  await prisma.tenant.update({
    where: { id: session.tenantId },
    data: {
      name,
      legalName,
      rfc,
      zipCode,
      taxRegimeId: taxRegime?.id ?? undefined,
      onboardingComplete: true,
    },
  });

  // Revalidar todas las rutas del dashboard
  revalidatePath('/', 'layout');
}

export async function getOnboardingStatus(): Promise<boolean> {
  const session = await getSwitchSession();
  if (!session?.tenantId) return false;

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { onboardingComplete: true },
  });

  return tenant?.onboardingComplete ?? false;
}
