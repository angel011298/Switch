'use client';

import { useState } from 'react';
import { 
  ShieldCheck, Users, Key, Network, Lock, Fingerprint, 
  MonitorSmartphone, PowerOff, Plus, AlertTriangle, 
  RefreshCcw, ShieldAlert, CheckCircle2
} from 'lucide-react';

export default function SecurityAccessPage() {
  const [activeTab, setActiveTab] = useState<'usuarios' | 'roles' | 'politicas' | 'red'>('usuarios');

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-neutral-100 dark:bg-black p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800">
              <ShieldCheck className="h-8 w-8 text-neutral-900 dark:text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">Seguridad y Accesos</h1>
              <p className="text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-widest mt-1">
                Control de Identidad y Perímetros (Zero Trust)
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-bold rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-all text-sm border border-red-200 dark:border-red-500/20">
              <PowerOff className="h-4 w-4" /> Revocar Todas las Sesiones
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-neutral-950 dark:bg-white text-white dark:text-black font-black rounded-xl hover:scale-[1.02] transition-all text-sm">
              Guardar Políticas
            </button>
          </div>
        </header>

        {/* CONTENEDOR PRINCIPAL CON MENÚ LATERAL */}
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Menú de Pestañas */}
          <aside className="lg:w-64 flex-shrink-0 space-y-2">
            {[
              { id: 'usuarios', label: 'Usuarios y Sesiones', icon: Users },
              { id: 'roles', label: 'Matriz de Roles (RBAC)', icon: Key },
              { id: 'politicas', label: 'Políticas de Contraseñas', icon: Lock },
              { id: 'red', label: 'Perímetro de Red (IPs)', icon: Network },
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

            <div className="mt-8 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl">
              <div className="flex items-start gap-2 text-emerald-700 dark:text-emerald-500">
                <ShieldAlert className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-1">Nivel Dios Activo</p>
                  <p className="text-[11px] font-medium leading-relaxed">
                    Como Super Admin, tus acciones anulan cualquier restricción de IP o política de expiración.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* ÁREA DE CONTENIDO */}
          <main className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm min-h-[600px]">
            
            {/* 1. USUARIOS Y SESIONES */}
            {activeTab === 'usuarios' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-black text-neutral-900 dark:text-white">Directorio Global de Usuarios</h2>
                    <p className="text-sm text-neutral-500">Gestión de accesos, reseteo de credenciales y auditoría de sesiones activas.</p>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-neutral-950 dark:bg-white text-white dark:text-black font-bold rounded-xl text-sm">
                    <Plus className="h-4 w-4" /> Invitar Usuario
                  </button>
                </div>

                <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-neutral-50 dark:bg-black/50 text-xs uppercase text-neutral-500">
                      <tr>
                        <th className="p-4 font-bold">Usuario</th>
                        <th className="p-4 font-bold">Rol Asignado</th>
                        <th className="p-4 font-bold">Seguridad</th>
                        <th className="p-4 font-bold">Sesión Activa</th>
                        <th className="p-4 font-bold text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-sm">
                      <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 group">
                        <td className="p-4">
                          <p className="font-bold text-neutral-900 dark:text-white">Alicia S.</p>
                          <p className="text-xs text-neutral-500 font-mono">alicia@empresa.com</p>
                        </td>
                        <td className="p-4">
                          <span className="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 px-2 py-1 rounded text-xs font-bold">Auditor Financiero</span>
                        </td>
                        <td className="p-4">
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                            <Fingerprint className="h-3 w-3" /> 2FA Activo
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-xs text-neutral-500">
                            <MonitorSmartphone className="h-4 w-4" />
                            <span>MacBook Pro • CDMX<br/><span className="text-[10px] font-mono">Hace 2 min</span></span>
                          </div>
                        </td>
                        <td className="p-4 text-right space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-lg hover:text-emerald-500" title="Resetear Contraseña">
                            <RefreshCcw className="h-4 w-4" />
                          </button>
                          <button className="p-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20" title="Cerrar su Sesión">
                            <PowerOff className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 2. MATRIZ DE ROLES (RBAC) */}
            {activeTab === 'roles' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-black text-neutral-900 dark:text-white">Matriz de Permisos (RBAC)</h2>
                    <p className="text-sm text-neutral-500">Control granular de acceso a nivel módulo y operación.</p>
                  </div>
                  <select className="p-2 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-xl font-bold text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none">
                    <option>Rol: Contador (Editando)</option>
                    <option>Rol: Ventas Básico</option>
                    <option>Rol: Auditor de Sólo Lectura</option>
                  </select>
                </div>

                <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-neutral-50 dark:bg-black/50 text-xs uppercase text-neutral-500">
                      <tr>
                        <th className="p-4 font-bold">Módulo</th>
                        <th className="p-4 font-bold text-center">Ver (Read)</th>
                        <th className="p-4 font-bold text-center">Crear (Create)</th>
                        <th className="p-4 font-bold text-center">Editar (Update)</th>
                        <th className="p-4 font-bold text-center text-red-500">Eliminar (Delete)</th>
                        <th className="p-4 font-bold text-center text-blue-500">Exportar (CSV/PDF)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-sm">
                      {['Finanzas (XML)', 'Impuestos', 'Caja Chica', 'RRHH (Nómina)'].map((mod, i) => (
                        <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                          <td className="p-4 font-bold text-neutral-900 dark:text-white">{mod}</td>
                          <td className="p-4 text-center"><input type="checkbox" defaultChecked className="accent-emerald-500 w-4 h-4 cursor-pointer" /></td>
                          <td className="p-4 text-center"><input type="checkbox" defaultChecked={i < 2} className="accent-emerald-500 w-4 h-4 cursor-pointer" /></td>
                          <td className="p-4 text-center"><input type="checkbox" defaultChecked={i === 0} className="accent-emerald-500 w-4 h-4 cursor-pointer" /></td>
                          <td className="p-4 text-center"><input type="checkbox" className="accent-red-500 w-4 h-4 cursor-pointer" /></td>
                          <td className="p-4 text-center"><input type="checkbox" defaultChecked={i !== 3} className="accent-blue-500 w-4 h-4 cursor-pointer" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. POLÍTICAS DE SEGURIDAD E IDENTIDAD */}
            {activeTab === 'politicas' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div>
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white">Políticas de Identidad</h2>
                  <p className="text-sm text-neutral-500">Reglas duras de cumplimiento y endurecimiento de contraseñas.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  {/* Autenticación */}
                  <div className="space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-neutral-900 dark:text-white border-b border-neutral-200 dark:border-neutral-800 pb-2">Autenticación Multifactor (MFA)</h3>
                    
                    <div className="flex items-start justify-between bg-neutral-50 dark:bg-black p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                      <div className="pr-4">
                        <p className="font-bold text-neutral-900 dark:text-white text-sm">Forzar 2FA Global</p>
                        <p className="text-xs text-neutral-500 mt-1">Exige a todos los usuarios configurar Google Authenticator o Authy en su próximo login.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer mt-1">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-neutral-200 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>

                    <div className="flex items-start justify-between bg-neutral-50 dark:bg-black p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                      <div className="pr-4">
                        <p className="font-bold text-neutral-900 dark:text-white text-sm">Bloqueo por Fuerza Bruta</p>
                        <p className="text-xs text-neutral-500 mt-1">Suspender cuenta tras X intentos fallidos.</p>
                      </div>
                      <select className="p-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-bold text-neutral-900 dark:text-white outline-none">
                        <option>3 intentos (Estricto)</option>
                        <option selected>5 intentos (Normal)</option>
                        <option>10 intentos</option>
                      </select>
                    </div>
                  </div>

                  {/* Contraseñas y Sesiones */}
                  <div className="space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-neutral-900 dark:text-white border-b border-neutral-200 dark:border-neutral-800 pb-2">Ciclo de Vida y Sesión</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Expiración de Contraseña</label>
                        <select className="w-full p-3 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-xl font-bold text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none">
                          <option>Nunca (No recomendado)</option>
                          <option>Cada 90 días (Estándar PCI)</option>
                          <option>Cada 30 días</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Tiempo de Inactividad (Timeout)</label>
                        <select className="w-full p-3 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-xl font-bold text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none">
                          <option>Cerrar sesión tras 15 min de inactividad</option>
                          <option>Cerrar sesión tras 1 hora</option>
                          <option>Mantener sesión 24 horas</option>
                        </select>
                      </div>
                      
                      <div className="pt-2">
                         <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 mb-2">
                           <Lock className="h-3 w-3" /> Requisitos de Complejidad
                         </div>
                         <div className="flex flex-wrap gap-2">
                            <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded text-[10px] font-black uppercase">Min 12 Caracteres</span>
                            <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded text-[10px] font-black uppercase">Alfanumérica</span>
                            <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded text-[10px] font-black uppercase">1 Símbolo</span>
                         </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* 4. PERÍMETRO DE RED (IP WHITELISTING) */}
            {activeTab === 'red' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-black text-neutral-900 dark:text-white">Lista Blanca de IPs (Whitelisting)</h2>
                    <p className="text-sm text-neutral-500">Bloquea el acceso al ERP si el usuario no está en la oficina o VPN autorizada.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-neutral-200 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-2xl p-4 flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-yellow-800 dark:text-yellow-400">Atención: Restricción Estricta</p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-500 mt-1">Si activas esto y tu IP dinámica cambia, todos los usuarios quedarán fuera del sistema. Asegúrate de tener IP estática contratada con tu ISP.</p>
                  </div>
                </div>

                <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-neutral-50 dark:bg-black/50 text-xs uppercase text-neutral-500">
                      <tr>
                        <th className="p-4 font-bold">Rango IP / CIDR</th>
                        <th className="p-4 font-bold">Descripción</th>
                        <th className="p-4 font-bold text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-sm">
                      <tr>
                        <td className="p-4 font-mono font-bold dark:text-white">189.215.45.12/32</td>
                        <td className="p-4 text-neutral-500">Oficina CDMX (Reforma)</td>
                        <td className="p-4 text-right text-red-500 font-bold cursor-pointer hover:underline">Eliminar</td>
                      </tr>
                      <tr>
                        <td className="p-4 font-mono font-bold dark:text-white">10.8.0.0/24</td>
                        <td className="p-4 text-neutral-500">VPN Corporativa (OpenVPN)</td>
                        <td className="p-4 text-right text-red-500 font-bold cursor-pointer hover:underline">Eliminar</td>
                      </tr>
                      <tr className="bg-neutral-50 dark:bg-black">
                        <td className="p-4"><input type="text" placeholder="Ej. 192.168.1.1" className="w-full bg-transparent outline-none font-mono text-neutral-900 dark:text-white placeholder-neutral-400" /></td>
                        <td className="p-4"><input type="text" placeholder="Nombre de la ubicación" className="w-full bg-transparent outline-none text-neutral-900 dark:text-white placeholder-neutral-400" /></td>
                        <td className="p-4 text-right">
                          <button className="text-emerald-500 font-bold hover:underline bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-lg">Añadir IP</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}