'use client';

import ModulePage from '@/components/dashboard/ModulePage';
import { FileText } from 'lucide-react';

export default function BillingCFDIPage() {
  return (
    <ModulePage
      title="Facturacion Electronica CFDI"
      description="Emite, cancela y administra tus Comprobantes Fiscales Digitales por Internet (CFDI 4.0) conforme a las disposiciones del SAT. Timbrado automatico, complementos de pago y notas de credito."
      icon={FileText}
      iconColor="text-cyan-500"
      iconBg="bg-cyan-50 dark:bg-cyan-500/10"
      breadcrumbs={[
        { label: 'Facturacion CFDI' },
      ]}
    />
  );
}
