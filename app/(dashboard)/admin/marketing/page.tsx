import { getSwitchSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import {
  getMarketingIntegrations,
  getAdCreatives,
  getAdAnalytics,
} from './actions';
import MarketingAdminClient from './MarketingAdminClient';

export const metadata = {
  title: 'Marketing Automation | Super Admin | CIFRA',
};

export default async function AdminMarketingPage() {
  const session = await getSwitchSession();
  if (!session?.isSuperAdmin) redirect('/dashboard');

  const [integrations, creatives, analytics] = await Promise.all([
    getMarketingIntegrations(),
    getAdCreatives(),
    getAdAnalytics(30),
  ]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <MarketingAdminClient
        integrations={integrations.map(i => ({
          id:        i.id,
          platform:  i.platform,
          accountId: i.accountId,
          isActive:  i.isActive,
          updatedAt: i.updatedAt.toISOString(),
        }))}
        creatives={creatives.map(c => ({
          id:          c.id,
          platform:    c.platform,
          angle:       c.angle,
          headline:    c.headline,
          description: c.description,
          status:      c.status,
          createdAt:   c.createdAt.toISOString(),
        }))}
        analytics={{
          totalSpend:       analytics.totalSpend,
          totalConversions: analytics.totalConversions,
          totalClicks:      analytics.totalClicks,
          cpl:              analytics.cpl,
          byDate:           analytics.byDate,
        }}
      />
    </div>
  );
}
