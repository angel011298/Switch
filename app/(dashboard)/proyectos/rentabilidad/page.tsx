'use client';

import React, { useState } from 'react';
import { 
  TrendingUp, Calculator, Lock, Zap, History, 
  ArrowUpRight, Activity, ShieldCheck, 
  BarChart, Target, Scale, BrainCircuit, Eye, Receipt
} from 'lucide-react';

export default function RentabilidadPage() {
  const [activeTab, setActiveTab] = useState('analisis');

  // Lógica financiera blindada
  const ingresosPOC = 325000;
  const costosTotales = 220000;
  const margenBruto = ((ingresosPOC - costosTotales) / ingresosPOC) * 100;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-zinc-950 p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* HEADER DE ALTA DIRECCIÓN */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20">
              <TrendingUp className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">Rentabilidad</h1>
                <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-black px-2 py-1 rounded-full uppercase">
                  <Lock className="h-3 w-3" /> NIVEL SOCIO
                </div>
              </div>
              <p className="text-neutral-500 font-medium text-sm flex items-center gap-2 mt-1">
                <Calculator className="h-4 w-4" /> Reconocimiento de Ingresos (POC).
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-6 py-2 bg-neutral-950 dark:bg-white text-white dark:text-black font-black rounded-xl text-xs shadow-lg transition-transform hover:scale-105">
              <History className="h-4 w-4 inline mr-2" /> Congelar Margen
            </button>
          </div>
        </header>

        {/* DASHBOARD DE MÉTRICAS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-neutral-200 border-l-4 border-l-emerald-500 shadow-sm">
            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Margen Bruto</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{margenBruto.toFixed(1)}%</p>
            <p className="text-[10px] text-emerald-500 font-bold mt-2">Saludable</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-neutral-200 border-l-4 border-l-sky-500 shadow-sm">
            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Ingreso POC</p>
            <p className="text-2xl font-black mt-1">$325,000</p>
            <p className="text-[10px] text-sky-500 font-bold mt-2">Avance: 65%</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-neutral-200 border-l-4 border-l-rose-500 shadow-sm">
            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Burn Rate</p>
            <p className="text-2xl font-black text-rose-600 mt-1">$42,500</p>
            <p className="text-[10px] text-rose-500 font-bold mt-2">Mensual</p>
          </div>
          <div className="bg-zinc-900 dark:bg-white p-5 rounded-2xl text-white dark:text-black shadow-xl">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 text-sky-400">Punto de Equilibrio</p>
            <p className="text-2xl font-black mt-1">ALCANZADO</p>
            <p className="text-[10px] text-emerald-400 font-bold mt-2 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Marzo 2026
            </p>
          </div>
        </div>

        {/* PESTAÑAS DE ANÁLISIS */}
        <div className="flex gap-2 border-b border-neutral-200 dark:border-zinc-800 pb-2 overflow-x-auto">
          {[
            { id: 'analisis', name: 'Motor de Costeo', icon: Calculator },
            { id: 'varianza', name: 'Varianza', icon: BarChart },
            { id: 'legal', name: 'Contrato', icon: Scale },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id ? 'bg-emerald-600 text-white shadow-lg' : 'text-neutral-500 hover:bg-neutral-100'
              }`}
            >
              <tab.icon className="h-4 w-4" /> {tab.name}
            </button>
          ))}
        </div>

        {/* CONTENIDO DEL ANÁLISIS */}
        <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl min-h-[450px] overflow-hidden shadow-sm">
          {activeTab === 'analisis' && (
            <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                <h3 className="text-xl font-black text-neutral-900 dark:text-white">Motor de Rentabilidad Marginal</h3>
                <div className="p-6 bg-neutral-950 text-white rounded-3xl font-mono text-xs border border-white/10 shadow-inner">
                  Margen = ((Ingreso POC - Costos Directos) / Ingreso POC) * 100
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-neutral-50 dark:bg-black rounded-2xl border border-neutral-100 dark:border-zinc-800">
                    <div className="flex justify-between mb-2">
                      <span className="text-xs font-black">Carga Social y Mano de Obra</span>
                      <span className="font-mono font-bold">$180,000</span>
                    </div>
                    <div className="h-1.5 bg-neutral-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="bg-sky-500 h-full w-[70%]"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-indigo-600 text-white p-8 rounded-3xl relative overflow-hidden flex flex-col justify-center text-center">
                <BrainCircuit className="absolute -right-8 -top-8 h-48 w-48 text-white/10" />
                <h4 className="font-black text-xs uppercase tracking-widest text-indigo-200 mb-4">IA Agéntica (CIFRA AI)</h4>
                <p className="text-lg font-bold">Optimiza el margen del {margenBruto.toFixed(1)}% reasignando tareas de revisión a pasantes.</p>
                <button className="mt-6 bg-white text-indigo-600 py-3 px-6 rounded-xl font-black text-xs hover:scale-105 transition-all shadow-lg">
                  Aplicar Optimización
                </button>
              </div>
            </div>
          )}

          {activeTab === 'legal' && (
            <div className="p-8">
              <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800 p-8 rounded-3xl flex justify-between items-center">
                <div className="flex gap-4">
                  <Scale className="h-10 w-10 text-rose-600" />
                  <div>
                    <h4 className="font-black text-rose-900 dark:text-rose-100 text-xl tracking-tight">Riesgo de Penalización</h4>
                    <p className="text-sm text-rose-700 dark:text-rose-400 mt-1">Detección de retraso: multa estimada del 0.5% sobre contrato total.</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-rose-600">-$5,000.00</p>
                  <p className="text-[10px] font-black uppercase text-rose-400 tracking-widest">Impacto en Margen</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ACCIONES DEL FOOTER */}
        <footer className="flex justify-between items-center py-4 border-t border-neutral-200 dark:border-zinc-800">
          <button className="px-6 py-2 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-xl text-xs font-black flex items-center gap-2 transition-colors hover:bg-neutral-800">
            <Eye className="h-4 w-4" /> Audit-Trail de Costos
          </button>
          <button className="px-6 py-2 bg-emerald-600 text-white font-black rounded-xl text-xs shadow-lg transition-transform hover:scale-105">
            Cierre Contable Automático
          </button>
        </footer>

      </div>
    </div>
  );
}