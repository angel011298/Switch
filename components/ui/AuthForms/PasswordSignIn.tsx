'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function PasswordSignIn() {
  // Estados para capturar exactamente lo que escribes
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Inicializamos el cliente de Supabase para el navegador
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Mandamos las credenciales directamente a Supabase
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError('Correo o contraseña incorrectos.');
      setLoading(false);
    } else {
      // Si el login es exitoso, forzamos a Next.js a recargar y mandarnos al Dashboard
      router.push('/');
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-4 w-full mt-4">
      {/* Mensaje de Error */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 rounded-xl text-sm font-semibold text-center">
          {error}
        </div>
      )}

      {/* Campo de Correo */}
      <div>
        <label className="block text-sm font-semibold text-zinc-700 dark:text-gray-300 mb-1" htmlFor="email">
          Correo Electrónico
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@tuempresa.com"
          className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-neutral-900 text-zinc-900 dark:text-white border border-zinc-200 dark:border-neutral-800 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
          required
        />
      </div>

      {/* Campo de Contraseña */}
      <div>
        <label className="block text-sm font-semibold text-zinc-700 dark:text-gray-300 mb-1" htmlFor="password">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-neutral-900 text-zinc-900 dark:text-white border border-zinc-200 dark:border-neutral-800 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
          required
        />
      </div>

      {/* Botón de Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 flex justify-center items-center"
      >
        {loading ? (
          <span className="animate-pulse">Validando credenciales...</span>
        ) : (
          'Entrar al Panel'
        )}
      </button>
    </form>
  );
}