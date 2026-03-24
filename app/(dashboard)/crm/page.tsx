'use client';

import { useState, useTransition, useEffect } from 'react';
import {
  Target, Users, Kanban, Megaphone, Headset,
  Sparkles, Calendar, DollarSign, FileSignature,
  TrendingUp, AlertCircle, CheckCircle2, Search,
  Phone, Mail, MessageSquare, AlertTriangle, Zap,
  MoreVertical, Clock, QrCode, UserPlus
} from 'lucide-react';
import QrScanner from '@/components/crm/QrScanner';
import CustomerForm from '@/components/crm/CustomerForm';
import { scrapeCustomerFromQr, getCustomers } from './actions';
import type { CsfData } from '@/lib/crm/sat-csf-scraper';

export default function CRMPage() {
  const [activeTab, setActiveTab] = useState<'360' | 'pipeline' | 'marketing' | 'tickets' | 'fiscal'>('360');
  const [isPending, startTransition] = useTransition();
  const [fiscalView, setFiscalView] = useState<'list' | 'qr' | 'form'>('list');
  const [prefillData, setPrefillData] = useState<CsfData | null>(null);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);

  useEffect(() => {
    if (activeTab === 'fiscal') loadCustomers();
  }, [activeTab]);

  function loadCustomers() {
    startTransition(async () => {
      try {
        const result = await getCustomers();
        setCustomers(result.customers);
        setTotalCustomers(result.total);
      } catch { /* silent */ }
    });
  }

  function handleQrSuccess(url: string) {
    setScrapeError(null);
    startTransition(async () => {
      const result = await scrapeCustomerFromQr(url);
      if (result.success && result.data) {
        setPrefillData(result.data as CsfData);
        setFiscalView('form');
      } else {
        setScrapeError(result.error ?? 'No se pudieron extraer datos del QR');
        setPrefillData(null);
        setFiscalView('form');
      }
    });
  }

  function handleFormSuccess() {
    setPrefillData(null);
    setFiscalView('list');
    loadCustomers();
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* HEADER ERP */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-purple-500/10 p-3 rounded-2xl border border-purple-500/20">
              <Target className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">CRM & Experiencia de Cliente</h1>
              <p className="text-neutral-500 font-medium text-sm mt-1">
                Visión 360°, Pipeline Inteligente, Marketing y Tickets de Soporte.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all text-sm">
              <Calendar className="h-4 w-4" /> Sincronizar Calendario
            </button>
            <button className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl transition-all shadow-lg shadow-purple-500/20 text-sm">
              <Users className="h-4 w-4" /> Nuevo Prospecto
            </button>
          </div>
        </header>

        {/* TOP METRICS & NEXT BEST ACTION (IA AGÉNTICA) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-purple-900 to-black dark:from-purple-950 dark:to-black p-5 rounded-2xl border border-purple-800 dark:border-purple-500/30 flex flex-col justify-between text-white md:col-span-2 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20"><Sparkles className="h-16 w-16" /></div>
            <div className="relative z-10">
              <p className="text-xs font-bold text-purple-300 uppercase tracking-widest flex items-center gap-1 mb-2">
                <Sparkles className="h-4 w-4" /> Next Best Action (Sugerencia de IA)
              </p>
              <h3 className="text-lg font-black text-white leading-tight mb-1">
                Llama a "Constructora Horizonte S.A."
              </h3>
              <p className="text-sm text-purple-200/80 mb-4">
                Tienen un 85% de probabilidad de renovar su contrato anual, pero un ticket de soporte lleva 24h sin resolver. NLP detecta sentimiento "Frustrado" en su último correo.
              </p>
              <div className="flex gap-2">
                <button className="bg-white text-purple-900 font-black px-4 py-2 rounded-xl text-xs hover:scale-[1.02] transition-transform">Llamar Ahora</button>
                <button className="bg-purple-800/50 text-white font-bold px-4 py-2 rounded-xl text-xs hover:bg-purple-800/80 transition-colors">Escalar Ticket a Soporte N2</button>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col justify-center">
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Valor del Pipeline</p>
            <p className="text-3xl font-black text-neutral-900 dark:text-white">$4.2M</p>
            <p className="text-[10px] text-emerald-500 mt-1 font-bold flex items-center gap-1"><TrendingUp className="h-3 w-3" /> +12% vs mes anterior</p>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col justify-center border-l-4 border-l-rose-500">
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">SLA en Riesgo (Soporte)</p>
            <p className="text-3xl font-black text-rose-600 dark:text-rose-400">2 Tickets</p>
            <p className="text-[10px] text-rose-500 mt-1 font-bold">Vencen en menos de 2 horas</p>
          </div>
        </div>

        {/* CONTENEDOR DE PESTAÑAS */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm min-h-[600px] overflow-hidden">
          
          <div className="flex overflow-x-auto border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-black/50 p-2 gap-2">
            {[
              { id: '360', label: 'Visión Cliente 360°', icon: Users },
              { id: 'pipeline', label: 'SFA & Pipeline Kanban', icon: Kanban },
              { id: 'marketing', label: 'Marketing y Segmentación', icon: Megaphone },
              { id: 'tickets', label: 'Soporte y SLA (Ticketing)', icon: Headset },
              { id: 'fiscal', label: 'Clientes Fiscales (QR)', icon: QrCode },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20' 
                    : 'bg-white dark:bg-neutral-900 text-neutral-500 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                }`}
              >
                <tab.icon className="h-4 w-4" /> {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            
            {/* 1. VISIÓN CLIENTE 360° */}
            {activeTab === '360' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
                
                {/* Perfil Principal */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl text-center relative">
                    <div className="absolute top-4 right-4 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-2 py-1 rounded text-[10px] font-black uppercase">Cliente Activo</div>
                    <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-purple-200 dark:border-purple-500/30">
                      <span className="text-2xl font-black text-purple-600 dark:text-purple-400">CH</span>
                    </div>
                    <h2 className="text-xl font-black text-neutral-900 dark:text-white">Constructora Horizonte S.A.</h2>
                    <p className="text-xs text-neutral-500 mt-1 font-mono">CHO190212XYZ • Monterrey, N.L.</p>
                    <div className="flex justify-center gap-3 mt-4">
                      <button className="p-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:text-purple-600 transition-colors"><Phone className="h-4 w-4" /></button>
                      <button className="p-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:text-purple-600 transition-colors"><Mail className="h-4 w-4" /></button>
                      <button className="p-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:text-purple-600 transition-colors" title="Perfil Enriquecido via LinkedIn API"><Users className="h-4 w-4" /></button>
                    </div>
                  </div>

                  {/* Sentimiento NLP */}
                  <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 p-5 rounded-2xl shadow-sm">
                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-1"><MessageSquare className="h-4 w-4"/> Sentimiento Reciente (NLP)</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-200 dark:border-amber-800/30">
                        <p className="text-amber-700 dark:text-amber-400 font-bold text-sm">Frustrado (45/100)</p>
                        <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-1">"El último pedido llegó incompleto y nadie me responde..."</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Golden Record: Finanzas y Legal */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Finanzas */}
                  <div className="bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-black text-neutral-900 dark:text-white flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-emerald-500" /> Historial Financiero (Cobranza)
                      </h3>
                      <button className="flex items-center gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-200 dark:hover:bg-emerald-500/30 transition-colors">
                        <CheckCircle2 className="h-3 w-3" /> Ver Historial de Pagos
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800">
                        <p className="text-[10px] font-bold text-neutral-500 uppercase">Línea de Crédito Disponible</p>
                        <p className="text-xl font-black text-neutral-900 dark:text-white mt-1">$150,000 / $500,000</p>
                      </div>
                      <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-rose-100 dark:border-rose-900/50">
                        <p className="text-[10px] font-bold text-neutral-500 uppercase">Deuda Vencida (PPD)</p>
                        <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">$45,000 <span className="text-[10px] text-rose-500 font-normal">Factura F-1042</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Legal */}
                  <div className="bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-black text-neutral-900 dark:text-white flex items-center gap-2">
                        <FileSignature className="h-5 w-5 text-indigo-500" /> Bóveda Legal (Contratos)
                      </h3>
                      <button className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-md">
                        <FileSignature className="h-3 w-3" /> Solicitar Firma de Contrato
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-white dark:bg-neutral-900 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800">
                        <div>
                          <p className="font-bold text-sm text-neutral-900 dark:text-white">Contrato Marco de Suministro</p>
                          <p className="text-[10px] text-neutral-500 font-mono">DOC-992 • Vence: 2027-12-31</p>
                        </div>
                        <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-2 py-1 rounded text-[10px] font-black uppercase">Vigente</span>
                      </div>
                      <div className="flex items-center justify-between bg-white dark:bg-neutral-900 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 opacity-60">
                        <div>
                          <p className="font-bold text-sm text-neutral-900 dark:text-white">Acuerdo de Confidencialidad (NDA)</p>
                          <p className="text-[10px] text-neutral-500 font-mono">Pendiente de firma por el Cliente.</p>
                        </div>
                        <button className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Reenviar a DocuSign</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. SFA & PIPELINE KANBAN */}
            {activeTab === 'pipeline' && (
              <div className="space-y-6 animate-in fade-in duration-300 overflow-x-auto pb-4">
                <div className="flex justify-between items-center min-w-[800px]">
                  <div>
                    <h2 className="text-xl font-black text-neutral-900 dark:text-white">Pipeline de Ventas (Q1 2026)</h2>
                    <p className="text-xs text-neutral-500 mt-1">Arrastra y suelta las oportunidades. El valor se pondera por probabilidad de cierre.</p>
                  </div>
                  <div className="flex items-center gap-4 bg-neutral-100 dark:bg-neutral-800 px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <Search className="h-4 w-4 text-neutral-400" />
                    <input type="text" placeholder="Buscar oportunidad..." className="bg-transparent border-none outline-none text-sm font-medium text-neutral-900 dark:text-white w-48" />
                  </div>
                </div>

                <div className="flex gap-4 min-w-[1000px]">
                  
                  {/* Columna: Leads (Lead Scoring) */}
                  <div className="flex-1 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 flex flex-col max-h-[500px]">
                    <h3 className="font-black text-neutral-500 uppercase tracking-widest text-xs mb-3 flex justify-between">
                      Prospectos Nuevos <span className="bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-700 dark:text-neutral-300">2</span>
                    </h3>
                    <div className="space-y-3 overflow-y-auto pr-2">
                      <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm cursor-grab hover:border-purple-500 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-bold text-sm text-neutral-900 dark:text-white">TechMinds LLC</p>
                          <span className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 px-1.5 py-0.5 rounded text-[10px] font-black" title="Lead Score basado en interacción">Score: 85</span>
                        </div>
                        <p className="text-xs text-neutral-500 mb-3">Interesados en SaaS de Finanzas.</p>
                        <button className="w-full bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 font-bold py-1.5 rounded-lg text-xs border border-purple-200 dark:border-purple-500/30 transition-colors">
                          Convertir a Oportunidad
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Columna: Cotización (CPQ) */}
                  <div className="flex-1 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 flex flex-col max-h-[500px]">
                    <h3 className="font-black text-blue-500 uppercase tracking-widest text-xs mb-3 flex justify-between">
                      Cotización (CPQ) <span className="bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded text-blue-700 dark:text-blue-300">1</span>
                    </h3>
                    <div className="space-y-3 overflow-y-auto pr-2">
                      <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm cursor-grab border-l-4 border-l-blue-500">
                        <p className="font-bold text-sm text-neutral-900 dark:text-white mb-1">Ampliación Licencias ERP</p>
                        <p className="text-xs text-neutral-500">Grupo ALFA</p>
                        <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-2">$120,000 <span className="text-[10px] font-normal text-neutral-500">Prob: 40%</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Columna: Negociación */}
                  <div className="flex-1 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 flex flex-col max-h-[500px]">
                    <h3 className="font-black text-amber-500 uppercase tracking-widest text-xs mb-3 flex justify-between">
                      En Negociación <span className="bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded text-amber-700 dark:text-amber-300">1</span>
                    </h3>
                    <div className="space-y-3 overflow-y-auto pr-2">
                      <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm cursor-grab border-l-4 border-l-amber-500">
                        <p className="font-bold text-sm text-neutral-900 dark:text-white mb-1">Implementación SCM</p>
                        <p className="text-xs text-neutral-500">Logística del Centro</p>
                        <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-2">$350,000 <span className="text-[10px] font-normal text-neutral-500">Prob: 80%</span></p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* 3. MARKETING Y SEGMENTACIÓN INTELIGENTE */}
            {activeTab === 'marketing' && (
              <div className="space-y-6 animate-in fade-in duration-300 flex flex-col items-center justify-center min-h-[400px]">
                <div className="bg-purple-50 dark:bg-purple-500/10 p-6 rounded-full mb-4 border border-purple-100 dark:border-purple-500/20">
                  <Megaphone className="h-12 w-12 text-purple-500" />
                </div>
                <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-2">Segmentación Dinámica de Audiencias</h2>
                <p className="text-neutral-500 text-sm max-w-lg mb-6 text-center">
                  Crea listas basadas en el comportamiento financiero o de compras. Ej. "Clientes con crédito disponible que compraron hace 6 meses".
                </p>
                
                <div className="w-full max-w-2xl bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl text-left">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-neutral-900 dark:text-white">Segmento: Riesgo de Churn (Abandono)</h3>
                    <span className="bg-neutral-200 dark:bg-neutral-800 px-2 py-1 rounded text-xs font-bold text-neutral-600 dark:text-neutral-300">142 Contactos</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className="px-2 py-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded text-xs font-mono text-neutral-500">Última Compra {'>'} 90 días</span>
                    <span className="px-2 py-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded text-xs font-mono text-neutral-500">Tickets Activos {'>'} 0</span>
                  </div>
                  <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black px-4 py-3 rounded-xl text-sm transition-transform hover:scale-[1.02] shadow-lg flex justify-center items-center gap-2">
                    <Zap className="h-4 w-4" /> Generar Campaña desde Segmento
                  </button>
                </div>
              </div>
            )}

            {/* 4. POST-VENTA Y SERVICIO (TICKETING) */}
            {activeTab === 'tickets' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 p-4 rounded-2xl">
                  <div>
                    <h3 className="font-bold text-rose-900 dark:text-rose-100 flex items-center gap-2"><Headset className="h-5 w-5" /> Centro de Soporte y SLA</h3>
                    <p className="text-xs text-rose-700 dark:text-rose-400 mt-1">Acuerdos de Nivel de Servicio (SLA) vinculados a la rentabilidad del cliente.</p>
                  </div>
                </div>

                <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-2xl">
                  <table className="min-w-full text-sm text-left whitespace-nowrap">
                    <thead className="bg-neutral-50 dark:bg-black/50 border-b border-neutral-200 dark:border-neutral-800">
                      <tr>
                        <th className="p-4 font-bold text-neutral-600 dark:text-neutral-400">ID / Asunto</th>
                        <th className="p-4 font-bold text-neutral-600 dark:text-neutral-400">Cliente</th>
                        <th className="p-4 font-bold text-neutral-600 dark:text-neutral-400 text-center">Estatus</th>
                        <th className="p-4 font-bold text-neutral-600 dark:text-neutral-400 text-center">SLA Restante</th>
                        <th className="p-4 font-bold text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                      <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 bg-rose-50/20 dark:bg-rose-900/10">
                        <td className="p-4">
                          <p className="font-bold text-neutral-900 dark:text-white">Pedido incompleto</p>
                          <p className="text-[10px] text-neutral-500 font-mono mt-0.5">TKT-8942 • Reclamo Comercial</p>
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-neutral-900 dark:text-white">Constructora Horizonte S.A.</p>
                          <span className="text-[9px] font-black uppercase text-amber-500">Cliente VIP</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="inline-flex bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 px-2 py-0.5 rounded text-[10px] font-black uppercase">Abierto</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="font-black text-rose-600 flex items-center justify-center gap-1"><AlertTriangle className="h-3 w-3" /> 1h 45m</span>
                        </td>
                        <td className="p-4 text-right">
                          <button className="text-xs font-bold text-purple-600 hover:underline">Resolver Ticket</button>
                        </td>
                      </tr>
                      <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                        <td className="p-4">
                          <p className="font-bold text-neutral-900 dark:text-white">Duda sobre factura XML</p>
                          <p className="text-[10px] text-neutral-500 font-mono mt-0.5">TKT-8943 • Duda Técnica</p>
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-neutral-900 dark:text-white">TechMinds LLC</p>
                        </td>
                        <td className="p-4 text-center">
                          <span className="inline-flex bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 px-2 py-0.5 rounded text-[10px] font-black uppercase">En Revisión</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="font-bold text-neutral-600 dark:text-neutral-400">22h 10m</span>
                        </td>
                        <td className="p-4 text-right">
                          <button className="text-xs font-bold text-purple-600 hover:underline">Responder</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5. CLIENTES FISCALES — ONBOARDING QR */}
            {activeTab === 'fiscal' && (
              <div className="space-y-6 animate-in fade-in duration-300">

                {/* Header de la pestaña fiscal */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-neutral-900 dark:text-white">Clientes Fiscales</h2>
                    <p className="text-xs text-neutral-500 mt-1">
                      Alta automatizada via QR de la Constancia de Situacion Fiscal del SAT
                    </p>
                  </div>
                  {fiscalView === 'list' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => { setPrefillData(null); setFiscalView('qr'); setScrapeError(null); }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-purple-500/20"
                      >
                        <QrCode className="h-4 w-4" /> Escanear QR (CSF)
                      </button>
                      <button
                        onClick={() => { setPrefillData(null); setFiscalView('form'); setScrapeError(null); }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all text-sm"
                      >
                        <UserPlus className="h-4 w-4" /> Alta Manual
                      </button>
                    </div>
                  )}
                  {fiscalView !== 'list' && (
                    <button
                      onClick={() => { setFiscalView('list'); setPrefillData(null); setScrapeError(null); }}
                      className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl text-sm"
                    >
                      Volver a Lista
                    </button>
                  )}
                </div>

                {/* Sub-vista: QR Scanner */}
                {fiscalView === 'qr' && (
                  <div className="bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl space-y-4">
                    <h3 className="font-bold text-neutral-900 dark:text-white">Escanear Constancia de Situacion Fiscal</h3>
                    <p className="text-sm text-neutral-500">
                      Escanee el QR impreso en la CSF del cliente. Los datos (RFC, Nombre, Regimen, CP) se extraeran automaticamente.
                    </p>
                    <QrScanner onScanSuccess={handleQrSuccess} onScanError={(err) => setScrapeError(err)} />
                    {isPending && (
                      <div className="flex items-center gap-3 p-4 bg-neutral-100 dark:bg-neutral-800/50 rounded-lg">
                        <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-neutral-600 dark:text-neutral-300">Consultando datos en el SAT...</span>
                      </div>
                    )}
                    {scrapeError && (
                      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg space-y-2">
                        <p className="text-amber-700 dark:text-amber-300 text-sm">{scrapeError}</p>
                        <button onClick={() => { setFiscalView('form'); setPrefillData(null); }} className="text-sm text-purple-600 dark:text-purple-400 hover:underline font-bold">
                          Continuar con ingreso manual
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-vista: Formulario */}
                {fiscalView === 'form' && (
                  <div className="bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl">
                    <h3 className="font-bold text-neutral-900 dark:text-white mb-1">
                      {prefillData ? 'Confirmar Datos del QR' : 'Alta Manual de Cliente'}
                    </h3>
                    {prefillData && (
                      <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-4">Datos pre-llenados desde la CSF. Verifique y complete.</p>
                    )}
                    <CustomerForm
                      prefillData={prefillData}
                      onSuccess={handleFormSuccess}
                      onCancel={() => { setFiscalView('list'); setPrefillData(null); }}
                    />
                  </div>
                )}

                {/* Sub-vista: Lista de clientes */}
                {fiscalView === 'list' && (
                  <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-black/50">
                      <p className="text-sm text-neutral-500">{totalCustomers} cliente{totalCustomers !== 1 ? 's' : ''} registrado{totalCustomers !== 1 ? 's' : ''}</p>
                    </div>

                    {customers.length === 0 ? (
                      <div className="px-6 py-16 text-center">
                        <QrCode className="w-12 h-12 mx-auto text-neutral-400 dark:text-neutral-600 mb-4" />
                        <p className="text-neutral-600 dark:text-neutral-400 font-bold">No hay clientes fiscales registrados</p>
                        <p className="text-neutral-500 text-sm mt-1">Escanee un QR de la CSF o agregue un cliente manualmente</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-neutral-50 dark:bg-black/50 border-b border-neutral-200 dark:border-neutral-800">
                            <tr>
                              <th className="px-6 py-3 font-bold text-xs text-neutral-500 uppercase">RFC</th>
                              <th className="px-6 py-3 font-bold text-xs text-neutral-500 uppercase">Nombre / Razon Social</th>
                              <th className="px-6 py-3 font-bold text-xs text-neutral-500 uppercase">Tipo</th>
                              <th className="px-6 py-3 font-bold text-xs text-neutral-500 uppercase">Regimen</th>
                              <th className="px-6 py-3 font-bold text-xs text-neutral-500 uppercase">CP</th>
                              <th className="px-6 py-3 font-bold text-xs text-neutral-500 uppercase">Origen</th>
                              <th className="px-6 py-3 font-bold text-xs text-neutral-500 uppercase">Fecha</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                            {customers.map((c: any) => (
                              <tr key={c.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                                <td className="px-6 py-4 font-mono text-purple-600 dark:text-purple-400 font-bold">{c.rfc}</td>
                                <td className="px-6 py-4 text-neutral-900 dark:text-white font-medium">{c.legalName}</td>
                                <td className="px-6 py-4">
                                  <span className={`text-[10px] px-2 py-1 rounded font-black uppercase ${c.personType === 'MORAL' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400'}`}>
                                    {c.personType === 'MORAL' ? 'Moral' : 'Fisica'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-neutral-500">{c.taxRegime?.satCode ?? '—'}</td>
                                <td className="px-6 py-4 text-neutral-500">{c.zipCode}</td>
                                <td className="px-6 py-4">
                                  <span className={`text-[10px] px-2 py-1 rounded font-black uppercase ${c.source === 'QR_SCAN' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'}`}>
                                    {c.source === 'QR_SCAN' ? 'QR' : 'Manual'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-neutral-500 text-xs">{new Date(c.createdAt).toLocaleDateString('es-MX')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}