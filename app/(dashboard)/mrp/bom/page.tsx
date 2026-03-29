import { getBoms } from '../actions';
import { getProductCatalog } from '@/app/(dashboard)/scm/inventarios/actions';
import BomClient from './BomClient';

export const dynamic = 'force-dynamic';

export default async function BomPage() {
  const [boms, products] = await Promise.all([
    getBoms(),
    getProductCatalog(),
  ]);
  return <BomClient initialBoms={boms} products={products} />;
}
