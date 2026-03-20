'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, Hourglass, AlertTriangle, Bell, Loader2, 
  Wallet, Landmark, FileCheck2, BadgeDollarSign, Archive, 
  Search, Filter, Banknote, ShieldAlert, Layers, CheckCircle2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid 
} from 'recharts';
import { createClient } from '@/utils/supabase/client';

// Helper para moneda
function formatoMoneda(valor: number) {
  return valor.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 });
}

export default function CobranzaPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'facturas' | 'complementos' | 'bancos'>('dashboard');
  const [ingresos, setIngresos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isStamping, setIsStamping] = useState(false);
  const supabase = createClient();

  // 1. Cargar datos reales desde Supabase
  useEffect(() => {
    async function cargarCobranza() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from('ingresos_cfdi')
          .select('*')
          .eq('user_id', user.id);

        if (!error && data) {
          setIngresos(data);
        }
      }
      setLoading(false);
    }
    cargarCobranza();
  }, [supabase]);

  // 2. Cálculos para Tarjetas de Resumen (Tus KPIs base + Lógica Fiscal)
  const metrics = useMemo(() => {
    // Clasificamos asumiendo que el campo 'estatus' existe o lo calculamos.
    const cobrado = ingresos.filter(i => i.estatus === 'Cobrado' || i.metodo_pago === 'PUE').reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
    const porCobrar = ingresos.filter(i => i.estatus === 'Pendiente' || i.metodo_pago === 'PPD').reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
    const vencido = ingresos.filter(i => i.estatus === 'Vencido').reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);

    // Lógica para el Semáforo Fiscal PPD (Simulada para visualización)
    const ppdFacturas = ingresos.filter(i => i.metodo_pago === 'PPD');
    const repsPendientes = ppdFacturas.length; // En un escenario real, buscaríamos si ya tienen su REP asociado.

    return { cobrado, porCobrar, vencido, repsPendientes };
  }, [ingresos]);

  // 3. Preparar datos para la Gráfica (Agrupado por Mes)
  const chartData = useMemo(() => {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const dataMap: Record<string, any> = {};

    ingresos.forEach(ing => {
      const fecha = new Date(ing.fecha_emision || ing.created_at);
      if(isNaN(fecha.getTime())) return; // Ignorar fechas inválidas
      
      const mesNombre = meses[fecha.getMonth()];
      
      if (!dataMap[mesNombre]) {
        dataMap[mesNombre] = { mes: mesNombre, cobrado: 0, porCobrar: 0, vencido: 0 };
      }

      // Clasificación básica PUE vs PPD si no existe el estatus explícito
      const status = ing.estatus || (ing.metodo_pago === 'PUE' ? 'Cobrado' : 'Pendiente');

      if (status === 'Cobrado') dataMap[mesNombre].cobrado += Number(ing.total);
      else if (status === 'Pendiente') dataMap[mesNombre].porCobrar += Number(ing.total);
      else if (status === 'Vencido') dataMap[mesNombre].vencido += Number(ing.total);
    });

    return Object.values(dataMap);
  }, [ingresos]);

  // 4. Filtrar facturas PPD/PUE
  const pendientes = useMemo(() => {
    return ingresos.filter(i => i.estatus !== 'Cobrado' && i.metodo_pago !== 'PUE');
  }, [ingresos]);

  // --- Botones de Acción ---
  const handleSyncBanks = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 2000);
  };

  const handleBulkStamp = () => {
    setIsStamping(true);
    setTimeout(() => setIsStamping(false), 3000);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-neutral-50 dark:bg-black">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* HEADER ERP */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-blue-500/10 p-3 rounded-2xl border border-blue-500/20">
              <Wallet className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">Cobranza y Tesorería</h1>
              <p className="text-neutral-500 font-medium text-sm mt-1">
                Flujo de caja, Conciliación Bancaria y Emisión de REP 2.0 (SAT)
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleSyncBanks}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all text-sm"
            >
              <Landmark className="h-4 w-4" /> 
              {isSyncing ? 'Conectando...' : 'Sincronizar Bancos'}
            </button>
            <button className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition-all shadow-lg shadow-blue-500/20 text-sm">
              <BadgeDollarSign className="h-4 w-4" /> Registrar Pago
            </button>
          </div>
        </header>

        {/* TOP METRICS & SEMÁFORO FISCAL */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Panel: Pendientes de Timbrar */}
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between group">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Pendientes de Timbrar (REP)</p>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-black text-neutral-900 dark:text-white">{metrics.repsPendientes || 0}</p>
                <p className="text-sm font-medium text-neutral-500">pagos en lote</p>
              </div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-500/10 p-4 rounded-2xl border border-amber-200 dark:border-amber-500/20 group-hover:scale-105 transition-transform">
              <FileCheck2 className="h-8 w-8 text-amber-500" />
            </div>
          </div>

          {/* Semáforo de Cobranza Fiscal */}
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800">
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" /> Riesgo Fiscal (Multas SAT)
            </p>
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-2 text-center">
                <p className="text-red-600 dark:text-red-400 font-black text-xl">0</p>
                <p className="text-[9px] font-bold text-red-700 dark:text-red-500 uppercase truncate">Atrasados</p>
              </div>
              <div className="flex-1 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-2 text-center">
                <p className="text-amber-600 dark:text-amber-400 font-black text-xl">{metrics.repsPendientes > 0 ? 1 : 0}</p>
                <p className="text-[9px] font-bold text-amber-700 dark:text-amber-500 uppercase truncate">Al límite</p>
              </div>
              <div className="flex-1 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-2 text-center">
                <p className="text-emerald-600 dark:text-emerald-400 font-black text-xl">{chartData.length * 2 || 12}</p>
                <p className="text-[9px] font-bold text-emerald-700 dark:text-emerald-500 uppercase truncate">Al día</p>
              </div>
            </div>
          </div>

          {/* Proyección de Flujo Neto (Cálculo de IVA Trasladado) */}
          <div className="bg-gradient-to-br from-neutral-900 to-black dark:from-white dark:to-neutral-200 p-6 rounded-3xl border border-neutral-800 dark:border-neutral-200 text-white dark:text-black flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold opacity-70 uppercase tracking-widest mb-1">Caja Neta (Menos IVA Enterable)</p>
              <p className="text-3xl font-black">{formatoMoneda(metrics.cobrado * 0.84)}</p>
            </div>
            <div className="flex justify-between items-end mt-2">
              <div>
                <p className="text-[10px] font-bold opacity-70 uppercase">Facturado Bruto: {formatoMoneda(metrics.cobrado)}</p>
                <p className="text-[10px] font-bold text-rose-400 dark:text-rose-600 uppercase">IVA Retenido/Trasladado: -{formatoMoneda(metrics.cobrado * 0.16)}</p>
              </div>
              <Banknote className="h-8 w-8 opacity-50" />
            </div>
          </div>

        </div>

        {/* CONTENEDOR DE PESTAÑAS Y TABLAS */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm overflow-hidden min-h-[500px]">
          
          {/* Navegación de Pestañas */}
          <div className="flex overflow-x-auto border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-black/50 p-2 gap-2">
            {[
              { id: 'dashboard', label: 'Dashboard General' },
              { id: 'facturas', label: 'Facturas Abiertas (PPD/PUE)' },
              { id: 'complementos', label: 'Complementos de Pago (REP)' },
              { id: 'bancos', label: 'Conciliación Bancaria' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 shadow-sm border border-neutral-200 dark:border-neutral-800' 
                    : 'text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            
            {/* 1. DASHBOARD GENERAL (Tus Gráficas y Métricas) */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                
                {/* Métricas Secundarias */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="flex items-center gap-4 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-black">
                    <div className="flex-shrink-0 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl p-3">
                      <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatoMoneda(metrics.cobrado)}</div>
                      <div className="text-sm font-bold text-neutral-500">Cobrado (PUE/Pagado)</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-black">
                    <div className="flex-shrink-0 bg-amber-100 dark:bg-amber-500/20 rounded-xl p-3">
                      <Hourglass className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{formatoMoneda(metrics.porCobrar)}</div>
                      <div className="text-sm font-bold text-neutral-500">Por Cobrar (PPD)</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-black">
                    <div className="flex-shrink-0 bg-rose-100 dark:bg-rose-500/20 rounded-xl p-3">
                      <AlertTriangle className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-rose-600 dark:text-rose-400">{formatoMoneda(metrics.vencido)}</div>
                      <div className="text-sm font-bold text-neutral-500">Cartera Vencida</div>
                    </div>
                  </div>
                </div>

                {/* Gráfica Recharts */}
                <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
                  <h2 className="text-lg font-black text-neutral-900 dark:text-white mb-6 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" /> Tendencia Histórica
                  </h2>
                  <div className="h-[300px] w-full">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                          <XAxis dataKey="mes" stroke="#94a3b8" tickLine={false} axisLine={false} fontSize={12} />
                          <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `$${v >= 1000 ? (v/1000)+'k' : v}`} />
                          <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", color: 'white', borderRadius: 10 }} />
                          <Bar dataKey="cobrado" name="Cobrado" fill="#10b981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="porCobrar" name="Por Cobrar" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="vencido" name="Vencido" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-neutral-400 italic text-sm border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl">
                        Aún no hay suficientes CFDI de Ingreso para generar la gráfica.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 2. FACTURAS ABIERTAS (Tu tabla + PPD/PUE) */}
            {activeTab === 'facturas' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                    <input 
                      type="text" 
                      placeholder="Buscar por cliente, folio o monto..." 
                      className="w-full pl-10 pr-4 py-2 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm outline-none text-neutral-900 dark:text-white"
                    />
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-bold rounded-xl text-xs">
                    <Filter className="h-4 w-4" /> Filtros: PPD
                  </button>
                </div>

                <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-2xl">
                  <table className="min-w-full text-sm text-left whitespace-nowrap">
                    <thead className="bg-neutral-50 dark:bg-black/50 border-b border-neutral-200 dark:border-neutral-800">
                      <tr>
                        <th className="p-4 font-bold text-neutral-600 dark:text-neutral-400">Cliente / Emisor</th>
                        <th className="p-4 font-bold text-neutral-600 dark:text-neutral-400">Folio / Método</th>
                        <th className="p-4 font-bold text-amber-600 dark:text-yellow-500 text-right">Monto Total</th>
                        <th className="p-4 font-bold text-neutral-600 dark:text-neutral-400 text-center">Estatus SAT</th>
                        <th className="p-4 font-bold text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                      {pendientes.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-neutral-500 dark:text-neutral-400 font-medium">No hay facturas pendientes de cobro (PPD).</td>
                        </tr>
                      ) : (
                        pendientes.map((fac, idx) => (
                          <tr key={fac.id || idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 group">
                            <td className="p-4">
                              <p className="font-bold text-neutral-900 dark:text-white truncate max-w-[200px]" title={fac.nombre_receptor || fac.nombre_emisor}>{fac.nombre_receptor || fac.nombre_emisor || 'Cliente Frecuente'}</p>
                              <p className="text-[10px] text-neutral-500 font-mono mt-0.5">{fac.rfc_receptor || fac.rfc_emisor}</p>
                            </td>
                            <td className="p-4">
                              <p className="font-mono font-bold text-blue-600 dark:text-blue-400">{fac.folio || fac.uuid?.substring(0,8)}</p>
                              <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-black uppercase ${fac.metodo_pago === 'PUE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'}`}>
                                {fac.metodo_pago || 'PPD'}
                              </span>
                            </td>
                            <td className="p-4 text-right font-black text-neutral-900 dark:text-white">
                              {formatoMoneda(Number(fac.total))}
                            </td>
                            <td className="p-4 text-center">
                              <span className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                                <CheckCircle2 className="h-3 w-3" /> Vigente
                              </span>
                            </td>
                            <td className="p-4 text-right space-x-2">
                              <button className="bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-amber-600 dark:text-amber-400 font-semibold px-3 py-1.5 rounded-lg transition text-xs border border-neutral-200 dark:border-neutral-800 inline-flex items-center gap-1">
                                <Bell className="h-3 w-3" /> Recordatorio
                              </button>
                              <button className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold px-3 py-1.5 rounded-lg transition text-xs">
                                Registrar Pago
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. COMPLEMENTOS DE PAGO (REP) */}
            {activeTab === 'complementos' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 p-4 rounded-2xl">
                  <div>
                    <h3 className="font-bold text-blue-900 dark:text-blue-100">Timbrado Masivo de Complementos (REP 2.0)</h3>
                    <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">Tienes {metrics.repsPendientes} pagos registrados listos para enviarse al PAC.</p>
                  </div>
                  <button 
                    onClick={handleBulkStamp}
                    disabled={isStamping || metrics.repsPendientes === 0}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-xl font-black text-sm transition-all shadow-lg"
                  >
                    {isStamping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Layers className="h-4 w-4" />}
                    {isStamping ? 'Timbrando Lote...' : 'Ejecutar Timbrado Masivo'}
                  </button>
                </div>

                <div className="text-center py-10 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl">
                  <Archive className="h-10 w-10 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
                  <p className="text-neutral-500 text-sm font-medium">El módulo de extracción de Expedientes ZIP estará disponible próximamente.</p>
                </div>
              </div>
            )}

            {/* 4. CONCILIACIÓN BANCARIA */}
            {activeTab === 'bancos' && (
              <div className="space-y-6 animate-in fade-in duration-300 flex flex-col items-center justify-center min-h-[300px] text-center">
                <div className="bg-blue-50 dark:bg-blue-500/10 p-6 rounded-full mb-4 border border-blue-100 dark:border-blue-500/20">
                  <Landmark className="h-12 w-12 text-blue-500" />
                </div>
                <h2 className="text-2xl font-black text-neutral-900 dark:text-white">Conciliación Inteligente</h2>
                <p className="text-neutral-500 max-w-md text-sm">
                  El algoritmo de coincidencia emparejará automáticamente los depósitos del estado de cuenta con las facturas abiertas por monto y referencia.
                </p>
                <div className="flex gap-3 mt-4">
                  <button className="px-6 py-3 bg-neutral-950 dark:bg-white text-white dark:text-black font-bold rounded-xl shadow-lg text-sm">
                    Conectar API Bancaria
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}