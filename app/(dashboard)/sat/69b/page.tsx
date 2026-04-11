import { getSwitchSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { get69bCache } from './actions';
import Validacion69bClient from './Validacion69bClient';

export const metadata = { title: 'Validación 69-B | SAT | CIFRA' };

export default async function Validacion69bPage() {
  const session = await getSwitchSession();
  if (!session?.tenantId) redirect('/login');
  const cache = await get69bCache();
  return (
    <Validacion69bClient
      initialCache={cache.map(c => ({
        id: c.id, rfc: c.rfc, razonSocial: c.razonSocial,
        status: c.status, satMessage: c.satMessage,
        checkedAt: c.checkedAt.toISOString(),
        expiresAt: c.expiresAt.toISOString(),
      }))}
    />
  );
}
