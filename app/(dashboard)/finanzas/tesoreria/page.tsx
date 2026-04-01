/**
 * CIFRA — Tesorería
 * ==========================================
 * FASE 52: Posición de efectivo, movimientos bancarios,
 * caja chica con flujo de aprobación, y conciliación bancaria.
 *
 * Server Component → fetches data → passes to Client Component
 */

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { getTreasurySummary, getTreasuryTransactions, getPettyCashFunds } from './actions';
import TesoreriaClient from './TesoreriaClient';

export const metadata = {
  title: 'Tesorería — CIFRA',
};

export default async function TesoreriaPage() {
  const [summary, transactions, pettyCashFunds] = await Promise.all([
    getTreasurySummary(),
    getTreasuryTransactions(),
    getPettyCashFunds(),
  ]);

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      }
    >
      <TesoreriaClient
        summary={summary}
        transactions={transactions}
        pettyCashFunds={pettyCashFunds}
      />
    </Suspense>
  );
}
