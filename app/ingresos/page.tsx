'use client';

import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, BadgeDollarSign, Plus, Building2, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function IngresosPage() {
  const [ingresos, setIngresos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // 1. Cargar datos reales desde Supabase
  useEffect(() => {
    async function cargarDatos() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from('ingresos_cfdi')
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
  }, []);

  // 2. Cálculos dinámicos para las tarjetas de resumen
  const estadisticas = useMemo(() => {
    const totalMes = ingresos.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
    const totalIva = ingresos.reduce((acc, curr) => acc + (Number(curr.iva) || 0), 0);
    const facturasPPD = ingresos.filter(i => i.metodo_pago === 'PPD').length;

    return [
      { 
        label: 'Ingresos Mes', 
        val: totalMes.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }), 
        col: 'text-emerald-700 dark:text-emerald-400', 
        icon: TrendingUp 
      },
      { 
        label: 'IVA Trasladado', 
        val: totalIva.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }), 
        col: 'text-amber-700 dark:text-yellow-500', 
        icon: BadgeDollarSign 
      },
      { 
        label: 'Facturas PPD', 
        val: facturasPPD.toString(), 
        col: 'text-blue-700 dark:text-blue-400', 
        icon: Building2 
      },
    ];
  }, [ingresos]);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 transition-colors duration-300">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-neutral-950 dark:text-white">Ingresos</h1>
          <p className="text-neutral-600 dark:text-neutral-400 font-bold">Control de Facturación Real</p>
        </div>
        <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all">
          <Plus size={20} /> Registrar XML
        </button>
      </header>

      {/* Tarjetas con Datos Reales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {estadisticas.map((card, i) => (
          <div key={i} className="bg-white dark:bg-neutral-900 border-2 border-neutral-100 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
            <div className={`flex items-center gap-2 ${card.col} mb-3 font-black text-xs uppercase tracking-tighter`}>
              <card.icon size={18} /> {card.label}
            </div>
            <div className="text-3xl font-black text-neutral-950 dark:text-white">{card.val}</div>
          </div>
        ))}
      </div>

      {/* Tabla Dinámica */}
      <div className="bg-white dark:bg-neutral-900 border-2 border-neutral-100 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-neutral-50 dark:bg-neutral-800/50">
            <tr className="text-neutral-600 dark:text-neutral-400 text-[11px] font-black uppercase tracking-widest border-b border-neutral-100 dark:border-neutral-800">
              <th className="px-6 py-4">Cliente / Folio</th>
              <th className="px-6 py-4 text-right">Total</th>
              <th className="px-6 py-4 text-center">Estatus</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {ingresos.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-neutral-500 font-bold italic">
                  No hay ingresos registrados en la base de datos.
                </td>
              </tr>
            ) : (
              ingresos.map((item) => (
                <tr key={item.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                  <td className="px-6 py-5">
                    <div className="font-black text-neutral-950 dark:text-neutral-100">{item.nombre_cliente}</div>
                    <div className="text-[10px] text-neutral-500 font-bold">{item.folio || 'S/F'}</div>
                  </td>
                  <td className="px-6 py-5 text-right font-black text-neutral-950 dark:text-emerald-400 text-lg">
                    ${Number(item.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase border-2 ${
                      item.estatus === 'Cobrado' 
                        ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                        : 'bg-amber-100 dark:bg-yellow-500/10 text-amber-800 dark:text-yellow-500 border-amber-200 dark:border-yellow-500/20'
                    }`}>
                      {item.estatus}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}