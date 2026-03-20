'use client';

import { useState } from 'react';
import { 
  FolderOpen, ShieldCheck, FileSignature, FileText, 
  AlertTriangle, Download, Search, FileBadge, Lock, 
  UploadCloud, Clock, Fingerprint, CheckCircle2, 
  XCircle, FileKey, Eye, FileCheck, Send, RefreshCw, 
  Briefcase, AlertOctagon
} from 'lucide-react';

export default function DocumentacionLaboralPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'expedientes' | 'firmas' | 'plantillas'>('dashboard');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneracionMasiva = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 2500);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* HEADER ERP */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-teal-500/10 p-3 rounded-2xl border border-teal-500/20">
              <FolderOpen className="h-8 w-8 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">Documentación Laboral</h1>
              <p className="text-neutral-500 font-medium text-sm mt-1">
                Expediente Digital Único, Firma NOM-151 y Cumplimiento STPS.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all text-sm border border-neutral-200 dark:border-neutral-700">
              <RefreshCw className="h-4 w-4" /> Sincronizar con Finanzas
            </button>
            <button className="flex items-center gap-2 px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl transition-all shadow-lg shadow-teal-500/20 text-sm">
              <Download className="h-4 w-4" /> Exportar para Inspección STPS
            </button>
          </div>
        </header>

        {/* TOP METRICS (Tablero de Cumplimiento) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Cumplimiento Expedientes</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">94%</p>
              <p className="text-[10px] text-neutral-400 mt-1">8 Empleados con faltantes</p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl"><FileCheck className="h-6 w-6 text-emerald-500" /></div>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between border-l-4 border-l-amber-500">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Firmas Pendientes</p>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">12 <span className="text-xs font-medium text-amber-500">Docs</span></p>
              <p className="text-[10px] text-amber-500 mt-1 font-bold">Esperando e.firma (SAT)</p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl"><FileSignature className="h-6 w-6 text-amber-500" /></div>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between border-l-4 border-l-rose-500">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Alerta de Riesgo LFT</p>
              <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">3 <span className="text-xs font-medium text-rose-500">Contratos</span></p>
              <p className="text-[10px] text-rose-500 mt-1 font-bold flex items-center gap-1"><AlertOctagon className="h-3 w-3" /> Exceden límite temporal</p>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-500/10 rounded-xl"><AlertTriangle className="h-6 w-6 text-rose-500" /></div>
          </div>

          <div className="bg-gradient-to-br from-neutral-900 to-black dark:from-teal-950 dark:to-black p-5 rounded-2xl border border-neutral-800 dark:border-teal-500/30 flex items-center justify-between text-white border-l-4 border-l-teal-500">
            <div>
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Seguridad LFPDPPP</p>
              <p className="text-lg font-black text-white mt-1">Cifrado AES-256</p>
              <p className="text-[10px] text-teal-400 mt-1 font-bold flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Audit Trail Activo</p>
            </div>
            <div className="p-3 bg-neutral-800 dark:bg-teal-500/20 rounded-xl"><Lock className="h-6 w-6 text-teal-400" /></div>
          </div>
        </div>

        {/* NAVEGACIÓN DE MÓDULOS */}
        <div className="flex overflow-x-auto border-b border-neutral-200 dark:border-neutral-800 pb-2 gap-2">
          {[
            { id: 'dashboard', label: 'Dashboard de Cumplimiento', icon: ShieldCheck },
            { id: 'expedientes', label: 'Expediente Digital Único', icon: FolderOpen },
            { id: 'firmas', label: 'Firmas y NOM-151', icon: FileSignature },
            { id: 'plantillas', label: 'Automatización y Plantillas', icon: FileText },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20' 
                  : 'bg-white dark:bg-neutral-900 text-neutral-500 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
              }`}
            >
              <tab.icon className="h-4 w-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* ÁREA DE CONTENIDO */}
        <main className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm min-h-[600px] p-6">
          
          {/* 1. DASHBOARD DE CUMPLIMIENTO */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Alertas de Riesgo LFT */}
                <div className="border border-rose-200 dark:border-rose-900/50 rounded-2xl p-6 bg-rose-50/50 dark:bg-rose-950/20">
                  <h3 className="font-black text-rose-900 dark:text-rose-100 flex items-center gap-2 mb-4"><AlertOctagon className="h-5 w-5 text-rose-600" /> Alertas Críticas (Riesgo LFT)</h3>
                  <div className="space-y-3">
                    <div className="bg-white dark:bg-black p-4 rounded-xl border border-rose-100 dark:border-rose-800 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-sm text-neutral-900 dark:text-white">Límite de Renovación Temporal Excedido</p>
                          <p className="text-[10px] text-neutral-500 font-mono mt-0.5">Carlos Ruiz • ID: EMP-001</p>
                        </div>
                        <span className="bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400 px-2 py-1 rounded text-[10px] font-black uppercase">Alto Riesgo</span>
                      </div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">El colaborador está por firmar su 3er contrato temporal (Por Obra Determinda). Según la LFT, debe transicionar a Contrato Indeterminado para evitar multas de la STPS.</p>
                      <button className="mt-3 text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline">Generar Contrato Indeterminado Automático</button>
                    </div>

                    <div className="bg-white dark:bg-black p-4 rounded-xl border border-amber-100 dark:border-amber-800 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-sm text-neutral-900 dark:text-white">Visa de Trabajo por Expirar</p>
                          <p className="text-[10px] text-neutral-500 font-mono mt-0.5">John Doe • ID: EMP-042</p>
                        </div>
                        <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 px-2 py-1 rounded text-[10px] font-black uppercase">Vence en 15 días</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Auditoría de Expedientes Incompletos */}
                <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 bg-white dark:bg-black">
                  <h3 className="font-black text-neutral-900 dark:text-white flex items-center gap-2 mb-4"><FolderOpen className="h-5 w-5 text-teal-500" /> Auditoría de Expedientes Faltantes</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-800 rounded-full flex items-center justify-center font-bold text-neutral-500 text-xs">AL</div>
                        <div>
                          <p className="text-sm font-bold text-neutral-900 dark:text-white">Ana López</p>
                          <p className="text-[10px] text-rose-500 font-bold mt-0.5">Falta: Comprobante de Domicilio y RFC (CSF)</p>
                        </div>
                      </div>
                      <button className="bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-teal-100 dark:hover:bg-teal-500/20 transition-colors">Solicitar a Colaborador</button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-800 rounded-full flex items-center justify-center font-bold text-neutral-500 text-xs">MR</div>
                        <div>
                          <p className="text-sm font-bold text-neutral-900 dark:text-white">Miguel Ramírez</p>
                          <p className="text-[10px] text-rose-500 font-bold mt-0.5">Falta: Constancia de Situación Fiscal actualizada</p>
                        </div>
                      </div>
                      <button className="bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-teal-100 dark:hover:bg-teal-500/20 transition-colors">Solicitar a Colaborador</button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* 2. EXPEDIENTE DIGITAL ÚNICO & OCR */}
          {activeTab === 'expedientes' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white">Repositorio Central (Single Point of Truth)</h2>
                  <p className="text-xs text-neutral-500 mt-1">Estructura jerárquica con extracción de datos mediante OCR.</p>
                </div>
                <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 w-full md:w-auto">
                  <Search className="h-4 w-4 text-neutral-400" />
                  <input type="text" placeholder="Buscar por Nombre o RFC..." className="bg-transparent border-none outline-none text-sm font-medium text-neutral-900 dark:text-white w-56" />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Directorio de Empleados */}
                <div className="lg:col-span-1 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50 dark:bg-black overflow-hidden h-[500px] flex flex-col">
                  <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                    <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Directorio Activo</h3>
                  </div>
                  <div className="overflow-y-auto flex-1 p-2 space-y-1">
                    {['Angel Ortiz (CEO)', 'Carlos Ruiz (Finanzas)', 'Ana López (Marketing)', 'Luis Pérez (Ventas)'].map((emp, i) => (
                      <div key={i} className={`p-3 rounded-xl cursor-pointer transition-colors ${i === 1 ? 'bg-teal-100 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800' : 'hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-transparent'}`}>
                        <div className="flex items-center gap-3">
                          <FolderOpen className={`h-4 w-4 ${i === 1 ? 'text-teal-600 dark:text-teal-400' : 'text-neutral-400'}`} />
                          <p className={`text-sm font-bold ${i === 1 ? 'text-teal-900 dark:text-teal-100' : 'text-neutral-700 dark:text-neutral-300'}`}>{emp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Estructura del Expediente (Jerarquía) */}
                <div className="lg:col-span-2 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 bg-white dark:bg-black flex flex-col">
                  <div className="flex justify-between items-center mb-6 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                    <div>
                      <h3 className="font-black text-lg text-neutral-900 dark:text-white">Expediente: Carlos Ruiz</h3>
                      <p className="text-[10px] text-neutral-500 font-mono mt-0.5">ID: EMP-001 • Creado: 12/Ene/2024</p>
                    </div>
                    <button className="bg-neutral-950 dark:bg-white text-white dark:text-black text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2">
                      <UploadCloud className="h-4 w-4" /> Subir Documento (OCR)
                    </button>
                  </div>

                  {/* Jerarquía de Carpetas y Archivos */}
                  <div className="space-y-4 flex-1">
                    
                    {/* Carpeta Contratos */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <FolderOpen className="h-4 w-4 text-neutral-400" />
                        <h4 className="font-bold text-sm text-neutral-900 dark:text-white">1. Contratos y Anexos</h4>
                      </div>
                      <div className="pl-6 space-y-2">
                        <div className="flex items-center justify-between bg-neutral-50 dark:bg-neutral-900 p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 group">
                          <div className="flex items-center gap-3">
                            <FileSignature className="h-4 w-4 text-indigo-500" />
                            <div>
                              <p className="text-xs font-bold text-neutral-900 dark:text-white">Contrato_Indeterminado_CRuiz.pdf</p>
                              <div className="flex gap-2 mt-1">
                                <span className="text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold">Vigente</span>
                                <span className="text-[9px] text-neutral-400 font-mono">v1.2 • Modificado: Hace 2 meses</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-1.5 text-neutral-400 hover:text-teal-500"><Eye className="h-4 w-4" /></button>
                            <button className="p-1.5 text-neutral-400 hover:text-teal-500"><Clock className="h-4 w-4" aria-label="Ver Historial de Versiones" /></button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Carpeta Identificaciones (OCR) */}
                    <div>
                      <div className="flex items-center gap-2 mb-2 mt-6">
                        <FolderOpen className="h-4 w-4 text-neutral-400" />
                        <h4 className="font-bold text-sm text-neutral-900 dark:text-white">2. Identificaciones (Validado por OCR)</h4>
                      </div>
                      <div className="pl-6 space-y-2">
                        <div className="flex items-center justify-between bg-neutral-50 dark:bg-neutral-900 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800/50">
                          <div className="flex items-center gap-3">
                            <FileBadge className="h-4 w-4 text-emerald-500" />
                            <div>
                              <p className="text-xs font-bold text-neutral-900 dark:text-white">INE_Frente_Reverso_CRuiz.jpg</p>
                              <p className="text-[9px] text-emerald-600 dark:text-emerald-400 mt-1 font-mono flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> OCR: Datos coinciden con Ficha de Empleado (100%)</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. FIRMAS Y NOM-151 */}
          {activeTab === 'firmas' && (
            <div className="space-y-6 animate-in fade-in duration-300">
               <div className="flex flex-col md:flex-row justify-between items-center bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800/30 p-5 rounded-2xl gap-4">
                <div className="flex items-start gap-4">
                  <FileKey className="h-8 w-8 text-indigo-500 mt-1" />
                  <div>
                    <h3 className="font-black text-indigo-900 dark:text-indigo-100 text-lg">Centro de Firmas (e.firma y NOM-151)</h3>
                    <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-1 leading-relaxed max-w-2xl">
                      Garantía de "No Repudio" y "Cadena de Custodia". Los contratos se firman utilizando el certificado del SAT (.cer / .key) del colaborador y se sellan con la Constancia de Conservación NOM-151 de la Secretaría de Economía.
                    </p>
                  </div>
                </div>
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20 text-sm flex items-center gap-2 whitespace-nowrap">
                  <Fingerprint className="h-4 w-4" /> Validar Identidad (Biometría)
                </button>
              </div>

              <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-black">
                <table className="min-w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 text-[10px] uppercase text-neutral-500 tracking-widest font-black">
                    <tr>
                      <th className="p-4">Documento / Empleado</th>
                      <th className="p-4 text-center">Estatus de Firma</th>
                      <th className="p-4 text-center">Validez Legal (NOM-151)</th>
                      <th className="p-4 text-right">Audit Trail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                    <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="p-4">
                        <p className="font-bold text-neutral-900 dark:text-white">Anexo de Confidencialidad (NDA)</p>
                        <p className="text-[10px] text-neutral-500 mt-0.5 font-mono">Para: Luis Pérez • Creado: Hoy</p>
                      </td>
                      <td className="p-4 text-center">
                        <span className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 px-2 py-1 rounded text-[10px] font-black uppercase flex items-center justify-center gap-1 w-max mx-auto">
                          <Clock className="h-3 w-3" /> Esperando e.firma
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-[10px] text-neutral-400 font-bold">Pendiente de Sello</span>
                      </td>
                      <td className="p-4 text-right">
                        <button className="text-xs font-bold text-indigo-600 hover:underline">Recordatorio (WhatsApp)</button>
                      </td>
                    </tr>
                    <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 bg-indigo-50/30 dark:bg-indigo-900/5">
                      <td className="p-4">
                        <p className="font-bold text-neutral-900 dark:text-white">Contrato_Prestación_Servicios.pdf</p>
                        <p className="text-[10px] text-neutral-500 mt-0.5 font-mono">Para: Consultora Externa S.A. • Firmado: Ayer</p>
                      </td>
                      <td className="p-4 text-center">
                        <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-2 py-1 rounded text-[10px] font-black uppercase flex items-center justify-center gap-1 w-max mx-auto">
                          <CheckCircle2 className="h-3 w-3" /> Firmado (e.firma)
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded text-[10px] font-black uppercase border border-indigo-200 dark:border-indigo-800">
                          <ShieldCheck className="h-3 w-3" /> Sellado NOM-151
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button className="text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center justify-end gap-1 w-full"><Download className="h-3 w-3"/> Constancia XML</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. AUTOMATIZACIÓN Y PLANTILLAS */}
          {activeTab === 'plantillas' && (
            <div className="space-y-6 animate-in fade-in duration-300">
               <div className="flex flex-col md:flex-row justify-between items-center bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 p-5 rounded-2xl gap-4">
                <div>
                  <h3 className="font-black text-neutral-900 dark:text-white flex items-center gap-2"><FileText className="h-5 w-5 text-teal-500" /> Generación Automática Basada en Plantillas</h3>
                  <p className="text-xs text-neutral-500 mt-1">El ERP inyecta los datos de la ficha del empleado (Sueldo, Puesto, CURP) en los machotes pre-aprobados por el Módulo Legal.</p>
                </div>
                <button 
                  onClick={handleGeneracionMasiva}
                  disabled={isGenerating}
                  className="bg-neutral-950 dark:bg-white text-white dark:text-black font-black px-6 py-3 rounded-xl transition-all shadow-md text-sm flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
                >
                  {isGenerating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {isGenerating ? 'Generando 145 Docs...' : 'Generación Masiva de Contratos'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {['Contrato Indeterminado (Base)', 'Acuerdo de Confidencialidad (NDA)', 'Carta de Recomendación (Salida)'].map((plantilla, i) => (
                  <div key={i} className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 bg-white dark:bg-black hover:border-teal-500 transition-colors group cursor-pointer">
                    <FileText className="h-8 w-8 text-neutral-300 dark:text-neutral-700 mb-4 group-hover:text-teal-500 transition-colors" />
                    <h4 className="font-bold text-sm text-neutral-900 dark:text-white mb-2">{plantilla}</h4>
                    <p className="text-[10px] text-neutral-500 mb-4 font-mono">Variables activas: {'{{Nombre}}'}, {'{{CURP}}'}, {'{{Salario}}'}</p>
                    <div className="flex gap-2">
                      <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 px-2 py-1 rounded">VoBo Legal Ok</span>
                      <span className="text-[9px] font-black uppercase tracking-widest bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 px-2 py-1 rounded">V. 2.4</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}