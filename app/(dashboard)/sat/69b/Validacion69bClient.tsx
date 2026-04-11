'use client';

import { useState } from 'react';
import { ShieldCheck, ShieldAlert, Search, Loader2, CheckCircle2, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { validate69B } from './actions';

type CacheEntry = { id: string; rfc: string; razonSocial: string | null; status: string; satMessage: string | null; checkedAt: string; expiresAt: string };

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  CLEAN:        { label: 'Limpio',      color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400', icon: CheckCircle2 },
  EDOS:         { label: 'EDOS',        color: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',               icon: XCircle },
  EFOS:         { label: 'EFOS',        color: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',               icon: XCircle },
  DEFINITIVE:   { label: 'Definitivo',  color: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',               icon: XCircle },
  DESVIRTUADO:  { label: 'Desvirtuado', color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',       icon: AlertTriangle },
  ERROR:        { label: 'Error',       color: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',  icon: AlertTriangle },
};

export default function Validacion69bClient({ initialCache }: { initialCache: CacheEntry[] }) {
  const [cache, setCache] = useState(initialCache);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<CacheEntry | null>(null);

  async function handleValidate() {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const result = await validate69B(query);
      const entry: CacheEntry = {
        id: result.id, rfc: result.rfc, razonSocial: result.razonSocial,
        status: result.status, satMessage: result.satMessage,
        checkedAt: result.checkedAt.toISOString(),
        expiresAt: result.expiresAt.toISOString(),
      };
      setLastResult(entry);
      setCache(prev => [entry, ...prev.filter(c => c.rfc !== entry.rfc)]);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al validar');
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8 space-y-6">
      {/* Header */}
      <header className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
        <div className="flex items-center gap-4 mb-5">
          <div className="bg-teal-500/10 p-3 rounded-2xl border border-teal-500/20">
            <ShieldCheck className="h-8 w-8 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">Validación 69-B SAT</h1>
            <p className="text-neutral-500 text-sm mt-1">Verifica proveedores contra listas EDOS/EFOS del artículo 69-B del CFF</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleValidate()}
              placeholder="RFC del proveedor (ej. XAXX010101000)"
              className="w-full pl-10 pr-4 py-3 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-2xl text-sm font-mono uppercase placeholder:normal-case placeholder:font-sans"
              maxLength={13}
            />
          </div>
          <button
            onClick={handleValidate}
            disabled={loading || !query.trim()}
            className="flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-2xl text-sm transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Validar
          </button>
        </div>
      </header>

      {/* Last result highlight */}
      {lastResult && (
        <div className={`p-5 rounded-3xl border ${STATUS_CONFIG[lastResult.status]?.color ?? ''} flex items-start gap-4`}>
          {(() => { const S = STATUS_CONFIG[lastResult.status]; return S ? <S.icon className="h-6 w-6 mt-0.5 shrink-0" /> : <ShieldAlert className="h-6 w-6 mt-0.5 shrink-0" />; })()}
          <div>
            <p className="font-black text-lg">{lastResult.rfc}</p>
            <p className="text-sm mt-1 opacity-80">{lastResult.satMessage}</p>
            <p className="text-xs mt-2 opacity-60 flex items-center gap-1"><Clock className="h-3 w-3" /> Válido hasta: {new Date(lastResult.expiresAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
      )}

      {/* Cache table */}
      {cache.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden">
          <div className="p-4 border-b border-neutral-100 dark:border-neutral-800">
            <p className="font-black text-neutral-900 dark:text-white">Consultas Recientes</p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-800/50">
              <tr>
                {['RFC', 'Razón Social', 'Estado', 'Consultado', 'Vence'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-black text-neutral-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {cache.map(c => {
                const cfg = STATUS_CONFIG[c.status];
                const Icon = cfg?.icon ?? ShieldAlert;
                return (
                  <tr key={c.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                    <td className="px-4 py-3 font-mono text-sm font-bold text-neutral-900 dark:text-white">{c.rfc}</td>
                    <td className="px-4 py-3 text-neutral-500">{c.razonSocial ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${cfg?.color ?? ''}`}>
                        <Icon className="h-3 w-3" />
                        {cfg?.label ?? c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-400 text-xs">{new Date(c.checkedAt).toLocaleDateString('es-MX')}</td>
                    <td className="px-4 py-3 text-neutral-400 text-xs">{new Date(c.expiresAt).toLocaleDateString('es-MX')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
