import { getQualityInspections, getProductionOrders } from '../actions';
import CalidadClient from './CalidadClient';

export const dynamic = 'force-dynamic';

export default async function CalidadPage() {
  const [inspections, orders] = await Promise.all([
    getQualityInspections(),
    getProductionOrders(),
  ]);
  return <CalidadClient initialInspections={inspections} orders={orders} />;
}
