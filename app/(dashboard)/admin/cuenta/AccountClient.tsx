'use client';

import { useState, useTransition } from 'react';
import {
  UserCircle, Shield, CreditCard, Settings, Activity,
  Bell, PenTool, Key, Smartphone, Monitor,
  Download, AlertTriangle, CheckCircle2, LifeBuoy, Command,
  Lock, FileText, Loader2,
} from 'lucide-react';
import { updateTenantProfile, updateUserPassword } from './actions';
import type { TenantProfileData } from './actions';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AccountInitialData {
  tenant: {
    name:        string;
    legalName:   string | null;
    rfc:         string | null;
    taxRegimeId: string | null;
    zipCode:     string | null;
  } | null;
  user: {
    name:  string | null;
    phone: string | null;
  } | null;
  email: string;
}

type TabId = 'perfil' | 'seguridad' | 'facturacion' | 'preferencias' | 'sesiones' | 'notificaciones';

interface Toast {
  type:    'success' | 'error';
  message: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AccountClient({ initialData }: { initialData: AccountInitialData }) {
  const [activeTab, setActiveTab] = useState<TabId>('perfil');
  const [toast, setToast]         = useState<Toast | null>(null);
  const [isPending, startTransition] = useTransition();

  // Perfil form state
  const [name,       setName]       = useState(initialData.tenant?.name        ?? '');
  const [legalName,  setLegalName]  = useState(initialData.tenant?.legalName   ?? '');
  const [rfc,        setRfc]        = useState(initialData.tenant?.rfc         ?? '');
  const [zipCode,    setZipCode]    = useState(initialData.tenant?.zipCode     ?? '');
  const [taxRegime,  setTaxRegime]  = useState(initialData.tenant?.taxRegimeId ?? '');
  const [userName,   setUserName]   = useState(initialData.user?.name          ?? '');
  const [phone,      setPhone]      = useState(initialData.user?.phone         ?? '');

  // Password form state
  const [newPassword,    setNewPassword]    = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  function showToast(type: Toast['type'], message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  // ── Save perfil ──────────────────────────────────────────────────────────
  function handleSavePerfil() {
    const data: TenantProfileData = {
      name, legalName, rfc, zipCode, taxRegimeId: taxRegime, userName, phone,
    };
    startTransition(async () => {
      const res = await updateTenantProfile(data);
      if (res.success) showToast('success', 'Perfil guardado correctamente.');
      else             showToast('error', res.error ?? 'Error al guardar.');
    });
  }

  // ── Change password ──────────────────────────────────────────────────────
  function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      showToast('error', 'Las contraseñas no coinciden.');
      return;
    }
    startTransition(async () => {
      const res = await updateUserPassword(newPassword);
      if (res.success) {
        showToast('success', 'Contraseña actualizada correctamente.');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast('error', res.error ?? 'Error al cambiar la contraseña.');
      }
    });
  }

  const inputCls = 'w-full p-3 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-xl font-bold text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none disabled:opacity-60';
  const monoInputCls = inputCls + ' font-mono';

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-sm font-bold transition-all ${
          toast.type === 'success'
            ? 'bg-emerald-600 text-white'
            : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            : <AlertTriangle className="h-4 w-4 flex-shrink-0" />}
          {toast.message}
        </div>
      )}

      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-neutral-100 dark:bg-black p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 relative">
              <UserCircle className="h-8 w-8 text-neutral-900 dark:text-white" />
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-4 h-4 rounded-full border-2 border-white dark:border-neutral-900" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">Mi Cuenta</h1>
              <p className="text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-widest mt-1">
                Propietario del Sistema · {initialData.email}
              </p>
            </div>
          </div>
          {(activeTab === 'perfil') && (
            <button
              onClick={handleSavePerfil}
              disabled={isPending}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-950 dark:bg-white text-white dark:text-black font-black rounded-xl hover:scale-[1.02] transition-all text-sm disabled:opacity-60"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Guardar Cambios
            </button>
          )}
        </header>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Tab sidebar */}
          <aside className="lg:w-64 flex-shrink-0 space-y-2">
            {([
              { id: 'perfil',          label: 'Identidad y Perfil',   icon: UserCircle },
              { id: 'seguridad',       label: 'Seguridad (2FA)',       icon: Shield     },
              { id: 'facturacion',     label: 'Suscripción CIFRA',     icon: CreditCard },
              { id: 'preferencias',    label: 'Preferencias UI',       icon: Settings   },
              { id: 'sesiones',        label: 'Auditoría Personal',    icon: Activity   },
              { id: 'notificaciones',  label: 'Centro de Alertas',     icon: Bell       },
            ] as { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[]).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-neutral-900 text-emerald-600 dark:text-emerald-400 shadow-sm border border-neutral-200 dark:border-neutral-800'
                    : 'text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-900 border border-transparent'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </aside>

          {/* Content area */}
          <main className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm min-h-[600px]">

            {/* 1. PERFIL E IDENTIDAD */}
            {activeTab === 'perfil' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div>
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white">Perfil Personal</h2>
                  <p className="text-sm text-neutral-500">Nombre, datos fiscales y contacto del propietario del sistema.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="col-span-2 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Nombre Completo</label>
                        <input
                          type="text"
                          value={userName}
                          onChange={e => setUserName(e.target.value)}
                          disabled={isPending}
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Teléfono Móvil</label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          disabled={isPending}
                          className={monoInputCls}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Correo Principal (Inmutable)</label>
                      <div className="flex bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3">
                        <span className="font-mono text-neutral-500 flex-1">{initialData.email}</span>
                        <Lock className="h-4 w-4 text-neutral-400" />
                      </div>
                      <p className="text-[10px] text-neutral-400 mt-1">Para cambiar este correo, contacta a soporte técnico.</p>
                    </div>

                    <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                      <h3 className="text-sm font-black text-neutral-900 dark:text-white mb-3">Datos del Tenant / Empresa</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Nombre de la Empresa</label>
                          <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            disabled={isPending}
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Razón Social (CFDI)</label>
                          <input
                            type="text"
                            value={legalName}
                            onChange={e => setLegalName(e.target.value)}
                            disabled={isPending}
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">RFC</label>
                          <input
                            type="text"
                            value={rfc}
                            onChange={e => setRfc(e.target.value.toUpperCase())}
                            disabled={isPending}
                            maxLength={13}
                            className={monoInputCls}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Código Postal Fiscal</label>
                          <input
                            type="text"
                            value={zipCode}
                            onChange={e => setZipCode(e.target.value)}
                            disabled={isPending}
                            maxLength={5}
                            className={monoInputCls}
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">ID Régimen Fiscal</label>
                          <input
                            type="text"
                            value={taxRegime}
                            onChange={e => setTaxRegime(e.target.value)}
                            disabled={isPending}
                            placeholder="Ej. 601, 612, 630..."
                            className={monoInputCls}
                          />
                          <p className="text-[10px] text-neutral-400 mt-1">Usa el catálogo c_RegimenFiscal del SAT o el ID de la tabla TaxRegime.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Avatar */}
                  <div className="space-y-6">
                    <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 text-center">
                      <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/20 rounded-full mx-auto flex items-center justify-center mb-3 text-emerald-600 dark:text-emerald-400 font-black text-2xl">
                        {(userName || initialData.email).slice(0, 2).toUpperCase()}
                      </div>
                      <button className="text-xs font-bold bg-neutral-100 dark:bg-neutral-800 px-4 py-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700">
                        Cambiar Avatar
                      </button>
                    </div>
                    <div className="border border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl p-4 text-center hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors">
                      <PenTool className="h-5 w-5 text-neutral-400 mx-auto mb-2" />
                      <p className="text-sm font-bold text-neutral-900 dark:text-white">Firma Digital</p>
                      <p className="text-xs text-neutral-500 mt-1">Sube tu trazo en PNG transparente.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. SEGURIDAD */}
            {activeTab === 'seguridad' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div>
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white">Seguridad de la Cuenta</h2>
                  <p className="text-sm text-neutral-500">Capas de protección adicionales para el Propietario del Sistema.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Password */}
                  <div className="p-6 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50 dark:bg-black space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Key className="h-5 w-5 text-neutral-400" />
                      <h3 className="font-bold text-neutral-900 dark:text-white">Contraseña Maestra</h3>
                    </div>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      disabled={isPending}
                      placeholder="Nueva contraseña (mín. 12 caracteres)"
                      className="w-full p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl font-mono text-sm disabled:opacity-60 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      disabled={isPending}
                      placeholder="Confirmar nueva contraseña"
                      className="w-full p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl font-mono text-sm disabled:opacity-60 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="text-xs text-neutral-500">Mínimo 12 caracteres, incluir mayúsculas y símbolos.</p>
                    <button
                      onClick={handleChangePassword}
                      disabled={isPending || !newPassword || !confirmPassword}
                      className="w-full py-2 bg-neutral-900 dark:bg-white text-white dark:text-black font-bold rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Actualizar Contraseña
                    </button>
                  </div>

                  {/* 2FA */}
                  <div className="space-y-4">
                    <div className="flex items-start justify-between p-4 border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl">
                      <div className="pr-4">
                        <p className="font-bold text-emerald-900 dark:text-emerald-100 text-sm flex items-center gap-2">
                          <Smartphone className="h-4 w-4" /> App Autenticadora (2FA)
                        </p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Google Authenticator / Authy.</p>
                      </div>
                      <span className="bg-emerald-500 text-white text-[10px] font-black uppercase px-2 py-1 rounded">Activo</span>
                    </div>
                    <div className="flex items-start justify-between p-4 border border-neutral-200 dark:border-neutral-800 rounded-2xl">
                      <div className="pr-4">
                        <p className="font-bold text-neutral-900 dark:text-white text-sm">Llave de Seguridad (Hardware)</p>
                        <p className="text-xs text-neutral-500 mt-1">Vincular dispositivo YubiKey vía USB/NFC.</p>
                      </div>
                      <button className="text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white underline">Configurar</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. SUSCRIPCIÓN */}
            {activeTab === 'facturacion' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center bg-gradient-to-r from-neutral-900 to-black dark:from-white dark:to-neutral-200 p-6 rounded-2xl text-white dark:text-black">
                  <div>
                    <h3 className="text-sm font-bold opacity-80 uppercase tracking-widest mb-1">Plan Actual</h3>
                    <p className="text-3xl font-black">Enterprise <span className="text-lg font-medium opacity-70">/ Anual</span></p>
                    <p className="text-sm mt-2 opacity-80 flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Próxima renovación: 01/Ene/2027</p>
                  </div>
                  <button className="bg-white text-black dark:bg-black dark:text-white px-6 py-3 rounded-xl font-black text-sm shadow-xl hover:scale-105 transition-transform">
                    Gestionar Plan
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 border border-neutral-200 dark:border-neutral-800 rounded-2xl">
                    <h3 className="font-bold text-neutral-900 dark:text-white mb-4">Historial de Pagos</h3>
                    <div className="space-y-3">
                      {[
                        { date: '01/Ene/2026', amount: '$49,900 MXN' },
                        { date: '01/Ene/2025', amount: '$45,000 MXN' },
                      ].map((inv, i) => (
                        <div key={i} className="flex justify-between items-center p-3 bg-neutral-50 dark:bg-black rounded-xl border border-neutral-100 dark:border-neutral-800">
                          <div>
                            <p className="text-sm font-bold text-neutral-900 dark:text-white">{inv.date}</p>
                            <p className="text-xs text-neutral-500">{inv.amount}</p>
                          </div>
                          <div className="flex gap-2">
                            <button className="p-2 text-neutral-400 hover:text-emerald-500"><FileText className="h-4 w-4" /></button>
                            <button className="p-2 text-neutral-400 hover:text-emerald-500"><Download className="h-4 w-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. PREFERENCIAS */}
            {activeTab === 'preferencias' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h2 className="text-xl font-black text-neutral-900 dark:text-white">Preferencias de Interfaz</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Idioma del Sistema</label>
                    <select className="w-full p-3 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-xl font-bold text-neutral-900 dark:text-white outline-none">
                      <option>Español (México)</option>
                      <option>English (US)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Zona Horaria</label>
                    <select className="w-full p-3 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-xl font-bold text-neutral-900 dark:text-white outline-none">
                      <option>America/Mexico_City (GMT-6)</option>
                    </select>
                  </div>
                </div>
                <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 bg-neutral-50 dark:bg-black">
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                    <Command className="h-4 w-4 text-neutral-400" /> Atajos de Teclado
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-500">Buscador Global</span>
                      <kbd className="px-2 py-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-xs font-mono font-bold">Ctrl + K</kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-500">Nueva Factura</span>
                      <kbd className="px-2 py-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-xs font-mono font-bold">Alt + F</kbd>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. SESIONES */}
            {activeTab === 'sesiones' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-black text-neutral-900 dark:text-white">Sesiones Activas</h2>
                    <p className="text-sm text-neutral-500">Dispositivos con sesión iniciada.</p>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-bold rounded-xl text-sm border border-red-200 dark:border-red-500/20">
                    Cerrar todas las demás
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <Monitor className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                      <div>
                        <p className="font-bold text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
                          Sesión Actual
                          <span className="bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded uppercase font-black">Activa</span>
                        </p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">Ahora mismo</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 6. NOTIFICACIONES */}
            {activeTab === 'notificaciones' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div>
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white">Centro de Alertas</h2>
                  <p className="text-sm text-neutral-500">Controla cómo CIFRA se comunica contigo.</p>
                </div>
                <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-neutral-50 dark:bg-black/50 text-xs uppercase text-neutral-500">
                      <tr>
                        <th className="p-4 font-bold">Tipo de Alerta</th>
                        <th className="p-4 font-bold text-center">Email</th>
                        <th className="p-4 font-bold text-center">Push</th>
                        <th className="p-4 font-bold text-center">SMS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-sm">
                      {['Mantenimiento de Servidor', 'Pagos o Suscripción Fallida', 'Nuevo inicio de sesión (Seguridad)'].map((alert, i) => (
                        <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                          <td className="p-4 font-bold text-neutral-900 dark:text-white">{alert}</td>
                          <td className="p-4 text-center"><input type="checkbox" defaultChecked className="accent-emerald-500 w-4 h-4" /></td>
                          <td className="p-4 text-center"><input type="checkbox" defaultChecked={i !== 0} className="accent-emerald-500 w-4 h-4" /></td>
                          <td className="p-4 text-center"><input type="checkbox" defaultChecked={i === 2} className="accent-emerald-500 w-4 h-4" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <hr className="border-neutral-200 dark:border-neutral-800" />
                {/* Danger Zone */}
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl p-6">
                  <div className="flex items-start gap-4">
                    <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-500 flex-shrink-0" />
                    <div>
                      <h3 className="font-black text-red-900 dark:text-red-400">Zona de Peligro</h3>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-2 mb-4 leading-relaxed">
                        Como Propietario Principal, la eliminación directa está deshabilitada.
                        Debes transferir la propiedad o solicitar el cierre formal a soporte.
                      </p>
                      <div className="flex gap-3">
                        <button className="px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-bold text-neutral-700 dark:text-neutral-300">
                          Transferir Propiedad
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-colors">
                          <LifeBuoy className="h-4 w-4" /> Solicitar Cierre a Soporte
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}
