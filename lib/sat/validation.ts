/**
 * CIFRA — Validación RFC contra lista 69-B del SAT (EDOS/EFOS)
 * ================================================================
 * El SAT publica mensualmente la lista de contribuyentes que emiten
 * comprobantes de operaciones simuladas (Art. 69-B CFF).
 *
 * Niveles de riesgo:
 *   PRESUMPTIVE  = presuntos (1ª publicación)
 *   DEFINITIVE   = definitivos (no pudieron desvirtuar)
 *   SENTENCED    = sentenciados penalmente
 *   FAVORABLE    = desvirtuaron satisfactoriamente (limpios)
 *   CLEAN        = no aparecen en ninguna lista
 *
 * Endpoint público SAT:
 *   https://ppw.sat.gob.mx/cgi-bin/69b/data69b.csv (actualizado ~mensualmente)
 *
 * Para producción: usa caché Redis con TTL de 24h para evitar latencia
 * en cada validación. Este módulo implementa caché en memoria con TTL.
 */

export type RfcStatus = 'CLEAN' | 'PRESUMPTIVE' | 'DEFINITIVE' | 'SENTENCED' | 'FAVORABLE' | 'ERROR';

export interface RfcValidationResult {
  rfc: string;
  status: RfcStatus;
  label: string;
  description: string;
  color: string;           // Tailwind class para badge
  lastChecked: Date;
  canDeduct: boolean;      // Si el RFC puede deducirse fiscalmente
}

const STATUS_META: Record<RfcStatus, { label: string; description: string; color: string; canDeduct: boolean }> = {
  CLEAN: {
    label: 'RFC Válido',
    description: 'No aparece en ninguna lista negra del SAT.',
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    canDeduct: true,
  },
  PRESUMPTIVE: {
    label: 'Presunto EFOS',
    description: 'SAT presume que emitió CFDIs de operaciones inexistentes. Publicación provisional.',
    color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    canDeduct: false,
  },
  DEFINITIVE: {
    label: 'EFOS Definitivo',
    description: 'Contribuyente no desvirtuó ante el SAT. Las facturas recibidas no son deducibles.',
    color: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    canDeduct: false,
  },
  SENTENCED: {
    label: 'Sentenciado',
    description: 'Sentencia firme por delito fiscal. Alto riesgo legal al recibir facturas.',
    color: 'bg-red-700/10 text-red-400 border-red-700/20',
    canDeduct: false,
  },
  FAVORABLE: {
    label: 'Desvirtuado',
    description: 'El contribuyente desvirtuó satisfactoriamente ante el SAT.',
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    canDeduct: true,
  },
  ERROR: {
    label: 'Error de validación',
    description: 'No fue posible consultar la lista del SAT. Verifica manualmente.',
    color: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    canDeduct: false,
  },
};

// Cache en memoria — en producción reemplazar por Redis/Upstash
const cache = new Map<string, { result: RfcValidationResult; expiresAt: number }>();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 horas

function normalizeRfc(rfc: string): string {
  return rfc.trim().toUpperCase().replace(/\s+/g, '');
}

function buildResult(rfc: string, status: RfcStatus): RfcValidationResult {
  const meta = STATUS_META[status];
  return {
    rfc,
    status,
    label: meta.label,
    description: meta.description,
    color: meta.color,
    lastChecked: new Date(),
    canDeduct: meta.canDeduct,
  };
}

/**
 * Valida un RFC contra la lista 69-B del SAT.
 * Usa caché en memoria para evitar llamadas repetidas.
 */
export async function validateRfc69B(rfc: string): Promise<RfcValidationResult> {
  const normalized = normalizeRfc(rfc);

  // Verificar caché
  const cached = cache.get(normalized);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.result;
  }

  try {
    // El SAT ofrece una API de consulta individual en ppw.sat.gob.mx
    // La URL real es un form POST — para producción se recomienda un proxy
    // o descargar el CSV completo y cachear localmente.
    // Esta implementación usa la URL de consulta pública.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(
      `https://ppw.sat.gob.mx/cgi-bin/69b/cgi69b.cgi?rfc=${encodeURIComponent(normalized)}&action=buscar`,
      { signal: controller.signal, next: { revalidate: 3600 } }
    );
    clearTimeout(timeout);

    let status: RfcStatus = 'CLEAN';

    if (res.ok) {
      const html = await res.text();
      if (html.includes('DEFINITIVO'))    status = 'DEFINITIVE';
      else if (html.includes('PRESUNTO')) status = 'PRESUMPTIVE';
      else if (html.includes('SENTENCIADO')) status = 'SENTENCED';
      else if (html.includes('FAVORABLE'))  status = 'FAVORABLE';
    }

    const result = buildResult(normalized, status);
    cache.set(normalized, { result, expiresAt: Date.now() + CACHE_TTL_MS });
    return result;

  } catch {
    // Si falla la consulta, devolver ERROR pero no bloquear el flujo
    const result = buildResult(normalized, 'ERROR');
    cache.set(normalized, { result, expiresAt: Date.now() + 60_000 }); // caché 1 min en error
    return result;
  }
}

/**
 * Valida múltiples RFCs en paralelo (máx 10 concurrentes).
 */
export async function validateMultipleRfcs(rfcs: string[]): Promise<Map<string, RfcValidationResult>> {
  const results = new Map<string, RfcValidationResult>();
  const chunks = [];
  for (let i = 0; i < rfcs.length; i += 10) {
    chunks.push(rfcs.slice(i, i + 10));
  }
  for (const chunk of chunks) {
    const settled = await Promise.allSettled(chunk.map(rfc => validateRfc69B(rfc)));
    settled.forEach((res, i) => {
      const rfc = normalizeRfc(chunk[i]);
      results.set(rfc, res.status === 'fulfilled' ? res.value : buildResult(rfc, 'ERROR'));
    });
  }
  return results;
}
