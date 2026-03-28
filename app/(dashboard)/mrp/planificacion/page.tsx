'use client';

import React, { useState } from 'react';
import { 
  GanttChartSquare, Calendar, Cpu, Clock, AlertTriangle, 
  Play, Zap, Scale, Layers, Settings, Users, Wrench, 
  TrendingDown, BarChart3, MousePointer2, ShieldAlert,
  ArrowRightLeft, RefreshCw, Activity, ChevronRight, 
  CheckCircle2, Lock, Eye, FileSignature
} from 'lucide-react';

export default function PlanificacionProduccionPage() {
  const [activeTab, setActiveTab] = useState('gantt');
  const [isSimulation, setIsSimulation] = useState(false);

  // Simulación de carga de maquinaria (CRP)
  const machines = [
    { id: 'M1', name: 'CNC-Laser Pro (Centro A)', load: 88, status: 'Sobrecarga', type: 'Finita' },
    { id: 'M2', name: 'Ensamble Robótico v4', load: 45, status: 'Óptimo', type: 'Finita' },
    { id: 'M3', name: 'Estación de Pintura', load: 92, status: 'Crítico', type: 'Finita' },
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
                  {isSimulation ? 'Simulación What-If' : 'Planificación Maestro (MPS)'}
                </h1>
                <span className="bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 text-[10px] font-black px-2 py-1 rounded-full uppercase">
                  MRP II v2026
                </span>
              </div>
              <p className="text-neutral-500 font-medium text-sm mt-1 flex items-center gap-2">
                <Activity className="h-4 w-4" /> Optimización de Carga Finita y JIT (Just-in-Time).
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setIsSimulation(!isSimulation)}
              className={`flex items-center gap-2 px-4 py-2 font-bold rounded-xl text-xs transition-all border ${
                isSimulation 
                ? 'bg-indigo-600 text-white border-indigo-700' 
                : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-200'
              }`}
            >
              <Zap className="h-4 w-4" /> {isSimulation ? 'Detener Simulación' : 'Modo What-If'}
            </button>
            <button className="flex items-center gap-2 px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl transition-all shadow-lg shadow-rose-500/20 text-xs">
              <Play className="h-4 w-4" /> Lanzar a Piso
            </button>
          </div>
        </header>

        {/* INDICADORES DE VALLAS DE TIEMPO Y RIESGO LEGAL */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-neutral-200 dark:border-zinc-800 border-l-4 border-l-rose-500">
            <div className="flex justify-between items-start">
              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Valla de Tiempo</p>
              <Lock className="h-4 w-4 text-rose-500" />
            </div>
            <p className="text-2xl font-black text-neutral-950 dark:text-white mt-1">CONGELADO</p>
            <p className="text-[10px] text-rose-500 font-bold mt-2">Próximos 3 días sin cambios permitidos</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-neutral-200 dark:border-zinc-800 border-l-4 border-l-amber-500">
            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Riesgo Contractual</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">4 Órdenes</p>
            <p className="text-[10px] text-amber-500 font-bold mt-2 flex items-center gap-1">
              <Scale className="h-3 w-3" /> Cláusula de demora activa
            </p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-neutral-200 dark:border-zinc-800">
            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Utilización CRP</p>
            <p className="text-2xl font-black text-neutral-950 dark:text-white mt-1">94.2%</p>
            <div className="w-full bg-neutral-100 dark:bg-zinc-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-emerald-500 h-full w-[94.2%]"></div>
            </div>
          </div>
          <div className="bg-zinc-900 dark:bg-white p-5 rounded-2xl border border-zinc-800 dark:border-zinc-200 text-white dark:text-black">
            <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Optimización IA</p>
            <p className="text-2xl font-black mt-1">Heijunka Activo</p>
            <p className="text-[10px] text-emerald-400 dark:text-emerald-600 font-bold mt-2 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Carga nivelada automáticamente
            </p>
          </div>
        </div>

        {/* NAVEGACIÓN DE CONTROL */}
        <div className="flex gap-2 border-b border-neutral-200 dark:border-zinc-800 pb-2 overflow-x-auto">
          {[
            { id: 'gantt', name: 'Diagrama de Gantt', icon: BarChart3 },
            { id: 'capacity', name: 'Capacidad de Recursos (CRP)', icon: Cpu },
            { id: 'scheduling', name: 'Lógicas de Programación', icon: Clock },
            { id: 'compliance', name: 'Seguridad y RH', icon: ShieldAlert },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id 
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/20' 
                : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-zinc-900'
              }`}
            >
              <tab.icon className="h-4 w-4" /> {tab.name}
            </button>
          ))}
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
          
          {/* TAB 1: GANTT INTERACTIVO (MOCK) */}
          {activeTab === 'gantt' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-black text-neutral-900 dark:text-white">Gantt de Producción: Camino Crítico</h3>
                  <p className="text-xs text-neutral-500">Programación JIT basada en pedidos CRM.</p>
                </div>
                <div className="flex gap-2">
                  <button className="flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl text-[10px] font-black border border-rose-200 dark:border-rose-800">
                    <MousePointer2 className="h-3 w-3" /> Camino Crítico
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-neutral-950 dark:bg-white text-white dark:text-black rounded-xl text-[10px] font-black">
                    <RefreshCw className="h-3 w-3" /> Sincronizar Piso
                  </button>
                </div>
              </div>

              {/* MOCK VISUAL DE GANTT */}
              <div className="space-y-4 font-mono">
                {[
                  { label: 'Ensamblado CIFRA Demo X2', start: '10%', width: '50%', color: 'bg-rose-500', status: 'Iniciado' },
                  { label: 'Calibración Láser', start: '60%', width: '20%', color: 'bg-rose-500', status: 'Dependiente' },
                  { label: 'Control de Calidad', start: '80%', width: '15%', color: 'bg-emerald-500', status: 'Planificado' },
                ].map((task, i) => (
                  <div key={i} className="relative h-12 bg-neutral-100 dark:bg-zinc-800/50 rounded-xl overflow-hidden">
                    <div 
                      className={`absolute top-0 h-full ${task.color} border-r-4 border-black/10 flex items-center px-4 transition-all hover:brightness-110 cursor-move shadow-inner`}
                      style={{ left: task.start, width: task.width }}
                    >
                      <span className="text-[10px] text-white font-black truncate">{task.label}</span>
                    </div>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-neutral-400">
                      {task.status}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex justify-center">
                <p className="text-[10px] text-neutral-400 flex items-center gap-2">
                  <ArrowRightLeft className="h-3 w-3" /> Arrastra tareas para recalcular fechas de entrega automáticamente.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: CRP (CAPACIDAD) */}
          {activeTab === 'capacity' && (
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-neutral-900 dark:text-white">Carga de Centros de Trabajo (CRP)</h3>
                <button className="px-4 py-2 bg-rose-600 text-white font-black text-xs rounded-xl shadow-lg">Nivelar Capacidad</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {machines.map((m) => (
                  <div key={m.id} className="p-6 bg-neutral-50 dark:bg-black/40 border border-neutral-100 dark:border-zinc-800 rounded-3xl group hover:border-rose-500 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-white dark:bg-zinc-900 p-2 rounded-xl border border-neutral-200 dark:border-zinc-800">
                        <Cpu className="h-5 w-5 text-rose-500" />
                      </div>
                      <span className={`text-[10px] font-black px-2 py-1 rounded-full ${
                        m.status === 'Crítico' ? 'bg-rose-100 text-rose-600 animate-pulse' : 
                        m.status === 'Sobrecarga' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        {m.status}
                      </span>
                    </div>
                    <h4 className="font-black text-neutral-900 dark:text-white">{m.name}</h4>
                    <p className="text-[10px] text-neutral-500 mt-1 uppercase tracking-widest">Carga {m.type}</p>
                    
                    <div className="mt-6 flex items-end justify-between">
                      <div className="flex-1 mr-4">
                        <div className="flex justify-between text-[10px] mb-2 font-bold">
                          <span>Uso de Potencial</span>
                          <span className={m.load > 90 ? 'text-rose-500' : ''}>{m.load}%</span>
                        </div>
                        <div className="h-2.5 bg-neutral-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-1000 ${m.load > 90 ? 'bg-rose-600' : 'bg-emerald-500'}`} style={{ width: `${m.load}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ALERTA PREDICTIVA IA */}
              <div className="mt-8 p-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-3xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Wrench className="h-8 w-8 text-amber-600" />
                  <div>
                    <h4 className="font-black text-amber-900 dark:text-amber-100">Mantenimiento Predictivo IA</h4>
                    <p className="text-xs text-amber-700">Sensor CNC detecta vibración anómala. Falla probable en 48h. El plan se ajustará automáticamente.</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white border border-amber-300 dark:border-amber-800 font-bold text-xs rounded-xl shadow-sm">
                  Reprogramar Mantenimiento
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: SCHEDULING LOGIC */}
          {activeTab === 'scheduling' && (
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-xl font-black text-neutral-900 dark:text-white">Motor de Secuenciación</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-5 border-2 border-rose-500 bg-rose-50/30 dark:bg-rose-900/10 rounded-2xl relative">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-black text-rose-700 dark:text-rose-400">Backward Scheduling (Hacia Atrás)</span>
                      <ShieldAlert className="h-4 w-4 text-rose-500" />
                    </div>
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      El sistema calcula el inicio basándose en la fecha de entrega del cliente. Prioriza el <strong>Just-in-Time</strong> para reducir costos de inventario.
                    </p>
                  </div>
                  <div className="p-5 border border-neutral-200 dark:border-zinc-800 rounded-2xl opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
                    <span className="text-sm font-bold text-neutral-700 dark:text-zinc-300">Forward Scheduling (Hacia Adelante)</span>
                    <p className="text-xs text-neutral-500 mt-2">Maximiza la utilización de la planta iniciando las tareas lo antes posible.</p>
                  </div>
                </div>
              </div>

              <div className="bg-neutral-50 dark:bg-black/40 p-8 rounded-3xl border border-neutral-100 dark:border-zinc-800">
                <h4 className="font-black text-neutral-900 dark:text-white mb-4">Parámetros de IA Agéntica</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-100 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg"><Layers className="h-4 w-4 text-rose-600" /></div>
                      <span className="text-xs font-bold">Optimizar Set-ups por Color</span>
                    </div>
                    <div className="w-10 h-5 bg-rose-600 rounded-full relative"><div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div></div>
                  </div>
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                    <h5 className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-1">Sugerencia de Lote IA</h5>
                    <p className="text-xs text-indigo-600 leading-tight">Agrupar órdenes #104 y #108 ahorra 2.5 horas de preparación de máquina.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: COMPLIANCE & LEGAL */}
          {activeTab === 'compliance' && (
            <div className="p-8">
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 p-8 rounded-3xl shadow-sm text-center">
                  <FileSignature className="h-12 w-12 text-rose-500 mx-auto mb-4" />
                  <h3 className="text-xl font-black text-neutral-900 dark:text-white">Firma de Responsabilidad de Plan</h3>
                  <p className="text-sm text-neutral-500 mt-2">
                    Cualquier cambio manual en el plan maestro (MPS) requiere firma digital CIFRA. Los retrasos detectados afectarán proactivamente los contratos en el módulo Legal.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-6 bg-neutral-100 dark:bg-zinc-800 rounded-2xl">
                    <h4 className="text-xs font-black uppercase text-neutral-500 mb-2">Validación de Personal RH</h4>
                    <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                      <CheckCircle2 className="h-4 w-4" /> 12 Operarios Capacitados
                    </div>
                    <p className="text-[10px] text-neutral-400 mt-2">Certificaciones técnicas vigentes verificadas.</p>
                  </div>
                  <div className="p-6 bg-neutral-100 dark:bg-zinc-800 rounded-2xl">
                    <h4 className="text-xs font-black uppercase text-neutral-500 mb-2">Alerta de Suministro</h4>
                    <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                      <AlertTriangle className="h-4 w-4" /> Falta Componente BOM X2
                    </div>
                    <p className="text-[10px] text-neutral-400 mt-2">Retraso en SCM detectado por proveedor.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}