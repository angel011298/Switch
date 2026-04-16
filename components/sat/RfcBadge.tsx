'use client';

/**
 * CIFRA — Badge de validación 69-B SAT
 * ==========================================
 * Muestra el estado fiscal de un RFC con indicador visual.
 * Se usa en formularios de proveedores, clientes, y revisión de CFDI.
 */

import { useState } from 'react';
import { ShieldCheck, ShieldAlert, ShieldX, Shield, Loader2 } from 'lucide-react';
import type { RfcValidationResult, RfcStatus } from '@/lib/sat/validation';

interface RfcBadgeProps {
  rfc: string;
  initialResult?: RfcValidationResult | null;
  className?: string;
}

const STATUS_ICONS: Record<RfcStatus, typeof ShieldCheck> = {
  CLEAN:       ShieldCheck,
  FAVORABLE:   ShieldCheck,
  PRESUMPTIVE: ShieldAlert,
  DEFINITIVE:  ShieldX,
  SENTENCED:   ShieldX,
  ERROR:       Shield,
};

export default function RfcBadge({ rfc, initialResult = null, className = '' }: RfcBadgeProps) {
  const [result, setResult] = useState<RfcValidationResult | null>(initialResult);
  const [loading, setLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  async function handleValidate() {
    if (loading || !rfc || rfc.length < 12) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/sat/validate-rfc?rfc=${encodeURIComponent(rfc)}`);
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }

  if (!result && !loading) {
    return (
      <button
        type="button"
        onClick={handleValidate}
        className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border border-slate-600 text-slate-400 hover:border-blue-500 hover:text-blue-400 transition-colors ${className}`}
      >
        <Shield className="w-3 h-3" />
        Validar 69-B
      </button>
    );
  }

  if (loading) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border border-slate-600 text-slate-400 ${className}`}>
        <Loader2 className="w-3 h-3 animate-spin" />
        Consultando SAT...
      </span>
    );
  }

  if (!result) return null;
  const Icon = STATUS_ICONS[result.status];

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={handleValidate}
        className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium transition-opacity hover:opacity-80 ${result.color}`}
      >
        <Icon className="w-3 h-3" />
        {result.label}
      </button>

      {showTooltip && (
        <div className="absolute bottom-full left-0 mb-2 z-50 w-64 p-3 rounded-lg bg-neutral-900 border border-neutral-700 shadow-xl text-xs text-slate-300">
          <p className="font-semibold mb-1">{result.label}</p>
          <p className="text-slate-400">{result.description}</p>
          <p className="text-slate-500 mt-2">
            Consultado: {result.lastChecked.toLocaleDateString('es-MX')}
          </p>
          {!result.canDeduct && (
            <p className="mt-1 text-rose-400 font-medium">⚠ No deducible fiscalmente</p>
          )}
        </div>
      )}
    </div>
  );
}
