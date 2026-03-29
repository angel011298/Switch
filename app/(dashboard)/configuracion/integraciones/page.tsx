import { getWebhooks, getApiKeys } from './actions';
import IntegracionesClient from './IntegracionesClient';

export const dynamic = 'force-dynamic';

export default async function IntegracionesPage() {
  const [webhooks, apiKeys] = await Promise.all([
    getWebhooks(),
    getApiKeys(),
  ]);
  return <IntegracionesClient initialWebhooks={webhooks} initialApiKeys={apiKeys} />;
}
