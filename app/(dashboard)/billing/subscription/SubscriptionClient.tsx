'use client';

/**
 * CIFRA — Página de Suscripción con Stripe (FASE 22)
 * ========================================================
 * Muestra el plan actual + tabla de pricing con los 3 planes.
 * Acciones: Checkout (nuevo), Portal (gestionar existente).
 */

import { useState, useTransition } from 'react';
import { CheckCircle2, Zap, Crown, Star, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { createCheckoutSession, createPortalSession } from './actions';
import type { PLANS } from '@/lib/billing/plans';
import type { PlanSlug } from '@/lib/billing/plans';
import { formatMXN } from '@/lib/billing/plans';

type SubData = {
  planId: string | null;
  status: string;
  validUntil: Date | null;
  trialEnds: Date | null;
  stripeSubscriptionId: string | null;
  stripeCurrentPeriodEnd: Date | null;
  hasStripe: boolean;
  planDetails: (typeof PLANS)[number] | null;
  allPlans: typeof PLANS;
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  TRIAL:     { label: 'Prueba gratuita',  color: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400'   },
  ACTIVE:    { label: 'Activa',           color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400' },
  PAST_DUE:  { label: 'Pago pendiente',  color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400'   },
  SUSPENDED: { label: 'Suspendida',      color: 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400'         },
  CANCELED:  { label: 'Cancelada',       color: 'text-slate-500 bg-slate-100 dark:bg-neutral-800 dark:text-slate-400'      },
};

const PLAN_ICONS = {
  starter:    Zap,
  pro:        Star,
  enterprise: Crown,
};

function formatDate(d: Date | null) {
  if (!d) return '—';
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(new Date(d));
}

export default function SubscriptionClient({ sub }: { sub: SubData }) {
  const [billing, setBilling]   = useState<'monthly' | 'annual'>('monthly');
  const [error, setError]       = useState('');
  const [isPending, startTrans] = useTransition();
  const [loadingPlan, setLoadingPlan] = useState<PlanSlug | null>(null);

  const statusInfo = STATUS_LABELS[sub.status] ?? STATUS_LABELS['TRIAL'];

  async function handleSelectPlan(planSlug: PlanSlug) {
    setError('');
    setLoadingPlan(planSlug);
    startTrans(async () => {
      try {
        const { url } = await createCheckoutSession(planSlug, billing);
        window.location.href = url;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al iniciar el pago');
        setLoadingPlan(null);
      }
    });
  }

  async function handleManage() {
    setError('');
    startTrans(async () => {
      try {
        const { url } = await createPortalSession();
        window.location.href = url;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al abrir el portal');
      }
    });
  }

  return (
    <div className="space-y-8">

      {/* ── Plan actual ─────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Plan actual</p>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white capitalize">
              {sub.planDetails?.name ?? (sub.planId ?? 'Sin plan')}
            </h2>
            <div className="flex items-center gap-3 mt-2">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
              {sub.validUntil && (
                <span className="text-xs text-slate-400">
                  Vence: {formatDate(sub.validUntil)}
                </span>
              )}
              {sub.trialEnds && sub.status === 'TRIAL' && (
                <span className="text-xs text-blue-500">
                  Trial termina: {formatDate(sub.trialEnds)}
                </span>
              )}
            </div>
          </div>
          {sub.hasStripe && (
            <button
              onClick={handleManage}
              disabled={isPending}
              className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-neutral-700 px-4 py-2 rounded-xl transition-all"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
              Gestionar suscripción
            </button>
          )}
        </div>

        {(sub.status === 'PAST_DUE' || sub.status === 'SUSPENDED') && (
          <div className="mt-4 flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl text-amber-700 dark:text-amber-400 text-sm">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            Tu suscripción tiene un problema de pago. Usa "Gestionar suscripción" para actualizar tu método de pago.
          </div>
        )}
      </div>

      {/* ── Error ───────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Toggle mensual / anual ───────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-1 bg-slate-100 dark:bg-neutral-800 p-1 rounded-xl w-fit mx-auto">
        <button
          onClick={() => setBilling('monthly')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            billing === 'monthly'
              ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          Mensual
        </button>
        <button
          onClick={() => setBilling('annual')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            billing === 'annual'
              ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          Anual
          <span className="text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-400 px-1.5 py-0.5 rounded-md">
            -17%
          </span>
        </button>
      </div>

      {/* ── Cards de planes ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sub.allPlans.map((plan) => {
          const Icon        = PLAN_ICONS[plan.slug] ?? Zap;
          const price       = billing === 'annual' ? plan.annualPrice : plan.monthlyPrice;
          const isCurrentPlan = sub.planId === plan.slug && sub.status === 'ACTIVE';
          const isLoading   = loadingPlan === plan.slug && isPending;

          return (
            <div
              key={plan.slug}
              className={`relative flex flex-col rounded-2xl border p-6 transition-all ${
                plan.highlighted
                  ? 'border-slate-900 dark:border-white shadow-xl ring-1 ring-slate-900 dark:ring-white scale-[1.02]'
                  : 'border-slate-200 dark:border-neutral-700'
              } bg-white dark:bg-neutral-900`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-black text-xs font-bold px-4 py-1 rounded-full">
                  Más popular
                </div>
              )}

              <div className="mb-4">
                <div className={`inline-flex p-2 rounded-xl mb-3 ${plan.highlighted ? 'bg-slate-900 dark:bg-white' : 'bg-slate-100 dark:bg-neutral-800'}`}>
                  <Icon className={`h-5 w-5 ${plan.highlighted ? 'text-white dark:text-black' : 'text-slate-600 dark:text-slate-300'}`} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {formatMXN(price)}
                </span>
                <span className="text-sm text-slate-400 ml-1">
                  {billing === 'annual' ? '/año' : '/mes'}
                </span>
                {billing === 'annual' && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                    Equivale a {formatMXN(Math.round(price / 12))}/mes
                  </p>
                )}
              </div>

              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              {isCurrentPlan ? (
                <div className="w-full text-center py-2.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-200 dark:border-emerald-500/20">
                  ✓ Plan actual
                </div>
              ) : (
                <button
                  onClick={() => handleSelectPlan(plan.slug)}
                  disabled={isPending}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 ${
                    plan.highlighted
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-100'
                      : 'bg-slate-100 dark:bg-neutral-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Procesando…</>
                  ) : (
                    `Comenzar con ${plan.name}`
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <p className="text-center text-xs text-slate-400 dark:text-slate-600">
        Todos los planes incluyen 14 días de prueba gratuita · Cancela cuando quieras · Pagos procesados por Stripe
      </p>
    </div>
  );
}
