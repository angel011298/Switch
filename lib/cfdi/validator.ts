/**
 * CIFRA — Validador de RFC y Lista 69-B SAT
 * =============================================
 * Valida formato de RFC conforme a la Regla 2.7.3 del SAT y
 * verifica si un RFC aparece en las listas del Art. 69-B CFF.
 *
 * Lista 69-B: contribuyentes con operaciones inexistentes (EFOS/EDOS).
 * Un receptor en esta lista invalida la deducción del CFDI.
 *
 * Ref: CFF Art. 69-B | Resolución Miscelánea Fiscal 2024 Regla 1.4.
 */

import prisma from '@/lib/prisma';

// ─── Constantes ───────────────────────────────────────────────────────────────

/**
 * RFC de persona moral: 3 letras + 6 dígitos fecha + 3 homoclave = 12 chars
 * RFC de persona física: 4 letras + 6 dígitos fecha + 3 homoclave = 13 chars
 * Generics permitidos: XAXX010101000 (extranjero), XEXX010101000 (extranjero en el ext.)
 */
const RFC_MORAL_REGEX   = /^[A-ZÑ&]{3}[0-9]{6}[A-Z0-9]{3}$/;
const RFC_FISICA_REGEX  = /^[A-ZÑ&]{4}[0-9]{6}[A-Z0-9]{3}$/;
const RFC_GENERICO_VALS = new Set(['XAXX010101000', 'XEXX010101000']);

/** TTL del caché 69-B en horas */
const CACHE_TTL_HOURS = 24;

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type RfcType = 'FISICA' | 'MORAL' | 'GENERICO';

export interface RfcValidationResult {
  valid: boolean;
  rfc: string;           // normalizado (mayúsculas, sin espacios)
  type?: RfcType;
  error?: string;
}

export type Rfc69bStatus = 'CLEAN' | 'PRESUNTO' | 'DEFINITIVO' | 'DESVIRTUADO' | 'SENTENCIA';

export interface Rfc69bResult {
  rfc: string;
  status: Rfc69bStatus;
  message: string;
  /** true si el RFC aparece en alguna lista negativa */
  flagged: boolean;
  /** ISO string de cuándo se hizo la consulta */
  checkedAt: string;
  /** Si vino de caché (no consultó SAT esta vez) */
  fromCache: boolean;
}

// ─── Validación de formato ────────────────────────────────────────────────────

/**
 * Valida el formato de un RFC conforme al Anexo 20 y la Resolución Miscelánea.
 *
 * @example
 *   validateRfcFormat('XAXX010101000') → { valid: true, type: 'GENERICO', rfc: 'XAXX010101000' }
 *   validateRfcFormat('abc-123')       → { valid: false, error: 'Formato inválido' }
 */
export function validateRfcFormat(rfc: string): RfcValidationResult {
  if (!rfc || typeof rfc !== 'string') {
    return { valid: false, rfc: '', error: 'RFC vacío o nulo' };
  }

  const normalized = rfc.trim().toUpperCase().replace(/[\s-]/g, '');

  if (RFC_GENERICO_VALS.has(normalized)) {
    return { valid: true, rfc: normalized, type: 'GENERICO' };
  }

  if (RFC_MORAL_REGEX.test(normalized)) {
    return { valid: true, rfc: normalized, type: 'MORAL' };
  }

  if (RFC_FISICA_REGEX.test(normalized)) {
    return { valid: true, rfc: normalized, type: 'FISICA' };
  }

  // Error descriptivo según la longitud
  if (normalized.length < 12) {
    return { valid: false, rfc: normalized, error: `RFC muy corto (${normalized.length} caracteres, mínimo 12)` };
  }
  if (normalized.length > 13) {
    return { valid: false, rfc: normalized, error: `RFC muy largo (${normalized.length} caracteres, máximo 13)` };
  }

  return { valid: false, rfc: normalized, error: 'Formato inválido (verifica letras, dígitos y homoclave)' };
}

/**
 * Valida múltiples RFCs a la vez.
 * Útil para validar un CSV antes de procesarlo.
 */
export function validateRfcBatch(rfcs: string[]): RfcValidationResult[] {
  return rfcs.map(validateRfcFormat);
}

// ─── Validación 69-B ─────────────────────────────────────────────────────────

/**
 * Verifica si un RFC aparece en las listas del Artículo 69-B CFF.
 *
 * Flujo:
 * 1. Normaliza y valida formato
 * 2. Busca en caché DB (TTL 24h)
 * 3. Si no hay caché fresco → consulta SAT (stub; integración real pendiente)
 * 4. Guarda resultado en caché y retorna
 *
 * Statuses del SAT:
 * - CLEAN:        No aparece en ninguna lista
 * - PRESUNTO:     En lista de presuntos (Art. 69-B primer párrafo)
 * - DEFINITIVO:   En lista definitiva (deducción INVÁLIDA)
 * - DESVIRTUADO:  Fue presunto pero desvirtúo ante SAT
 * - SENTENCIA:    Sentencia favorable (ya no en lista negativa)
 */
export async function check69B(rfc: string): Promise<Rfc69bResult> {
  const fmt = validateRfcFormat(rfc);
  if (!fmt.valid) {
    return {
      rfc: fmt.rfc,
      status: 'CLEAN',
      message: `No se pudo validar: ${fmt.error}`,
      flagged: false,
      checkedAt: new Date().toISOString(),
      fromCache: false,
    };
  }

  const normalized = fmt.rfc;

  // ── 1. Buscar en caché ──────────────────────────────────────────────────
  const cached = await prisma.rfc69bValidation.findUnique({ where: { rfc: normalized } });
  if (cached && cached.expiresAt > new Date()) {
    const status = cached.status as Rfc69bStatus;
    return {
      rfc: normalized,
      status,
      message: cached.satMessage ?? `RFC ${normalized} verificado sin incidencias.`,
      flagged: isFlaggedStatus(status),
      checkedAt: cached.checkedAt.toISOString(),
      fromCache: true,
    };
  }

  // ── 2. Consultar SAT (stub: integración real pendiente) ─────────────────
  // TODO: Reemplazar con integración real al SAT:
  //   - API SAT: https://siat.sat.gob.mx/app/qde/consultaRFC.jsf (SOAP)
  //   - Alternativa: descargar lista completa en CSV del SAT y consultar localmente
  //   - Requiere convenio PAC o acceso directo a servicios del SAT
  const satStatus: Rfc69bStatus = 'CLEAN';
  const satMessage = [
    `RFC ${normalized} — No localizado en listas definitivas ni presuntos del Art. 69-B CFF.`,
    `(Consulta simulada — integración real con SAT en configuración)`,
  ].join(' ');

  // ── 3. Persistir en caché ───────────────────────────────────────────────
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + CACHE_TTL_HOURS);

  await prisma.rfc69bValidation.upsert({
    where: { rfc: normalized },
    create: { rfc: normalized, status: satStatus, satMessage, checkedAt: new Date(), expiresAt },
    update: { status: satStatus, satMessage, checkedAt: new Date(), expiresAt },
  });

  return {
    rfc: normalized,
    status: satStatus,
    message: satMessage,
    flagged: isFlaggedStatus(satStatus),
    checkedAt: new Date().toISOString(),
    fromCache: false,
  };
}

/**
 * Valida formato Y 69-B en un solo paso.
 * Devuelve el resultado combinado para el wizard de nueva factura.
 */
export async function validateReceptorRfc(rfc: string): Promise<{
  format: RfcValidationResult;
  list69b: Rfc69bResult | null;
  ok: boolean;
  warning: string | null;
}> {
  const format = validateRfcFormat(rfc);

  if (!format.valid) {
    return { format, list69b: null, ok: false, warning: format.error ?? 'RFC inválido' };
  }

  // RFC genérico no se valida contra 69-B
  if (format.type === 'GENERICO') {
    return {
      format,
      list69b: null,
      ok: true,
      warning: 'RFC genérico: el CFDI no permitirá deducción de impuestos al receptor.',
    };
  }

  const list69b = await check69B(format.rfc);

  if (list69b.flagged) {
    return {
      format,
      list69b,
      ok: false,
      warning: `RFC en lista 69-B (${list69b.status}): ${list69b.message}`,
    };
  }

  return { format, list69b, ok: true, warning: null };
}

// ─── Helper interno ───────────────────────────────────────────────────────────

function isFlaggedStatus(status: Rfc69bStatus): boolean {
  return status === 'PRESUNTO' || status === 'DEFINITIVO';
}
