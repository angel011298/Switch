'use client';

import { useState } from 'react';
import { 
  ShoppingCart, PackageCheck, AlertTriangle, BrainCircuit, 
  LineChart, ShieldAlert, FileCheck2, Calculator, 
  RefreshCw, TrendingDown, ArrowRight, CheckCircle2, 
  XCircle, Filter, Search, Download, Settings2, Box, Send
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
  LineChart as RLineChart, Line
} from 'recharts';

export default function SCMComprasPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'srm' | 'p2p' | 'pronostico'>('dashboard');
  const [nivelServicio, setNivelServicio] = useState(95);

  // Datos simulados para el motor matemático y gráficas
  const spendData = [
    { mes: 'Oct', directo: 450000, indirecto: 120000 },
    { mes: 'Nov', directo: 520000, indirecto: 110000 },
    { mes: 'Dic', directo: 680000, indirecto: 140000 },
    { mes: 'Ene', directo: 390000, indirecto: 90000 },
    { mes: 'Feb', directo: 410000, indirecto: 95000 },
    { mes: 'Mar', directo: 480000, indirecto: 105000 },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* HEADER ERP */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-orange-500/10 p-3 rounded-2xl border border-orange-500/20">
              <ShoppingCart className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">SCM | Compras y Abastecimiento</h1>
              <p className="text-neutral-500 font-medium text-sm mt-1">
                SRM, Ciclo Procure-to-Pay y Auto-Replenishment con IA.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl transition-all shadow-lg shadow-orange-500/20 text-sm">
              <ShoppingCart className="h-4 w-4" /> Nueva Requisición
            </button>
          </div>
        </header>

        {/* TOP METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Spend YTD</p>
              <p className="text-2xl font-black text-neutral-900 dark:text-white mt-1">$2.8M</p>
            </div>
            <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl"><LineChart className="h-6 w-6 text-neutral-500" /></div>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between border-l-4 border-l-rose-500">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Alertas 3-Way Match</p>
              <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">3</p>
              <p className="text-[10px] text-rose-500 mt-1 font-bold">Discrepancias PO vs XML</p>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-500/10 rounded-xl"><AlertTriangle className="h-6 w-6 text-rose-500" /></div>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between border-l-4 border-l-blue-500">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Excepciones IA</p>
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">12</p>
              <p className="text-[10px] text-blue-500 mt-1 font-bold">Ajustes de Pronóstico</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl"><BrainCircuit className="h-6 w-6 text-blue-500" /></div>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between border-l-4 border-l-emerald-500">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Ahorro Pronto Pago</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">$45K</p>
              <p className="text-[10px] text-emerald-500 mt-1 font-bold">Sugeridos este mes</p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl"><TrendingDown className="h-6 w-6 text-emerald-500" /></div>
          </div>
        </div>

        {/* NAVEGACIÓN DE MÓDULOS SCM */}
        <div className="flex overflow-x-auto border-b border-neutral-200 dark:border-neutral-800 pb-2 gap-2">
          {[
            { id: 'dashboard', label: 'Spend Analysis', icon: LineChart },
            { id: 'srm', label: 'Proveedores y LCO', icon: ShieldAlert },
            { id: 'p2p', label: 'Ciclo P2P y 3-Way Match', icon: PackageCheck },
            { id: 'pronostico', label: 'Auto-Replenishment (IA)', icon: BrainCircuit },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' 
                  : 'bg-white dark:bg-neutral-900 text-neutral-500 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
              }`}
            >
              <tab.icon className="h-4 w-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* ÁREA DE CONTENIDO */}
        <main className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm min-h-[600px] p-6">
          
          {/* 1. DASHBOARD: SPEND ANALYSIS & IA */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Gráfica de Gasto */}
                <div className="lg:col-span-2 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 bg-neutral-50 dark:bg-black">
                  <h3 className="font-black text-neutral-900 dark:text-white flex items-center gap-2 mb-6">
                    <LineChart className="h-5 w-5 text-orange-500" /> Spend Analysis (Directo vs Indirecto)
                  </h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={spendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                        <XAxis dataKey="mes" stroke="#94a3b8" tickLine={false} axisLine={false} fontSize={12} />
                        <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `$${v/1000}k`} />
                        <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", color: 'white', borderRadius: 10 }} />
                        <Bar dataKey="directo" name="Gasto Directo (COGS)" fill="#f97316" radius={[4, 4, 0, 0]} stackId="a" />
                        <Bar dataKey="indirecto" name="Gasto Indirecto (OPEX)" fill="#fbbf24" radius={[4, 4, 0, 0]} stackId="a" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Panel de Excepciones IA */}
                <div className="border border-blue-200 dark:border-blue-900/50 rounded-2xl p-6 bg-blue-50 dark:bg-blue-950/20">
                  <h3 className="font-black text-blue-900 dark:text-blue-100 flex items-center gap-2 mb-4">
                    <BrainCircuit className="h-5 w-5 text-blue-500" /> Excepciones de IA
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-white dark:bg-black p-3 rounded-xl border border-blue-100 dark:border-blue-900 shadow-sm">
                      <p className="text-xs font-bold text-blue-800 dark:text-blue-300">Alza de demanda detectada</p>
                      <p className="text-[10px] text-neutral-500 mt-1">Sugerí comprar +150 unidades de SKU-892 debido a picos de búsqueda regional.</p>
                      <button className="mt-2 text-[10px] font-bold bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">Revisar Sugerencia</button>
                    </div>
                    <div className="bg-white dark:bg-black p-3 rounded-xl border border-rose-100 dark:border-rose-900 shadow-sm">
                      <p className="text-xs font-bold text-rose-800 dark:text-rose-300">Alerta: Stock Muerto</p>
                      <p className="text-[10px] text-neutral-500 mt-1">SKU-104 (Resinas) ha bajado su Inventory Turnover un 40%. Sugiero detener reabastecimiento.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. SRM: PROVEEDORES Y LCO */}
          {activeTab === 'srm' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-black text-neutral-900 dark:text-white">Gestión Estratégica de Proveedores (SRM)</h2>
                <button className="flex items-center gap-2 px-4 py-2 bg-neutral-950 dark:bg-white text-white dark:text-black font-bold rounded-xl text-xs hover:scale-[1.02] transition-transform">
                  <ShieldAlert className="h-4 w-4" /> Validar LCO/EFOS Masivo
                </button>
              </div>

              <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-2xl">
                <table className="min-w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-neutral-50 dark:bg-black/50 border-b border-neutral-200 dark:border-neutral-800">
                    <tr>
                      <th className="p-4 font-bold text-neutral-600 dark:text-neutral-400">Proveedor</th>
                      <th className="p-4 font-bold text-neutral-600 dark:text-neutral-400 text-center">Estatus SAT (LCO)</th>
                      <th className="p-4 font-bold text-neutral-600 dark:text-neutral-400 text-center">Score: Entrega</th>
                      <th className="p-4 font-bold text-neutral-600 dark:text-neutral-400 text-center">Score: Calidad</th>
                      <th className="p-4 font-bold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                    <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="p-4">
                        <p className="font-bold text-neutral-900 dark:text-white">Acero y Perfiles Nacionales S.A.</p>
                        <p className="text-[10px] text-neutral-500 font-mono mt-0.5">APN120304XYZ • Lead Time: 5 días</p>
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-2 py-0.5 rounded text-[10px] font-black uppercase">
                          <CheckCircle2 className="h-3 w-3" /> Limpio
                        </span>
                      </td>
                      <td className="p-4 text-center"><span className="font-black text-emerald-600">98%</span></td>
                      <td className="p-4 text-center"><span className="font-black text-emerald-600">99%</span></td>
                      <td className="p-4 text-right">
                        <button className="text-xs font-bold text-blue-600 hover:underline">Ver Scorecard</button>
                      </td>
                    </tr>
                    <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 bg-rose-50/30 dark:bg-rose-900/10">
                      <td className="p-4">
                        <p className="font-bold text-neutral-900 dark:text-white">Comercializadora Fantasma S.C.</p>
                        <p className="text-[10px] text-neutral-500 font-mono mt-0.5">CFA190101ABC • Lead Time: 2 días</p>
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 px-2 py-0.5 rounded text-[10px] font-black uppercase animate-pulse">
                          <XCircle className="h-3 w-3" /> EFOS Detectado
                        </span>
                      </td>
                      <td className="p-4 text-center"><span className="font-black text-amber-600">85%</span></td>
                      <td className="p-4 text-center"><span className="font-black text-rose-600">70%</span></td>
                      <td className="p-4 text-right">
                        <button className="text-xs font-bold text-rose-600 hover:underline">Bloquear Pagos</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. CICLO P2P Y 3-WAY MATCH */}
          {activeTab === 'p2p' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white">Procure-to-Pay (P2P)</h2>
                  <p className="text-xs text-neutral-500">Triple validación automática: PO + Recepción + Factura (XML).</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl text-xs hover:bg-neutral-200 dark:hover:bg-neutral-700">
                  <Download className="h-4 w-4" /> Exportar para Auditoría
                </button>
              </div>

              <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-2xl">
                <table className="min-w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-neutral-50 dark:bg-black/50 border-b border-neutral-200 dark:border-neutral-800 text-[10px] uppercase text-neutral-500 tracking-widest">
                    <tr>
                      <th className="p-4 font-bold">Orden (PO)</th>
                      <th className="p-4 font-bold">Recepción Almacén</th>
                      <th className="p-4 font-bold">Factura XML (CFDI)</th>
                      <th className="p-4 font-bold text-center">3-Way Match</th>
                      <th className="p-4 font-bold text-right">Acción Financiera</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                    <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="p-4">
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">PO-1045</span><br/>
                        <span className="text-[10px] text-neutral-500">100 Laptops ($150K)</span>
                      </td>
                      <td className="p-4">
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">GR-092</span><br/>
                        <span className="text-[10px] text-neutral-500">100 Recibidas (Ok)</span>
                      </td>
                      <td className="p-4">
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">UUID...8A9B</span><br/>
                        <span className="text-[10px] text-neutral-500">Total: $150K</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-2 py-0.5 rounded text-[10px] font-black uppercase">
                          <CheckCircle2 className="h-3 w-3" /> MATCH EXITOSO
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button className="bg-neutral-950 dark:bg-white text-white dark:text-black font-bold px-3 py-1.5 rounded-lg text-xs shadow-md">Provisionar Gasto</button>
                      </td>
                    </tr>
                    <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 bg-rose-50/20 dark:bg-rose-900/10">
                      <td className="p-4">
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">PO-1046</span><br/>
                        <span className="text-[10px] text-neutral-500">50 Monitores ($25K)</span>
                      </td>
                      <td className="p-4">
                        <span className="font-mono font-bold text-rose-600 dark:text-rose-400">GR-093</span><br/>
                        <span className="text-[10px] text-rose-500 font-bold">48 Recibidos (Faltan 2)</span>
                      </td>
                      <td className="p-4">
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">UUID...4F2C</span><br/>
                        <span className="text-[10px] text-neutral-500">Total: $25K (Cobran 50)</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 px-2 py-0.5 rounded text-[10px] font-black uppercase">
                          <AlertTriangle className="h-3 w-3" /> DISCREPANCIA
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button className="bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300 font-bold px-3 py-1.5 rounded-lg text-xs border border-rose-200 dark:border-rose-800">Bloquear Pago</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. PRONÓSTICO Y AUTO-REPLENISHMENT */}
          {activeTab === 'pronostico' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-center bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 p-4 rounded-2xl">
                <div>
                  <h3 className="font-bold text-orange-900 dark:text-orange-100 flex items-center gap-2">
                    <Calculator className="h-5 w-5" /> Motor de Reorden Matemático (ROP)
                  </h3>
                  <p className="text-xs text-orange-700 dark:text-orange-400 mt-1">El sistema calcula el Punto de Reorden basado en: ROP = (Demanda Diaria × Lead Time) + Safety Stock</p>
                </div>
                <button className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-2 rounded-xl text-sm transition-colors shadow-lg shadow-orange-500/20">
                  Simular Pronóstico
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Simulador de Parámetros */}
                <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 bg-neutral-50 dark:bg-black">
                  <h4 className="font-black text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                    <Settings2 className="h-5 w-5 text-neutral-500" /> Parámetros Globales
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-bold text-neutral-500 mb-2">
                        <span>Nivel de Servicio (Safety Stock)</span>
                        <span className="text-orange-600">{nivelServicio}%</span>
                      </div>
                      <input 
                        type="range" min="90" max="99" value={nivelServicio} 
                        onChange={(e) => setNivelServicio(parseInt(e.target.value))}
                        className="w-full accent-orange-500" 
                      />
                      <p className="text-[10px] text-neutral-400 mt-1">Un nivel mayor del 95% aumenta el capital inmovilizado en almacén.</p>
                    </div>
                    <hr className="border-neutral-200 dark:border-neutral-800" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Generar POs en Automático</span>
                      <input type="checkbox" className="accent-orange-500 h-4 w-4" />
                    </div>
                  </div>
                </div>

                {/* Sugerencias de Compra (EOQ) */}
                <div className="lg:col-span-2 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 bg-neutral-50 dark:bg-black">
                  <h4 className="font-black text-neutral-900 dark:text-white mb-4 flex items-center justify-between">
                    <span className="flex items-center gap-2"><Box className="h-5 w-5 text-emerald-500" /> Sugerencias de Auto-Abasto (EOQ)</span>
                    <button className="text-xs font-bold bg-neutral-200 dark:bg-neutral-800 px-3 py-1 rounded-lg">Consolidar Todo</button>
                  </h4>
                  <div className="space-y-3">
                    <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 flex justify-between items-center shadow-sm">
                      <div>
                        <p className="font-bold text-neutral-900 dark:text-white text-sm">SKU-A001 (Microchips)</p>
                        <p className="text-[10px] text-neutral-500 mt-1 font-mono">Stock Actual: 150 | ROP: 180 | Lead Time: 12d</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-emerald-600">Sugerencia: Comprar 500 und.</p>
                        <button className="mt-1 text-[10px] font-bold bg-neutral-950 dark:bg-white text-white dark:text-black px-2 py-1 rounded">Crear Draft PO</button>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 flex justify-between items-center shadow-sm">
                      <div>
                        <p className="font-bold text-neutral-900 dark:text-white text-sm">SKU-B045 (Cajas Embalaje)</p>
                        <p className="text-[10px] text-neutral-500 mt-1 font-mono">Stock Actual: 45 | ROP: 60 | Lead Time: 3d</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-emerald-600">Sugerencia: Comprar 1,000 und.</p>
                        <button className="mt-1 text-[10px] font-bold bg-neutral-950 dark:bg-white text-white dark:text-black px-2 py-1 rounded">Crear Draft PO</button>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}