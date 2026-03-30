'use client';

/**
 * CIFRA — Onboarding Fiscal (FASE 41)
 * =====================================
 * Wizard 4 pasos:
 *   1. Empresa  — nombre comercial + razón social + RFC
 *   2. Fiscal   — CP + régimen SAT + CSD (opcional)
 *   3. Módulos  — industria + módulos activos
 *   4. Banca    — conexión bancaria (omitible)
 */

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { setupTenantProfile, MODULE_GROUPS } from './actions';
import type { ModuleKey } from '@prisma/client';
import {
  Building2, FileText, Layers, Landmark,
  CheckCircle2, AlertCircle, ChevronRight, ChevronLeft,
  Loader2, Upload, X, ShieldCheck, Info,
} from 'lucide-react';

// ─── Catálogos SAT ────────────────────────────────────────────────────────────

const REGIMES_SAT = [
  { value: '601', label: '601 · General de Ley Personas Morales' },
  { value: '603', label: '603 · Personas Morales sin Fines Lucrativos' },
  { value: '605', label: '605 · Sueldos, Salarios e Ingresos Asimilados' },
  { value: '606', label: '606 · Arrendamiento' },
  { value: '612', label: '612 · Personas Físicas con Act. Empresariales' },
  { value: '616', label: '616 · Sin obligaciones fiscales' },
  { value: '621', label: '621 · Incorporación Fiscal' },
  { value: '625', label: '625 · Plataformas Tecnológicas' },
  { value: '626', label: '626 · Régimen Simplificado de Confianza (RESICO)' },
];

// ─── Industrias ───────────────────────────────────────────────────────────────

const INDUSTRIES: {
  key: string;
  label: string;
  icon: string;
  regime: string;
  modules: string[];
}[] = [
  { key: 'comercio',     label: 'Comercio',            icon: '🛒', regime: '621', modules: ['BILLING_CFDI','POS','INVENTORY','FINANCE','TAXES'] },
  { key: 'servicios',    label: 'Servicios prof.',      icon: '💼', regime: '612', modules: ['BILLING_CFDI','CRM','FINANCE','PROJECTS','TAXES'] },
  { key: 'manufactura',  label: 'Manufactura',          icon: '🏭', regime: '601', modules: ['BILLING_CFDI','INVENTORY','SCM','FINANCE','TAXES'] },
  { key: 'restaurante',  label: 'Restaurante / Food',   icon: '🍽️', regime: '621', modules: ['BILLING_CFDI','POS','INVENTORY','PAYROLL','HCM'] },
  { key: 'salud',        label: 'Salud / Clínica',      icon: '🏥', regime: '612', modules: ['BILLING_CFDI','FINANCE','TAXES','COLLECTIONS','CRM'] },
  { key: 'tecnologia',   label: 'Tecnología / SaaS',    icon: '💻', regime: '601', modules: ['BILLING_CFDI','CRM','BI','PROJECTS','FINANCE','TAXES'] },
  { key: 'construccion', label: 'Construcción',         icon: '🏗️', regime: '601', modules: ['BILLING_CFDI','PROJECTS','INVENTORY','SCM','PAYROLL'] },
  { key: 'educacion',    label: 'Educación',            icon: '🎓', regime: '605', modules: ['BILLING_CFDI','FINANCE','COLLECTIONS','HCM','PAYROLL'] },
  { key: 'otro',         label: 'Otro',                 icon: '⚡', regime: '',    modules: [] },
];

// ─── Bancos mexicanos ─────────────────────────────────────────────────────────

const BANKS = [
  { key: 'bbva',      label: 'BBVA México',   color: '#004481', letter: 'B' },
  { key: 'banorte',   label: 'Banorte',        color: '#e30000', letter: 'N' },
  { key: 'santander', label: 'Santander',      color: '#ec0000', letter: 'S' },
  { key: 'hsbc',      label: 'HSBC',           color: '#d40000', letter: 'H' },
  { key: 'banamex',   label: 'Citibanamex',    color: '#003087', letter: 'C' },
  { key: 'inbursa',   label: 'Inbursa',        color: '#005f8e', letter: 'I' },
];

// ─── Steps ────────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Empresa', icon: Building2 },
  { id: 2, label: 'Fiscal',  icon: FileText   },
  { id: 3, label: 'Módulos', icon: Layers     },
  { id: 4, label: 'Banca',   icon: Landmark   },
] as const;

type StepId = 1 | 2 | 3 | 4;

function getAllModuleKeys(): ModuleKey[] {
  return MODULE_GROUPS.flatMap((g) => g.modules.map((m) => m.key));
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep]       = useState<StepId>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [done, setDone]       = useState(false);

  // Step 1
  const [name, setName]           = useState('');
  const [legalName, setLegalName] = useState('');
  const [rfc, setRfc]             = useState('');
  const [csfFile, setCsfFile]     = useState<File | null>(null);
  const csfRef = useRef<HTMLInputElement>(null);

  // Step 2
  const [zipCode, setZipCode]       = useState('');
  const [taxRegimeKey, setTaxRegime] = useState('');
  const [cerFile, setCerFile]       = useState<File | null>(null);
  const [keyFile, setKeyFile]       = useState<File | null>(null);
  const [csdPass, setCsdPass]       = useState('');
  const cerRef = useRef<HTMLInputElement>(null);
  const keyRef = useRef<HTMLInputElement>(null);

  // Step 3
  const [industry, setIndustry]   = useState('');
  const [selectedModules, setSelectedModules] = useState<Set<ModuleKey>>(
    new Set(getAllModuleKeys())
  );

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function rfcStatus(): 'empty' | 'invalid' | 'moral' | 'fisica' {
    if (!rfc) return 'empty';
    const moral  = /^[A-ZÑ&]{3}\d{6}[A-Z0-9]{3}$/.test(rfc);
    const fisica = /^[A-ZÑ&]{4}\d{6}[A-Z0-9]{3}$/.test(rfc);
    if (moral)  return 'moral';
    if (fisica) return 'fisica';
    return 'invalid';
  }

  function pickIndustry(key: string) {
    setIndustry(key);
    const found = INDUSTRIES.find((i) => i.key === key);
    if (found && found.modules.length > 0) {
      setSelectedModules(new Set(found.modules as ModuleKey[]));
      if (found.regime && !taxRegimeKey) setTaxRegime(found.regime);
    } else {
      setSelectedModules(new Set(getAllModuleKeys()));
    }
  }

  function toggleModule(key: ModuleKey) {
    setSelectedModules((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  // ── Navegación ───────────────────────────────────────────────────────────────

  function nextStep() {
    setError('');
    if (step === 1) {
      if (!name.trim())      return setError('El nombre comercial es requerido.');
      if (!legalName.trim()) return setError('La razón social es requerida.');
      if (!rfc.trim())       return setError('El RFC es requerido.');
      if (rfcStatus() === 'invalid') return setError('El formato del RFC no es válido. Verifica que sea correcto.');
    }
    if (step === 2) {
      if (!zipCode.trim()) return setError('El Código Postal es requerido.');
      if (!taxRegimeKey)   return setError('Selecciona el régimen fiscal del SAT.');
    }
    if (step === 3) {
      if (selectedModules.size === 0) return setError('Selecciona al menos un módulo.');
    }
    setStep((s) => Math.min(s + 1, 4) as StepId);
  }

  async function handleFinish(skipBanking = false) {
    setError('');
    if (selectedModules.size === 0) return setError('Selecciona al menos un módulo.');
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
      setTimeout(() => router.push('/dashboard'), 2200);
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
        <div className="text-center space-y-5 px-6 max-w-sm">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-bounce">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              ¡Listo, {name}!
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm leading-relaxed">
              Tu empresa está configurada con {selectedModules.size} módulo{selectedModules.size !== 1 ? 's' : ''} activos.
              Redirigiendo a tu dashboard…
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Preparando tu espacio de trabajo
          </div>
        </div>
      </div>
    );
  }

  // ── Layout principal ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-neutral-950 p-4 py-10">

      {/* Fondo decorativo */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute -top-40 -right-32 w-96 h-96 bg-emerald-400/8 dark:bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-blue-400/8 dark:bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-2xl relative">

        {/* Logo CIFRA */}
        <div className="flex justify-center mb-8">
          <div className="h-10 px-4 rounded-xl bg-slate-900 dark:bg-neutral-800 shadow-md ring-1 ring-black/5 dark:ring-white/10 flex items-center justify-center">
            <svg viewBox="0 0 90 32" className="h-6 w-auto" aria-label="ÇifRΛ" role="img">
              <text x="45" y="24" textAnchor="middle" fontSize="24" fontWeight="800" fill="white"
                fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif"
                letterSpacing="-0.8">ÇifRΛ</text>
            </svg>
          </div>
        </div>

        {/* Título */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Configura tu empresa</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Solo toma 3 minutos · Puedes modificar todo después en Configuración
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-1.5 mb-8">
          {STEPS.map((s, i) => {
            const Icon        = s.icon;
            const isActive    = step === s.id;
            const isCompleted = step > s.id;
            return (
              <div key={s.id} className="flex items-center gap-1.5">
                <div className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-black shadow-md'
                    : isCompleted
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                    : 'bg-slate-100 dark:bg-neutral-800 text-slate-400 dark:text-neutral-500'
                }`}>
                  {isCompleted
                    ? <CheckCircle2 className="h-3.5 w-3.5" />
                    : <Icon className="h-3.5 w-3.5" />
                  }
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-px w-6 transition-colors ${step > s.id ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-neutral-700'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-8 shadow-sm">

          {/* Error */}
          {error && (
            <div className="mb-6 flex items-start gap-3 p-3.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {/* ══ PASO 1: Empresa ══════════════════════════════════════════════════ */}
          {step === 1 && (
            <div className="space-y-5">
              <StepHeader
                title="Datos de tu empresa"
                subtitle="El nombre comercial aparecerá en el sistema. La razón social se imprimirá en tus CFDIs."
              />

              {/* Subir CSF */}
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800/50 p-4">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center shrink-0">
                    <Upload className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Sube tu Constancia de Situación Fiscal (CSF)
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Llenado automático de RFC, razón social y régimen · PDF del SAT
                    </p>
                    {csfFile ? (
                      <div className="mt-2 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {csfFile.name}
                        <button onClick={() => setCsfFile(null)} className="ml-1 text-slate-400 hover:text-slate-600">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => csfRef.current?.click()}
                        className="mt-2 text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
                      >
                        Seleccionar archivo PDF →
                      </button>
                    )}
                    <input
                      ref={csfRef}
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => { if (e.target.files?.[0]) setCsfFile(e.target.files[0]); }}
                    />
                  </div>
                </div>
              </div>

              <Field label="Nombre comercial">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Mi Empresa"
                  className={inputCls}
                />
              </Field>

              <Field label="Razón social (exactamente como aparece en el SAT)">
                <input
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value.toUpperCase())}
                  placeholder="EJ. MI EMPRESA S.A. DE C.V."
                  className={`${inputCls} uppercase`}
                />
              </Field>

              <Field label="RFC">
                <div className="relative">
                  <input
                    type="text"
                    value={rfc}
                    onChange={(e) => setRfc(e.target.value.toUpperCase().replace(/[^A-Z0-9&Ñ]/g, '').slice(0,13))}
                    placeholder="XAXX010101000"
                    maxLength={13}
                    className={`${inputCls} uppercase tracking-widest pr-28`}
                  />
                  <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold px-2 py-0.5 rounded-full ${
                    rfcStatus() === 'moral'  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    rfcStatus() === 'fisica' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                    rfcStatus() === 'invalid' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' :
                    'bg-slate-100 text-slate-400 dark:bg-neutral-800'
                  }`}>
                    {rfcStatus() === 'moral'  ? 'Moral ✓'   :
                     rfcStatus() === 'fisica' ? 'Física ✓'  :
                     rfcStatus() === 'invalid'? 'Inválido'   : 'RFC'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  12 dígitos para Persona Moral · 13 para Persona Física
                </p>
              </Field>
            </div>
          )}

          {/* ══ PASO 2: Fiscal ═══════════════════════════════════════════════════ */}
          {step === 2 && (
            <div className="space-y-5">
              <StepHeader
                title="Datos fiscales"
                subtitle="Necesarios para emitir CFDI 4.0 válidos ante el SAT. Podrás completar el CSD después."
              />

              <div className="grid grid-cols-2 gap-4">
                <Field label="Código Postal fiscal">
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    placeholder="06600"
                    maxLength={5}
                    className={inputCls}
                  />
                </Field>

                <Field label="Régimen Fiscal SAT">
                  <select
                    value={taxRegimeKey}
                    onChange={(e) => setTaxRegime(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Selecciona…</option>
                    {REGIMES_SAT.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* CSD Section */}
              <div className="rounded-xl border border-slate-200 dark:border-neutral-700 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 dark:bg-neutral-800 border-b border-slate-200 dark:border-neutral-700 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Certificado de Sello Digital (CSD)</span>
                  <span className="ml-auto text-xs text-slate-400 bg-slate-200 dark:bg-neutral-700 px-2 py-0.5 rounded-full">Opcional</span>
                </div>
                <div className="p-4 space-y-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Necesario para <strong className="text-slate-700 dark:text-slate-300">timbrar facturas</strong> con tu PAC. Si no lo tienes a la mano, puedes subirlo después desde <span className="font-medium">Configuración → Certificados Digitales</span>.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <FileUploadField
                      label="Certificado .cer"
                      accept=".cer"
                      file={cerFile}
                      inputRef={cerRef}
                      onChange={setCerFile}
                    />
                    <FileUploadField
                      label="Clave privada .key"
                      accept=".key"
                      file={keyFile}
                      inputRef={keyRef}
                      onChange={setKeyFile}
                    />
                  </div>
                  {(cerFile || keyFile) && (
                    <Field label="Contraseña de clave privada">
                      <input
                        type="password"
                        value={csdPass}
                        onChange={(e) => setCsdPass(e.target.value)}
                        placeholder="Contraseña del archivo .key"
                        className={inputCls}
                        autoComplete="new-password"
                      />
                    </Field>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══ PASO 3: Industria y Módulos ══════════════════════════════════════ */}
          {step === 3 && (
            <div className="space-y-5">
              <StepHeader
                title="¿A qué se dedica tu empresa?"
                subtitle="Selecciona tu industria para activar los módulos recomendados. Puedes personalizar después."
              />

              {/* Industry picker */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {INDUSTRIES.map((ind) => (
                  <button
                    key={ind.key}
                    type="button"
                    onClick={() => pickIndustry(ind.key)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all ${
                      industry === ind.key
                        ? 'border-slate-900 dark:border-emerald-500 bg-slate-50 dark:bg-emerald-500/10'
                        : 'border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-slate-300 dark:hover:border-neutral-600'
                    }`}
                  >
                    <span className="text-2xl leading-none">{ind.icon}</span>
                    <span className={`text-xs font-medium leading-tight ${
                      industry === ind.key ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                    }`}>{ind.label}</span>
                  </button>
                ))}
              </div>

              {/* Module grid */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Módulos activos
                  </p>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {selectedModules.size} de {getAllModuleKeys().length} seleccionados
                  </span>
                </div>
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1 -mr-1">
                  {MODULE_GROUPS.map((group) => (
                    <div key={group.group}>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                        {group.group}
                      </p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {group.modules.map((mod) => {
                          const isSelected = selectedModules.has(mod.key);
                          return (
                            <button
                              key={mod.key}
                              type="button"
                              onClick={() => toggleModule(mod.key)}
                              className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                                isSelected
                                  ? 'border-slate-900 dark:border-emerald-500 bg-slate-50 dark:bg-emerald-500/10'
                                  : 'border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 opacity-50'
                              }`}
                            >
                              <span className="text-lg leading-none shrink-0">{mod.icon}</span>
                              <div className="min-w-0 flex-1">
                                <p className={`text-xs font-semibold truncate ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                                  {mod.label}
                                </p>
                              </div>
                              {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Todos incluidos en tu prueba gratuita de 14 días. Ajusta en cualquier momento.
                </p>
              </div>
            </div>
          )}

          {/* ══ PASO 4: Banca ════════════════════════════════════════════════════ */}
          {step === 4 && (
            <div className="space-y-5">
              <StepHeader
                title="Conecta tu banco"
                subtitle="La conciliación automática ahorra horas cada mes. Puedes conectar ahora o después."
              />

              <div className="grid grid-cols-3 gap-2">
                {BANKS.map((bank) => (
                  <button
                    key={bank.key}
                    type="button"
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-slate-300 dark:hover:border-neutral-600 transition-all relative group"
                  >
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm"
                      style={{ background: bank.color }}
                    >
                      {bank.letter}
                    </div>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300 text-center leading-tight">
                      {bank.label}
                    </span>
                    <span className="absolute top-2 right-2 text-[9px] bg-slate-100 dark:bg-neutral-800 text-slate-400 px-1.5 py-0.5 rounded-full font-medium">
                      Pronto
                    </span>
                  </button>
                ))}
              </div>

              <div className="rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 p-4 flex items-start gap-3">
                <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                  <strong>Open Banking seguro</strong> — Conexión de solo lectura vía Belvo y Flink. Tus credenciales bancarias nunca son almacenadas por CIFRA. Disponible en las próximas semanas.
                </div>
              </div>

              <p className="text-xs text-center text-slate-400 dark:text-slate-500">
                También puedes conectar manualmente tus estados de cuenta desde <span className="font-medium">Finanzas → Bancos</span>
              </p>
            </div>
          )}

          {/* ── Botones ────────────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100 dark:border-neutral-800">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => { setError(''); setStep((s) => Math.max(s - 1, 1) as StepId); }}
                className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              {step === 4 && (
                <button
                  type="button"
                  onClick={() => handleFinish(true)}
                  disabled={loading}
                  className="text-sm text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors disabled:opacity-40"
                >
                  Omitir por ahora
                </button>
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-black font-semibold text-sm px-6 py-2.5 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-all active:scale-95 shadow-sm"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleFinish(false)}
                  disabled={loading}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-50 shadow-sm shadow-emerald-500/30"
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Configurando…</>
                  ) : (
                    <><CheckCircle2 className="h-4 w-4" />Entrar a CIFRA</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 dark:text-slate-600 mt-4">
          CIFRA · ERP Fiscal para México · Datos almacenados con cifrado de extremo a extremo
        </p>
      </div>
    </div>
  );
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────

const inputCls = `w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-emerald-500/30 transition-shadow`;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}

function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="pb-1">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{subtitle}</p>
    </div>
  );
}

function FileUploadField({
  label, accept, file, inputRef, onChange,
}: {
  label: string;
  accept: string;
  file: File | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (f: File) => void;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed text-xs font-medium transition-all ${
          file
            ? 'border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
            : 'border-slate-300 dark:border-neutral-600 bg-slate-50 dark:bg-neutral-800 text-slate-500 dark:text-slate-400 hover:border-slate-400'
        }`}
      >
        {file ? (
          <><CheckCircle2 className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{file.name}</span></>
        ) : (
          <><Upload className="h-3.5 w-3.5 shrink-0" /><span>Seleccionar {accept}</span></>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) onChange(e.target.files[0]); }}
      />
    </div>
  );
}
