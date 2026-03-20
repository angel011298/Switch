'use client';

import React, { useState } from 'react';
import { 
  Package, Warehouse, Map, Barcode, ArrowRightLeft, 
  ClipboardCheck, Calculator, TrendingUp, ShoppingCart, 
  ShieldAlert, Layers, QrCode, Lock, FileText, Plus, 
  Search, Filter, Box, Anchor, AlertTriangle, Truck, 
  Network, Fingerprint, Activity, Zap, History, ChevronRight
} from 'lucide-react';

export default function InventariosPage() {
  const [activeTab, setActiveTab] = useState('mapa');
  const [isLocked, setIsLocked] = useState(false);

  // Mock Data: Almacenes y Posiciones
  const locations = [
    { id: 'pos-1', name: 'A-01-R2-N1', sku: 'THK-X280', qty: 45, status: 'Full' },
    { id: 'pos-2', name: 'A-01-R2-N2', sku: 'THK-X280', qty: 12, status: 'Available' },
    { id: 'pos-3', name: 'B-04-R1-N3', sku: 'MON-DEL-24', qty: 8, status: 'Picking' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-zinc-950 p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* HEADER OPERATIVO */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-orange-500/10 p-3 rounded-2xl border border-orange-500/20">
              <Warehouse className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">Gestión de Almacenes (SCM)</h1>
              <p className="text-neutral-500 font-medium text-sm mt-1 flex items-center gap-2">
                <Network className="h-4 w-4" /> Multi-Almacén • Trazabilidad • WMS Lite
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setIsLocked(!isLocked)}
              className={`flex items-center gap-2 px-4 py-2 font-bold rounded-xl text-xs transition-all border ${
                isLocked 
                ? 'bg-rose-600 text-white border-rose-700 animate-pulse' 
                : 'bg-white dark:bg-zinc-800 text-neutral-700 dark:text-zinc-300 border-neutral-200 dark:border-zinc-700 hover:bg-neutral-100'
              }`}
            >
              <Lock className="h-4 w-4" /> {isLocked ? 'ALMACÉN BLOQUEADO' : 'Bloquear p/ Inventario'}
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black font-black rounded-xl text-xs shadow-lg hover:scale-105 transition-all">
              <QrCode className="h-4 w-4" /> Generar Etiquetas QR
            </button>
          </div>
        </header>

        {/* MÉTRICAS CRÍTICAS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-neutral-200 dark:border-zinc-800 border-l-4 border-l-blue-500">
            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Valorización Total</p>
            <p className="text-2xl font-black text-neutral-950 dark:text-white mt-1">$4,280,500.00</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold">Costo Promedio</span>
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-neutral-200 dark:border-zinc-800 border-l-4 border-l-emerald-500">
            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Precisión de Conteo</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">99.2%</p>
            <div className="flex items-center gap-1 mt-2 text-[10px] text-emerald-500 font-bold">
              <ClipboardCheck className="h-3 w-3" /> Conteo cíclico al día
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-neutral-200 dark:border-zinc-800 border-l-4 border-l-amber-500">
            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Stock en Tránsito</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">142 Unidades</p>
            <div className="flex items-center gap-1 mt-2 text-[10px] text-amber-500 font-bold">
              <Truck className="h-3 w-3" /> 3 Transferencias activas
            </div>
          </div>
          <div className="bg-zinc-900 dark:bg-white p-5 rounded-2xl border border-zinc-800 dark:border-zinc-200 text-white dark:text-black">
            <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Puntos de Reorden</p>
            <p className="text-2xl font-black mt-1">12 SKUs</p>
            <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-orange-400 dark:text-orange-600">
              <Zap className="h-3 w-3" /> Requiere Compra Inmediata
            </div>
          </div>
        </div>

        {/* TABS DE MÓDULO */}
        <div className="flex gap-2 border-b border-neutral-200 dark:border-zinc-800 pb-2 overflow-x-auto">
          {[
            { id: 'mapa', name: 'Arquitectura & Mapa', icon: Map },
            { id: 'existencias', name: 'Existencias & Trazabilidad', icon: Fingerprint },
            { id: 'operaciones', name: 'Operaciones (WMS)', icon: Box },
            { id: 'cardex', name: 'Historial & Cardex', icon: History },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id 
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/20' 
                : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-zinc-900'
              }`}
            >
              <tab.icon className="h-4 w-4" /> {tab.name}
            </button>
          ))}
        </div>

        {/* ÁREA DE CONTENIDO */}
        <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm min-h-[500px]">
          
          {/* TAB 1: ARQUITECTURA Y MAPA */}
          {activeTab === 'mapa' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 h-full">
              {/* Árbol Jerárquico */}
              <div className="p-6 border-r border-neutral-100 dark:border-zinc-800 bg-neutral-50/50 dark:bg-black/20">
                <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-4">Estructura Lógica</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-800 rounded-2xl border border-neutral-200 dark:border-zinc-700 shadow-sm">
                    <Warehouse className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-sm font-black text-neutral-900 dark:text-white">Almacén Central</p>
                      <p className="text-[10px] text-neutral-500">CDMX, Santa Fe</p>
                    </div>
                  </div>
                  <div className="pl-6 space-y-2 border-l-2 border-neutral-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between p-2 hover:bg-neutral-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer">
                      <span className="text-xs font-bold flex items-center gap-2"><Layers className="h-3 w-3" /> Pasillo A (Tecnología)</span>
                      <ChevronRight className="h-3 w-3 text-neutral-400" />
                    </div>
                    <div className="flex items-center justify-between p-2 hover:bg-neutral-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer">
                      <span className="text-xs font-bold flex items-center gap-2"><Layers className="h-3 w-3" /> Pasillo B (Mobiliario)</span>
                      <ChevronRight className="h-3 w-3 text-neutral-400" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border border-dashed border-neutral-300 dark:border-zinc-700 rounded-2xl opacity-60">
                    <Anchor className="h-5 w-5 text-blue-500" />
                    <p className="text-sm font-bold text-neutral-500">Almacén de Merma (Virtual)</p>
                  </div>
                </div>
              </div>

              {/* Mapa de Calor / Visualizador de Ubicaciones */}
              <div className="lg:col-span-2 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black text-neutral-900 dark:text-white">Vista de Pasillo A</h3>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1 text-[10px] font-bold"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div> Disponible</div>
                    <div className="flex items-center gap-1 text-[10px] font-bold"><div className="w-2 h-2 bg-rose-500 rounded-full"></div> Lleno</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {locations.map((loc) => (
                    <div key={loc.id} className="p-4 rounded-2xl border border-neutral-200 dark:border-zinc-800 hover:border-orange-500 transition-all group cursor-pointer">
                      <p className="text-[10px] font-black text-neutral-400 mb-2">{loc.name}</p>
                      <div className="h-16 flex items-center justify-center bg-neutral-50 dark:bg-black rounded-xl mb-3">
                        <Box className={`h-8 w-8 ${loc.status === 'Full' ? 'text-rose-500' : 'text-emerald-500 opacity-40'}`} />
                      </div>
                      <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">{loc.sku}</p>
                      <p className="text-[10px] text-neutral-500 font-mono mt-1">QTY: {loc.qty}</p>
                    </div>
                  ))}
                  <button className="p-4 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-zinc-800 flex flex-col items-center justify-center text-neutral-400 hover:text-orange-500 hover:border-orange-500 transition-all">
                    <Plus className="h-6 w-6 mb-1" />
                    <span className="text-[10px] font-bold uppercase">Añadir Rack</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EXISTENCIAS Y TRAZABILIDAD */}
          {activeTab === 'existencias' && (
            <div className="p-6 space-y-6">
              <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <input type="text" placeholder="Buscar por SKU, Lote o Pedimento..." className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:border-orange-500 transition-all" />
                </div>
                <div className="flex gap-2">
                  <button className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-zinc-800 text-neutral-700 dark:text-zinc-300 rounded-xl text-xs font-bold border border-neutral-200 dark:border-zinc-700"><Filter className="h-4 w-4" /> Filtros Avanzados</button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-neutral-950 dark:bg-white text-white dark:text-black rounded-xl text-xs font-bold"><TrendingUp className="h-4 w-4" /> Exportar Inventario</button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-neutral-50 dark:bg-black text-[10px] uppercase text-neutral-500 font-black tracking-widest border-y border-neutral-100 dark:border-zinc-800">
                    <tr>
                      <th className="p-4">SKU & Producto</th>
                      <th className="p-4">Lote / Serie</th>
                      <th className="p-4">Pedimento Aduanal</th>
                      <th className="p-4 text-center">Stock Físico</th>
                      <th className="p-4 text-center">Reservado (CRM)</th>
                      <th className="p-4 text-right">Estatus Legal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-zinc-800">
                    <tr className="hover:bg-neutral-50/50 dark:hover:bg-black/20">
                      <td className="p-4">
                        <p className="font-bold text-neutral-900 dark:text-white">Laptop ThinkPad X280</p>
                        <p className="text-[10px] font-mono text-neutral-400">SKU: THK-X280</p>
                      </td>
                      <td className="p-4">
                        <span className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded font-mono">LT-2025-X09</span>
                      </td>
                      <td className="p-4">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">21 47 3803 1000542</span>
                      </td>
                      <td className="p-4 text-center font-black">57 <span className="text-[10px] font-normal text-neutral-400">PZA</span></td>
                      <td className="p-4 text-center font-bold text-orange-500">12</td>
                      <td className="p-4 text-right">
                        <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded text-[10px] font-black uppercase">
                          <ShieldAlert className="h-3 w-3" /> Liberado SAT
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: OPERACIONES (WMS) */}
          {activeTab === 'operaciones' && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Picking List */}
              <div className="bg-blue-50/30 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 p-6 rounded-3xl">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-black text-blue-900 dark:text-blue-100 flex items-center gap-2"><ClipboardCheck className="h-5 w-5" /> Ruta de Picking (Surtido)</h4>
                  <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded">ORDEN: #SO-882</span>
                </div>
                <div className="space-y-3">
                  <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl flex justify-between items-center shadow-sm">
                    <div>
                      <p className="text-xs font-black text-neutral-400">LOC: A-01-R2-N1</p>
                      <p className="text-sm font-bold text-neutral-900 dark:text-white">Laptop ThinkPad X280</p>
                    </div>
                    <p className="text-lg font-black text-neutral-900 dark:text-white">x2</p>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl flex justify-between items-center shadow-sm opacity-50">
                    <div>
                      <p className="text-xs font-black text-neutral-400">LOC: B-04-R1-N3</p>
                      <p className="text-sm font-bold text-neutral-900 dark:text-white">Monitor Dell 24"</p>
                    </div>
                    <p className="text-lg font-black text-neutral-900 dark:text-white">x1</p>
                  </div>
                </div>
                <button className="w-full mt-4 bg-blue-600 text-white font-black py-3 rounded-xl text-sm shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-all">Finalizar Surtido & Empaque</button>
              </div>

              {/* Inteligencia de Reabastecimiento */}
              <div className="space-y-4">
                <h4 className="font-black text-neutral-900 dark:text-white flex items-center gap-2"><TrendingUp className="h-5 w-5 text-orange-500" /> Reabastecimiento Inteligente</h4>
                <div className="p-5 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-bold text-neutral-900 dark:text-white">Cable HDMI 4K (2m)</p>
                      <p className="text-[10px] text-neutral-500 mt-1">Par Level (Mínimo): 50 | Actual: 12</p>
                    </div>
                    <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-[10px] font-black px-2 py-1 rounded">DÉFICIT CRÍTICO</span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button className="flex-1 bg-orange-600 text-white font-bold py-2 rounded-lg text-xs hover:bg-orange-700 transition-colors">Generar Sugerencia Compra</button>
                    <button className="px-3 bg-neutral-100 dark:bg-zinc-800 rounded-lg"><Activity className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CARDEX Y FINANZAS */}
          {activeTab === 'cardex' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-black text-neutral-900 dark:text-white">Historial de Movimientos (Cardex)</h3>
                  <p className="text-xs text-neutral-500 mt-1">Rastreo de cada entrada, salida y transferencia.</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-neutral-400 uppercase">Método de Costeo Activo</p>
                  <p className="text-sm font-bold text-orange-600">PEPS (Primero en Entrar, Primero en Salir)</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { type: 'Salida', doc: '#SO-882', qty: '-2', user: 'Almacén 01', date: 'Hoy, 14:20', color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' },
                  { type: 'Entrada', doc: '#PO-551', qty: '+20', user: 'Compras', date: 'Ayer, 09:15', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                  { type: 'Transferencia', doc: '#TR-01', qty: '10', user: 'Logística', date: '12 Mar 2026', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                ].map((mov, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-black/40 rounded-2xl border border-neutral-100 dark:border-zinc-800">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-xl ${mov.bg} ${mov.color}`}><ArrowRightLeft className="h-4 w-4" /></div>
                      <div>
                        <p className="text-sm font-bold text-neutral-900 dark:text-white">{mov.type} {mov.doc}</p>
                        <p className="text-[10px] text-neutral-500">{mov.user} • {mov.date}</p>
                      </div>
                    </div>
                    <p className={`text-lg font-black ${mov.color}`}>{mov.qty}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}