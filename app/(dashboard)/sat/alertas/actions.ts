'use server';

import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getComplianceAlerts() {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No session');
  return prisma.complianceAlert.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { dueDate: 'asc' },
  });
}

export async function generateFiscalCalendar(year: number) {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No session');
  const { tenantId } = session;

  const MONTH_NAMES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const alerts: { type: string; title: string; description: string; dueDate: Date; daysAhead: number; channel: string }[] = [];

  for (let m = 0; m < 12; m++) {
    const due = new Date(year, m + 1, 17);
    const mn = MONTH_NAMES[m];
    alerts.push({ type: 'IVA_MENSUAL', title: `IVA Mensual — ${mn} ${year}`, description: 'Declaración mensual de IVA (Art. 5-D LIVA)', dueDate: due, daysAhead: 7, channel: 'IN_APP' });
    alerts.push({ type: 'ISR_MENSUAL', title: `ISR Pago Provisional — ${mn} ${year}`, description: 'Pago provisional de ISR personas morales (Art. 14 LISR)', dueDate: due, daysAhead: 7, channel: 'IN_APP' });
    alerts.push({ type: 'DIOT', title: `DIOT — ${mn} ${year}`, description: 'Declaración Informativa de Operaciones con Terceros (Art. 32 LIVA)', dueDate: due, daysAhead: 5, channel: 'IN_APP' });
  }

  // IMSS Bimestral (5 bimestres: Feb, Apr, Jun, Aug, Oct, Dec → due el 17 del mes siguiente)
  for (let bim = 1; bim <= 6; bim++) {
    const dueMonth = bim * 2; // Feb=2→due Mar17, Apr=4→due May17, etc.
    const due = new Date(year, dueMonth, 17);
    alerts.push({ type: 'IMSS_BIMESTRAL', title: `IMSS/INFONAVIT Bimestre ${bim}/${year}`, description: 'Cuotas patronales bimestrales IMSS e INFONAVIT', dueDate: due, daysAhead: 5, channel: 'IN_APP' });
  }

  // Declaración Anual (March 31 of following year)
  alerts.push({ type: 'DECLARACION_ANUAL', title: `Declaración Anual ISR ${year}`, description: 'Declaración anual personas morales — 31 de marzo (Art. 76 LISR)', dueDate: new Date(year + 1, 2, 31), daysAhead: 30, channel: 'IN_APP' });

  // Delete existing alerts for this year and recreate
  await prisma.complianceAlert.deleteMany({
    where: { tenantId, dueDate: { gte: new Date(year, 0, 1), lt: new Date(year + 2, 0, 1) } },
  });

  await prisma.complianceAlert.createMany({
    data: alerts.map(a => ({ tenantId, status: 'PENDING', ...a })),
  });

  revalidatePath('/sat/alertas');
  return { created: alerts.length };
}

export async function dismissAlert(id: string) {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No session');
  await prisma.complianceAlert.update({
    where: { id },
    data: { status: 'DISMISSED', dismissedAt: new Date() },
  });
  revalidatePath('/sat/alertas');
}
