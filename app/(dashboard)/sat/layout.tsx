import Link from 'next/link';
import { Download, ShieldCheck, ClipboardList, Bell, FileCheck, Brain } from 'lucide-react';

const SAT_NAV = [
  { href: '/sat/buzon',   label: 'Buzón Tributario',   icon: Download },
  { href: '/sat/69b',     label: 'Validación 69-B',    icon: ShieldCheck },
  { href: '/sat/diot',    label: 'DIOT Automática',    icon: ClipboardList },
  { href: '/sat/alertas', label: 'Alertas Fiscales',   icon: Bell },
  { href: '/sat/repse',   label: 'REPSE',              icon: FileCheck },
  { href: '/sat/nom035',  label: 'NOM-035',            icon: Brain },
];

export default function SatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-black">
      <aside className="w-56 shrink-0 border-r border-neutral-200 dark:border-neutral-800 p-4 flex flex-col gap-1 bg-white dark:bg-neutral-950">
        <p className="text-[10px] font-black text-teal-500 uppercase tracking-widest px-2 mb-3">
          SAT &amp; Compliance
        </p>
        {SAT_NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-teal-50 dark:hover:bg-teal-500/10 hover:text-teal-700 dark:hover:text-teal-400 transition-colors"
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
