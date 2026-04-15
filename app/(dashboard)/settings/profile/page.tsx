import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import ProfileClient from './ProfileClient';

export const metadata = {
  title: 'Mi Perfil | CIFRA',
};

export default async function ProfilePage() {
  const session = await getSwitchSession();

  if (!session) {
    redirect('/login');
  }

  // Fetch full user data from Prisma (may not exist if DB was reset or ensurePrismaUser failed)
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
      },
    }),
    prisma.tenantMembership.findMany({
      where: { userId: session.userId },
      include: {
        tenant: {
          select: { id: true, name: true, rfc: true },
        },
      },
      orderBy: { tenant: { name: 'asc' } },
    }),
  ]);

  // Fallback: construir perfil desde datos de sesión si el registro de Prisma no existe.
  // Ocurre cuando el DB fue reseteado o ensurePrismaUser falló silenciosamente.
  const initialUser = user ?? {
    id: session.userId,
    email: session.email,
    name: session.name,
    avatarUrl: null,
    timezone: 'America/Mexico_City',
    twoFactorEnabled: false,
  };

  return (
    <ProfileClient initialUser={initialUser} memberships={memberships as any} />
  );
}
