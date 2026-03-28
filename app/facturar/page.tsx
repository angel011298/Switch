'use client';

import { useState } from 'react';
import { 
  Ticket, Search, CheckCircle2, FileText, Download, 
  Mail, ShieldCheck, AlertCircle, ArrowRight, Building2, 
  HelpCircle, Loader2, FileCheck2
} from 'lucide-react';

// --- CONFIGURACIÓN DE MARCA BLANCA (Simulada desde BD) ---
const orgBranding = {
  name: 'CIFRA Demo S.A.P.I. de C.V.',
  logoUrl: '/logo-dark.png', // Logo de tu empresa
  primaryColor: '#10b981', // Emerald 500
  supportEmail: 'facturacion@adastra.com.mx'
};

// --- CATÁLOGOS SAT (CFDI 4.0) ---
const regimenesFiscales = [
  { id: '601', desc: '601 - General de Ley Personas Morales' },
  { id: '605', desc: '605 - Sueldos y Salarios e Ingresos Asimilados a Salarios' },
  { id: '612', desc: '612 - Personas Físicas con Actividades Empresariales y Profesionales' },
  { id: '626', desc: '626 - Régimen Simplificado de Confianza (RESICO)' }
];

const usosCfdi = [
  { id: 'G01', desc: 'G01 - Adquisición de mercancías' },
  { id: 'G03', desc: 'G03 - Gastos en general' },
  { id: 'P01', desc: 'P01 - Por definir' }
];

export default function AutoFacturacionPortal() {
  const [activeTab, setActiveTab] = useState<'facturar' | 'consultar'>('facturar');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados del Formulario
  const [ticketData, setTicketData] = useState({ folio: '', monto: '' });
  const [fiscalData, setFiscalData] = useState({ rfc: '', nombre: '', cp: '', regimen: '601', uso: 'G03', email: '' });

  // --- MÉTODOS DE FLUJO ---
  const handleBuscarTicket = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    // Simulación de búsqueda en base de datos en tiempo real
    setTimeout(() => {
      if (ticketData.folio.length < 5) {
        setError('El folio del ticket no existe o ya fue facturado.');
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
      setStep(2); // Avanza al paso de datos fiscales
    }, 1200);
  };

  const handleGenerarFactura = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Simulación de validación SAT (LCO) y Timbrado PAC
    setTimeout(() => {
      if (fiscalData.rfc.length < 12) {
        setError('El RFC ingresado no es válido según los registros del SAT (LCO).');
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
      setStep(3); // Avanza a la pantalla de éxito
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-[#0a0a0a] flex flex-col items-center justify-center p-4 md:p-8 font-sans transition-colors">
      
      {/* BRANDING HEADER (Marca Blanca) */}
      <div className="w-full max-w-3xl flex justify-center mb-8">
        <div className="bg-white dark:bg-neutral-900 px-8 py-4 rounded-3xl shadow-sm border border-neutral-200 dark:border-neutral-800 flex items-center gap-4">
          <Building2 className="h-8 w-8 text-neutral-800 dark:text-neutral-200" />
          <div className="text-center md:text-left">
            <h1 className="text-xl font-black text-neutral-900 dark:text-white tracking-tight">Portal de Facturación</h1>
            <p className="text-sm font-bold" style={{ color: orgBranding.primaryColor }}>{orgBranding.name}</p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-3xl bg-white dark:bg-neutral-900 rounded-[2rem] shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden relative">
        
        {/* PROGRESS BAR (Wizard) */}
        {activeTab === 'facturar' && step < 3 && (
          <div className="w-full bg-neutral-100 dark:bg-black h-2">
            <div 
              className="h-full transition-all duration-500 ease-in-out" 
              style={{ width: step === 1 ? '33%' : '66%', backgroundColor: orgBranding.primaryColor }}
            />
          </div>
        )}

        {/* NAVEGACIÓN PRINCIPAL */}
        {step === 1 && (
          <div className="flex border-b border-neutral-200 dark:border-neutral-800">
            <button 
              onClick={() => setActiveTab('facturar')}
              className={`flex-1 py-4 text-sm font-black tracking-widest uppercase transition-colors ${activeTab === 'facturar' ? 'text-neutral-900 dark:text-white border-b-2' : 'text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'}`}
              style={{ borderBottomColor: activeTab === 'facturar' ? orgBranding.primaryColor : 'transparent' }}
            >
              Generar Factura
            </button>
            <button 
              onClick={() => setActiveTab('consultar')}
              className={`flex-1 py-4 text-sm font-black tracking-widest uppercase transition-colors ${activeTab === 'consultar' ? 'text-neutral-900 dark:text-white border-b-2' : 'text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'}`}
              style={{ borderBottomColor: activeTab === 'consultar' ? orgBranding.primaryColor : 'transparent' }}
            >
              Consultar Factura
            </button>
          </div>
        )}

        <div className="p-6 md:p-10">
          
          {/* MENSAJE DE ERROR GLOBAL */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-400 font-bold">{error}</p>
            </div>
          )}

          {/* TAB: FACTURAR - PASO 1 (Buscar Ticket) */}
          {activeTab === 'facturar' && step === 1 && (
            <form onSubmit={handleBuscarTicket} className="space-y-6 animate-in fade-in">
              <div className="text-center mb-8">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-black mb-4 border border-neutral-200 dark:border-neutral-800">
                  <Ticket className="h-8 w-8 text-neutral-400" />
                </div>
                <h2 className="text-2xl font-black text-neutral-900 dark:text-white">Identifica tu Compra</h2>
                <p className="text-neutral-500 text-sm mt-2">Ingresa los datos impresos en tu ticket. Tienes hasta el último día del mes en curso para solicitar tu CFDI.</p>
              </div>

              <div className="space-y-4 max-w-md mx-auto">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Folio del Ticket / Referencia</label>
                  <input 
                    type="text" required
                    placeholder="Ej. TKT-001239"
                    value={ticketData.folio}
                    onChange={(e) => setTicketData({...ticketData, folio: e.target.value.toUpperCase()})}
                    className="w-full p-4 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl font-mono font-bold text-neutral-900 dark:text-white focus:ring-2 outline-none transition-all uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Monto Total (Con decimales)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-4 text-neutral-400 font-bold">$</span>
                    <input 
                      type="number" step="0.01" required
                      placeholder="0.00"
                      value={ticketData.monto}
                      onChange={(e) => setTicketData({...ticketData, monto: e.target.value})}
                      className="w-full pl-8 pr-4 py-4 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl font-mono font-bold text-neutral-900 dark:text-white focus:ring-2 outline-none transition-all"
                    />
                  </div>
                </div>

                <button 
                  type="submit" disabled={isLoading}
                  className="w-full mt-4 flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-black transition-all hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 shadow-xl shadow-emerald-500/20"
                  style={{ backgroundColor: orgBranding.primaryColor }}
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Buscar Ticket'}
                  {!isLoading && <ArrowRight className="h-5 w-5" />}
                </button>
              </div>
            </form>
          )}

          {/* TAB: FACTURAR - PASO 2 (Datos CFDI 4.0) */}
          {activeTab === 'facturar' && step === 2 && (
            <form onSubmit={handleGenerarFactura} className="space-y-6 animate-in slide-in-from-right-8">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-neutral-200 dark:border-neutral-800">
                <div>
                  <h2 className="text-2xl font-black text-neutral-900 dark:text-white">Datos Fiscales (CFDI 4.0)</h2>
                  <p className="text-neutral-500 text-sm mt-1">Validados en tiempo real con la lista de contribuyentes del SAT.</p>
                </div>
                <div className="bg-neutral-100 dark:bg-black px-4 py-2 rounded-xl text-center border border-neutral-200 dark:border-neutral-800">
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Total a Facturar</p>
                  <p className="font-mono font-black text-neutral-900 dark:text-white">${ticketData.monto}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">RFC</label>
                  <input type="text" required placeholder="XAXX010101000" minLength={12} maxLength={13}
                    value={fiscalData.rfc} onChange={(e) => setFiscalData({...fiscalData, rfc: e.target.value.toUpperCase()})}
                    className="w-full p-4 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl font-mono font-bold text-neutral-900 dark:text-white uppercase focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Código Postal (Domicilio Fiscal)</label>
                  <input type="text" required placeholder="00000" maxLength={5} pattern="\d{5}"
                    value={fiscalData.cp} onChange={(e) => setFiscalData({...fiscalData, cp: e.target.value})}
                    className="w-full p-4 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl font-mono font-bold text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Razón Social o Nombre (Sin S.A. de C.V.)</label>
                  <input type="text" required placeholder="Nombre Exacto de la Constancia"
                    value={fiscalData.nombre} onChange={(e) => setFiscalData({...fiscalData, nombre: e.target.value.toUpperCase()})}
                    className="w-full p-4 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl font-bold text-neutral-900 dark:text-white uppercase focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Régimen Fiscal</label>
                  <select value={fiscalData.regimen} onChange={(e) => setFiscalData({...fiscalData, regimen: e.target.value})} className="w-full p-4 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl font-bold text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer text-sm">
                    {regimenesFiscales.map(r => <option key={r.id} value={r.id}>{r.desc}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Uso de CFDI</label>
                  <select value={fiscalData.uso} onChange={(e) => setFiscalData({...fiscalData, uso: e.target.value})} className="w-full p-4 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl font-bold text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer text-sm">
                    {usosCfdi.map(u => <option key={u.id} value={u.id}>{u.desc}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Correo Electrónico (Para envío)</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-4 h-5 w-5 text-neutral-400" />
                    <input type="email" required placeholder="tu@correo.com"
                      value={fiscalData.email} onChange={(e) => setFiscalData({...fiscalData, email: e.target.value})}
                      className="w-full pl-12 pr-4 py-4 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl font-bold text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setStep(1)} className="px-6 py-4 rounded-2xl font-bold text-neutral-500 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                  Atrás
                </button>
                <button type="submit" disabled={isLoading} className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-black transition-all hover:scale-[1.02] disabled:opacity-70 shadow-xl shadow-emerald-500/20" style={{ backgroundColor: orgBranding.primaryColor }}>
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Generar Factura Oficial'}
                </button>
              </div>
            </form>
          )}

          {/* TAB: FACTURAR - PASO 3 (Éxito y Descargas) */}
          {activeTab === 'facturar' && step === 3 && (
            <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
              <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10 mb-2 border-8 border-white dark:border-neutral-900 shadow-xl">
                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              </div>
              
              <div>
                <h2 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight">¡Factura Generada!</h2>
                <p className="text-neutral-500 mt-2">La factura ha sido timbrada por el SAT exitosamente y enviada a <strong className="text-neutral-900 dark:text-white">{fiscalData.email}</strong></p>
              </div>

              <div className="bg-neutral-50 dark:bg-black p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 max-w-sm mx-auto my-6 text-left space-y-2">
                <div className="flex justify-between"><span className="text-xs font-bold text-neutral-500 uppercase">Folio Fiscal (UUID)</span><span className="text-xs font-mono text-neutral-900 dark:text-white">A1B2C3D4-E5F6...</span></div>
                <div className="flex justify-between"><span className="text-xs font-bold text-neutral-500 uppercase">Emisor</span><span className="text-xs font-bold text-neutral-900 dark:text-white truncate max-w-[150px]">{orgBranding.name}</span></div>
                <div className="flex justify-between"><span className="text-xs font-bold text-neutral-500 uppercase">Receptor</span><span className="text-xs font-bold text-neutral-900 dark:text-white">{fiscalData.rfc}</span></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
                <button className="flex items-center justify-center gap-2 py-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-bold rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors border border-red-200 dark:border-red-500/20">
                  <FileText className="h-5 w-5" /> Descargar PDF
                </button>
                <button className="flex items-center justify-center gap-2 py-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors border border-blue-200 dark:border-blue-500/20">
                  <FileCheck2 className="h-5 w-5" /> Descargar XML
                </button>
              </div>

              <div className="pt-8">
                <button onClick={() => { setStep(1); setTicketData({folio:'', monto:''}); }} className="text-sm font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white underline">
                  Facturar otro ticket
                </button>
              </div>
            </div>
          )}

          {/* TAB: CONSULTAR (Búsqueda Histórica) */}
          {activeTab === 'consultar' && (
            <form onSubmit={handleBuscarTicket} className="space-y-6 animate-in fade-in">
              <div className="text-center mb-8">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-black mb-4 border border-neutral-200 dark:border-neutral-800">
                  <Search className="h-8 w-8 text-neutral-400" />
                </div>
                <h2 className="text-2xl font-black text-neutral-900 dark:text-white">Recuperar Factura</h2>
                <p className="text-neutral-500 text-sm mt-2">Ingresa tu RFC y el folio de la compra para descargar nuevamente tus archivos PDF y XML.</p>
              </div>

              <div className="space-y-4 max-w-md mx-auto">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">RFC Receptor</label>
                  <input type="text" required placeholder="XAXX010101000" className="w-full p-4 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl font-mono font-bold text-neutral-900 dark:text-white focus:ring-2 outline-none uppercase transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Folio del Ticket</label>
                  <input type="text" required placeholder="Ej. TKT-001239" className="w-full p-4 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl font-mono font-bold text-neutral-900 dark:text-white focus:ring-2 outline-none uppercase transition-all" />
                </div>
                <button type="submit" disabled={isLoading} className="w-full mt-4 flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-black transition-all hover:scale-[1.02] disabled:opacity-70 shadow-xl" style={{ backgroundColor: orgBranding.primaryColor }}>
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Buscar en el historial'}
                </button>
              </div>
            </form>
          )}

        </div>

        {/* FOOTER DE CONFIANZA Y SOPORTE */}
        <div className="bg-neutral-50 dark:bg-black/50 border-t border-neutral-200 dark:border-neutral-800 p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-xs font-bold text-neutral-500"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Transmisión Segura (SSL)</span>
              <span className="flex items-center gap-1.5 text-xs font-bold text-neutral-500"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> CFDI 4.0 SAT</span>
            </div>
            <a href={`mailto:${orgBranding.supportEmail}`} className="flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors">
              <HelpCircle className="h-4 w-4" /> ¿Problemas técnicos? Contacta a soporte
            </a>
          </div>
        </div>

      </div>
      
      {/* SELLO DEL ERP (Para ti) */}
      <div className="mt-8 opacity-50 hover:opacity-100 transition-opacity flex flex-col items-center">
        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Tecnología impulsada por</p>
        <img src="/logo-dark.png" alt="CIFRA" className="h-4 hidden dark:block grayscale opacity-50" />
        <img src="/logo-light.png" alt="CIFRA" className="h-4 block dark:hidden grayscale opacity-50" />
      </div>

    </div>
  );
}