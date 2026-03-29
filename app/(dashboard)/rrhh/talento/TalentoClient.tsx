'use client';

import { useState, useTransition } from 'react';
import type { ReviewRow, EmployeeRow } from '../actions';
import { createReview } from '../actions';

interface NewReviewForm {
  employeeId: string;
  period: string;
  score: number;
  goals: string;
  achievements: string;
  improvements: string;
  reviewerName: string;
}

function getCurrentQuarter(): string {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `${now.getFullYear()}-Q${q}`;
}

function isCurrentQuarter(dateStr: string): boolean {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  const currentPeriod = `${now.getFullYear()}-Q${q}`;
  return dateStr === currentPeriod;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface StarDisplayProps {
  score: number;
  size?: 'sm' | 'lg';
}

function StarDisplay({ score, size = 'sm' }: StarDisplayProps) {
  const colorClass =
    score <= 2
      ? 'text-red-500'
      : score === 3
      ? 'text-yellow-500'
      : 'text-emerald-500';
  const sizeClass = size === 'lg' ? 'text-2xl' : 'text-sm';
  return (
    <span className={`${colorClass} ${sizeClass} font-black tracking-tight`} aria-label={`${score} de 5 estrellas`}>
      {Array.from({ length: 5 }, (_, i) => (i < score ? '★' : '☆')).join('')}
    </span>
  );
}

interface StarSelectorProps {
  value: number;
  onChange: (v: number) => void;
}

function StarSelector({ value, onChange }: StarSelectorProps) {
  const [hovered, setHovered] = useState(0);
  const displayed = hovered || value;
  const colorClass =
    displayed <= 2
      ? 'text-red-500'
      : displayed === 3
      ? 'text-yellow-500'
      : 'text-emerald-500';
  return (
    <div className="flex gap-1" role="group" aria-label="Seleccionar puntaje">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className={`text-3xl transition-colors ${n <= displayed ? colorClass : 'text-neutral-300 dark:text-neutral-700'}`}
          aria-label={`${n} estrella${n !== 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

interface DetailPanelProps {
  review: ReviewRow;
  onClose: () => void;
}

function DetailPanel({ review, onClose }: DetailPanelProps) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[420px] bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col h-full overflow-y-auto animate-in slide-in-from-right duration-300">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-start justify-between gap-4 sticky top-0 bg-white dark:bg-neutral-900 z-10">
          <div>
            <h2 className="text-xl font-black text-neutral-900 dark:text-white">{review.employeeName}</h2>
            <p className="text-sm text-neutral-500 mt-0.5">{review.period}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0"
          >
            <svg className="h-5 w-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-6 flex-1">
          <div className="bg-neutral-50 dark:bg-neutral-800 rounded-2xl p-5 text-center">
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Puntaje Global</p>
            <StarDisplay score={review.score} size="lg" />
            <p className="text-4xl font-black text-neutral-900 dark:text-white mt-1">{review.score}<span className="text-lg font-medium text-neutral-400">/5</span></p>
          </div>
          {review.goals && (
            <div>
              <p className="text-xs font-black text-neutral-500 uppercase tracking-widest mb-2">Objetivos</p>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-xl p-4">
                <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">{review.goals}</p>
              </div>
            </div>
          )}
          {review.achievements && (
            <div>
              <p className="text-xs font-black text-neutral-500 uppercase tracking-widest mb-2">Logros</p>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 rounded-xl p-4">
                <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">{review.achievements}</p>
              </div>
            </div>
          )}
          {review.improvements && (
            <div>
              <p className="text-xs font-black text-neutral-500 uppercase tracking-widest mb-2">Areas de Mejora</p>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 rounded-xl p-4">
                <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">{review.improvements}</p>
              </div>
            </div>
          )}
          {review.reviewerName && (
            <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center text-violet-700 dark:text-violet-300 font-black text-sm">
                {review.reviewerName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-xs text-neutral-400">Evaluado por</p>
                <p className="text-sm font-bold text-neutral-900 dark:text-white">{review.reviewerName}</p>
              </div>
            </div>
          )}
          <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4">
            <p className="text-xs text-neutral-400">Creada el {formatDate(review.createdAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface Props {
  initialReviews: ReviewRow[];
  employees: EmployeeRow[];
}

export default function TalentoClient({ initialReviews, employees }: Props) {
  const [reviews, setReviews] = useState<ReviewRow[]>(initialReviews);
  const [search, setSearch] = useState('');
  const [periodFilter, setPeriodFilter] = useState('');
  const [selectedReview, setSelectedReview] = useState<ReviewRow | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState('');

  const [form, setForm] = useState<NewReviewForm>({
    employeeId: '',
    period: getCurrentQuarter(),
    score: 3,
    goals: '',
    achievements: '',
    improvements: '',
    reviewerName: '',
  });

  // KPIs
  const totalReviews = reviews.length;
  const avgScore = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length).toFixed(1)
    : '0.0';
  const currentQuarter = getCurrentQuarter();
  const evaluatedThisQuarter = new Set(
    reviews.filter((r) => isCurrentQuarter(r.period)).map((r) => r.employeeId)
  ).size;

  // Unique periods for filter
  const uniquePeriods = Array.from(new Set(reviews.map((r) => r.period))).sort().reverse();

  // Filtered
  const filtered = reviews.filter((r) => {
    const matchesSearch = !search || r.employeeName.toLowerCase().includes(search.toLowerCase());
    const matchesPeriod = !periodFilter || r.period === periodFilter;
    return matchesSearch && matchesPeriod;
  });

  async function handleCreate() {
    if (!form.employeeId) { setFormError('Selecciona un empleado.'); return; }
    if (!form.period.trim()) { setFormError('Ingresa el período de evaluación.'); return; }
    if (form.score < 1 || form.score > 5) { setFormError('El puntaje debe estar entre 1 y 5.'); return; }
    setFormError('');
    startTransition(async () => {
      const emp = employees.find((e) => e.id === form.employeeId);
      const id = await createReview({
        employeeId: form.employeeId,
        period: form.period,
        score: form.score,
        goals: form.goals || undefined,
        achievements: form.achievements || undefined,
        improvements: form.improvements || undefined,
        reviewerName: form.reviewerName || undefined,
      });
      const newRow: ReviewRow = {
        id,
        employeeId: form.employeeId,
        employeeName: emp?.name ?? '—',
        period: form.period,
        score: form.score,
        goals: form.goals || null,
        achievements: form.achievements || null,
        improvements: form.improvements || null,
        reviewerName: form.reviewerName || null,
        status: 'DRAFT',
        createdAt: new Date().toISOString(),
      };
      setReviews((prev) => [newRow, ...prev]);
      setShowModal(false);
      setForm({
        employeeId: '',
        period: getCurrentQuarter(),
        score: 3,
        goals: '',
        achievements: '',
        improvements: '',
        reviewerName: '',
      });
    });
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm">
          <div>
            <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">Evaluaciones de Desempeno</h1>
            <p className="text-neutral-500 font-medium text-sm mt-1">
              Gestion de evaluaciones por periodo, puntajes y retroalimentacion del equipo.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-black rounded-xl transition-all shadow-lg shadow-violet-500/20 text-sm"
          >
            + Nueva Evaluacion
          </button>
        </header>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 border-l-4 border-l-violet-500 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Total Evaluaciones</p>
              <p className="text-3xl font-black text-violet-600 dark:text-violet-400 mt-1">{totalReviews}</p>
            </div>
            <div className="p-3 bg-violet-50 dark:bg-violet-500/10 rounded-xl">
              <svg className="h-6 w-6 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-yellow-200 dark:border-yellow-800/50 border-l-4 border-l-yellow-500 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Prom. Puntaje</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-3xl font-black text-yellow-600 dark:text-yellow-400">{avgScore}</p>
                <span className="text-yellow-500 text-xl">★</span>
              </div>
            </div>
            <div className="p-3 bg-yellow-50 dark:bg-yellow-500/10 rounded-xl">
              <svg className="h-6 w-6 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 border-l-4 border-l-emerald-500 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Evaluados ({currentQuarter})</p>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{evaluatedThisQuarter}</p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
              <svg className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por empleado..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-medium text-neutral-900 dark:text-white placeholder-neutral-400 outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-medium text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500 min-w-[180px]"
          >
            <option value="">Todos los periodos</option>
            {uniquePeriods.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 text-[10px] uppercase text-neutral-500 tracking-widest font-black">
                <tr>
                  <th className="p-4">Empleado</th>
                  <th className="p-4">Puesto</th>
                  <th className="p-4">Periodo</th>
                  <th className="p-4 text-center">Puntaje</th>
                  <th className="p-4">Evaluador</th>
                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-neutral-400 font-medium">
                      No se encontraron evaluaciones.
                    </td>
                  </tr>
                )}
                {filtered.map((rev) => {
                  const emp = employees.find((e) => e.id === rev.employeeId);
                  return (
                    <tr
                      key={rev.id}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors cursor-pointer"
                      onClick={() => setSelectedReview(rev)}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center text-violet-700 dark:text-violet-300 font-black text-xs shrink-0">
                            {rev.employeeName.slice(0, 2).toUpperCase()}
                          </div>
                          <p className="font-bold text-neutral-900 dark:text-white">{rev.employeeName}</p>
                        </div>
                      </td>
                      <td className="p-4 text-neutral-600 dark:text-neutral-400 text-xs">{emp?.position ?? '—'}</td>
                      <td className="p-4">
                        <span className="bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 px-2 py-1 rounded-lg text-[10px] font-black uppercase">
                          {rev.period}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <StarDisplay score={rev.score} />
                      </td>
                      <td className="p-4 text-neutral-600 dark:text-neutral-400 text-xs">{rev.reviewerName ?? '—'}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                          rev.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                        }`}>
                          {rev.status === 'COMPLETED' ? 'Completada' : 'Borrador'}
                        </span>
                      </td>
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedReview(rev)}
                          className="px-3 py-1.5 text-[10px] font-black bg-violet-100 hover:bg-violet-200 dark:bg-violet-500/20 dark:hover:bg-violet-500/30 text-violet-700 dark:text-violet-300 rounded-lg transition-colors"
                        >
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Side Panel */}
      {selectedReview && (
        <DetailPanel review={selectedReview} onClose={() => setSelectedReview(null)} />
      )}

      {/* Nueva Evaluacion Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between sticky top-0 bg-white dark:bg-neutral-900 z-10">
              <h2 className="text-xl font-black text-neutral-900 dark:text-white">Nueva Evaluacion</h2>
              <button
                onClick={() => { setShowModal(false); setFormError(''); }}
                className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <svg className="h-5 w-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs font-bold px-4 py-3 rounded-xl">
                  {formError}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Empleado</label>
                <select
                  value={form.employeeId}
                  onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                  className="w-full p-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl font-medium text-neutral-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">— Seleccionar empleado —</option>
                  {employees.filter((e) => e.active).map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} — {emp.position}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
                  Periodo <span className="normal-case font-medium text-neutral-400">(ej: 2026-Q1, 2026-S1, 2026-ANUAL)</span>
                </label>
                <input
                  type="text"
                  value={form.period}
                  onChange={(e) => setForm({ ...form, period: e.target.value })}
                  placeholder="2026-Q1"
                  className="w-full p-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl font-medium text-neutral-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-violet-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Puntaje</label>
                <StarSelector value={form.score} onChange={(v) => setForm({ ...form, score: v })} />
                <p className="text-xs text-neutral-400 mt-1 font-medium">{form.score} de 5 estrellas</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Objetivos <span className="normal-case font-medium">(opcional)</span></label>
                <textarea
                  rows={2}
                  value={form.goals}
                  onChange={(e) => setForm({ ...form, goals: e.target.value })}
                  placeholder="Describe los objetivos establecidos..."
                  className="w-full p-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl font-medium text-neutral-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Logros <span className="normal-case font-medium">(opcional)</span></label>
                <textarea
                  rows={2}
                  value={form.achievements}
                  onChange={(e) => setForm({ ...form, achievements: e.target.value })}
                  placeholder="Principales logros del periodo..."
                  className="w-full p-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl font-medium text-neutral-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Areas de Mejora <span className="normal-case font-medium">(opcional)</span></label>
                <textarea
                  rows={2}
                  value={form.improvements}
                  onChange={(e) => setForm({ ...form, improvements: e.target.value })}
                  placeholder="Oportunidades de mejora identificadas..."
                  className="w-full p-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl font-medium text-neutral-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Evaluador <span className="normal-case font-medium">(opcional)</span></label>
                <input
                  type="text"
                  value={form.reviewerName}
                  onChange={(e) => setForm({ ...form, reviewerName: e.target.value })}
                  placeholder="Nombre del evaluador..."
                  className="w-full p-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl font-medium text-neutral-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>
            <div className="p-6 pt-0 flex gap-3">
              <button
                onClick={() => { setShowModal(false); setFormError(''); }}
                className="flex-1 py-3 font-bold text-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={isPending}
                className="flex-1 py-3 font-black text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-lg shadow-violet-500/20 transition-colors disabled:opacity-60"
              >
                {isPending ? 'Guardando...' : 'Crear Evaluacion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
