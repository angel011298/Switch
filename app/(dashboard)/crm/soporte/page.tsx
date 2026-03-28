import { getTickets } from './actions';
import SoporteClient from './SoporteClient';

export const dynamic = 'force-dynamic';

export default async function SoportePage() {
  const tickets = await getTickets();
  return <SoporteClient initialTickets={tickets} />;
}
