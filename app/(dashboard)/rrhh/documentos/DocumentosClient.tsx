'use client';

/**
 * CIFRA — Gestión de Documentos Laborales (Client)
 * FASE 34: Agregar, filtrar por vencimiento y eliminar documentos de empleados.
 */

import { useState, useTransition } from 'react';
import {
  FolderOpen, Plus, Download, Trash2, X, Loader2,
  AlertTriangle, Clock, CheckCircle2, Search, FileText,
} from 'lucide-react';
import type { DocumentRow, EmployeeRow } from '../actions';
import { addDocument, deleteDocument } from '../actions';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  initialDocuments: DocumentRow[];
  employees: EmployeeRow[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DOC_TYPES = ['CONTRATO', 'NDA', 'CONSTANCIA', 'ALTA_IMSS', 'BAJA_IMSS', 'OTRO'] as const;
type DocType = (typeof DOC_TYPES)[number];

const TYPE_BADGE: Record<DocType, { label: string; cls: string }> = {
  CONTRATO:  { label: 'Contrato',   cls: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' },
  NDA:       { label: 'NDA',        cls: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400' },
  CONSTANCIA:{ label: 'Constancia', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' },
  ALTA_IMSS: { label: 'Alta IMSS',  cls: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' },
  BAJA_IMSS: { label: 'Baja IMSS',  cls: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' },
  OTRO:      { label: 'Otro',       cls: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function fmtFileSize(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isExpiringSoon(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return diff > 0 && diff <= 30 * 24 * 60 * 60 * 1000;
}

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now();
}

// ─── Empty form ───────────────────────────────────────────────────────────────

interface DocForm {
  employeeId: string;
  type: DocType;
  name: string;
  fileUrl: string;
  expiresAt: string;
  notes: string;
}

const EMPTY_FORM: DocForm = {
  employeeId: '',
  type: 'CONTRATO',
  name: '',
  fileUrl: '',
  expiresAt: '',
  notes: '',
};

// ─── Main Component ───────────────────────────────────────────────────────────

type Tab = 'todos' | 'por_vencer' | 'vencidos';

export default function DocumentosClient({ initialDocuments, employees }: Props) {
  const [isPending, startTransition] = useTransition();
  const [documents, setDocuments] = useState<DocumentRow[]>(initialDocuments);
  const [tab, setTab] = useState<Tab>('todos');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<DocForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Filtered list ──
  const filtered = documents.filter((d) => {
    const matchesTab =
      tab === 'todos'      ? true :
      tab === 'por_vencer' ? isExpiringSoon(d.expiresAt) :
      isExpired(d.expiresAt);

    const matchesEmployee = !filterEmployee || d.employeeId === filterEmployee;

    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      d.name.toLowerCase().includes(q) ||
      d.employeeName.toLowerCase().includes(q) ||
      d.type.toLowerCase().includes(q);

    return matchesTab && matchesEmployee && matchesSearch;
  });

  const porVencerCount = documents.filter((d) => isExpiringSoon(d.expiresAt)).length;
  const vencidosCount  = documents.filter((d) => isExpired(d.expiresAt)).length;

  // ── Add document ──
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!form.employeeId) { setFormError('Selecciona un empleado'); return; }
    if (!form.name.trim()) { setFormError('El nombre del documento es requerido'); return; }
    if (!form.fileUrl.trim()) { setFormError('La URL del archivo es requerida'); return; }

    startTransition(async () => {
      try {
        const newId = await addDocument({
          employeeId: form.employeeId,
          type:       form.type,
          name:       form.name.trim(),
          fileUrl:    form.fileUrl.trim(),
          expiresAt:  form.expiresAt || undefined,
          notes:      form.notes || undefined,
        });

        const emp = employees.find((e) => e.id === form.employeeId);
        const newDoc: DocumentRow = {
          id:           newId,
          employeeId:   form.employeeId,
          employeeName: emp?.name ?? '',
          type:         form.type,
          name:         form.name.trim(),
          fileUrl:      form.fileUrl.trim(),
          fileSize:     null,
          mimeType:     null,
          expiresAt:    form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
          notes:        form.notes || null,
          createdAt:    new Date().toISOString(),
        };

        setDocuments((prev) => [newDoc, ...prev]);
        setShowModal(false);
        setForm(EMPTY_FORM);
      } catch (err: unknown) {
        setFormError(err instanceof Error ? err.message : 'Error al guardar documento');
      }
    });
  }

  // ── Delete document ──
  function handleDelete(doc: DocumentRow) {
    if (!confirm(`¿Eliminar "${doc.name}"? Esta acción no se puede deshacer.`)) return;
    setGlobalError(null);
    setDeletingId(doc.id);
    startTransition(async () => {
      try {
        await deleteDocument(doc.id);
        setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      } catch (err: unknown) {
        setGlobalError(err instanceof Error ? err.message : 'Error al eliminar documento');
      } finally {
        setDeletingId(null);
      }
    });
  }

  const tabCls = (t: Tab) =>
    `px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
      tab === t
        ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20'
        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
    }`;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* ── HEADER ── */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-teal-500/10 p-3 rounded-2xl border border-teal-500/20">
              <FolderOpen className="h-8 w-8 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">
                Documentos Laborales
              </h1>
              <p className="text-neutral-500 font-medium text-sm mt-1">
                Expediente digital por empleado. Contratos, NDAs, movimientos IMSS y más.
              </p>
            </div>
          </div>
          <button
            onClick={() => { setShowModal(true); setForm(EMPTY_FORM); setFormError(null); }}
            className="flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl transition-all shadow-lg shadow-teal-500/20 text-sm"
          >
            <Plus className="h-4 w-4" /> Agregar Documento
          </button>
        </header>

        {/* ── GLOBAL ERROR ── */}
        {globalError && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl px-5 py-3 text-sm font-medium text-red-700 dark:text-red-400 flex items-center justify-between">
            <span>{globalError}</span>
            <button onClick={() => setGlobalError(null)} className="text-red-400 hover:text-red-600 font-black ml-4 text-lg leading-none">×</button>
          </div>
        )}

        {/* ── STATS ROW ── */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 flex items-center gap-3">
            <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
              <FileText className="h-5 w-5 text-neutral-500" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Total</p>
              <p className="text-xl font-black text-neutral-900 dark:text-white">{documents.length}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 flex items-center gap-3">
            <div className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Por vencer</p>
              <p className="text-xl font-black text-amber-600 dark:text-amber-400">{porVencerCount}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 flex items-center gap-3">
            <div className="p-2 bg-red-50 dark:bg-red-500/10 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Vencidos</p>
              <p className="text-xl font-black text-red-600 dark:text-red-400">{vencidosCount}</p>
            </div>
          </div>
        </div>

        {/* ── FILTERS ── */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setTab('todos')} className={tabCls('todos')}>
              Todos ({documents.length})
            </button>
            <button onClick={() => setTab('por_vencer')} className={tabCls('por_vencer')}>
              Por vencer ({porVencerCount})
            </button>
            <button onClick={() => setTab('vencidos')} className={tabCls('vencidos')}>
              Vencidos ({vencidosCount})
            </button>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <select
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
              className="px-3 py-2 text-xs font-medium bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-700 dark:text-neutral-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="">Todos los empleados</option>
              {employees.filter((e) => e.active).map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
            <div className="flex items-center gap-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-3 py-2 rounded-xl flex-1 sm:min-w-[220px]">
              <Search className="h-4 w-4 text-neutral-400 shrink-0" />
              <input
                type="text"
                placeholder="Buscar documento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-medium text-neutral-900 dark:text-white flex-1 min-w-0"
              />
            </div>
          </div>
        </div>

        {/* ── TABLE ── */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm">
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <FolderOpen className="h-12 w-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
              <p className="text-neutral-500 font-medium text-sm">Sin documentos en esta categoría</p>
              <p className="text-neutral-400 text-xs mt-1">Agrega el primer documento con el botón "Agregar Documento"</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-neutral-50 dark:bg-black/40 border-b border-neutral-200 dark:border-neutral-800 text-[10px] uppercase tracking-widest text-neutral-500 font-black">
                  <tr>
                    <th className="px-6 py-3">Empleado</th>
                    <th className="px-6 py-3">Tipo</th>
                    <th className="px-6 py-3">Nombre del documento</th>
                    <th className="px-6 py-3 text-right">Tamaño</th>
                    <th className="px-6 py-3 text-center">Vence</th>
                    <th className="px-6 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                  {filtered.map((doc) => {
                    const expired     = isExpired(doc.expiresAt);
                    const expiringSoon = isExpiringSoon(doc.expiresAt);
                    const badge = TYPE_BADGE[doc.type as DocType] ?? TYPE_BADGE.OTRO;
                    const isDeleting = deletingId === doc.id && isPending;

                    return (
                      <tr
                        key={doc.id}
                        className={`hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors ${
                          expired ? 'opacity-60' : ''
                        }`}
                      >
                        {/* Empleado */}
                        <td className="px-6 py-4">
                          <p className="font-bold text-neutral-900 dark:text-white text-sm">{doc.employeeName}</p>
                          <p className="text-[10px] text-neutral-400 mt-0.5">
                            Agregado {fmtDate(doc.createdAt)}
                          </p>
                        </td>

                        {/* Tipo badge */}
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </td>

                        {/* Nombre */}
                        <td className="px-6 py-4 max-w-xs">
                          <p className="font-medium text-neutral-900 dark:text-white truncate text-xs">
                            {doc.name}
                          </p>
                          {doc.notes && (
                            <p className="text-[10px] text-neutral-400 mt-0.5 truncate max-w-[200px]">
                              {doc.notes}
                            </p>
                          )}
                        </td>

                        {/* Tamaño */}
                        <td className="px-6 py-4 text-right text-xs text-neutral-500">
                          {fmtFileSize(doc.fileSize)}
                        </td>

                        {/* Vencimiento */}
                        <td className="px-6 py-4 text-center">
                          {doc.expiresAt ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold ${
                                expired
                                  ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                                  : expiringSoon
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                                  : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                              }`}
                            >
                              {expired ? (
                                <><AlertTriangle className="h-3 w-3" /> Vencido</>
                              ) : expiringSoon ? (
                                <><Clock className="h-3 w-3" /> {fmtDate(doc.expiresAt)}</>
                              ) : (
                                <><CheckCircle2 className="h-3 w-3" /> {fmtDate(doc.expiresAt)}</>
                              )}
                            </span>
                          ) : (
                            <span className="text-neutral-300 dark:text-neutral-600 text-xs">Sin vencimiento</span>
                          )}
                        </td>

                        {/* Acciones */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Descargar / Ver archivo"
                              className="p-2 rounded-lg text-neutral-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-500/10 transition-colors"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                            {isDeleting ? (
                              <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
                            ) : (
                              <button
                                onClick={() => handleDelete(doc)}
                                disabled={isPending}
                                title="Eliminar documento"
                                className="p-2 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-40"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {filtered.length > 0 && (
            <div className="px-6 py-3 border-t border-neutral-100 dark:border-neutral-800/50 text-[11px] text-neutral-400 font-medium">
              Mostrando {filtered.length} de {documents.length} documentos
            </div>
          )}
        </div>

      </div>

      {/* ── MODAL: Agregar Documento ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-50 dark:bg-teal-500/10 rounded-xl">
                  <FolderOpen className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                </div>
                <h2 className="text-lg font-black text-neutral-900 dark:text-white">
                  Agregar Documento
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400">
                  {formError}
                </div>
              )}

              {/* Empleado */}
              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                  Empleado <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.employeeId}
                  onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}
                  required
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="">Seleccionar empleado...</option>
                  {employees
                    .filter((e) => e.active)
                    .map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name} — {e.position}
                      </option>
                    ))}
                </select>
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                  Tipo de documento <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as DocType }))}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  {DOC_TYPES.map((t) => (
                    <option key={t} value={t}>{TYPE_BADGE[t].label}</option>
                  ))}
                </select>
              </div>

              {/* Nombre */}
              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                  Nombre del documento <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. Contrato Indefinido 2026"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              {/* URL del archivo */}
              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                  URL del archivo <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  placeholder="https://storage.ejemplo.com/doc.pdf"
                  value={form.fileUrl}
                  onChange={(e) => setForm((f) => ({ ...f, fileUrl: e.target.value }))}
                  required
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
                <p className="text-[10px] text-neutral-400 mt-1">
                  Ingresa la URL pública del archivo subido al storage.
                </p>
              </div>

              {/* Fecha de vencimiento */}
              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                  Fecha de vencimiento <span className="text-neutral-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              {/* Notas */}
              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                  Notas <span className="text-neutral-400 font-normal">(opcional)</span>
                </label>
                <textarea
                  placeholder="Observaciones adicionales..."
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2 text-sm font-bold text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-6 py-2 text-sm font-black text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-xl transition-colors shadow-lg shadow-teal-500/20 flex items-center gap-2"
                >
                  {isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</>
                  ) : (
                    <><Plus className="h-4 w-4" /> Agregar documento</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
