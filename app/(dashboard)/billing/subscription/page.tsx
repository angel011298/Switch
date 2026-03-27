import { redirect } from 'next/navigation';
import { getSwitchSession } from '@/lib/auth/session';
import { getCurrentSubscription } from './actions';
import SubscriptionClient from './SubscriptionClient';

export const metadata = { title: 'Suscripción | Switch OS' };

export default async function SubscriptionPage() {
  const session = await getSwitchSession();
  if (!session)          redirect('/login');
  if (!session.tenantId) redirect('/dashboard');

  const sub = await getCurrentSubscription();
  if (!sub) redirect('/dashboard');

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-2">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Suscripción</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Administra tu plan y método de pago
        </p>
      </div>
      <SubscriptionClient sub={sub} />
    </div>
  );
}
