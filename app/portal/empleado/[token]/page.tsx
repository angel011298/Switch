import { notFound } from 'next/navigation';
import { verifyEmployeeToken } from '@/lib/portal/employee-token';
import prisma from '@/lib/prisma';
import EmployeePortalClient from './EmployeePortalClient';

interface Props {
  params: Promise<{ token: string }>;
}

export const metadata = { title: 'Portal del Empleado | CIFRA' };

export default async function EmployeePortalPage({ params }: Props) {
  const { token } = await params;
  const payload = verifyEmployeeToken(token);
  if (!payload) notFound();

  const [employee, tenant] = await Promise.all([
    prisma.employee.findFirst({
      where: { id: payload.employeeId, tenantId: payload.tenantId },
      select: {
        id: true, name: true, position: true, department: true,
        hireDate: true, salary: true, salaryType: true,
        email: true, employeeNumber: true,
        payrollItems: {
          where: { payrollRun: { status: 'PAID' } },
          orderBy: { createdAt: 'desc' },
          take: 12,
          select: {
            id: true, bruto: true, neto: true, isr: true, imss: true,
            absenceDays: true, absenceDeduct: true,
            cfdiUuid: true, cfdiStatus: true,
            payrollRun: { select: { periodLabel: true, payDate: true, periodEnd: true } },
          },
        },
        leaveRequests: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true, type: true, startDate: true, endDate: true,
            days: true, reason: true, status: true, createdAt: true,
            rejectedReason: true,
          },
        },
        attendances: {
          orderBy: { date: 'desc' },
          take: 30,
          select: { id: true, date: true, checkIn: true, checkOut: true, status: true },
        },
      },
    }),
    prisma.tenant.findUnique({
      where: { id: payload.tenantId },
      select: { name: true, logoUrl: true },
    }),
  ]);

  if (!employee || !tenant) notFound();

  return (
    <EmployeePortalClient
      employee={employee as any}
      tenant={tenant}
      token={token}
    />
  );
}
