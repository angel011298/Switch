'use client';
import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Plus, DollarSign, X, CheckCircle2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { getCashFlowProjections, addCashFlowEntry } from './actions';

type Projection = {
  id: string;
  date: string;
  type: string;
  category: string;
  description: string;
  amount: number;
  isConfirmed: boolean;
};

type Invoice = {
  id: string;
  total: number;
  createdAt: string;
  status: string;
};

type Data = { projections: Projection[]; invoices: Invoice[] };

type Props = { initialData: Data };

type DayRange = 30 | 60 | 90;

const CATEGORIES = ['Ventas', 'Servicios', 'Nómina', 'Proveedores', 'Impuestos', 'Renta', 'Financiamiento', 'Otro'];

function toNumber(v: any): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'object' && typeof v.toString === 'function') return Number(v.toString());
  return Number(v);
}

function formatMXN(n: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
}

function formatDateShort(d: Date): string {
  return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
}

export default function CashFlowClient({ initialData }: Props) {
  const [data, setData] = useState<Data>(initialData);
  const [range, setRange] = useState<DayRange>(30);
  const [loadingRange, setLoadingRange] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [formDate, setFormDate] = useState('');
  const [formType, setFormType] = useState<'INGRESO' | 'EGRESO'>('INGRESO');
  const [formCategory, setFormCategory] = useState('Ventas');
  const [formDesc, setFormDesc] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formConfirmed, setFormConfirmed] = useState(false);

  async function handleRangeChange(r: DayRange) {
    setRange(r);
    setLoadingRange(true);
    try {
      const result = await getCashFlowProjections(r);
      setData(result);
    } finally {
      setLoadingRange(false);
    }
  }

  async function handleAddEntry() {
    if (!formDate || !formDesc.trim() || !formAmount) {
      setFormError('Completa todos los campos requeridos.');
      return;
    }
    const amount = parseFloat(formAmount);
    if (isNaN(amount) || amount <= 0) {
      setFormError('El monto debe ser un número positivo.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await addCashFlowEntry({
        date: formDate,
        type: formType,
        category: formCategory,
        description: formDesc.trim(),
        amount,
        isConfirmed: formConfirmed,
      });
      const updated = await getCashFlowProjections(range);
      setData(updated);
      setShowForm(false);
      setFormDate(''); setFormDesc(''); setFormAmount(''); setFormConfirmed(false);
    } catch (e: any) {
      setFormError(e.message ?? 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  }

  const projections = data.projections;

  const totalIngresos = useMemo(
    () => projections.filter(p => p.type === 'INGRESO').reduce((s, p) => s + toNumber(p.amount), 0),
    [projections]
  );
  const totalEgresos = useMemo(
    () => projections.filter(p => p.type === 'EGRESO').reduce((s, p) => s + toNumber(p.amount), 0),
    [projections]
  );
  const saldoProyectado = totalIngresos - totalEgresos;

  // Chart data: group by date
  const chartData = useMemo(() => {
    const map: Record<string, { date: string; ingresos: number; egresos: number }> = {};
    projections.forEach(p => {
      const key = new Date(p.date).toISOString().slice(0, 10);
      if (!map[key]) map[key] = { date: key, ingresos: 0, egresos: 0 };
      if (p.type === 'INGRESO') map[key].ingresos += toNumber(p.amount);
      else map[key].egresos += toNumber(p.amount);
    });
    return Object.values(map).slice(0, 30).map(d => ({
      ...d,
      date: new Date(d.date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
    }));
  }, [projections]);

  return (
    <div className="p-6 space-y-6 bg-neutral-50 dark:bg-neutral-900 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
            <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Flujo de Efectivo</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Proyección inteligente a 30/60/90 días</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Range selector */}
          <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1 gap-1">
            {([30, 60, 90] as DayRange[]).map(r => (
              <button
                key={r}
                onClick={() => handleRangeChange(r)}
                disabled={loadingRange}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  range === r
                    ? 'bg-white dark:bg-neutral-700 text-green-600 dark:text-green-400 shadow-sm'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                }`}
              >
                {r}d
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <Plus className="h-4 w-4" />
            Agregar Movimiento
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Saldo Proyectado</span>
          </div>
          <p className={`text-2xl font-bold ${saldoProyectado >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {formatMXN(saldoProyectado)}
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Próximos Ingresos</span>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatMXN(totalIngresos)}</p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="h-5 w-5 text-red-500" />
            <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Próximos Egresos</span>
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatMXN(totalEgresos)}</p>
        </div>
      </div>

      {/* Inline form */}
      {showForm && (
        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-neutral-900 dark:text-white">Nuevo Movimiento</h3>
            <button onClick={() => setShowForm(false)} className="text-neutral-400 hover:text-neutral-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Fecha *</label>
              <input
                type="date"
                value={formDate}
                onChange={e => setFormDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Tipo *</label>
              <select
                value={formType}
                onChange={e => setFormType(e.target.value as 'INGRESO' | 'EGRESO')}
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="INGRESO">Ingreso</option>
                <option value="EGRESO">Egreso</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Categoría *</label>
              <select
                value={formCategory}
                onChange={e => setFormCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-green-500"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Descripción *</label>
              <input
                type="text"
                value={formDesc}
                onChange={e => setFormDesc(e.target.value)}
                placeholder="Ej. Cobro factura #INV-001"
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Monto (MXN) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formAmount}
                onChange={e => setFormAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-neutral-700 dark:text-neutral-300">
              <input
                type="checkbox"
                checked={formConfirmed}
                onChange={e => setFormConfirmed(e.target.checked)}
                className="rounded"
              />
              Confirmado
            </label>
          </div>
          {formError && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{formError}</p>
          )}
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleAddEntry}
              disabled={saving}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-5">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white mb-4">Proyección por Fecha</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: number) => [formatMXN(value)]}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 12 }}
              />
              <Legend />
              <Bar dataKey="ingresos" name="Ingresos" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="egresos" name="Egresos" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700">
        <div className="p-5 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Movimientos Proyectados</h2>
        </div>
        {projections.length === 0 ? (
          <div className="p-10 text-center text-neutral-500 dark:text-neutral-400">
            No hay proyecciones para el período seleccionado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Fecha</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Descripción</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Categoría</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Monto</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Tipo</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Conf.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700/50">
                {projections.map(p => (
                  <tr key={p.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors">
                    <td className="px-5 py-3 text-neutral-600 dark:text-neutral-300 whitespace-nowrap">{formatDateShort(p.date)}</td>
                    <td className="px-5 py-3 text-neutral-800 dark:text-neutral-200 max-w-xs truncate">{p.description}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 text-xs font-medium">{p.category}</span>
                    </td>
                    <td className={`px-5 py-3 text-right font-semibold ${p.type === 'INGRESO' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {p.type === 'INGRESO' ? '+' : '-'}{formatMXN(toNumber(p.amount))}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        p.type === 'INGRESO'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {p.type === 'INGRESO' ? 'Ingreso' : 'Egreso'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      {p.isConfirmed
                        ? <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                        : <span className="text-neutral-300 dark:text-neutral-600">—</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
