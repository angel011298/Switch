/**
 * CIFRA — Tests: Validador RFC
 * ==================================
 * Prueba el validador de RFC conforme a CFF Art. 27
 * y las reglas del Anexo 20 CFDI 4.0.
 */

import { describe, it, expect } from 'vitest';
import { validateRfc, normalizeRfc } from '../crm/rfc-validator';

// ─── Casos válidos ────────────────────────────────────────────────────────────

describe('validateRfc — casos válidos', () => {
  it('acepta RFC Persona Moral (12 caracteres)', () => {
    const result = validateRfc('ABC210101AB1');
    expect(result.isValid).toBe(true);
    expect(result.personType).toBe('MORAL');
    expect(result.isGeneric).toBe(false);
  });

  it('acepta RFC Persona Física (13 caracteres)', () => {
    const result = validateRfc('AABC210101AB1');
    expect(result.isValid).toBe(true);
    expect(result.personType).toBe('FISICA');
    expect(result.isGeneric).toBe(false);
  });

  it('acepta RFC Público en general (XAXX010101000)', () => {
    const result = validateRfc('XAXX010101000');
    expect(result.isValid).toBe(true);
    expect(result.isGeneric).toBe(true);
  });

  it('acepta RFC Extranjero (XEXX010101000)', () => {
    const result = validateRfc('XEXX010101000');
    expect(result.isValid).toBe(true);
    expect(result.isGeneric).toBe(true);
  });

  it('normaliza a mayúsculas antes de validar', () => {
    const result = validateRfc('abc210101ab1');
    expect(result.isValid).toBe(true);
    expect(result.personType).toBe('MORAL');
  });

  it('acepta RFC con Ñ (válido en México)', () => {
    const result = validateRfc('ÑAA210101AB1');
    expect(result.isValid).toBe(true);
  });

  it('acepta RFC con &', () => {
    const result = validateRfc('&AA210101AB1');
    expect(result.isValid).toBe(true);
  });
});

// ─── Casos inválidos ──────────────────────────────────────────────────────────

describe('validateRfc — casos inválidos', () => {
  it('rechaza RFC vacío', () => {
    const result = validateRfc('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rechaza RFC nulo / undefined', () => {
    const result = validateRfc(null as any);
    expect(result.isValid).toBe(false);
  });

  it('rechaza RFC muy corto', () => {
    const result = validateRfc('ABC12');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('12');
  });

  it('rechaza RFC muy largo', () => {
    const result = validateRfc('ABCDE210101AB1X');
    expect(result.isValid).toBe(false);
  });

  it('rechaza RFC con dígitos donde deben ir letras', () => {
    const result = validateRfc('123210101AB1');
    expect(result.isValid).toBe(false);
  });

  it('rechaza RFC con letras donde deben ir dígitos', () => {
    // Los dígitos 3-9 (para moral) deben ser números AAMMDD
    const result = validateRfc('ABCABCDEFAB1');
    expect(result.isValid).toBe(false);
  });

  it('rechaza RFC con mes inválido (mes 13)', () => {
    const result = validateRfc('ABC211301AB1'); // mes 13
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('fecha');
  });

  it('rechaza RFC con mes 00', () => {
    const result = validateRfc('ABC210001AB1'); // mes 00
    expect(result.isValid).toBe(false);
  });

  it('rechaza RFC con día inválido (día 00)', () => {
    const result = validateRfc('ABC210100AB1'); // día 00
    expect(result.isValid).toBe(false);
  });

  it('rechaza RFC con día 32', () => {
    const result = validateRfc('ABC210132AB1'); // día 32
    expect(result.isValid).toBe(false);
  });
});

// ─── normalizeRfc ─────────────────────────────────────────────────────────────

describe('normalizeRfc', () => {
  it('convierte a mayúsculas', () => {
    expect(normalizeRfc('abc210101ab1')).toBe('ABC210101AB1');
  });

  it('elimina espacios', () => {
    expect(normalizeRfc(' ABC210101AB1 ')).toBe('ABC210101AB1');
  });

  it('elimina guiones', () => {
    expect(normalizeRfc('ABC-210101-AB1')).toBe('ABC210101AB1');
  });

  it('combina todo', () => {
    expect(normalizeRfc(' abc-21 0101-ab1 ')).toBe('ABC210101AB1');
  });
});

// ─── Casos de borde ───────────────────────────────────────────────────────────

describe('validateRfc — casos de borde fiscales', () => {
  it('RFC de persona moral real (SAT)', () => {
    // SAT tiene RFC: SAT970701NN3
    const result = validateRfc('SAT970701NN3');
    expect(result.isValid).toBe(true);
    expect(result.personType).toBe('MORAL');
  });

  it('RFC moral con dígitos en homoclave', () => {
    const result = validateRfc('ABC210101001');
    expect(result.isValid).toBe(true);
  });

  it('RFC física con dígitos en homoclave', () => {
    const result = validateRfc('AABC210101001');
    expect(result.isValid).toBe(true);
  });
});
