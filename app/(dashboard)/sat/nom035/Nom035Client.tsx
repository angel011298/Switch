'use client';

import { useState } from 'react';
import { Brain, Plus, Play, CheckCircle2, Clock, Archive, Share2, Loader2, Users } from 'lucide-react';
import { createNom035Survey, activateSurvey, closeSurvey } from './actions';

type Survey = { id: string; title: string; period: string; guia: string; status: string; openAt: string | null; closeAt: string | null; responsesCount: number; createdAt: string };

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  DRAFT:    { label: 'Borrador',  color: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400', icon: Clock },
  ACTIVE:   { label: 'Activa',   color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400', icon: Play },
  CLOSED:   { label: 'Cerrada',  color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400', icon: CheckCircle2 },
  ARCHIVED: { label: 'Archivada', color: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800', icon: Archive },
};

export default function Nom035Client({ initialSurveys, totalEmployees }: { initialSurveys: Survey[]; totalEmployees: number }) {
  const [surveys, setSurveys] = useState(initialSurveys);
  const [showModal, setShowModal] = useState(false);
  const [period, setPeriod] = useState(`${new Date().getFullYear()}-Q${Math.ceil((new Date().getMonth() + 1) / 3)}`);
  const [guia, setGuia] = useState(totalEmployees > 15 ? 'GUIA_II' : 'GUIA_I');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const totalResponses = surveys.reduce((s, sv) => s + sv.responsesCount, 0);
  const activeSurvey = surveys.find(s => s.status === 'ACTIVE');

  async function handleCreate() {
    setLoading(true);
    try {
      await createNom035Survey({ period, guia });
      setShowModal(false);
      setMsg('✅ Encuesta creada');
      window.location.reload();
    } catch (err) { setMsg(`❌ ${err instanceof Error ? err.message : 'Error'}`); }
    finally { setLoading(false); }
  }

  async function handleActivate(id: string) {
    setLoading(true);
    try {
      await activateSurvey(id);
      setSurveys(prev => prev.map(s => s.id === id ? { ...s, status: 'ACTIVE', openAt: new Date().toISOString() } : s));
      setMsg('✅ Encuesta activada — los empleados pueden responder ahora');
    } catch (err) { setMsg(`❌ ${err instanceof Error ? err.message : 'Error'}`); }
    finally { setLoading(false); }
  }

  async function handleClose(id: string) {
    setLoading(true);
    try {
      await closeSurvey(id);
      setSurveys(prev => prev.map(s => s.id === id ? { ...s, status: 'CLOSED' } : s));
    } catch (err) { setMsg(`❌ ${err instanceof Error ? err.message : 'Error'}`); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8 space-y-6">
      <header className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-purple-500/10 p-3 rounded-2xl border border-purple-500/20">
            <Brain className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">NOM-035 STPS-2018</h1>
            <p className="text-neutral-500 text-sm mt-1">Identificación, análisis y prevención de factores de riesgo psicosocial</p>
          </div>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl text-sm transition-colors">
          <Plus className="h-4 w-4" /> Nueva Encuesta
        </button>
      </header>

      {msg && <div className={`p-4 rounded-2xl text-sm font-semibold ${msg.startsWith('✅') ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 border border-emerald-200' : 'bg-red-50 dark:bg-red-500/10 text-red-700 border border-red-200'}`}>{msg}</div>}

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800">
          <p className="text-xs font-black text-neutral-500 uppercase tracking-widest">Empleados</p>
          <p className="text-3xl font-black text-neutral-900 dark:text-white mt-1">{totalEmployees}</p>
          <p className="text-xs text-neutral-400 mt-1">{totalEmployees > 15 ? 'Aplica Guía II' : 'Aplica Guía I'}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800">
          <p className="text-xs font-black text-neutral-500 uppercase tracking-widest">Respuestas Totales</p>
          <p className="text-3xl font-black text-purple-600 dark:text-purple-400 mt-1">{totalResponses}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800">
          <p className="text-xs font-black text-neutral-500 uppercase tracking-widest">Encuestas</p>
          <p className="text-3xl font-black text-neutral-900 dark:text-white mt-1">{surveys.length}</p>
        </div>
      </div>

      {activeSurvey && (
        <div className="bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 p-5 rounded-3xl flex items-center gap-4">
          <Share2 className="h-6 w-6 text-purple-600 dark:text-purple-400 shrink-0" />
          <div className="flex-1">
            <p className="font-black text-purple-900 dark:text-purple-300">Encuesta activa: {activeSurvey.period}</p>
            <p className="text-sm text-purple-600 dark:text-purple-400 mt-0.5">{activeSurvey.responsesCount} respuestas recibidas · Cierra: {activeSurvey.closeAt ? new Date(activeSurvey.closeAt).toLocaleDateString('es-MX') : '—'}</p>
          </div>
          <button onClick={() => handleClose(activeSurvey.id)} className="text-xs font-bold text-purple-600 hover:text-purple-800 underline">Cerrar encuesta</button>
        </div>
      )}

      {surveys.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-16 flex flex-col items-center gap-4">
          <Brain className="h-12 w-12 text-neutral-300 dark:text-neutral-600" />
          <p className="font-black text-neutral-500">Sin encuestas creadas</p>
          <p className="text-sm text-neutral-400 text-center max-w-md">Crea tu primera encuesta NOM-035 y comparte el enlace con tus empleados. Obligatorio para empresas con más de 15 trabajadores.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden">
          <div className="p-4 border-b border-neutral-100 dark:border-neutral-800"><p className="font-black text-neutral-900 dark:text-white">Encuestas NOM-035</p></div>
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-800/50">
              <tr>{['Periodo', 'Guía', 'Respuestas', 'Apertura', 'Cierre', 'Estado', 'Acciones'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-black text-neutral-500 uppercase tracking-wider">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {surveys.map(s => {
                const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.DRAFT;
                const Icon = cfg.icon;
                const pct = totalEmployees > 0 ? Math.round(s.responsesCount / totalEmployees * 100) : 0;
                return (
                  <tr key={s.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                    <td className="px-4 py-3 font-black text-neutral-900 dark:text-white">{s.period}</td>
                    <td className="px-4 py-3 text-neutral-500">{s.guia}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-neutral-200 dark:bg-neutral-700 rounded-full h-1.5">
                          <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-neutral-600 dark:text-neutral-400">{s.responsesCount}/{totalEmployees}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-400 text-xs">{s.openAt ? new Date(s.openAt).toLocaleDateString('es-MX') : '—'}</td>
                    <td className="px-4 py-3 text-neutral-400 text-xs">{s.closeAt ? new Date(s.closeAt).toLocaleDateString('es-MX') : '—'}</td>
                    <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${cfg.color}`}><Icon className="h-3 w-3" />{cfg.label}</span></td>
                    <td className="px-4 py-3">
                      {s.status === 'DRAFT' && (
                        <button onClick={() => handleActivate(s.id)} disabled={loading} className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1">
                          <Play className="h-3 w-3" />Activar
                        </button>
                      )}
                      {s.status === 'ACTIVE' && (
                        <div className="flex items-center gap-1 text-xs text-emerald-600 font-bold"><Users className="h-3 w-3" />En curso</div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-black text-xl text-neutral-900 dark:text-white mb-5">Nueva Encuesta NOM-035</h3>
            <div className="space-y-4">
              <div><label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Periodo</label><input value={period} onChange={e => setPeriod(e.target.value)} placeholder="Ej. 2026-Q1" className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl px-4 py-2.5 text-sm" /></div>
              <div><label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Guía Aplicable</label>
                <select value={guia} onChange={e => setGuia(e.target.value)} className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl px-4 py-2.5 text-sm">
                  <option value="GUIA_I">Guía I (1–15 trabajadores)</option>
                  <option value="GUIA_II">Guía II (más de 15 trabajadores)</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleCreate} disabled={loading || !period} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl text-sm disabled:opacity-50">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Crear Encuesta
              </button>
              <button onClick={() => setShowModal(false)} className="px-5 text-neutral-500 font-semibold text-sm">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
