import { getSwitchSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { getBankConnections, getBankTransactions } from './actions';
import BancaClient from './BancaClient';

export const metadata = { title: 'Conciliación Bancaria | CIFRA' };

export default async function BancaPage() {
  const session = await getSwitchSession();
  if (!session?.tenantId) redirect('/login');

  const [connections, transactions] = await Promise.all([
    getBankConnections(),
    getBankTransactions(30),
  ]);

  return (
    <BancaClient
      connections={connections.map(c => ({
        id: c.id,
        bank: c.bank,
        alias: c.alias,
        isActive: c.isActive,
        lastSyncAt: c.lastSyncAt?.toISOString() ?? null,
        syncStatus: c.syncStatus,
      }))}
      transactions={transactions.map(t => ({
        id: t.id,
        date: t.date.toISOString(),
        description: t.description,
        amount: Number(t.amount),
        type: t.type,
        status: t.status,
        counterpartName: t.counterpartName,
      }))}
    />
  );
}
