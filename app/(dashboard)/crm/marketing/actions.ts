'use server';

/**
 * CIFRA — CRM Marketing Server Actions
 * =====================================
 * FASE 32: Campañas de email masivo.
 */

import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { sendEmail } from '@/lib/email/mailer';

export interface CampaignRow {
  id: string;
  name: string;
  subject: string;
  status: string;
  sentAt: string | null;
  recipientCount: number;
  openCount: number;
  clickCount: number;
  createdAt: string;
}

export async function getCampaigns(): Promise<CampaignRow[]> {
  const session = await getSwitchSession();
  if (!session?.tenantId) return [];

  const campaigns = await prisma.campaign.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, subject: true, status: true,
      sentAt: true, recipientCount: true, openCount: true, clickCount: true, createdAt: true,
    },
  });

  return campaigns.map(c => ({
    ...c,
    sentAt: c.sentAt?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
  }));
}

export async function createCampaign(input: {
  name: string;
  subject: string;
  htmlBody: string;
}): Promise<string> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');
  if (!input.name.trim()) throw new Error('El nombre es requerido');
  if (!input.subject.trim()) throw new Error('El asunto es requerido');

  const campaign = await prisma.campaign.create({
    data: {
      tenantId: session.tenantId,
      name:     input.name.trim(),
      subject:  input.subject.trim(),
      htmlBody: input.htmlBody,
    },
    select: { id: true },
  });

  revalidatePath('/crm/marketing');
  return campaign.id;
}

export async function sendCampaign(campaignId: string): Promise<{ sent: number; failed: number }> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');
  const tenantId = session.tenantId;

  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign || campaign.tenantId !== tenantId) throw new Error('Campaña no encontrada');
  if (campaign.status === 'SENT') throw new Error('Esta campaña ya fue enviada');

  // Get active customers with email
  const customers = await prisma.customer.findMany({
    where: { tenantId, isActive: true, email: { not: null } },
    select: { id: true, legalName: true, email: true },
  });

  if (customers.length === 0) {
    throw new Error('No hay clientes con email registrado');
  }

  let sent = 0;
  let failed = 0;

  // Send emails in batches (best-effort, non-blocking per customer)
  for (const customer of customers) {
    if (!customer.email) continue;
    try {
      await sendEmail({
        to: customer.email,
        subject: campaign.subject,
        html: campaign.htmlBody.replace(/\{\{nombre\}\}/g, customer.legalName),
      });
      sent++;
    } catch {
      failed++;
    }
  }

  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status: 'SENT',
      sentAt: new Date(),
      recipientCount: sent,
    },
  });

  revalidatePath('/crm/marketing');
  return { sent, failed };
}

export async function deleteCampaign(campaignId: string): Promise<void> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');

  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign || campaign.tenantId !== session.tenantId) throw new Error('No encontrada');
  if (campaign.status === 'SENT') throw new Error('No se puede eliminar una campaña enviada');

  await prisma.campaign.delete({ where: { id: campaignId } });
  revalidatePath('/crm/marketing');
}
