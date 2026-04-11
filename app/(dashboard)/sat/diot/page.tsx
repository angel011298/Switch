import { getSwitchSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { getDiotRecords } from './actions';
import DiotClient from './DiotClient';

export const metadata = { title: 'DIOT Automática | SAT | CIFRA' };

export default async function DiotPage() {
  const session = await getSwitchSession();
  if (!session?.tenantId) redirect('/login');

  const today = new Date();
  const currentPeriod = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const records = await getDiotRecords(currentPeriod);

  return <DiotClient initialRecords={records} currentPeriod={currentPeriod} />;
}
