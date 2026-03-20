'use client';

import { useState } from 'react';
import { 
  Calculator, FileDigit, Laptop, PieChart, Play, RefreshCw, 
  ShieldCheck, AlertTriangle, Download, Send, Lock, FileSignature, 
  CheckCircle2, XCircle, Search, Filter, Server, HardDrive, 
  Settings2, Activity, Archive
} from 'lucide-react';

export default function NominaAdministracionPage() {
  const [activeTab, setActiveTab] = useState<'calculo' | 'timbrado' | 'activos' | 'reportes'>('calculo');
  const [isCalculating, setIsCalculating] = useState(false);
  const [isStamping, setIsStamping] = useState(false);
  const [stampProgress, setStampProgress] = useState(0);

  const handleCorrerNomina = () => {
    setIsCalculating(true);
    setTimeout(() => setIsCalculating(false), 2000);
  };

  const handleTimbradoMasivo = () => {
    setIsStamping(true);
    setStampProgress(0);
    const interval = setInterval(() => {
      setStampProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsStamping(false), 500);
          return 100;
        }
        return prev + 25;
      });
    }, 800);
  };

  // Datos Simulados
  const nominaData = [
    { id: 'EMP-001', nombre: 'Carlos Ruiz', puesto: 'Desarrollador', bruto: 35000, isr: 5200, imss: 950, incidencias: '0', neto: 28850, estatus: 'Calculado' },
    { id: 'EMP-002', nombre: 'Ana Gómez', puesto: 'Diseñadora', bruto: 28000, isr: 3900, imss: 750, incidencias: '-$500 (Retardo)', neto: 22850, estatus: 'Calculado' },
    { id: 'EMP-003', nombre: 'Luis Pérez', puesto: 'Ventas', bruto: 15000, isr: 1200, imss: 400, incidencias: '+$4,000 (Comisión)', neto: 17400, estatus: 'Revisión' },
  ];

  const activosData = [
    { id: 'ACT-MAC-04', tipo: 'Laptop', modelo: 'MacBook Pro M3', asignado: 'Carlos Ruiz', valor: '$45,000', estatus: 'Asignado', responsiva: 'Firmada (DOC-882)' },
    { id: 'ACT-MON-12', tipo: 'Monitor', modelo: 'Dell UltraSharp 27"', asignado: 'Ana Gómez', valor: '$8,500', estatus: 'Asignado', responsiva: 'Pendiente Firma' },
    { id: 'ACT-VEH-01', tipo: 'Vehículo', modelo: 'VW Jetta 2024', asignado: 'Luis Pérez', valor: '$420,000', estatus: 'Mantenimiento', responsiva: 'Firmada (DOC-102)' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* HEADER ERP */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20">
              <Calculator className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">Nómina y Administración</h1>
              <p className="text-neutral-500 font-medium text-sm mt-1">
                Cálculo Exacto, Timbrado CFDI 4.0 y Gestión de Activos Físicos.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all text-sm border border-neutral-200 dark:border-neutral-700">
              <Settings2 className="h-4 w-4" /> Tablas ISR/IMSS 2026
            </button>
            <button 
              onClick={handleCorrerNomina}
              disabled={isCalculating}
              className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition-all shadow-lg shadow-emerald-500/20 text-sm disabled:opacity-50"
            >
              {isCalculating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {isCalculating ? 'Procesando Motor...' : 'Correr Nómina (Q1 Mar)'}
            </button>
          </div>
        </header>

        {/* TOP METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Costo Total Nómina</p>
              <p className="text-2xl font-black text-neutral-900 dark:text-white mt-1">$1.2M <span className="text-xs text-neutral-500 font-medium">MXN</span></p>
            </div>
            <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl"><Calculator className="h-6 w-6 text-neutral-500" /></div>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between border-l-4 border-l-blue-500">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Pendientes Timbrado</p>
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">142 <span className="text-xs text-blue-500 font-medium">Recibos</span></p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl"><FileDigit className="h-6 w-6 text-blue-500" /></div>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between border-l-4 border-l-indigo-500">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Activos Asignados</p>
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">$2.8M <span className="text-xs text-indigo-500 font-medium">En equipo</span></p>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl"><Laptop className="h-6 w-6 text-indigo-500" /></div>
          </div>
          <div className="bg-gradient-to-br from-neutral-900 to-black dark:from-emerald-950 dark:to-black p-5 rounded-2xl border border-neutral-800 dark:border-emerald-500/30 flex items-center justify-between text-white border-l-4 border-l-emerald-500">
            <div>
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Aprobación (Workflow)</p>
              <p className="text-lg font-black text-white mt-1">VoBo Dir. Finanzas</p>
              <p className="text-[10px] text-emerald-400 mt-1 font-bold flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Firmado Digitalmente</p>
            </div>
            <div className="p-3 bg-neutral-800 dark:bg-emerald-500/20 rounded-xl"><Lock className="h-6 w-6 text-emerald-400" /></div>
          </div>
        </div>

        {/* NAVEGACIÓN DE MÓDULOS */}
        <div className="flex overflow-x-auto border-b border-neutral-200 dark:border-neutral-800 pb-2 gap-2">
          {[
            { id: 'calculo', label: 'Motor de Cálculo', icon: Calculator },
            { id: 'timbrado', label: 'Timbrado CFDI 4.0', icon: FileDigit },
            { id: 'activos', label: 'Gestión de Activos Físicos', icon: HardDrive },
            { id: 'reportes', label: 'Exportación IDSE / SUA', icon: PieChart },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                  : 'bg-white dark:bg-neutral-900 text-neutral-500 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
              }`}
            >
              <tab.icon className="h-4 w-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* ÁREA DE CONTENIDO */}
        <main className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm min-h-[500px] p-6">
          
          {/* 1. MOTOR DE CÁLCULO DE NÓMINA */}
          {activeTab === 'calculo' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white">Pre-Nómina: Quincena 1 (Marzo 2026)</h2>
                  <p className="text-xs text-neutral-500 mt-1">Valida incidencias, bonos y deducciones antes del cierre definitivo.</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <Search className="h-4 w-4 text-neutral-400" />
                    <input type="text" placeholder="Buscar empleado..." className="bg-transparent border-none outline-none text-sm font-medium text-neutral-900 dark:text-white w-40" />
                  </div>
                  <button className="bg-neutral-950 dark:bg-white text-white dark:text-black font-bold px-4 py-2 rounded-xl text-sm shadow-md transition-transform hover:scale-[1.02]">
                    Cierre de Periodo
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-2xl">
                <table className="min-w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-neutral-50 dark:bg-black/50 border-b border-neutral-200 dark:border-neutral-800 text-[10px] uppercase text-neutral-500 tracking-widest font-black">
                    <tr>
                      <th className="p-4">Colaborador</th>
                      <th className="p-4 text-right">Salario Bruto</th>
                      <th className="p-4 text-center">Incidencias (Faltas/Bonos)</th>
                      <th className="p-4 text-right text-rose-600">Retención ISR</th>
                      <th className="p-4 text-right text-rose-600">Cuota IMSS</th>
                      <th className="p-4 text-right text-emerald-600 font-black text-xs">Neto a Pagar</th>
                      <th className="p-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                    {nominaData.map((emp) => (
                      <tr key={emp.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 group">
                        <td className="p-4">
                          <p className="font-bold text-neutral-900 dark:text-white">{emp.nombre}</p>
                          <p className="text-[10px] text-neutral-500 font-mono mt-0.5">{emp.id} • {emp.puesto}</p>
                        </td>
                        <td className="p-4 text-right font-mono font-medium">${emp.bruto.toLocaleString('es-MX')}</td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                            emp.incidencias.includes('-') ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' : 
                            emp.incidencias.includes('+') ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 
                            'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                          }`}>
                            {emp.incidencias}
                          </span>
                        </td>
                        <td className="p-4 text-right font-mono text-rose-600 dark:text-rose-400">-${emp.isr.toLocaleString('es-MX')}</td>
                        <td className="p-4 text-right font-mono text-rose-600 dark:text-rose-400">-${emp.imss.toLocaleString('es-MX')}</td>
                        <td className="p-4 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 text-base">${emp.neto.toLocaleString('es-MX')}</td>
                        <td className="p-4 text-center">
                          <button className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-center gap-1 w-full">
                            <RefreshCw className="h-3 w-3" /> Recalcular
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. TIMBRADO FISCAL (COMPLIANCE CFDI 4.0) */}
          {activeTab === 'timbrado' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row justify-between items-center bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 p-5 rounded-2xl gap-4">
                <div className="flex items-start gap-4">
                  <Server className="h-8 w-8 text-blue-500 mt-1" />
                  <div>
                    <h3 className="font-black text-blue-900 dark:text-blue-100 text-lg">Procesador Asíncrono de Timbrado (PAC)</h3>
                    <p className="text-xs text-blue-700 dark:text-blue-400 mt-1 leading-relaxed max-w-xl">
                      El sistema valida la LCO (Lista de Contribuyentes Obligados) verificando el Nombre Exacto, RFC y Código Postal de cada empleado antes de solicitar el UUID al SAT.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={handleTimbradoMasivo}
                  disabled={isStamping}
                  className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-black px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 text-sm flex items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4" /> {isStamping ? 'Timbrando...' : 'Iniciar Timbrado Masivo'}
                </button>
              </div>

              {/* Progress Bar Asíncrona */}
              {isStamping && (
                <div className="bg-white dark:bg-neutral-900 p-4 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm">
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-neutral-500">Conectando con API del PAC...</span>
                    <span className="text-blue-600">{stampProgress}% completado</span>
                  </div>
                  <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-blue-500 h-2.5 rounded-full transition-all duration-500 ease-out" 
                      style={{ width: `${stampProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 bg-white dark:bg-black">
                  <h4 className="font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-500" /> Resultados de Validación LCO
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        <div>
                          <p className="text-sm font-bold text-neutral-900 dark:text-white">140 Empleados Validados</p>
                          <p className="text-[10px] text-neutral-500">RFC y C.P. coinciden con la base del SAT.</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-rose-500" />
                        <div>
                          <p className="text-sm font-bold text-rose-900 dark:text-rose-100">2 Discrepancias Detectadas (Errores 4.0)</p>
                          <p className="text-[10px] text-rose-700 dark:text-rose-400">EMP-045 y EMP-088 tienen el C.P. desactualizado.</p>
                        </div>
                      </div>
                      <button className="text-[10px] font-bold bg-white dark:bg-rose-900 text-rose-600 dark:text-rose-300 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800 shadow-sm">Revisar</button>
                    </div>
                  </div>
                </div>

                <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 bg-neutral-50 dark:bg-black flex flex-col justify-center items-center text-center">
                  <Download className="h-10 w-10 text-neutral-400 mb-4" />
                  <h4 className="font-bold text-neutral-900 dark:text-white">Expediente Fiscal (XML/PDF)</h4>
                  <p className="text-xs text-neutral-500 mt-2 mb-6 max-w-xs">Genera un archivo .ZIP con todos los recibos de nómina timbrados para respaldo o entrega contable.</p>
                  <button className="bg-neutral-950 dark:bg-white text-white dark:text-black font-bold px-6 py-2 rounded-xl text-sm transition-transform hover:scale-[1.02] shadow-md flex items-center gap-2">
                    <Archive className="h-4 w-4" /> Descargar ZIP Masivo
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. GESTIÓN DE ACTIVOS (ASSET MANAGEMENT) */}
          {activeTab === 'activos' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white">Inventario Asignado a Colaboradores</h2>
                  <p className="text-xs text-neutral-500 mt-1">Vinculación legal y control de equipos físicos.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition-colors">
                  <Laptop className="h-4 w-4" /> Registrar Nuevo Activo
                </button>
              </div>

              <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-2xl">
                <table className="min-w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-neutral-50 dark:bg-black/50 border-b border-neutral-200 dark:border-neutral-800 text-[10px] uppercase text-neutral-500 tracking-widest font-black">
                    <tr>
                      <th className="p-4">Dispositivo / SN</th>
                      <th className="p-4">Colaborador Asignado</th>
                      <th className="p-4 text-center">Estatus</th>
                      <th className="p-4 text-center">Vínculo Legal (Responsiva)</th>
                      <th className="p-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                    {activosData.map((activo, idx) => (
                      <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 group">
                        <td className="p-4">
                          <p className="font-bold text-neutral-900 dark:text-white">{activo.modelo}</p>
                          <p className="text-[10px] text-neutral-500 font-mono mt-0.5">{activo.tipo} • {activo.id}</p>
                        </td>
                        <td className="p-4 font-bold text-neutral-700 dark:text-neutral-300">{activo.asignado}</td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                            activo.estatus === 'Asignado' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 
                            'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                          }`}>
                            {activo.estatus}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {activo.responsiva.includes('Firmada') ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded">
                              <FileSignature className="h-3 w-3" /> {activo.responsiva}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-500">
                              <AlertTriangle className="h-3 w-3" /> Pendiente Firma
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <button className="text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-neutral-700 px-3 py-1.5 rounded-lg transition-colors">Detalles</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. EXPORTACIÓN IDSE / SUA Y REPORTES */}
          {activeTab === 'reportes' && (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center animate-in fade-in duration-300">
              <div className="bg-amber-50 dark:bg-amber-500/10 p-6 rounded-full mb-4 border border-amber-100 dark:border-amber-500/20">
                <Activity className="h-12 w-12 text-amber-500" />
              </div>
              <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-2">Exportación Estructurada (IMSS)</h2>
              <p className="text-neutral-500 text-sm max-w-lg mb-8 leading-relaxed">
                Genera los archivos .TXT con la estructura de campos exacta requerida para la carga de movimientos afiliatorios en los portales gubernamentales.
              </p>
              
              <div className="flex gap-4">
                <button className="px-6 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white font-black rounded-xl text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors shadow-sm flex items-center gap-2">
                  <Download className="h-4 w-4" /> Layout IDSE (Altas/Bajas)
                </button>
                <button className="px-6 py-3 bg-neutral-950 dark:bg-white text-white dark:text-black font-black rounded-xl text-sm hover:scale-[1.02] transition-transform shadow-md flex items-center gap-2">
                  <Download className="h-4 w-4" /> Layout SUA (Aportaciones)
                </button>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}