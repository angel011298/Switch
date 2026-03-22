'use client';

import ModulePage from '@/components/dashboard/ModulePage';
import { FileText } from 'lucide-react';

export default function BillingHistorialPage() {
  return (
    <ModulePage
      title="Mis CFDI Emitidos"
      description="Consulta, descarga y reexpide tus comprobantes fiscales. Filtra por periodo, receptor, tipo de comprobante y estatus de cancelacion."
      icon={FileText}
      iconColor="text-cyan-500"
      iconBg="bg-cyan-50 dark:bg-cyan-500/10"
      breadcrumbs={[
        { label: 'Facturacion CFDI', href: '/billing' },
        { label: 'Historial de CFDI' },
      ]}
    />
  );
}
