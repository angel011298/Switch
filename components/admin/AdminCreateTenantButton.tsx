'use client';

import { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import CreateTenantModal from './CreateTenantModal';
import { useRouter } from 'next/navigation';

interface TaxRegime {
  id: string;
  satCode: string;
  name: string;
  personType: 'FISICA' | 'MORAL';
}

interface Props {
  taxRegimes: TaxRegime[];
}

export default function AdminCreateTenantButton({ taxRegimes }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleCreated = () => {
    setOpen(false);
    router.refresh();
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white text-sm font-black rounded-xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/30"
      >
        <PlusCircle className="h-4 w-4" />
        Nuevo Tenant
      </button>

      {open && (
        <CreateTenantModal
          taxRegimes={taxRegimes}
          onClose={() => setOpen(false)}
          onCreated={handleCreated}
        />
      )}
    </>
  );
}
