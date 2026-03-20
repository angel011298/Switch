'use client';

import { useState } from 'react';
import { 
  Network, Share2, ShieldAlert, Key, MessageSquare, 
  Users, Search, Download, Eye, Lock, CheckCircle2, 
  AlertTriangle, Play, GitBranch, ShieldCheck, Star, 
  Clock, Zap, LayoutTemplate, Activity, Fingerprint, UserPlus, ChevronRight
} from 'lucide-react';

export default function CulturaEstructuraPage() {
  const [activeTab, setActiveTab] = useState<'organigrama' | 'workflows' | 'portal' | 'denuncias' | 'rbac'>('organigrama');
  const [isSimulating, setIsSimulating] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* HEADER ERP */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-pink-500/10 p-3 rounded-2xl border border-pink-500/20">
              <Network className="h-8 w-8 text-pink-600 dark:text-pink-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">Cultura y Estructura</h1>
              <p className="text-neutral-500 font-medium text-sm mt-1">
                Organigrama, Workflows, Portal del Colaborador y Línea Ética.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all text-sm border border-neutral-200 dark:border-neutral-700">
              <Eye className="h-4 w-4" /> Ver como Usuario
            </button>
            <button className="flex items-center gap-2 px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white font-black rounded-xl transition-all shadow-lg shadow-pink-500/20 text-sm">
              <Download className="h-4 w-4" /> Exportar Directorio
            </button>
          </div>
        </header>

        {/* TOP METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Headcount Total</p>
              <p className="text-2xl font-black text-neutral-900 dark:text-white mt-1">142</p>
              <p className="text-[10px] text-neutral-400 mt-1">4 Vacantes Presupuestadas</p>
            </div>
            <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl"><Users className="h-6 w-6 text-neutral-500" /></div>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between border-l-4 border-l-emerald-500">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Engagement Level</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">88%</p>
              <p className="text-[10px] text-emerald-500 mt-1 font-bold">Uso alto del Portal y Kudos</p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl"><Activity className="h-6 w-6 text-emerald-500" /></div>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between border-l-4 border-l-amber-500">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Eficiencia SLA (Flujos)</p>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">4.2h</p>
              <p className="text-[10px] text-amber-500 mt-1 font-bold flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Cuello de botella en Finanzas</p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl"><Clock className="h-6 w-6 text-amber-500" /></div>
          </div>
          <div className="bg-gradient-to-br from-neutral-900 to-black dark:from-neutral-950 dark:to-black p-5 rounded-2xl border border-neutral-800 flex items-center justify-between text-white border-l-4 border-l-red-500">
            <div>
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Línea Ética Activa</p>
              <p className="text-2xl font-black text-white mt-1">1 <span className="text-sm font-medium text-neutral-500">Folio</span></p>
              <p className="text-[10px] text-red-400 mt-1 font-bold flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Encriptación Total</p>
            </div>
            <div className="p-3 bg-red-500/20 rounded-xl"><ShieldAlert className="h-6 w-6 text-red-400" /></div>
          </div>
        </div>

        {/* NAVEGACIÓN DE MÓDULOS */}
        <div className="flex overflow-x-auto border-b border-neutral-200 dark:border-neutral-800 pb-2 gap-2">
          {[
            { id: 'organigrama', label: 'Estructura y Organigrama', icon: Network },
            { id: 'workflows', label: 'Motor de Flujos (Workflows)', icon: GitBranch },
            { id: 'portal', label: 'Portal del Colaborador', icon: LayoutTemplate },
            { id: 'denuncias', label: 'Canal de Denuncias', icon: ShieldAlert },
            { id: 'rbac', label: 'Perfiles y Accesos (RBAC)', icon: Key },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-pink-600 text-white shadow-md shadow-pink-500/20' 
                  : 'bg-white dark:bg-neutral-900 text-neutral-500 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
              }`}
            >
              <tab.icon className="h-4 w-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* ÁREA DE CONTENIDO */}
        <main className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm min-h-[600px] p-6">
          
          {/* 1. ORGANIGRAMA Y ESTRUCTURA */}
          {activeTab === 'organigrama' && (
            <div className="space-y-6 animate-in fade-in duration-300 flex flex-col items-center">
              <div className="w-full flex justify-between items-center bg-pink-50 dark:bg-pink-900/10 border border-pink-200 dark:border-pink-800/30 p-4 rounded-2xl">
                <div>
                  <h3 className="font-bold text-pink-900 dark:text-pink-100 flex items-center gap-2"><Network className="h-5 w-5" /> Organigrama Dinámico</h3>
                  <p className="text-xs text-pink-700 dark:text-pink-400 mt-1">Mapeo de Matriz (Dotted Lines) y Posiciones vs. Personas.</p>
                </div>
                <button 
                  onClick={() => setIsSimulating(!isSimulating)}
                  className={`px-4 py-2 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm border ${
                    isSimulating 
                    ? 'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-400 animate-pulse' 
                    : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800'
                  }`}
                >
                  <Play className="h-4 w-4" /> {isSimulating ? 'Modo Sandbox Activo' : 'Simular Estructura'}
                </button>
              </div>

              {/* Visualización Simulada de SVG/Canvas del Organigrama */}
              <div className="w-full bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl min-h-[400px] p-8 flex flex-col items-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ec4899 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                
                {/* Directorio Root */}
                <div className="z-10 bg-white dark:bg-black border-2 border-pink-500 p-4 rounded-2xl shadow-lg w-64 text-center cursor-pointer hover:scale-105 transition-transform">
                  <div className="w-12 h-12 bg-pink-100 dark:bg-pink-500/20 rounded-full mx-auto flex items-center justify-center text-pink-600 font-black mb-2">AO</div>
                  <h4 className="font-black text-neutral-900 dark:text-white">Angel Ortiz</h4>
                  <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mt-1">CEO & Founder</p>
                </div>

                <div className="w-0.5 h-8 bg-neutral-300 dark:bg-neutral-700 z-10"></div>
                <div className="w-[600px] h-0.5 bg-neutral-300 dark:bg-neutral-700 z-10"></div>

                <div className="flex justify-between w-[640px] z-10">
                  <div className="w-0.5 h-8 bg-neutral-300 dark:bg-neutral-700"></div>
                  <div className="w-0.5 h-8 bg-neutral-300 dark:bg-neutral-700"></div>
                </div>

                <div className="flex justify-between w-[700px] z-10">
                  {/* Nodo Finanzas */}
                  <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-700 p-4 rounded-2xl shadow-md w-56 text-center">
                    <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 rounded-full mx-auto flex items-center justify-center text-neutral-600 dark:text-neutral-400 font-bold mb-2">CR</div>
                    <h4 className="font-bold text-neutral-900 dark:text-white text-sm">Carlos Ruiz</h4>
                    <p className="text-[10px] font-bold text-neutral-500 uppercase mt-1">Dir. Finanzas</p>
                  </div>

                  {/* Nodo Vacante (Posición) */}
                  <div className="bg-neutral-50 dark:bg-neutral-900 border-2 border-dashed border-pink-300 dark:border-pink-800 p-4 rounded-2xl w-56 text-center flex flex-col justify-center items-center">
                    <UserPlus className="h-8 w-8 text-pink-400 dark:text-pink-600 mb-2" />
                    <h4 className="font-bold text-neutral-900 dark:text-white text-sm">Vacante Presupuestada</h4>
                    <p className="text-[10px] font-bold text-pink-500 uppercase mt-1">CTO</p>
                    <p className="text-[9px] text-neutral-400 mt-2 font-mono">Req-001 • Aprobado</p>
                  </div>
                </div>

                {/* Línea Punteada (Matriz) */}
                <svg className="absolute w-full h-full pointer-events-none z-0" style={{ top: 0, left: 0 }}>
                  <path d="M 400 300 Q 500 250 650 300" fill="transparent" stroke="#ec4899" strokeWidth="2" strokeDasharray="5,5" />
                </svg>
              </div>
            </div>
          )}

          {/* 2. MOTOR DE FLUJOS (WORKFLOWS) */}
          {activeTab === 'workflows' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white">Constructor de Flujos (No-Code)</h2>
                  <p className="text-xs text-neutral-500 mt-1">Define nodos de aprobación y Triggers automáticos.</p>
                </div>
                <button className="bg-neutral-950 dark:bg-white text-white dark:text-black font-bold px-4 py-2 rounded-xl text-sm shadow-md transition-transform hover:scale-[1.02] flex items-center gap-2">
                  <GitBranch className="h-4 w-4" /> Nuevo Workflow
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 min-h-[400px] flex items-center justify-center relative">
                  
                  {/* Flujo Visual */}
                  <div className="flex items-center gap-2 overflow-x-auto w-full px-4">
                    <div className="bg-white dark:bg-neutral-900 border border-blue-200 dark:border-blue-800 shadow-sm p-4 rounded-xl min-w-[150px] shrink-0">
                      <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest mb-2"><Zap className="inline h-3 w-3" /> Trigger</p>
                      <p className="font-bold text-sm text-neutral-900 dark:text-white">Solicitud Vacaciones</p>
                    </div>
                    <div className="h-0.5 w-8 bg-neutral-300 dark:bg-neutral-700 shrink-0"></div>
                    
                    <div className="bg-white dark:bg-neutral-900 border border-amber-200 dark:border-amber-800 shadow-sm p-4 rounded-xl min-w-[150px] shrink-0">
                      <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest mb-2"><Clock className="inline h-3 w-3" /> SLA: 24h</p>
                      <p className="font-bold text-sm text-neutral-900 dark:text-white">Jefe Directo</p>
                    </div>
                    <div className="h-0.5 w-8 bg-neutral-300 dark:bg-neutral-700 shrink-0"></div>
                    
                    <div className="bg-white dark:bg-neutral-900 border border-emerald-200 dark:border-emerald-800 shadow-sm p-4 rounded-xl min-w-[150px] shrink-0 relative">
                      <div className="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-full p-1 shadow-md"><CheckCircle2 className="h-3 w-3" /></div>
                      <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest mb-2">Automático</p>
                      <p className="text-xs font-bold text-neutral-900 dark:text-white">Actualizar Portal y Nómina</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 bg-white dark:bg-black">
                    <h4 className="font-bold text-neutral-900 dark:text-white mb-4 text-sm flex items-center gap-2"><Activity className="h-4 w-4 text-neutral-500" /> Monitoreo de SLA</h4>
                    <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-100 dark:border-amber-800/30">
                      <p className="text-sm font-bold text-amber-800 dark:text-amber-400 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Finanzas: 3 Solicitudes atascadas</p>
                      <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-1">Tiempo promedio de respuesta: 48h (SLA es 24h).</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. PORTAL DEL COLABORADOR Y FEED */}
          {activeTab === 'portal' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Central de Trámites Rápidos */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl text-white shadow-lg">
                    <h3 className="font-black text-xl mb-1">¡Hola, Ana!</h3>
                    <p className="text-sm text-indigo-100 mb-6">¿Qué necesitas hacer hoy?</p>
                    <div className="space-y-2">
                      <button className="w-full bg-white/20 hover:bg-white/30 text-white font-bold py-2.5 rounded-xl text-sm transition-colors text-left px-4 flex justify-between items-center backdrop-blur-sm">
                        Pedir Vacaciones <ChevronRight className="h-4 w-4 opacity-50" />
                      </button>
                      <button className="w-full bg-white/20 hover:bg-white/30 text-white font-bold py-2.5 rounded-xl text-sm transition-colors text-left px-4 flex justify-between items-center backdrop-blur-sm">
                        Descargar Recibo Nómina <Download className="h-4 w-4 opacity-50" />
                      </button>
                    </div>
                  </div>

                  <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 bg-white dark:bg-black">
                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">Directorio Social</p>
                    <div className="flex items-center gap-3 bg-neutral-50 dark:bg-neutral-900 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800">
                      <div className="w-10 h-10 bg-amber-100 dark:bg-amber-500/20 rounded-full flex items-center justify-center text-amber-600 text-lg">🎉</div>
                      <div>
                        <p className="text-sm font-bold text-neutral-900 dark:text-white">Cumpleaños de Luis</p>
                        <p className="text-[10px] text-neutral-500">Hoy • Departamento de Ventas</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feed de Comunicación y Kudos */}
                <div className="lg:col-span-2 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black text-neutral-900 dark:text-white flex items-center gap-2"><MessageSquare className="h-5 w-5 text-pink-500" /> Muro Social</h3>
                    <button className="text-xs font-bold bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400 px-3 py-1.5 rounded-lg flex items-center gap-1">
                      <Star className="h-3 w-3" /> Dar Kudo
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-800">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">RH</div>
                          <div>
                            <p className="text-sm font-bold text-neutral-900 dark:text-white">Comunicado Oficial</p>
                            <p className="text-[10px] text-neutral-500">Hace 2 horas</p>
                          </div>
                        </div>
                        <span className="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 text-[9px] font-black uppercase px-2 py-1 rounded">Anuncio</span>
                      </div>
                      <p className="text-sm text-neutral-700 dark:text-neutral-300">A partir de mañana, la nueva política de Home Office híbrido entra en vigor. Revisen la intranet para los detalles. 🏠💻</p>
                    </div>

                    <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl shadow-sm border border-pink-100 dark:border-pink-900/30">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center font-bold text-emerald-600">AO</div>
                          <div>
                            <p className="text-sm font-bold text-neutral-900 dark:text-white">Angel Ortiz</p>
                            <p className="text-[10px] text-neutral-500 flex items-center gap-1"><Star className="h-3 w-3 text-amber-500 fill-amber-500" /> Kudo otorgado a <strong>Carlos Ruiz</strong></p>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-neutral-700 dark:text-neutral-300 italic">"Increíble trabajo cerrando la contabilidad mensual en tiempo récord. El valor de la Excelencia reflejado al 100%."</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* 4. CANAL DE DENUNCIAS (ETHICAL LINE) */}
          {activeTab === 'denuncias' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row justify-between items-center bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 p-5 rounded-2xl gap-4">
                <div className="flex items-start gap-4">
                  <Fingerprint className="h-8 w-8 text-red-500 mt-1" />
                  <div>
                    <h3 className="font-black text-red-900 dark:text-red-100 text-lg">Línea Ética y Canal de Denuncias</h3>
                    <p className="text-xs text-red-700 dark:text-red-400 mt-1 leading-relaxed max-w-2xl">
                      Capa de ofuscación activa. La IP de origen y los metadatos del navegador se eliminan antes de almacenar el reporte. Acceso restringido exclusivamente al Comité de Ética.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-red-100 dark:bg-red-900/40 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800">
                  <Lock className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <span className="text-xs font-bold text-red-800 dark:text-red-300">AES-256 E2E</span>
                </div>
              </div>

              <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-black">
                <table className="min-w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 text-[10px] uppercase text-neutral-500 tracking-widest font-black">
                    <tr>
                      <th className="p-4">Folio Seguro</th>
                      <th className="p-4">Categoría</th>
                      <th className="p-4 text-center">Estatus</th>
                      <th className="p-4 text-center">Identidad</th>
                      <th className="p-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                    <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="p-4">
                        <p className="font-mono font-bold text-neutral-900 dark:text-white">ETH-2026-X89A</p>
                        <p className="text-[10px] text-neutral-500 mt-0.5">Reportado hace 2 días</p>
                      </td>
                      <td className="p-4 font-bold text-neutral-700 dark:text-neutral-300">Conflicto de Interés</td>
                      <td className="p-4 text-center">
                        <span className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 px-2 py-1 rounded text-[10px] font-black uppercase">En Investigación</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-2 py-1 rounded text-[10px] font-black uppercase">
                          <Eye className="h-3 w-3" /> Anónimo
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button className="text-xs font-bold bg-neutral-950 dark:bg-white text-white dark:text-black px-3 py-1.5 rounded-lg shadow-sm">Abrir Bóveda</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. PERFILES Y ACCESOS (RBAC) */}
          {activeTab === 'rbac' && (
            <div className="space-y-6 animate-in fade-in duration-300">
               <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white">Role-Based Access Control (RBAC)</h2>
                  <p className="text-xs text-neutral-500 mt-1">Configuración granular y herencia de permisos jerárquicos.</p>
                </div>
              </div>

              <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 bg-white dark:bg-black">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Seleccionar Rol</label>
                    <select className="w-full p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl font-bold text-neutral-900 dark:text-white outline-none">
                      <option>Manager (Líder de Área)</option>
                      <option>Empleado Base</option>
                      <option>Analista Financiero</option>
                    </select>
                  </div>
                  <div className="pt-6">
                    <span className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      <ShieldCheck className="h-4 w-4" /> Herencia Activa
                    </span>
                  </div>
                </div>

                <table className="w-full text-left border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
                  <thead className="bg-neutral-50 dark:bg-neutral-900 text-xs uppercase text-neutral-500">
                    <tr>
                      <th className="p-3 font-bold">Módulo / Objeto</th>
                      <th className="p-3 font-bold text-center">Ver</th>
                      <th className="p-3 font-bold text-center">Crear</th>
                      <th className="p-3 font-bold text-center">Editar</th>
                      <th className="p-3 font-bold text-center">Eliminar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-sm">
                    {['Salarios Equipo Directo', 'Salarios Pares', 'Aprobar Vacaciones', 'Canal de Denuncias'].map((permiso, i) => (
                      <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                        <td className="p-3 font-bold text-neutral-900 dark:text-white">{permiso}</td>
                        <td className="p-3 text-center"><input type="checkbox" defaultChecked={i !== 1 && i !== 3} disabled={i === 1 || i === 3} className="accent-pink-500 w-4 h-4" /></td>
                        <td className="p-3 text-center"><input type="checkbox" defaultChecked={i === 2} disabled={i !== 2} className="accent-pink-500 w-4 h-4" /></td>
                        <td className="p-3 text-center"><input type="checkbox" defaultChecked={false} disabled className="accent-pink-500 w-4 h-4" /></td>
                        <td className="p-3 text-center"><input type="checkbox" defaultChecked={false} disabled className="accent-pink-500 w-4 h-4" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-[10px] text-neutral-500 mt-4 font-mono">* Los permisos bloqueados están restringidos por la política maestra del Super Admin.</p>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}