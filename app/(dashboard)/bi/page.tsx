'use client';

import { useState, useMemo } from 'react';

import { 
    BarChart3, BrainCircuit, Download, Search, Filter, 
    TrendingUp, AlertTriangle, FileText, Sliders, CalendarClock, 
    Lock, Wand2, Database, RefreshCw, BellRing, Target, Activity,
    ChevronRight, Archive, MessageSquare, LayoutDashboard // <-- AGREGADO AQUÍ
  } from 'lucide-react';
import { 
  ComposedChart, AreaChart, Area, Bar, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

// Datos Simulados: Forecasting (Pasado + Predicción IA)
const forecastData = [
  { mes: 'Oct', real: 420, predictivo: null },
  { mes: 'Nov', real: 480, predictivo: null },
  { mes: 'Dic', real: 610, predictivo: null },
  { mes: 'Ene', real: 390, predictivo: null },
  { mes: 'Feb', real: 450, predictivo: null },
  { mes: 'Mar', real: 490, predictivo: 490 }, // Punto de unión
  { mes: 'Abr', real: null, predictivo: 520, optimista: 580, pesimista: 480 },
  { mes: 'May', real: null, predictivo: 550, optimista: 620, pesimista: 500 },
  { mes: 'Jun', real: null, predictivo: 590, optimista: 680, pesimista: 530 },
];

export default function BusinessIntelligencePage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'predictivo' | 'exportacion' | 'alertas'>('dashboard');
  const [isSyncing, setIsSyncing] = useState(false);
  const [nlqQuery, setNlqQuery] = useState('');
  
  // Variables del Simulador What-If
  const [nominaDelta, setNominaDelta] = useState(0); // Porcentaje de aumento/decremento
  const [costoMatDelta, setCostoMatDelta] = useState(0);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 2500);
  };

  // Cálculo en vivo del Simulador What-If
  const simuladorResultados = useMemo(() => {
    const margenBase = 32.5; // 32.5%
    const impactoNomina = (nominaDelta * 0.4); // Asumiendo que nómina es 40% del costo
    const impactoMateriales = (costoMatDelta * 0.6); // Asumiendo que materiales son 60% del costo
    const nuevoMargen = margenBase - impactoNomina - impactoMateriales;
    return nuevoMargen.toFixed(2);
  }, [nominaDelta, costoMatDelta]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* HEADER & NLQ SEARCH BAR */}
        <header className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-500/10 p-3 rounded-2xl border border-indigo-500/20">
                <BarChart3 className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">Business Intelligence (BI)</h1>
                <p className="text-neutral-500 font-medium text-sm mt-1 flex items-center gap-2">
                  <Database className="h-4 w-4" /> Motor OLAP In-Memory • Actualizado hace 2 min
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button className="flex items-center justify-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all text-sm border border-neutral-200 dark:border-neutral-700">
                <Filter className="h-4 w-4" /> Filtros Globales (Q1 2026)
              </button>
              <button onClick={handleSync} className="flex items-center justify-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all text-sm border border-neutral-200 dark:border-neutral-700">
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} /> Sincronizar
              </button>
            </div>
          </div>

          {/* BARRA NLQ (Natural Language Query) */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Wand2 className="h-5 w-5 text-indigo-500 group-focus-within:animate-pulse" />
            </div>
            <input 
              type="text" 
              className="block w-full pl-12 pr-4 py-4 bg-indigo-50/50 dark:bg-indigo-900/10 border-2 border-indigo-100 dark:border-indigo-900/30 rounded-2xl text-neutral-900 dark:text-white placeholder-indigo-400/70 focus:ring-0 focus:border-indigo-500 transition-all font-medium text-lg outline-none" 
              placeholder="Pregúntale a la IA (Ej. '¿Cuál fue el margen de utilidad del Proyecto Fénix vs la nómina gastada?')"
              value={nlqQuery}
              onChange={(e) => setNlqQuery(e.target.value)}
            />
            <div className="absolute inset-y-0 right-2 flex items-center">
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 py-2 rounded-xl shadow-md transition-transform hover:scale-[1.02] text-sm flex items-center gap-2">
                Generar Gráfica
              </button>
            </div>
          </div>
        </header>

        {/* CONTENEDOR DE PESTAÑAS */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm min-h-[600px] overflow-hidden">
          
          <div className="flex overflow-x-auto border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-black/50 p-2 gap-2">
            {[
              { id: 'dashboard', label: 'Dashboard Consolidado', icon: LayoutDashboard },
              { id: 'predictivo', label: 'Analítica Predictiva (IA)', icon: BrainCircuit },
              { id: 'exportacion', label: 'Exportación y Auditoría', icon: Archive },
              { id: 'alertas', label: 'Alertas y Schedules', icon: BellRing },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' 
                    : 'bg-white dark:bg-neutral-900 text-neutral-500 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                }`}
              >
                <tab.icon className="h-4 w-4" /> {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            
            {/* 1. DASHBOARD CONSOLIDADO & DATA STORYTELLING */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                
                {/* Data Storytelling (IA) */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-900/50 p-5 rounded-2xl flex items-start gap-4">
                  <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-xl mt-1">
                    <MessageSquare className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-indigo-950 dark:text-indigo-100 mb-1">Resumen Ejecutivo Inteligente (Q1 2026)</h3>
                    <p className="text-sm text-indigo-900/80 dark:text-indigo-200/80 leading-relaxed font-medium">
                      Este trimestre, los ingresos brutos crecieron un <strong className="text-emerald-600 dark:text-emerald-400">12%</strong> ($4.2M), impulsados principalmente por el cierre del Contrato Marco con <em>Constructora Horizonte</em> (CRM). Sin embargo, el margen de utilidad neta se contrajo un <strong className="text-rose-600 dark:text-rose-400">3.2%</strong> debido a dos factores: un incremento no planificado en costos logísticos (SCM - Avería de Unidad 14) y penalizaciones por SLA vencidos en soporte técnico. <strong className="text-indigo-700 dark:text-indigo-300 cursor-pointer hover:underline">Ver desglose detallado.</strong>
                    </p>
                  </div>
                </div>

                {/* KPIs con Drill-Down visual */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="border border-neutral-200 dark:border-neutral-800 p-5 rounded-2xl bg-white dark:bg-black group hover:border-indigo-500 transition-colors cursor-pointer">
                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2 flex justify-between">Ingresos Brutos <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500"/></p>
                    <p className="text-3xl font-black text-neutral-900 dark:text-white">$4.2M <span className="text-sm text-emerald-500 ml-2">↑ 12%</span></p>
                    <div className="mt-4 flex gap-1 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 w-[60%]" title="Productos (60%)"></div>
                      <div className="bg-purple-500 w-[30%]" title="Servicios (30%)"></div>
                      <div className="bg-sky-500 w-[10%]" title="Licencias (10%)"></div>
                    </div>
                    <p className="text-[10px] text-neutral-400 mt-2 font-bold text-center">Clic para Drill-Down por Sucursal</p>
                  </div>

                  <div className="border border-neutral-200 dark:border-neutral-800 p-5 rounded-2xl bg-white dark:bg-black group hover:border-rose-500 transition-colors cursor-pointer relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-rose-500 text-white text-[9px] font-black px-2 py-1 rounded-bl-lg">¡ALERTA!</div>
                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2 flex justify-between">Gastos Operativos (OPEX) <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-rose-500"/></p>
                    <p className="text-3xl font-black text-neutral-900 dark:text-white">$1.8M <span className="text-sm text-rose-500 ml-2">↑ 8%</span></p>
                    <p className="text-xs font-bold text-rose-500 mt-3 flex items-center gap-1"><AlertTriangle className="h-3 w-3"/> Desviación detectada en Mantenimiento</p>
                    <p className="text-[10px] text-neutral-400 mt-2 font-bold text-center">Clic para Drill-Through a Facturas XML</p>
                  </div>

                  <div className="border border-neutral-200 dark:border-neutral-800 p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-900 relative">
                    <div className="absolute inset-0 bg-neutral-200/50 dark:bg-black/50 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center rounded-2xl">
                      <Lock className="h-6 w-6 text-neutral-500 mb-2" />
                      <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400 text-center px-4">Costos de Nómina Ocultos<br/><span className="text-[10px] font-normal">Restringido por capa ABAC (Solo Dirección HR)</span></p>
                    </div>
                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Nómina Total</p>
                    <p className="text-3xl font-black text-neutral-300 dark:text-neutral-800 blur-sm">******</p>
                  </div>
                </div>
              </div>
            )}

            {/* 2. ANALÍTICA PREDICTIVA (IA) & WHAT-IF */}
            {activeTab === 'predictivo' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Forecasting Chart (ARIMA) */}
                  <div className="lg:col-span-2 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 bg-white dark:bg-black">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="font-black text-neutral-900 dark:text-white flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-indigo-500" /> Forecasting de Ventas (Q2 2026)
                        </h3>
                        <p className="text-xs text-neutral-500 mt-1">Modelo ARIMA proyectado sobre datos históricos del CRM.</p>
                      </div>
                      <span className="bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 text-[10px] font-black px-2 py-1 rounded uppercase border border-indigo-200 dark:border-indigo-800">Confianza: 92%</span>
                    </div>
                    
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={forecastData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} vertical={false}/>
                          <XAxis dataKey="mes" stroke="#94a3b8" tickLine={false} axisLine={false} fontSize={12} />
                          <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `$${v}k`} />
                          <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", color: 'white', borderRadius: 10 }} />
                          <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }}/>
                          <Bar dataKey="real" name="Ventas Históricas" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                          <Area type="monotone" dataKey="optimista" fill="#10b981" stroke="none" fillOpacity={0.1} />
                          <Area type="monotone" dataKey="pesimista" fill="#ef4444" stroke="none" fillOpacity={0.1} />
                          <Line type="monotone" dataKey="predictivo" name="Predicción IA" stroke="#8b5cf6" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4, fill: '#8b5cf6' }} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Right Column: What-If & Anomalies */}
                  <div className="space-y-6">
                    
                    {/* What-If Simulator */}
                    <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 bg-neutral-50 dark:bg-neutral-900/50 shadow-inner">
                      <h4 className="font-black text-neutral-900 dark:text-white flex items-center gap-2 mb-4">
                        <Sliders className="h-4 w-4 text-purple-500" /> Simulador What-If
                      </h4>
                      <p className="text-[10px] text-neutral-500 font-medium mb-4 leading-tight">Mueve las variables para recalcular el Margen Operativo Proyectado.</p>
                      
                      <div className="space-y-5">
                        <div>
                          <div className="flex justify-between text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-2">
                            <span>Aumento de Nómina (HCM)</span>
                            <span className={nominaDelta > 0 ? 'text-rose-500' : 'text-neutral-500'}>{nominaDelta > 0 ? '+' : ''}{nominaDelta}%</span>
                          </div>
                          <input type="range" min="-10" max="20" step="1" value={nominaDelta} onChange={(e) => setNominaDelta(Number(e.target.value))} className="w-full accent-purple-500" />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-2">
                            <span>Costo de Materiales (SCM)</span>
                            <span className={costoMatDelta > 0 ? 'text-rose-500' : costoMatDelta < 0 ? 'text-emerald-500' : 'text-neutral-500'}>{costoMatDelta > 0 ? '+' : ''}{costoMatDelta}%</span>
                          </div>
                          <input type="range" min="-15" max="25" step="1" value={costoMatDelta} onChange={(e) => setCostoMatDelta(Number(e.target.value))} className="w-full accent-purple-500" />
                        </div>
                      </div>

                      <div className="mt-6 p-4 bg-white dark:bg-black rounded-xl border border-purple-100 dark:border-purple-900 shadow-sm text-center">
                        <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Margen Simulado</p>
                        <p className={`text-3xl font-black ${Number(simuladorResultados) < 30 ? 'text-rose-500' : 'text-emerald-500'}`}>{simuladorResultados}%</p>
                        <p className="text-[9px] text-neutral-400 font-mono mt-1">Margen Base Real: 32.50%</p>
                      </div>
                    </div>

                    {/* Detección de Anomalías & Churn */}
                    <div className="border border-rose-200 dark:border-rose-900/50 rounded-2xl p-5 bg-rose-50/50 dark:bg-rose-950/20">
                      <h4 className="font-black text-rose-900 dark:text-rose-100 flex items-center gap-2 mb-3">
                        <Activity className="h-4 w-4 text-rose-500" /> Churn Prediction (CRM)
                      </h4>
                      <div className="bg-white dark:bg-black p-3 rounded-xl border border-rose-100 dark:border-rose-900 shadow-sm flex justify-between items-center">
                        <div>
                          <p className="font-bold text-sm text-neutral-900 dark:text-white">Servicios Logísticos del Norte</p>
                          <p className="text-[10px] text-neutral-500 mt-0.5">Prob. Abandono: <strong className="text-rose-500">88%</strong> (Tickets sin resolver)</p>
                        </div>
                        <button className="bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300 text-[10px] font-bold px-2 py-1.5 rounded-lg">Ver Detalles</button>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* 3. EXPORTACIÓN MASIVA Y AUDITORÍA */}
            {activeTab === 'exportacion' && (
              <div className="space-y-6 animate-in fade-in duration-300 flex flex-col items-center justify-center min-h-[400px]">
                <div className="bg-emerald-50 dark:bg-emerald-500/10 p-6 rounded-full mb-4 border border-emerald-100 dark:border-emerald-500/20 relative">
                  <Archive className="h-12 w-12 text-emerald-500" />
                  <div className="absolute top-0 right-0 bg-emerald-500 h-4 w-4 rounded-full border-2 border-white dark:border-black animate-ping"></div>
                </div>
                <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-2 text-center">Suite de Auditoría y Exportación Masiva</h2>
                <p className="text-neutral-500 text-sm max-w-lg mb-8 text-center leading-relaxed">
                  Genera reportes de millones de filas en segundo plano (ETL Asíncrono). El archivo ZIP incluirá Base de Datos OLAP, facturas XML (Finanzas), y Logs de Firmas (Legal).
                </p>
                
                <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500 dark:hover:border-emerald-500 p-5 rounded-2xl flex flex-col items-center justify-center gap-3 transition-colors group">
                    <Database className="h-6 w-6 text-neutral-400 group-hover:text-emerald-500 transition-colors" />
                    <span className="font-bold text-neutral-900 dark:text-white text-sm">Exportar Data Lake (Parquet)</span>
                  </button>
                  <button className="bg-emerald-600 hover:bg-emerald-700 text-white border border-transparent p-5 rounded-2xl flex flex-col items-center justify-center gap-3 transition-transform hover:scale-[1.02] shadow-lg shadow-emerald-500/20">
                    <Download className="h-6 w-6" />
                    <span className="font-black text-sm">Generar Suite de Auditoría Fiscal</span>
                  </button>
                </div>

                <div className="w-full max-w-2xl mt-8">
                  <h4 className="font-bold text-neutral-500 uppercase tracking-widest text-[10px] mb-3">Procesos en Segundo Plano</h4>
                  <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
                      <div>
                        <p className="font-bold text-sm text-neutral-900 dark:text-white">Generando: Historial Cobranza Q4_2025.csv</p>
                        <p className="text-[10px] text-neutral-500">Progreso: 65% (Calculando 2.5M filas...)</p>
                      </div>
                    </div>
                    <span className="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 text-[10px] font-black px-2 py-1 rounded">Procesando</span>
                  </div>
                </div>
              </div>
            )}

            {/* 4. ALERTAS Y SCHEDULES */}
            {activeTab === 'alertas' && (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center animate-in fade-in duration-300">
                <div className="bg-amber-50 dark:bg-amber-500/10 p-6 rounded-full mb-4 border border-amber-100 dark:border-amber-500/20">
                  <CalendarClock className="h-12 w-12 text-amber-500" />
                </div>
                <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-2">Reportes Programados</h2>
                <p className="text-neutral-500 text-sm max-w-md mb-6">
                  Configura el envío automático del "Resumen de Flujo de Efectivo" a la Junta Directiva todos los lunes a las 8:00 AM.
                </p>
                <button className="px-6 py-3 bg-neutral-950 dark:bg-white text-white dark:text-black font-black rounded-xl text-sm hover:scale-[1.02] transition-transform shadow-lg">
                  Crear Nuevo Schedule
                </button>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}