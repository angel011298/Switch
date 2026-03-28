'use client';

import { useState, useTransition } from 'react';
import {
  Truck,
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  ArrowRight,
  Plus,
  X,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';
import { createShipment, updateShipmentStatus, ShipmentRow } from './actions';
import { PurchaseOrderRow } from '../compras/actions';

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusFilter = 'ALL' | 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'RETURNED';

interface Props {
  initialShipments: ShipmentRow[];
  purchaseOrders: PurchaseOrderRow[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  PENDING:    'Pendiente',
  IN_TRANSIT: 'En tránsito',
  DELIVERED:  'Entregado',
  RETURNED:   'Devuelto',
};

const STATUS_BADGE: Record<string, string> = {
  PENDING:    'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
  IN_TRANSIT: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  DELIVERED:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  RETURNED:   'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
};

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Modal: Nuevo envío ───────────────────────────────────────────────────────

interface ModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (s: ShipmentRow) => void;
  purchaseOrders: PurchaseOrderRow[];
}

function NewShipmentModal({ open, onClose, onCreated, purchaseOrders }: ModalProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    carrier: '',
    trackingNumber: '',
    origin: '',
    destination: '',
    estimatedAt: '',
    purchaseOrderId: '',
    notes: '',
  });

  if (!open) return null;

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    startTransition(async () => {
      try {
        const id = await createShipment({
          carrier:         form.carrier || undefined,
          trackingNumber:  form.trackingNumber || undefined,
          origin:          form.origin || undefined,
          destination:     form.destination || undefined,
          estimatedAt:     form.estimatedAt || undefined,
          purchaseOrderId: form.purchaseOrderId || undefined,
          notes:           form.notes || undefined,
        });

        const po = purchaseOrders.find(o => o.id === form.purchaseOrderId);

        onCreated({
          id,
          carrier:             form.carrier || null,
          trackingNumber:      form.trackingNumber || null,
          origin:              form.origin || null,
          destination:         form.destination || null,
          estimatedAt:         form.estimatedAt ? new Date(form.estimatedAt).toISOString() : null,
          deliveredAt:         null,
          notes:               form.notes || null,
          purchaseOrderId:     form.purchaseOrderId || null,
          purchaseOrderNumber: po?.orderNumber ?? null,
          status:              'PENDING',
          createdAt:           new Date().toISOString(),
        });

        onClose();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al crear el envío');
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="bg-sky-500/10 p-2 rounded-xl border border-sky-500/20">
              <Truck className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            </div>
            <h2 className="text-lg font-black text-neutral-900 dark:text-white">Nuevo envío</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 text-sm font-bold px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
                Carrier / Paquetería
              </label>
              <input
                name="carrier"
                value={form.carrier}
                onChange={handleChange}
                placeholder="DHL, FedEx, Estafeta…"
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
                Número de rastreo
              </label>
              <input
                name="trackingNumber"
                value={form.trackingNumber}
                onChange={handleChange}
                placeholder="1Z999AA10123456784"
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
                Origen
              </label>
              <input
                name="origin"
                value={form.origin}
                onChange={handleChange}
                placeholder="Ciudad / Almacén"
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
                Destino
              </label>
              <input
                name="destination"
                value={form.destination}
                onChange={handleChange}
                placeholder="Ciudad / Cliente"
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
                Fecha estimada de entrega
              </label>
              <input
                type="date"
                name="estimatedAt"
                value={form.estimatedAt}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
                OC relacionada
              </label>
              <div className="relative">
                <select
                  name="purchaseOrderId"
                  value={form.purchaseOrderId}
                  onChange={handleChange}
                  className="w-full appearance-none px-3 py-2.5 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition pr-8"
                >
                  <option value="">Sin OC</option>
                  {purchaseOrders.map(o => (
                    <option key={o.id} value={o.id}>
                      OC-{o.orderNumber} — {o.supplierName ?? 'Sin proveedor'}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
              Notas
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={2}
              placeholder="Instrucciones especiales, referencias internas…"
              className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl text-sm hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white font-black rounded-xl text-sm transition-colors shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2"
            >
              {pending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Guardando…
                </span>
              ) : (
                <>
                  <Plus className="h-4 w-4" /> Crear envío
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Status update dropdown ───────────────────────────────────────────────────

function StatusDropdown({
  shipment,
  onUpdated,
}: {
  shipment: ShipmentRow;
  onUpdated: (id: string, status: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const transitions: { status: string; label: string }[] = [];
  if (shipment.status === 'PENDING')    transitions.push({ status: 'IN_TRANSIT', label: 'Marcar En tránsito' });
  if (shipment.status === 'IN_TRANSIT') transitions.push({ status: 'DELIVERED',  label: 'Marcar Entregado' });
  if (shipment.status === 'IN_TRANSIT') transitions.push({ status: 'RETURNED',   label: 'Marcar Devuelto' });
  if (shipment.status === 'DELIVERED' || shipment.status === 'RETURNED') return null;

  function handleSelect(status: string) {
    setOpen(false);
    startTransition(async () => {
      await updateShipmentStatus(shipment.id, status);
      onUpdated(shipment.id, status);
    });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        disabled={pending}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold rounded-lg text-xs transition-colors disabled:opacity-50"
      >
        {pending ? (
          <span className="h-3 w-3 border-2 border-neutral-400/30 border-t-neutral-500 rounded-full animate-spin" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
        Actualizar
      </button>

      {open && (
        <div className="absolute right-0 mt-1 z-20 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl overflow-hidden min-w-[170px]">
          {transitions.map(t => (
            <button
              key={t.status}
              onClick={() => handleSelect(t.status)}
              className="w-full text-left px-4 py-2.5 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────

export default function LogisticaClient({ initialShipments, purchaseOrders }: Props) {
  const [shipments, setShipments] = useState<ShipmentRow[]>(initialShipments);
  const [filter, setFilter]       = useState<StatusFilter>('ALL');
  const [showModal, setShowModal] = useState(false);

  // KPIs
  const pending    = shipments.filter(s => s.status === 'PENDING').length;
  const inTransit  = shipments.filter(s => s.status === 'IN_TRANSIT').length;
  const delivered  = shipments.filter(s => s.status === 'DELIVERED').length;
  const total      = shipments.length;

  // Filtered list
  const visible = filter === 'ALL' ? shipments : shipments.filter(s => s.status === filter);

  function handleCreated(s: ShipmentRow) {
    setShipments(prev => [s, ...prev]);
  }

  function handleUpdated(id: string, status: string) {
    setShipments(prev =>
      prev.map(s =>
        s.id === id
          ? { ...s, status, ...(status === 'DELIVERED' ? { deliveredAt: new Date().toISOString() } : {}) }
          : s
      )
    );
  }

  const FILTER_TABS: { id: StatusFilter; label: string; count: number }[] = [
    { id: 'ALL',        label: 'Todos',        count: total },
    { id: 'PENDING',    label: 'Pendientes',   count: pending },
    { id: 'IN_TRANSIT', label: 'En tránsito',  count: inTransit },
    { id: 'DELIVERED',  label: 'Entregados',   count: delivered },
    { id: 'RETURNED',   label: 'Devueltos',    count: shipments.filter(s => s.status === 'RETURNED').length },
  ];

  return (
    <>
      <NewShipmentModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreated={handleCreated}
        purchaseOrders={purchaseOrders}
      />

      <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8 transition-colors duration-300">
        <div className="max-w-[1400px] mx-auto space-y-6">

          {/* ── Header ── */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
            <div className="flex items-center gap-4">
              <div className="bg-sky-500/10 p-3 rounded-2xl border border-sky-500/20">
                <Truck className="h-8 w-8 text-sky-600 dark:text-sky-400" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">
                  Logística y Envíos
                </h1>
                <p className="text-neutral-500 font-medium text-sm mt-1">
                  Seguimiento de embarques, carriers y órdenes de compra.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-black rounded-xl transition-all shadow-lg shadow-sky-500/20 text-sm"
            >
              <Plus className="h-4 w-4" /> Nuevo envío
            </button>
          </header>

          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Pendientes</p>
                <p className="text-2xl font-black text-neutral-900 dark:text-white mt-1">{pending}</p>
              </div>
              <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                <Clock className="h-6 w-6 text-neutral-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 border-l-4 border-l-blue-500 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">En tránsito</p>
                <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{inTransit}</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
                <Truck className="h-6 w-6 text-blue-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 border-l-4 border-l-emerald-500 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Entregados</p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{delivered}</p>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Total</p>
                <p className="text-2xl font-black text-neutral-900 dark:text-white mt-1">{total}</p>
              </div>
              <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                <Package className="h-6 w-6 text-neutral-500" />
              </div>
            </div>
          </div>

          {/* ── Filter tabs ── */}
          <div className="flex overflow-x-auto gap-2 pb-1">
            {FILTER_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                  filter === tab.id
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
                    : 'bg-white dark:bg-neutral-900 text-neutral-500 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                }`}
              >
                {tab.label}
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                  filter === tab.id
                    ? 'bg-white/20 text-white'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* ── Table ── */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm overflow-hidden">
            {visible.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="bg-neutral-100 dark:bg-neutral-800 p-6 rounded-3xl mb-4">
                  <Package className="h-10 w-10 text-neutral-400" />
                </div>
                <p className="font-bold text-neutral-700 dark:text-neutral-300">Sin envíos</p>
                <p className="text-sm text-neutral-500 mt-1">
                  {filter === 'ALL'
                    ? 'Crea tu primer envío con el botón "Nuevo envío".'
                    : `No hay envíos con estado "${STATUS_LABELS[filter] ?? filter}".`}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                  <thead className="bg-neutral-50 dark:bg-black/50 border-b border-neutral-200 dark:border-neutral-800">
                    <tr>
                      <th className="p-4 font-bold text-[10px] uppercase tracking-widest text-neutral-500">
                        Tracking #
                      </th>
                      <th className="p-4 font-bold text-[10px] uppercase tracking-widest text-neutral-500">
                        Carrier
                      </th>
                      <th className="p-4 font-bold text-[10px] uppercase tracking-widest text-neutral-500">
                        Ruta
                      </th>
                      <th className="p-4 font-bold text-[10px] uppercase tracking-widest text-neutral-500">
                        OC
                      </th>
                      <th className="p-4 font-bold text-[10px] uppercase tracking-widest text-neutral-500">
                        Estado
                      </th>
                      <th className="p-4 font-bold text-[10px] uppercase tracking-widest text-neutral-500">
                        Fecha est.
                      </th>
                      <th className="p-4 font-bold text-[10px] uppercase tracking-widest text-neutral-500 text-right">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                    {visible.map(s => (
                      <tr key={s.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                        {/* Tracking */}
                        <td className="p-4">
                          {s.trackingNumber ? (
                            <span className="font-mono font-bold text-sky-600 dark:text-sky-400 text-xs">
                              {s.trackingNumber}
                            </span>
                          ) : (
                            <span className="text-neutral-400 text-xs italic">Sin tracking</span>
                          )}
                          <p className="text-[10px] text-neutral-400 mt-0.5 font-mono">
                            {fmt(s.createdAt)}
                          </p>
                        </td>

                        {/* Carrier */}
                        <td className="p-4">
                          <span className="font-bold text-neutral-800 dark:text-neutral-200">
                            {s.carrier ?? <span className="text-neutral-400 font-normal italic">—</span>}
                          </span>
                        </td>

                        {/* Ruta: origen → destino */}
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 text-xs">
                            <MapPin className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                            <span className="text-neutral-600 dark:text-neutral-400 max-w-[90px] truncate">
                              {s.origin ?? '—'}
                            </span>
                            <ArrowRight className="h-3 w-3 text-neutral-400 shrink-0" />
                            <span className="font-bold text-neutral-800 dark:text-neutral-200 max-w-[90px] truncate">
                              {s.destination ?? '—'}
                            </span>
                          </div>
                        </td>

                        {/* OC relacionada */}
                        <td className="p-4">
                          {s.purchaseOrderNumber != null ? (
                            <span className="font-mono font-bold text-neutral-700 dark:text-neutral-300 text-xs bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                              OC-{s.purchaseOrderNumber}
                            </span>
                          ) : (
                            <span className="text-neutral-400 text-xs">—</span>
                          )}
                        </td>

                        {/* Estado badge */}
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide ${STATUS_BADGE[s.status] ?? STATUS_BADGE['PENDING']}`}>
                            {s.status === 'PENDING'    && <Clock className="h-3 w-3" />}
                            {s.status === 'IN_TRANSIT' && <Truck className="h-3 w-3" />}
                            {s.status === 'DELIVERED'  && <CheckCircle2 className="h-3 w-3" />}
                            {s.status === 'RETURNED'   && <RotateCcw className="h-3 w-3" />}
                            {STATUS_LABELS[s.status] ?? s.status}
                          </span>
                        </td>

                        {/* Fecha estimada */}
                        <td className="p-4 text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                          {s.deliveredAt ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                              Entregado {fmt(s.deliveredAt)}
                            </span>
                          ) : (
                            fmt(s.estimatedAt)
                          )}
                        </td>

                        {/* Acciones */}
                        <td className="p-4 text-right">
                          <StatusDropdown shipment={s} onUpdated={handleUpdated} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
