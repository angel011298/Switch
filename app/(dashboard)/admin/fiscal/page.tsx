'use client';

import { useState } from 'react';
import { 
  Landmark, FileKey, Receipt, Percent, Calculator, 
  UploadCloud, Plus, Key, Lock, CheckCircle2, AlertTriangle, 
  Download, FileDigit, CalendarCheck, Settings2
} from 'lucide-react';

export default function FiscalConfigPage() {
  const [activeTab, setActiveTab] = useState<'facturacion' | 'catalogo' | 'impuestos' | 'periodos'>('facturacion');

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-neutral-100 dark:bg-black p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800">
              <Landmark className="h-8 w-8 text-neutral-900 dark:text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">Configuración Fiscal</h1>
              <p className="text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-widest mt-1">
                Motor Contable y CFDI 4.0
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all text-sm">
              <Settings2 className="h-4 w-4" /> Validar Conexión PAC
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-neutral-950 dark:bg-white text-white dark:text-black font-black rounded-xl hover:scale-[1.02] transition-all text-sm">
              Guardar Cambios
            </button>
          </div>
        </header>

        {/* CONTENEDOR PRINCIPAL CON MENÚ LATERAL */}
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Menú de Pestañas */}
          <aside className="lg:w-64 flex-shrink-0 space-y-2">
            {[
              { id: 'facturacion', label: 'Facturación (CSD)', icon: FileKey },
              { id: 'catalogo', label: 'Catálogo de Cuentas', icon: Receipt },
              { id: 'impuestos', label: 'Impuestos y Tasas', icon: Percent },
              { id: 'periodos', label: 'Periodos Contables', icon: Calculator },
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

            {/* Warning Box */}
            <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-2xl">
              <div className="flex items-start gap-2 text-yellow-700 dark:text-yellow-500">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-1">Zona Crítica</p>
                  <p className="text-[11px] font-medium leading-relaxed">
                    Las modificaciones en impuestos y cuentas afectarán las pólizas futuras. No aplican de forma retroactiva a periodos cerrados.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* ÁREA DE CONTENIDO */}
          <main className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm min-h-[600px]">
            
            {/* 1. FACTURACIÓN ELECTRÓNICA (CSD Y FOLIOS) */}
            {activeTab === 'facturacion' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div>
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white">Facturación Electrónica (CFDI 4.0)</h2>
                  <p className="text-sm text-neutral-500">Carga de Certificados de Sello Digital y gestión de series.</p>
                </div>

                {/* Bóveda CSD */}
                <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 bg-neutral-50 dark:bg-black">
                  <h3 className="text-sm font-black uppercase tracking-widest text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                    <Key className="h-4 w-4 text-emerald-500" /> Bóveda de Sellos Digitales (CSD)
                  </h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Archivo .CER */}
                    <div className="border border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl p-4 text-center hover:bg-white dark:hover:bg-neutral-900 transition-colors cursor-pointer">
                      <UploadCloud className="h-6 w-6 text-neutral-400 mx-auto mb-2" />
                      <p className="text-sm font-bold text-neutral-900 dark:text-white">Certificado (.cer)</p>
                      <p className="text-xs text-neutral-500">Archivo público</p>
                    </div>
                    {/* Archivo .KEY */}
                    <div className="border border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl p-4 text-center hover:bg-white dark:hover:bg-neutral-900 transition-colors cursor-pointer">
                      <UploadCloud className="h-6 w-6 text-neutral-400 mx-auto mb-2" />
                      <p className="text-sm font-bold text-neutral-900 dark:text-white">Llave Privada (.key)</p>
                      <p className="text-xs text-neutral-500">Archivo encriptado</p>
                    </div>
                    {/* Contraseña */}
                    <div className="flex flex-col justify-center">
                      <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Contraseña del SAT</label>
                      <input type="password" placeholder="••••••••" className="w-full p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl font-mono text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>
                  </div>

                  {/* Estado actual */}
                  <div className="mt-6 flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      <div>
                        <p className="font-bold text-emerald-900 dark:text-emerald-100 text-sm">CSD Vigente: CSD_AAS_001</p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">Válido hasta: 12/Oct/2028</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Series y Folios */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-neutral-900 dark:text-white flex items-center gap-2">
                      <FileDigit className="h-4 w-4 text-neutral-400" /> Series y Folios
                    </h3>
                    <button className="text-xs font-bold bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700">
                      + Nueva Serie
                    </button>
                  </div>
                  <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-neutral-50 dark:bg-black/50 text-neutral-500 text-xs uppercase">
                        <tr>
                          <th className="p-3 font-bold">Tipo Comprobante</th>
                          <th className="p-3 font-bold">Serie</th>
                          <th className="p-3 font-bold">Siguiente Folio</th>
                          <th className="p-3 font-bold text-right">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                        <tr>
                          <td className="p-3 font-bold dark:text-white">Ingreso (I)</td>
                          <td className="p-3 font-mono">F-</td>
                          <td className="p-3 font-mono">1542</td>
                          <td className="p-3 text-right"><span className="text-emerald-500 font-bold text-xs">Activa</span></td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold dark:text-white">Pago (P)</td>
                          <td className="p-3 font-mono">REP-</td>
                          <td className="p-3 font-mono">89</td>
                          <td className="p-3 text-right"><span className="text-emerald-500 font-bold text-xs">Activa</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 2. CATÁLOGO DE CUENTAS */}
            {activeTab === 'catalogo' && (
              <div className="space-y-6 animate-in fade-in duration-300 flex flex-col items-center justify-center min-h-[500px] text-center">
                <div className="bg-neutral-100 dark:bg-neutral-800 p-6 rounded-full mb-4">
                  <Receipt className="h-12 w-12 text-neutral-400" />
                </div>
                <h2 className="text-2xl font-black text-neutral-900 dark:text-white">Estructura Contable</h2>
                <p className="text-neutral-500 max-w-md">
                  El árbol interactivo para mapear cuentas (Activo, Pasivo, Capital) con el código agrupador del SAT está en construcción.
                </p>
                <div className="flex gap-3 mt-4">
                  <button className="px-6 py-3 bg-neutral-950 dark:bg-white text-white dark:text-black font-bold rounded-xl shadow-lg">
                    Importar de XML
                  </button>
                  <button className="px-6 py-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl">
                    Descargar Plantilla CSV
                  </button>
                </div>
              </div>
            )}

            {/* 3. IMPUESTOS Y TASAS */}
            {activeTab === 'impuestos' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-black text-neutral-900 dark:text-white">Impuestos y Retenciones</h2>
                    <p className="text-sm text-neutral-500">Configuración global aplicable a compras y ventas.</p>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-neutral-950 dark:bg-white text-white dark:text-black font-bold rounded-xl text-sm">
                    <Plus className="h-4 w-4" /> Nuevo Impuesto
                  </button>
                </div>

                <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-neutral-50 dark:bg-black/50 text-xs uppercase text-neutral-500">
                      <tr>
                        <th className="p-4 font-bold">Tipo</th>
                        <th className="p-4 font-bold">Nombre / Descripción</th>
                        <th className="p-4 font-bold">Tasa / Cuota</th>
                        <th className="p-4 font-bold">Aplicación</th>
                        <th className="p-4 font-bold text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-sm">
                      <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                        <td className="p-4"><span className="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 px-2 py-1 rounded text-xs font-bold">Traslado</span></td>
                        <td className="p-4 font-bold dark:text-white">IVA Tasa General</td>
                        <td className="p-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">16.000000%</td>
                        <td className="p-4 text-neutral-500">Global (Ventas y Compras)</td>
                        <td className="p-4 text-right text-emerald-500 font-bold cursor-pointer hover:underline">Editar</td>
                      </tr>
                      <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                        <td className="p-4"><span className="bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 px-2 py-1 rounded text-xs font-bold">Retención</span></td>
                        <td className="p-4 font-bold dark:text-white">Retención ISR (RESICO)</td>
                        <td className="p-4 font-mono font-bold text-red-600 dark:text-red-400">1.250000%</td>
                        <td className="p-4 text-neutral-500">Solo Ventas a PM</td>
                        <td className="p-4 text-right text-emerald-500 font-bold cursor-pointer hover:underline">Editar</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. PERIODOS CONTABLES */}
            {activeTab === 'periodos' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-black text-neutral-900 dark:text-white">Periodos Contables</h2>
                    <p className="text-sm text-neutral-500">Bloquea la edición de meses anteriores para asegurar saldos.</p>
                  </div>
                  <div className="flex gap-2">
                    <select className="bg-neutral-100 dark:bg-neutral-800 border-none rounded-xl px-4 py-2 text-sm font-bold dark:text-white outline-none">
                      <option>Ejercicio 2026</option>
                      <option>Ejercicio 2025</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { m: 'Enero', status: 'cerrado' },
                    { m: 'Febrero', status: 'cerrado' },
                    { m: 'Marzo', status: 'abierto' },
                    { m: 'Abril', status: 'futuro' },
                  ].map((mes, i) => (
                    <div key={i} className={`p-4 rounded-2xl border ${
                      mes.status === 'cerrado' ? 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 opacity-75' : 
                      mes.status === 'abierto' ? 'bg-white dark:bg-black border-emerald-500 shadow-sm' : 
                      'bg-neutral-50 dark:bg-neutral-900 border-dashed border-neutral-300 dark:border-neutral-700'
                    }`}>
                      <div className="flex justify-between items-start mb-4">
                        <span className="font-bold text-neutral-900 dark:text-white">{mes.m}</span>
                        {mes.status === 'cerrado' && <Lock className="h-4 w-4 text-neutral-400" />}
                        {mes.status === 'abierto' && <CalendarCheck className="h-4 w-4 text-emerald-500" />}
                      </div>
                      
                      {mes.status === 'cerrado' ? (
                        <span className="text-xs font-bold text-neutral-500 bg-neutral-200 dark:bg-neutral-800 px-2 py-1 rounded">CERRADO</span>
                      ) : mes.status === 'abierto' ? (
                        <button className="text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-lg w-full hover:bg-emerald-100 transition-colors">
                          Cerrar Periodo
                        </button>
                      ) : (
                        <span className="text-xs font-medium text-neutral-400">Próximo</span>
                      )}
                    </div>
                  ))}
                </div>
                
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}