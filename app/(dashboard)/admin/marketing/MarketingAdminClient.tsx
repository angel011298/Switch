'use client';

/**
 * CIFRA — Marketing Automation Dashboard (Super Admin)
 * ======================================================
 * 4 tarjetas:
 *   1. Conexiones OAuth — Google Ads + Meta Ads
 *   2. Piloto Automático IA — presupuesto y CPA objetivo
 *   3. Fábrica de Anuncios — revisar y aprobar creatividades
 *   4. Analítica Consolidada — RoAS y métricas
 */

import { useState, useTransition } from 'react';
import {
  Wifi, WifiOff, DollarSign, Zap, RefreshCw, Check, X,
  Sparkles, BarChart3, TrendingUp, Users, MousePointerClick,
  AlertCircle, Loader2, ChevronDown, ChevronUp,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line,
} from 'recharts';
import { updateCreativeStatus, generateAdCreatives } from './actions';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Integration {
  id: string;
  platform: string;
  accountId: string;
  isActive: boolean;
  updatedAt: string;
}

interface Creative {
  id: string;
  platform: string;
  angle: string | null;
  headline: string;
  description: string;
  status: string;
  createdAt: string;
}

interface Analytics {
  totalSpend: number;
  totalConversions: number;
  totalClicks: number;
  cpl: number;
  byDate: { date: string; spend: number; conversions: number; clicks: number }[];
}

interface Props {
  integrations: Integration[];
  creatives: Creative[];
  analytics: Analytics;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

const platformLabels: Record<string, string> = {
  GOOGLE_ADS: 'Google Ads',
  META_ADS:   'Meta Ads',
};

const platformColors: Record<string, string> = {
  GOOGLE_ADS: 'bg-blue-500',
  META_ADS:   'bg-indigo-600',
};

// ─── Tarjeta 1: Conexiones ────────────────────────────────────────────────────

function ConnectionsCard({ integrations }: { integrations: Integration[] }) {
  const platforms = ['GOOGLE_ADS', 'META_ADS'];

  return (
    <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center">
          <Wifi className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Conexiones OAuth</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Estado de las APIs publicitarias</p>
        </div>
      </div>

      <div className="space-y-3">
        {platforms.map((platform) => {
          const integration = integrations.find(i => i.platform === platform);
          const connected   = integration?.isActive ?? false;

          return (
            <div key={platform} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800/50">
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-lg ${platformColors[platform]} flex items-center justify-center text-white font-black text-xs`}>
                  {platform === 'GOOGLE_ADS' ? 'G' : 'f'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{platformLabels[platform]}</p>
                  {integration && (
                    <p className="text-xs text-slate-400 dark:text-slate-500">ID: {integration.accountId}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                  connected
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                    : 'bg-slate-100 text-slate-500 dark:bg-neutral-700 dark:text-slate-400'
                }`}>
                  {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                  {connected ? 'Conectado' : 'Sin conectar'}
                </span>
                {!connected && (
                  <a
                    href={`/api/marketing/oauth/${platform.toLowerCase().replace('_', '-')}`}
                    className="text-xs bg-slate-900 dark:bg-white text-white dark:text-black font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-700 dark:hover:bg-slate-100 transition-colors"
                  >
                    Conectar
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500 mt-4 leading-relaxed">
        Las conexiones usan OAuth 2.0. Los tokens se almacenan cifrados. Configura las credenciales en <strong>Configuración → Variables de Entorno</strong> antes de conectar.
      </p>
    </div>
  );
}

// ─── Tarjeta 2: Piloto Automático ─────────────────────────────────────────────

function AutopilotCard() {
  const [budget,      setBudget]      = useState('500');
  const [cpaTarget,   setCpaTarget]   = useState('350');
  const [autopilot,   setAutopilot]   = useState(false);
  const [generating,  setGenerating]  = useState(false);
  const [genPlatform, setGenPlatform] = useState('GOOGLE_ADS');
  const [genAngle,    setGenAngle]    = useState('fiscal');
  const [genMsg,      setGenMsg]      = useState('');
  const [isPending, startTransition]  = useTransition();

  function handleGenerate() {
    setGenMsg('');
    setGenerating(true);
    startTransition(async () => {
      try {
        const result = await generateAdCreatives(genPlatform, genAngle);
        setGenMsg(`✓ ${result.generated} creatividades generadas y enviadas a revisión.`);
      } catch (err) {
        setGenMsg(`Error: ${err instanceof Error ? err.message : 'Intenta de nuevo'}`);
      } finally {
        setGenerating(false);
      }
    });
  }

  return (
    <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-500/15 flex items-center justify-center">
          <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Piloto Automático IA</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Configuración de optimización autónoma</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Presupuesto Diario Máx. (MXN)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 text-sm bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              CPA Objetivo (MXN)
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input type="number" value={cpaTarget} onChange={(e) => setCpaTarget(e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 text-sm bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800/50">
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Habilitar Optimización Autónoma</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Pausar anuncios que superen el CPA objetivo automáticamente</p>
          </div>
          <button
            type="button"
            onClick={() => setAutopilot(!autopilot)}
            className={`relative h-6 w-11 rounded-full transition-colors ${autopilot ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-neutral-700'}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${autopilot ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        <div className="border-t border-slate-100 dark:border-neutral-800 pt-4">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Generar Creatividades con IA
          </p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <select value={genPlatform} onChange={(e) => setGenPlatform(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-300">
              <option value="GOOGLE_ADS">Google Ads</option>
              <option value="META_ADS">Meta Ads</option>
            </select>
            <select value={genAngle} onChange={(e) => setGenAngle(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-300">
              <option value="fiscal">Ángulo Fiscal</option>
              <option value="ahorro">Ahorro de Costos</option>
              <option value="tiempo">Ahorro de Tiempo</option>
              <option value="cumplimiento">Cumplimiento Legal</option>
            </select>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || isPending}
            className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm py-2.5 rounded-xl transition-all disabled:opacity-50"
          >
            {generating || isPending
              ? <><Loader2 className="h-4 w-4 animate-spin" />Generando con IA…</>
              : <><Sparkles className="h-4 w-4" />Generar 3 Variantes</>
            }
          </button>
          {genMsg && (
            <p className={`text-xs mt-2 ${genMsg.startsWith('Error') ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {genMsg}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tarjeta 3: Fábrica de Anuncios ──────────────────────────────────────────

function CreativesCard({ creatives: initialCreatives }: { creatives: Creative[] }) {
  const [creatives, setCreatives] = useState(initialCreatives);
  const [processingId, setProcessingId] = useState<string | null>(null);

  async function handleAction(id: string, status: 'ACTIVE' | 'REJECTED') {
    setProcessingId(id);
    try {
      await updateCreativeStatus(id, status);
      setCreatives(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    } catch {
      // silent
    } finally {
      setProcessingId(null);
    }
  }

  const pending  = creatives.filter(c => c.status === 'PENDING_APPROVAL');
  const approved = creatives.filter(c => c.status === 'ACTIVE');
  const rejected = creatives.filter(c => c.status === 'REJECTED');

  return (
    <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Fábrica de Anuncios</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Revisión y aprobación de creatividades IA</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {pending.length > 0 && (
            <span className="bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 text-xs font-bold px-2 py-0.5 rounded-full">
              {pending.length} pendientes
            </span>
          )}
        </div>
      </div>

      {creatives.length === 0 ? (
        <div className="text-center py-8 text-slate-400 dark:text-slate-500">
          <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Sin creatividades aún. Usa el Piloto Automático para generar anuncios.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1 -mr-1">
          {['PENDING_APPROVAL', 'ACTIVE', 'REJECTED'].map((statusGroup) => {
            const group = creatives.filter(c => c.status === statusGroup);
            if (group.length === 0) return null;
            return (
              <div key={statusGroup}>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 mt-3">
                  {statusGroup === 'PENDING_APPROVAL' ? 'Pendientes de revisión' :
                   statusGroup === 'ACTIVE' ? 'Aprobados y activos' : 'Rechazados'}
                </p>
                {group.map((creative) => (
                  <div key={creative.id} className={`p-3 rounded-xl border mb-2 ${
                    creative.status === 'PENDING_APPROVAL' ? 'border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/5' :
                    creative.status === 'ACTIVE' ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/5' :
                    'border-slate-200 bg-slate-50 dark:border-neutral-700 dark:bg-neutral-800/50 opacity-60'
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${platformColors[creative.platform]} text-white`}>
                            {platformLabels[creative.platform] ?? creative.platform}
                          </span>
                          {creative.angle && (
                            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-neutral-700 px-1.5 py-0.5 rounded-full">
                              {creative.angle}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">{creative.headline}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{creative.description}</p>
                      </div>
                      {creative.status === 'PENDING_APPROVAL' && (
                        <div className="flex gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={processingId === creative.id}
                            onClick={() => handleAction(creative.id, 'ACTIVE')}
                            className="h-7 w-7 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center transition-colors disabled:opacity-40"
                            title="Aprobar y Lanzar"
                          >
                            {processingId === creative.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            type="button"
                            disabled={processingId === creative.id}
                            onClick={() => handleAction(creative.id, 'REJECTED')}
                            className="h-7 w-7 rounded-lg bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center transition-colors disabled:opacity-40"
                            title="Rechazar"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Tarjeta 4: Analítica Consolidada ─────────────────────────────────────────

function AnalyticsCard({ analytics }: { analytics: Analytics }) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center">
          <BarChart3 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Analítica Consolidada</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">RoAS y métricas unificadas Google + Meta</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">Gasto Total</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{fmt(analytics.totalSpend)}</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">Registros Atribuidos</p>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{analytics.totalConversions}</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">Costo por Lead (CPL)</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{fmt(analytics.cpl)}</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">Total de Clics</p>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">{analytics.totalClicks.toLocaleString('es-MX')}</p>
        </div>
      </div>

      {/* Chart */}
      {analytics.byDate.length > 0 ? (
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Gasto diario (últimos 30 días)
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={analytics.byDate} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(v: number) => [fmt(v), 'Gasto']}
              />
              <Bar dataKey="spend" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="text-center py-8 text-slate-400 dark:text-slate-500">
          <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Sin datos de campañas aún. Conecta tus cuentas publicitarias.</p>
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function MarketingAdminClient({ integrations, creatives, analytics }: Props) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-purple-500" />
          Marketing Automation IA
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Centro de control para campañas publicitarias con IA — Google Ads · Meta Ads
        </p>
      </div>

      {/* Grid 2x2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ConnectionsCard integrations={integrations} />
        <AutopilotCard />
        <CreativesCard creatives={creatives} />
        <AnalyticsCard analytics={analytics} />
      </div>
    </div>
  );
}
