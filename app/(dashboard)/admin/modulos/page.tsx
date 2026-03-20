'use client';

import { useState } from 'react';
import { 
  Blocks, ToggleRight, TextCursorInput, FileText, 
  Webhook, Palette, Plus, Settings, CheckCircle2, 
  LayoutTemplate, Database, Key, Globe
} from 'lucide-react';

export default function ModulesAppPage() {
  const [activeTab, setActiveTab] = useState<'modulos' | 'campos' | 'plantillas' | 'integraciones' | 'apariencia'>('modulos');

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-neutral-100 dark:bg-black p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800">
              <Blocks className="h-8 w-8 text-neutral-900 dark:text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">Módulos y App</h1>
              <p className="text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-widest mt-1">
                Personalización del Workspace
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-neutral-950 dark:bg-white text-white dark:text-black font-black rounded-xl hover:scale-[1.02] transition-all text-sm">
              Guardar Configuración
            </button>
          </div>
        </header>

        {/* CONTENEDOR PRINCIPAL CON MENÚ LATERAL */}
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Menú de Pestañas */}
          <aside className="lg:w-64 flex-shrink-0 space-y-2">
            {[
              { id: 'modulos', label: 'Gestión de Módulos', icon: ToggleRight },
              { id: 'campos', label: 'Campos Personalizados', icon: TextCursorInput },
              { id: 'plantillas', label: 'Plantillas de Docs', icon: FileText },
              { id: 'integraciones', label: 'API & Webhooks', icon: Webhook },
              { id: 'apariencia', label: 'Marca Blanca', icon: Palette },
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
          </aside>

          {/* ÁREA DE CONTENIDO */}
          <main className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm min-h-[600px]">
            
            {/* 1. GESTIÓN DE MÓDULOS */}
            {activeTab === 'modulos' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white">Módulos del Sistema</h2>
                  <p className="text-sm text-neutral-500">Activa o desactiva funcionalidades completas según el plan del cliente.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: 'CRM & Ventas', desc: 'Gestión de leads, embudos de conversión y presupuestos.', active: true },
                    { name: 'Inventarios y SCM', desc: 'Control de almacenes, traspasos y órdenes de compra.', active: true },
                    { name: 'Nómina (RRHH)', desc: 'Cálculo de sueldos, timbrado de recibos y control de asistencia.', active: false },
                    { name: 'Producción (MRP)', desc: 'Listas de materiales (BOM) y órdenes de fabricación.', active: false },
                    { name: 'Gestión de Proyectos', desc: 'Diagramas de Gantt, hitos y rentabilidad por proyecto.', active: true },
                    { name: 'Soporte y Tickets', desc: 'Mesa de ayuda para clientes y acuerdos de nivel de servicio (SLA).', active: false },
                  ].map((mod, idx) => (
                    <div key={idx} className="p-5 border border-neutral-200 dark:border-neutral-800 rounded-2xl flex items-start justify-between bg-neutral-50 dark:bg-black">
                      <div className="pr-4">
                        <h3 className="font-bold text-neutral-900 dark:text-white mb-1">{mod.name}</h3>
                        <p className="text-xs text-neutral-500 leading-relaxed">{mod.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-1">
                        <input type="checkbox" className="sr-only peer" defaultChecked={mod.active} />
                        <div className="w-11 h-6 bg-neutral-200 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. CAMPOS PERSONALIZADOS */}
            {activeTab === 'campos' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-black text-neutral-900 dark:text-white">Campos Personalizados</h2>
                    <p className="text-sm text-neutral-500">Expande la base de datos sin necesidad de código.</p>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-neutral-950 dark:bg-white text-white dark:text-black font-bold rounded-xl text-sm">
                    <Plus className="h-4 w-4" /> Nuevo Campo
                  </button>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <span className="text-sm font-bold text-neutral-500">Entidad a modificar:</span>
                  <select className="p-2 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-xl font-bold text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none">
                    <option>Clientes (CRM)</option>
                    <option>Productos (Inventario)</option>
                    <option>Empleados (RRHH)</option>
                  </select>
                </div>

                <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-neutral-50 dark:bg-black/50 text-xs uppercase text-neutral-500">
                      <tr>
                        <th className="p-4 font-bold">Nombre del Campo</th>
                        <th className="p-4 font-bold">Tipo de Dato</th>
                        <th className="p-4 font-bold">ID Técnico</th>
                        <th className="p-4 font-bold">Obligatorio</th>
                        <th className="p-4 font-bold text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-sm">
                      <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                        <td className="p-4 font-bold dark:text-white">Nivel de Riesgo PLD</td>
                        <td className="p-4 text-neutral-500">Lista Desplegable</td>
                        <td className="p-4 font-mono text-xs text-neutral-400">custom_pld_risk</td>
                        <td className="p-4 text-emerald-500 font-bold">Sí</td>
                        <td className="p-4 text-right text-emerald-500 font-bold cursor-pointer hover:underline">Editar</td>
                      </tr>
                      <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                        <td className="p-4 font-bold dark:text-white">Fecha de Aniversario</td>
                        <td className="p-4 text-neutral-500">Fecha (Date)</td>
                        <td className="p-4 font-mono text-xs text-neutral-400">custom_anniversary</td>
                        <td className="p-4 text-neutral-400 font-bold">No</td>
                        <td className="p-4 text-right text-emerald-500 font-bold cursor-pointer hover:underline">Editar</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. PLANTILLAS DE DOCUMENTOS */}
            {activeTab === 'plantillas' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-black text-neutral-900 dark:text-white">Motor de Plantillas</h2>
                    <p className="text-sm text-neutral-500">Diseño visual para la generación de PDFs comerciales y fiscales.</p>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-neutral-950 dark:bg-white text-white dark:text-black font-bold rounded-xl text-sm">
                    <Plus className="h-4 w-4" /> Nueva Plantilla
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { title: 'Factura CFDI 4.0', type: 'Fiscal', status: 'Activa' },
                    { title: 'Cotización Comercial', type: 'Ventas', status: 'Activa' },
                    { title: 'Recibo de Nómina', type: 'RRHH', status: 'Borrador' },
                  ].map((tpl, i) => (
                    <div key={i} className="border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden group">
                      <div className="h-32 bg-neutral-100 dark:bg-black flex items-center justify-center border-b border-neutral-200 dark:border-neutral-800 relative">
                        <LayoutTemplate className="h-10 w-10 text-neutral-300 dark:text-neutral-800 group-hover:scale-110 transition-transform" />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="bg-white text-black font-bold px-4 py-2 rounded-lg text-sm">Editar Diseño</button>
                        </div>
                      </div>
                      <div className="p-4 bg-white dark:bg-neutral-900">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-bold text-neutral-900 dark:text-white">{tpl.title}</h3>
                        </div>
                        <div className="flex justify-between items-center mt-3">
                          <span className="text-xs font-bold text-neutral-500 uppercase">{tpl.type}</span>
                          <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${tpl.status === 'Activa' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'}`}>
                            {tpl.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. API & WEBHOOKS */}
            {activeTab === 'integraciones' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white">API REST & Webhooks</h2>
                  <p className="text-sm text-neutral-500">Conecta tu ERP con otras plataformas y automatiza flujos.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* API Keys */}
                  <div className="p-6 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50 dark:bg-black">
                    <div className="flex items-center gap-3 mb-4">
                      <Key className="h-5 w-5 text-neutral-400" />
                      <h3 className="font-bold text-neutral-900 dark:text-white">Claves de API</h3>
                    </div>
                    <p className="text-sm text-neutral-500 mb-4">Tokens de acceso para desarrolladores externos.</p>
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl mb-3">
                      <div>
                        <p className="text-xs font-bold text-neutral-900 dark:text-white">Producción (Live)</p>
                        <p className="text-xs font-mono text-neutral-400">sk_live_51Nx...8Yqw</p>
                      </div>
                      <button className="text-xs font-bold text-emerald-500">Revocar</button>
                    </div>
                    <button className="w-full py-2 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl text-sm font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
                      + Generar Token
                    </button>
                  </div>

                  {/* Webhooks */}
                  <div className="p-6 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50 dark:bg-black">
                    <div className="flex items-center gap-3 mb-4">
                      <Webhook className="h-5 w-5 text-neutral-400" />
                      <h3 className="font-bold text-neutral-900 dark:text-white">Endpoints (Webhooks)</h3>
                    </div>
                    <p className="text-sm text-neutral-500 mb-4">Recibe notificaciones en tiempo real cuando ocurran eventos.</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono bg-neutral-200 dark:bg-neutral-800 px-2 py-1 rounded text-neutral-600 dark:text-neutral-300">invoice.created</span>
                        <span className="text-xs text-emerald-500 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Activo</span>
                      </div>
                      <p className="text-xs text-neutral-400 font-mono truncate border-b border-neutral-200 dark:border-neutral-800 pb-3 mb-3">
                        https://zapier.com/hooks/catch/12345/
                      </p>
                    </div>
                    <button className="w-full py-2 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl text-sm font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white mt-2">
                      + Añadir Webhook
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 5. MARCA BLANCA (WHITE-LABEL) */}
            {activeTab === 'apariencia' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white">Marca Blanca (White-label)</h2>
                  <p className="text-sm text-neutral-500">Personaliza la apariencia del sistema para que parezca desarrollo propio.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Colores */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-neutral-900 dark:text-white">Tema Visual</h3>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Color Principal (Acentos)</label>
                      <div className="flex items-center gap-3">
                        <input type="color" defaultValue="#10b981" className="h-10 w-10 rounded-lg cursor-pointer border-0 bg-transparent" />
                        <input type="text" defaultValue="#10B981" className="flex-1 p-2 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-xl font-mono text-neutral-900 dark:text-white outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Favicon</label>
                      <input type="file" className="text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
                    </div>
                  </div>

                  {/* Dominio Personalizado */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-neutral-900 dark:text-white flex items-center gap-2">
                      <Globe className="h-4 w-4 text-emerald-500" /> Dominio Personalizado
                    </h3>
                    <p className="text-xs text-neutral-500 leading-relaxed">Configura un subdominio para que tus empleados o clientes accedan desde tu propia URL en lugar de switch-saas.com.</p>
                    
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Dominio Asignado</label>
                      <div className="flex gap-2">
                        <input type="text" placeholder="erp.miempresa.com" className="flex-1 p-3 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-xl font-mono text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" />
                        <button className="px-4 bg-neutral-900 dark:bg-white text-white dark:text-black font-bold rounded-xl text-sm">Validar</button>
                      </div>
                      <p className="text-xs text-neutral-400 mt-2">Requiere configurar un registro CNAME apuntando a <code className="text-emerald-500">cname.switch-saas.com</code></p>
                    </div>
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