import { getSwitchSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import MasivaClient from './MasivaClient';

export const metadata = { title: 'Facturación Masiva | CIFRA' };

export default async function MasivaPage() {
  const session = await getSwitchSession();
  if (!session?.tenantId) redirect('/login');
  return <MasivaClient />;
}
