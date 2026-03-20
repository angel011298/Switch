'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  FileBarChart2, ScrollText, FolderClosed, Plus,
  BadgeCheck, Hourglass, Banknote, Loader2,
  ScanLine, FileUp, AlertTriangle, Scale, Lock,
  History, Settings2, Receipt
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

// Helper para moneda
function formatoMoneda(valor: number) {
  return valor.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 });
}

export default function CajaChicaPage() {
  const [activeTab, setActiveTab] = useState<'registro' | 'historial' | 'arqueo' | 'politicas'>('registro');
  const [ingresos, setIngresos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // 1. Cargar datos desde Supabase (Usamos tu tabla base como proxy de movimientos)
  useEffect(() => {
    async function cargarDatos() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from('ingresos_cfdi') // En producción, idealmente usarías una tabla 'movimientos_caja'
          .select('*')
          .eq('user_id', user.id)
          .order('fecha_emision', { ascending: false });

        if (!error && data) {
          setIngresos(data);
        }
      }
      setLoading(false);
    }
    cargarDatos();
  }, [supabase]);

  // 2. Calcular Resúmenes del Fondo Fijo (Lógica de Caja Chica)
  const resumenCaja = useMemo(() => {
    // Simulamos un fondo fijo de $10,000
    const fondoFijo = 10000;
    const gastosMes = ingresos.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
    const saldoActual = fondoFijo - gastosMes;
    
    // Alerta de reposición si queda menos del 20%
    const requiereReposicion = saldoActual < (fondoFijo * 0.20);
    const noDeducibles = ingresos.filter(i => i.metodo_pago === 'PUE' && i.total > 2000).length; // Simulación de regla LISR

    return { fondoFijo, gastosMes, saldoActual, requiereReposicion, noDeducibles };
  }, [ingresos]);

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
              <Banknote className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">Caja Chica (Fondo Fijo)</h1>
              <p className="text-neutral-500 font-medium text-sm mt-1">
                Registro rápido, validación LISR (Art. 27) y reposición de fondos.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all text-sm">
              <ScanLine className="h-4 w-4" /> Escanear Ticket (OCR)
            </button>
            <button className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition-all shadow-lg shadow-emerald-500/20 text-sm">
              <Plus className="h-4 w-4" /> Nuevo Gasto Manual
            </button>
          </div>
        </header>

        {/* ALERTA DE REPOSICIÓN */}
        {resumenCaja.requiereReposicion && (
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-amber-800 dark:text-amber-400 font-bold">Saldo de Caja Crítico</p>
              <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">El saldo actual ({formatoMoneda(resumenCaja.saldoActual)}) está por debajo del 20% del fondo fijo. Solicita una reposición al departamento de Tesorería.</p>
            </div>
            <button className="ml-auto text-xs font-bold bg-amber-500 text-white px-3 py-1.5 rounded-lg shadow-sm">
              Solicitar Reembolso
            </button>
          </div>
        )}

        {/* TOP METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Saldo Físico (Disponible)</p>
              <Banknote className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="text-3xl font-black text-neutral-900 dark:text-white">{formatoMoneda(resumenCaja.saldoActual)}</p>
            <div className="w-full bg-neutral-100 dark:bg-black rounded-full h-2 mt-4 border border-neutral-200 dark:border-neutral-800">
              <div className={`h-full rounded-full ${resumenCaja.requiereReposicion ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${(resumenCaja.saldoActual / resumenCaja.fondoFijo) * 100}%` }}></div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Gastos Comprobados</p>
              <Receipt className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-3xl font-black text-neutral-900 dark:text-white">{formatoMoneda(resumenCaja.gastosMes)}</p>
            <p className="text-xs font-bold text-neutral-400 mt-4">Fondo Fijo Asignado: {formatoMoneda(resumenCaja.fondoFijo)}</p>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Alerta LISR (No Deducibles)</p>
              <Scale className="h-5 w-5 text-rose-500" />
            </div>
            <p className="text-3xl font-black text-rose-600 dark:text-rose-400">{resumenCaja.noDeducibles}</p>
            <p className="text-xs font-medium text-neutral-500 mt-4 leading-tight">Gastos en efectivo que superan los $2,000 MXN o son de combustible.</p>
          </div>
        </div>

        {/* CONTENEDOR DE PESTAÑAS */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm min-h-[500px] overflow-hidden">
          
          <div className="flex overflow-x-auto border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-black/50 p-2 gap-2">
            {[
              { id: 'registro', label: 'Registro Rápido' },
              { id: 'historial', label: 'Historial de Gastos' },
              { id: 'arqueo', label: 'Arqueo de Caja' },
              { id: 'politicas', label: 'Políticas y Reglas' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-white dark:bg-neutral-900 text-emerald-600 dark:text-emerald-400 shadow-sm border border-neutral-200 dark:border-neutral-800' 
                    : 'text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            
            {/* 1. REGISTRO RÁPIDO (Mobile-First) */}
            {activeTab === 'registro' && (
              <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-black text-neutral-900 dark:text-white">Captura de Gasto</h2>
                  <p className="text-neutral-500 text-sm mt-1">Registra tickets, facturas (XML) o viáticos.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <button className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-emerald-200 dark:border-emerald-500/30 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors group">
                    <FileUp className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-emerald-900 dark:text-emerald-100 text-sm">Cargar XML</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">Extrae datos del SAT</span>
                  </button>
                  <button className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-blue-200 dark:border-blue-500/30 rounded-2xl bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors group">
                    <ScanLine className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-blue-900 dark:text-blue-100 text-sm">Foto de Ticket</span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 mt-1">Lector Inteligente (OCR)</span>
                  </button>
                </div>

                <form className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Monto Total</label>
                      <div className="relative">
                        <span className="absolute left-4 top-3.5 font-bold text-neutral-400">$</span>
                        <input type="number" placeholder="0.00" className="w-full pl-8 pr-4 py-3 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-xl font-mono font-bold text-lg text-neutral-900 dark:text-white outline-none focus:border-emerald-500" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Categoría</label>
                      <select className="w-full p-3 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-xl font-bold text-neutral-900 dark:text-white outline-none focus:border-emerald-500 h-[52px]">
                        <option>Papelería y Oficina</option>
                        <option>Alimentos (Viáticos)</option>
                        <option>Combustible</option>
                        <option>Transporte / Taxis</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Concepto / Justificación</label>
                    <input type="text" placeholder="Ej. Comida con cliente prospecto" className="w-full p-3 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-xl font-medium text-neutral-900 dark:text-white outline-none focus:border-emerald-500" />
                  </div>
                  
                  {/* Simulación Lógica Soft Warning */}
                  <div className="bg-neutral-100 dark:bg-black p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-500 flex items-center gap-1"><Lock className="h-3 w-3" /> Estatus Fiscal</span>
                    <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-2 py-1 rounded text-[10px] font-black uppercase">100% Deducible</span>
                  </div>

                  <button type="button" className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition-all shadow-lg mt-4">
                    Registrar en Caja Chica
                  </button>
                </form>
              </div>
            )}

            {/* 2. HISTORIAL DE GASTOS (Tu tabla original adaptada) */}
            {activeTab === 'historial' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <History className="h-5 w-5 text-neutral-400" />
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Movimientos del Periodo</h2>
                </div>
                
                <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-2xl">
                  <table className="min-w-full text-sm whitespace-nowrap text-left">
                    <thead className="bg-neutral-50 dark:bg-black/50 border-b border-neutral-200 dark:border-neutral-800 text-[10px] uppercase text-neutral-500 tracking-widest">
                      <tr>
                        <th className="py-4 px-4 font-bold">Fecha</th>
                        <th className="py-4 px-4 font-bold">Concepto / Proveedor</th>
                        <th className="py-4 px-4 font-bold">Categoría</th>
                        <th className="py-4 px-4 font-bold text-right">Monto</th>
                        <th className="py-4 px-4 font-bold text-center">Deducibilidad</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                      {ingresos.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-neutral-500 font-medium">No hay registros en caja chica.</td>
                        </tr>
                      ) : (
                        ingresos.slice(0, 10).map((row, idx) => {
                          // Simulación visual de regla fiscal basada en el monto
                          const isNoDeducible = Number(row.total) > 2000;
                          return (
                            <tr key={row.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 group">
                              <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 font-mono text-xs">{row.fecha_emision}</td>
                              <td className="px-4 py-3">
                                <p className="font-bold text-neutral-900 dark:text-white truncate max-w-[200px]">{row.nombre_cliente || 'Gasto General'}</p>
                                <p className="text-[10px] text-neutral-500 mt-0.5">{row.rfc_cliente}</p>
                              </td>
                              <td className="px-4 py-3">
                                <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 px-2 py-1 rounded-md text-xs font-medium border border-neutral-200 dark:border-neutral-700">
                                  Administración
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right font-black text-neutral-900 dark:text-white">
                                {formatoMoneda(Number(row.total))}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                  isNoDeducible 
                                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' 
                                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                }`}>
                                  {isNoDeducible ? 'No Deducible' : 'Deducible'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. POLÍTICAS Y REGLAS (Configuración) */}
            {activeTab === 'politicas' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center gap-2 mb-6">
                  <Settings2 className="h-5 w-5 text-neutral-400" />
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Motor de Reglas LISR y PLD</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 bg-neutral-50 dark:bg-black">
                    <h3 className="font-bold text-neutral-900 dark:text-white mb-1">Límite de Efectivo (LISR)</h3>
                    <p className="text-xs text-neutral-500 mb-4">Gastos generales pagados en efectivo (Forma 01) que superen este monto serán marcados como no deducibles.</p>
                    <input type="text" readOnly value="$2,000.00 MXN" className="w-full p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl font-mono text-sm font-bold text-neutral-500 outline-none" />
                  </div>

                  <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 bg-neutral-50 dark:bg-black">
                    <h3 className="font-bold text-neutral-900 dark:text-white mb-1">Regla Combustibles (Art. 27 LISR)</h3>
                    <p className="text-xs text-neutral-500 mb-4">Montos pagados en efectivo para gasolina o diésel.</p>
                    <input type="text" readOnly value="$0.00 MXN (Hard Block)" className="w-full p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl font-mono text-sm font-bold text-rose-500 outline-none" />
                  </div>

                  <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 bg-neutral-50 dark:bg-black md:col-span-2">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-neutral-900 dark:text-white">Log de Excepciones (Auditoría)</h3>
                        <p className="text-xs text-neutral-500 mt-1">Bitácora inmutable de gastos forzados por el administrador.</p>
                      </div>
                      <button className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">Descargar CSV</button>
                    </div>
                    <div className="bg-white dark:bg-neutral-900 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs font-mono text-neutral-500 space-y-2">
                      <p>[2026-03-13 08:30:12] IP: 189.215.x.x - Usuario: angel@adastra.com - ACCIÓN: Bloqueo Gasto $500 (Combustible Efectivo)</p>
                      <p className="text-amber-600 dark:text-amber-500">[2026-03-12 14:15:00] IP: 189.215.x.x - Usuario: admin@adastra.com - ACCIÓN: Warning Ignore $3,500 (Marcado No Deducible)</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. ARQUEO DE CAJA */}
            {activeTab === 'arqueo' && (
              <div className="flex flex-col items-center justify-center min-h-[300px] text-center animate-in fade-in duration-300">
                <div className="bg-blue-50 dark:bg-blue-500/10 p-6 rounded-full mb-4">
                  <Scale className="h-10 w-10 text-blue-500" />
                </div>
                <h2 className="text-xl font-black text-neutral-900 dark:text-white mb-2">Arqueo Digital</h2>
                <p className="text-neutral-500 text-sm max-w-md mb-6">
                  Compara el saldo físico que tienes en los cajones contra el saldo de {formatoMoneda(resumenCaja.saldoActual)} registrado en el ERP para detectar faltantes o sobrantes.
                </p>
                <button className="px-6 py-3 bg-neutral-900 hover:bg-black dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black font-bold rounded-xl text-sm transition-colors shadow-lg">
                  Iniciar Arqueo de Hoy
                </button>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}