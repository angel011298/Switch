import { getMyOrganizations } from './actions';
import EnterpriseClient from './EnterpriseClient';

export const dynamic = 'force-dynamic';

export default async function EnterprisePage() {
  const organizations = await getMyOrganizations();
  return <EnterpriseClient initialOrganizations={organizations} />;
}
