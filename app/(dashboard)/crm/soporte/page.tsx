'use client';

import React, { useState } from 'react';
import {
  Ticket, Clock, AlertTriangle, ShieldCheck, BrainCircuit,
  MessageSquare, ArrowRight, UserCheck, Star, BarChart3,
  Bot, FileText, Search, Plus, Filter, MoreVertical,
  Paperclip, Send, Archive, RefreshCw, FileSignature,
  Phone, MessageCircle, Mail, SplitSquareHorizontal, Zap, Lock
} from 'lucide-react';

export default function MesaDeAyudaPage() {
  const [activeTab, setActiveTab] = useState('tickets');
  const [selectedTicket, setSelectedTicket] = useState(1);

  const tickets = [
    {
      id: 1, folio: 'TK-2026-089', cliente: 'Constructora Horizonte', asunto: 'Error en Factura XML',
      estado: 'Abierto', prioridad: 'Alta', sla: '02:15:00', sentimiento: 'Enojado',
      origen: 'WhatsApp', objetoERP: 'Factura F-1042'
    },
    {
      id: 2, folio: 'TK-2026-090', cliente: 'Tech Solutions Inc.', asunto: 'Duda sobre renovación de licencias',
      estado: 'En Progreso', prioridad: 'Media', sla: '14:30:00', sentimiento: 'Neutral',
      origen: 'Portal', objetoERP: 'Contrato C-2025'
    },
    {
      id: 3, folio: 'TK-2026-091', cliente: 'Servicios Logísticos Norte', asunto: 'Falla en acceso a dashboard',
      estado: 'Escalado', prioridad: 'Crítica', sla: '-00:45:00', sentimiento: 'Muy Enojado',
      origen: 'Email', objetoERP: 'Usuario U-88'
    }
  ];

  // Fórmula LateX a HTML para evitar errores de compilación JSX
  const slaFormula = (
    <span>
      SLA% = (<span className="font-mono text-xs">Tickets resueltos a tiempo</span> / <span className="font-mono text-xs">Total de tickets creados</span>) &times; 100
    </span>
  );

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* HEADER ERP */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-sky-500/10 p-3 rounded-2xl border border-sky-500/20">
              <Ticket className="h-8 w-8 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">Mesa de Ayuda (Tickets)</h1>
              <p className="text-neutral-500 font-medium text-sm mt-1 flex items-center gap-2">
                <BrainCircuit className="h-4 w-4" /> IA Agéntica, SLAs Contractuales y Soporte Omnicanal.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all text-sm border border-neutral-200 dark:border-neutral-700">
              <RefreshCw className="h-4 w-4" /> Sincronizar Canales
            </button>
            <button className="flex items-center gap-2 px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white font-black rounded-xl transition-all shadow-lg shadow-sky-500/20 text-sm">
              <Plus className="h-4 w-4" /> Nuevo Ticket Manual
            </button>
          </div>
        </header>

        {/* TOP METRICS (KPIs de Soporte) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between border-l-4 border-l-emerald-500">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Cumplimiento SLA</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">96.4%</p>
              <p className="text-[10px] text-emerald-500 mt-1 font-bold flex items-center gap-1"><UserCheck className="h-3 w-3" /> Dentro de norma</p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl"><Clock className="h-6 w-6 text-emerald-500" /></div>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">CSAT (Satisfacción)</p>
              <p className="text-2xl font-black text-neutral-900 dark:text-white mt-1">4.8 <span className="text-sm font-medium text-neutral-500">/ 5.0</span></p>
              <div className="flex gap-1 mt-1 text-amber-400">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-amber-400" />
                ))}
                <Star className="h-3 w-3 fill-amber-400 opacity-50" />
              </div>
            </div>
            <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl"><Star className="h-6 w-6 text-neutral-500" /></div>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">FCR (First Contact)</p>
              <p className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-1">72%</p>
              <p className="text-[10px] text-neutral-400 mt-1 font-bold">Resueltos a la primera</p>
            </div>
            <div className="p-3 bg-sky-50 dark:bg-sky-500/10 rounded-xl"><Zap className="h-6 w-6 text-sky-500" /></div>
          </div>
          <div className="bg-gradient-to-br from-neutral-900 to-black dark:from-sky-950 dark:to-black p-5 rounded-2xl border border-neutral-800 flex items-center justify-between text-white border-l-4 border-l-sky-500">
            <div>
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Tasa de Deflexión</p>
              <p className="text-2xl font-black text-white mt-1">34%</p>
              <p className="text-[10px] text-sky-400 mt-1 font-bold flex items-center gap-1"><Bot className="h-3 w-3" /> Resueltos por Triaje IA</p>
            </div>
            <div className="p-3 bg-sky-500/20 rounded-xl"><Bot className="h-6 w-6 text-sky-400" /></div>
          </div>
        </div>

        {/* NAVEGACIÓN DE MÓDULOS */}
        <div className="flex overflow-x-auto border-b border-neutral-200 dark:border-neutral-800 pb-2 gap-2">
          {[
            { id: 'tickets', label: 'Bandeja de Tickets & IA', icon: Ticket },
            { id: 'dashboard', label: 'Dashboard y SLAs', icon: BarChart3 },
            { id: 'omnicanal', label: 'Omnicanalidad y Bots', icon: MessageSquare },
            { id: 'knowledge', label: 'Base de Conocimiento', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
                    : 'bg-white dark:bg-neutral-900 text-neutral-500 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                }`}
              >
                <Icon className="h-4 w-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* ÁREA DE CONTENIDO */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm min-h-[600px] overflow-hidden">

          {/* 1. BANDEJA DE TICKETS E IA */}
          {activeTab === 'tickets' && (
            <div className="flex flex-col lg:flex-row h-[700px]">

              {/* Columna Izquierda: Lista de Tickets */}
              <div className="w-full lg:w-1/3 border-r border-neutral-200 dark:border-neutral-800 flex flex-col bg-neutral-50 dark:bg-black">
                <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-black text-neutral-900 dark:text-white">Bandeja Activa</h3>
                    <Filter className="h-4 w-4 text-neutral-400 cursor-pointer" />
                  </div>
                  <div className="flex items-center gap-2 bg-white dark:bg-neutral-900 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <Search className="h-4 w-4 text-neutral-400" />
                    <input type="text" placeholder="Buscar ticket, RFC o Folio..." className="bg-transparent border-none outline-none text-sm font-medium text-neutral-900 dark:text-white w-full" />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {tickets.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTicket(t.id)}
                      className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                        selectedTicket === t.id
                        ? 'bg-sky-50 dark:bg-sky-900/10 border-sky-200 dark:border-sky-800'
                        : 'bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 hover:border-sky-300'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black uppercase text-neutral-500">{t.folio}</span>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                          t.prioridad === 'Crítica' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400' :
                          t.prioridad === 'Alta' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400' :
                          'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400'
                        }`}>{t.prioridad}</span>
                      </div>
                      <p className="font-bold text-sm text-neutral-900 dark:text-white truncate">{t.asunto}</p>
                      <p className="text-[10px] text-neutral-500 mt-1 truncate">{t.cliente}</p>

                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                        <div className="flex items-center gap-1">
                          {t.origen === 'WhatsApp' ? <MessageCircle className="h-3 w-3 text-emerald-500" /> :
                            t.origen === 'Email' ? <Mail className="h-3 w-3 text-blue-500" /> :
                              <Bot className="h-3 w-3 text-sky-500" />}
                          <span className="text-[9px] text-neutral-400">{t.origen}</span>
                        </div>
                        <div className={`flex items-center gap-1 text-[10px] font-bold ${t.sla.includes('-') ? 'text-rose-600' : 'text-neutral-500'}`}>
                          <Clock className="h-3 w-3" /> SLA: {t.sla}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Columna Derecha: Detalle del Ticket */}
              {selectedTicket && (
                <div className="flex-1 flex flex-col bg-white dark:bg-neutral-900 h-full">
                  {/* Cabecera del Ticket */}
                  <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h2 className="text-xl font-black text-neutral-900 dark:text-white">TK-2026-089: Error en Factura XML</h2>
                          <span className="bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400 text-[10px] font-black uppercase px-2 py-0.5 rounded flex items-center gap-1">
                            <BrainCircuit className="h-3 w-3" /> Sentimiento: Enojado
                          </span>
                        </div>
                        <p className="text-sm text-neutral-500">De: <strong>Constructora Horizonte</strong> (VIP) • Vía WhatsApp API</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors" title="Fusión de Tickets"><SplitSquareHorizontal className="h-4 w-4" /></button>
                        <button className="bg-neutral-950 dark:bg-white text-white dark:text-black font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-2 shadow-sm">
                          Resolver Ticket
                        </button>
                      </div>
                    </div>

                    {/* Botones Críticos de Operación */}
                    <div className="flex flex-wrap gap-2">
                      <button className="text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-3 py-1.5 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center gap-1 border border-neutral-200 dark:border-neutral-700">
                        <ArrowRight className="h-3 w-3" /> Escalar a Nivel 2
                      </button>
                      <button className="text-[10px] font-bold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-md hover:bg-amber-100 dark:hover:bg-amber-900/40 flex items-center gap-1 border border-amber-200 dark:border-amber-800">
                        <Clock className="h-3 w-3" /> Solicitar Más Info (Pausar SLA)
                      </button>
                      <button className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 px-3 py-1.5 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/40 flex items-center gap-1 border border-indigo-200 dark:border-indigo-800">
                        <FileSignature className="h-3 w-3" /> Ver Expediente Legal
                      </button>
                      <div className="ml-auto text-[10px] font-bold bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 px-3 py-1.5 rounded-md flex items-center gap-1 border border-sky-200 dark:border-sky-800">
                        <Paperclip className="h-3 w-3" /> Vinculado a: Factura F-1042
                      </div>
                    </div>
                  </div>

                  {/* Cuerpo de Conversación e IA */}
                  <div className="flex-1 flex overflow-hidden">
                    {/* Chat y Notas */}
                    <div className="flex-1 flex flex-col border-r border-neutral-200 dark:border-neutral-800">
                      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-neutral-50/50 dark:bg-black/20">

                        {/* Mensaje Cliente */}
                        <div className="flex gap-3 max-w-[85%]">
                          <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center font-bold text-xs">CH</div>
                          <div>
                            <div className="bg-white dark:bg-neutral-800 p-3 rounded-2xl rounded-tl-none border border-neutral-200 dark:border-neutral-700 shadow-sm text-sm text-neutral-700 dark:text-neutral-300">
                              Hola. El XML de la factura F-1042 que me generaron ayer tiene un error en el Uso de CFDI. Me urge corregirlo porque Contabilidad no me la acepta para cierre de mes. ¡Es urgente!
                            </div>
                            <p className="text-[10px] text-neutral-400 mt-1">Ayer 16:30 • Vía WhatsApp</p>
                          </div>
                        </div>

                        {/* Nota Interna */}
                        <div className="flex justify-center">
                          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 px-4 py-2 rounded-xl text-xs text-amber-800 dark:text-amber-400 flex items-center gap-2 max-w-[80%]">
                            <Lock className="h-3 w-3" />
                            <strong>Nota Interna (Angel Ortiz):</strong> Revisé el módulo fiscal. El error se debe a que actualizaron su Constancia de Situación Fiscal ayer por la mañana. Voy a cancelar la F-1042 y re-timbrar.
                          </div>
                        </div>

                      </div>

                      {/* Input de Respuesta */}
                      <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                        <div className="flex gap-2">
                          <button className="p-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 rounded-xl hover:text-sky-500 transition-colors" title="Respuestas Enlatadas">
                            <Zap className="h-5 w-5" />
                          </button>
                          <input type="text" placeholder="Escribe tu respuesta al cliente..." className="flex-1 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 text-sm outline-none focus:border-sky-500" />
                          <button className="p-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-md transition-colors">
                            <Send className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Panel Lateral Derecho: IA Agéntica */}
                    <div className="w-64 bg-sky-50/50 dark:bg-sky-950/20 p-4 flex flex-col border-l border-neutral-200 dark:border-neutral-800">
                      <h4 className="text-xs font-black text-sky-900 dark:text-sky-100 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <BrainCircuit className="h-4 w-4" /> Sugerencias IA
                      </h4>
                      <div className="space-y-4">
                        <div className="bg-white dark:bg-neutral-900 p-3 rounded-xl border border-sky-200 dark:border-sky-800 shadow-sm">
                          <p className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase mb-1">Diagnóstico Automático</p>
                          <p className="text-xs text-neutral-700 dark:text-neutral-300">Posible discrepancia entre el C.P. del ticket y el C.P. de la Constancia (LCO).</p>
                        </div>
                        <div className="bg-white dark:bg-neutral-900 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                          <p className="text-[10px] font-bold text-neutral-500 uppercase mb-1">Acción Recomendada ERP</p>
                          <button className="w-full mt-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white text-xs font-bold py-2 rounded-lg transition-colors border border-neutral-200 dark:border-neutral-700">
                            Re-timbrar Factura F-1042
                          </button>
                        </div>
                        <div className="bg-white dark:bg-neutral-900 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                          <p className="text-[10px] font-bold text-neutral-500 uppercase mb-1">Artículo Relacionado</p>
                          <p className="text-xs text-sky-600 dark:text-sky-400 font-medium hover:underline cursor-pointer">"Cómo cambiar el Uso de CFDI en facturas vigentes"</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. DASHBOARD Y SLAS */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in duration-300 flex flex-col items-center">
              <div className="w-full flex justify-between items-center bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl">
                <div>
                  <h3 className="font-black text-neutral-900 dark:text-white text-lg flex items-center gap-2"><Clock className="h-5 w-5 text-emerald-500" /> Monitoreo de Acuerdos de Nivel de Servicio (SLA)</h3>
                  <p className="text-xs text-neutral-500 mt-1">Visualización del cumplimiento contractual para evitar penalizaciones legales.</p>
                </div>
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 px-4 py-3 rounded-xl text-center shadow-sm">
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Fórmula de Cumplimiento</p>
                  <div className="font-mono text-sm font-black text-neutral-800 dark:text-neutral-200">
                    {slaFormula}
                  </div>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl bg-white dark:bg-black">
                  <h4 className="font-bold text-neutral-900 dark:text-white mb-4">Tickets por Nivel de Prioridad (SLA Restante)</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-rose-600 dark:text-rose-400">Crítica (&lt; 2h para vencer)</span>
                        <span className="text-rose-600">3 Tickets</span>
                      </div>
                      <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2"><div className="bg-rose-500 h-2 rounded-full animate-pulse" style={{ width: '15%' }}></div></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-amber-600 dark:text-amber-400">Alta (&lt; 8h para vencer)</span>
                        <span className="text-amber-600">12 Tickets</span>
                      </div>
                      <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2"><div className="bg-amber-500 h-2 rounded-full" style={{ width: '45%' }}></div></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-emerald-600 dark:text-emerald-400">Normal (Sano)</span>
                        <span className="text-emerald-600">45 Tickets</span>
                      </div>
                      <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2"><div className="bg-emerald-500 h-2 rounded-full" style={{ width: '80%' }}></div></div>
                    </div>
                  </div>
                </div>

                <div className="border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl bg-white dark:bg-black">
                  <h4 className="font-bold text-neutral-900 dark:text-white mb-4">Lógica de Escalamiento Automático</h4>
                  <div className="space-y-3">
                    <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800">
                      <p className="text-sm font-bold text-neutral-900 dark:text-white mb-1">Tier 1 a Tier 2 (Supervisión)</p>
                      <p className="text-xs text-neutral-500">Se activa si un ticket "Normal" lleva &gt; 24h sin primera respuesta.</p>
                      <span className="inline-block mt-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 text-[10px] font-black uppercase px-2 py-1 rounded">Activo</span>
                    </div>
                    <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800">
                      <p className="text-sm font-bold text-neutral-900 dark:text-white mb-1">Alerta a Dirección General</p>
                      <p className="text-xs text-neutral-500">Se activa si un ticket "Crítico" incumple el SLA y pertenece a un cliente VIP.</p>
                      <span className="inline-block mt-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 text-[10px] font-black uppercase px-2 py-1 rounded">Activo</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. OMNICANALIDAD Y BOTS */}
          {activeTab === 'omnicanal' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row justify-between items-center bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 p-5 rounded-2xl gap-4">
                <div className="flex items-start gap-4">
                  <MessageSquare className="h-8 w-8 text-blue-500 mt-1" />
                  <div>
                    <h3 className="font-black text-blue-900 dark:text-blue-100 text-lg">Conversión Channel-to-Ticket & Triaje</h3>
                    <p className="text-xs text-blue-700 dark:text-blue-400 mt-1 leading-relaxed max-w-2xl">
                      El sistema identifica automáticamente el RFC, teléfono o correo del emisor para vincular el mensaje entrante con su expediente en el CRM y crear el ticket.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Bot de Triaje */}
                <div className="border border-sky-200 dark:border-sky-900/50 rounded-2xl p-6 bg-sky-50/50 dark:bg-sky-950/20 md:col-span-2">
                  <h4 className="font-bold text-sky-900 dark:text-sky-100 flex items-center gap-2 mb-4"><Bot className="h-5 w-5" /> Chatbot Deflector (Portal Autoservicio)</h4>
                  <p className="text-sm text-sky-800 dark:text-sky-300 mb-4">El bot procesa lenguaje natural para resolver consultas básicas (Facturas, Estatus de Pedido, Horarios) antes de crear un ticket.</p>
                  <div className="bg-white dark:bg-black p-4 rounded-xl border border-sky-100 dark:border-sky-800 shadow-sm space-y-3">
                    <div className="flex justify-end"><div className="bg-neutral-100 dark:bg-neutral-800 p-2.5 rounded-2xl rounded-tr-none text-xs">¿Cómo descargo mi factura de ayer?</div></div>
                    <div className="flex justify-start"><div className="bg-sky-100 dark:bg-sky-900/40 p-2.5 rounded-2xl rounded-tl-none text-xs text-sky-900 dark:text-sky-100">He localizado tu factura F-1042. Puedes descargar el XML y PDF dando clic en este enlace seguro. ¿Resolví tu duda?</div></div>
                  </div>
                </div>

                {/* Fuentes Integradas */}
                <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 bg-white dark:bg-black">
                  <h4 className="font-bold text-neutral-900 dark:text-white mb-4 text-sm">Orígenes de Tickets</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3"><Mail className="h-5 w-5 text-neutral-400" /> <span className="text-sm font-bold">Email (soporte@...)</span></div>
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3"><MessageCircle className="h-5 w-5 text-emerald-500" /> <span className="text-sm font-bold">WhatsApp API</span></div>
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3"><Phone className="h-5 w-5 text-indigo-500" /> <span className="text-sm font-bold">PBX / Conmutador</span></div>
                      <span className="w-2 h-2 rounded-full bg-rose-500" title="Desconectado"></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. BASE DE CONOCIMIENTO */}
          {activeTab === 'knowledge' && (
            <div className="space-y-6 animate-in fade-in duration-300 flex flex-col items-center justify-center min-h-[400px] text-center">
              <div className="bg-neutral-100 dark:bg-neutral-800 p-6 rounded-full mb-4 border border-neutral-200 dark:border-neutral-700">
                <FileText className="h-12 w-12 text-neutral-500" />
              </div>
              <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-2">Base de Conocimientos Interna (KB)</h2>
              <p className="text-neutral-500 text-sm max-w-lg mb-8 leading-relaxed">
                Repositorio de artículos técnicos y soluciones. La Inteligencia Artificial escanea estos documentos para sugerir respuestas en tiempo real a los agentes.
              </p>

              <div className="flex gap-4">
                <button className="px-6 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white font-black rounded-xl text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors shadow-sm flex items-center gap-2">
                  <Search className="h-4 w-4" /> Buscar en Artículos
                </button>
                <button className="px-6 py-3 bg-neutral-950 dark:bg-white text-white dark:text-black font-black rounded-xl text-sm hover:scale-[1.02] transition-transform shadow-md flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Crear Nuevo Artículo
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}