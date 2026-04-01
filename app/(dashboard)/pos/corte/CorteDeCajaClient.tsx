'use client';

import { useState, useTransition } from 'react';
import { ShoppingCart, DollarSign, CreditCard, Smartphone, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { saveCashCut } from './actions';

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

const DENOMINATIONS = [
  { val: 1000, label: '$1,000', type: 'billete' },
  { val: 500, label: '$500', type: 'billete' },
  { val: 200, label: '$200', type: 'billete' },
  { val: 100, label: '$100', type: 'billete' },
  { val: 50, label: '$50', type: 'billete' },
  { val: 20, label: '$20', type: 'billete' },
  { val: 20, label: '$20', type: 'moneda' },
  { val: 10, label: '$10', type: 'moneda' },
  { val: 5, label: '$5', type: 'moneda' },
  { val: 2, label: '$2', type: 'moneda' },
  { val: 1, label: '$1', type: 'moneda' },
  { val: 0.5, label: '50¢', type: 'moneda' },
];

function fmt(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export default function CorteDeCajaClient({ grandTotal, efectivoTotal, byMethod, ordersCount, date }: Props) {
  const [isPending, startTransition] = useTransition();
  
  // Fases: 1 = Conteo Ciego, 2 = Resumen/Variación, 3 = Finalizado
  const [fase, setFase] = useState<1 | 2 | 3>(1);

  // Estado del conteo
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');

  const dateObj = new Date(date);
  const dateLabel = dateObj.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Calcular total declarado sumando todas las denominaciones
  const declaredTotal = DENOMINATIONS.reduce((sum, den) => {
    const key = `${den.val}_${den.type}`;
    const amount = counts[key] || 0;
    return sum + (amount * den.val);
  }, 0);

  const variation = declaredTotal - efectivoTotal;
  const isAnomaly = Math.abs(variation) > 10;

  const handleUpdateCount = (val: number, type: string, qtyStr: string) => {
    const qty = parseInt(qtyStr, 10);
    const key = `${val}_${type}`;
    setCounts(prev => ({
      ...prev,
      [key]: isNaN(qty) || qty < 0 ? 0 : qty
    }));
  };

  const handleFinishCount = () => {
    setFase(2);
  };

  const handleSaveCut = () => {
    if (isAnomaly && !notes.trim()) {
      alert('Debe justificar la diferencia para continuar.');
      return;
    }

    startTransition(async () => {
      // Formatear denominaciones para la BD
      const denomsRecord: Record<string, number> = {};
      Object.keys(counts).forEach(key => {
        if (counts[key] > 0) {
          denomsRecord[key] = counts[key];
        }
      });

      const res = await saveCashCut({
        denominations: denomsRecord,
        declaredAmount: declaredTotal,
        notes: isAnomaly ? notes : undefined
      });

      if (res.ok) {
        setFase(3);
      } else {
        alert(res.error || 'Error al guardar el corte');
      }
    });
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8 transition-colors">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-pink-500/10 p-3 rounded-2xl border border-pink-500/20">
              <ShoppingCart className="h-7 w-7 text-pink-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">Corte de Caja</h1>
              <p className="text-neutral-500 font-medium text-sm capitalize mt-0.5">{dateLabel}</p>
            </div>
          </div>
          {fase !== 3 && (
            <div className="flex gap-2">
              <div className={`h-2 w-8 rounded-full ${fase >= 1 ? 'bg-pink-500' : 'bg-neutral-200 dark:bg-neutral-800'}`} />
              <div className={`h-2 w-8 rounded-full ${fase >= 2 ? 'bg-pink-500' : 'bg-neutral-200 dark:bg-neutral-800'}`} />
              <div className={`h-2 w-8 rounded-full ${fase >= 3 ? 'bg-pink-500' : 'bg-neutral-200 dark:bg-neutral-800'}`} />
            </div>
          )}
        </div>

        {/* FASE 1: CONTEO CIEGO */}
        {fase === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="md:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
              <h2 className="text-lg font-black text-neutral-900 dark:text-white mb-6">Declaración de Efectivo (Conteo Ciego)</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {/* Billetes */}
                <div>
                  <h3 className="text-xs font-black text-neutral-500 uppercase tracking-widest mb-4 border-b border-neutral-100 dark:border-neutral-800 pb-2">Billetes</h3>
                  <div className="space-y-3">
                    {DENOMINATIONS.filter(d => d.type === 'billete').map(d => (
                      <div key={`billete-${d.val}`} className="flex items-center gap-3">
                        <span className="w-16 font-mono font-bold text-gray-700 dark:text-gray-300 bg-neutral-100 dark:bg-neutral-800 py-1.5 px-2 rounded-lg text-center text-sm border border-neutral-200 dark:border-neutral-700">
                          {d.label}
                        </span>
                        <span className="text-neutral-400 font-black text-sm">x</span>
                        <input
                          type="number" min="0" step="1"
                          placeholder="0"
                          value={counts[`${d.val}_billete`] || ''}
                          onChange={(e) => handleUpdateCount(d.val, 'billete', e.target.value)}
                          className="w-20 px-3 py-1.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg text-center font-black focus:ring-2 focus:ring-pink-500 outline-none"
                        />
                        <span className="flex-1 text-right font-mono text-neutral-500 dark:text-neutral-400 text-sm">
                          {fmt((counts[`${d.val}_billete`] || 0) * d.val)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Monedas */}
                <div>
                  <h3 className="text-xs font-black text-neutral-500 uppercase tracking-widest mb-4 border-b border-neutral-100 dark:border-neutral-800 pb-2">Monedas</h3>
                  <div className="space-y-3">
                    {DENOMINATIONS.filter(d => d.type === 'moneda').map(d => (
                      <div key={`moneda-${d.val}`} className="flex items-center gap-3">
                        <span className="w-16 font-mono font-bold text-gray-700 dark:text-gray-300 bg-neutral-100 dark:bg-neutral-800 py-1.5 px-2 rounded-full text-center text-sm border border-neutral-200 dark:border-neutral-700">
                          {d.label}
                        </span>
                        <span className="text-neutral-400 font-black text-sm">x</span>
                        <input
                          type="number" min="0" step="1"
                          placeholder="0"
                          value={counts[`${d.val}_moneda`] || ''}
                          onChange={(e) => handleUpdateCount(d.val, 'moneda', e.target.value)}
                          className="w-20 px-3 py-1.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg text-center font-black focus:ring-2 focus:ring-pink-500 outline-none"
                        />
                        <span className="flex-1 text-right font-mono text-neutral-500 dark:text-neutral-400 text-sm">
                          {fmt((counts[`${d.val}_moneda`] || 0) * d.val)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Fase 1 */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm text-center">
                <p className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">Total Contado</p>
                <p className="text-4xl font-mono font-black text-emerald-600 dark:text-emerald-400">{fmt(declaredTotal)}</p>
                <p className="text-xs font-medium text-neutral-400 mt-3">Sume el efectivo físico antes de continuar.</p>
              </div>

              <button
                onClick={handleFinishCount}
                className="w-full py-4 bg-neutral-900 dark:bg-white text-white dark:text-black font-black rounded-2xl text-lg hover:scale-[1.02] transition-transform shadow-xl"
              >
                Revisar Totales
              </button>
            </div>

          </div>
        )}

        {/* FASE 2: COMPARATIVO */}
        {fase === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Panel de Comparativo */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-8 rounded-3xl shadow-sm space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-black text-neutral-900 dark:text-white">Validación de Efectivo</h2>
                <button onClick={() => setFase(1)} className="text-sm font-bold text-neutral-400 hover:text-neutral-700 dark:hover:text-white underline">Atrás</button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                  <span className="text-neutral-600 dark:text-neutral-400 font-bold">Total Sistema (Esperado)</span>
                  <span className="text-2xl font-mono font-black text-neutral-900 dark:text-white">{fmt(efectivoTotal)}</span>
                </div>

                <div className="flex justify-between items-center p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                  <span className="text-neutral-600 dark:text-neutral-400 font-bold">Efectivo Contado</span>
                  <span className="text-2xl font-mono font-black text-neutral-900 dark:text-white">{fmt(declaredTotal)}</span>
                </div>

                <div className={`flex items-center justify-between p-5 rounded-2xl border-2 ${
                  !isAnomaly
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30'
                    : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30'
                }`}>
                  <div className="flex items-center gap-3">
                    {!isAnomaly ? <CheckCircle2 className="h-6 w-6 text-emerald-500" /> : <AlertTriangle className="h-6 w-6 text-red-500" />}
                    <span className={`font-black ${!isAnomaly ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                      {!isAnomaly ? 'Caja Cuadrada' : variation > 0 ? 'Sobrante detectado' : 'Faltante detectado'}
                    </span>
                  </div>
                  <span className={`text-2xl font-mono font-black ${!isAnomaly ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>
                    {variation > 0 ? '+' : ''}{fmt(variation)}
                  </span>
                </div>
              </div>

              {isAnomaly && (
                <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <label className="block text-sm font-black text-neutral-700 dark:text-neutral-300 mb-2">
                    Justificación requerida *
                  </label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Explique el motivo de la diferencia de caja..."
                    className="w-full text-sm p-4 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-red-500 outline-none resize-none h-24 font-medium"
                  />
                </div>
              )}

              <button
                onClick={handleSaveCut}
                disabled={isPending || (isAnomaly && !notes.trim())}
                className="w-full mt-4 py-4 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white font-black rounded-2xl text-lg transition-all shadow-lg shadow-pink-500/20"
              >
                {isPending ? 'Guardando Corte...' : 'Confirmar y Cerrar Caja'}
              </button>
            </div>

            {/* Resumen del Turno */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-8 rounded-3xl shadow-sm space-y-4">
              <h2 className="text-lg font-black text-neutral-900 dark:text-white mb-4">Ventas del Turno</h2>

              <div className="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-neutral-500 font-medium">Transacciones</span>
                <span className="font-bold">{ordersCount}</span>
              </div>

              {Object.entries(byMethod).map(([code, data]) => {
                const meta = PAY_LABEL[code] ?? { label: code, icon: DollarSign, color: 'text-neutral-500' };
                const Icon = meta.icon;
                return (
                  <div key={code} className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${meta.color}`} />
                      <span className="font-medium text-neutral-700 dark:text-neutral-300 text-sm">{meta.label}</span>
                    </div>
                    <span className="font-bold font-mono text-sm">{fmt(data.total)}</span>
                  </div>
                );
              })}

              <div className="flex justify-between py-4 mt-2 bg-neutral-50 dark:bg-neutral-800 rounded-xl px-4 border border-neutral-100 dark:border-neutral-700">
                <span className="font-black text-neutral-900 dark:text-white">Gran Total</span>
                <span className="font-black font-mono text-neutral-900 dark:text-white">{fmt(grandTotal)}</span>
              </div>
            </div>

          </div>
        )}

        {/* FASE 3: ÉXITO */}
        {fase === 3 && (
          <div className="max-w-md mx-auto mt-12 bg-white dark:bg-neutral-900 border border-emerald-200 dark:border-emerald-800/50 p-8 rounded-3xl shadow-2xl text-center space-y-6">
            <div className="inline-flex items-center justify-center p-4 bg-emerald-100 dark:bg-emerald-500/20 rounded-full mb-2">
              <CheckCircle2 className="h-16 w-16 text-emerald-500" />
            </div>
            
            <div>
              <h2 className="text-3xl font-black text-neutral-900 dark:text-white">Corte Cerrado</h2>
              <p className="text-neutral-500 font-medium mt-2">{dateLabel}</p>
            </div>

            <div className="space-y-3 py-6 border-y border-neutral-100 dark:border-neutral-800">
              <div className="flex justify-between">
                <span className="text-neutral-500">Venta Total</span>
                <span className="font-bold font-mono">{fmt(grandTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Declarado Efectivo</span>
                <span className="font-bold font-mono">{fmt(declaredTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Diferencia</span>
                <span className={`font-bold font-mono ${variation === 0 ? 'text-emerald-500' : variation > 0 ? 'text-blue-500' : 'text-red-500'}`}>
                  {variation > 0 ? '+' : ''}{fmt(variation)}
                </span>
              </div>
            </div>

            {isAnomaly && (
              <p className="text-xs text-amber-600 dark:text-amber-500 font-bold bg-amber-50 dark:bg-amber-500/10 p-3 rounded-xl border border-amber-200 dark:border-amber-500/20">
                La variación requiere aprobación de gerencia.
              </p>
            )}

            <button className="w-full flex justify-center items-center gap-2 py-3 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white font-bold rounded-xl transition-colors">
              <FileText className="h-4 w-4" />
              Imprimir Ticket de Corte
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
