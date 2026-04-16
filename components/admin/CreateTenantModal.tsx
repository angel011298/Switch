'use client';

import { useState, useTransition } from 'react';
import { createTenantFromAdmin, type CreateTenantInput } from '@/app/(dashboard)/admin/tenant-actions';
import {
  Building2, X, ChevronRight, ChevronLeft, Eye, EyeOff,
  User, FileText, CreditCard, Blocks, CheckCircle2, Loader2,
  AlertCircle, Calendar, Infinity
} from 'lucide-react';

// ─── Módulos disponibles ──────────────────────────────────────────────────────

const MODULE_GROUPS = [
  {
    label: 'Centro Estratégico',
    modules: [
      { key: 'DASHBOARD', label: 'Dashboard' },
      { key: 'CALENDAR',  label: 'Calendario' },
      { key: 'BI',        label: 'Business Intelligence' },
    ],
  },
  {
    label: 'Capital Humano',
    modules: [
      { key: 'HCM',     label: 'HCM' },
      { key: 'PAYROLL', label: 'Nómina' },
      { key: 'TALENT',  label: 'Talento' },
    ],
  },
  {
    label: 'Finanzas',
    modules: [
      { key: 'FINANCE',     label: 'Finanzas' },
      { key: 'TAXES',       label: 'Impuestos' },
      { key: 'COLLECTIONS', label: 'Cobranza' },
    ],
  },
  {
    label: 'Facturación y POS',
    modules: [
      { key: 'BILLING_CFDI', label: 'Facturación CFDI' },
      { key: 'POS',          label: 'Punto de Venta' },
    ],
  },
  {
    label: 'Comercial',
    modules: [
      { key: 'CRM',       label: 'CRM' },
      { key: 'MARKETING', label: 'Marketing' },
      { key: 'SUPPORT',   label: 'Soporte' },
    ],
  },
  {
    label: 'Operaciones (SCM)',
    modules: [
      { key: 'SCM',       label: 'SCM' },
      { key: 'INVENTORY', label: 'Inventario' },
      { key: 'LOGISTICS', label: 'Logística' },
    ],
  },
  {
    label: 'Manufactura (MRP)',
    modules: [
      { key: 'MRP',     label: 'MRP' },
      { key: 'QUALITY', label: 'Calidad' },
    ],
  },
  {
    label: 'Proyectos',
    modules: [
      { key: 'PROJECTS', label: 'Proyectos' },
    ],
  },
];

const ALL_MODULE_KEYS = MODULE_GROUPS.flatMap((g) => g.modules.map((m) => m.key));

const PLANS = [
  { value: 'trial',      label: 'Trial' },
  { value: 'starter',    label: 'Starter' },
  { value: 'standard',   label: 'Standard' },
  { value: 'pro',        label: 'Pro' },
  { value: 'enterprise', label: 'Enterprise' },
];

const SUBSCRIPTION_STATUSES = [
  { value: 'TRIAL',     label: 'Trial', color: 'text-blue-600' },
  { value: 'ACTIVE',    label: 'Activo', color: 'text-emerald-600' },
  { value: 'PAST_DUE',  label: 'Vencido', color: 'text-amber-600' },
  { value: 'SUSPENDED', label: 'Suspendido', color: 'text-red-600' },
];

type Step = 'cuenta' | 'fiscal' | 'suscripcion' | 'modulos' | 'confirmar';
const STEPS: { id: Step; label: string; icon: any }[] = [
  { id: 'cuenta',      label: 'Cuenta',       icon: User },
  { id: 'fiscal',      label: 'Datos Fiscales', icon: FileText },
  { id: 'suscripcion', label: 'Suscripción',   icon: CreditCard },
  { id: 'modulos',     label: 'Módulos',        icon: Blocks },
  { id: 'confirmar',   label: 'Confirmar',      icon: CheckCircle2 },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface TaxRegime {
  id: string;
  satCode: string;
  name: string;
  personType: 'FISICA' | 'MORAL';
}

interface Props {
  taxRegimes: TaxRegime[];
  onClose: () => void;
  onCreated: () => void;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function CreateTenantModal({ taxRegimes, onClose, onCreated }: Props) {
  const [step, setStep] = useState<Step>('cuenta');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [validUntilMode, setValidUntilMode] = useState<'fecha' | 'indeterminada'>('fecha');

  // Form state
  const [form, setForm] = useState<Partial<CreateTenantInput & { adminPassword: string }>>({
    name: '',
    adminEmail: '',
    adminName: '',
    adminPassword: '',
    rfc: '',
    legalName: '',
    personType: 'MORAL',
    zipCode: '',
    taxRegimeId: '',
    planId: 'standard',
    subscriptionStatus: 'ACTIVE',
    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    moduleKeys: ['DASHBOARD', 'BILLING_CFDI', 'FINANCE'],
  });

  const set = (field: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const toggleModule = (key: string) => {
    const current = form.moduleKeys ?? [];
    if (current.includes(key)) {
      set('moduleKeys', current.filter((k) => k !== key));
    } else {
      set('moduleKeys', [...current, key]);
    }
  };

  const selectAllModules = () => set('moduleKeys', [...ALL_MODULE_KEYS]);
  const clearAllModules  = () => set('moduleKeys', []);

  const filteredRegimes = taxRegimes.filter(
    (r) => r.personType === form.personType || !form.personType
  );

  const currentStepIndex = STEPS.findIndex((s) => s.id === step);

  const goNext = () => {
    const idx = STEPS.findIndex((s) => s.id === step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].id);
  };

  const goPrev = () => {
    const idx = STEPS.findIndex((s) => s.id === step);
    if (idx > 0) setStep(STEPS[idx - 1].id);
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 'cuenta':
        return !!(form.name?.trim() && form.adminEmail?.trim() && form.adminPassword && form.adminPassword.length >= 8);
      case 'fiscal':
        return !!(form.rfc?.trim() && form.legalName?.trim() && form.zipCode?.trim() && form.taxRegimeId);
      case 'suscripcion':
        return !!(form.planId && form.subscriptionStatus);
      case 'modulos':
        return true;
      case 'confirmar':
        return true;
    }
  };

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      const validUntilValue = validUntilMode === 'indeterminada' ? null : (form.validUntil ?? null);

      const result = await createTenantFromAdmin({
        name: form.name!,
        adminEmail: form.adminEmail!,
        adminName: form.adminName || form.adminEmail!.split('@')[0],
        adminPassword: form.adminPassword!,
        rfc: form.rfc!,
        legalName: form.legalName!,
        personType: form.personType as 'FISICA' | 'MORAL',
        zipCode: form.zipCode!,
        taxRegimeId: form.taxRegimeId!,
        planId: form.planId!,
        subscriptionStatus: form.subscriptionStatus as any,
        validUntil: validUntilValue,
        moduleKeys: form.moduleKeys ?? [],
      });

      if (result.success) {
        onCreated();
      } else {
        setError(result.error ?? 'Error desconocido');
      }
    });
  };

  const selectedRegime = taxRegimes.find((r) => r.id === form.taxRegimeId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-2xl max-h-[95vh] rounded-[2rem] shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-950 text-white rounded-t-[2rem] shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2 rounded-xl">
              <Building2 className="h-5 w-5 text-neutral-950" />
            </div>
            <div>
              <h2 className="text-lg font-black">Crear Nuevo Tenant</h2>
              <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest">Panel Super Admin</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stepper */}
        <div className="flex items-center px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 shrink-0 overflow-x-auto gap-1">
          {STEPS.map((s, i) => {
            const isActive    = s.id === step;
            const isCompleted = i < currentStepIndex;
            return (
              <div key={s.id} className="flex items-center gap-1">
                <button
                  onClick={() => i < currentStepIndex && setStep(s.id)}
                  disabled={i > currentStepIndex}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-neutral-950 text-white dark:bg-white dark:text-black'
                      : isCompleted
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 cursor-pointer'
                      : 'text-neutral-400'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <s.icon className="h-3.5 w-3.5" />
                  )}
                  {s.label}
                </button>
                {i < STEPS.length - 1 && (
                  <ChevronRight className="h-3 w-3 text-neutral-300 shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* ── PASO 1: Cuenta ── */}
          {step === 'cuenta' && (
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-neutral-500">
                Datos de la Organización y Administrador
              </h3>
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Nombre de la Organización *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="Ej: ACME Corp, Distribuidora López, etc."
                  className="input-field"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Email del Administrador *
                  </label>
                  <input
                    type="email"
                    value={form.adminEmail}
                    onChange={(e) => set('adminEmail', e.target.value)}
                    placeholder="admin@empresa.com"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Nombre del Administrador
                  </label>
                  <input
                    type="text"
                    value={form.adminName}
                    onChange={(e) => set('adminName', e.target.value)}
                    placeholder="Juan García"
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Contraseña Inicial * (mínimo 8 caracteres)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.adminPassword}
                    onChange={(e) => set('adminPassword', e.target.value)}
                    placeholder="Contraseña segura"
                    className="input-field pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  El administrador podrá cambiarla en su primer inicio de sesión.
                </p>
              </div>
            </div>
          )}

          {/* ── PASO 2: Datos Fiscales ── */}
          {step === 'fiscal' && (
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-neutral-500">
                Perfil Fiscal (CFDI 4.0)
              </h3>
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Tipo de Persona *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['MORAL', 'FISICA'].map((pt) => (
                    <button
                      key={pt}
                      type="button"
                      onClick={() => {
                        set('personType', pt);
                        set('taxRegimeId', ''); // Resetear régimen al cambiar tipo
                      }}
                      className={`py-3 rounded-2xl border-2 font-bold text-sm transition-all ${
                        form.personType === pt
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                          : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300'
                      }`}
                    >
                      {pt === 'MORAL' ? 'Persona Moral' : 'Persona Física'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    RFC * {form.personType === 'FISICA' ? '(13 caracteres)' : '(12 caracteres)'}
                  </label>
                  <input
                    type="text"
                    value={form.rfc}
                    onChange={(e) => set('rfc', e.target.value.toUpperCase())}
                    placeholder={form.personType === 'FISICA' ? 'GARJ901010ABC' : 'ACM901010XY3'}
                    maxLength={form.personType === 'FISICA' ? 13 : 12}
                    className="input-field font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Código Postal *
                  </label>
                  <input
                    type="text"
                    value={form.zipCode}
                    onChange={(e) => set('zipCode', e.target.value)}
                    placeholder="06600"
                    maxLength={5}
                    className="input-field font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Razón Social / Nombre Completo *
                </label>
                <input
                  type="text"
                  value={form.legalName}
                  onChange={(e) => set('legalName', e.target.value.toUpperCase())}
                  placeholder="ACME CORPORATION SA DE CV"
                  className="input-field uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Régimen Fiscal SAT *
                </label>
                <select
                  value={form.taxRegimeId}
                  onChange={(e) => set('taxRegimeId', e.target.value)}
                  className="input-field"
                >
                  <option value="">Seleccionar régimen...</option>
                  {filteredRegimes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.satCode} — {r.name}
                    </option>
                  ))}
                </select>
                {filteredRegimes.length === 0 && (
                  <p className="text-xs text-amber-500 mt-1">
                    No hay regímenes disponibles para {form.personType === 'FISCAL' ? 'Persona Física' : 'Persona Moral'}.
                    Verifica el catálogo SAT.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── PASO 3: Suscripción ── */}
          {step === 'suscripcion' && (
            <div className="space-y-5">
              <h3 className="text-sm font-black uppercase tracking-widest text-neutral-500">
                Plan y Estado de Suscripción
              </h3>
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                  Plan *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PLANS.map((plan) => (
                    <button
                      key={plan.value}
                      type="button"
                      onClick={() => set('planId', plan.value)}
                      className={`py-2.5 rounded-xl border-2 font-bold text-sm transition-all ${
                        form.planId === plan.value
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                          : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300'
                      }`}
                    >
                      {plan.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                  Estado de Suscripción *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {SUBSCRIPTION_STATUSES.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => set('subscriptionStatus', s.value)}
                      className={`py-3 rounded-2xl border-2 font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                        form.subscriptionStatus === s.value
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                          : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
                      }`}
                    >
                      <span className={form.subscriptionStatus === s.value ? 'text-emerald-700 dark:text-emerald-400' : s.color}>
                        {s.label}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-neutral-400 mt-2">
                  ACTIVE omite el periodo de prueba y activa el acceso de inmediato.
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                  Vigencia de la Suscripción *
                </label>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <button
                    type="button"
                    onClick={() => setValidUntilMode('fecha')}
                    className={`py-3 rounded-2xl border-2 font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                      validUntilMode === 'fecha'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                        : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    <Calendar className="h-4 w-4" /> Fecha específica
                  </button>
                  <button
                    type="button"
                    onClick={() => setValidUntilMode('indeterminada')}
                    className={`py-3 rounded-2xl border-2 font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                      validUntilMode === 'indeterminada'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400'
                        : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    <Infinity className="h-4 w-4" /> Indeterminada
                  </button>
                </div>
                {validUntilMode === 'fecha' && (
                  <input
                    type="date"
                    value={form.validUntil ?? ''}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => set('validUntil', e.target.value)}
                    className="input-field"
                  />
                )}
                {validUntilMode === 'indeterminada' && (
                  <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-500/10 rounded-xl border border-purple-200 dark:border-purple-500/20">
                    <Infinity className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                    <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">
                      Sin fecha de vencimiento. El acceso no expira automáticamente.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── PASO 4: Módulos ── */}
          {step === 'modulos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-widest text-neutral-500">
                  Módulos Disponibles
                </h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAllModules}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg"
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={clearAllModules}
                    className="text-xs font-bold text-neutral-500 hover:text-neutral-700 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg"
                  >
                    Ninguno
                  </button>
                </div>
              </div>
              <p className="text-xs text-neutral-500">
                {(form.moduleKeys ?? []).length} de {ALL_MODULE_KEYS.length} módulos seleccionados
              </p>
              {MODULE_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="text-xs font-black text-neutral-400 uppercase tracking-wider mb-2">
                    {group.label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {group.modules.map((mod) => {
                      const active = (form.moduleKeys ?? []).includes(mod.key);
                      return (
                        <button
                          key={mod.key}
                          type="button"
                          onClick={() => toggleModule(mod.key)}
                          className={`px-3 py-1.5 rounded-xl border-2 text-xs font-bold transition-all ${
                            active
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                              : 'border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:border-neutral-300'
                          }`}
                        >
                          {mod.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── PASO 5: Confirmar ── */}
          {step === 'confirmar' && (
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-neutral-500">
                Resumen — Confirmar Creación
              </h3>

              <div className="grid grid-cols-1 gap-3">
                {/* Organización */}
                <div className="p-4 bg-neutral-50 dark:bg-black rounded-2xl border border-neutral-200 dark:border-neutral-800">
                  <p className="text-xs font-black text-neutral-400 uppercase mb-2">Organización</p>
                  <p className="font-bold text-neutral-900 dark:text-white">{form.name}</p>
                  <p className="text-xs text-neutral-500">{form.adminEmail}</p>
                </div>

                {/* Datos fiscales */}
                <div className="p-4 bg-neutral-50 dark:bg-black rounded-2xl border border-neutral-200 dark:border-neutral-800">
                  <p className="text-xs font-black text-neutral-400 uppercase mb-2">Datos Fiscales</p>
                  <p className="font-bold font-mono text-neutral-900 dark:text-white">{form.rfc}</p>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300">{form.legalName}</p>
                  <p className="text-xs text-neutral-500">
                    {form.personType === 'FISICA' ? 'Persona Física' : 'Persona Moral'} · CP {form.zipCode}
                    {selectedRegime ? ` · Régimen ${selectedRegime.satCode}` : ''}
                  </p>
                </div>

                {/* Suscripción */}
                <div className="p-4 bg-neutral-50 dark:bg-black rounded-2xl border border-neutral-200 dark:border-neutral-800">
                  <p className="text-xs font-black text-neutral-400 uppercase mb-2">Suscripción</p>
                  <p className="font-bold text-neutral-900 dark:text-white capitalize">
                    Plan {form.planId} · {form.subscriptionStatus}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Vigencia:{' '}
                    {validUntilMode === 'indeterminada'
                      ? 'Indeterminada (sin vencimiento)'
                      : form.validUntil
                      ? new Date(form.validUntil).toLocaleDateString('es-MX')
                      : '—'}
                  </p>
                </div>

                {/* Módulos */}
                <div className="p-4 bg-neutral-50 dark:bg-black rounded-2xl border border-neutral-200 dark:border-neutral-800">
                  <p className="text-xs font-black text-neutral-400 uppercase mb-2">
                    Módulos ({(form.moduleKeys ?? []).length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(form.moduleKeys ?? []).map((key) => (
                      <span
                        key={key}
                        className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-lg"
                      >
                        {key}
                      </span>
                    ))}
                    {(form.moduleKeys ?? []).length === 0 && (
                      <span className="text-xs text-neutral-400">Sin módulos seleccionados</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Aviso de no-email */}
              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-200 dark:border-blue-500/20">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                  No se enviará email de bienvenida. Comparte las credenciales manualmente con el administrador del tenant.
                </p>
              </div>
            </div>
          )}

          {/* Error global */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-200 dark:border-red-500/20">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
              <p className="text-xs text-red-700 dark:text-red-300 font-medium">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-neutral-200 dark:border-neutral-800 shrink-0">
          <button
            type="button"
            onClick={step === 'cuenta' ? onClose : goPrev}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            {step === 'cuenta' ? (
              <>Cancelar</>
            ) : (
              <><ChevronLeft className="h-4 w-4" /> Anterior</>
            )}
          </button>

          {step !== 'confirmar' ? (
            <button
              type="button"
              onClick={goNext}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-6 py-2.5 bg-neutral-950 dark:bg-white text-white dark:text-black text-sm font-black rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
            >
              Siguiente <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white text-sm font-black rounded-xl disabled:opacity-40 hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/25"
            >
              {isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Creando...</>
              ) : (
                <><CheckCircle2 className="h-4 w-4" /> Crear Tenant</>
              )}
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .input-field {
          width: 100%;
          padding: 0.625rem 0.875rem;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: #111827;
          outline: none;
          transition: all 0.15s;
        }
        .input-field:focus {
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }
        :global(.dark) .input-field {
          background: #0a0a0a;
          border-color: #262626;
          color: white;
        }
        :global(.dark) .input-field:focus {
          border-color: #10b981;
        }
      `}</style>
    </div>
  );
}
