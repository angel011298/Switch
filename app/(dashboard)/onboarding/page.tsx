'use client';

/**
 * Switch OS — Onboarding Obligatorio
 * ====================================
 * FASE 12: Captura perfil fiscal antes de usar el sistema.
 * Sin RFC y datos fiscales no se puede emitir CFDI 4.0.
 *
 * Flujo: 2 pasos
 *   1. Nombre empresa + RFC + Razón Social + CP
 *   2. Régimen fiscal
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setupTenantProfile } from './actions';
import { AlertCircle, CheckCircle, Building2, FileText, MapPin, Landmark } from 'lucide-react';

const REGIMES_SAT = [
  { value: '601', label: '601 - General de Ley Personas Morales' },
  { value: '603', label: '603 - Personas Morales con Fines no Lucrativos' },
  { value: '605', label: '605 - Sueldos y Salarios e Ingresos Asimilados' },
  { value: '606', label: '606 - Arrendamiento' },
  { value: '608', label: '608 - Demás ingresos' },
  { value: '610', label: '610 - Residentes en el Extranjero' },
  { value: '611', label: '611 - Ingresos por Dividendos' },
  { value: '612', label: '612 - Personas Físicas con Actividades Empresariales' },
  { value: '614', label: '614 - Ingresos por intereses' },
  { value: '616', label: '616 - Sin obligaciones fiscales' },
  { value: '621', label: '621 - Incorporación Fiscal' },
  { value: '622', label: '622 - Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras' },
  { value: '623', label: '623 - Opcional para Grupos de Sociedades' },
  { value: '624', label: '624 - Coordinados' },
  { value: '625', label: '625 - Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas' },
  { value: '626', label: '626 - Régimen Simplificado de Confianza (RESICO)' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    legalName: '',
    rfc: '',
    zipCode: '',
    taxRegimeKey: '',
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'rfc' ? value.toUpperCase().replace(/[^A-Z0-9]/g, '') : value,
    }));
    setError('');
  }

  function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Validaciones step 1
    if (!formData.name.trim()) {
      setError('Nombre de empresa requerido');
      return;
    }
    if (formData.rfc.length !== 12 && formData.rfc.length !== 13) {
      setError('RFC inválido: 12 caracteres (PM) o 13 caracteres (PF)');
      return;
    }
    if (!/^[0-9]{5}$/.test(formData.zipCode)) {
      setError('Código postal debe ser 5 dígitos numéricos');
      return;
    }

    setStep(2);
  }

  async function handleStep2(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!formData.taxRegimeKey) {
      setError('Selecciona un régimen fiscal');
      return;
    }

    setLoading(true);
    try {
      await setupTenantProfile(formData);
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-emerald-950 p-4">
      <div className="w-full max-w-lg">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-black text-white">Switch OS</span>
          </div>
          <h1 className="text-3xl font-black text-white leading-tight">
            Configura tu empresa
          </h1>
          <p className="text-neutral-400 mt-2 text-sm">
            Necesitamos tus datos fiscales para emitir CFDI 4.0
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2 mb-6">
          <div className={`flex-1 h-1 rounded-full transition-colors ${step >= 1 ? 'bg-emerald-500' : 'bg-neutral-700'}`} />
          <div className={`flex-1 h-1 rounded-full transition-colors ${step >= 2 ? 'bg-emerald-500' : 'bg-neutral-700'}`} />
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl p-8">
          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3 items-start">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* STEP 1: Datos básicos */}
          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-5">
              <div className="mb-2">
                <p className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-1">
                  Paso 1 de 2
                </p>
                <h2 className="text-xl font-black text-neutral-900 dark:text-white">
                  Datos de la empresa
                </h2>
              </div>

              {/* Nombre comercial */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Nombre de la empresa *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <input
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="ACME Corporation"
                    className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
                  />
                </div>
                <p className="text-xs text-neutral-500 mt-1">Nombre comercial (puede ser corto)</p>
              </div>

              {/* Razón Social */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Razón Social (completa) *
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <input
                    name="legalName"
                    type="text"
                    required
                    value={formData.legalName}
                    onChange={handleChange}
                    placeholder="ACME CORPORATION S.A. DE C.V."
                    className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm uppercase"
                  />
                </div>
                <p className="text-xs text-neutral-500 mt-1">Como aparece registrado ante el SAT</p>
              </div>

              {/* RFC */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  RFC *
                </label>
                <input
                  name="rfc"
                  type="text"
                  required
                  maxLength={13}
                  value={formData.rfc}
                  onChange={handleChange}
                  placeholder="ABC123XYZ456 (PM) o ABCD780101XY3 (PF)"
                  className="w-full px-4 py-2.5 border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm font-mono tracking-wider uppercase"
                />
                <p className="text-xs text-neutral-500 mt-1">12 caracteres (PM) · 13 caracteres (PF)</p>
              </div>

              {/* Código Postal */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Código Postal del domicilio fiscal *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <input
                    name="zipCode"
                    type="text"
                    required
                    maxLength={5}
                    pattern="[0-9]{5}"
                    value={formData.zipCode}
                    onChange={handleChange}
                    placeholder="28001"
                    className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
                  />
                </div>
                <p className="text-xs text-neutral-500 mt-1">Obligatorio en CFDI 4.0 (Emisor)</p>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black py-3 rounded-xl transition-colors text-sm"
              >
                Siguiente →
              </button>
            </form>
          )}

          {/* STEP 2: Régimen fiscal */}
          {step === 2 && (
            <form onSubmit={handleStep2} className="space-y-5">
              <div className="mb-2">
                <p className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-1">
                  Paso 2 de 2
                </p>
                <h2 className="text-xl font-black text-neutral-900 dark:text-white">
                  Régimen Fiscal
                </h2>
              </div>

              {/* Resumen paso 1 */}
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                <div className="flex gap-2 items-center mb-2">
                  <CheckCircle className="text-emerald-600" size={16} />
                  <p className="text-sm font-bold text-emerald-800 dark:text-emerald-400">
                    Datos capturados
                  </p>
                </div>
                <div className="text-xs text-emerald-700 dark:text-emerald-500 space-y-0.5">
                  <p><strong>Empresa:</strong> {formData.name}</p>
                  <p><strong>RFC:</strong> {formData.rfc}</p>
                  <p><strong>CP:</strong> {formData.zipCode}</p>
                </div>
              </div>

              {/* Régimen */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Régimen Fiscal SAT *
                </label>
                <div className="relative">
                  <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
                  <select
                    name="taxRegimeKey"
                    required
                    value={formData.taxRegimeKey}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm appearance-none"
                  >
                    <option value="">— Selecciona tu régimen —</option>
                    {REGIMES_SAT.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  Consulta tu CSF (Constancia de Situación Fiscal) en sat.gob.mx si no estás seguro
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-3 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-semibold rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-sm"
                >
                  ← Atrás
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-3 rounded-xl transition-colors text-sm"
                >
                  {loading ? 'Guardando...' : '✓ Completar'}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-neutral-500 mt-6">
          Esta información es obligatoria para cumplir con la normativa del SAT (CFDI 4.0 — Anexo 20).
          Puedes editarla después en Configuración.
        </p>
      </div>
    </div>
  );
}
