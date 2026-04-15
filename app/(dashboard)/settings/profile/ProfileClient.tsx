'use client';

import { useState } from 'react';
import {
  User, Shield, Building2, Globe, Camera, Check, AlertCircle, Loader2,
  ChevronDown, Plus, Pencil, LogOut, KeyRound, Phone, Mail, Blocks, X,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import {
  updateProfile, updatePassword, updateContactInfo,
  createCompany, updateCompany, leaveTenant,
  toggleModule, updatePreferences,
} from './actions';
import { toast } from 'sonner';
import Link from 'next/link';
import { MODULE_DEFS } from '@/lib/modules/registry';
import { ModuleKey } from '@prisma/client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TenantModule { moduleKey: string; isActive: boolean }

interface Membership {
  id: string;
  role: string;
  tenant: { id: string; name: string; rfc: string | null; modules: TenantModule[] };
}

interface Props {
  initialUser: {
    id: string; email: string; name: string | null; avatarUrl: string | null;
    timezone: string; twoFactorEnabled: boolean; phone: string | null;
  };
  memberships: Membership[];
  activeTenantId: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const cardCls = 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm';
const inputCls = 'w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all';
const labelCls = 'text-[10px] uppercase font-black text-neutral-500 ml-1 block mb-1.5';
const btnPrimary = 'bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm';
const btnSecondary = 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold py-2.5 px-4 rounded-xl transition-all flex items-center gap-2 text-sm';

function SectionToggle({
  label, icon: Icon, open, onClick,
}: { label: string; icon: React.ElementType; open: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
    >
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-neutral-400" />
        <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">{label}</span>
      </div>
      <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
  );
}

// ─── Card: Identidad ─────────────────────────────────────────────────────────

function IdentidadCard({ user }: { user: Props['initialUser'] }) {
  const supabase = createClient();
  const [name, setName] = useState(user.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [saving, setSaving] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const ext = file.name.split('.').pop();
      const path = `avatars/${user.id}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('profiles').upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('profiles').getPublicUrl(path);
      setAvatarUrl(publicUrl);
      await updateProfile({ name, avatarUrl: publicUrl });
      toast.success('Foto actualizada');
    } catch { toast.error('Error al subir imagen') }
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await updateProfile({ name, avatarUrl });
    setSaving(false);
    if (res.ok) toast.success('Perfil actualizado');
    else toast.error(res.error);
  };

  return (
    <div className={`${cardCls} flex flex-col gap-5`}>
      <div className="flex items-center gap-3">
        <Camera className="w-5 h-5 text-neutral-400" />
        <h2 className="text-lg font-bold">Identidad</h2>
      </div>
      <div className="flex items-center gap-5">
        <div className="relative group shrink-0">
          <div className="w-20 h-20 rounded-3xl bg-neutral-100 dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 overflow-hidden">
            {avatarUrl
              ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-2xl font-black text-neutral-400">{name?.[0]?.toUpperCase() || '?'}</div>}
          </div>
          <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl cursor-pointer">
            <Camera className="text-white w-5 h-5" />
            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
          </label>
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <label className={labelCls}>Nombre Completo</label>
            <input value={name} onChange={e => setName(e.target.value)} className={inputCls} />
          </div>
          <button onClick={handleSave} disabled={saving} className={btnPrimary}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Card: Seguridad ──────────────────────────────────────────────────────────

function SeguridadCard({ user }: { user: Props['initialUser'] }) {
  const supabase = createClient();
  const [openSection, setOpenSection] = useState<'password' | 'contact' | 'mfa' | null>(null);
  const [pw, setPw] = useState(''); const [pw2, setPw2] = useState(''); const [savingPw, setSavingPw] = useState(false);
  const [email, setEmail] = useState(user.email); const [phone, setPhone] = useState(user.phone || ''); const [savingContact, setSavingContact] = useState(false);
  const [savingMfa, setSavingMfa] = useState(false); const [mfaQr, setMfaQr] = useState<string | null>(null);

  const toggle = (s: typeof openSection) => setOpenSection(prev => prev === s ? null : s);

  const handlePassword = async () => {
    if (pw !== pw2) { toast.error('Las contraseñas no coinciden'); return }
    if (pw.length < 8) { toast.error('Mínimo 8 caracteres'); return }
    setSavingPw(true);
    const res = await updatePassword({ password: pw });
    setSavingPw(false);
    if (res.ok) { toast.success('Contraseña actualizada'); setPw(''); setPw2(''); setOpenSection(null); }
    else toast.error(res.error);
  };

  const handleContact = async () => {
    setSavingContact(true);
    const res = await updateContactInfo({ email, phone });
    setSavingContact(false);
    if (res.ok) toast.success(res.message ?? 'Datos actualizados');
    else toast.error(res.error);
  };

  const handleMfa = async () => {
    setSavingMfa(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
      if (error) throw error;
      if (data.totp.qr_code) setMfaQr(data.totp.qr_code);
      toast.success('Escanea el código QR con tu app autenticadora');
    } catch { toast.error('Error al configurar 2FA') }
    finally { setSavingMfa(false) }
  };

  return (
    <div className={`${cardCls} space-y-3`}>
      <div className="flex items-center gap-3 mb-2">
        <Shield className="w-5 h-5 text-neutral-400" />
        <h2 className="text-lg font-bold">Seguridad</h2>
      </div>

      {/* Cambiar Contraseña */}
      <SectionToggle label="Cambiar contraseña" icon={KeyRound} open={openSection === 'password'} onClick={() => toggle('password')} />
      {openSection === 'password' && (
        <div className="space-y-3 px-1 pb-1 animate-in fade-in slide-in-from-top-1 duration-200">
          <div>
            <label className={labelCls}>Nueva contraseña</label>
            <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Mínimo 8 caracteres" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Confirmar contraseña</label>
            <input type="password" value={pw2} onChange={e => setPw2(e.target.value)} placeholder="Repite la contraseña" className={inputCls} />
          </div>
          <button onClick={handlePassword} disabled={savingPw} className={btnPrimary}>
            {savingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            Actualizar contraseña
          </button>
        </div>
      )}

      {/* Datos de Contacto */}
      <SectionToggle label="Datos de contacto" icon={Phone} open={openSection === 'contact'} onClick={() => toggle('contact')} />
      {openSection === 'contact' && (
        <div className="space-y-3 px-1 pb-1 animate-in fade-in slide-in-from-top-1 duration-200">
          <div>
            <label className={labelCls}>Correo electrónico</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
            <p className="text-[10px] text-neutral-400 mt-1 ml-1">Recibirás un correo de confirmación al cambiar.</p>
          </div>
          <div>
            <label className={labelCls}>Teléfono</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+52 55 1234 5678" className={inputCls} />
          </div>
          <button onClick={handleContact} disabled={savingContact} className={btnPrimary}>
            {savingContact ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            Guardar cambios
          </button>
        </div>
      )}

      {/* 2FA */}
      <SectionToggle label="Autenticación en dos pasos (2FA)" icon={Shield} open={openSection === 'mfa'} onClick={() => toggle('mfa')} />
      {openSection === 'mfa' && (
        <div className="px-1 pb-1 animate-in fade-in slide-in-from-top-1 duration-200">
          {user.twoFactorEnabled ? (
            <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl">
              <Check className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">2FA activo en tu cuenta</span>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-neutral-500 px-1">Agrega una capa extra de protección con una app como Google Authenticator.</p>
              <button onClick={handleMfa} disabled={savingMfa} className={btnPrimary}>
                {savingMfa ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                Configurar 2FA
              </button>
            </div>
          )}
          {mfaQr && (
            <div className="mt-3 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-2xl flex flex-col items-center gap-3">
              <p className="text-[10px] font-bold text-neutral-500 uppercase">Escanea con tu app autenticadora</p>
              <img src={mfaQr} className="w-32 h-32 bg-white p-2 rounded-xl" alt="QR 2FA" />
              <p className="text-[9px] text-center opacity-60">Guarda este QR. No lo compartas.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Card: Mis Empresas ────────────────────────────────────────────────────────

function EmpresasCard({ memberships, activeTenantId }: { memberships: Membership[]; activeTenantId: string | null }) {
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formRfc, setFormRfc] = useState('');
  const [saving, setSaving] = useState(false);

  const startEdit = (m: Membership) => {
    setEditId(m.tenant.id);
    setFormName(m.tenant.name);
    setFormRfc(m.tenant.rfc || '');
    setShowCreate(false);
  };

  const startCreate = () => { setEditId(null); setFormName(''); setFormRfc(''); setShowCreate(true); };
  const cancelForm = () => { setShowCreate(false); setEditId(null); };

  const handleSave = async () => {
    setSaving(true);
    const res = editId
      ? await updateCompany(editId, { name: formName, rfc: formRfc })
      : await createCompany({ name: formName, rfc: formRfc });
    setSaving(false);
    if (res.ok) { toast.success(editId ? 'Empresa actualizada' : 'Empresa creada'); cancelForm(); }
    else toast.error(res.error);
  };

  const handleLeave = async (membershipId: string, tenantName: string) => {
    if (!confirm(`¿Abandonar "${tenantName}"?`)) return;
    const res = await leaveTenant(membershipId);
    if (res.ok) toast.success('Has abandonado la empresa');
    else toast.error(res.error);
  };

  return (
    <div className={`${cardCls} space-y-4`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-neutral-400" />
          <h2 className="text-lg font-bold">Mis Empresas</h2>
        </div>
        <button onClick={startCreate} className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
          <Plus className="w-4 h-4" /> Registrar
        </button>
      </div>

      {/* Create / Edit form */}
      {(showCreate || editId) && (
        <div className="border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-500/5 rounded-2xl p-4 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{editId ? 'Editar empresa' : 'Nueva empresa'}</p>
          <div>
            <label className={labelCls}>Nombre comercial</label>
            <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Mi Empresa S.A. de C.V." className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>RFC (opcional)</label>
            <input value={formRfc} onChange={e => setFormRfc(e.target.value.toUpperCase())} placeholder="XAXX010101000" className={`${inputCls} font-mono`} maxLength={13} />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className={btnPrimary}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {editId ? 'Actualizar' : 'Crear empresa'}
            </button>
            <button onClick={cancelForm} className={btnSecondary}><X className="w-4 h-4" /> Cancelar</button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {memberships.length === 0 && (
          <p className="text-xs text-neutral-400 text-center py-4">Sin empresas registradas.</p>
        )}
        {memberships.map((m) => (
          <div key={m.id} className={`flex items-center justify-between p-4 border rounded-2xl transition-all ${m.tenant.id === activeTenantId ? 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-800/40' : 'bg-neutral-50 dark:bg-neutral-800/50 border-neutral-100 dark:border-neutral-800'}`}>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold truncate">{m.tenant.name}</p>
                {m.tenant.id === activeTenantId && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 uppercase shrink-0">Activa</span>
                )}
              </div>
              <p className="text-[10px] text-neutral-500 font-mono uppercase">{m.tenant.rfc || 'Sin RFC'} • {m.role}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              {m.role === 'ADMIN' && (
                <button onClick={() => startEdit(m)} className="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl transition-all" title="Editar">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
              <button onClick={() => handleLeave(m.id, m.tenant.name)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all" title="Abandonar">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Card: Módulos ────────────────────────────────────────────────────────────

const MODULE_PRICES: Partial<Record<string, string>> = {
  DASHBOARD: 'Incluido', BILLING_CFDI: 'Incluido', POS: 'Incluido', CRM: 'Incluido',
  CALENDAR: '$299/mes', BI: '$599/mes', HCM: '$499/mes', PAYROLL: '$699/mes',
  TALENT: '$399/mes', FINANCE: '$799/mes', TAXES: '$499/mes', COLLECTIONS: '$399/mes',
  MARKETING: '$399/mes', SUPPORT: '$299/mes', SCM: '$599/mes', INVENTORY: '$499/mes',
  LOGISTICS: '$399/mes', MRP: '$799/mes', QUALITY: '$399/mes', PROJECTS: '$499/mes',
};

function ModulosCard({ memberships, activeTenantId }: { memberships: Membership[]; activeTenantId: string | null }) {
  const activeMembership = memberships.find(m => m.tenant.id === activeTenantId) ?? memberships[0];
  const [toggling, setToggling] = useState<string | null>(null);

  if (!activeMembership) {
    return (
      <div className={`${cardCls} space-y-4`}>
        <div className="flex items-center gap-3"><Blocks className="w-5 h-5 text-neutral-400" /><h2 className="text-lg font-bold">Módulos</h2></div>
        <p className="text-xs text-neutral-400">No hay empresa activa.</p>
      </div>
    );
  }

  const activeMap = new Map(activeMembership.tenant.modules.map(m => [m.moduleKey, m.isActive]));
  const allModules = Object.entries(MODULE_DEFS).map(([key, def]) => ({
    key,
    label: def.label,
    icon: def.icon,
    color: def.color,
    isActive: activeMap.get(key) ?? false,
    price: MODULE_PRICES[key] ?? '$299/mes',
  }));

  const handleToggle = async (moduleKey: string, currentlyActive: boolean) => {
    setToggling(moduleKey);
    const res = await toggleModule(activeMembership.tenant.id, moduleKey as ModuleKey, !currentlyActive);
    setToggling(null);
    if (res.ok) toast.success(currentlyActive ? 'Módulo desactivado' : 'Módulo activado');
    else toast.error(res.error);
  };

  const activeModules = allModules.filter(m => m.isActive);
  const inactiveModules = allModules.filter(m => !m.isActive);

  return (
    <div className={`${cardCls} space-y-5`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Blocks className="w-5 h-5 text-neutral-400" />
          <h2 className="text-lg font-bold">Módulos</h2>
        </div>
        <span className="text-[10px] font-bold px-2 py-1 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-full">{activeModules.length} activos</span>
      </div>

      <p className="text-xs text-neutral-500">
        Empresa: <strong className="text-neutral-700 dark:text-neutral-300">{activeMembership.tenant.name}</strong>
        {activeMembership.role !== 'ADMIN' && <span className="ml-2 text-amber-500">Solo los admins pueden gestionar módulos.</span>}
      </p>

      {/* Active */}
      {activeModules.length > 0 && (
        <div>
          <p className={labelCls}>Módulos activos</p>
          <div className="space-y-2">
            {activeModules.map(m => {
              const Icon = m.icon;
              return (
                <div key={m.key} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${m.color}`} />
                    <span className="text-sm font-medium">{m.label}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 rounded-full">{m.price}</span>
                  </div>
                  {activeMembership.role === 'ADMIN' && m.price !== 'Incluido' && (
                    <button
                      onClick={() => handleToggle(m.key, true)}
                      disabled={toggling === m.key}
                      className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors px-2 py-1 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"
                    >
                      {toggling === m.key ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Desactivar'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available */}
      {inactiveModules.length > 0 && activeMembership.role === 'ADMIN' && (
        <div>
          <p className={labelCls}>Módulos disponibles</p>
          <div className="space-y-2">
            {inactiveModules.map(m => {
              const Icon = m.icon;
              return (
                <div key={m.key} className="flex items-center justify-between p-3 bg-neutral-50/50 dark:bg-neutral-800/30 border border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl opacity-80">
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{m.label}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-700 text-neutral-500 rounded-full">{m.price}</span>
                  </div>
                  <button
                    onClick={() => handleToggle(m.key, false)}
                    disabled={toggling === m.key}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors px-2 py-1 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg"
                  >
                    {toggling === m.key ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Contratar'}
                  </button>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-neutral-400 mt-2 ml-1">Los precios son referenciales. Integración de pagos próximamente.</p>
        </div>
      )}
    </div>
  );
}

// ─── Card: Preferencias ───────────────────────────────────────────────────────

function PreferenciasCard({ user }: { user: Props['initialUser'] }) {
  return (
    <div className={`${cardCls} space-y-4`}>
      <div className="flex items-center gap-3">
        <Globe className="w-5 h-5 text-neutral-400" />
        <h2 className="text-lg font-bold">Preferencias</h2>
      </div>
      <div className="space-y-3">
        <div>
          <label className={labelCls}>Zona Horaria</label>
          <select
            defaultValue={user.timezone}
            onChange={e => updatePreferences(e.target.value)}
            className={inputCls}
          >
            <option value="America/Mexico_City">Ciudad de México (CST)</option>
            <option value="America/Tijuana">Tijuana (PST)</option>
            <option value="America/Bogota">Bogotá (EST)</option>
            <option value="UTC">UTC / Universal</option>
          </select>
        </div>
        <div className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl flex gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed font-medium">
            Afecta fechas en reportes y el reloj checador.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function ProfileClient({ initialUser, memberships, activeTenantId }: Props) {
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 pb-20">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
          <User className="text-emerald-500" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-neutral-900 dark:text-white">Mi Perfil</h1>
          <p className="text-neutral-500 text-sm">Gestiona tu identidad, empresas y módulos en CIFRA.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <IdentidadCard user={initialUser} />
        <SeguridadCard user={initialUser} />
        <EmpresasCard memberships={memberships} activeTenantId={activeTenantId} />
        <ModulosCard memberships={memberships} activeTenantId={activeTenantId} />
        <div className="md:col-span-2">
          <PreferenciasCard user={initialUser} />
        </div>
      </div>

      <footer className="pt-10 border-t border-neutral-100 dark:border-neutral-800">
        <nav className="flex flex-wrap gap-x-6 gap-y-2 justify-center">
          <Link href="/terminos" className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors">Términos y Condiciones</Link>
          <Link href="/privacidad" className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors">Política de Privacidad</Link>
          <Link href="/cookies" className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors">Política de Cookies</Link>
        </nav>
        <p className="text-center text-[10px] text-neutral-400 mt-4 font-mono uppercase tracking-tighter">
          CIFRA ERP — v2026.0.4 • © Ángel Alberto Ortiz Sánchez
        </p>
      </footer>
    </div>
  );
}
