import { redirect } from 'next/navigation';
import { getSwitchSession } from '@/lib/auth/session';
import { getOrgUsers } from './actions';
import { canManageUsers } from '@/lib/auth/rbac';
import { OrganizacionPageClient } from './OrganizacionPage';

export const metadata = { title: 'Organización | CIFRA' };

export default async function Page() {
  const session = await getSwitchSession();
  if (!session?.tenantId) redirect('/login');

  const users = await getOrgUsers();
  const canEdit = canManageUsers(session.userRole) || session.isSuperAdmin;

  return (
    <OrganizacionPageClient
      users={users}
      currentUserId={session.userId}
      canEdit={canEdit}
    />
  );
}
