'use client';

import ModulePage from '@/components/dashboard/ModulePage';
import { ShoppingCart } from 'lucide-react';

export default function POSPage() {
  return (
    <ModulePage
      title="Terminal Punto de Venta"
      description="Cobra, factura y controla tu inventario en tiempo real desde una interfaz tactil optimizada. Compatible con lectores de codigos de barras, impresoras termicas y cajones de dinero."
      icon={ShoppingCart}
      iconColor="text-pink-500"
      iconBg="bg-pink-50 dark:bg-pink-500/10"
      breadcrumbs={[
        { label: 'Punto de Venta' },
      ]}
    />
  );
}
