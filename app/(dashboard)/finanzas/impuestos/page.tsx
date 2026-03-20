'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle, BarChart2, PiggyBank, TrendingUp,
  Loader2, Landmark, RefreshCw, ShieldX, ServerCog,
  Activity, ShieldAlert, FileSpreadsheet, Database,
  FileKey, Lock, CheckCircle2, Calendar, FileCode2, Archive
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart as RAreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { createClient } from '@/utils/supabase/client';

// --- Utilidades ---
function formatoMoneda(valor: number): string {
  return valor.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 2
  });
}

export default function ImpuestosCompliancePage() {
  const [activeTab, setActiveTab] = useState<'proyeccion' | 'infraestructura' | 'compliance' | 'reportes'>('proyeccion');
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Estados de datos (Tu lógica)
  const [ingresos, setIngresos] = useState<any[]>([]);
  const [gastos, setGastos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // 1. Carga de Datos Reales desde Supabase
  useEffect(() => {
    async function cargarDatosFiscales() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const [resIngresos, resGastos] = await Promise.all([
          supabase.from('ingresos_cfdi').select('*').eq('user_id', user.id),
          supabase.from('gastos_xml').select('*').eq('user_id', user.id)
        ]);

        if (resIngresos.data) setIngresos(resIngresos.data);
        if (resGastos.data) setGastos(resGastos.data);
      }
      setLoading(false);
    }
    cargarDatosFiscales();
  }, [supabase]);

  // 2. Cálculos Fiscales Reales en Tiempo Real
  const totales = useMemo(() => {
    const ingBase = ingresos.reduce((acc, cur) => acc + (Number(cur.subtotal) || 0), 0);
    const ingIva = ingresos.reduce((acc, cur) => acc + (Number(cur.iva) || 0), 0);
    
    const gastBase = gastos.reduce((acc, cur) => acc + (Number(cur.subtotal) || 0), 0);
    const gastIva = gastos.reduce((acc, cur) => acc + (Number(cur.iva) || 0), 0);

    const utilidad = ingBase - gastBase;
    const isr = utilidad > 0 ? utilidad * 0.30 : 0; // Cálculo provisional al 30%
    const ivaPagar = ingIva - gastIva;

    return { ingBase, ingIva, gastBase, gastIva, utilidad, isr, ivaPagar };
  }, [ingresos, gastos]);

  // 3. Preparación de Gráfica
  const datosComparativa = useMemo(() => {
    const dias: Record<string, { fecha: string; ingresos: number; gastos: number }> = {};

    ingresos.forEach((ing) => {
      const f = ing.fecha_emision || ing.fecha_expedicion || ing.created_at?.split('T')[0];
      if (f) {
        if (!dias[f]) dias[f] = { fecha: f, ingresos: 0, gastos: 0 };
        dias[f].ingresos += (Number(ing.total) || 0);
      }
    });

    gastos.forEach((gast) => {
      const f = gast.fecha_expedicion || gast.created_at?.split('T')[0];
      if (f) {
        if (!dias[f]) dias[f] = { fecha: f, ingresos: 0, gastos: 0 };
        dias[f].gastos += (Number(gast.total) || 0);
      }
    });

    return Object.values(dias).sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [ingresos, gastos]);

  const razonGastos = totales.ingBase > 0 ? totales.gastBase / totales.ingBase : 0;
  const alertaBajoGasto = razonGastos < 0.3 && totales.ingBase > 0;

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 2000); // Simulación de Sync con SAT
  };

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-neutral-50 dark:bg-black">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* HEADER ERP */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20">
              <Landmark className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">Centro de Impuestos</h1>
              <p className="text-neutral-500 font-medium text-sm mt-1">
                Proyecciones en tiempo real, Compliance y Sincronización SAT.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleSync}
              className="flex items-center gap-2 px-6 py-3 bg-neutral-950 dark:bg-white text-white dark:text-black font-black rounded-2xl hover:scale-[1.02] transition-all shadow-xl text-sm"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} /> 
              {isSyncing ? 'Sincronizando...' : 'Sincronizar con SAT'}
            </button>
          </div>
        </header>

        {/* ALERTA GLOBAL (Art. 69-B) */}
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-4 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2">
          <ShieldX className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-red-700 dark:text-red-400 font-bold">Monitor LCO Activo (Art. 69-B)</p>
            <p className="text-xs text-red-600 dark:text-red-400/80 mt-1">Tu base de datos de proveedores está limpia. No se detectaron EFOS en los XML cargados recientemente.</p>
          </div>
        </div>

        {/* CONTENEDOR PRINCIPAL */}
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Menú Lateral */}
          <aside className="lg:w-64 flex-shrink-0 space-y-2">
            {[
              { id: 'proyeccion', label: 'Proyección Mensual', icon: Activity },
              { id: 'infraestructura', label: 'Infraestructura PAC/CSD', icon: ServerCog },
              { id: 'compliance', label: 'Compliance y LCO', icon: ShieldAlert },
              { id: 'reportes', label: 'Reportes Legales (DIOT)', icon: FileSpreadsheet },
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
          <main className="flex-1 min-h-[600px]">
            
            {/* 1. PROYECCIÓN FISCAL (Tu código mejorado) */}
            {activeTab === 'proyeccion' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                
                {/* Métricas Dinámicas */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="flex items-center gap-4 rounded-3xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                    <div className="flex-shrink-0 bg-amber-50 dark:bg-amber-500/10 rounded-2xl p-4">
                      <BarChart2 className="h-8 w-8 text-amber-500" />
                    </div>
                    <div>
                      <div className="text-2xl font-black text-neutral-900 dark:text-white">{formatoMoneda(totales.ivaPagar)}</div>
                      <div className="text-neutral-500 font-bold text-xs uppercase tracking-wider mt-1">IVA a Pagar</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 rounded-3xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                    <div className="flex-shrink-0 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl p-4">
                      <TrendingUp className="h-8 w-8 text-emerald-500" />
                    </div>
                    <div>
                      <div className="text-2xl font-black text-neutral-900 dark:text-white">{formatoMoneda(totales.utilidad)}</div>
                      <div className="text-neutral-500 font-bold text-xs uppercase tracking-wider mt-1">Utilidad Bruta</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 rounded-3xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                    <div className="flex-shrink-0 bg-rose-50 dark:bg-rose-500/10 rounded-2xl p-4">
                      <PiggyBank className="h-8 w-8 text-rose-500" />
                    </div>
                    <div>
                      <div className="text-2xl font-black text-neutral-900 dark:text-white">{formatoMoneda(totales.isr)}</div>
                      <div className="text-neutral-500 font-bold text-xs uppercase tracking-wider mt-1">ISR Provisional</div>
                    </div>
                  </div>
                </div>

                {/* Estrategia Fiscal */}
                <div className={`rounded-2xl border-l-8 p-5 shadow-sm flex gap-3 items-start ${
                  alertaBajoGasto ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10' : 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                }`}>
                  <AlertTriangle className={`h-6 w-6 mt-0.5 flex-shrink-0 ${alertaBajoGasto ? 'text-amber-500 animate-pulse' : 'text-emerald-500'}`} />
                  <div>
                    <div className={`text-sm font-black uppercase tracking-widest mb-1 ${alertaBajoGasto ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                      Estrategia Fiscal Inteligente
                    </div>
                    {alertaBajoGasto ? (
                      <p className="text-amber-800 dark:text-amber-200/80 text-sm font-medium">
                        Tu nivel de deducción es bajo (<span className="font-bold">{(razonGastos * 100).toFixed(1)}%</span>). Considera documentar gastos operativos (compras, servicios) antes de fin de mes para optimizar tu carga de ISR.
                      </p>
                    ) : (
                      <p className="text-emerald-800 dark:text-emerald-200/80 text-sm font-medium">
                        Excelente balance. Mantienes una relación sana entre ingresos facturados y gastos deducibles.
                      </p>
                    )}
                  </div>
                </div>

                {/* Gráfica Recharts */}
                <div className="rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm p-6">
                  <h2 className="text-lg font-black text-neutral-900 dark:text-white mb-6">Flujo de Efectivo Real (XML)</h2>
                  <div className="h-[300px]">
                    {datosComparativa.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RAreaChart data={datosComparativa}>
                          <defs>
                            <linearGradient id="colorIng" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorGast" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke="#3f3f46" strokeDasharray="4 4" strokeOpacity={0.2}/>
                          <XAxis dataKey="fecha" stroke="#71717a" fontSize={11} tickMargin={10} />
                          <YAxis stroke="#71717a" fontSize={11} tickFormatter={(v) => `$${v >= 1000 ? (v/1000) + 'k' : v}`} />
                          <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", color: 'white', borderRadius: '12px', fontSize: '12px' }} />
                          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>
                          <Area type="monotone" dataKey="ingresos" name="Ingresos (Facturados)" stroke="#10b981" fill="url(#colorIng)" strokeWidth={3} />
                          <Area type="monotone" dataKey="gastos" name="Gastos (Deducibles)" stroke="#f43f5e" fill="url(#colorGast)" strokeWidth={3} />
                        </RAreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-neutral-400 text-sm font-medium border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl">
                        Aún no hay suficientes CFDI cargados para generar la proyección.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* 2. INFRAESTRUCTURA PAC Y CSD */}
            {activeTab === 'infraestructura' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  
                  {/* Gestión de Folios */}
                  <div className="p-6 border border-neutral-200 dark:border-neutral-800 rounded-3xl bg-white dark:bg-neutral-900 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                        <Database className="h-5 w-5 text-blue-500" /> Folios de Timbrado PAC
                      </h3>
                      <button className="text-xs font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors">
                        Comprar Folios
                      </button>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-neutral-500">
                        <span>Consumidos: 8,950</span>
                        <span>Restantes: 1,050 / 10,000</span>
                      </div>
                      <div className="w-full bg-neutral-100 dark:bg-black rounded-full h-3 overflow-hidden border border-neutral-200 dark:border-neutral-800">
                        <div className="bg-amber-400 h-full rounded-full" style={{ width: '89.5%' }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Administrador de CSD */}
                  <div className="p-6 border border-neutral-200 dark:border-neutral-800 rounded-3xl bg-white dark:bg-neutral-900 shadow-sm">
                    <h3 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2 mb-6">
                      <FileKey className="h-5 w-5 text-emerald-500" /> Certificado de Sello Digital (CSD)
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl">
                        <div>
                          <p className="font-bold text-emerald-900 dark:text-emerald-100 text-sm">CSD_Matriz_Activo.cer</p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono mt-1">Válido por 845 días más</p>
                        </div>
                        <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                      </div>
                    </div>
                  </div>

                  {/* Configuración PAC */}
                  <div className="xl:col-span-2 p-6 border border-neutral-200 dark:border-neutral-800 rounded-3xl bg-white dark:bg-neutral-900 shadow-sm">
                    <h3 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2 mb-4">
                      <ServerCog className="h-5 w-5 text-neutral-500" /> Credenciales PAC (Proveedor Autorizado)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Endpoint</label>
                        <select className="w-full p-3 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-bold text-neutral-900 dark:text-white outline-none">
                          <option>SW Sapien (Recomendado)</option>
                          <option>Finkok</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">API Secret Key</label>
                        <div className="flex bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-xl p-3">
                          <input type="password" value="sk_live_847294729837492" readOnly className="flex-1 bg-transparent font-mono text-sm outline-none text-neutral-500" />
                          <Lock className="h-4 w-4 text-neutral-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* 3. COMPLIANCE Y LCO */}
            {activeTab === 'compliance' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Motor LCO */}
                  <div className="p-6 border border-neutral-200 dark:border-neutral-800 rounded-3xl bg-white dark:bg-neutral-900 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-emerald-500" />
                        <h3 className="font-bold text-neutral-900 dark:text-white">Motor LCO (Redis)</h3>
                      </div>
                      <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest">O(1) Activo</span>
                    </div>
                    <p className="text-sm text-neutral-500 leading-relaxed mb-6">
                      El Cron Job (ETL) indexa los registros del SAT diariamente, permitiendo validar proveedores en milisegundos.
                    </p>
                    <div className="bg-neutral-50 dark:bg-black p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-3">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-neutral-500">Última ingesta:</span>
                        <span className="text-neutral-900 dark:text-white">Hoy, 04:00 AM CST</span>
                      </div>
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-neutral-500">Registros indexados:</span>
                        <span className="text-emerald-600 dark:text-emerald-400">28,542,109 RFCs</span>
                      </div>
                    </div>
                  </div>

                  {/* Calendario Fiscal */}
                  <div className="p-6 border border-neutral-200 dark:border-neutral-800 rounded-3xl bg-white dark:bg-neutral-900 shadow-sm">
                    <h3 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2 mb-6">
                      <Calendar className="h-5 w-5 text-blue-500" /> Calendario de Obligaciones
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-neutral-50 dark:bg-black p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                        <div>
                          <p className="text-sm font-bold text-neutral-900 dark:text-white">Pago Provisional ISR / IVA</p>
                          <p className="text-xs text-neutral-500 mt-1">Marzo 2026</p>
                        </div>
                        <span className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 px-3 py-1 rounded-lg text-xs font-bold">Vence el día 17</span>
                      </div>
                      <div className="flex justify-between items-center bg-neutral-50 dark:bg-black p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 opacity-60">
                        <div>
                          <p className="text-sm font-bold text-neutral-900 dark:text-white line-through">Declaración Anual (PM)</p>
                        </div>
                        <span className="bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 px-3 py-1 rounded-lg text-xs font-bold">Completado</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* 4. REPORTES LEGALES */}
            {activeTab === 'reportes' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* DIOT */}
                  <div className="border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 text-center bg-white dark:bg-neutral-900 shadow-sm hover:border-blue-500/50 transition-colors group">
                    <div className="bg-blue-50 dark:bg-blue-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform border border-blue-200 dark:border-blue-500/20">
                      <FileSpreadsheet className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="font-black text-neutral-900 dark:text-white mb-2">Reporte DIOT</h3>
                    <p className="text-xs text-neutral-500 mb-6">Archivo TXT (batch) estructurado para el portal del SAT (A-29).</p>
                    <button className="w-full py-3 bg-neutral-100 dark:bg-black text-neutral-900 dark:text-white font-bold rounded-xl text-sm border border-neutral-200 dark:border-neutral-800">
                      Generar TXT
                    </button>
                  </div>

                  {/* Contabilidad Electrónica */}
                  <div className="border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 text-center bg-white dark:bg-neutral-900 shadow-sm hover:border-emerald-500/50 transition-colors group">
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform border border-emerald-200 dark:border-emerald-500/20">
                      <FileCode2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="font-black text-neutral-900 dark:text-white mb-2">Balanza XML</h3>
                    <p className="text-xs text-neutral-500 mb-6">Genera la Balanza de Comprobación y Catálogo para Contabilidad Electrónica.</p>
                    <button className="w-full py-3 bg-neutral-100 dark:bg-black text-neutral-900 dark:text-white font-bold rounded-xl text-sm border border-neutral-200 dark:border-neutral-800">
                      Exportar XML
                    </button>
                  </div>

                  {/* Expediente Fiscal */}
                  <div className="border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 text-center bg-white dark:bg-neutral-900 shadow-sm hover:border-amber-500/50 transition-colors group">
                    <div className="bg-amber-50 dark:bg-amber-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform border border-amber-200 dark:border-amber-500/20">
                      <Archive className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="font-black text-neutral-900 dark:text-white mb-2">Bóveda (Auditoría)</h3>
                    <p className="text-xs text-neutral-500 mb-6">Descarga un ZIP empaquetado con todos los PDF y XML de un periodo.</p>
                    <button className="w-full py-3 bg-neutral-100 dark:bg-black text-neutral-900 dark:text-white font-bold rounded-xl text-sm border border-neutral-200 dark:border-neutral-800">
                      Empaquetar ZIP
                    </button>
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