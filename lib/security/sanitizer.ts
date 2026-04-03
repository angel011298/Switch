/**
 * CIFRA Security — Sanitización de Inputs
 * =====================================
 * Proporciona utilidades para limpiar datos de entrada de usuarios,
 * previniendo ataques XSS y almacenamiento de contenido malicioso.
 */

/**
 * Sanitiza un string eliminando etiquetas HTML y caracteres de control.
 */
export function sanitizeString(val: string): string {
  if (typeof val !== 'string') return val;
  
  return val
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '') // Eliminar todo el bloque <script>
    .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, '')   // Eliminar todo el bloque <style>
    .replace(/<[^>]*>?/gm, '')                            // Eliminar etiquetas HTML restantes
    .trim();
}

/**
 * Sanitiza un objeto o array de forma recursiva.
 * Ideal para procesar el 'data' recibido en Server Actions.
 */
export function sanitizeData<T>(data: T): T {
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    return sanitizeString(data) as unknown as T;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item)) as unknown as T;
  }

  if (typeof data === 'object') {
    const sanitizedObj: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        sanitizedObj[key] = sanitizeData((data as any)[key]);
      }
    }
    return sanitizedObj as T;
  }

  return data;
}

/**
 * Helper para validar y sanitizar un RFC
 */
export function sanitizeRFC(rfc: string): string {
  return rfc.toUpperCase().replace(/[^A-Z0-9&Ñ]/g, '').slice(0, 13);
}
