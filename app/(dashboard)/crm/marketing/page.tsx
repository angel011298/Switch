import { getCampaigns } from './actions';
import MarketingClient from './MarketingClient';

export const dynamic = 'force-dynamic';

export default async function MarketingPage() {
  const campaigns = await getCampaigns();
  return <MarketingClient initialCampaigns={campaigns} />;
}
