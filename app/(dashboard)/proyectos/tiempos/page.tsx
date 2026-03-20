'use client';

import React, { useState, useEffect } from 'react';
import { 
  Clock, Play, Pause, CheckCircle2, AlertTriangle, 
  Calendar, LayoutGrid, Smartphone, Zap, ShieldCheck, 
  DollarSign, FileText, Send, Search, Filter, 
  TrendingUp, BarChart, Receipt, Plus, History, 
  Lock, Calendar as CalendarIcon, ArrowUpRight, Calculator, FileSignature
} from 'lucide-react';

export default function ControlTiemposPage() {
  const [activeTab, setActiveTab] = useState('captura');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);

  // Lógica del Cronómetro
  useEffect(() => {
    let interval: any;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-zinc-950 p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* HEADER DE CONTROL DE TIEMPOS */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-sky-500/10 p-3 rounded-2xl border border-sky-500/20">
              <Clock className="h-8 w-8 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">Control de Tiempos</h1>
                <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-black px-2 py-1 rounded-full uppercase">
                  Timesheets Active
                </span>
              </div>
              <p className="text-neutral-500 font-medium text-sm mt-1 flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" /> Captura dinámica y Rentabilidad Marginal.
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 text-neutral-700 dark:text-zinc-300 font-bold rounded-xl text-xs border border-neutral-200 dark:border-zinc-700 hover:bg-neutral-50 transition-all">
              <History className="h-4 w-4" /> Sincronizar
            </button>
            <button className="flex items-center gap-2 px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white font-black rounded-xl transition-all shadow-lg shadow-sky-500/20 text-xs">
              <Send className="h-4 w-4" /> Enviar Semana
            </button>
          </div>
        </header>

        {/* INDICADORES DE BI */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-neutral-200 dark:border-zinc-800">
            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Utilización</p>
            <p className="text-2xl font-black text-neutral-950 dark:text-white mt-1">88.5%</p>
            <div className="w-full bg-neutral-100 dark:bg-zinc-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-sky-500 h-full w-[88.5%]"></div>
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-neutral-200 dark:border-zinc-800 border-l-4 border-l-emerald-500">
            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Facturable</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">32.5 h</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-neutral-200 dark:border-zinc-800 border-l-4 border-l-rose-500">
            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Burn Rate</p>
            <p className="text-2xl font-black text-rose-600 mt-1">92%</p>
          </div>
          <div className="bg-zinc-900 dark:bg-white p-5 rounded-2xl text-white dark:text-black">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Margen Real</p>
            <p className="text-2xl font-black mt-1">$1,240 <span className="text-xs">/ h</span></p>
          </div>
        </div>

        {/* NAVEGACIÓN */}
        <div className="flex gap-2 border-b border-neutral-200 dark:border-zinc-800 pb-2">
          {[
            { id: 'captura', name: 'Captura', icon: Clock },
            { id: 'grid', name: 'Rejilla', icon: LayoutGrid },
            { id: 'approval', name: 'Aprobaciones', icon: ShieldCheck },
            { id: 'analytics', name: 'Analítica', icon: BarChart },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === tab.id 
                ? 'bg-sky-600 text-white shadow-lg' 
                : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-zinc-900'
              }`}
            >
              <tab.icon className="h-4 w-4" /> {tab.name}
            </button>
          ))}
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm min-h-[400px]">
          {activeTab === 'captura' && (
            <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 p-6 bg-neutral-900 text-white rounded-3xl shadow-2xl relative overflow-hidden">
                <Zap className="absolute top-0 right-0 h-32 w-32 opacity-10" />
                <h3 className="text-xs font-black uppercase tracking-widest text-sky-400 mb-4">Cronómetro</h3>
                <div className="py-8 text-5xl font-mono font-black text-center tabular-nums">{formatTime(seconds)}</div>
                <button 
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-black transition-all ${
                    isTimerRunning ? 'bg-rose-600' : 'bg-emerald-600'
                  }`}
                >
                  {isTimerRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  {isTimerRunning ? 'Pausar' : 'Iniciar'}
                </button>
              </div>

              <div className="lg:col-span-2 space-y-3">
                <h3 className="font-black text-neutral-900 dark:text-white mb-4">Registros Recientes</h3>
                {[
                  { task: 'Validación KYC', time: '2:30h' },
                  { task: 'Consultoría Fiscal', time: '1:15h' },
                ].map((entry, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-zinc-800 rounded-2xl border border-neutral-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-sky-100 text-sky-600 rounded-xl"><DollarSign className="h-4 w-4" /></div>
                      <span className="text-sm font-bold">{entry.task}</span>
                    </div>
                    <span className="font-mono font-black">{entry.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="p-8 flex justify-center items-center">
              <div className="bg-neutral-900 text-white p-8 rounded-3xl max-w-lg w-full text-center">
                <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-4">Utilización</p>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 font-mono italic text-sm mb-6">
                  U = (Horas Facturables / Horas Totales) * 100
                </div>
                <div className="flex justify-between items-end">
                  <p className="text-3xl font-black text-emerald-400">88.5%</p>
                  <BarChart className="h-10 w-10 text-sky-500 opacity-20" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER ACCIONES */}
        <footer className="flex justify-between items-center py-4 border-t border-neutral-200 dark:border-zinc-800">
          <button className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-xl text-xs font-black flex items-center gap-2">
            <Receipt className="h-4 w-4" /> Facturar Horas
          </button>
          <button className="px-6 py-2 bg-amber-500 text-white font-black rounded-xl text-xs shadow-lg">
            Solicitar Tiempo Extra
          </button>
        </footer>

      </div>
    </div>
  );
}