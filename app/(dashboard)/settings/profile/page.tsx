import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import ProfileClient from './ProfileClient';

export const metadata = { title: 'Mi Perfil | CIFRA' };

export default async function ProfilePage() {
  const session = await getSwitchSession();
  if (!session) redirect('/login');

  const [user, memberships] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        timezone: true,
        twoFactorEnabled: true,
        phone: true,
      },
    }),
    prisma.tenantMembership.findMany({
      where: { userId: session.userId },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            rfc: true,
            modules: {
              select: { moduleKey: true, isActive: true },
              orderBy: { moduleKey: 'asc' },
            },
          },
        },
      },
      orderBy: { tenant: { name: 'asc' } },
    }),
  ]);

  const initialUser = user ?? {
    id: session.userId,
    email: session.email,
    name: session.name,
    avatarUrl: null,
    timezone: 'America/Mexico_City',
    twoFactorEnabled: false,
    phone: null,
  };

  return (
    <ProfileClient
      initialUser={initialUser}
      memberships={memberships as any}
      activeTenantId={session.tenantId}
    />
  );
}
