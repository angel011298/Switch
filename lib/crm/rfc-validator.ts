/**
 * Switch OS — Validador de RFC (Registro Federal de Contribuyentes)
 * ==================================================================
 * Valida el formato del RFC según las reglas oficiales del SAT.
 *
 * Estructura RFC Persona Moral (12 caracteres):
 *   3 letras + 6 dígitos (fecha) + 3 alfanuméricos (homoclave)
 *   Ej: ABC210101AB1
 *
 * Estructura RFC Persona Física (13 caracteres):
 *   4 letras + 6 dígitos (fecha) + 3 alfanuméricos (homoclave)
 *   Ej: AABC210101AB1
 *
 * RFCs genéricos especiales:
 *   XAXX010101000 — Público en general
 *   XEXX010101000 — Extranjeros
 *
 * Ref: CFF Art. 27, Anexo 20 validación de RFC.
 */

// RFC Persona Moral: 3 letras + AAMMDD + 3 alfanuméricos
const RFC_MORAL_REGEX = /^[A-ZÑ&]{3}\d{6}[A-Z0-9]{3}$/;

// RFC Persona Física: 4 letras + AAMMDD + 3 alfanuméricos
const RFC_FISICA_REGEX = /^[A-ZÑ&]{4}\d{6}[A-Z0-9]{3}$/;

// RFC genéricos del SAT
const RFC_PUBLICO_GENERAL = 'XAXX010101000';
const RFC_EXTRANJERO = 'XEXX010101000';

export interface RfcValidationResult {
  isValid: boolean;
  personType: 'FISICA' | 'MORAL' | null;
  isGeneric: boolean;
  error?: string;
}

/**
 * Valida un RFC y determina si es de persona física o moral.
 */
export function validateRfc(rfc: string): RfcValidationResult {
  if (!rfc || typeof rfc !== 'string') {
    return { isValid: false, personType: null, isGeneric: false, error: 'RFC es requerido' };
  }

  // Normalizar: mayúsculas, sin espacios
  const clean = rfc.trim().toUpperCase();

  // Verificar RFCs genéricos
  if (clean === RFC_PUBLICO_GENERAL || clean === RFC_EXTRANJERO) {
    return { isValid: true, personType: 'FISICA', isGeneric: true };
  }

  // Verificar longitud
  if (clean.length !== 12 && clean.length !== 13) {
    return {
      isValid: false,
      personType: null,
      isGeneric: false,
      error: `RFC debe tener 12 (Moral) o 13 (Física) caracteres. Tiene ${clean.length}.`,
    };
  }

  // Persona Moral (12 caracteres)
  if (clean.length === 12) {
    if (!RFC_MORAL_REGEX.test(clean)) {
      return {
        isValid: false,
        personType: null,
        isGeneric: false,
        error: 'Formato de RFC Persona Moral inválido. Debe ser: 3 letras + 6 dígitos + 3 alfanuméricos.',
      };
    }

    if (!isValidDate(clean.substring(3, 9))) {
      return {
        isValid: false,
        personType: null,
        isGeneric: false,
        error: 'La fecha en el RFC no es válida.',
      };
    }

    return { isValid: true, personType: 'MORAL', isGeneric: false };
  }

  // Persona Física (13 caracteres)
  if (!RFC_FISICA_REGEX.test(clean)) {
    return {
      isValid: false,
      personType: null,
      isGeneric: false,
      error: 'Formato de RFC Persona Física inválido. Debe ser: 4 letras + 6 dígitos + 3 alfanuméricos.',
    };
  }

  if (!isValidDate(clean.substring(4, 10))) {
    return {
      isValid: false,
      personType: null,
      isGeneric: false,
      error: 'La fecha en el RFC no es válida.',
    };
  }

  return { isValid: true, personType: 'FISICA', isGeneric: false };
}

/**
 * Valida que los 6 dígitos de fecha del RFC formen una fecha coherente.
 * Formato: AAMMDD
 */
function isValidDate(dateStr: string): boolean {
  const year = parseInt(dateStr.substring(0, 2), 10);
  const month = parseInt(dateStr.substring(2, 4), 10);
  const day = parseInt(dateStr.substring(4, 6), 10);

  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  return true;
}

/**
 * Normaliza un RFC (mayúsculas, sin espacios ni guiones).
 */
export function normalizeRfc(rfc: string): string {
  return rfc.trim().toUpperCase().replace(/[-\s]/g, '');
}
