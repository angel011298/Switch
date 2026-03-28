'use client';

import { useState } from 'react';
import { 
  Building2, MapPin, Network, Globe, ShieldCheck, 
  Upload, FileKey, Copy, PowerOff, Plus, Landmark, 
  Download, UploadCloud, AlertCircle, CheckCircle2, Lock
} from 'lucide-react';

export default function OrganizationPage() {
  const [activeTab, setActiveTab] = useState<'perfil' | 'sucursales' | 'entidades' | 'organigrama' | 'regional'>('perfil');

  // Datos simulados (En producción vienen de Supabase)
  const [orgData] = useState({
    name: 'CIFRA Demo',
    rfc: 'AAS260312XYZ',
    regimen: '601 - General de Ley Personas Morales',
    status: 'active'
  });

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-neutral-100 dark:bg-black p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800">
              <Building2 className="h-8 w-8 text-neutral-900 dark:text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">Estructura Organizacional</h1>
              <p className="text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-widest mt-1">
                Gestión Multi-Empresa • Sede Central
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all text-sm">
              <Download className="h-4 w-4" /> Exportar Estructura
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-neutral-950 dark:bg-white text-white dark:text-black font-black rounded-xl hover:scale-[1.02] transition-all text-sm">
              Guardar Cambios
            </button>
          </div>
        </header>

        {/* CONTENEDOR PRINCIPAL CON MENÚ LATERAL INTERNO */}
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Menú de Pestañas (Vertical en Desktop) */}
          <aside className="lg:w-64 flex-shrink-0 space-y-2">
            {[
              { id: 'perfil', label: 'Perfil Matriz', icon: Building2 },
              { id: 'entidades', label: 'Entidades Legales', icon: Landmark },
              { id: 'sucursales', label: 'Sucursales y Sedes', icon: MapPin },
              { id: 'organigrama', label: 'Organigrama y Deptos', icon: Network },
              { id: 'regional', label: 'Ajustes Regionales', icon: Globe },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                  activeTab === tab.id 
                    ? 'bg-white dark:bg-neutral-900 text-emerald-600 dark:text-emerald-400 shadow-sm border border-neutral-200 dark:border-neutral-800' 
                    : 'text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-900 border border-transparent'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </button>
            ))}

            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl">
              <div className="flex items-start gap-2 text-blue-600 dark:text-blue-400">
                <ShieldCheck className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-1">Cumplimiento Legal</p>
                  <p className="text-[11px] font-medium leading-relaxed">
                    Las entidades con histórico contable no pueden ser eliminadas. Usa la función "Desactivar" para mantener la integridad en auditorías.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* ÁREA DE CONTENIDO DINÁMICO */}
          <main className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm min-h-[600px]">
            
            {/* 1. PERFIL MATRIZ */}
            {activeTab === 'perfil' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div>
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white">Identidad Corporativa</h2>
                  <p className="text-sm text-neutral-500">Información legal y visual de la empresa principal.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="col-span-2 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Razón Social</label>
                        <input type="text" defaultValue={orgData.name} className="w-full p-3 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-xl font-bold text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">RFC / Tax ID</label>
                        <input type="text" defaultValue={orgData.rfc} className="w-full p-3 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-xl font-mono text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none uppercase" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Régimen Fiscal Principal</label>
                      <select className="w-full p-3 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-xl font-bold text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none">
                        <option>{orgData.regimen}</option>
                        <option>626 - Régimen Simplificado de Confianza (RESICO)</option>
                      </select>
                    </div>
                  </div>

                  {/* Uploader de Logos */}
                  <div className="space-y-4">
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Logotipo Oficial</label>
                    <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer group">
                      <div className="bg-neutral-100 dark:bg-black p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
                        <UploadCloud className="h-6 w-6 text-neutral-500" />
                      </div>
                      <p className="text-sm font-bold text-neutral-900 dark:text-white">Arrastra tu logo aquí</p>
                      <p className="text-xs text-neutral-500 mt-1">PNG transparente, max 2MB.</p>
                    </div>
                  </div>
                </div>

                <hr className="border-neutral-200 dark:border-neutral-800" />

                {/* Sellos Digitales */}
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-neutral-900 dark:text-white mb-4">Sellos Digitales (CSD)</h3>
                  <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className="bg-emerald-100 dark:bg-emerald-500/20 p-2 rounded-lg">
                        <FileKey className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-bold text-emerald-900 dark:text-emerald-100 text-sm">Certificado Activo</p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">Vence: 12/Oct/2028 • CSD_AAS_001.cer</p>
                      </div>
                    </div>
                    <button className="text-xs font-bold bg-white dark:bg-black text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-xl shadow-sm hover:scale-105 transition-all">
                      Actualizar CSD
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. ENTIDADES LEGALES (MULTI-EMPRESA) */}
            {activeTab === 'entidades' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-black text-neutral-900 dark:text-white">Entidades Legales</h2>
                    <p className="text-sm text-neutral-500">Razones sociales que operan bajo este grupo corporativo.</p>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-neutral-950 dark:bg-white text-white dark:text-black font-bold rounded-xl text-sm">
                    <Plus className="h-4 w-4" /> Nueva Entidad
                  </button>
                </div>

                <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-neutral-50 dark:bg-black/50 text-xs uppercase text-neutral-500">
                      <tr>
                        <th className="p-4 font-bold">Razón Social</th>
                        <th className="p-4 font-bold">RFC</th>
                        <th className="p-4 font-bold">Cuentas Bancarias</th>
                        <th className="p-4 font-bold">Consolidación</th>
                        <th className="p-4 font-bold text-right">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-sm">
                      <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                        <td className="p-4 font-bold text-neutral-900 dark:text-white">CIFRA Demo S.A.P.I. de C.V.</td>
                        <td className="p-4 font-mono text-neutral-500">AAS260312XYZ</td>
                        <td className="p-4"><span className="bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded text-xs font-bold">2 Activas</span></td>
                        <td className="p-4">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-9 h-5 bg-neutral-200 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                          </label>
                        </td>
                        <td className="p-4 text-right">
                          <span className="inline-flex items-center gap-1 text-emerald-500 font-bold text-xs bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg">
                            <CheckCircle2 className="h-3 w-3" /> Operativa
                          </span>
                        </td>
                      </tr>
                      {/* Entidad Archivada (Soft Delete Example) */}
                      <tr className="bg-neutral-50/50 dark:bg-neutral-900/50 opacity-75">
                        <td className="p-4 font-bold text-neutral-500 line-through decoration-neutral-300">CIFRA Operadora S.A.</td>
                        <td className="p-4 font-mono text-neutral-400">SWO210101ABC</td>
                        <td className="p-4 text-neutral-400">0 Activas</td>
                        <td className="p-4">--</td>
                        <td className="p-4 text-right">
                          <span className="inline-flex items-center gap-1 text-neutral-500 font-bold text-xs bg-neutral-200 dark:bg-neutral-800 px-2 py-1 rounded-lg">
                            <Lock className="h-3 w-3" /> Archivada
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. SUCURSALES */}
            {activeTab === 'sucursales' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-black text-neutral-900 dark:text-white">Sucursales y Almacenes</h2>
                    <p className="text-sm text-neutral-500">Gestión de puntos físicos y horarios operativos.</p>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-neutral-950 dark:bg-white text-white dark:text-black font-bold rounded-xl text-sm">
                    <Plus className="h-4 w-4" /> Nueva Sucursal
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-black group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-emerald-100 dark:bg-emerald-500/20 p-2 rounded-lg">
                          <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="font-bold text-neutral-900 dark:text-white">Sede Principal (HQ)</h3>
                          <p className="text-xs text-neutral-500 font-mono">ID: SUC-001</p>
                        </div>
                      </div>
                      <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase px-2 py-1 rounded">Matriz</span>
                    </div>
                    <div className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400 mb-6">
                      <p>📍 Av. Paseo de la Reforma 222, CDMX</p>
                      <p>⏰ Lunes a Viernes: 09:00 - 18:00</p>
                      <p>📦 Almacén Central Vinculado</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-bold rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center justify-center gap-2">
                        <Copy className="h-3 w-3" /> Clonar Config.
                      </button>
                      <button className="py-2 px-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors" title="Desactivar (Soft Delete)">
                        <PowerOff className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. ORGANIGRAMA Y DEPARTAMENTOS */}
            {activeTab === 'organigrama' && (
              <div className="space-y-6 animate-in fade-in duration-300 flex flex-col items-center justify-center min-h-[500px] text-center">
                <div className="bg-neutral-100 dark:bg-neutral-800 p-6 rounded-full mb-4">
                  <Network className="h-12 w-12 text-neutral-400" />
                </div>
                <h2 className="text-2xl font-black text-neutral-900 dark:text-white">Visualizador de Jerarquía</h2>
                <p className="text-neutral-500 max-w-md">
                  El lienzo interactivo para gestionar departamentos, centros de costos y reasignar personal está en construcción. Requerirá la librería <code>react-flow</code> para el drag & drop.
                </p>
                <button className="mt-4 px-6 py-3 bg-neutral-950 dark:bg-white text-white dark:text-black font-bold rounded-xl shadow-lg">
                  + Añadir Departamento Raíz
                </button>
              </div>
            )}

            {/* 5. AJUSTES REGIONALES */}
            {activeTab === 'regional' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div>
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white">Ajustes Regionales</h2>
                  <p className="text-sm text-neutral-500">Formatos base para cálculos financieros y comunicación.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Moneda Base Contable</label>
                    <select className="w-full p-3 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-xl font-bold text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none">
                      <option>MXN - Peso Mexicano</option>
                      <option>USD - Dólar Estadounidense</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Zona Horaria del Servidor</label>
                    <select className="w-full p-3 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-xl font-bold text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none">
                      <option>America/Mexico_City (GMT-6)</option>
                      <option>America/Tijuana (GMT-8)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Formato de Fecha</label>
                    <select className="w-full p-3 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-xl font-bold text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none">
                      <option>DD/MM/AAAA (Ej. 28/02/2026)</option>
                      <option>MM/DD/AAAA (Ej. 02/28/2026)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Separador Decimal</label>
                    <select className="w-full p-3 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-xl font-bold text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none">
                      <option>1,234.56 (Coma miles, Punto decimal)</option>
                      <option>1.234,56 (Punto miles, Coma decimal)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}