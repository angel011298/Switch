import { redirect } from 'next/navigation';
import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { generateFiscalObligations, OBLIGATION_COLORS, AUTHORITY_COLORS } from '@/lib/fiscal/calendar';
import { Calendar, AlertTriangle, CheckCircle2, Clock, ExternalLink, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Cumplimiento Fiscal | CIFRA' };

const STATUS_ICONS = {
  OVERDUE:   AlertTriangle,
  DUE_SOON:  Clock,
  UPCOMING:  Calendar,
  COMPLETED: CheckCircle2,
};

const STATUS_LABELS = {
  OVERDUE:   'Vencida',
  DUE_SOON:  'Próxima a vencer',
  UPCOMING:  'Próxima',
  COMPLETED: 'Completada',
};

export default async function CumplimientoPage() {
  const session = await getSwitchSession();
  if (!session?.tenantId) redirect('/login');

  const [tenant, employeeCount] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { taxRegime: { select: { satCode: true, name: true } } },
    }),
    prisma.employee.count({ where: { tenantId: session.tenantId, isActive: true } }),
  ]);

  const regimeCode = tenant?.taxRegime?.satCode ?? null;
  const hasPayroll = employeeCount > 0;
  const obligations = generateFiscalObligations(regimeCode, hasPayroll, 90);

  const overdue  = obligations.filter(o => o.status === 'OVERDUE');
  const dueSoon  = obligations.filter(o => o.status === 'DUE_SOON');
  const upcoming = obligations.filter(o => o.status === 'UPCOMING');

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-6 h-6 text-blue-500" />
          Cumplimiento Fiscal
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Obligaciones fiscales de los próximos 90 días
          {regimeCode && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-neutral-800 text-xs font-medium">
              {tenant?.taxRegime?.name ?? regimeCode}
            </span>
          )}
        </p>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-center">
          <p className="text-3xl font-bold text-rose-400">{overdue.length}</p>
          <p className="text-xs text-rose-300 mt-1">Vencidas</p>
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-center">
          <p className="text-3xl font-bold text-amber-400">{dueSoon.length}</p>
          <p className="text-xs text-amber-300 mt-1">Próximas a vencer</p>
        </div>
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 text-center">
          <p className="text-3xl font-bold text-blue-400">{upcoming.length}</p>
          <p className="text-xs text-blue-300 mt-1">Programadas</p>
        </div>
      </div>

      {/* Alerta si hay vencidas */}
      {overdue.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4">
          <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-300 text-sm">
              Tienes {overdue.length} obligación{overdue.length > 1 ? 'es' : ''} vencida{overdue.length > 1 ? 's' : ''}
            </p>
            <p className="text-rose-400/80 text-xs mt-0.5">
              Las declaraciones fuera de plazo generan recargos y multas del SAT. Regularízate lo antes posible.
            </p>
          </div>
        </div>
      )}

      {/* Lista de obligaciones */}
      <div className="space-y-3">
        {obligations.length === 0 ? (
          <div className="text-center py-16 text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-400" />
            <p className="font-medium">Sin obligaciones en los próximos 90 días</p>
          </div>
        ) : (
          obligations.map(ob => {
            const Icon = STATUS_ICONS[ob.status];
            const colorClass = OBLIGATION_COLORS[ob.status];
            const authColor = AUTHORITY_COLORS[ob.authority];

            return (
              <div
                key={ob.id}
                className={`rounded-xl border p-4 flex items-start gap-4 ${colorClass}`}
              >
                <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{ob.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${authColor}`}>
                      {ob.authority}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-slate-400">
                      {ob.period}
                    </span>
                    <span className="text-xs font-medium ml-auto">
                      {STATUS_LABELS[ob.status]}
                    </span>
                  </div>
                  <p className="text-xs opacity-80">{ob.description}</p>
                </div>
                <div className="text-right flex-shrink-0 space-y-1">
                  <p className="text-xs font-mono">
                    {ob.dueDate.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                  </p>
                  <p className="text-xs">
                    {ob.daysLeft < 0
                      ? `${Math.abs(ob.daysLeft)}d vencida`
                      : ob.daysLeft === 0
                      ? 'Hoy'
                      : `${ob.daysLeft}d restantes`}
                  </p>
                  {ob.link && (
                    <a
                      href={ob.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs opacity-60 hover:opacity-100 transition-opacity"
                    >
                      Portal <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer info */}
      <p className="text-xs text-slate-500 dark:text-slate-600 text-center">
        Las fechas son orientativas. Confirma siempre con tu contador y el SAT.
        El plazo puede variar si cae en día inhábil.
      </p>
    </div>
  );
}
