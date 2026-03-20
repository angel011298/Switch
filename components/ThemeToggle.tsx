'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Evitamos errores de hidratación esperando a que el componente cargue en el cliente
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-gray-400 hover:text-emerald-500 hover:bg-neutral-100 dark:hover:bg-neutral-900 w-full"
    >
      {theme === 'dark' ? (
        <>
          <Sun className="h-5 w-5" />
          <span className="text-sm font-medium">Modo Día</span>
        </>
      ) : (
        <>
          <Moon className="h-5 w-5" />
          <span className="text-sm font-medium">Modo Noche</span>
        </>
      )}
    </button>
  );
}