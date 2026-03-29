import { getProductionOrders, getBoms } from '../actions';
import PlanificacionClient from './PlanificacionClient';

export const dynamic = 'force-dynamic';

export default async function PlanificacionPage() {
  const [orders, boms] = await Promise.all([
    getProductionOrders(),
    getBoms(),
  ]);
  return <PlanificacionClient initialOrders={orders} boms={boms} />;
}
