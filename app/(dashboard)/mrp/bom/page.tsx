'use client';

import React, { useState } from 'react';
import { 
  GanttChartSquare, Calendar, Cpu, Clock, AlertTriangle, 
  Play, Zap, Scale, Layers, Settings, Users, Wrench, 
  TrendingDown, BarChart3, MousePointer2, ShieldAlert,
  ArrowRightLeft, RefreshCw, Activity, ChevronRight, ChevronDown
} from 'lucide-react';

export default function PlanificacionProduccionPage() {
  const [activeTab, setActiveTab] = useState('gantt');
  const [isSimulation, setIsSimulation] = useState(false);

  // Simulación de carga de maquinaria
  const machines = [
    { id: 'M1', name: 'CNC-Laser Pro', load: 85, status: 'Overload' },
    { id: 'M2', name: 'Ensamble Robótico A', load: 40, status: 'Optimal' },
    { id: 'M3', name: 'Área de Pintura', load: 95, status: 'Critical' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-zinc-950 p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* HEADER ESTRATÉGICO */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl border transition-all ${isSimulation ? 'bg-indigo-500/20 border-indigo-500 animate-pulse' : 'bg-rose-500/10 border-rose-500/20'}`}>
              <GanttChartSquare className={`h-8 w-8 ${isSimulation ? 'text-indigo-500' : 'text-rose-600 dark:text-rose-400'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">
                  {isSimulation ? 'Modo Simulación (What-if)' : 'Planificación MRP II'}
                </h1>
                {isSimulation && (
                  <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-1 rounded-full uppercase">Sandbox Activo</span>
                )}
              </div>
              <p className="text-neutral-500 font-medium text-sm mt-1 flex items-center gap-2">
                <Activity className="h-4 w-4" /> Optimización de Carga Finita y Secuenciación IA.
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setIsSimulation(!isSimulation)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl text-xs border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-all"
            >
              <Zap className="h-4 w-4" /> {isSimulation ? 'Salir de Simulación' : 'Modo What-if'}
            </button>
            <button className="flex items-center gap-2 px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl transition-all shadow-lg shadow-rose-500/20 text-xs">
              <Play className="h-4 w-4" /> Lanzar Órdenes
            </button>
          </div>
        </header>

        {/* KPIs DE CAPACIDAD Y RIESGO FINANCIERO */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-neutral-200 dark:border-zinc-800">
            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Eficiencia Global (OEE)</p>
            <p className="text-2xl font-black text-neutral-950 dark:text-white mt-1">82.4%</p>
            <p className="text-[10px] text-emerald-500 font-bold mt-2 flex items-center gap-1 italic">
              OEE = A \times P \times Q
            </p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-neutral-200 dark:border-zinc-800 border-l-4 border-l-amber-500">
            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Órdenes en Riesgo</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">4 Pedidos</p>
            <p className="text-[10px] text-amber-500 font-bold mt-2 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Afecta Facturación de Abril
            </p>
          </div>
          <div className="bg-rose-50 dark:bg-rose-900/10 p-5 rounded-2xl border border-rose-200 dark:border-rose-800/50">
            <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Penalizaciones Legales</p>
            <p className="text-2xl font-black text-rose-700 dark:text-rose-400 mt-1">$12,400.00</p>
            <p className="text-[10px] text-rose-500 font-bold mt-2 flex items-center gap-1">
              <Scale className="h-3 w-3" /> Provisión por Retraso Contractual
            </p>
          </div>
          <div className="bg-zinc-900 dark:bg-white p-5 rounded-2xl border border-zinc-800 dark:border-zinc-200 text-white dark:text-black">
            <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Costo de Oportunidad</p>
            <p className="text-2xl font-black mt-1">$2,500 <span className="text-xs">/ hr</span></p>
            <p className="text-[10px] text-rose-400 dark:text-rose-600 font-bold mt-2">Máquina Parada (CNC-Laser)</p>
          </div>
        </div>

        {/* NAVEGACIÓN DE MÓDULO */}
        <div className="flex gap-2 border-b border-neutral-200 dark:border-zinc-800 pb-2">
          {[
            { id: 'scheduling', name: 'Lógicas de Programación', icon: Clock },
            { id: 'gantt', name: 'Gantt Interactivo', icon: BarChart3 },
            { id: 'capacity', name: 'Carga & Recursos (CRP)', icon: Cpu },
            { id: 'legal', name: 'Impacto Legal/Finanzas', icon: Scale },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === tab.id 
                ? 'bg-rose-600 text-white shadow-lg' 
                : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-zinc-900'
              }`}
            >
              <tab.icon className="h-4 w-4" /> {tab.name}
            </button>
          ))}
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
          
          {/* TAB 1: SCHEDULING LOGIC */}
          {activeTab === 'scheduling' && (
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-xl font-black text-neutral-900 dark:text-white">Motor de Secuenciación</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 border-2 border-rose-500 bg-rose-50/30 dark:bg-rose-900/10 rounded-2xl relative cursor-pointer">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-black text-rose-700 dark:text-rose-400">Backward Scheduling</span>
                      <ShieldAlert className="h-4 w-4 text-rose-500" />
                    </div>
                    <p className="text-xs text-neutral-500 mt-2">Basado en fecha de entrega CRM (JIT - Just in Time).</p>
                  </div>
                  <div className="p-4 border border-neutral-200 dark:border-zinc-800 rounded-2xl hover:border-rose-300 transition-colors cursor-pointer">
                    <span className="text-sm font-bold text-neutral-700 dark:text-zinc-300">Forward Scheduling</span>
                    <p className="text-xs text-neutral-500 mt-2">Prioriza rapidez. Ideal para productos en stock.</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-neutral-100 dark:border-zinc-800">
                  <h4 className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-4">Parámetros de IA</h4>
                  <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-black rounded-xl">
                    <span className="text-xs font-bold">Agrupación por Color (Pintura)</span>
                    <div className="w-10 h-5 bg-rose-600 rounded-full relative"><div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div></div>
                  </div>
                </div>
              </div>

              <div className="bg-neutral-50 dark:bg-black/40 p-8 rounded-3xl border border-neutral-100 dark:border-zinc-800 flex flex-col justify-center text-center">
                <RefreshCw className="h-12 w-12 text-rose-500 mx-auto mb-4 animate-spin-slow" />
                <h3 className="font-black text-neutral-900 dark:text-white">Explosión de Capacidades</h3>
                <p className="text-xs text-neutral-500 mt-2 max-w-xs mx-auto">Analizando si los recursos actuales soportan el plan de ventas del trimestre...</p>
                <button className="mt-6 bg-zinc-900 dark:bg-white text-white dark:text-black font-black py-3 px-6 rounded-xl text-xs hover:scale-105 transition-transform">Ejecutar Análisis CRP</button>
              </div>
            </div>
          )}

          {/* TAB 2: GANTT INTERACTIVO (MOCK) */}
          {activeTab === 'gantt' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-black text-neutral-900 dark:text-white">Diagrama de Gantt: Camino Crítico</h3>
                  <p className="text-xs text-neutral-500 italic">Arrastra y suelta tareas para recalcular dependencias.</p>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-black uppercase">
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-rose-500 rounded"></div> Crítico</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-neutral-300 rounded"></div> Holgura</div>
                </div>
              </div>
              
              {/* MOCK GANTT BODY */}
              <div className="space-y-4 font-mono">
                {[
                  { label: 'Corte Láser (SRV-ADASTRA)', start: '0%', width: '40%', color: 'bg-rose-500' },
                  { label: 'Ensamble PCB AllSafe', start: '35%', width: '30%', color: 'bg-rose-500' },
                  { label: 'Control de Calidad Final', start: '65%', width: '20%', color: 'bg-emerald-500' },
                  { label: 'Empaque y Logística', start: '85%', width: '15%', color: 'bg-neutral-400' },
                ].map((task, i) => (
                  <div key={i} className="relative h-12 bg-neutral-100 dark:bg-zinc-800/50 rounded-lg overflow-hidden group">
                    <div 
                      className={`absolute top-0 h-full ${task.color} border-r-4 border-black/10 flex items-center px-4 transition-all group-hover:brightness-110 cursor-move`}
                      style={{ left: task.start, width: task.width }}
                    >
                      <span className="text-[10px] text-white font-black truncate">{task.label}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex justify-center">
                <button className="flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-rose-500 transition-colors">
                  <MousePointer2 className="h-4 w-4" /> Activar Edición Manual
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: CRP (CAPACIDAD Y RECURSOS) */}
          {activeTab === 'capacity' && (
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {machines.map((m) => (
                  <div key={m.id} className="p-6 bg-neutral-50 dark:bg-black/40 border border-neutral-100 dark:border-zinc-800 rounded-3xl">
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-white dark:bg-zinc-900 p-2 rounded-xl border border-neutral-200 dark:border-zinc-800">
                        <Cpu className="h-5 w-5 text-rose-500" />
                      </div>
                      <span className={`text-[10px] font-black px-2 py-1 rounded-full ${
                        m.status === 'Critical' ? 'bg-rose-100 text-rose-600' : 
                        m.status === 'Overload' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        {m.status}
                      </span>
                    </div>
                    <h4 className="font-black text-neutral-900 dark:text-white">{m.name}</h4>
                    <div className="mt-4 flex items-end justify-between">
                      <div className="flex-1 mr-4">
                        <div className="flex justify-between text-[10px] mb-1 font-bold">
                          <span>Carga</span>
                          <span>{m.load}%</span>
                        </div>
                        <div className="h-2 bg-neutral-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div className={`h-full transition-all ${m.load > 90 ? 'bg-rose-600' : 'bg-emerald-500'}`} style={{ width: `${m.load}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-rose-50/30 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800/50 rounded-3xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Users className="h-8 w-8 text-rose-600" />
                  <div>
                    <h4 className="font-black text-rose-900 dark:text-rose-100">Disponibilidad de Operarios</h4>
                    <p className="text-xs text-rose-700">Cruze con Nómina: 2 operarios especializados en descanso médico.</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white border border-rose-300 dark:border-rose-800 font-bold text-xs rounded-xl shadow-sm">
                  Reasignar Turnos
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: LEGAL & FINANZAS INTEGRATION */}
          {activeTab === 'legal' && (
            <div className="p-8">
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm">
                  <h4 className="font-black text-rose-600 flex items-center gap-2 mb-4">
                    <ShieldAlert className="h-5 w-5" /> Análisis de Riesgo Contractual
                  </h4>
                  <p className="text-sm text-neutral-600 dark:text-zinc-400 leading-relaxed">
                    El sistema detectó que la Orden <strong>#SO-2026-X</strong> tiene una fecha de entrega límite según contrato con <strong>Ad Astra Corp</strong>. El plan actual tiene un retraso de 3.2 días.
                  </p>
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="p-4 bg-neutral-50 dark:bg-black rounded-2xl">
                      <p className="text-[10px] font-black text-neutral-500 uppercase mb-1">Multa Diaria Est.</p>
                      <p className="text-xl font-black text-rose-600">$1,500.00</p>
                    </div>
                    <div className="p-4 bg-neutral-50 dark:bg-black rounded-2xl">
                      <p className="text-[10px] font-black text-neutral-500 uppercase mb-1">Impacto Total</p>
                      <p className="text-xl font-black text-rose-600">$4,800.00</p>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900 dark:bg-white p-6 rounded-3xl text-white dark:text-black flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <TrendingDown className="h-8 w-8 text-rose-400" />
                    <div>
                      <h4 className="font-black">OEE & Análisis de Eficiencia</h4>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">Estamos perdiendo 15% de rentabilidad por cuellos de botella en Pintura.</p>
                    </div>
                  </div>
                  <button className="px-6 py-2 bg-rose-600 text-white font-black rounded-xl text-xs">Ver Dashboard BI</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}