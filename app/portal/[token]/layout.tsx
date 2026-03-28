export const metadata = {
  title: 'Portal del Cliente | CIFRA',
  description: 'Consulta tus facturas y documentos',
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {children}
    </div>
  );
}
