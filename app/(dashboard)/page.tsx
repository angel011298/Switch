'use client';

import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Wallet, Users, AlertCircle, ArrowUpRight, ArrowDownRight, FileText, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

function formatoMoneda(valor: number) {
  return valor.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
}

export default function DashboardPrincipal() {
  const [datos, setDatos] = useState<{ ingresos: any[], gastos: any[], empleados: any[] }>({ ingresos: [], gastos: [], empleados: [] });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function cargarTodo() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const [resIng, resGast, resEmp] = await Promise.all([
          supabase.from('ingresos_cfdi').select('*').eq('user_id', user.id),
          supabase.from('gastos_xml').select('*').eq('user_id', user.id),
          supabase.from('empleados').select('*').eq('user_id', user.id)
        ]);
        setDatos({ ingresos: resIng.data || [], gastos: resGast.data || [], empleados: resEmp.data || [] });
      }
      setLoading(false);
    }
    cargarTodo();
  }, []);

  const resumen = useMemo(() => {
    const totalIngresos = datos.ingresos.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
    const totalGastos = datos.gastos.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
    return {
      totalIngresos,
      totalGastos,
      utilidad: totalIngresos - totalGastos,
      pendientesCobro: datos.ingresos.filter(i => i.estatus === 'Pendiente').length,
      plantilla: datos.empleados.length
    };
  }, [datos]);

  if (loading) return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-emerald-500" /></div>;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto transition-colors duration-300">
      
      {/* EL ESLOGAN DE SWITCH */}
      <header className="mb-10">
        <h1 className="text-5xl font-black text-neutral-950 dark:text-white tracking-tighter leading-tight">
          Un solo movimiento. <br />
          <span className="text-emerald-600 italic">Toda tu operación.</span>
        </h1>
        <p className="mt-4 text-lg text-neutral-500 dark:text-neutral-400 font-medium max-w-2xl">
          Bienvenido a Switch. El centro de mando modular donde controlas cada rincón de tu empresa con la simplicidad de un interruptor.
        </p>
      </header>

      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl text-emerald-600"><TrendingUp size={24} /></div>
            <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">Utilidad</span>
          </div>
          <div className="text-2xl font-black text-neutral-950 dark:text-white">{formatoMoneda(resumen.utilidad)}</div>
        </div>
        
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-amber-50 dark:bg-yellow-500/10 rounded-xl text-amber-600"><Wallet size={24} /></div>
            <Link href="/cobranza" className="text-[10px] font-black uppercase text-amber-600 hover:underline">Ver Cobranza</Link>
          </div>
          <div className="text-2xl font-black text-neutral-950 dark:text-white">{resumen.pendientesCobro}</div>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-xl text-blue-600"><Users size={24} /></div>
          </div>
          <div className="text-2xl font-black text-neutral-950 dark:text-white">{resumen.plantilla}</div>
        </div>

        <div className="bg-neutral-950 dark:bg-white p-6 rounded-3xl shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-neutral-800 dark:bg-neutral-100 rounded-xl text-white dark:text-black"><AlertCircle size={24} /></div>
          </div>
          <div className="text-2xl font-black text-white dark:text-black">Deducción</div>
          <p className="text-xs text-neutral-400 font-bold">
            {resumen.totalIngresos > 0 ? ((resumen.totalGastos / resumen.totalIngresos) * 100).toFixed(0) : 0}%
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-8 rounded-[2rem] shadow-sm">
           <h2 className="text-lg font-black text-neutral-950 dark:text-white mb-6">Balance Financiero</h2>
           <div className="h-[250px]">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={[{ name: 'Ingresos', valor: resumen.totalIngresos }, { name: 'Gastos', valor: resumen.totalGastos }]}>
                 <XAxis dataKey="name" hide />
                 <Tooltip cursor={{fill: 'transparent'}} />
                 <Bar dataKey="valor" radius={[10, 10, 10, 10]}>
                   <Cell fill="#10b981" /><Cell fill="#f43f5e" />
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="space-y-6">
          <h2 className="text-lg font-black text-neutral-950 dark:text-white">Acciones Rápidas</h2>
          
          <Link href="/gastos" className="flex items-center justify-between p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl hover:scale-[1.02] transition-transform group">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <FileText size={20} />
              </div>
              <span className="font-black text-sm dark:text-white">Subir Facturas XML</span>
            </div>
            <ArrowUpRight size={20} className="text-neutral-400" />
          </Link>

          <Link href="/ingresos" className="flex items-center justify-between p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl hover:scale-[1.02] transition-transform group">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-2xl group-hover:bg-blue-500 group-hover:text-white transition-colors">
                <ArrowDownRight size={20} />
              </div>
              <span className="font-black text-sm dark:text-white">Registrar Venta</span>
            </div>
            <ArrowUpRight size={20} className="text-neutral-400" />
          </Link>
        </div>
      </div>
    </div>
  );
}