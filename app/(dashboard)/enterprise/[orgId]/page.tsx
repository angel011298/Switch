import { getOrgTenants, getConsolidatedKpis } from '../actions';
import OrgDetailClient from './OrgDetailClient';

export const dynamic = 'force-dynamic';

export default async function OrgDetailPage({ params }: { params: { orgId: string } }) {
  const [tenants, kpis] = await Promise.all([
    getOrgTenants(params.orgId),
    getConsolidatedKpis(params.orgId),
  ]);
  return <OrgDetailClient orgId={params.orgId} initialTenants={tenants} kpis={kpis} />;
}
