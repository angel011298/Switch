import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Switch OS — Vitest Configuration
 * ===================================
 * Tests unitarios para lógica de negocio crítica:
 * - Aritmética CFDI (Anexo 20)
 * - Validador RFC (CFF Art. 27)
 * - Motor contable (partida doble)
 * - Calculadora de nómina
 */
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // Cobertura mínima para módulos críticos
    coverage: {
      provider: 'v8',
      include: [
        'lib/cfdi/arithmetic.ts',
        'lib/crm/rfc-validator.ts',
        'lib/accounting/journal-engine.ts',
        'lib/payroll/calculator.ts',
        'lib/pos/calculator.ts',
      ],
      thresholds: {
        lines:      70,
        functions:  70,
        branches:   60,
        statements: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
