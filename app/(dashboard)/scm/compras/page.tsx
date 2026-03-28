import { getSwitchSession } from '@/lib/auth/session';
import { getPurchaseOrders, getSuppliers } from './actions';
import ComprasClient from './ComprasClient';

export const dynamic = 'force-dynamic';

export default async function SCMComprasPage() {
  const session = await getSwitchSession();
  if (!session?.tenantId) return <div className="p-8 text-neutral-500">No autenticado</div>;

  const [orders, suppliers] = await Promise.all([
    getPurchaseOrders(),
    getSuppliers(),
  ]);

  return <ComprasClient initialOrders={orders} initialSuppliers={suppliers} />;
}
