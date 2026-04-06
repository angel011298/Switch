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

  // Fetch full user data from Prisma
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      timezone: true,
      twoFactorEnabled: true,
    },
  });

  if (!user) {
    redirect('/login');
  }

  // Fetch user memberships
  const memberships = await prisma.tenantMembership.findMany({
    where: { userId: session.userId },
    include: {
      tenant: {
        select: { id: true, name: true, rfc: true },
      },
    },
    orderBy: { tenant: { name: 'asc' } },
  });

  // Use canonical email from Supabase Auth (session.email), not Prisma DB.
  // The Prisma email can be stale; Supabase Auth is the source of truth.
  const userWithCanonicalEmail = { ...user, email: session.email };

  return (
    <ProfileClient initialUser={userWithCanonicalEmail} memberships={memberships as any} />
  );
}
