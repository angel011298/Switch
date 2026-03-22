'use client';

import ModulePage from '@/components/dashboard/ModulePage';
import { ShoppingCart } from 'lucide-react';

export default function POSCortePage() {
  return (
    <ModulePage
      title="Corte de Caja"
      description="Realiza cortes parciales o de cierre, concilia efectivo, tarjetas y transferencias. Genera reportes de arqueo listos para contabilidad."
      icon={ShoppingCart}
      iconColor="text-pink-500"
      iconBg="bg-pink-50 dark:bg-pink-500/10"
      breadcrumbs={[
        { label: 'Punto de Venta', href: '/pos' },
        { label: 'Corte de Caja' },
      ]}
    />
  );
}
