import { getShipments } from './actions';
import { getPurchaseOrders } from '../compras/actions';
import LogisticaClient from './LogisticaClient';

export const dynamic = 'force-dynamic';

export default async function LogisticaPage() {
  const [shipments, orders] = await Promise.all([
    getShipments(),
    getPurchaseOrders(),
  ]);

  return <LogisticaClient initialShipments={shipments} purchaseOrders={orders} />;
}
