'use client';

import { useState } from 'react';
import { User, Shield, Building2, Globe, Camera, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClient } from '@/utils/supabase/client';
import { updateProfile, updateSecurity, leaveTenant, updatePreferences } from './actions';
import { toast } from 'sonner';
import Link from 'next/link';

const profileSchema = z.object({
  name: z.string().min(2, 'El nombre es muy corto'),
  avatarUrl: z.string().optional(),
});

const securitySchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres').optional().or(z.literal('')),
});

interface ProfileClientProps {
  initialUser: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    timezone: string;
    twoFactorEnabled: boolean;
  };
  memberships: Array<{
    id: string;
    role: string;
    tenant: { id: string; name: string; rfc: string | null };
  }>;
}

export default function ProfileClient({ initialUser, memberships }: ProfileClientProps) {
  const supabase = createClient();
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingSecurity, setIsUpdatingSecurity] = useState(false);
  const [isUpdatingMfa, setIsUpdatingMfa] = useState(false);
  const [mfaQr, setMfaQr] = useState<string | null>(null);

  // Card 1: Identidad
  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: initialUser.name || '',
      avatarUrl: initialUser.avatarUrl || '',
    },
  });

  const onUpdateProfile = async (data: z.infer<typeof profileSchema>) => {
    setIsUpdatingProfile(true);
    const res = await updateProfile(data);
    setIsUpdatingProfile(false);
    if (res.ok) toast.success('Perfil actualizado');
    else toast.error(res.error);
  };

  // Subida de Avatar (Compresión simple en cliente con canvas si fuera necesario, 
  // pero aquí usaremos el SDK de Supabase directamente conforme al plan)
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${initialUser.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      profileForm.setValue('avatarUrl', publicUrl);
      await updateProfile({ name: profileForm.getValues('name'), avatarUrl: publicUrl });
      toast.success('Foto actualizada');
    } catch (err) {
      toast.error('Error al subir imagen');
    }
  };

  // Card 2: Seguridad
  const securityForm = useForm({
    resolver: zodResolver(securitySchema),
    defaultValues: { email: initialUser.email, password: '' },
  });

  const onUpdateSecurity = async (data: z.infer<typeof securitySchema>) => {
    setIsUpdatingSecurity(true);
    const res = await updateSecurity(data);
    setIsUpdatingSecurity(false);
    if (res.ok) toast.success('Seguridad actualizada. Revisa tu email si cambiaste de correo.');
    else toast.error(res.error);
  };

  const handleEnrollMfa = async () => {
    setIsUpdatingMfa(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
      if (error) throw error;
      if (data.totp.qr_code) setMfaQr(data.totp.qr_code);
      toast.success('Factor 2FA generado');
    } catch (err) {
      toast.error('Error al iniciar 2FA');
    } finally {
      setIsUpdatingMfa(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 pb-20">
      
      <div className="flex items-center gap-4 mb-2">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
          <User className="text-emerald-500" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-neutral-900 dark:text-white">Mi Perfil</h1>
          <p className="text-neutral-500 text-sm">Gestiona tu identidad global y seguridad en CIFRA.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* CARD 1: IDENTIDAD */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <Camera className="w-5 h-5 text-neutral-400" />
            <h2 className="text-lg font-bold">Identidad Global</h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-3xl bg-neutral-100 dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 overflow-hidden shrink-0">
                {profileForm.watch('avatarUrl') ? (
                  <img src={profileForm.watch('avatarUrl')!} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-black text-neutral-400">
                    {initialUser.name?.[0].toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl cursor-pointer">
                <Camera className="text-white w-6 h-6" />
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
              </label>
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <label className="text-[10px] uppercase font-black text-neutral-500 ml-1">Nombre Completo</label>
                <input 
                  {...profileForm.register('name')}
                  className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none" 
                />
                {profileForm.formState.errors.name && <p className="text-xs text-red-500 mt-1">{profileForm.formState.errors.name.message}</p>}
              </div>
              <button 
                onClick={profileForm.handleSubmit(onUpdateProfile)}
                disabled={isUpdatingProfile}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {isUpdatingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>

        {/* CARD 2: SEGURIDAD */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-neutral-400" />
            <h2 className="text-lg font-bold">Seguridad</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase font-black text-neutral-500 ml-1">Correo Electrónico</label>
              <input 
                {...securityForm.register('email')}
                className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-sm outline-none" 
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-black text-neutral-500 ml-1">Nueva Contraseña</label>
              <input 
                {...securityForm.register('password')}
                type="password"
                placeholder="Dejar en blanco para no cambiar"
                className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-sm outline-none" 
              />
            </div>
            <button 
              onClick={securityForm.handleSubmit(onUpdateSecurity)}
              disabled={isUpdatingSecurity}
              className="w-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold py-2.5 rounded-xl transition-all"
            >
              Actualizar Accesos
            </button>
            
            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold">Autenticación en dos pasos (2FA)</p>
                  <p className="text-xs text-neutral-500">Agrega una capa extra de protección.</p>
                </div>
                <button 
                  onClick={handleEnrollMfa}
                  disabled={isUpdatingMfa || initialUser.twoFactorEnabled}
                  className={`px-4 py-2 text-xs font-bold rounded-full transition-all ${initialUser.twoFactorEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                >
                  {initialUser.twoFactorEnabled ? 'Configurado' : 'Configurar'}
                </button>
              </div>
              {mfaQr && (
                <div className="mt-4 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-2xl flex flex-col items-center gap-3">
                  <p className="text-[10px] font-bold text-neutral-500 uppercase">Escanea con Autenticador</p>
                  <img src={mfaQr} className="w-32 h-32 bg-white p-2 rounded-xl" />
                  <p className="text-[9px] text-center opacity-70">Guarda este QR, no lo compartas con nadie.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CARD 3: MEMBRESÍAS */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-neutral-400" />
            <h2 className="text-lg font-bold">Mis Empresas</h2>
          </div>
          
          <div className="space-y-3">
            {memberships.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 rounded-2xl">
                <div>
                  <p className="text-sm font-bold">{m.tenant.name}</p>
                  <p className="text-[10px] text-neutral-500 uppercase font-mono">{m.tenant.rfc || 'Sin RFC'} • {m.role}</p>
                </div>
                <button 
                  onClick={() => leaveTenant(m.id)}
                  className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors"
                >
                  Abandonar
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* CARD 4: PREFERENCIAS */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-neutral-400" />
            <h2 className="text-lg font-bold">Preferencias</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase font-black text-neutral-500 ml-1">Zona Horaria</label>
              <select 
                defaultValue={initialUser.timezone}
                onChange={(e) => updatePreferences(e.target.value)}
                className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-sm outline-none"
              >
                <option value="America/Mexico_City">Ciudad de México (CST)</option>
                <option value="America/Tijuana">Tijuana (PST)</option>
                <option value="America/Bogota">Bogotá (EST)</option>
                <option value="UTC">UTC / Universal</option>
              </select>
            </div>
            
            <div className="p-4 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-100 dark:border-yellow-900/30 rounded-2xl flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0" />
              <p className="text-[11px] text-yellow-700 dark:text-yellow-400 leading-relaxed font-medium">
                La zona horaria afecta cómo ves las fechas en reportes y el reloj checador.
              </p>
            </div>
          </div>
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
