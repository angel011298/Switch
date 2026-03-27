'use client';

/**
 * Switch OS — Wizard de Onboarding (FASE 21)
 * ============================================
 * 3 pasos obligatorios antes de usar el sistema:
 *   1. Datos de empresa (nombre comercial + razón social)
 *   2. Datos fiscales (RFC + CP + régimen fiscal SAT)
 *   3. Módulos a activar (selección con auto-TRIAL)
 *
 * Al completar: activa módulos, envía email de bienvenida
 * y marca onboardingComplete = true.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setupTenantProfile, MODULE_GROUPS } from './actions';
import type { ModuleKey } from '@prisma/client';
import {
  Building2,
  FileText,
  Layers,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Loader2,
} from 'lucide-react';

const REGIMES_SAT = [
  { value: '601', label: '601 - General de Ley Personas Morales' },
  { value: '603', label: '603 - Personas Morales con Fines no Lucrativos' },
  { value: '605', label: '605 - Sueldos y Salarios e Ingresos Asimilados' },
  { value: '606', label: '606 - Arrendamiento' },
  { value: '612', label: '612 - Personas Físicas con Actividades Empresariales' },
  { value: '616', label: '616 - Sin obligaciones fiscales' },
  { value: '621', label: '621 - Incorporación Fiscal' },
  { value: '625', label: '625 - Plataformas Tecnológicas' },
  { value: '626', label: '626 - Régimen Simplificado de Confianza (RESICO)' },
];

const STEPS = [
  { id: 1, label: 'Empresa', icon: Building2 },
  { id: 2, label: 'Fiscal',  icon: FileText   },
  { id: 3, label: 'Módulos', icon: Layers     },
];

function getAllModuleKeys(): ModuleKey[] {
  return MODULE_GROUPS.flatMap((g) => g.modules.map((m) => m.key));
}

export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep]       = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [done, setDone]       = useState(false);

  const [name, setName]           = useState('');
  const [legalName, setLegalName] = useState('');
  const [rfc, setRfc]             = useState('');
  const [zipCode, setZipCode]     = useState('');
  const [taxRegimeKey, setTaxRegime] = useState('');

  const [selectedModules, setSelectedModules] = useState<Set<ModuleKey>>(
    new Set(getAllModuleKeys())
  );

  function toggleModule(key: ModuleKey) {
    setSelectedModules((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function nextStep() {
    setError('');
    if (step === 1) {
      if (!name.trim())      return setError('El nombre de empresa es requerido.');
      if (!legalName.trim()) return setError('La razón social es requerida.');
    }
    if (step === 2) {
      if (!rfc.trim())     return setError('El RFC es requerido.');
      if (!zipCode.trim()) return setError('El Código Postal es requerido.');
      if (!taxRegimeKey)   return setError('Selecciona un régimen fiscal.');
    }
    setStep((s) => (s < 3 ? ((s + 1) as 1 | 2 | 3) : s));
  }

  async function handleFinish() {
    setError('');
    if (selectedModules.size === 0) {
      return setError('Selecciona al menos un módulo para continuar.');
    }
    setLoading(true);
    try {
      await setupTenantProfile({
        name,
        legalName,
        rfc,
        zipCode,
        taxRegimeKey,
        selectedModules: Array.from(selectedModules),
      });
      setDone(true);
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  // ── Pantalla de éxito ────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-neutral-950">
        <div className="text-center space-y-4 px-6">
          <div className="flex justify-center">
            <CheckCircle2 className="h-16 w-16 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            ¡Listo! Tu empresa está configurada
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Activamos {selectedModules.size} módulo{selectedModules.size !== 1 ? 's' : ''}.
            Redirigiendo al dashboard…
          </p>
        </div>
      </div>
    );
  }

  // ── Wizard ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-neutral-950 p-4">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Configura tu empresa</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Solo tarda 2 minutos. Puedes modificarlo después en Configuración.
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => {
            const Icon        = s.icon;
            const isActive    = step === s.id;
            const isCompleted = step > s.id;
            return (
              <div key={s.id} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-black'
                    : isCompleted
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                    : 'bg-slate-100 dark:bg-neutral-800 text-slate-400'
                }`}>
                  {isCompleted
                    ? <CheckCircle2 className="h-4 w-4" />
                    : <Icon className="h-4 w-4" />
                  }
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-px w-8 transition-colors ${step > s.id ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-neutral-700'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-8 shadow-sm">

          {error && (
            <div className="mb-6 flex items-start gap-3 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {/* ── PASO 1: Empresa ──────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Datos de tu empresa</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">El nombre comercial aparecerá en el sistema. La razón social se usará en los CFDIs.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Nombre comercial</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Mi Empresa"
                  className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-emerald-500/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Razón social (como aparece en el SAT)</label>
                <input
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value.toUpperCase())}
                  placeholder="EJ. MI EMPRESA S.A. DE C.V."
                  className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-emerald-500/30 uppercase"
                />
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Exactamente como aparece en tu Constancia de Situación Fiscal</p>
              </div>
            </div>
          )}

          {/* ── PASO 2: Fiscal ──────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Datos fiscales</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Necesarios para emitir CFDI 4.0 válidos ante el SAT.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">RFC</label>
                  <input
                    type="text"
                    value={rfc}
                    onChange={(e) => setRfc(e.target.value.toUpperCase().replace(/[^A-Z0-9&Ñ]/g, ''))}
                    placeholder="XAXX010101000"
                    maxLength={13}
                    className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-emerald-500/30 uppercase tracking-widest"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Código Postal</label>
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    placeholder="06600"
                    maxLength={5}
                    className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-emerald-500/30"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Régimen Fiscal SAT</label>
                <select
                  value={taxRegimeKey}
                  onChange={(e) => setTaxRegime(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-emerald-500/30"
                >
                  <option value="">Selecciona tu régimen...</option>
                  {REGIMES_SAT.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* ── PASO 3: Módulos ──────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">¿Qué módulos necesitas?</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Todos están incluidos en tu prueba gratuita de 14 días. Desactiva los que no uses para simplificar el menú.
                </p>
              </div>
              <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                {MODULE_GROUPS.map((group) => (
                  <div key={group.group}>
                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                      {group.group}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {group.modules.map((mod) => {
                        const isSelected = selectedModules.has(mod.key);
                        return (
                          <button
                            key={mod.key}
                            type="button"
                            onClick={() => toggleModule(mod.key)}
                            className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                              isSelected
                                ? 'border-slate-900 dark:border-emerald-500 bg-slate-50 dark:bg-emerald-500/10'
                                : 'border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 opacity-60'
                            }`}
                          >
                            <span className="text-xl leading-none">{mod.icon}</span>
                            <div className="min-w-0 flex-1">
                              <p className={`text-sm font-medium truncate ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                {mod.label}
                              </p>
                              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-1">
                                {mod.description}
                              </p>
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {selectedModules.size} módulo{selectedModules.size !== 1 ? 's' : ''} seleccionado{selectedModules.size !== 1 ? 's' : ''}
              </p>
            </div>
          )}

          {/* Botones */}
          <div className="flex items-center justify-between mt-8">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-black font-medium text-sm px-6 py-2.5 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-all active:scale-95"
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={loading}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-6 py-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Configurando…</>
                ) : (
                  <><CheckCircle2 className="h-4 w-4" /> Completar configuración</>
                )}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 dark:text-slate-600 mt-4">
          Switch OS · Todos los datos se almacenan de forma segura y cifrada
        </p>
      </div>
    </div>
  );
}
