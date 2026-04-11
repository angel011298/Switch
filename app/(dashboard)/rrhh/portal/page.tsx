import { getSwitchSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { getEmployeesWithPortalStatus } from './actions';
import PortalAdminClient from './PortalAdminClient';

export const metadata = { title: 'Portal del Empleado | CIFRA' };

export default async function PortalAdminPage() {
  const session = await getSwitchSession();
  if (!session?.tenantId) redirect('/login');

  const { employees, leaveRequests } = await getEmployeesWithPortalStatus();

  return (
    <PortalAdminClient
      employees={employees.map(e => ({
        id: e.id, name: e.name, position: e.position, department: e.area ?? e.department ?? '',
        hasActiveToken: (e.portalTokens[0]?.expiresAt ?? new Date(0)) > new Date(),
        token: e.portalTokens[0]?.token ?? null,
        tokenExpiresAt: e.portalTokens[0]?.expiresAt?.toISOString() ?? null,
      }))}
      leaveRequests={leaveRequests.map(l => ({
        id: l.id,
        employeeName: l.employee.name,
        employeePosition: l.employee.position,
        type: l.type, days: l.days, reason: l.reason,
        startDate: l.startDate.toISOString(),
        endDate: l.endDate.toISOString(),
        status: l.status,
        createdAt: l.createdAt.toISOString(),
      }))}
    />
  );
}
