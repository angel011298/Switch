'use server';

import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';

export async function getEmployeesWithPortalStatus() {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No session');
  const [employees, leaveRequests] = await Promise.all([
    prisma.employee.findMany({
      where: { tenantId: session.tenantId, active: true },
      include: {
        portalTokens: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.leaveRequest.findMany({
      where: { tenantId: session.tenantId, status: 'PENDING' },
      include: { employee: { select: { name: true, position: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ]);
  return { employees, leaveRequests };
}

export async function generatePortalToken(employeeId: string) {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No session');

  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1); // Valid for 1 year

  // Revoke existing tokens
  await prisma.employeePortalToken.deleteMany({ where: { employeeId } });

  const token = await prisma.employeePortalToken.create({
    data: { employeeId, token: randomUUID(), expiresAt },
  });
  revalidatePath('/rrhh/portal');
  return token;
}

export async function approveLeaveRequest(id: string, approved: boolean) {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No session');
  await prisma.leaveRequest.update({
    where: { id },
    data: {
      status: approved ? 'APPROVED' : 'REJECTED',
      approvedById: session.userId,
      approvedAt: new Date(),
    },
  });
  revalidatePath('/rrhh/portal');
}
