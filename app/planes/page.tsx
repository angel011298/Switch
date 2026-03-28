'use client';

import { Check, Zap, Rocket, Loader2, AlertCircle } from 'lucide-react';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const planes = [
  {
    name: 'Básico',
    description: 'Ideal para startups que solo necesitan controlar lo esencial.',
    price: '$499',
    period: '/mes',
    features: [
      'Módulo de Gastos XML',
      'Módulo de Ingresos',
      'Dashboard Financiero',
      'Soporte por email'
    ],
    buttonText: 'Elegir Plan Básico',
    highlight: false,
    priceId: 'price_XXXXXX' // Reemplaza con tu ID real de Stripe
  },
  {
    name: 'Full Suite',
    description: 'Control total de tu operación, incluyendo nómina y cobranza.',
    price: '$999',
    period: '/mes',
    features: [
      'Todo lo del Plan Básico',
      'Módulo de Cobranza',
      'Módulo de Impuestos',
      'Módulo de RRHH',
      'Caja Chica y Citas',
      'Soporte prioritario 24/7'
    ],
    buttonText: 'Obtener Full Suite',
    highlight: true,
    priceId: 'price_YYYYYY' // Reemplaza con tu ID real de Stripe
  }
];

function PlanesContent() {
  const [loading, setLoading] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const handleSubscription = async (priceId: string) => {
    setLoading(priceId);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ priceId }),
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("Error en la sesión de Stripe:", data.error);
      }
    } catch (err) {
      console.error("Error al conectar con el servidor:", err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12">
      <header className="text-center space-y-4">
        {/* Mensaje de error si el Middleware bloqueó el acceso */}
        {error === 'plan_insuficiente' && (
          <div className="flex items-center justify-center gap-3 bg-red-500/10 border border-red-500/50 text-red-600 dark:text-red-400 p-4 rounded-2xl mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <AlertCircle size={20} />
            <p className="font-bold text-sm">
              Tu plan actual no incluye el módulo al que intentaste acceder. ¡Sube de nivel para desbloquearlo!
            </p>
          </div>
        )}

        <h1 className="text-5xl font-black text-neutral-950 dark:text-white tracking-tighter">
          Activa el poder de <span className="text-emerald-500">CIFRA</span>
        </h1>
        <p className="text-lg text-neutral-500 dark:text-neutral-400 font-medium max-w-2xl mx-auto">
          Elige el nivel de control que tu empresa necesita hoy. Puedes escalar en cualquier momento.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {planes.map((plan) => (
          <div 
            key={plan.name}
            className={`relative p-8 rounded-[2.5rem] border transition-all duration-300 ${
              plan.highlight 
                ? 'bg-neutral-950 border-neutral-800 dark:bg-white dark:border-neutral-200 shadow-2xl scale-105' 
                : 'bg-white border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800'
            }`}
          >
            {plan.highlight && (
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-black uppercase px-4 py-1 rounded-full tracking-widest">
                Recomendado
              </span>
            )}

            <div className="mb-8">
              <h3 className={`text-2xl font-black tracking-tight ${plan.highlight ? 'text-white dark:text-black' : 'text-neutral-950 dark:text-white'}`}>
                {plan.name}
              </h3>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-2">{plan.description}</p>
            </div>

            <div className="mb-8 flex items-baseline gap-1">
              <span className={`text-5xl font-black ${plan.highlight ? 'text-white dark:text-black' : 'text-neutral-950 dark:text-white'}`}>
                {plan.price}
              </span>
              <span className="text-neutral-500 font-bold">{plan.period}</span>
            </div>

            <ul className="space-y-4 mb-10">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <div className={`p-1 rounded-full ${plan.highlight ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                    <Check size={14} strokeWidth={4} />
                  </div>
                  <span className={`text-sm font-medium ${plan.highlight ? 'text-neutral-300 dark:text-neutral-700' : 'text-neutral-600 dark:text-neutral-300'}`}>
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscription(plan.priceId)}
              disabled={loading !== null}
              className={`w-full py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 ${
                plan.highlight
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                  : 'bg-neutral-950 dark:bg-white text-white dark:text-black hover:scale-[1.02]'
              }`}
            >
              {loading === plan.priceId ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  {plan.highlight ? <Rocket size={20} /> : <Zap size={20} />}
                  {plan.buttonText}
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-neutral-400 font-bold uppercase tracking-widest">
        Facturación CFDI 4.0 disponible tras el pago
      </p>
    </div>
  );
}

// Next.js requiere Suspense para usar useSearchParams en componentes cliente
export default function PaginaPlanes() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>}>
      <PlanesContent />
    </Suspense>
  );
}