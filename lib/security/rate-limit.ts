/**
 * CIFRA Security — Rate Limiting
 * ==============================
 * Implementación de limitación de tasa para proteger APIs.
 * Utiliza un mapa en memoria con TTL para rastrear peticiones por identificador (IP o UserID).
 */

type RateLimitRecord = {
  count: number;
  resetAt: number;
};

const cache = new Map<string, RateLimitRecord>();

// Limpiar cache cada 5 minutos
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    cache.forEach((record, key) => {
      if (now > record.resetAt) {
        cache.delete(key);
      }
    });
  }, 5 * 60 * 1000);
}

export type RateLimitConfig = {
  limit: number;      // Máximo de peticiones
  windowMs: number;   // Ventana de tiempo en milisegundos
};

/**
 * Verifica si una petición debe ser limitada.
 * @returns true si se excedió el límite, false si es permitida.
 */
export function isRateLimited(identifier: string, config: RateLimitConfig): boolean {
  const now = Date.now();
  const record = cache.get(identifier);

  if (!record || now > record.resetAt) {
    cache.set(identifier, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return false;
  }

  record.count++;
  if (record.count > config.limit) {
    return true;
  }

  return false;
}

/**
 * Configuraciones predefinidas
 */
export const RATE_LIMIT_CONFIGS = {
  DEFAULT: { limit: 100, windowMs: 60 * 1000 },     // 100 req/min
  AUTH:    { limit: 10,  windowMs: 60 * 1000 },     // 10 req/min (Login/OTP)
  PUBLIC:  { limit: 30,  windowMs: 60 * 1000 },     // 30 req/min (Landing/Portal)
};
