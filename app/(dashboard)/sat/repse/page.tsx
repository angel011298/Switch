import { getSwitchSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { getRepseData } from './actions';
import RepseClient from './RepseClient';

export const metadata = { title: 'REPSE | SAT | CIFRA' };

export default async function RepsePage() {
  const session = await getSwitchSession();
  if (!session?.tenantId) redirect('/login');
  const { registration, contracts } = await getRepseData();
  return (
    <RepseClient
      registration={registration ? {
        numRepse: registration.numRepse ?? '',
        fechaRegistro: registration.fechaRegistro?.toISOString() ?? '',
        fechaVencimiento: registration.fechaVencimiento?.toISOString() ?? '',
        actividades: registration.actividades ?? '',
        status: registration.status,
      } : null}
      contracts={contracts.map(c => ({
        id: c.id, clienteRfc: c.clienteRfc, clienteNombre: c.clienteNombre,
        fechaInicio: c.fechaInicio.toISOString(),
        fechaFin: c.fechaFin?.toISOString() ?? null,
        numTrabajadores: c.numTrabajadores, status: c.status,
        icsoeCount: c.icsoeReports.length,
      }))}
    />
  );
}
