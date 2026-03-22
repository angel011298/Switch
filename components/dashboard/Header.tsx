'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { LogOut, Bell, Search } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  userName: string;
  userEmail: string;
  isSuperAdmin: boolean;
}

export default function Header({ userName, userEmail, isSuperAdmin }: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  // Iniciales del usuario para el avatar
  const initials = userName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="h-16 border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Barra de busqueda global */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar en Switch OS..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all placeholder:text-neutral-400"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-neutral-400 bg-neutral-200 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
            /
          </kbd>
        </div>
      </div>

      {/* Acciones del usuario */}
      <div className="flex items-center gap-4">
        {/* Notificaciones */}
        <button className="relative p-2 rounded-xl text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-emerald-500 rounded-full" />
        </button>

        {/* Perfil */}
        <div className="flex items-center gap-3 pl-4 border-l border-neutral-200 dark:border-neutral-800">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-neutral-900 dark:text-white leading-none">
              {userName}
            </p>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              {isSuperAdmin ? 'Super Admin' : userEmail}
            </p>
          </div>

          {/* Avatar con iniciales */}
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-xs font-black shadow-md">
            {initials}
          </div>

          {/* Cerrar sesion */}
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            title="Cerrar Sesion"
            className="p-2 rounded-xl text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
