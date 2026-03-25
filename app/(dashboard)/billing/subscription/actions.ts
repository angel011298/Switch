'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { getSwitchSession } from '@/lib/auth/session';
import { DAYS_PER_MONTHLY_PAYMENT } from '@/lib/billing/constants';
import { sendSubscriptionConfirmationEmail } from '@/lib/email/mailer';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface SubmitPaymentProofInput {
  amount: number;
  transferRef?: string;
  concept?: string;
  paidAt: string;       // ISO date string
  fileName: string;
  fileType: string;
  fileBase64: string;   // base64 del comprobante (max 2MB)
}

export interface SubmitPaymentProofResult {
  ok: boolean;
  error?: string;
  proofId?: string;
}

// ─── Tenant: Subir comprobante de pago ────────────────────────────────────────

export async function submitPaymentProof(
  input: SubmitPaymentProofInput
): Promise<SubmitPaymentProofResult> {
  const session = await getSwitchSession();
  if (!session) return { ok: false, error: 'No autenticado' };
  if (!session.tenantId) return { ok: false, error: 'Sin tenant asignado' };

  // Validaciones
  if (!input.amount || input.amount <= 0) {
    return { ok: false, error: 'El monto debe ser mayor a 0' };
  }
  if (!input.fileName || !input.fileBase64) {
    return { ok: false, error: 'El comprobante es obligatorio' };
  }
  // Validar tamaño: base64 ~4/3 del binario, limitar a ~2.5MB base64
  if (input.fileBase64.length > 3_400_000) {
    return { ok: false, error: 'El archivo no debe exceder 2.5 MB' };
  }
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(input.fileType)) {
    return { ok: false, error: 'Solo se aceptan PDF, JPG o PNG' };
  }

  // Verificar que no tenga un comprobante PENDING ya enviado
  const existing = await prisma.paymentProof.findFirst({
    where: { tenantId: session.tenantId, status: 'PENDING' },
  });
  if (existing) {
    return {
      ok: false,
      error: 'Ya tienes un comprobante en revisión. Espera la respuesta del equipo de Switch.',
    };
  }

  const proof = await prisma.paymentProof.create({
    data: {
      tenantId: session.tenantId,
      amount: input.amount,
      transferRef: input.transferRef || null,
      concept: input.concept || null,
      paidAt: new Date(input.paidAt),
      fileName: input.fileName,
      fileType: input.fileType,
      fileBase64: input.fileBase64,
      status: 'PENDING',
    },
  });

  revalidatePath('/billing/subscription');
  return { ok: true, proofId: proof.id };
}

// ─── Tenant: Obtener estado de suscripción ────────────────────────────────────

export async function getSubscriptionStatus() {
  const session = await getSwitchSession();
  if (!session?.tenantId) return null;

  const [sub, pendingProof] = await Promise.all([
    prisma.subscription.findUnique({
      where: { tenantId: session.tenantId },
    }),
    prisma.paymentProof.findFirst({
      where: { tenantId: session.tenantId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return { sub, pendingProof };
}

// ─── Super Admin: Listar comprobantes pendientes ──────────────────────────────

export async function getPendingProofs() {
  const session = await getSwitchSession();
  if (!session?.isSuperAdmin) return [];

  return prisma.paymentProof.findMany({
    where: { status: 'PENDING' },
    include: {
      tenant: { select: { id: true, name: true, rfc: true } },
    },
    orderBy: { createdAt: 'asc' }, // FIFO: primero el mas antiguo
  });
}

// ─── Super Admin: Aprobar comprobante (+30 días) ──────────────────────────────

export async function approvePaymentProof(
  proofId: string,
  daysToGrant: number = DAYS_PER_MONTHLY_PAYMENT
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSwitchSession();
  if (!session?.isSuperAdmin) return { ok: false, error: 'No autorizado' };

  const proof = await prisma.paymentProof.findUnique({
    where: { id: proofId },
    include: { tenant: { include: { subscription: true } } },
  });
  if (!proof) return { ok: false, error: 'Comprobante no encontrado' };
  if (proof.status !== 'PENDING') return { ok: false, error: 'El comprobante ya fue procesado' };

  // Calcular nuevo validUntil
  const currentValid = proof.tenant.subscription?.validUntil;
  const baseDate =
    currentValid && new Date(currentValid) > new Date()
      ? new Date(currentValid)  // Extender desde el vencimiento actual
      : new Date();             // Si ya venció, empezar desde hoy

  const newValidUntil = new Date(baseDate);
  newValidUntil.setDate(newValidUntil.getDate() + daysToGrant);

  await prisma.$transaction(async (tx) => {
    // 1. Actualizar la suscripcion del tenant
    await tx.subscription.upsert({
      where: { tenantId: proof.tenantId },
      create: {
        tenantId: proof.tenantId,
        planId: 'standard',
        status: 'ACTIVE',
        validUntil: newValidUntil,
      },
      update: {
        status: 'ACTIVE',
        validUntil: newValidUntil,
      },
    });

    // 2. Marcar el comprobante como aprobado
    await tx.paymentProof.update({
      where: { id: proofId },
      data: {
        status: 'APPROVED',
        reviewedBy: session.email,
        reviewedAt: new Date(),
        daysGranted: daysToGrant,
        newValidUntil,
      },
    });
  });

  // 3. Enviar correo de confirmacion (best-effort, no bloquea)
  const tenantUsers = await prisma.user.findMany({
    where: { tenantId: proof.tenantId, role: 'ADMIN' },
    select: { email: true, name: true },
  });

  for (const u of tenantUsers) {
    await sendSubscriptionConfirmationEmail({
      toEmail: u.email,
      toName: u.name,
      tenantName: proof.tenant.name,
      daysGranted: daysToGrant,
      newValidUntil,
      amount: Number(proof.amount),
    }).catch((err) =>
      console.error('[billing] Error enviando correo de confirmacion:', err)
    );
  }

  revalidatePath('/admin');
  revalidatePath('/billing/subscription');
  return { ok: true };
}

// ─── Super Admin: Rechazar comprobante ───────────────────────────────────────

export async function rejectPaymentProof(
  proofId: string,
  rejectionNote: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSwitchSession();
  if (!session?.isSuperAdmin) return { ok: false, error: 'No autorizado' };

  const proof = await prisma.paymentProof.findUnique({ where: { id: proofId } });
  if (!proof) return { ok: false, error: 'No encontrado' };
  if (proof.status !== 'PENDING') return { ok: false, error: 'Ya fue procesado' };

  await prisma.paymentProof.update({
    where: { id: proofId },
    data: {
      status: 'REJECTED',
      reviewedBy: session.email,
      reviewedAt: new Date(),
      rejectionNote: rejectionNote || 'Sin motivo especificado',
    },
  });

  revalidatePath('/admin');
  revalidatePath('/billing/subscription');
  return { ok: true };
}
