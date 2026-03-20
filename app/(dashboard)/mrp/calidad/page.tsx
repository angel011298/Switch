'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, Beaker, FileSignature, Scale, AlertOctagon, 
  Settings, CheckCircle2, XCircle, BarChart3, Microscope, 
  ClipboardList, Ruler, History, Search, Plus, Filter, 
  FileText, Lock, Unlock, Eye, TrendingDown, Factory, 
  Truck, ArrowRightLeft, Camera, Download, Activity, Zap
} from 'lucide-react';

export default function ControlCalidadPage() {
  const [activeTab, setActiveTab] = useState('inspeccion');
  const [isGlobalLock, setIsGlobalLock] = useState(false);

  // Mock de Lotes en Inspección
  const batches = [
    { id: 'LOT-2026-001', product: 'Chasis Ad Astra v2', type: 'IQC', status: 'Cuarentena', qty: 500, aql: '1.5%', samples: 50 },
    { id: 'LOT-2026-042', product: 'Servidor Industrial X1', type: 'FQC', status: 'En Proceso', qty: 50, aql: '0.65%', samples: 8 },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-zinc-950 p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* HEADER DE CALIDAD TOTAL */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl border transition-all ${isGlobalLock ? 'bg-rose-600 border-rose-700 animate-pulse' : 'bg-rose-500/10 border-rose-500/20'}`}>
              <ShieldCheck className={`h-8 w-8 ${isGlobalLock ? 'text-white' : 'text-rose-600 dark:text-rose-400'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">Control de Calidad (QC)</h1>
                <span className="bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 text-[10px] font-black px-2 py-1 rounded-full uppercase">
                  Auditoría Inmutable AllSafe
                </span>
              </div>
              <p className="text-neutral-500 font-medium text-sm mt-1 flex items-center gap-2">
                <Microscope className="h-4 w-4" /> Gestión de AQL, Certificaciones CoA y Metrología ISO.
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setIsGlobalLock(!isGlobalLock)}
              className={`flex items-center gap-2 px-4 py-2 font-bold rounded-xl text-xs transition-all border ${
                isGlobalLock 
                ? 'bg-rose-600 text-white border-rose-700' 
                : 'bg-white dark:bg-zinc-800 text-rose-600 border-rose-200 dark:border-zinc-700'
              }`}
            >
              <Lock className="h-4 w-4" /> {isGlobalLock ? 'SISTEMA BLOQUEADO' : 'Bloqueo Preventivo'}
            </button>
            <button className="flex items-center gap-2 px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black font-black rounded-xl transition-all shadow-lg text-xs">
              <Download className="h-4 w-4" /> Exportar Audit Trail
            </button>
          </div>
        </header>

        {/* KPIs FINANCIEROS Y OPERATIVOS DE CALIDAD */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-neutral-200 dark:border-zinc-800 border-l-4 border-l-rose-500">
            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Costo de No Calidad</p>
            <p className="text-2xl font-black text-rose-600 mt-1">$14,250.00 <span className="text-xs text-neutral-400">USD</span></p>
            <p className="text-[10px] text-rose-500 font-bold mt-2 flex items-center gap-1 italic">
              <TrendingDown className="h-3 w-3" /> Scrap + Retrabajos este mes
            </p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-neutral-200 dark:border-zinc-800">
            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Aceptación de Lotes</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">98.4%</p>
            <p className="text-[10px] text-emerald-500 font-bold mt-2">Dentro de límites AQL ISO 2859</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-neutral-200 dark:border-zinc-800">
            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Instrumentos Vigentes</p>
            <p className="text-2xl font-black text-neutral-950 dark:text-white mt-1">24 / 26</p>
            <p className="text-[10px] text-amber-500 font-bold mt-2 flex items-center gap-1">
              <AlertOctagon className="h-3 w-3" /> 2 Balanzas requieren calibración
            </p>
          </div>
          <div className="bg-zinc-900 dark:bg-white p-5 rounded-2xl border border-zinc-800 dark:border-zinc-200 text-white dark:text-black">
            <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Compliance Legal</p>
            <p className="text-2xl font-black mt-1">100% CoA</p>
            <p className="text-[10px] text-emerald-400 dark:text-emerald-600 font-bold mt-2 flex items-center gap-1">
              <FileSignature className="h-3 w-3" /> Firmas Digitales al día
            </p>
          </div>
        </div>

        {/* NAVEGACIÓN QC */}
        <div className="flex gap-2 border-b border-neutral-200 dark:border-zinc-800 pb-2 overflow-x-auto">
          {[
            { id: 'inspeccion', name: 'Puntos de Inspección', icon: Microscope },
            { id: 'ncr', name: 'No Conformidades (CAPA)', icon: AlertOctagon },
            { id: 'metrologia', name: 'Metrología & Calibración', icon: Ruler },
            { id: 'analitica', name: 'Analítica de Calidad', icon: BarChart3 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id 
                ? 'bg-rose-600 text-white shadow-lg' 
                : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-zinc-900'
              }`}
            >
              <tab.icon className="h-4 w-4" /> {tab.name}
            </button>
          ))}
        </div>

        {/* ÁREA DE TRABAJO DINÁMICA */}
        <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
          
          {/* TAB 1: PUNTOS DE INSPECCIÓN (IQC / IPQC / FQC) */}
          {activeTab === 'inspeccion' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-neutral-900 dark:text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-rose-500" /> Monitoreo de Lotes en Tiempo Real
                </h3>
                <div className="flex gap-2">
                  <button className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-zinc-800 rounded-xl text-xs font-bold">
                    <Settings className="h-3 w-3" /> Configurar AQL
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-neutral-50 dark:bg-black text-[10px] uppercase text-neutral-500 font-black tracking-widest border-y border-neutral-100 dark:border-zinc-800">
                    <tr>
                      <th className="p-4">Lote ID</th>
                      <th className="p-4">Producto</th>
                      <th className="p-4">Punto Control</th>
                      <th className="p-4 text-center">Plan Muestreo</th>
                      <th className="p-4">Estatus</th>
                      <th className="p-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-zinc-800">
                    {batches.map((b) => (
                      <tr key={b.id} className="hover:bg-neutral-50/50 dark:hover:bg-black/20">
                        <td className="p-4 font-mono font-bold text-rose-600">{b.id}</td>
                        <td className="p-4">
                          <p className="font-bold text-neutral-900 dark:text-white">{b.product}</p>
                          <p className="text-[10px] text-neutral-500 uppercase">Orden: #AD-552</p>
                        </td>
                        <td className="p-4">
                          <span className={`flex items-center gap-1 font-black text-[10px] ${b.type === 'IQC' ? 'text-blue-500' : 'text-purple-500'}`}>
                            {b.type === 'IQC' ? <Truck className="h-3 w-3" /> : <Factory className="h-3 w-3" />} {b.type}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <p className="text-xs font-black">n={b.samples} / N={b.qty}</p>
                          <p className="text-[9px] text-neutral-400">AQL {b.aql}</p>
                        </td>
                        <td className="p-4">
                          <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-tighter animate-pulse">
                            {b.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors" title="Liberar Lote">
                              <Unlock className="h-4 w-4" />
                            </button>
                            <button className="p-2 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors" title="Rechazar Lote">
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: NO CONFORMIDADES (NCR) Y CAPA */}
          {activeTab === 'ncr' && (
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-xl font-black text-neutral-900 dark:text-white">Reportes de No Conformidad (NCR)</h3>
                <div className="p-5 border-2 border-rose-500 bg-rose-50/30 dark:bg-rose-900/10 rounded-3xl relative">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-black text-rose-700 bg-rose-100 px-2 py-1 rounded-lg">#NCR-8821</span>
                    <span className="text-[10px] text-neutral-500 font-bold">12 Mar 2026</span>
                  </div>
                  <h4 className="font-bold text-neutral-900 dark:text-white">Desviación en Voltaje - Componente CPU</h4>
                  <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
                    Lote IQC-552. Se detecta voltaje 5% arriba del límite de tolerancia. Lote bloqueado automáticamente en SCM.
                  </p>
                  <div className="mt-4 flex gap-2">
                    <button className="flex-1 bg-zinc-900 text-white text-[10px] font-black py-2 rounded-xl flex items-center justify-center gap-2">
                      <Camera className="h-3 w-3" /> Ver Evidencia
                    </button>
                    <button className="flex-1 bg-white border border-rose-200 text-rose-600 text-[10px] font-black py-2 rounded-xl">
                      Iniciar CAPA
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-neutral-50 dark:bg-black/40 p-8 rounded-3xl border border-neutral-100 dark:border-zinc-800">
                <h4 className="font-black text-neutral-900 dark:text-white mb-6 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500" /> Disposición de Lote (Legal/Finanzas)
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  <button className="w-full p-4 bg-white dark:bg-zinc-900 border border-neutral-200 rounded-2xl flex items-center justify-between group hover:border-rose-500 transition-all">
                    <div className="text-left">
                      <p className="text-sm font-black">Scrap (Desecho)</p>
                      <p className="text-[10px] text-neutral-500 font-bold">Registro contable de pérdida total.</p>
                    </div>
                    <ArrowRightLeft className="h-4 w-4 text-neutral-300 group-hover:text-rose-500" />
                  </button>
                  <button className="w-full p-4 bg-white dark:bg-zinc-900 border border-neutral-200 rounded-2xl flex items-center justify-between group hover:border-emerald-500 transition-all">
                    <div className="text-left">
                      <p className="text-sm font-black text-emerald-600">Retrabajo</p>
                      <p className="text-[10px] text-neutral-500 font-bold">Regresa a Producción para corrección.</p>
                    </div>
                    <ArrowRightLeft className="h-4 w-4 text-neutral-300 group-hover:text-emerald-500" />
                  </button>
                </div>
                <div className="mt-6 p-4 bg-amber-100/50 dark:bg-amber-900/10 border border-amber-200 rounded-2xl">
                  <p className="text-[10px] text-amber-800 dark:text-amber-200 leading-tight">
                    <strong>Nota Legal:</strong> La "Concesión de Uso" requiere firma digital de Nivel Directivo y será vinculada al contrato #AD-2026.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: METROLOGÍA (ISO 9001) */}
          {activeTab === 'metrologia' && (
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-black flex items-center gap-2">
                    <Ruler className="h-5 w-5 text-rose-500" /> Registro de Instrumentos
                  </h3>
                  {[
                    { name: 'Calibrador Vernier Digital', id: 'MIT-001', status: 'Vigente', date: 'Dec 2026' },
                    { name: 'Balanza Analítica 50kg', id: 'BAL-042', status: 'VENCIDO', date: 'Mar 2026' },
                  ].map((inst, i) => (
                    <div key={i} className="p-4 bg-neutral-50 dark:bg-black rounded-2xl border border-neutral-100 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${inst.status === 'Vigente' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                          <Settings className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-black">{inst.name}</p>
                          <p className="text-[10px] text-neutral-500">ID: {inst.id}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-[10px] font-black ${inst.status === 'Vigente' ? 'text-emerald-500' : 'text-rose-500'}`}>{inst.status}</p>
                        <p className="text-[9px] text-neutral-400 font-bold">Próx. Calib: {inst.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-zinc-900 text-white p-8 rounded-3xl relative overflow-hidden">
                  <History className="absolute -right-4 -bottom-4 h-32 w-32 text-white/5" />
                  <h4 className="text-lg font-black mb-4">Trazabilidad de Medición</h4>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    Cada medición registrada en Switch OS queda vinculada al número de serie del instrumento utilizado. En caso de falla del instrumento, el ERP identifica automáticamente todos los lotes inspeccionados por esa herramienta.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ANALÍTICA (BI) */}
          {activeTab === 'analitica' && (
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-zinc-800 p-6 rounded-3xl border border-neutral-100">
                  <h4 className="font-black text-sm mb-4">Top 5 Defectos (Pareto)</h4>
                  <div className="space-y-4">
                    {[
                      { name: 'Voltaje Fuera de Rango', perc: 65 },
                      { name: 'Acabado Superficial', perc: 20 },
                      { name: 'Falla de Empaque', perc: 10 },
                      { name: 'Dimensiones', perc: 5 },
                    ].map((d, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-[10px] font-bold mb-1">
                          <span>{d.name}</span>
                          <span>{d.perc}%</span>
                        </div>
                        <div className="h-1.5 bg-neutral-100 rounded-full">
                          <div className="h-full bg-rose-500 rounded-full" style={{ width: `${d.perc}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col justify-center bg-rose-50 dark:bg-rose-900/10 p-8 rounded-3xl border border-rose-200">
                  <BarChart3 className="h-10 w-10 text-rose-600 mb-4" />
                  <h4 className="text-xl font-black text-rose-900 dark:text-rose-100">Certificados de Análisis (CoA)</h4>
                  <p className="text-sm text-rose-700 mt-2">Genera documentos técnicos para tus clientes con un solo clic, firmados digitalmente por AllSafe.</p>
                  <button className="mt-6 bg-rose-600 text-white font-black py-3 rounded-xl text-xs shadow-lg">Descargar CoA Plantilla</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}