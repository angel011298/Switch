'use client';

/**
 * CIFRA — Página offline
 * =======================
 * FASE 52: Mobile First + PWA
 * Mostrada por el Service Worker cuando no hay conexión
 * y la página solicitada no está en caché.
 */
export default function OfflinePage() {
  const features = [
    { label: 'Dashboard en caché',        ok: true  },
    { label: 'Historial POS reciente',    ok: true  },
    { label: 'Timbrado CFDI (SAT)',       ok: false },
    { label: 'Sincronización en tiempo real', ok: false },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 p-6 text-center">

      {/* Logo */}
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mb-6 shadow-2xl shadow-blue-500/30">
        <span className="text-4xl font-black text-white select-none">Δ</span>
      </div>

      <h1 className="text-2xl font-black text-white mb-2 tracking-tight">Sin conexión</h1>
      <p className="text-neutral-400 max-w-xs mb-6 text-sm leading-relaxed">
        CIFRA ERP no puede conectarse ahora. Revisa tu conexión e intenta de nuevo.
      </p>

      {/* Feature availability */}
      <div className="w-full max-w-xs bg-neutral-900 border border-neutral-800 rounded-2xl p-4 mb-6 text-left">
        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-3">Estado del modo offline</p>
        {features.map(({ label, ok }) => (
          <div key={label} className="flex items-center gap-3 py-2 border-b border-neutral-800 last:border-0">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${ok ? 'bg-emerald-500' : 'bg-neutral-600'}`} />
            <span className={`text-sm ${ok ? 'text-neutral-200' : 'text-neutral-500'}`}>{label}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => window.location.reload()}
        className="w-full max-w-xs bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold py-3 rounded-2xl transition-colors text-sm"
      >
        Reintentar conexión
      </button>

      <p className="mt-5 text-xs text-neutral-600">CIFRA ERP — Modo sin conexión</p>
    </div>
  );
}
