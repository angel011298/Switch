'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie, X, Check } from 'lucide-react';

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cifra-cookie-consent');
    if (!consent) {
      // Pequeño delay para que no aparezca de golpe al cargar
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cifra-cookie-consent', 'accepted');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:max-w-md z-[100] animate-in fade-in slide-in-from-bottom-10 duration-700 ease-out">
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-6 shadow-2xl shadow-blue-500/10">
        
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex gap-4 items-start pr-8">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center flex-shrink-0 animate-pulse">
            <Cookie className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-base font-black text-zinc-900 dark:text-white mb-1">
              Control de Privacidad
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
              Utilizamos cookies esenciales para el funcionamiento del ERP y funcionales para recordar tu idioma. Al continuar, aceptas nuestra{' '}
              <Link href="/cookies" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                Política de Cookies
              </Link>.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={handleAccept}
                className="flex-1 bg-zinc-900 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-500 text-white text-sm font-black py-3 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Aceptar Cookies
              </button>
              <Link
                href="/privacidad"
                className="px-4 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-bold rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center"
              >
                Aviso Legal
              </Link>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
