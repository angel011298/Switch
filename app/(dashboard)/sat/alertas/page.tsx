import { getSwitchSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { getComplianceAlerts } from './actions';
import AlertasClient from './AlertasClient';

export const metadata = { title: 'Alertas Fiscales | SAT | CIFRA' };

export default async function AlertasPage() {
  const session = await getSwitchSession();
  if (!session?.tenantId) redirect('/login');
  const alerts = await getComplianceAlerts();
  return (
    <AlertasClient
      initialAlerts={alerts.map(a => ({
        id: a.id, type: a.type, title: a.title,
        description: a.description ?? '',
        dueDate: a.dueDate.toISOString(),
        daysAhead: a.daysAhead,
        status: a.status, channel: a.channel,
      }))}
      currentYear={new Date().getFullYear()}
    />
  );
}
