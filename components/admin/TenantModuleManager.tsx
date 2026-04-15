'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Building2, ChevronDown, Users, Loader2,
  Power, PowerOff, Zap, Trash2, AlertTriangle,
  LayoutDashboard, Activity, CreditCard, Shield,
  CalendarDays, User2, Mail, Clock, TrendingUp,
  FileText, ShoppingCart, DollarSign, Package,
  CheckCircle2, XCircle, Download,
  MapPin, Navigation, Globe, Receipt,
} from 'lucide-react';
import { MODULE_DEFS, type ModuleKey } from '@/lib/modules/registry';
import {
  toggleTenantModule,
  activateAllModules,
  deactivateAllModules,
  deleteTenant,
} from '@/app/(dashboard)/admin/actions';

// ─── Types ─────────────────────────────────────────────────────────────────

interface TenantUser {
  name: string;
  email: string;
  role: string;
  createdAt?: string;
}

interface TenantData {
  id: string;
  name: string;
  rfc: string | null;
  legalName: string | null;
  personType: string | null;
  zipCode: string | null;
  registroPatronal: string | null;
  onboardingComplete: boolean;
  // Geocerca
  workLat: number | null;
  workLon: number | null;
  workAddress: string | null;
  radioToleranceMeters: number;
  // Stripe
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  // Régimen fiscal
  taxRegimeCode: string | null;
  taxRegimeDescription: string | null;
  createdAt: string;
  userCount: number;
  users: TenantUser[];
  modules: { id: string; moduleKey: string; isActive: boolean }[];
  subscriptionStatus: string | null;
  subscriptionValidUntil?: string | null;
  subscriptionPlan?: string | null;
}

interface Props {
  tenant: TenantData;
}

type Tab = 'resumen' | 'modulos' | 'usuarios' | 'actividad';

const ALL_MODULE_KEYS: ModuleKey[] = [
  'DASHBOARD', 'CALENDAR', 'BI',
  'HCM', 'PAYROLL', 'TALENT',
  'FINANCE', 'TAXES', 'COLLECTIONS',
  'BILLING_CFDI', 'POS',
  'CRM', 'MARKETING', 'SUPPORT',
  'SCM', 'INVENTORY', 'LOGISTICS',
  'MRP', 'QUALITY', 'PROJECTS',
];

// ─── Mock log generator (deterministic from tenant.id) ────────────────────

function generateMockLogs(tenantId: string, tenantName: string) {
  // Simple seeded hash for deterministic output
  const hash = (s: string, i: number) => {
    let h = i * 1000
    for (const c of s) h = (h * 31 + c.charCodeAt(0)) & 0xfffffff
    return Math.abs(h)
  }

  const actions = [
    { icon: User2,       color: 'text-blue-500',    text: (i: number) => `Usuario ${['Ana López', 'Carlos García', 'María Torres', 'Roberto Díaz'][hash(tenantId, i) % 4]} inició sesión` },
    { icon: FileText,    color: 'text-emerald-500',  text: (i: number) => `CFDI #${3000 + hash(tenantId, i) % 999} timbrado exitosamente` },
    { icon: ShoppingCart,color: 'text-orange-500',   text: (i: number) => `Venta POS por $${(hash(tenantId, i) % 9800) + 200}.00 completada` },
    { icon: DollarSign,  color: 'text-violet-500',   text: (i: number) => `Póliza contable #${200 + hash(tenantId, i) % 300} generada` },
    { icon: Package,     color: 'text-cyan-500',     text: (i: number) => `Inventario actualizado — SKU-${1000 + hash(tenantId, i) % 500}` },
    { icon: Shield,      color: 'text-rose-500',     text: (i: number) => `Módulo ${['BILLING_CFDI', 'POS', 'CRM', 'FINANCE'][hash(tenantId, i) % 4]} ${hash(tenantId, i) % 2 === 0 ? 'activado' : 'configurado'}` },
    { icon: TrendingUp,  color: 'text-amber-500',    text: (i: number) => `Reporte mensual generado por ${['administrador', 'contador'][hash(tenantId, i) % 2]}` },
    { icon: Mail,        color: 'text-indigo-500',   text: (i: number) => `Correo de CFDI enviado a cliente@empresa${hash(tenantId, i) % 10}.com` },
  ]

  const minutesAgo = [3, 12, 28, 47, 95, 183, 310, 462, 720, 1440]

  return Array.from({ length: 10 }, (_, i) => {
    const actionIdx = hash(tenantId, i * 7) % actions.length
    const action    = actions[actionIdx]
    const mins      = minutesAgo[i]
    const timeLabel =
      mins < 60 ? `hace ${mins} min` :
      mins < 1440 ? `hace ${Math.floor(mins / 60)}h` :
      'hace 1 día'
    return {
      key:       `${tenantId}-log-${i}`,
      icon:      action.icon,
      color:     action.color,
      text:      action.text(i * 3 + hash(tenantId, i)),
      timeLabel,
    }
  })
}

// ─── Sub-components ───────────────────────────────────────────────────────

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
        active
          ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-sm'
          : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
      }`}
    >
      {children}
    </button>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────

export default function TenantModuleManager({ tenant }: Props) {
  const [isOpen, setIsOpen]          = useState(false)
  const [tab, setTab]                = useState<Tab>('resumen')
  const [isPending, startTransition] = useTransition()
  const [optimisticModules, setOptimisticModules] = useState(tenant.modules)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError]     = useState('')
  const [showPersonalInfo, setShowPersonalInfo] = useState<string | null>(null)

  const SUPER_ADMIN_EMAIL    = '553angelortiz@gmail.com'
  const isSuperAdminTenant   = tenant.users.some(u => u.email === SUPER_ADMIN_EMAIL)
  const activeCount          = optimisticModules.filter(m => m.isActive).length

  const subColor =
    tenant.subscriptionStatus === 'ACTIVE'   ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
    tenant.subscriptionStatus === 'TRIAL'    ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
    tenant.subscriptionStatus === 'SUSPENDED'? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
    'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'

  const mockLogs = generateMockLogs(tenant.id, tenant.name)

  // ── Module handlers ─────────────────────────────────────

  const handleToggle = (moduleKey: string, currentActive: boolean) => {
    setOptimisticModules(prev => {
      const existing = prev.find(m => m.moduleKey === moduleKey)
      if (existing) return prev.map(m => m.moduleKey === moduleKey ? { ...m, isActive: !currentActive } : m)
      return [...prev, { id: 'temp', moduleKey, isActive: true }]
    })
    startTransition(async () => {
      try { await toggleTenantModule(tenant.id, moduleKey, !currentActive) }
      catch { setOptimisticModules(tenant.modules) }
    })
  }

  const handleActivateAll = () => {
    setOptimisticModules(ALL_MODULE_KEYS.map(key => ({ id: 'temp', moduleKey: key, isActive: true })))
    startTransition(async () => {
      try { await activateAllModules(tenant.id) }
      catch { setOptimisticModules(tenant.modules) }
    })
  }

  const handleDeactivateAll = () => {
    setOptimisticModules(prev => prev.map(m => ({ ...m, isActive: false })))
    startTransition(async () => {
      try { await deactivateAllModules(tenant.id) }
      catch { setOptimisticModules(tenant.modules) }
    })
  }

  const handleDelete = async () => {
    setDeleteLoading(true)
    setDeleteError('')
    const result = await deleteTenant(tenant.id)
    if (!result.success) {
      setDeleteError(result.error ?? 'Error desconocido')
      setDeleteLoading(false)
      setDeleteConfirm(false)
    }
  }

  const isModuleActive = (key: string) => optimisticModules.find(m => m.moduleKey === key)?.isActive ?? false

  // Formatted dates
  const createdDate      = new Date(tenant.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
  const validUntilDate   = tenant.subscriptionValidUntil
    ? new Date(tenant.subscriptionValidUntil).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
    : null

  const daysLeft = tenant.subscriptionValidUntil
    ? Math.ceil((new Date(tenant.subscriptionValidUntil).getTime() - Date.now()) / 86400000)
    : null

  // ── Render ──────────────────────────────────────────────

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden transition-all">

      {/* ── Header ── */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className="w-full flex items-center justify-between p-5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/20 dark:from-blue-500/20 dark:to-blue-600/30 flex items-center justify-center flex-shrink-0">
            <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-black text-neutral-900 dark:text-white text-base">{tenant.name}</h3>
            <div className="flex flex-wrap items-center gap-2.5 mt-1">
              {tenant.rfc && (
                <span className="text-[11px] font-mono text-neutral-500">RFC: {tenant.rfc}</span>
              )}
              <span className="flex items-center gap-1 text-[11px] text-neutral-500">
                <Users className="h-3 w-3" />
                {tenant.userCount} usuario{tenant.userCount !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-neutral-500">
                <CalendarDays className="h-3 w-3" />
                {createdDate}
              </span>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${subColor}`}>
                {tenant.subscriptionStatus ?? 'Sin plan'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-sm font-bold text-neutral-500">
            {activeCount}/{ALL_MODULE_KEYS.length} mód.
          </span>
          {isPending && <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />}
          <ChevronDown className={`h-5 w-5 text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* ── Expanded panel ── */}
      {isOpen && (
        <div className="border-t border-neutral-200 dark:border-neutral-800 animate-in fade-in slide-in-from-top-2 duration-200">

          {/* Tab bar */}
          <div className="flex items-center gap-1 px-5 py-3 bg-neutral-50 dark:bg-neutral-800/40 border-b border-neutral-200 dark:border-neutral-800">
            <TabBtn active={tab === 'resumen'}   onClick={() => setTab('resumen')}>
              <span className="flex items-center gap-1.5"><LayoutDashboard className="h-3 w-3" />Resumen</span>
            </TabBtn>
            <TabBtn active={tab === 'modulos'}   onClick={() => setTab('modulos')}>
              <span className="flex items-center gap-1.5"><Zap className="h-3 w-3" />Módulos ({activeCount})</span>
            </TabBtn>
            <TabBtn active={tab === 'usuarios'}  onClick={() => setTab('usuarios')}>
              <span className="flex items-center gap-1.5"><Users className="h-3 w-3" />Usuarios ({tenant.userCount})</span>
            </TabBtn>
            <TabBtn active={tab === 'actividad'} onClick={() => setTab('actividad')}>
              <span className="flex items-center gap-1.5"><Activity className="h-3 w-3" />Actividad</span>
            </TabBtn>
          </div>

          <div className="p-5">

            {/* ─── TAB: RESUMEN ─────────────────────────────── */}
            {tab === 'resumen' && (
              <div className="space-y-5">

                {/* Quick stats grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { icon: Users,        label: 'Usuarios',        value: String(tenant.userCount),     color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-500/10' },
                    { icon: Zap,          label: 'Módulos activos', value: `${activeCount}/${ALL_MODULE_KEYS.length}`, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
                    { icon: CreditCard,   label: 'Suscripción',     value: tenant.subscriptionStatus ?? 'N/A', color: 'text-violet-600',  bg: 'bg-violet-50 dark:bg-violet-500/10' },
                    { icon: CalendarDays, label: 'Vence',           value: daysLeft !== null ? `${daysLeft > 0 ? daysLeft : 0} días` : 'N/A', color: daysLeft !== null && daysLeft <= 5 ? 'text-red-600' : 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10' },
                  ].map(({ icon: Icon, label, value, color, bg }) => (
                    <div key={label} className="bg-white dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl p-3.5">
                      <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-2`}>
                        <Icon className={`h-4 w-4 ${color}`} />
                      </div>
                      <p className="text-xs text-neutral-500 mb-0.5">{label}</p>
                      <p className={`text-sm font-black ${color}`}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* ── Datos fiscales ─────────────────────────────── */}
                <div className="bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4">
                  <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Receipt className="h-3 w-3" />
                    Información Fiscal
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-[10px] text-neutral-400 uppercase tracking-wider">RFC</p>
                      <p className="font-mono font-bold text-neutral-700 dark:text-neutral-300">{tenant.rfc ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-400 uppercase tracking-wider">Razón Social</p>
                      <p className="font-bold text-neutral-700 dark:text-neutral-300 truncate">{tenant.legalName ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-400 uppercase tracking-wider">Tipo Persona</p>
                      <p className="font-bold text-neutral-700 dark:text-neutral-300">{tenant.personType ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-400 uppercase tracking-wider">C.P. Fiscal</p>
                      <p className="font-bold text-neutral-700 dark:text-neutral-300">{tenant.zipCode ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-400 uppercase tracking-wider">Régimen Fiscal</p>
                      <p className="font-bold text-neutral-700 dark:text-neutral-300 truncate" title={tenant.taxRegimeDescription ?? ''}>
                        {tenant.taxRegimeCode ? `${tenant.taxRegimeCode} – ${tenant.taxRegimeDescription ?? ''}` : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-400 uppercase tracking-wider">Reg. Patronal</p>
                      <p className="font-mono font-bold text-neutral-700 dark:text-neutral-300">{tenant.registroPatronal ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-400 uppercase tracking-wider">Onboarding</p>
                      <span className={`inline-flex items-center gap-1 text-xs font-bold ${tenant.onboardingComplete ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {tenant.onboardingComplete
                          ? <><CheckCircle2 className="h-3.5 w-3.5" />Completo</>
                          : <><XCircle className="h-3.5 w-3.5" />Pendiente</>}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── Suscripción y Stripe ───────────────────────── */}
                {(tenant.subscriptionPlan || validUntilDate || tenant.stripeCustomerId) && (
                  <div className="bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4">
                    <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <CreditCard className="h-3 w-3" />
                      Suscripción y Pagos
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      {tenant.subscriptionPlan && (
                        <div>
                          <p className="text-[10px] text-neutral-400 uppercase tracking-wider">Plan</p>
                          <p className="font-bold text-neutral-700 dark:text-neutral-300">{tenant.subscriptionPlan}</p>
                        </div>
                      )}
                      {validUntilDate && (
                        <div>
                          <p className="text-[10px] text-neutral-400 uppercase tracking-wider">Vigente hasta</p>
                          <p className={`font-bold ${daysLeft !== null && daysLeft <= 5 ? 'text-red-600' : 'text-neutral-700 dark:text-neutral-300'}`}>{validUntilDate}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-[10px] text-neutral-400 uppercase tracking-wider">Registro</p>
                        <p className="font-bold text-neutral-700 dark:text-neutral-300">{createdDate}</p>
                      </div>
                      {tenant.stripeCustomerId && (
                        <div className="col-span-2 md:col-span-3">
                          <p className="text-[10px] text-neutral-400 uppercase tracking-wider">Stripe Customer ID</p>
                          <p className="font-mono text-xs text-neutral-500 dark:text-neutral-400 break-all">{tenant.stripeCustomerId}</p>
                        </div>
                      )}
                      {tenant.stripeSubscriptionId && (
                        <div className="col-span-2 md:col-span-3">
                          <p className="text-[10px] text-neutral-400 uppercase tracking-wider">Stripe Subscription ID</p>
                          <p className="font-mono text-xs text-neutral-500 dark:text-neutral-400 break-all">{tenant.stripeSubscriptionId}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Geolocalización / Geocerca ─────────────────── */}
                <div className="bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4">
                  <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" />
                    Geolocalización de Trabajo
                  </p>
                  {tenant.workLat !== null && tenant.workLon !== null ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-[10px] text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                          <Navigation className="h-2.5 w-2.5" />Latitud
                        </p>
                        <p className="font-mono font-bold text-neutral-700 dark:text-neutral-300">{tenant.workLat.toFixed(6)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                          <Navigation className="h-2.5 w-2.5 rotate-90" />Longitud
                        </p>
                        <p className="font-mono font-bold text-neutral-700 dark:text-neutral-300">{tenant.workLon.toFixed(6)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                          <MapPin className="h-2.5 w-2.5" />Radio (m)
                        </p>
                        <p className="font-bold text-neutral-700 dark:text-neutral-300">{tenant.radioToleranceMeters} m</p>
                      </div>
                      {tenant.workAddress && (
                        <div className="col-span-2 md:col-span-4">
                          <p className="text-[10px] text-neutral-400 uppercase tracking-wider">Dirección</p>
                          <p className="font-bold text-neutral-700 dark:text-neutral-300">{tenant.workAddress}</p>
                        </div>
                      )}
                      <div className="col-span-2 md:col-span-4">
                        <a
                          href={`https://maps.google.com/?q=${tenant.workLat},${tenant.workLon}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                        >
                          <Globe className="h-3 w-3" />
                          Ver en Google Maps
                        </a>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-400">Sin geocerca configurada</p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/dashboard"
                    target="_blank"
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                  >
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    Ver Dashboard
                  </Link>
                  <Link
                    href={`/api/reports/ejecutivo-mensual`}
                    target="_blank"
                    className="flex items-center gap-2 px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-bold rounded-xl transition-colors border border-neutral-200 dark:border-neutral-700"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Generar Reporte PDF
                  </Link>
                </div>

              </div>
            )}

            {/* ─── TAB: MÓDULOS ─────────────────────────────── */}
            {tab === 'modulos' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <button onClick={handleActivateAll} disabled={isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-xs rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors disabled:opacity-50">
                    <Zap className="h-3.5 w-3.5" />
                    Activar Todos
                  </button>
                  <button onClick={handleDeactivateAll} disabled={isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-bold text-xs rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors disabled:opacity-50">
                    <PowerOff className="h-3.5 w-3.5" />
                    Desactivar Todos
                  </button>
                  {isPending && <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {ALL_MODULE_KEYS.map(key => {
                    const def    = MODULE_DEFS[key]
                    const active = isModuleActive(key)
                    return (
                      <button key={key} onClick={() => handleToggle(key, active)} disabled={isPending}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all disabled:opacity-60 ${
                          active
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30'
                            : 'bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700 opacity-60 hover:opacity-100'
                        }`}>
                        <div className={`p-1.5 rounded-lg ${active ? 'bg-emerald-100 dark:bg-emerald-500/20' : 'bg-neutral-200 dark:bg-neutral-700'}`}>
                          {active
                            ? <Power    className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            : <PowerOff className="h-3.5 w-3.5 text-neutral-400" />}
                        </div>
                        <p className={`text-xs font-bold truncate ${active ? 'text-emerald-900 dark:text-emerald-300' : 'text-neutral-500'}`}>
                          {def.label}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ─── TAB: USUARIOS ────────────────────────────── */}
            {tab === 'usuarios' && (
              <div className="space-y-2">
                {tenant.users.length === 0 ? (
                  <p className="text-sm text-neutral-400 text-center py-6">Sin usuarios registrados</p>
                ) : (
                  tenant.users.map(user => {
                    const isShowing = showPersonalInfo === user.email
                    const initials  = (user.name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
                    const joinDate  = user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
                      : null
                    const roleColor =
                      user.role === 'ADMIN'     ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                      user.role === 'MANAGER'   ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400' :
                      'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400'

                    return (
                      <div key={user.email} className="bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden">
                        <div className="flex items-center gap-3 p-3.5">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-black shadow-sm flex-shrink-0">
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200 truncate">{user.name}</p>
                              <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full ${roleColor}`}>{user.role}</span>
                            </div>
                            <p className="text-xs text-neutral-500 truncate mt-0.5">{user.email}</p>
                          </div>
                          <button
                            onClick={() => setShowPersonalInfo(isShowing ? null : user.email)}
                            className="text-xs text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 font-semibold flex-shrink-0 transition-colors"
                          >
                            {isShowing ? 'Ocultar' : 'Ver info'}
                          </button>
                        </div>

                        {isShowing && (
                          <div className="px-3.5 pb-3.5 border-t border-neutral-200 dark:border-neutral-700 pt-3">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              <div>
                                <p className="text-[10px] text-neutral-400 uppercase tracking-wider flex items-center gap-1 mb-0.5">
                                  <Mail className="h-3 w-3" />Correo
                                </p>
                                <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300 break-all">{user.email}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-neutral-400 uppercase tracking-wider flex items-center gap-1 mb-0.5">
                                  <Shield className="h-3 w-3" />Rol
                                </p>
                                <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{user.role}</p>
                              </div>
                              {joinDate && (
                                <div>
                                  <p className="text-[10px] text-neutral-400 uppercase tracking-wider flex items-center gap-1 mb-0.5">
                                    <CalendarDays className="h-3 w-3" />Registro
                                  </p>
                                  <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{joinDate}</p>
                                </div>
                              )}
                              <div>
                                <p className="text-[10px] text-neutral-400 uppercase tracking-wider flex items-center gap-1 mb-0.5">
                                  <CheckCircle2 className="h-3 w-3" />Estado
                                </p>
                                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Activo</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-neutral-400 uppercase tracking-wider flex items-center gap-1 mb-0.5">
                                  <User2 className="h-3 w-3" />ID
                                </p>
                                <p className="text-[10px] font-mono text-neutral-500 truncate">{user.email.split('@')[0]}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            )}

            {/* ─── TAB: ACTIVIDAD ───────────────────────────── */}
            {tab === 'actividad' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                    Últimas 10 actividades · Demo
                  </p>
                  <span className="text-[9px] bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Datos ilustrativos
                  </span>
                </div>

                <div className="space-y-1.5">
                  {mockLogs.map(log => {
                    const LogIcon = log.icon
                    return (
                      <div key={log.key} className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors">
                        <div className={`w-7 h-7 rounded-lg bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 flex items-center justify-center flex-shrink-0 shadow-sm`}>
                          <LogIcon className={`h-3.5 w-3.5 ${log.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">{log.text}</p>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-neutral-400 whitespace-nowrap flex-shrink-0">
                          <Clock className="h-3 w-3" />
                          {log.timeLabel}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

          </div>

          {/* ── Danger zone ── */}
          {!isSuperAdminTenant && (
            <div className="px-5 pb-5 border-t border-red-100 dark:border-red-900/30 pt-4 mx-0">
              <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3" />
                Zona de Peligro
              </p>

              {deleteError && (
                <div className="mb-3 p-2.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-xs text-red-600 dark:text-red-400">
                  {deleteError}
                </div>
              )}

              {!deleteConfirm ? (
                <button
                  onClick={() => { setDeleteConfirm(true); setDeleteError('') }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-bold text-xs rounded-xl border border-red-200 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Eliminar Tenant Definitivamente
                </button>
              ) : (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-black text-red-700 dark:text-red-400">¿Confirmas la eliminación permanente?</p>
                      <p className="text-xs text-red-600/80 dark:text-red-400/70 mt-1 leading-relaxed">
                        Se eliminarán <strong>{tenant.userCount} usuario{tenant.userCount !== 1 ? 's' : ''}</strong>, todos los módulos,
                        datos financieros y registros de <strong>{tenant.name}</strong>. Esta acción <strong>NO se puede deshacer</strong>.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={handleDelete} disabled={deleteLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-colors disabled:opacity-60">
                      {deleteLoading
                        ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Eliminando…</>
                        : <><Trash2 className="h-3.5 w-3.5" />Sí, eliminar permanentemente</>}
                    </button>
                    <button onClick={() => { setDeleteConfirm(false); setDeleteError('') }} disabled={deleteLoading}
                      className="px-4 py-2 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 font-medium transition-colors disabled:opacity-50">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  )
}
