'use client';

import { useState } from 'react';
import { 
  Truck, Map, AlertOctagon, PackageCheck, Route, 
  MapPin, Clock, ShieldAlert, FileSignature, QrCode,
  ArrowRightLeft, AlertTriangle, Crosshair, Wrench,
  FileDigit, Zap, FileText, CheckCircle2, XCircle, Search, ShieldCheck
} from 'lucide-react';

export default function LogisticaTransportePage() {
  const [activeTab, setActiveTab] = useState<'torre' | 'rutas' | 'recepcion' | 'incidencias'>('torre');
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleOptimize = () => {
    setIsOptimizing(true);
    setTimeout(() => setIsOptimizing(false), 2000);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* HEADER ERP */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-sky-500/10 p-3 rounded-2xl border border-sky-500/20">
              <Truck className="h-8 w-8 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">Logística y Transporte</h1>
              <p className="text-neutral-500 font-medium text-sm mt-1">
                Torre de Control, Carta Porte (SAT) y Gestión de Flota.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-6 py-2 bg-neutral-950 dark:bg-white text-white dark:text-black font-black rounded-xl hover:scale-[1.02] transition-transform shadow-lg text-sm">
              <QrCode className="h-4 w-4" /> Escáner de Entrada
            </button>
            <button className="flex items-center gap-2 px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white font-black rounded-xl transition-all shadow-lg shadow-sky-500/20 text-sm">
              <Route className="h-4 w-4" /> Generar Guía de Embarque
            </button>
          </div>
        </header>

        {/* TOP METRICS & DASHBOARD DE SALUD LOGÍSTICA */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">En Tránsito (Live)</p>
              <div className="flex items-end gap-2 mt-1">
                <p className="text-2xl font-black text-neutral-900 dark:text-white">14</p>
                <p className="text-xs font-bold text-sky-500 mb-1">Unidades</p>
              </div>
            </div>
            <div className="p-3 bg-sky-50 dark:bg-sky-500/10 rounded-xl"><Map className="h-6 w-6 text-sky-500" /></div>
          </div>
          
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">On-Time Delivery</p>
              <div className="flex items-end gap-2 mt-1">
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">96.4%</p>
              </div>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl"><Clock className="h-6 w-6 text-emerald-500" /></div>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between border-l-4 border-l-amber-500">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Cuarentena (QA)</p>
              <div className="flex items-end gap-2 mt-1">
                <p className="text-2xl font-black text-amber-600 dark:text-amber-400">2</p>
                <p className="text-xs font-bold text-amber-500 mb-1">Lotes</p>
              </div>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl"><PackageCheck className="h-6 w-6 text-amber-500" /></div>
          </div>

          <div className="bg-gradient-to-br from-neutral-900 to-black dark:from-rose-950 dark:to-black p-5 rounded-2xl border border-neutral-800 dark:border-rose-500/30 flex items-center justify-between text-white border-l-4 border-l-rose-500">
            <div>
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Siniestros Activos</p>
              <div className="flex items-end gap-2 mt-1">
                <p className="text-2xl font-black text-white">1</p>
                <p className="text-xs font-bold text-rose-400 mb-1">En revisión</p>
              </div>
            </div>
            <div className="p-3 bg-neutral-800 dark:bg-rose-500/20 rounded-xl"><AlertOctagon className="h-6 w-6 text-rose-400 animate-pulse" /></div>
          </div>
        </div>

        {/* CONTENEDOR DE PESTAÑAS */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm min-h-[500px] overflow-hidden">
          
          <div className="flex overflow-x-auto border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-black/50 p-2 gap-2">
            {[
              { id: 'torre', label: 'Torre de Control (Live)', icon: Crosshair },
              { id: 'rutas', label: 'Planeación y Carta Porte', icon: Route },
              { id: 'recepcion', label: 'Recepción y Cross-docking', icon: ArrowRightLeft },
              { id: 'incidencias', label: 'Gestión de Incidencias', icon: AlertOctagon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20' 
                    : 'bg-white dark:bg-neutral-900 text-neutral-500 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                }`}
              >
                <tab.icon className="h-4 w-4" /> {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            
            {/* 1. TORRE DE CONTROL (MAPA Y TRACKING) */}
            {activeTab === 'torre' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
                
                {/* Visualización de Mapa Simulado */}
                <div className="lg:col-span-2 bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl min-h-[400px] relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 opacity-20 dark:opacity-40" style={{ backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                  <div className="absolute top-1/3 left-1/4">
                    <span className="relative flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-sky-500 border-2 border-white dark:border-black"></span>
                    </span>
                  </div>
                  <div className="absolute top-1/2 right-1/3">
                    <span className="relative flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 border-2 border-white dark:border-black shadow-[0_0_15px_rgba(244,63,94,0.5)]"></span>
                    </span>
                  </div>
                  <div className="z-10 bg-white/90 dark:bg-black/90 backdrop-blur-sm p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 text-center">
                    <Map className="h-8 w-8 text-sky-500 mx-auto mb-2" />
                    <p className="font-bold text-neutral-900 dark:text-white">API de Telemetría GPS</p>
                    <p className="text-xs text-neutral-500">Módulo de Integración de Mapas</p>
                  </div>
                </div>

                {/* Panel lateral de la Torre */}
                <div className="space-y-4">
                  <div className="bg-sky-50 dark:bg-sky-900/10 border border-sky-200 dark:border-sky-800/30 p-4 rounded-2xl">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-bold text-sky-900 dark:text-sky-100 flex items-center gap-2"><Zap className="h-4 w-4"/> Eventos Geofence</h3>
                      <span className="relative flex h-2 w-2"><span className="animate-ping absolute h-full w-full rounded-full bg-sky-400 opacity-75"></span><span className="relative rounded-full h-2 w-2 bg-sky-500"></span></span>
                    </div>
                    <div className="bg-white dark:bg-black p-3 rounded-xl shadow-sm text-xs font-mono text-neutral-600 dark:text-neutral-400">
                      <p><span className="text-emerald-500 font-bold">[14:32]</span> Unidad 04 entró a Zona Cliente "Liverpool Polanco". Webhook enviado.</p>
                      <hr className="my-2 border-neutral-100 dark:border-neutral-800"/>
                      <p><span className="text-emerald-500 font-bold">[14:15]</span> Unidad 12 e-POD recibido. Firma digital capturada.</p>
                    </div>
                  </div>

                  <div className="border border-neutral-200 dark:border-neutral-800 p-4 rounded-2xl bg-neutral-50 dark:bg-black">
                    <h3 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2 mb-3"><Clock className="h-4 w-4 text-neutral-500"/> Re-cálculo Automático de ETA</h3>
                    <div className="bg-white dark:bg-neutral-900 border border-rose-100 dark:border-rose-900/50 p-3 rounded-xl shadow-sm">
                      <p className="text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1"><AlertTriangle className="h-4 w-4"/> Retraso Detectado (Ruta 8)</p>
                      <p className="text-[10px] text-neutral-500 mt-1 mb-2">Tráfico anómalo en Circuito Interior. ETA ajustado +45 min.</p>
                      <button className="w-full bg-neutral-950 dark:bg-white text-white dark:text-black text-[10px] font-bold py-1.5 rounded-lg">Notificar a 5 clientes afectados</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. PLANEACIÓN Y CARTA PORTE */}
            {activeTab === 'rutas' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 p-4 rounded-2xl">
                  <div>
                    <h3 className="font-bold text-neutral-900 dark:text-white">Ruta R-Norte-001</h3>
                    <p className="text-xs text-neutral-500 mt-1">12 Paradas • 145 km • Capacidad: 85% Volumen / 60% Peso</p>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <button 
                      onClick={handleOptimize}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400 font-bold px-4 py-2 rounded-xl text-xs hover:bg-sky-200 dark:hover:bg-sky-500/20 transition-colors border border-sky-200 dark:border-sky-500/20"
                    >
                      <Zap className={`h-4 w-4 ${isOptimizing ? 'animate-pulse' : ''}`} /> {isOptimizing ? 'Procesando IA...' : 'Optimizar Ruta'}
                    </button>
                    <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-colors">
                      <FileDigit className="h-4 w-4" /> Timbrar Carta Porte
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Configuración de Transporte */}
                  <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5">
                    <h4 className="font-black text-neutral-900 dark:text-white mb-4 text-sm flex items-center gap-2">
                      <Truck className="h-4 w-4 text-neutral-500" /> Catálogo de Figuras de Transporte
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Operador (Chofer)</label>
                        <select className="w-full p-2.5 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm font-bold text-neutral-900 dark:text-white outline-none">
                          <option>Juan Pérez (Lic. Vigente) - Disponible</option>
                          <option disabled>Carlos Ruiz - En Ruta R-002</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Vehículo Asignado</label>
                        <select className="w-full p-2.5 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm font-bold text-neutral-900 dark:text-white outline-none">
                          <option>Camioneta 3.5T (Placas: XX-1234) - Seg. Vigente</option>
                        </select>
                      </div>
                      <div className="bg-sky-50 dark:bg-sky-500/10 p-3 rounded-xl border border-sky-200 dark:border-sky-500/20 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-sky-900 dark:text-sky-100">Póliza de Seguro de Carga</p>
                          <p className="text-[10px] text-sky-700 dark:text-sky-400">Cobertura vinculada al valor de la factura ($150,000 MXN)</p>
                        </div>
                        <ShieldCheck className="h-5 w-5 text-sky-500" />
                      </div>
                    </div>
                  </div>

                  {/* Paradas */}
                  <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 overflow-y-auto max-h-[300px]">
                    <h4 className="font-black text-neutral-900 dark:text-white mb-4 text-sm flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-neutral-500" /> Secuencia de Entrega
                    </h4>
                    <div className="relative border-l-2 border-neutral-200 dark:border-neutral-800 ml-3 space-y-6">
                      {[1, 2, 3].map((stop) => (
                        <div key={stop} className="relative pl-6">
                          <span className="absolute -left-[9px] top-1 bg-white dark:bg-black border-2 border-sky-500 h-4 w-4 rounded-full"></span>
                          <p className="text-sm font-bold text-neutral-900 dark:text-white">Cliente {stop} S.A. de C.V.</p>
                          <p className="text-[10px] text-neutral-500 font-mono mt-0.5">Ventana: 10:00 AM - 12:00 PM • Factura: F-{1040 + stop}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. RECEPCIÓN Y CROSS-DOCKING */}
            {activeTab === 'recepcion' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Escáner Inbound */}
                  <div className="border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 bg-neutral-50 dark:bg-black text-center flex flex-col items-center justify-center min-h-[300px]">
                    <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl shadow-sm border border-neutral-200 dark:border-neutral-800 mb-6">
                      <QrCode className="h-16 w-16 text-neutral-400" />
                    </div>
                    <h3 className="text-lg font-black text-neutral-900 dark:text-white">Escaneo de Recepción</h3>
                    <p className="text-xs text-neutral-500 mt-2 mb-6 max-w-sm">
                      Vincula automáticamente la entrada física con la Orden de Compra y el XML del proveedor en el módulo SCM.
                    </p>
                    <button className="bg-neutral-950 dark:bg-white text-white dark:text-black font-bold px-6 py-3 rounded-xl text-sm shadow-lg w-full max-w-xs transition-transform hover:scale-[1.02]">
                      Activar Cámara / Lector
                    </button>
                  </div>

                  {/* Acciones de Recepción */}
                  <div className="space-y-4">
                    {/* Cross-docking Alert */}
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-4 rounded-2xl flex items-start gap-3">
                      <ArrowRightLeft className="h-5 w-5 text-emerald-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">Oportunidad de Cross-docking</p>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">La Orden PO-1045 que acaba de llegar tiene 50 unidades comprometidas para el Pedido V-889. Enviar directo a Andén 4 (Salidas) sin pasar por rack.</p>
                      </div>
                    </div>

                    {/* Calidad y Discrepancias */}
                    <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 bg-white dark:bg-neutral-900">
                      <h4 className="font-black text-neutral-900 dark:text-white mb-4 text-sm flex items-center gap-2">
                        <PackageCheck className="h-4 w-4 text-neutral-500" /> Control de Calidad (Inbound)
                      </h4>
                      <div className="flex items-center justify-between p-3 border border-neutral-100 dark:border-neutral-800 rounded-xl mb-3">
                        <div>
                          <p className="text-sm font-bold text-neutral-900 dark:text-white">Lote L-9982 (Resinas)</p>
                          <p className="text-[10px] text-neutral-500">Estado: Inspección Pendiente</p>
                        </div>
                        <button className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-500/30">Enviar a Cuarentena</button>
                      </div>
                      <button className="w-full mt-2 flex items-center justify-center gap-2 bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 font-bold px-4 py-3 rounded-xl text-xs border border-rose-200 dark:border-rose-500/20 transition-colors hover:bg-rose-100 dark:hover:bg-rose-500/30">
                        <AlertTriangle className="h-4 w-4" /> Recepción con Discrepancia (Generar Nota Débito)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. GESTIÓN DE INCIDENCIAS Y MITIGACIÓN */}
            {activeTab === 'incidencias' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 p-4 rounded-2xl">
                  <div>
                    <h3 className="font-bold text-rose-900 dark:text-rose-100">Protocolo de Emergencia</h3>
                    <p className="text-xs text-rose-700 dark:text-rose-400 mt-1">Gestión de siniestros, desvíos y vinculación con Seguros/Legal.</p>
                  </div>
                  <button className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-6 py-2 rounded-xl text-sm transition-colors shadow-lg shadow-rose-500/20 flex items-center gap-2">
                    <AlertOctagon className="h-4 w-4" /> Declarar Siniestro
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Ficha de Incidente */}
                  <div className="lg:col-span-2 border border-rose-200 dark:border-rose-800/50 rounded-2xl p-6 bg-white dark:bg-black shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 px-2 py-1 rounded text-[10px] font-black uppercase mb-2 inline-block">Avería Mecánica Mayor</span>
                        <h4 className="font-black text-neutral-900 dark:text-white text-lg">Unidad 14 detenida en Autopista 57D</h4>
                        <p className="text-xs text-neutral-500 mt-1">Reportado hace 15 min. por Operador (App e-POD).</p>
                      </div>
                      <span className="font-mono text-xs font-bold text-neutral-400">INC-2026-089</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-neutral-50 dark:bg-neutral-900 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800">
                        <p className="text-[10px] font-bold text-neutral-500 uppercase">Impacto Financiero Prev.</p>
                        <p className="font-black text-neutral-900 dark:text-white">$12,500 MXN <span className="text-[10px] font-normal text-neutral-500">(Grúa + Retraso)</span></p>
                      </div>
                      <div className="bg-neutral-50 dark:bg-neutral-900 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800">
                        <p className="text-[10px] font-bold text-neutral-500 uppercase">Estado de la Carga</p>
                        <p className="font-black text-neutral-900 dark:text-white">Íntegra <span className="text-[10px] font-normal text-neutral-500">(12/12 Entregas Pendientes)</span></p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className="flex-1 bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400 font-bold py-2 rounded-xl text-xs border border-sky-200 dark:border-sky-500/20">Re-asignar Carga a Unidad Cercana</button>
                      <button className="flex-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold py-2 rounded-xl text-xs border border-neutral-200 dark:border-neutral-700 flex items-center justify-center gap-1"><FileText className="h-3 w-3"/> Generar Reclamo Seguro</button>
                    </div>
                  </div>

                  {/* Acciones de Flota */}
                  <div className="space-y-4">
                    <button className="w-full flex items-center justify-between bg-neutral-50 dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors group">
                      <div className="text-left">
                        <p className="font-bold text-neutral-900 dark:text-white text-sm group-hover:text-sky-500 transition-colors">Desvío Autorizado</p>
                        <p className="text-[10px] text-neutral-500 mt-0.5">Autorizar cambio de ruta sin detonar alarma anti-robo.</p>
                      </div>
                      <Route className="h-5 w-5 text-neutral-400 group-hover:text-sky-500 transition-colors" />
                    </button>
                    <button className="w-full flex items-center justify-between bg-neutral-50 dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors group">
                      <div className="text-left">
                        <p className="font-bold text-neutral-900 dark:text-white text-sm group-hover:text-emerald-500 transition-colors">VoBo de Reparación</p>
                        <p className="text-[10px] text-neutral-500 mt-0.5">Rehabilitar unidad post-taller en catálogo de activos.</p>
                      </div>
                      <Wrench className="h-5 w-5 text-neutral-400 group-hover:text-emerald-500 transition-colors" />
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}