'use client';

import { useState } from 'react';
import { 
  Users, Briefcase, GraduationCap, Star, HeartPulse, 
  Kanban, BrainCircuit, Trophy, Target, TrendingDown, 
  ShieldCheck, UploadCloud, Send, MessageSquare, LineChart,
  UserPlus, Search, Filter, Lock, CheckCircle2, AlertTriangle
} from 'lucide-react';

export default function GestionTalentoPage() {
  const [activeTab, setActiveTab] = useState<'ats' | 'onboarding' | 'desempeno' | 'lms' | 'cultura'>('ats');

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* HEADER ERP */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-violet-500/10 p-3 rounded-2xl border border-violet-500/20">
              <Star className="h-8 w-8 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">Gestión del Talento</h1>
              <p className="text-neutral-500 font-medium text-sm mt-1">
                ATS, Evaluaciones 360°, LMS y Análisis de Clima Organizacional (eNPS).
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white font-black rounded-xl transition-all shadow-lg shadow-violet-500/20 text-sm">
              <UserPlus className="h-4 w-4" /> Publicar Vacante
            </button>
          </div>
        </header>

        {/* TOP METRICS (KPIs de Talento) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Turnover Rate (YTD)</p>
              <p className="text-2xl font-black text-neutral-900 dark:text-white mt-1">4.2%</p>
              <p className="text-[10px] text-emerald-500 mt-1 font-bold flex items-center gap-1"><TrendingDown className="h-3 w-3" /> -1.5% vs 2025</p>
            </div>
            <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl"><Users className="h-6 w-6 text-neutral-500" /></div>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between border-l-4 border-l-violet-500">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Time to Hire</p>
              <p className="text-2xl font-black text-violet-600 dark:text-violet-400 mt-1">18 <span className="text-xs font-medium text-violet-500">días</span></p>
              <p className="text-[10px] text-neutral-400 mt-1">Promedio desde apertura</p>
            </div>
            <div className="p-3 bg-violet-50 dark:bg-violet-500/10 rounded-xl"><Briefcase className="h-6 w-6 text-violet-500" /></div>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between border-l-4 border-l-rose-500">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">eNPS (Clima)</p>
              <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">+24</p>
              <p className="text-[10px] text-rose-500 mt-1 font-bold">Alerta: Caída en Ventas</p>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-500/10 rounded-xl"><HeartPulse className="h-6 w-6 text-rose-500" /></div>
          </div>
          <div className="bg-gradient-to-br from-neutral-900 to-black dark:from-violet-950 dark:to-black p-5 rounded-2xl border border-neutral-800 dark:border-violet-500/30 flex items-center justify-between text-white border-l-4 border-l-emerald-500">
            <div>
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Privacidad y Datos</p>
              <p className="text-lg font-black text-white mt-1">Anonimización Activa</p>
              <p className="text-[10px] text-emerald-400 mt-1 font-bold flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Cifrado AES-256</p>
            </div>
            <div className="p-3 bg-neutral-800 dark:bg-violet-500/20 rounded-xl"><Lock className="h-6 w-6 text-emerald-400" /></div>
          </div>
        </div>

        {/* NAVEGACIÓN DE MÓDULOS */}
        <div className="flex overflow-x-auto border-b border-neutral-200 dark:border-neutral-800 pb-2 gap-2">
          {[
            { id: 'ats', label: 'Reclutamiento (ATS)', icon: Kanban },
            { id: 'onboarding', label: 'Onboarding Digital', icon: UserPlus },
            { id: 'desempeno', label: 'Desempeño y 9-Box', icon: Target },
            { id: 'lms', label: 'Capacitación (LMS)', icon: GraduationCap },
            { id: 'cultura', label: 'Cultura y eNPS', icon: HeartPulse },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20' 
                  : 'bg-white dark:bg-neutral-900 text-neutral-500 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
              }`}
            >
              <tab.icon className="h-4 w-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* ÁREA DE CONTENIDO */}
        <main className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm min-h-[600px] p-6">
          
          {/* 1. RECLUTAMIENTO (ATS) */}
          {activeTab === 'ats' && (
            <div className="space-y-6 animate-in fade-in duration-300 overflow-x-auto pb-4">
              <div className="flex justify-between items-center min-w-[800px] mb-4">
                <div>
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white flex items-center gap-2">
                    Pipeline de Selección <span className="bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400 text-[10px] px-2 py-1 rounded-full uppercase">Vacante: Abogado Corporativo Sr.</span>
                  </h2>
                  <p className="text-xs text-neutral-500 mt-1">Parsing de CVs activo con IA (NLP). Evaluando competencias clave.</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-neutral-500 flex items-center gap-1"><BrainCircuit className="h-4 w-4 text-violet-500"/> Candidate Scoring Activo</span>
                </div>
              </div>

              <div className="flex gap-4 min-w-[1000px]">
                {/* Columna: Nuevos */}
                <div className="flex-1 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 flex flex-col min-h-[400px]">
                  <h3 className="font-black text-neutral-500 uppercase tracking-widest text-xs mb-4 flex justify-between">
                    Nuevos (CV Parsing) <span className="bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-700 dark:text-neutral-300">2</span>
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm cursor-grab hover:border-violet-500 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-bold text-sm text-neutral-900 dark:text-white">Roberto García</p>
                        <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-1.5 py-0.5 rounded text-[10px] font-black">Score: 94%</span>
                      </div>
                      <p className="text-[10px] text-neutral-500 mb-3">NLP detectó: "Compliance", "PLD/FT", "Derecho Corporativo".</p>
                      <button className="w-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold py-1.5 rounded-lg text-xs transition-colors">Avanzar a Entrevista</button>
                    </div>
                  </div>
                </div>

                {/* Columna: Entrevista */}
                <div className="flex-1 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 flex flex-col min-h-[400px]">
                  <h3 className="font-black text-blue-500 uppercase tracking-widest text-xs mb-4 flex justify-between">
                    Entrevista Técnica <span className="bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded text-blue-700 dark:text-blue-300">1</span>
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm cursor-grab border-l-4 border-l-blue-500">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-bold text-sm text-neutral-900 dark:text-white">Mariana López</p>
                        <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-1.5 py-0.5 rounded text-[10px] font-black">Score: 88%</span>
                      </div>
                      <p className="text-[10px] text-neutral-500 mb-3">Agendada: Jueves 10:00 AM (Teams)</p>
                    </div>
                  </div>
                </div>

                {/* Columna: Oferta */}
                <div className="flex-1 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 flex flex-col min-h-[400px]">
                  <h3 className="font-black text-violet-500 uppercase tracking-widest text-xs mb-4 flex justify-between">
                    Oferta y Pre-boarding <span className="bg-violet-100 dark:bg-violet-900/50 px-2 py-0.5 rounded text-violet-700 dark:text-violet-300">0</span>
                  </h3>
                  <div className="flex flex-col items-center justify-center h-full text-neutral-400 dark:text-neutral-600 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl m-2">
                    <p className="text-xs font-bold">Arrastra un candidato aquí</p>
                    <p className="text-[10px] mt-1">Disparará el Workflow de Onboarding</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. ONBOARDING DIGITAL */}
          {activeTab === 'onboarding' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 p-5 rounded-2xl gap-4">
                <div>
                  <h3 className="font-black text-emerald-900 dark:text-emerald-100 text-lg flex items-center gap-2"><UserPlus className="h-5 w-5"/> Workflows de Bienvenida</h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 max-w-2xl">
                    Automatiza la transición. Al firmar el contrato en el Módulo Legal, se disparan tareas en TI (Laptops) y Capacitación (Cursos).
                  </p>
                </div>
                <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-2 rounded-xl transition-all shadow-lg shadow-emerald-500/20 text-sm flex items-center gap-2 whitespace-nowrap">
                  <Send className="h-4 w-4" /> Lanzar Onboarding
                </button>
              </div>

              <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 bg-neutral-50 dark:bg-black">
                <h4 className="font-bold text-neutral-900 dark:text-white mb-4">Progreso: Nuevo Ingreso (Sofía Reyes)</h4>
                <div className="relative border-l-2 border-emerald-500 ml-3 space-y-6">
                  <div className="relative pl-6">
                    <span className="absolute -left-[9px] top-1 bg-emerald-500 h-4 w-4 rounded-full flex items-center justify-center"><CheckCircle2 className="h-3 w-3 text-white" /></span>
                    <p className="text-sm font-bold text-neutral-900 dark:text-white">Firma de Contrato (Módulo Legal)</p>
                    <p className="text-[10px] text-neutral-500 mt-0.5">Completado ayer. Contrato resguardado en bóveda.</p>
                  </div>
                  <div className="relative pl-6">
                    <span className="absolute -left-[9px] top-1 bg-amber-500 h-4 w-4 rounded-full border-2 border-white dark:border-black"></span>
                    <p className="text-sm font-bold text-neutral-900 dark:text-white">Asignación de Activos (TI)</p>
                    <p className="text-[10px] text-neutral-500 mt-0.5">Pendiente: Laptop ThinkPad y Monitor. <button className="text-amber-600 dark:text-amber-400 font-bold hover:underline">Ir a Gestión de Activos</button></p>
                  </div>
                  <div className="relative pl-6 opacity-50">
                    <span className="absolute -left-[9px] top-1 bg-neutral-300 dark:bg-neutral-700 h-4 w-4 rounded-full border-2 border-white dark:border-black"></span>
                    <p className="text-sm font-bold text-neutral-900 dark:text-white">Portal de Pre-boarding</p>
                    <p className="text-[10px] text-neutral-500 mt-0.5">Esperando a que el candidato suba INE, RFC y Comprobante de Domicilio.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. DESEMPEÑO Y NINE-BOX */}
          {activeTab === 'desempeno' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white">Matriz Nine-Box y OKRs</h2>
                  <p className="text-xs text-neutral-500 mt-1">Cruce de Potencial vs. Desempeño para identificar futuros líderes.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-neutral-950 dark:bg-white text-white dark:text-black font-bold rounded-xl text-xs shadow-md transition-colors hover:scale-[1.02]">
                  Lanzar Ciclo de Evaluación 360°
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Visualización Simplificada de 9-Box */}
                <div className="lg:col-span-2 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 bg-white dark:bg-black">
                  <h4 className="font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2"><Target className="h-5 w-5 text-indigo-500" /> Mapa de Talento (Q1 2026)</h4>
                  <div className="grid grid-cols-3 grid-rows-3 gap-2 h-[300px]">
                    {/* Top Row (Alto Potencial) */}
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2 border border-amber-100 dark:border-amber-800/50 flex flex-col justify-between"><span className="text-[9px] font-bold text-neutral-400">Enigma</span></div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2 border border-emerald-100 dark:border-emerald-800/50 flex flex-col justify-between"><span className="text-[9px] font-bold text-neutral-400">Estrella Creciente</span></div>
                    <div className="bg-indigo-100 dark:bg-indigo-900/40 rounded-lg p-2 border border-indigo-200 dark:border-indigo-800/50 flex flex-col justify-between shadow-inner">
                      <span className="text-[9px] font-black text-indigo-800 dark:text-indigo-300 uppercase">High Potential</span>
                      <div className="bg-white dark:bg-black text-xs font-bold px-2 py-1 rounded-md text-center shadow-sm">J. Ramírez</div>
                    </div>
                    {/* Middle Row (Potencial Medio) */}
                    <div className="bg-rose-50 dark:bg-rose-900/20 rounded-lg p-2 border border-rose-100 dark:border-rose-800/50 flex flex-col justify-between"><span className="text-[9px] font-bold text-neutral-400">Dilema</span></div>
                    <div className="bg-neutral-100 dark:bg-neutral-800/50 rounded-lg p-2 border border-neutral-200 dark:border-neutral-700 flex flex-col justify-between"><span className="text-[9px] font-bold text-neutral-400">Core Player</span><div className="bg-white dark:bg-black text-xs font-bold px-2 py-1 rounded-md text-center shadow-sm">A. Ortiz</div></div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2 border border-emerald-100 dark:border-emerald-800/50 flex flex-col justify-between"><span className="text-[9px] font-bold text-neutral-400">High Performer</span></div>
                    {/* Bottom Row (Bajo Potencial) */}
                    <div className="bg-red-100 dark:bg-red-900/20 rounded-lg p-2 border border-red-200 dark:border-red-800/50 flex flex-col justify-between"><span className="text-[9px] font-bold text-neutral-400">Underperformer</span></div>
                    <div className="bg-rose-50 dark:bg-rose-900/20 rounded-lg p-2 border border-rose-100 dark:border-rose-800/50 flex flex-col justify-between"><span className="text-[9px] font-bold text-neutral-400">Efectivo</span></div>
                    <div className="bg-neutral-100 dark:bg-neutral-800/50 rounded-lg p-2 border border-neutral-200 dark:border-neutral-700 flex flex-col justify-between"><span className="text-[9px] font-bold text-neutral-400">Profesional Confiable</span></div>
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] font-bold text-neutral-400">
                    <span>Bajo Desempeño</span>
                    <span>Desempeño Excepcional</span>
                  </div>
                </div>

                {/* OKRs */}
                <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 bg-neutral-50 dark:bg-black">
                  <h4 className="font-bold text-neutral-900 dark:text-white mb-4 text-sm">OKRs del Trimestre</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-neutral-700 dark:text-neutral-300">Implementar ERP SCM</span>
                        <span className="text-emerald-600">80%</span>
                      </div>
                      <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2"><div className="bg-emerald-500 h-2 rounded-full" style={{ width: '80%' }}></div></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-neutral-700 dark:text-neutral-300">Certificación CNBV (PLD/FT)</span>
                        <span className="text-blue-600">45%</span>
                      </div>
                      <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{ width: '45%' }}></div></div>
                    </div>
                    <button className="w-full mt-4 text-xs font-bold bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800">Actualizar Progreso</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. CAPACITACIÓN Y APRENDIZAJE (LMS) */}
          {activeTab === 'lms' && (
            <div className="space-y-6 animate-in fade-in duration-300">
               <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 p-4 rounded-2xl">
                  <div>
                    <h3 className="font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2"><GraduationCap className="h-5 w-5" /> Learning Management System</h3>
                    <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">Rutas de aprendizaje con certificación automática en PDF y gamificación.</p>
                  </div>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors shadow-md">
                    Asignar Capacitación
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Course Card 1 */}
                  <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden bg-white dark:bg-black group">
                    <div className="h-24 bg-gradient-to-r from-slate-800 to-slate-900 flex items-center justify-center relative">
                      <ShieldCheck className="h-10 w-10 text-slate-400/50 absolute" />
                      <h4 className="text-white font-black z-10 text-center px-4">Prevención de Lavado de Dinero (PLD/FT)</h4>
                    </div>
                    <div className="p-4 space-y-3">
                      <span className="bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 text-[9px] font-black uppercase px-2 py-1 rounded">Obligatorio (Legal)</span>
                      <p className="text-xs text-neutral-500">Preparación base normativa para cumplimiento CNBV.</p>
                      <div>
                        <div className="flex justify-between text-[10px] font-bold mb-1"><span className="text-neutral-500">Progreso Global Plantilla</span><span className="text-blue-600">65%</span></div>
                        <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5"><div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '65%' }}></div></div>
                      </div>
                    </div>
                  </div>

                  {/* Course Card 2 */}
                  <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden bg-white dark:bg-black group">
                    <div className="h-24 bg-gradient-to-r from-emerald-600 to-teal-600 flex items-center justify-center relative">
                      <LineChart className="h-10 w-10 text-white/20 absolute" />
                      <h4 className="text-white font-black z-10 text-center px-4">Onboarding: ERP Financiero</h4>
                    </div>
                    <div className="p-4 space-y-3">
                      <span className="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 text-[9px] font-black uppercase px-2 py-1 rounded">Habilidades Duras</span>
                      <p className="text-xs text-neutral-500">Uso avanzado del módulo de Gastos XML y BI.</p>
                      <div>
                        <div className="flex justify-between text-[10px] font-bold mb-1"><span className="text-neutral-500">Progreso Global Plantilla</span><span className="text-emerald-600">90%</span></div>
                        <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5"><div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '90%' }}></div></div>
                      </div>
                    </div>
                  </div>

                  {/* Leaderboard (Gamification) */}
                  <div className="border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4 bg-amber-50/50 dark:bg-amber-950/20">
                    <h4 className="font-black text-amber-900 dark:text-amber-100 text-sm flex items-center gap-2 mb-4"><Trophy className="h-4 w-4 text-amber-500" /> Top Learners (Leaderboard)</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-white dark:bg-black p-2 rounded-xl border border-amber-100 dark:border-amber-800/30">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black text-amber-500">1</span>
                          <span className="text-xs font-bold text-neutral-900 dark:text-white">Elena M.</span>
                        </div>
                        <span className="text-[10px] font-mono text-neutral-500">4 Certificados</span>
                      </div>
                      <div className="flex items-center justify-between bg-white dark:bg-black p-2 rounded-xl border border-neutral-100 dark:border-neutral-800/50">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black text-slate-400">2</span>
                          <span className="text-xs font-bold text-neutral-900 dark:text-white">Carlos R.</span>
                        </div>
                        <span className="text-[10px] font-mono text-neutral-500">2 Certificados</span>
                      </div>
                    </div>
                  </div>
                </div>
            </div>
          )}

          {/* 5. CULTURA, COMUNICACIÓN Y eNPS */}
          {activeTab === 'cultura' && (
            <div className="space-y-6 animate-in fade-in duration-300">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 
                 {/* eNPS & Sentiment Analysis */}
                 <div className="space-y-6">
                    <div className="border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 bg-white dark:bg-black text-center relative overflow-hidden">
                     <div className="absolute top-4 right-4"><ShieldCheck className="h-5 w-5 text-emerald-500" aria-label="Respuestas Anonimizadas" /></div>
                     <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Employee Net Promoter Score</p>
                     <div className="text-6xl font-black text-neutral-900 dark:text-white my-4">+24</div>
                     <p className="text-[10px] text-neutral-400 font-mono font-bold mb-4">Fórmula: $eNPS = \%Promotores - \%Detractores$</p>
                     
                     <div className="flex w-full h-3 rounded-full overflow-hidden mb-2">
                       <div className="bg-rose-500 w-[20%]" title="Detractores (20%)"></div>
                       <div className="bg-amber-500 w-[36%]" title="Pasivos (36%)"></div>
                       <div className="bg-emerald-500 w-[44%]" title="Promotores (44%)"></div>
                     </div>
                     <div className="flex justify-between text-[10px] font-bold text-neutral-500">
                       <span>20% Detractores</span>
                       <span>44% Promotores</span>
                     </div>
                   </div>

                   <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800/30 p-5 rounded-2xl flex items-start gap-4">
                     <BrainCircuit className="h-6 w-6 text-rose-500 mt-1" />
                     <div>
                       <h4 className="font-black text-rose-900 dark:text-rose-100 text-sm">Alerta de NLP (Análisis de Sentimiento)</h4>
                       <p className="text-xs text-rose-700 dark:text-rose-400 mt-1 leading-relaxed">
                         El motor de IA detectó un incremento de palabras clave como <span className="font-mono bg-rose-200 dark:bg-rose-800 px-1 rounded">"burocracia"</span> y <span className="font-mono bg-rose-200 dark:bg-rose-800 px-1 rounded">"lento"</span> en los comentarios anónimos del departamento de Ventas. Sugerencia: Revisar workflows de aprobación.
                       </p>
                     </div>
                   </div>
                 </div>

                 {/* Muro de Reconocimientos (Kudos) */}
                 <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 bg-neutral-50 dark:bg-neutral-900/50">
                   <h4 className="font-black text-neutral-900 dark:text-white mb-4 flex items-center gap-2"><Star className="h-5 w-5 text-amber-500" /> Muro de Reconocimientos (Kudos)</h4>
                   <div className="space-y-4">
                     <div className="bg-white dark:bg-black p-4 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-800">
                       <p className="text-sm text-neutral-700 dark:text-neutral-300">"Quiero dar un Kudo enorme a <strong className="text-violet-600 dark:text-violet-400">Desarrollo IT</strong> por desplegar el nuevo módulo de Gastos XML sin caída del sistema. ¡Excelente trabajo en equipo!"</p>
                       <p className="text-[10px] text-neutral-400 mt-3 font-bold">— Dirección Financiera</p>
                     </div>
                     <div className="bg-white dark:bg-black p-4 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-800">
                       <p className="text-sm text-neutral-700 dark:text-neutral-300">"Gracias al equipo de <strong className="text-violet-600 dark:text-violet-400">Legal</strong> por apoyarnos a cerrar el NDA del cliente Nuevo a tiempo récord ayer en la tarde."</p>
                       <p className="text-[10px] text-neutral-400 mt-3 font-bold">— Operaciones SCM</p>
                     </div>
                     <button className="w-full bg-violet-100 hover:bg-violet-200 dark:bg-violet-900/30 dark:hover:bg-violet-900/50 text-violet-700 dark:text-violet-300 font-bold py-2 rounded-xl text-xs transition-colors">Dar Reconocimiento Público</button>
                   </div>
                 </div>

               </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}