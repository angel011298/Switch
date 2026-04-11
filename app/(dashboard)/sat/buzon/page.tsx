import { getSwitchSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { getSatCredential, getSatDownloads } from './actions';
import BuzonClient from './BuzonClient';

export const metadata = { title: 'Buzón Tributario SAT | CIFRA' };

export default async function BuzonPage() {
  const session = await getSwitchSession();
  if (!session?.tenantId) redirect('/login');

  const [credential, downloads] = await Promise.all([
    getSatCredential(),
    getSatDownloads(50),
  ]);

  return (
    <BuzonClient
      credential={credential ? { rfc: credential.rfc, cerFileName: credential.cerFileName, isValid: credential.isValid, lastDownloadAt: credential.lastDownloadAt?.toISOString() ?? null } : null}
      downloads={downloads.map(d => ({
        id: d.id, uuid: d.uuid, tipo: d.tipo,
        total: Number(d.total),
        fechaTimbrado: d.fechaTimbrado.toISOString(),
        direction: d.direction, status: d.status,
      }))}
    />
  );
}
