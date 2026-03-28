'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ShoppingCart, Download, FileText, Search, Clock,
  CheckCircle2, XCircle, RefreshCw, Printer,
} from 'lucide-react';

interface OrderRow {
  id: string;
  ticketCode: string;
  orderNumber: number;
  status: string;
  paymentMethod: string;
  subtotal: number;
  totalTax: number;
  discount: number;
  total: number;
  amountPaid: number;
  changeDue: number;
  isInvoiced: boolean;
  createdAt: string;
  closedAt: string | null;
}

const PAY_METHOD: Record<string, string> = {
  '01': 'Efectivo',
  '03': 'Transferencia',
  '04': 'Tarjeta',
  '28': 'Débito',
  '29': 'Crédito',
  '99': 'Otro',
};

function fmt(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export default function PosHistorialClient({ initialOrders }: { initialOrders: OrderRow[] }) {
  const [search, setSearch] = useState('');
  const [filterPay, setFilterPay] = useState<string>('all');

  const filtered = initialOrders.filter(o => {
    const matchSearch = o.ticketCode.toLowerCase().includes(search.toLowerCase());
    const matchPay = filterPay === 'all' || o.paymentMethod === filterPay;
    return matchSearch && matchPay;
  });

  const totals = filtered.reduce((acc, o) => ({
    count: acc.count + 1,
    total: acc.total + o.total,
    efectivo: acc.efectivo + (o.paymentMethod === '01' ? o.total : 0),
    tarjeta: acc.tarjeta + (['04', '28', '29'].includes(o.paymentMethod) ? o.total : 0),
    transferencia: acc.transferencia + (o.paymentMethod === '03' ? o.total : 0),
  }), { count: 0, total: 0, efectivo: 0, tarjeta: 0, transferencia: 0 });

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-pink-500/10 p-3 rounded-2xl border border-pink-500/20">
              <ShoppingCart className="h-7 w-7 text-pink-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-neutral-950 dark:text-white">Historial de Ventas</h1>
              <p className="text-neutral-500 text-sm mt-1">Últimos 7 días · {totals.count} transacciones</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/pos" className="px-4 py-2 bg-pink-600 text-white font-bold rounded-xl text-sm hover:bg-pink-700 transition-all">
              Nueva Venta
            </Link>
            <Link href="/pos/corte" className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl text-sm hover:bg-neutral-200 transition-all">
              Corte de Caja
            </Link>
          </div>
        </header>

        {/* RESUMEN */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Ventas', value: fmt(totals.total), color: 'border-l-pink-500' },
            { label: 'Efectivo', value: fmt(totals.efectivo), color: 'border-l-emerald-500' },
            { label: 'Tarjeta', value: fmt(totals.tarjeta), color: 'border-l-blue-500' },
            { label: 'Transferencia', value: fmt(totals.transferencia), color: 'border-l-purple-500' },
          ].map(card => (
            <div key={card.label} className={`bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 border-l-4 ${card.color}`}>
              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{card.label}</p>
              <p className="text-xl font-black text-neutral-900 dark:text-white mt-1">{card.value}</p>
            </div>
          ))}
        </div>

        {/* FILTROS */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por folio..."
              className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 text-neutral-900 dark:text-white"
            />
          </div>
          <select
            value={filterPay}
            onChange={e => setFilterPay(e.target.value)}
            className="px-4 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="all">Todos los métodos</option>
            <option value="01">Efectivo</option>
            <option value="04">Tarjeta</option>
            <option value="03">Transferencia</option>
          </select>
        </div>

        {/* TABLA */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-50 dark:bg-black/50 text-[10px] uppercase text-neutral-500 tracking-widest font-black border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th className="p-4 text-left">Folio</th>
                  <th className="p-4 text-left">Fecha</th>
                  <th className="p-4 text-center">Pago</th>
                  <th className="p-4 text-right">Total</th>
                  <th className="p-4 text-center">CFDI</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-neutral-400">
                      <ShoppingCart className="h-10 w-10 mx-auto mb-3 text-neutral-300" />
                      No hay ventas en este período
                    </td>
                  </tr>
                ) : (
                  filtered.map(order => (
                    <tr key={order.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                      <td className="p-4">
                        <span className="font-mono font-bold text-neutral-900 dark:text-white text-xs bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">
                          {order.ticketCode}
                        </span>
                      </td>
                      <td className="p-4 text-neutral-600 dark:text-neutral-400 text-xs">
                        {new Date(order.createdAt).toLocaleString('es-MX', {
                          day: '2-digit', month: '2-digit',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-full">
                          {PAY_METHOD[order.paymentMethod] ?? order.paymentMethod}
                        </span>
                      </td>
                      <td className="p-4 text-right font-black font-mono text-neutral-900 dark:text-white">
                        {fmt(order.total)}
                      </td>
                      <td className="p-4 text-center">
                        {order.isInvoiced ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                        ) : (
                          <XCircle className="h-4 w-4 text-neutral-300 mx-auto" />
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          {/* Descargar ticket PDF */}
                          <a
                            href={`/api/pos/ticket/${order.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Descargar ticket"
                            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-700 transition-colors"
                          >
                            <Printer className="h-4 w-4" />
                          </a>
                          {/* Facturar si no tiene CFDI */}
                          {!order.isInvoiced && (
                            <Link
                              href={`/billing/nueva?posOrderId=${order.id}`}
                              title="Emitir CFDI"
                              className="p-1.5 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/20 text-neutral-400 hover:text-pink-600 transition-colors"
                            >
                              <FileText className="h-4 w-4" />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
