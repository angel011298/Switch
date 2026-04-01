import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { getMisCfdi, getCfdiKpis } from './actions';
import MisCfdiClient from './MisCfdiClient';

export const metadata = { title: 'Mis CFDI — CIFRA' };
export const dynamic = 'force-dynamic';

export default async function MisCfdiPage() {
  const [cfdi, kpis] = await Promise.all([getMisCfdi(), getCfdiKpis()]);

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      }
    >
      <MisCfdiClient cfdi={cfdi} kpis={kpis} />
    </Suspense>
  );
}
