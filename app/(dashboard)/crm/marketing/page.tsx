'use client';

import { useState } from 'react';
import { 
  Megaphone, Filter, Workflow, Smartphone, Crosshair, 
  BarChart3, ShieldCheck, Mail, MessageCircle, Share2, 
  MousePointerClick, RefreshCw, SplitSquareHorizontal, 
  Play, Pause, Trash2, UserX, Send, ArrowRight, Activity, 
  Percent, CheckCircle2, AlertTriangle, Users, Target, 
  DollarSign, TrendingUp, Zap, Lock, Database, GitBranch
} from 'lucide-react';

export default function MarketingAutomaticoPage() {
  const [activeTab, setActiveTab] = useState<'segmentacion' | 'journeys' | 'omnicanal' | 'scoring' | 'roi' | 'legal'>('segmentacion');
  const [isSimulating, setIsSimulating] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* HEADER ERP */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-orange-500/10 p-3 rounded-2xl border border-orange-500/20">
              <Megaphone className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">Marketing Automático</h1>
              <p className="text-neutral-500 font-medium text-sm mt-1 flex items-center gap-2">
                <Database className="h-4 w-4" /> Conectado en tiempo real con Finanzas y Ventas (RFM).
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all text-sm border border-neutral-200 dark:border-neutral-700">
              <Filter className="h-4 w-4" /> Excluir Lista Morosos
            </button>
            <button className="flex items-center gap-2 px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl transition-all shadow-lg shadow-orange-500/20 text-sm">
              <Workflow className="h-4 w-4" /> Crear Nuevo Journey
            </button>
          </div>
        </header>

        {/* TOP METRICS (Marketing & ROI) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Públicos Vivos (RFM)</p>
              <p className="text-2xl font-black text-neutral-900 dark:text-white mt-1">12,450</p>
              <p className="text-[10px] text-emerald-500 mt-1 font-bold flex items-center gap-1"><TrendingUp className="h-3 w-3" /> +320 esta semana</p>
            </div>
            <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl"><Users className="h-6 w-6 text-neutral-500" /></div>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between border-l-4 border-l-orange-500">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Hand-off a Ventas</p>
              <p className="text-2xl font-black text-orange-600 dark:text-orange-400 mt-1">45 <span className="text-xs font-medium text-orange-500">MQLs</span></p>
              <p className="text-[10px] text-neutral-400 mt-1 font-bold">Leads &gt; 100 pts</p>
            </div>
            <div className="p-3 bg-orange-50 dark:bg-orange-500/10 rounded-xl"><Crosshair className="h-6 w-6 text-orange-500" /></div>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between border-l-4 border-l-emerald-500">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">ROI Promedio (Q1)</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">342%</p>
              <p className="text-[10px] text-emerald-500 mt-1 font-bold flex items-center gap-1"><DollarSign className="h-3 w-3" /> Atribución Directa</p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl"><BarChart3 className="h-6 w-6 text-emerald-500" /></div>
          </div>
          <div className="bg-gradient-to-br from-neutral-900 to-black dark:from-neutral-950 dark:to-black p-5 rounded-2xl border border-neutral-800 flex items-center justify-between text-white border-l-4 border-l-blue-500">
            <div>
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Cumplimiento LFPDPPP</p>
              <p className="text-lg font-black text-white mt-1">100% Opt-in</p>
              <p className="text-[10px] text-blue-400 mt-1 font-bold flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Cero reportes SPAM</p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-xl"><Lock className="h-6 w-6 text-blue-400" /></div>
          </div>
        </div>

        {/* NAVEGACIÓN DE MÓDULOS */}
        <div className="flex overflow-x-auto border-b border-neutral-200 dark:border-neutral-800 pb-2 gap-2">
          {[
            { id: 'segmentacion', label: 'Segmentación Dinámica (RFM)', icon: Filter },
            { id: 'journeys', label: 'Customer Journeys', icon: Workflow },
            { id: 'omnicanal', label: 'Omnicanalidad', icon: Share2 },
            { id: 'scoring', label: 'Lead Scoring & Nutrición', icon: Target },
            { id: 'roi', label: 'Analítica de Retorno (ROI)', icon: BarChart3 },
            { id: 'legal', label: 'Privacidad de Datos', icon: ShieldCheck },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20' 
                  : 'bg-white dark:bg-neutral-900 text-neutral-500 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
              }`}
            >
              <tab.icon className="h-4 w-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* ÁREA DE CONTENIDO */}
        <main className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm min-h-[600px] p-6">
          
          {/* 1. SEGMENTACIÓN DINÁMICA (RFM) */}
          {activeTab === 'segmentacion' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white">Análisis RFM & Públicos Vivos</h2>
                  <p className="text-xs text-neutral-500 mt-1">Clasificación en tiempo real basada en Recencia, Frecuencia y Monto (Módulo Finanzas).</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-neutral-950 dark:bg-white text-white dark:text-black font-bold rounded-xl text-xs shadow-md transition-colors hover:scale-[1.02]">
                  <Zap className="h-4 w-4" /> Crear Segmento Inteligente
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* RFM Matrix Visual */}
                <div className="lg:col-span-2 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 bg-neutral-50 dark:bg-black">
                  <h4 className="font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2"><Filter className="h-5 w-5 text-orange-500" /> Matriz de Segmentación de Clientes</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 p-4 rounded-xl">
                      <p className="text-xs font-black text-emerald-800 dark:text-emerald-400 uppercase mb-1">Campeones</p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-500 mb-3">Compran seguido, gastan mucho, compra reciente.</p>
                      <p className="text-2xl font-black text-emerald-900 dark:text-emerald-100">1,240 <span className="text-xs font-medium opacity-70">clientes</span></p>
                    </div>
                    <div className="bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 p-4 rounded-xl">
                      <p className="text-xs font-black text-blue-800 dark:text-blue-400 uppercase mb-1">Leales Potenciales</p>
                      <p className="text-[10px] text-blue-600 dark:text-blue-500 mb-3">Compradores recientes con buena frecuencia.</p>
                      <p className="text-2xl font-black text-blue-900 dark:text-blue-100">3,450 <span className="text-xs font-medium opacity-70">clientes</span></p>
                    </div>
                    <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 p-4 rounded-xl">
                      <p className="text-xs font-black text-amber-800 dark:text-amber-400 uppercase mb-1">Riesgo de Abandono</p>
                      <p className="text-[10px] text-amber-600 dark:text-amber-500 mb-3">Solían comprar frecuentemente, pero no han vuelto.</p>
                      <p className="text-2xl font-black text-amber-900 dark:text-amber-100">890 <span className="text-xs font-medium opacity-70">clientes</span></p>
                    </div>
                  </div>
                </div>

                {/* Filtros Vivos */}
                <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 bg-white dark:bg-black">
                  <h4 className="font-bold text-neutral-900 dark:text-white mb-4 text-sm">Filtros Activos (Público Vivo)</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 px-3 py-2 rounded-lg text-xs font-medium text-neutral-700 dark:text-neutral-300">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Última compra &lt; 30 días
                    </div>
                    <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 px-3 py-2 rounded-lg text-xs font-medium text-neutral-700 dark:text-neutral-300">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Producto = "Suscripción ERP"
                    </div>
                    <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-900/20 px-3 py-2 rounded-lg text-xs font-medium text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50">
                      <AlertTriangle className="h-4 w-4" /> Excluir: Facturas Vencidas (Módulo Cobranza)
                    </div>
                  </div>
                  <button className="w-full mt-6 bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 font-bold py-2.5 rounded-xl text-xs transition-colors hover:bg-orange-100 dark:hover:bg-orange-500/20">
                    Sincronizar con Facebook Ads
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. CUSTOMER JOURNEYS (DRAG AND DROP) */}
          {activeTab === 'journeys' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white">Constructor de Viajes (Journey Builder)</h2>
                  <p className="text-xs text-neutral-500 mt-1">Automatización basada en Triggers transaccionales del ERP.</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <Activity className="h-4 w-4" /> Journey Activo
                  </span>
                  <button className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold px-3 py-1.5 rounded-lg text-xs shadow-sm hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                    Pausar
                  </button>
                </div>
              </div>

              {/* Canvas Simulado */}
              <div className="w-full bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-2xl min-h-[450px] p-6 flex flex-col items-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#f97316 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                
                {/* Trigger */}
                <div className="z-10 bg-white dark:bg-black border-2 border-orange-500 p-4 rounded-2xl shadow-lg w-64 text-center cursor-pointer hover:scale-105 transition-transform">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-500/20 rounded-full mx-auto flex items-center justify-center text-orange-600 mb-2"><DollarSign className="h-5 w-5" /></div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-1">Trigger (Finanzas)</p>
                  <h4 className="font-bold text-neutral-900 dark:text-white text-sm">Factura Pagada</h4>
                </div>

                <div className="w-0.5 h-8 bg-neutral-300 dark:bg-neutral-700 z-10"></div>
                
                {/* Espera */}
                <div className="z-10 bg-white dark:bg-black border border-neutral-300 dark:border-neutral-700 p-3 rounded-xl shadow-sm w-48 text-center flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4 text-neutral-500" />
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Esperar 3 días</span>
                </div>

                <div className="w-0.5 h-8 bg-neutral-300 dark:bg-neutral-700 z-10"></div>
                
                {/* A/B Test Split */}
                <div className="z-10 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 p-3 rounded-xl shadow-sm w-56 text-center flex items-center justify-center gap-2">
                  <SplitSquareHorizontal className="h-4 w-4 text-indigo-500" />
                  <span className="text-xs font-bold text-indigo-900 dark:text-indigo-100">A/B Testing Automático</span>
                </div>

                <div className="flex justify-between w-[400px] z-10 mt-0">
                  <div className="w-0.5 h-8 bg-neutral-300 dark:bg-neutral-700 mx-auto transform -translate-x-12"></div>
                  <div className="w-0.5 h-8 bg-neutral-300 dark:bg-neutral-700 mx-auto transform translate-x-12"></div>
                </div>

                <div className="flex justify-between w-[480px] z-10">
                  {/* Acción A */}
                  <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-700 p-4 rounded-2xl shadow-md w-52 text-center relative">
                    <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">Ganador (68% Open)</div>
                    <Mail className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                    <h4 className="font-bold text-neutral-900 dark:text-white text-sm">Email: Asunto Corto</h4>
                    <p className="text-[9px] text-neutral-400 mt-1">"Tu opinión nos importa"</p>
                  </div>

                  {/* Acción B */}
                  <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-700 p-4 rounded-2xl shadow-md w-52 text-center opacity-60">
                    <Mail className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                    <h4 className="font-bold text-neutral-900 dark:text-white text-sm">Email: Asunto Largo</h4>
                    <p className="text-[9px] text-neutral-400 mt-1">"Hola [Nombre], califica tu compra..."</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. OMNICANALIDAD */}
          {activeTab === 'omnicanal' && (
            <div className="space-y-6 animate-in fade-in duration-300">
               <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white">Ejecución Omnicanal</h2>
                  <p className="text-xs text-neutral-500 mt-1">Conecta con los clientes en sus canales preferidos.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* WhatsApp */}
                <div className="border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-6 bg-emerald-50/50 dark:bg-emerald-950/20 group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <MessageCircle className="h-8 w-8 text-emerald-500" />
                      <div>
                        <h4 className="font-bold text-emerald-900 dark:text-emerald-100">WhatsApp Business API</h4>
                        <span className="bg-emerald-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded">Conectado</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-emerald-800 dark:text-emerald-300 mb-4">Plantillas HSM aprobadas para notificaciones transaccionales y recordatorios de citas.</p>
                  <div className="bg-white dark:bg-black p-3 rounded-xl shadow-sm border border-emerald-100 dark:border-emerald-800/50">
                    <p className="text-[10px] text-neutral-500 mb-1">Preview de Mensaje Dinámico:</p>
                    <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200">"Hola <span className="text-emerald-600">Angel</span>, tu factura <span className="text-emerald-600">F-1042</span> ha sido procesada con éxito. Puedes descargarla aquí: [Link]"</p>
                  </div>
                </div>

                {/* Email Marketing */}
                <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 bg-white dark:bg-black">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-8 w-8 text-blue-500" />
                      <div>
                        <h4 className="font-bold text-neutral-900 dark:text-white">Email Marketing Dinámico</h4>
                        <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400 text-[9px] font-black uppercase px-2 py-0.5 rounded">Salud Dominio: 98%</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">Constructor Drag & Drop de plantillas. Registros DKIM/SPF validados para evitar SPAM.</p>
                  <button className="w-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold py-2 rounded-xl text-xs transition-colors">
                    Editar Plantillas
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 4. LEAD SCORING & NUTRICIÓN */}
          {activeTab === 'scoring' && (
            <div className="space-y-6 animate-in fade-in duration-300">
               <div className="flex flex-col md:flex-row justify-between items-center bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/30 p-5 rounded-2xl gap-4">
                <div className="flex items-start gap-4">
                  <Target className="h-8 w-8 text-orange-500 mt-1" />
                  <div>
                    <h3 className="font-black text-orange-900 dark:text-orange-100 text-lg">Calificación de Comportamiento (Lead Scoring)</h3>
                    <p className="text-xs text-orange-700 dark:text-orange-400 mt-1 leading-relaxed max-w-2xl">
                      El sistema asigna puntos por interacciones. Al llegar a 100 puntos, se dispara el <strong>Hand-off</strong> automático al CRM de Ventas.
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-black">
                <table className="min-w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 text-[10px] uppercase text-neutral-500 tracking-widest font-black">
                    <tr>
                      <th className="p-4">Prospecto</th>
                      <th className="p-4">Última Interacción</th>
                      <th className="p-4 text-center">Score Actual</th>
                      <th className="p-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                    <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="p-4">
                        <p className="font-bold text-neutral-900 dark:text-white">Tech Solutions Inc.</p>
                        <p className="text-[10px] text-neutral-500 mt-0.5">m.gomez@techsol.com</p>
                      </td>
                      <td className="p-4 text-xs text-neutral-600 dark:text-neutral-400">
                        Descargó Ficha Técnica (+50 pts)
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col items-center">
                          <span className="font-black text-orange-600 dark:text-orange-400 mb-1">85 / 100</span>
                          <div className="w-24 bg-neutral-200 dark:bg-neutral-800 rounded-full h-1.5"><div className="bg-orange-500 h-1.5 rounded-full" style={{ width: '85%' }}></div></div>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button className="text-xs font-bold bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-lg text-neutral-600 dark:text-neutral-300 shadow-sm flex items-center justify-end gap-1 w-max ml-auto">
                          <Pause className="h-3 w-3" /> Pausar Auto
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 bg-emerald-50/30 dark:bg-emerald-900/5">
                      <td className="p-4">
                        <p className="font-bold text-neutral-900 dark:text-white">Constructora Base</p>
                        <p className="text-[10px] text-neutral-500 mt-0.5">compras@base.com.mx</p>
                      </td>
                      <td className="p-4 text-xs text-neutral-600 dark:text-neutral-400">
                        Visitó Página de Precios (+20 pts)
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col items-center">
                          <span className="font-black text-emerald-600 dark:text-emerald-400 mb-1">105 / 100</span>
                          <div className="w-24 bg-neutral-200 dark:bg-neutral-800 rounded-full h-1.5"><div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '100%' }}></div></div>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button className="text-xs font-bold bg-emerald-600 text-white px-3 py-1.5 rounded-lg shadow-sm flex items-center justify-end gap-1 w-max ml-auto">
                          <ArrowRight className="h-3 w-3" /> Hand-off a Ventas
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. ANALÍTICA DE RETORNO (ROI) */}
          {activeTab === 'roi' && (
            <div className="space-y-6 animate-in fade-in duration-300 flex flex-col items-center">
               <div className="w-full flex justify-between items-center bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl">
                 <div>
                   <h3 className="font-black text-neutral-900 dark:text-white text-lg flex items-center gap-2"><DollarSign className="h-5 w-5 text-emerald-500" /> Atribución de Ventas y ROI</h3>
                   <p className="text-xs text-neutral-500 mt-1">Demuestra el impacto financiero de cada campaña vinculando el clic con la factura final.</p>
                 </div>
                 <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 px-4 py-2 rounded-xl text-center shadow-sm">
                   <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Fórmula Aplicada</p>
                   {/* Representación visual de la fórmula (sin requerir librerías matemáticas externas) */}
                   <div className="flex items-center gap-2 font-mono text-xs font-bold">
                     <span>ROI =</span>
                     <div className="flex flex-col items-center">
                       <span className="border-b border-neutral-400 pb-0.5 px-1">Ingresos - Costos</span>
                       <span className="pt-0.5">Costos</span>
                     </div>
                     <span>× 100</span>
                   </div>
                 </div>
               </div>

               <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl bg-white dark:bg-black">
                   <h4 className="font-bold text-neutral-900 dark:text-white mb-4">Campaña: "Renovación Anticipada Q1"</h4>
                   <div className="space-y-3">
                     <div className="flex justify-between items-center p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                       <span className="text-sm text-neutral-600 dark:text-neutral-400">Costo de Campaña (Ads + Software):</span>
                       <span className="font-mono font-bold text-rose-600 dark:text-rose-400">-$15,000 MXN</span>
                     </div>
                     <div className="flex justify-between items-center p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                       <span className="text-sm text-neutral-600 dark:text-neutral-400">Ingresos Atribuidos (Facturas Pagadas):</span>
                       <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">+$85,000 MXN</span>
                     </div>
                     <div className="flex justify-between items-center p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl mt-4">
                       <span className="font-black text-emerald-900 dark:text-emerald-100">Retorno de Inversión (ROI):</span>
                       <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">466%</span>
                     </div>
                   </div>
                 </div>

                 {/* Análisis de Sentimiento IA */}
                 <div className="border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl bg-white dark:bg-black flex flex-col justify-center">
                   <h4 className="font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2"><MessageCircle className="h-5 w-5 text-indigo-500" /> Sentiment Analysis (Respuestas Mails)</h4>
                   <div className="flex w-full h-4 rounded-full overflow-hidden mb-3">
                     <div className="bg-emerald-500 w-[70%]" title="Positivo (70%)"></div>
                     <div className="bg-neutral-300 dark:bg-neutral-600 w-[20%]" title="Neutral (20%)"></div>
                     <div className="bg-rose-500 w-[10%]" title="Negativo (10%)"></div>
                   </div>
                   <p className="text-xs text-neutral-500 leading-relaxed">La IA analizó 142 respuestas a la campaña. El sentimiento es abrumadoramente <strong className="text-emerald-600">Positivo (70%)</strong>. No hay alertas de desgaste de audiencia ni molestias por frecuencia de envíos.</p>
                 </div>
               </div>
            </div>
          )}

          {/* 6. LEGAL Y PRIVACIDAD */}
          {activeTab === 'legal' && (
            <div className="space-y-6 animate-in fade-in duration-300 flex flex-col items-center justify-center min-h-[400px] text-center">
              <div className="bg-blue-50 dark:bg-blue-500/10 p-6 rounded-full mb-4 border border-blue-100 dark:border-blue-500/20">
                <ShieldCheck className="h-12 w-12 text-blue-500" />
              </div>
              <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-2">Centro de Cumplimiento (LFPDPPP)</h2>
              <p className="text-neutral-500 text-sm max-w-lg mb-8 leading-relaxed">
                Gestión inmutable de consentimientos (Opt-in). Permite a los contactos gestionar sus preferencias o solicitar la eliminación total de sus datos de marketing.
              </p>
              
              <div className="w-full max-w-2xl bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl text-left space-y-4">
                <div className="flex items-center justify-between p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm">
                  <div>
                    <h4 className="font-bold text-sm text-neutral-900 dark:text-white">Centro de Preferencias</h4>
                    <p className="text-[10px] text-neutral-500 mt-1">URL pública para que el usuario elija qué tipo de correos recibir.</p>
                  </div>
                  <button className="text-xs font-bold text-blue-600 hover:underline">Copiar Enlace</button>
                </div>

                <div className="flex items-center justify-between p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800/30 rounded-xl shadow-sm">
                  <div>
                    <h4 className="font-bold text-sm text-rose-900 dark:text-rose-100">Derecho al Olvido (Borrado Seguro)</h4>
                    <p className="text-[10px] text-rose-700 dark:text-rose-400 mt-1 max-w-sm">Elimina o anonimiza los datos de contacto de marketing para un usuario específico, deteniendo permanentemente todos los Journeys.</p>
                  </div>
                  <button className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                    <Trash2 className="h-4 w-4" /> Ejecutar Borrado
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}