import { getSwitchSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { getCartaPortes } from './actions';
import CartaPorteClient from './CartaPorteClient';

export const metadata = { title: 'Carta Porte 3.0 | CIFRA' };

export default async function CartaPortePage() {
  const session = await getSwitchSession();
  if (!session?.tenantId) redirect('/login');
  const cartas = await getCartaPortes();
  return (
    <CartaPorteClient
      initialCartas={cartas.map(c => ({
        id: c.id,
        origenCp: c.origenCp,
        destinoCp: c.destinoCp,
        viaTransporte: c.viaTransporte,
        numPlacas: c.numPlacas,
        fechaSalidaLlegada: c.fechaSalidaLlegada.toISOString(),
        status: c.status,
        cfdiUuid: c.cfdiUuid,
        createdAt: c.createdAt.toISOString(),
      }))}
    />
  );
}
