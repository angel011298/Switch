'use client';

import React, { useState } from 'react';
import { 
  Briefcase, GanttChart, Users, DollarSign, 
  Clock, Target, AlertTriangle, ShieldCheck, 
  FileText, Plus, Search, Filter, Play, 
  ChevronRight, ChevronDown, BarChart3, 
  UserPlus, FileOutput, Archive, Zap, 
  TrendingUp, Scale, LayoutList, BrainCircuit,
  History
} from 'lucide-react';

// Moví la data fuera del componente para evitar errores de parseo internos
const wbsData = [
  {
    id: 'p1',
    name: 'Auditoría de Cumplimiento CNBV',
    type: 'Fase',
    status: 'En Proceso',
    progress: 65,
    subtasks: [
      { id: 't1', name: 'Recolección de Evidencia KYC', type: 'Tarea', owner: 'Asociado Senior', hours: 40, critical: true },
      { id: 't2', name: 'Validación de Firmas CIFRA', type: 'Tarea', owner: 'Auditor IT', hours: 20, critical: false },
      { id: 'h1', name: 'Entrega de Informe Preliminar', type: 'Hito', owner: 'Socio', hours: 0, critical: true }
    ]
  }
];

export default function GestionProyectosPage() {
  const [activeTab, setActiveTab] = useState('wbs');
  const [showAIInsights, setShowAIInsights] = useState(true);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-zinc-950 p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-sky-500/10 p-3 rounded-2xl border border-sky-500/20">
              <Briefcase className="h-8 w-8 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">Gestión de Proyectos</h1>
                <span className="bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 text-[10px] font-black px-2 py-1 rounded-full uppercase">PSA</span>
              </div>
              <p className="text-neutral-500 font-medium text-sm mt-1 flex items-center gap-2">
                <LayoutList className="h-4 w-4" /> Estructura WBS y Rentabilidad.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-6 py-2 bg-sky-600 text-white font-black rounded-xl text-xs shadow-lg shadow-sky-500/20"><Plus className="h-4 w-4" /> Nuevo Proyecto</button>
          </div>
        </header>

        {/* DASHBOARD RENTABILIDAD */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-neutral-200 dark:border-zinc-800">
            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Burn Rate</p>
            <p className="text-2xl font-black mt-1">62.4%</p>
            <div className="w-full bg-neutral-100 dark:bg-zinc-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-sky-500 h-full w-[62.4%]"></div>
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-neutral-200 dark:border-zinc-800 border-l-4 border-l-emerald-500">
            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Margen Bruto</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">44.8%</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-neutral-200 dark:border-zinc-800">
            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Horas</p>
            <p className="text-2xl font-black mt-1">1,240 <span className="text-xs">hrs</span></p>
          </div>
          <div className="bg-zinc-900 dark:bg-white p-5 rounded-2xl text-white dark:text-black">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Hitos</p>
            <p className="text-2xl font-black mt-1">3 <span className="text-xs">Milestones</span></p>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-2 border-b border-neutral-200 dark:border-zinc-800 pb-2">
          {['wbs', 'gantt', 'resources', 'finance'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-xl font-bold text-sm capitalize ${activeTab === tab ? 'bg-sky-600 text-white shadow-lg' : 'text-neutral-500'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* CONTENIDO */}
        <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl min-h-[400px] p-6">
          {activeTab === 'wbs' && (
            <div className="space-y-4">
              {wbsData.map((phase) => (
                <div key={phase.id} className="border border-neutral-100 dark:border-zinc-800 rounded-2xl p-4">
                  <div className="flex items-center gap-3 font-black text-neutral-900 dark:text-white">
                    <ChevronDown className="h-4 w-4 text-sky-500" /> {phase.name}
                  </div>
                  <div className="mt-4 space-y-2">
                    {phase.subtasks.map((task) => (
                      <div key={task.id} className="ml-6 flex justify-between items-center p-2 hover:bg-neutral-50 dark:hover:bg-zinc-800 rounded-lg">
                        <span className={`text-xs ${task.critical ? 'text-rose-500 font-bold' : ''}`}>{task.name}</span>
                        <span className="text-[10px] font-bold text-neutral-400">{task.owner}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {activeTab === 'finance' && (
            <div className="flex justify-center items-center h-full">
              <div className="bg-neutral-900 text-white p-8 rounded-3xl text-center">
                <p className="text-[10px] uppercase font-bold text-sky-400 mb-2">Fórmula de Rentabilidad</p>
                <div className="text-sm font-mono italic p-4 bg-white/5 rounded-xl border border-white/10">
                  Margen Bruto = ((Ingresos - Costos) / Ingresos) * 100
                </div>
              </div>
            </div>
          )}
        </div>

        <footer className="flex justify-between py-4 border-t border-neutral-200 dark:border-zinc-800">
          <button className="flex items-center gap-2 px-4 py-2 bg-neutral-950 dark:bg-white text-white dark:text-black rounded-xl text-xs font-black"><FileOutput className="h-4 w-4" /> Reporte Avance</button>
          <button className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-black"><Archive className="h-4 w-4" /> Cerrar Proyecto</button>
        </footer>

      </div>
    </div>
  );
}