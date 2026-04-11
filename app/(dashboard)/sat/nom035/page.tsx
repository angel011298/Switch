import { getSwitchSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { getNom035Data } from './actions';
import Nom035Client from './Nom035Client';

export const metadata = { title: 'NOM-035 | SAT | CIFRA' };

export default async function Nom035Page() {
  const session = await getSwitchSession();
  if (!session?.tenantId) redirect('/login');
  const { surveys, totalEmployees } = await getNom035Data();
  return (
    <Nom035Client
      initialSurveys={surveys.map(s => ({
        id: s.id, title: s.title, period: s.period, guia: s.guia,
        status: s.status,
        openAt: s.openAt?.toISOString() ?? null,
        closeAt: s.closeAt?.toISOString() ?? null,
        responsesCount: s._count.responses,
        createdAt: s.createdAt.toISOString(),
      }))}
      totalEmployees={totalEmployees}
    />
  );
}
