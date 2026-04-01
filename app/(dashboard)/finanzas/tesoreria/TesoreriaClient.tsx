'use client';

/**
 * CIFRA — Tesorería Client Component
 * Tabs: Posición de Efectivo | Movimientos | Caja Chica | Conciliación
 */

import { useState, useTransition, useCallback } from 'react';
import {
  Landmark, ArrowUpCircle, ArrowDownCircle, TrendingUp,
  Plus, Eye, CheckCircle2, Clock, AlertTriangle,
  Filter, RefreshCw, X, Loader2, Wallet, CreditCard,
  ChevronRight, Receipt, RotateCcw, BadgeCheck, Ban,
  ArrowLeftRight, Building2, FileText,
} from 'lucide-react';
import {
  createBankAccount,
  createTreasuryTransaction,
  reconcileTransaction,
  createPettyCashExpense,
  requestReplenishment,
  approvePettyCashExpense,
  getPettyCashExpenses,
} from './actions';
import {
  type TreasurySummary,
  type TreasuryTransactionRow,
  type PettyCashFundRow,
  type PettyCashExpenseRow,
  TREASURY_CATEGORIES,
  PETTY_CASH_CATEGORIES,
  ACCOUNT_TYPES,
} from './types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function maskClabe(clabe: string | null) {
  if (!clabe) return '—';
  return clabe.slice(0, 6) + ' **** **** ' + clabe.slice(-4);
}

type TabId = 'posicion' | 'movimientos' | 'caja-chica' | 'conciliacion';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  summary: TreasurySummary;
  transactions: TreasuryTransactionRow[];
  pettyCashFunds: PettyCashFundRow[];
}

// ─── Badges ───────────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    INGRESO:      { label: 'Ingreso',      cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' },
    EGRESO:       { label: 'Egreso',       cls: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400' },
    TRANSFERENCIA:{ label: 'Transferencia',cls: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400' },
    INVERSION:    { label: 'Inversión',    cls: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400' },
  };
  const { label, cls } = map[type] ?? { label: type, cls: 'bg-neutral-100 text-neutral-600' };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${cls}`}>
      {label}
    </span>
  );
}

function StatusBadge({ reconciled }: { reconciled: boolean }) {
  return reconciled ? (
    <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
      <CheckCircle2 className="h-3 w-3" /> Conciliado
    </span>
  ) : (
    <span className="flex items-center gap-1 text-[10px] font-black text-amber-600 dark:text-amber-400">
      <Clock className="h-3 w-3" /> Pendiente
    </span>
  );
}

function ExpenseStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    PENDIENTE:  { label: 'Pendiente',  cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',   icon: <Clock className="h-3 w-3" /> },
    APROBADO:   { label: 'Aprobado',   cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400', icon: <BadgeCheck className="h-3 w-3" /> },
    RECHAZADO:  { label: 'Rechazado',  cls: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',           icon: <Ban className="h-3 w-3" /> },
  };
  const { label, cls, icon } = map[status] ?? { label: status, cls: '', icon: null };
  return (
    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${cls}`}>
      {icon} {label}
    </span>
  );
}

// ─── Modal genérico ───────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-black text-lg text-neutral-900 dark:text-white">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function TesoreriaClient({ summary, transactions, pettyCashFunds }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('posicion');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ── Local state (optimistic data) ──
  const [accounts, setAccounts] = useState(summary.accounts);
  const [txList, setTxList] = useState<TreasuryTransactionRow[]>(transactions);
  const [funds, setFunds] = useState<PettyCashFundRow[]>(pettyCashFunds);
  const [summaryState, setSummaryState] = useState(summary);

  // ── Filtros de movimientos ──
  const [filterAccountId, setFilterAccountId] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // ── Modales ──
  const [showNewAccount, setShowNewAccount] = useState(false);
  const [showNewTx, setShowNewTx] = useState(false);
  const [showNewExpense, setShowNewExpense] = useState<string | null>(null); // fundId
  const [showReplenishment, setShowReplenishment] = useState<string | null>(null); // fundId
  const [expandedFund, setExpandedFund] = useState<string | null>(null);
  const [fundExpenses, setFundExpenses] = useState<Record<string, PettyCashExpenseRow[]>>({});

  // ── Formularios ──
  const [accountForm, setAccountForm] = useState({
    bankName: '', alias: '', accountNumber: '', clabe: '',
    currency: 'MXN', accountType: 'CHEQUES', currentBalance: '', notes: '',
  });
  const [txForm, setTxForm] = useState({
    bankAccountId: '', date: new Date().toISOString().split('T')[0],
    concept: '', type: 'EGRESO', amount: '', reference: '', category: '',
  });
  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().split('T')[0],
    concept: '', amount: '', category: 'Otros', costCenter: '', receiptRef: '',
  });
  const [replenishmentForm, setReplenishmentForm] = useState({ amount: '', notes: '' });

  // ── Feedback helpers ──
  const toast = useCallback((msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccessMsg(null); }
    else { setSuccessMsg(msg); setError(null); }
    setTimeout(() => { setError(null); setSuccessMsg(null); }, 4000);
  }, []);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createBankAccount({
        bankName: accountForm.bankName,
        alias: accountForm.alias,
        accountNumber: accountForm.accountNumber,
        clabe: accountForm.clabe || undefined,
        currency: accountForm.currency,
        accountType: accountForm.accountType,
        currentBalance: parseFloat(accountForm.currentBalance) || 0,
        notes: accountForm.notes || undefined,
      });
      if (res.ok) {
        setShowNewAccount(false);
        setAccountForm({ bankName: '', alias: '', accountNumber: '', clabe: '', currency: 'MXN', accountType: 'CHEQUES', currentBalance: '', notes: '' });
        toast('Cuenta bancaria creada correctamente');
        // Refresh accounts by re-fetching summary (server data will update on next page load)
        window.location.reload();
      } else {
        toast(res.error ?? 'Error desconocido', true);
      }
    });
  }

  function handleCreateTx(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createTreasuryTransaction({
        bankAccountId: txForm.bankAccountId,
        date: txForm.date,
        concept: txForm.concept,
        type: txForm.type,
        amount: parseFloat(txForm.amount),
        reference: txForm.reference || undefined,
        category: txForm.category || undefined,
      });
      if (res.ok) {
        setShowNewTx(false);
        setTxForm({ bankAccountId: '', date: new Date().toISOString().split('T')[0], concept: '', type: 'EGRESO', amount: '', reference: '', category: '' });
        toast('Movimiento registrado correctamente');
        window.location.reload();
      } else {
        toast(res.error ?? 'Error desconocido', true);
      }
    });
  }

  function handleReconcile(id: string) {
    startTransition(async () => {
      const res = await reconcileTransaction(id);
      if (res.ok) {
        setTxList((prev) => prev.map((t) => t.id === id ? { ...t, isReconciled: true } : t));
        toast('Movimiento conciliado');
      } else {
        toast(res.error ?? 'Error desconocido', true);
      }
    });
  }

  function handleCreateExpense(e: React.FormEvent, fundId: string) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createPettyCashExpense({
        fundId,
        date: expenseForm.date,
        concept: expenseForm.concept,
        amount: parseFloat(expenseForm.amount),
        category: expenseForm.category,
        costCenter: expenseForm.costCenter || undefined,
        receiptRef: expenseForm.receiptRef || undefined,
      });
      if (res.ok) {
        setShowNewExpense(null);
        setExpenseForm({ date: new Date().toISOString().split('T')[0], concept: '', amount: '', category: 'Otros', costCenter: '', receiptRef: '' });
        toast('Gasto registrado correctamente');
        // Reload expenses for this fund
        loadFundExpenses(fundId);
        window.location.reload();
      } else {
        toast(res.error ?? 'Error desconocido', true);
      }
    });
  }

  function handleRequestReplenishment(e: React.FormEvent, fundId: string) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await requestReplenishment(
        fundId,
        parseFloat(replenishmentForm.amount),
        replenishmentForm.notes || undefined
      );
      if (res.ok) {
        setShowReplenishment(null);
        setReplenishmentForm({ amount: '', notes: '' });
        toast('Solicitud de reposición enviada');
      } else {
        toast(res.error ?? 'Error desconocido', true);
      }
    });
  }

  function handleApproveExpense(id: string, status: 'APROBADO' | 'RECHAZADO', fundId: string) {
    startTransition(async () => {
      const res = await approvePettyCashExpense(id, status);
      if (res.ok) {
        setFundExpenses((prev) => ({
          ...prev,
          [fundId]: (prev[fundId] ?? []).map((ex) =>
            ex.id === id ? { ...ex, status } : ex
          ),
        }));
        toast(status === 'APROBADO' ? 'Gasto aprobado' : 'Gasto rechazado');
      } else {
        toast(res.error ?? 'Error desconocido', true);
      }
    });
  }

  async function loadFundExpenses(fundId: string) {
    const expenses = await getPettyCashExpenses(fundId);
    setFundExpenses((prev) => ({ ...prev, [fundId]: expenses }));
  }

  function toggleFundExpenses(fundId: string) {
    if (expandedFund === fundId) {
      setExpandedFund(null);
    } else {
      setExpandedFund(fundId);
      if (!fundExpenses[fundId]) {
        loadFundExpenses(fundId);
      }
    }
  }

  // ── Filtros aplicados ──
  const filteredTx = txList.filter((t) => {
    if (filterAccountId && t.bankAccountId !== filterAccountId) return false;
    if (filterType && t.type !== filterType) return false;
    if (filterCategory && t.category !== filterCategory) return false;
    if (filterDateFrom && t.date < filterDateFrom) return false;
    if (filterDateTo && t.date > filterDateTo + 'T23:59:59') return false;
    return true;
  });

  const pendingTx = txList.filter((t) => !t.isReconciled);
  const reconciledTx = txList.filter((t) => t.isReconciled);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8 transition-colors">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* ── HEADER ── */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20">
              <Landmark className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">Tesorería</h1>
              <p className="text-neutral-500 font-medium text-sm mt-1">
                Posición de efectivo · Movimientos bancarios · Caja chica · Conciliación
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowNewAccount(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition-all text-sm shadow-lg shadow-emerald-600/20"
            >
              <Plus className="h-4 w-4" /> Nueva Cuenta
            </button>
            <button
              onClick={() => { setShowNewTx(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all text-sm border border-neutral-200 dark:border-neutral-700"
            >
              <ArrowLeftRight className="h-4 w-4" /> Registrar Movimiento
            </button>
          </div>
        </header>

        {/* ── FEEDBACK ── */}
        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl px-5 py-4 flex items-center gap-3 text-sm font-medium text-red-700 dark:text-red-400">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" /> {error}
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl px-5 py-4 flex items-center gap-3 text-sm font-medium text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> {successMsg}
          </div>
        )}

        {/* ── TABS ── */}
        <div className="flex overflow-x-auto gap-2 pb-1">
          {([
            { id: 'posicion',      label: 'Posición de Efectivo', icon: Wallet },
            { id: 'movimientos',   label: 'Movimientos',           icon: ArrowLeftRight },
            { id: 'caja-chica',   label: 'Caja Chica',            icon: Receipt },
            { id: 'conciliacion', label: 'Conciliación',           icon: CheckCircle2 },
          ] as { id: TabId; label: string; icon: React.ElementType }[]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-white dark:bg-neutral-900 text-neutral-500 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
              }`}
            >
              <tab.icon className="h-4 w-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 1: POSICIÓN DE EFECTIVO
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'posicion' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: 'Total en cuentas',
                  value: fmt(summaryState.totalBalance),
                  icon: Building2,
                  color: 'emerald',
                  sub: `${accounts.length} cuenta${accounts.length !== 1 ? 's' : ''} activa${accounts.length !== 1 ? 's' : ''}`,
                },
                {
                  label: 'Ingresos del mes',
                  value: fmt(summaryState.ingresosMes),
                  icon: ArrowUpCircle,
                  color: 'green',
                  sub: 'Mes en curso',
                },
                {
                  label: 'Egresos del mes',
                  value: fmt(summaryState.egresosMes),
                  icon: ArrowDownCircle,
                  color: 'red',
                  sub: 'Mes en curso',
                },
                {
                  label: 'Flujo neto',
                  value: fmt(summaryState.flujoNeto),
                  icon: TrendingUp,
                  color: summaryState.flujoNeto >= 0 ? 'emerald' : 'red',
                  sub: summaryState.flujoNeto >= 0 ? 'Positivo' : 'Negativo',
                },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">{kpi.label}</p>
                      <p className={`text-2xl font-black ${
                        kpi.color === 'red' ? 'text-red-600 dark:text-red-400' :
                        kpi.color === 'emerald' || kpi.color === 'green' ? 'text-emerald-600 dark:text-emerald-400' :
                        'text-neutral-900 dark:text-white'
                      }`}>{kpi.value}</p>
                      <p className="text-[10px] text-neutral-400 mt-1">{kpi.sub}</p>
                    </div>
                    <div className={`p-2.5 rounded-xl ${
                      kpi.color === 'red' ? 'bg-red-100 dark:bg-red-500/10' : 'bg-emerald-100 dark:bg-emerald-500/10'
                    }`}>
                      <kpi.icon className={`h-5 w-5 ${
                        kpi.color === 'red' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tabla de cuentas */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <h2 className="font-black text-neutral-900 dark:text-white">Cuentas Bancarias</h2>
                <button
                  onClick={() => setShowNewAccount(true)}
                  className="flex items-center gap-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" /> Nueva Cuenta Bancaria
                </button>
              </div>

              {accounts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <Building2 className="h-12 w-12 text-neutral-200 dark:text-neutral-700 mb-3" />
                  <p className="font-bold text-neutral-500 mb-1">Sin cuentas registradas</p>
                  <p className="text-sm text-neutral-400">Agrega tu primera cuenta bancaria para empezar a controlar tu tesorería.</p>
                  <button
                    onClick={() => setShowNewAccount(true)}
                    className="mt-4 flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-sm"
                  >
                    <Plus className="h-4 w-4" /> Agregar cuenta
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead>
                      <tr className="bg-neutral-50 dark:bg-black/40 text-[10px] uppercase text-neutral-500 tracking-widest font-black border-b border-neutral-100 dark:border-neutral-800">
                        <th className="px-6 py-3">Banco / Alias</th>
                        <th className="px-6 py-3">Tipo</th>
                        <th className="px-6 py-3">CLABE</th>
                        <th className="px-6 py-3">Moneda</th>
                        <th className="px-6 py-3 text-right">Saldo actual</th>
                        <th className="px-6 py-3 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                      {accounts.map((acc) => (
                        <tr key={acc.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-neutral-900 dark:text-white">{acc.bankName}</p>
                            <p className="text-[11px] text-neutral-400 mt-0.5">{acc.alias}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-[10px] font-black rounded uppercase tracking-wider">
                              {acc.accountType}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-neutral-500">
                            {maskClabe(acc.clabe)}
                          </td>
                          <td className="px-6 py-4 text-neutral-500 text-xs font-bold">{acc.currency}</td>
                          <td className="px-6 py-4 text-right">
                            <span className={`font-black text-base ${acc.currentBalance < 0 ? 'text-red-600 dark:text-red-400' : 'text-neutral-900 dark:text-white'}`}>
                              {fmt(acc.currentBalance)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => {
                                setTxForm((f) => ({ ...f, bankAccountId: acc.id }));
                                setActiveTab('movimientos');
                              }}
                              className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline mx-auto"
                            >
                              <Eye className="h-3.5 w-3.5" /> Movimientos
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-black/40">
                        <td colSpan={4} className="px-6 py-3 text-xs font-black text-neutral-500 uppercase tracking-wider">
                          Total tesorería
                        </td>
                        <td className="px-6 py-3 text-right font-black text-emerald-600 dark:text-emerald-400">
                          {fmt(summaryState.totalBalance)}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 2: MOVIMIENTOS
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'movimientos' && (
          <div className="space-y-5">
            {/* Filtros */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="h-4 w-4 text-neutral-400" />
                <span className="text-xs font-black text-neutral-500 uppercase tracking-wider">Filtros</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 mb-1">Desde</label>
                  <input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 mb-1">Hasta</label>
                  <input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 mb-1">Cuenta</label>
                  <select
                    value={filterAccountId}
                    onChange={(e) => setFilterAccountId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-900 dark:text-white"
                  >
                    <option value="">Todas</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.alias} — {a.bankName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 mb-1">Tipo</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-900 dark:text-white"
                  >
                    <option value="">Todos</option>
                    <option value="INGRESO">Ingreso</option>
                    <option value="EGRESO">Egreso</option>
                    <option value="TRANSFERENCIA">Transferencia</option>
                    <option value="INVERSION">Inversión</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 mb-1">Categoría</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-900 dark:text-white"
                  >
                    <option value="">Todas</option>
                    {TREASURY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              {(filterAccountId || filterType || filterCategory || filterDateFrom || filterDateTo) && (
                <button
                  onClick={() => { setFilterAccountId(''); setFilterType(''); setFilterCategory(''); setFilterDateFrom(''); setFilterDateTo(''); }}
                  className="mt-2 text-xs font-bold text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 flex items-center gap-1"
                >
                  <RotateCcw className="h-3 w-3" /> Limpiar filtros
                </button>
              )}
            </div>

            {/* Tabla de movimientos */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <div>
                  <h2 className="font-black text-neutral-900 dark:text-white">Movimientos Bancarios</h2>
                  <p className="text-xs text-neutral-400 mt-0.5">{filteredTx.length} registros</p>
                </div>
                <button
                  onClick={() => setShowNewTx(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition-all"
                >
                  <Plus className="h-3.5 w-3.5" /> Registrar Movimiento
                </button>
              </div>

              {filteredTx.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <ArrowLeftRight className="h-12 w-12 text-neutral-200 dark:text-neutral-700 mb-3" />
                  <p className="font-bold text-neutral-500 mb-1">Sin movimientos</p>
                  <p className="text-sm text-neutral-400">No hay movimientos que coincidan con los filtros seleccionados.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead>
                      <tr className="bg-neutral-50 dark:bg-black/40 text-[10px] uppercase text-neutral-500 tracking-widest font-black border-b border-neutral-100 dark:border-neutral-800">
                        <th className="px-6 py-3">Fecha</th>
                        <th className="px-6 py-3">Cuenta</th>
                        <th className="px-6 py-3">Concepto</th>
                        <th className="px-6 py-3">Categoría</th>
                        <th className="px-6 py-3">Tipo</th>
                        <th className="px-6 py-3 text-right">Importe</th>
                        <th className="px-6 py-3 text-right">Saldo</th>
                        <th className="px-6 py-3 text-center">Conciliado</th>
                        <th className="px-6 py-3">Factura</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                      {filteredTx.map((tx) => (
                        <tr key={tx.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                          <td className="px-6 py-3 text-xs text-neutral-500 font-mono">
                            {fmtDate(tx.date)}
                          </td>
                          <td className="px-6 py-3">
                            <p className="text-xs font-bold text-neutral-900 dark:text-white">{tx.bankAlias}</p>
                            <p className="text-[10px] text-neutral-400">{tx.bankName}</p>
                          </td>
                          <td className="px-6 py-3">
                            <p className="font-medium text-neutral-900 dark:text-white max-w-[200px] truncate" title={tx.concept}>
                              {tx.concept}
                            </p>
                            {tx.reference && (
                              <p className="text-[10px] text-neutral-400 font-mono mt-0.5">Ref: {tx.reference}</p>
                            )}
                          </td>
                          <td className="px-6 py-3">
                            {tx.category ? (
                              <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-[10px] font-black rounded uppercase tracking-wider">
                                {tx.category}
                              </span>
                            ) : (
                              <span className="text-neutral-300 dark:text-neutral-600">—</span>
                            )}
                          </td>
                          <td className="px-6 py-3"><TypeBadge type={tx.type} /></td>
                          <td className="px-6 py-3 text-right">
                            <span className={`font-black ${tx.type === 'INGRESO' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                              {tx.type === 'INGRESO' ? '+' : '-'}{fmt(tx.amount)}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right font-mono text-xs text-neutral-600 dark:text-neutral-400">
                            {fmt(tx.balance)}
                          </td>
                          <td className="px-6 py-3 text-center">
                            <StatusBadge reconciled={tx.isReconciled} />
                          </td>
                          <td className="px-6 py-3 text-xs font-mono text-neutral-400">
                            {tx.invoiceId ? (
                              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                <FileText className="h-3 w-3" />
                                {tx.invoiceId.slice(0, 8)}…
                              </span>
                            ) : (
                              <span className="text-neutral-300 dark:text-neutral-600">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 3: CAJA CHICA
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'caja-chica' && (
          <div className="space-y-5">
            {funds.length === 0 ? (
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl flex flex-col items-center justify-center py-16 px-6 text-center">
                <Receipt className="h-12 w-12 text-neutral-200 dark:text-neutral-700 mb-3" />
                <p className="font-bold text-neutral-500 mb-1">Sin fondos de caja chica</p>
                <p className="text-sm text-neutral-400">Los fondos de caja chica se crean desde el módulo de Caja Chica.</p>
              </div>
            ) : (
              funds.map((fund) => (
                <div key={fund.id} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
                  {/* Card del fondo */}
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                            <Wallet className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div>
                            <h3 className="font-black text-lg text-neutral-900 dark:text-white">{fund.name}</h3>
                            {fund.custodianName && (
                              <p className="text-xs text-neutral-400">Custodio: {fund.custodianName}</p>
                            )}
                          </div>
                          {fund.requiereReposicion && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400 text-[10px] font-black rounded-full">
                              <AlertTriangle className="h-3 w-3" /> Requiere reposición
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => { setShowNewExpense(fund.id); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition-all"
                        >
                          <Plus className="h-3.5 w-3.5" /> Registrar Gasto
                        </button>
                        {fund.requiereReposicion && (
                          <button
                            onClick={() => {
                              setReplenishmentForm({ amount: String(Math.ceil(fund.fundAmount - fund.saldoDisponible)), notes: '' });
                              setShowReplenishment(fund.id);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl transition-all"
                          >
                            <RefreshCw className="h-3.5 w-3.5" /> Solicitar Reposición
                          </button>
                        )}
                        <button
                          onClick={() => toggleFundExpenses(fund.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold text-xs rounded-xl transition-all border border-neutral-200 dark:border-neutral-700"
                        >
                          <Eye className="h-3.5 w-3.5" /> Ver Gastos
                          <ChevronRight className={`h-3 w-3 transition-transform ${expandedFund === fund.id ? 'rotate-90' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* KPIs del fondo */}
                    <div className="grid grid-cols-3 gap-4 mt-5">
                      <div>
                        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-wider mb-1">Fondo autorizado</p>
                        <p className="text-xl font-black text-neutral-900 dark:text-white">{fmt(fund.fundAmount)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-wider mb-1">Gastos pendientes</p>
                        <p className="text-xl font-black text-red-600 dark:text-red-400">{fmt(fund.totalPendingExpenses)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-wider mb-1">Saldo disponible</p>
                        <p className={`text-xl font-black ${fund.requiereReposicion ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {fmt(fund.saldoDisponible)}
                        </p>
                      </div>
                    </div>

                    {/* Barra de uso */}
                    <div className="mt-4">
                      <div className="flex justify-between text-[10px] font-bold text-neutral-400 mb-1.5">
                        <span>Uso del fondo</span>
                        <span>{fund.fundAmount > 0 ? ((fund.totalPendingExpenses / fund.fundAmount) * 100).toFixed(1) : 0}%</span>
                      </div>
                      <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            fund.requiereReposicion ? 'bg-red-500' :
                            fund.totalPendingExpenses / fund.fundAmount > 0.6 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, fund.fundAmount > 0 ? (fund.totalPendingExpenses / fund.fundAmount) * 100 : 0)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tabla de gastos expandida */}
                  {expandedFund === fund.id && (
                    <div className="border-t border-neutral-100 dark:border-neutral-800">
                      {!fundExpenses[fund.id] ? (
                        <div className="flex items-center justify-center py-10">
                          <Loader2 className="h-6 w-6 animate-spin text-neutral-300" />
                        </div>
                      ) : fundExpenses[fund.id].length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                          <Receipt className="h-10 w-10 text-neutral-200 dark:text-neutral-700 mb-2" />
                          <p className="text-sm font-medium text-neutral-400">Sin gastos registrados en este fondo</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left whitespace-nowrap">
                            <thead>
                              <tr className="bg-neutral-50 dark:bg-black/40 text-[10px] uppercase text-neutral-500 tracking-widest font-black border-b border-neutral-100 dark:border-neutral-800">
                                <th className="px-6 py-3">Fecha</th>
                                <th className="px-6 py-3">Concepto</th>
                                <th className="px-6 py-3">Categoría</th>
                                <th className="px-6 py-3">CC</th>
                                <th className="px-6 py-3 text-right">Importe</th>
                                <th className="px-6 py-3">Comprobante</th>
                                <th className="px-6 py-3 text-center">Estado</th>
                                <th className="px-6 py-3 text-center">Acciones</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                              {fundExpenses[fund.id].map((exp) => (
                                <tr key={exp.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                                  <td className="px-6 py-3 text-xs text-neutral-500 font-mono">
                                    {fmtDate(exp.date)}
                                  </td>
                                  <td className="px-6 py-3 font-medium text-neutral-900 dark:text-white max-w-[180px]">
                                    <span className="truncate block" title={exp.concept}>{exp.concept}</span>
                                    {exp.providerRfc && (
                                      <span className="text-[10px] text-neutral-400 font-mono">{exp.providerRfc}</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-3">
                                    <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-[10px] font-black rounded">
                                      {exp.category}
                                    </span>
                                  </td>
                                  <td className="px-6 py-3 text-xs text-neutral-500">
                                    {exp.costCenter ?? '—'}
                                  </td>
                                  <td className="px-6 py-3 text-right font-black text-neutral-900 dark:text-white">
                                    {fmt(exp.amount)}
                                    {exp.amount > 2000 && (
                                      <span className="block text-[10px] text-amber-500 font-bold">No deducible</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-3 text-xs font-mono text-neutral-500">
                                    {exp.receiptRef ?? '—'}
                                    {exp.xmlValidated && (
                                      <span className="ml-1 text-emerald-500 font-bold">✓ XML</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-3 text-center">
                                    <ExpenseStatusBadge status={exp.status} />
                                  </td>
                                  <td className="px-6 py-3 text-center">
                                    {exp.status === 'PENDIENTE' && (
                                      <div className="flex items-center justify-center gap-1.5">
                                        <button
                                          onClick={() => handleApproveExpense(exp.id, 'APROBADO', fund.id)}
                                          disabled={isPending}
                                          className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                                          title="Aprobar"
                                        >
                                          <CheckCircle2 className="h-4 w-4" />
                                        </button>
                                        <button
                                          onClick={() => handleApproveExpense(exp.id, 'RECHAZADO', fund.id)}
                                          disabled={isPending}
                                          className="p-1 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                          title="Rechazar"
                                        >
                                          <Ban className="h-4 w-4" />
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 4: CONCILIACIÓN
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'conciliacion' && (
          <div className="space-y-5">
            {/* KPI de conciliación */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5">
                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">Total movimientos</p>
                <p className="text-2xl font-black text-neutral-900 dark:text-white">{txList.length}</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5">
                <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Conciliados</p>
                <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{reconciledTx.length}</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-800 rounded-2xl p-5">
                <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">Pendientes</p>
                <p className="text-2xl font-black text-amber-700 dark:text-amber-300">{pendingTx.length}</p>
              </div>
            </div>

            {/* Tabla de conciliación */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                <h2 className="font-black text-neutral-900 dark:text-white">Conciliación Bancaria</h2>
                <p className="text-xs text-neutral-400 mt-0.5">Compara los movimientos del sistema vs. extracto bancario</p>
              </div>

              {txList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <CheckCircle2 className="h-12 w-12 text-neutral-200 dark:text-neutral-700 mb-3" />
                  <p className="font-bold text-neutral-500 mb-1">Sin movimientos</p>
                  <p className="text-sm text-neutral-400">Registra movimientos bancarios para comenzar la conciliación.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead>
                      <tr className="bg-neutral-50 dark:bg-black/40 text-[10px] uppercase text-neutral-500 tracking-widest font-black border-b border-neutral-100 dark:border-neutral-800">
                        <th className="px-6 py-3">Fecha</th>
                        <th className="px-6 py-3">Cuenta</th>
                        <th className="px-6 py-3">Concepto</th>
                        <th className="px-6 py-3">Tipo</th>
                        <th className="px-6 py-3 text-right">Importe</th>
                        <th className="px-6 py-3 text-right">Saldo</th>
                        <th className="px-6 py-3 text-center">Estado</th>
                        <th className="px-6 py-3 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                      {txList.map((tx) => (
                        <tr
                          key={tx.id}
                          className={`hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors ${
                            tx.isReconciled ? 'opacity-60' : ''
                          }`}
                        >
                          <td className="px-6 py-3 text-xs font-mono text-neutral-500">{fmtDate(tx.date)}</td>
                          <td className="px-6 py-3 text-xs">
                            <span className="font-bold text-neutral-900 dark:text-white">{tx.bankAlias}</span>
                          </td>
                          <td className="px-6 py-3 font-medium text-neutral-900 dark:text-white max-w-[200px]">
                            <span className="truncate block" title={tx.concept}>{tx.concept}</span>
                          </td>
                          <td className="px-6 py-3"><TypeBadge type={tx.type} /></td>
                          <td className="px-6 py-3 text-right font-black text-neutral-900 dark:text-white">
                            {fmt(tx.amount)}
                          </td>
                          <td className="px-6 py-3 text-right font-mono text-xs text-neutral-500">
                            {fmt(tx.balance)}
                          </td>
                          <td className="px-6 py-3 text-center">
                            <StatusBadge reconciled={tx.isReconciled} />
                          </td>
                          <td className="px-6 py-3 text-center">
                            {!tx.isReconciled ? (
                              <button
                                onClick={() => handleReconcile(tx.id)}
                                disabled={isPending}
                                className="flex items-center gap-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400 hover:underline mx-auto disabled:opacity-50"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Marcar conciliado
                              </button>
                            ) : (
                              <span className="text-neutral-300 dark:text-neutral-600 text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          MODALES
      ══════════════════════════════════════════════════════════════════════════ */}

      {/* Modal: Nueva Cuenta Bancaria */}
      {showNewAccount && (
        <Modal title="Nueva Cuenta Bancaria" onClose={() => setShowNewAccount(false)}>
          <form onSubmit={handleCreateAccount} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                  Banco <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="BBVA, Santander..."
                  value={accountForm.bankName}
                  onChange={(e) => setAccountForm((f) => ({ ...f, bankName: e.target.value }))}
                  required
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                  Alias <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Cuenta principal..."
                  value={accountForm.alias}
                  onChange={(e) => setAccountForm((f) => ({ ...f, alias: e.target.value }))}
                  required
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                  Número de cuenta <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Últimos 4 dígitos"
                  value={accountForm.accountNumber}
                  onChange={(e) => setAccountForm((f) => ({ ...f, accountNumber: e.target.value }))}
                  required
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">CLABE</label>
                <input
                  type="text"
                  placeholder="18 dígitos"
                  maxLength={18}
                  value={accountForm.clabe}
                  onChange={(e) => setAccountForm((f) => ({ ...f, clabe: e.target.value }))}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">Tipo</label>
                <select
                  value={accountForm.accountType}
                  onChange={(e) => setAccountForm((f) => ({ ...f, accountType: e.target.value }))}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">Moneda</label>
                <select
                  value={accountForm.currency}
                  onChange={(e) => setAccountForm((f) => ({ ...f, currency: e.target.value }))}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="MXN">MXN</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">Saldo inicial</label>
                <input
                  type="number"
                  placeholder="0.00"
                  min={0} step={0.01}
                  value={accountForm.currentBalance}
                  onChange={(e) => setAccountForm((f) => ({ ...f, currentBalance: e.target.value }))}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">Notas</label>
              <input
                type="text"
                placeholder="Observaciones opcionales..."
                value={accountForm.notes}
                onChange={(e) => setAccountForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowNewAccount(false)} className="px-4 py-2 text-sm font-bold text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded-xl">Cancelar</button>
              <button type="submit" disabled={isPending} className="flex items-center gap-2 px-5 py-2 text-sm font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-50">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {isPending ? 'Guardando...' : 'Crear cuenta'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Registrar Movimiento */}
      {showNewTx && (
        <Modal title="Registrar Movimiento Bancario" onClose={() => setShowNewTx(false)}>
          {accounts.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-10 w-10 text-neutral-300 mx-auto mb-2" />
              <p className="text-neutral-500 text-sm">Primero debes crear al menos una cuenta bancaria.</p>
            </div>
          ) : (
            <form onSubmit={handleCreateTx} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                  Cuenta bancaria <span className="text-red-500">*</span>
                </label>
                <select
                  value={txForm.bankAccountId}
                  onChange={(e) => setTxForm((f) => ({ ...f, bankAccountId: e.target.value }))}
                  required
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="">Selecciona una cuenta...</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.alias} — {a.bankName} ({fmt(a.currentBalance)})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                    Fecha <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={txForm.date}
                    onChange={(e) => setTxForm((f) => ({ ...f, date: e.target.value }))}
                    required
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                    Tipo <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={txForm.type}
                    onChange={(e) => setTxForm((f) => ({ ...f, type: e.target.value }))}
                    required
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="INGRESO">Ingreso</option>
                    <option value="EGRESO">Egreso</option>
                    <option value="TRANSFERENCIA">Transferencia</option>
                    <option value="INVERSION">Inversión</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                  Concepto <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Descripción del movimiento"
                  value={txForm.concept}
                  onChange={(e) => setTxForm((f) => ({ ...f, concept: e.target.value }))}
                  required
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                    Importe <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    min={0.01} step={0.01}
                    value={txForm.amount}
                    onChange={(e) => setTxForm((f) => ({ ...f, amount: e.target.value }))}
                    required
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">Referencia</label>
                  <input
                    type="text"
                    placeholder="Núm. referencia bancaria"
                    value={txForm.reference}
                    onChange={(e) => setTxForm((f) => ({ ...f, reference: e.target.value }))}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">Categoría</label>
                <select
                  value={txForm.category}
                  onChange={(e) => setTxForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="">Sin categoría</option>
                  {TREASURY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {txForm.bankAccountId && txForm.amount && (
                <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-3 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  Nuevo saldo estimado: {' '}
                  <span className="font-black text-neutral-900 dark:text-white">
                    {fmt(
                      (accounts.find((a) => a.id === txForm.bankAccountId)?.currentBalance ?? 0) +
                      (txForm.type === 'INGRESO' ? 1 : -1) * (parseFloat(txForm.amount) || 0)
                    )}
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowNewTx(false)} className="px-4 py-2 text-sm font-bold text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded-xl">Cancelar</button>
                <button type="submit" disabled={isPending} className="flex items-center gap-2 px-5 py-2 text-sm font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-50">
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                  {isPending ? 'Registrando...' : 'Registrar movimiento'}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* Modal: Registrar Gasto Caja Chica */}
      {showNewExpense && (
        <Modal title="Registrar Gasto de Caja Chica" onClose={() => setShowNewExpense(null)}>
          <form onSubmit={(e) => handleCreateExpense(e, showNewExpense)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                  Fecha <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm((f) => ({ ...f, date: e.target.value }))}
                  required
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                  Importe <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  min={0.01} step={0.01}
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm((f) => ({ ...f, amount: e.target.value }))}
                  required
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                {expenseForm.amount && parseFloat(expenseForm.amount) > 2000 && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Gasto &gt;$2,000 no deducible (LISR Art. 27)
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                Concepto <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Descripción del gasto"
                value={expenseForm.concept}
                onChange={(e) => setExpenseForm((f) => ({ ...f, concept: e.target.value }))}
                required
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">Categoría</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {PETTY_CASH_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">Centro de costos</label>
                <input
                  type="text"
                  placeholder="Ej. RRHH, IT, Ventas"
                  value={expenseForm.costCenter}
                  onChange={(e) => setExpenseForm((f) => ({ ...f, costCenter: e.target.value }))}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">Folio de comprobante</label>
              <input
                type="text"
                placeholder="Ej. REC-2026-001"
                value={expenseForm.receiptRef}
                onChange={(e) => setExpenseForm((f) => ({ ...f, receiptRef: e.target.value }))}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowNewExpense(null)} className="px-4 py-2 text-sm font-bold text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded-xl">Cancelar</button>
              <button type="submit" disabled={isPending} className="flex items-center gap-2 px-5 py-2 text-sm font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-50">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
                {isPending ? 'Registrando...' : 'Registrar gasto'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Solicitar Reposición */}
      {showReplenishment && (
        <Modal title="Solicitar Reposición de Fondo" onClose={() => setShowReplenishment(null)}>
          <form onSubmit={(e) => handleRequestReplenishment(e, showReplenishment)} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                Monto a reponer <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                placeholder="0.00"
                min={0.01} step={0.01}
                value={replenishmentForm.amount}
                onChange={(e) => setReplenishmentForm((f) => ({ ...f, amount: e.target.value }))}
                required
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">Notas / Justificación</label>
              <textarea
                rows={3}
                placeholder="Motivo de la solicitud de reposición..."
                value={replenishmentForm.notes}
                onChange={(e) => setReplenishmentForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowReplenishment(null)} className="px-4 py-2 text-sm font-bold text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded-xl">Cancelar</button>
              <button type="submit" disabled={isPending} className="flex items-center gap-2 px-5 py-2 text-sm font-black text-white bg-amber-500 hover:bg-amber-600 rounded-xl disabled:opacity-50">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {isPending ? 'Enviando...' : 'Solicitar reposición'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
