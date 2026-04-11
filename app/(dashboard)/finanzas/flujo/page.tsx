import { getSwitchSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { getCashFlowProjections } from './actions';
import CashFlowClient from './CashFlowClient';

export const metadata = { title: 'Flujo de Efectivo | CIFRA' };

export default async function FlujoPage() {
  const session = await getSwitchSession();
  if (!session?.tenantId) redirect('/login');

  const data = await getCashFlowProjections(30);

  return (
    <CashFlowClient
      initialData={{
        projections: data.projections.map(p => ({
          id: p.id,
          date: p.date.toISOString(),
          type: p.type,
          category: p.category,
          description: p.description,
          amount: Number(p.amount),
          isConfirmed: p.isConfirmed,
        })),
        invoices: data.invoices.map(i => ({
          id: i.id,
          total: Number(i.total),
          createdAt: i.createdAt.toISOString(),
          status: i.status,
        })),
      }}
    />
  );
}
