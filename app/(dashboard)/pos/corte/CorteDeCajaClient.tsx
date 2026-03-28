'use client';

import { useState } from 'react';
import { ShoppingCart, DollarSign, CreditCard, Smartphone, Printer, CheckCircle2 } from 'lucide-react';

interface Props {
  grandTotal: number;
  efectivoTotal: number;
  byMethod: Record<string, { count: number; total: number }>;
  ordersCount: number;
  date: string;
}

const PAY_LABEL: Record<string, { label: string; icon: typeof DollarSign; color: string }> = {
  '01': { label: 'Efectivo',       icon: DollarSign, color: 'text-emerald-500' },
  '03': { label: 'Transferencia',  icon: Smartphone, color: 'text-purple-500' },
  '04': { label: 'Tarjeta',        icon: CreditCard, color: 'text-blue-500' },
  '28': { label: 'Débito',         icon: CreditCard, color: 'text-sky-500' },
  '29': { label: 'Crédito',        icon: CreditCard, color: 'text-indigo-500' },
};

function fmt(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export default function CorteDeCajaClient({ grandTotal, efectivoTotal, byMethod, ordersCount, date }: Props) {
  const [efectivoEnCaja, setEfectivoEnCaja] = useState<string>('');
  const [corteCerrado, setCorteCerrado] = useState(false);

  const diferencia = efectivoEnCaja ? Number(efectivoEnCaja) - efectivoTotal : null;
  const dateObj = new Date(date);
  const dateLabel = dateObj.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-pink-500/10 p-3 rounded-2xl border border-pink-500/20">
              <ShoppingCart className="h-7 w-7 text-pink-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-neutral-900 dark:text-white">Corte de Caja</h1>
              <p className="text-neutral-500 text-sm capitalize">{dateLabel}</p>
            </div>
          </div>
        </div>

        {/* RESUMEN DEL DÍA */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm space-y-4">
          <h2 className="font-black text-neutral-900 dark:text-white">Resumen del Turno</h2>

          <div className="flex items-center justify-between py-4 border-b border-neutral-100 dark:border-neutral-800">
            <span className="text-neutral-600 dark:text-neutral-400 font-medium">Total de transacciones</span>
            <span className="font-black text-xl text-neutral-900 dark:text-white">{ordersCount}</span>
          </div>

          {Object.entries(byMethod).map(([code, data]) => {
            const meta = PAY_LABEL[code] ?? { label: code, icon: DollarSign, color: 'text-neutral-500' };
            const Icon = meta.icon;
            return (
              <div key={code} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className={`h-5 w-5 ${meta.color}`} />
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">{meta.label}</span>
                  <span className="text-xs text-neutral-400">({data.count} ventas)</span>
                </div>
                <span className="font-black font-mono text-neutral-900 dark:text-white">{fmt(data.total)}</span>
              </div>
            );
          })}

          <div className="flex items-center justify-between py-4 border-t-2 border-neutral-200 dark:border-neutral-700 mt-2">
            <span className="font-black text-lg text-neutral-900 dark:text-white uppercase">TOTAL</span>
            <span className="font-black text-2xl text-neutral-900 dark:text-white font-mono">{fmt(grandTotal)}</span>
          </div>
        </div>

        {/* ARQUEO DE EFECTIVO */}
        {(byMethod['01']?.total ?? 0) > 0 && (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm space-y-4">
            <h2 className="font-black text-neutral-900 dark:text-white">Arqueo de Efectivo</h2>

            <div className="flex items-center justify-between">
              <span className="text-neutral-600 dark:text-neutral-400">Sistema indica</span>
              <span className="font-bold font-mono">{fmt(efectivoTotal)}</span>
            </div>

            <div>
              <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300 block mb-2">
                Efectivo contado en caja
              </label>
              <input
                type="number"
                value={efectivoEnCaja}
                onChange={e => setEfectivoEnCaja(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-right text-lg font-mono focus:outline-none focus:ring-2 focus:ring-pink-500 text-neutral-900 dark:text-white"
                min={0}
                step={0.01}
              />
            </div>

            {diferencia !== null && (
              <div className={`flex items-center justify-between p-4 rounded-2xl ${
                Math.abs(diferencia) < 0.01
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                  : diferencia > 0
                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}>
                <span className="font-bold text-sm">
                  {Math.abs(diferencia) < 0.01 ? '✓ Cuadra perfectamente'
                    : diferencia > 0 ? 'Sobrante en caja'
                    : 'Faltante en caja'}
                </span>
                <span className={`font-black font-mono ${
                  Math.abs(diferencia) < 0.01 ? 'text-emerald-600'
                    : diferencia > 0 ? 'text-blue-600'
                    : 'text-red-600'
                }`}>
                  {diferencia > 0 ? '+' : ''}{fmt(diferencia)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* CERRAR CORTE */}
        {!corteCerrado ? (
          <button
            onClick={() => setCorteCerrado(true)}
            className="w-full py-4 bg-pink-600 hover:bg-pink-700 text-white font-black rounded-2xl text-lg transition-all shadow-lg shadow-pink-500/20"
          >
            Cerrar Corte del Día
          </button>
        ) : (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-6 rounded-3xl text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
            <p className="font-black text-xl text-emerald-700 dark:text-emerald-400">Corte Cerrado</p>
            <p className="text-emerald-600 dark:text-emerald-500 text-sm mt-1">Total: {fmt(grandTotal)}</p>
          </div>
        )}

      </div>
    </div>
  );
}
