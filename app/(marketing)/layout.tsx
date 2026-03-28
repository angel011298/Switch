import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CIFRA — ERP y CRM Fiscal para México',
  description:
    'Cumple con el SAT. Domina tu empresa. Facturación CFDI 4.0, POS, Nómina ISR/IMSS, CRM, Inventario y más — todo en una plataforma diseñada para México.',
  openGraph: {
    title: 'CIFRA — ERP y CRM Fiscal para México',
    description: 'Cumple con el SAT. Domina tu empresa.',
    url: 'https://cifra.mx',
    siteName: 'CIFRA',
    locale: 'es_MX',
    type: 'website',
    images: [{ url: 'https://cifra.mx/isologo-dark.png', width: 512, height: 512 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CIFRA — ERP y CRM Fiscal para México',
    description: 'Cumple con el SAT. Domina tu empresa.',
  },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
