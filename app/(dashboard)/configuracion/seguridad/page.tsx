import { get2FAStatus } from './actions';
import SecurityClient from './SecurityClient';

export const metadata = { title: 'Seguridad — CIFRA' };

export default async function SecurityPage() {
  const status = await get2FAStatus();
  return <SecurityClient initialEnabled={status.enabled} email={status.email} />;
}
