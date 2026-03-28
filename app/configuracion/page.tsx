'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Save, Building2, Hash, MapPin, FileText, Loader2, CheckCircle2 } from 'lucide-react';

const REGIMENES_FISCALES = [
  { code: '601', name: 'General de Ley Personas Morales' },
  { code: '603', name: 'Personas Morales con Fines no Lucrativos' },
  { code: '605', name: 'Sueldos y Salarios e Ingresos Asimilados a Salarios' },
  { code: '606', name: 'Arrendamiento' },
  { code: '612', name: 'Personas Físicas con Actividades Empresariales y Profesionales' },
  { code: '626', name: 'Régimen Simplificado de Confianza (RESICO)' },
];

export default function ConfiguracionFiscal() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    rfc: '',
    razon_social: '',
    regimen_fiscal_code: '',
    codigo_postal: '',
    email_facturacion: ''
  });

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('client_fiscal_data')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (data) setFormData(data);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { error } = await supabase
        .from('client_fiscal_data')
        .upsert({ user_id: user.id, ...formData });

      if (!error) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    }
    setSaving(false);
  };

  if (loading) return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-emerald-500" /></div>;

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tighter">Configuración Fiscal</h1>
        <p className="text-neutral-500 dark:text-neutral-400 font-medium">Estos datos se utilizarán para generar tus facturas de suscripción a CIFRA.</p>
      </header>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-8 rounded-[2rem] shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-neutral-400 ml-1">RFC</label>
            <div className="relative">
              <Hash className="absolute left-4 top-3 h-4 w-4 text-neutral-400" />
              <input 
                type="text" 
                required
                className="w-full pl-11 pr-4 py-3 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all uppercase"
                value={formData.rfc}
                onChange={(e) => setFormData({...formData, rfc: e.target.value.toUpperCase()})}
                placeholder="XAXX010101000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-neutral-400 ml-1">Código Postal</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-3 h-4 w-4 text-neutral-400" />
              <input 
                type="text" 
                required
                maxLength={5}
                className="w-full pl-11 pr-4 py-3 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                value={formData.codigo_postal}
                onChange={(e) => setFormData({...formData, codigo_postal: e.target.value})}
                placeholder="00000"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase text-neutral-400 ml-1">Nombre o Razón Social</label>
          <div className="relative">
            <Building2 className="absolute left-4 top-3 h-4 w-4 text-neutral-400" />
            <input 
              type="text" 
              required
              className="w-full pl-11 pr-4 py-3 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              value={formData.razon_social}
              onChange={(e) => setFormData({...formData, razon_social: e.target.value})}
              placeholder="Nombre tal cual aparece en tu CSF"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase text-neutral-400 ml-1">Régimen Fiscal</label>
          <div className="relative">
            <FileText className="absolute left-4 top-3 h-4 w-4 text-neutral-400" />
            <select 
              required
              className="w-full pl-11 pr-4 py-3 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all appearance-none"
              value={formData.regimen_fiscal_code}
              onChange={(e) => setFormData({...formData, regimen_fiscal_code: e.target.value})}
            >
              <option value="">Selecciona tu régimen</option>
              {REGIMENES_FISCALES.map(r => (
                <option key={r.code} value={r.code}>{r.code} - {r.name}</option>
              ))}
            </select>
          </div>
        </div>

        <button 
          disabled={saving}
          className="w-full bg-neutral-950 dark:bg-white text-white dark:text-black font-black py-4 rounded-2xl hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : saved ? <CheckCircle2 className="h-5 w-5" /> : <Save className="h-5 w-5" />}
          {saved ? 'Guardado con éxito' : 'Guardar Información'}
        </button>
      </form>
    </div>
  );
}