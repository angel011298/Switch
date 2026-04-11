'use client';
import { useState } from 'react';
import { Building2, RefreshCw, Plus, CheckCircle2, AlertCircle, Banknote, X } from 'lucide-react';
import { createBankConnection } from './actions';

type Connection = {
  id: string;
  bank: string;
  alias: string | null;
  isActive: boolean;
  lastSyncAt: string | null;
  syncStatus: string;
};

type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: any;
  type: string;
  status: string;
  counterpartName: string | null;
};

type Props = {
  connections: Connection[];
  transactions: Transaction[];
};

const BANKS = ['BBVA', 'Santander', 'Banorte', 'HSBC', 'Banamex'];

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  INACTIVE: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
  ERROR: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const TX_STATUS_COLORS: Record<string, string> = {
  MATCHED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  UNMATCHED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  IGNORED: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
};

function formatAmount(amount: any, type: string): string {
  const n = typeof amount === 'object' && amount !== null ? Number(amount.toString()) : Number(amount);
  const fmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Math.abs(n));
  return fmt;
}

function formatDate(d: Date | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function BancaClient({ connections, transactions }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [bank, setBank] = useState('BBVA');
  const [alias, setAlias] = useState('');
  const [clabe, setClabe] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const unmatchedCount = transactions.filter(t => t.status === 'UNMATCHED').length;
  const lastSync = connections.reduce<Date | null>((latest, c) => {
    if (!c.lastSyncAt) return latest;
    const d = new Date(c.lastSyncAt);
    return !latest || d > latest ? d : latest;
  }, null);

  async function handleAddConnection() {
    if (!alias.trim()) { setError('El alias es obligatorio.'); return; }
    setLoading(true);
    setError('');
    try {
      await createBankConnection({ bank, alias: alias.trim(), clabe: clabe.trim() || undefined });
      setShowModal(false);
      setAlias('');
      setClabe('');
    } catch (e: any) {
      setError(e.message ?? 'Error al crear conexión.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-6 bg-neutral-50 dark:bg-neutral-900 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Conciliación Bancaria Automática</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Conecta tus cuentas y concilia movimientos automáticamente</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="h-4 w-4" />
          Conectar Banco
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Cuentas Conectadas</span>
          </div>
          <p className="text-3xl font-bold text-neutral-900 dark:text-white">{connections.length}</p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Sin Conciliar</span>
          </div>
          <p className="text-3xl font-bold text-neutral-900 dark:text-white">{unmatchedCount}</p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-3 mb-2">
            <RefreshCw className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Última Sincronización</span>
          </div>
          <p className="text-lg font-bold text-neutral-900 dark:text-white">{formatDate(lastSync)}</p>
        </div>
      </div>

      {/* Connections */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700">
        <div className="p-5 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Cuentas Bancarias</h2>
        </div>
        {connections.length === 0 ? (
          <div className="p-12 text-center">
            <Banknote className="h-12 w-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
            <p className="text-neutral-500 dark:text-neutral-400 font-medium mb-4">Conecta tu primer banco</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              <Plus className="h-4 w-4 inline mr-1" />
              Agregar Cuenta
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Banco</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Alias</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Estado</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Última Sync</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700/50">
                {connections.map(c => (
                  <tr key={c.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors">
                    <td className="px-5 py-3 font-semibold text-neutral-900 dark:text-white">{c.bank}</td>
                    <td className="px-5 py-3 text-neutral-600 dark:text-neutral-300">{c.alias ?? '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[c.isActive ? 'ACTIVE' : 'INACTIVE']}`}>
                        <CheckCircle2 className="h-3 w-3" />
                        {c.isActive ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-neutral-500 dark:text-neutral-400">{formatDate(c.lastSyncAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transactions */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700">
        <div className="p-5 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Movimientos Recientes (últimos 30 días)</h2>
        </div>
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-neutral-500 dark:text-neutral-400">
            No hay movimientos en el período seleccionado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Fecha</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Descripción</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Contraparte</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Monto</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700/50">
                {transactions.map(t => {
                  const isCredit = t.type === 'CREDIT' || t.type === 'INGRESO';
                  return (
                    <tr key={t.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors">
                      <td className="px-5 py-3 text-neutral-600 dark:text-neutral-300 whitespace-nowrap">{formatDate(t.date)}</td>
                      <td className="px-5 py-3 text-neutral-800 dark:text-neutral-200 max-w-xs truncate">{t.description}</td>
                      <td className="px-5 py-3 text-neutral-500 dark:text-neutral-400">{t.counterpartName ?? '—'}</td>
                      <td className={`px-5 py-3 text-right font-semibold ${isCredit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {isCredit ? '+' : '-'}{formatAmount(t.amount, t.type)}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${TX_STATUS_COLORS[t.status] ?? 'bg-neutral-100 text-neutral-600'}`}>
                          {t.status === 'MATCHED' ? 'Conciliado' : t.status === 'UNMATCHED' ? 'Sin Conciliar' : t.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Conectar Cuenta Bancaria</h3>
              <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Banco</label>
                <select
                  value={bank}
                  onChange={e => setBank(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Alias</label>
                <input
                  type="text"
                  value={alias}
                  onChange={e => setAlias(e.target.value)}
                  placeholder="Ej. Cuenta Nómina BBVA"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">CLABE (opcional)</label>
                <input
                  type="text"
                  value={clabe}
                  onChange={e => setClabe(e.target.value)}
                  placeholder="18 dígitos"
                  maxLength={18}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>
              )}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddConnection}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  {loading ? 'Guardando...' : 'Conectar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
