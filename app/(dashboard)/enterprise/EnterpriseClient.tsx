'use client';

/**
 * CIFRA — Enterprise Multi-empresa Client
 * FASE 40 (FINAL): Lista de grupos empresariales con modal de creación
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Plus,
  Users,
  Briefcase,
  ChevronRight,
  Loader2,
  X,
  Globe,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import type { OrganizationRow } from './actions';
import { createOrganization } from './actions';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const PLAN_COLORS: Record<string, string> = {
  ENTERPRISE: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
  HOLDING:    'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
};

const GRADIENT_COLORS = [
  'from-violet-500 to-purple-700',
  'from-blue-500 to-indigo-700',
  'from-emerald-500 to-teal-700',
  'from-orange-500 to-red-600',
  'from-pink-500 to-rose-700',
  'from-cyan-500 to-sky-700',
];

// ─── Modal de Nueva Organización ─────────────────────────────────────────────

interface CreateOrgModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
}

function CreateOrgModal({ open, onClose, onCreated }: CreateOrgModalProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [plan, setPlan] = useState<'ENTERPRISE' | 'HOLDING'>('ENTERPRISE');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleNameChange(val: string) {
    setName(val);
    if (!slugEdited) {
      setSlug(slugify(val));
    }
  }

  function handleSlugChange(val: string) {
    setSlugEdited(true);
    setSlug(slugify(val));
  }

  function handleClose() {
    if (isPending) return;
    setName('');
    setSlug('');
    setSlugEdited(false);
    setPlan('ENTERPRISE');
    setError(null);
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError('El nombre es requerido'); return; }
    if (!slug.trim()) { setError('El slug es requerido'); return; }

    startTransition(async () => {
      try {
        const id = await createOrganization({ name, slug, plan });
        handleClose();
        onCreated(id);
      } catch (err: any) {
        setError(err.message ?? 'Error al crear la organización');
      }
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 dark:bg-violet-500/20 rounded-xl">
              <Building2 className="text-violet-600 dark:text-violet-400" size={20} />
            </div>
            <div>
              <h2 className="font-black text-neutral-900 dark:text-white text-lg leading-none">
                Nueva Organización
              </h2>
              <p className="text-neutral-500 text-xs mt-0.5">
                Grupo empresarial multi-subsidiaria
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isPending}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-sm text-red-700 dark:text-red-400">
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Nombre */}
          <div>
            <label className="block text-xs font-black text-neutral-600 dark:text-neutral-400 uppercase tracking-widest mb-2">
              Nombre del grupo *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ej: Grupo Empresarial Norte"
              disabled={isPending}
              className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-all disabled:opacity-60"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-xs font-black text-neutral-600 dark:text-neutral-400 uppercase tracking-widest mb-2">
              Slug (identificador URL) *
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="grupo-empresarial-norte"
              disabled={isPending}
              className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-mono text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-all disabled:opacity-60"
            />
            {slug && (
              <div className="flex items-center gap-1.5 mt-2">
                <Globe size={12} className="text-neutral-400" />
                <span className="text-xs text-neutral-500">
                  cifra.app/org/
                  <span className="text-violet-600 dark:text-violet-400 font-mono font-semibold">
                    {slug}
                  </span>
                </span>
              </div>
            )}
          </div>

          {/* Plan */}
          <div>
            <label className="block text-xs font-black text-neutral-600 dark:text-neutral-400 uppercase tracking-widest mb-2">
              Plan
            </label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value as 'ENTERPRISE' | 'HOLDING')}
              disabled={isPending}
              className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-all disabled:opacity-60 cursor-pointer"
            >
              <option value="ENTERPRISE">Enterprise — hasta 10 empresas</option>
              <option value="HOLDING">Holding — empresas ilimitadas</option>
            </select>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="flex-1 px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || !name.trim() || !slug.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 hover:bg-violet-700 text-white font-black rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-violet-500/25"
            >
              {isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Crear Organización
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Tarjeta de organización ──────────────────────────────────────────────────

interface OrgCardProps {
  org: OrganizationRow;
  colorIndex: number;
  onNavigate: (id: string) => void;
}

function OrgCard({ org, colorIndex, onNavigate }: OrgCardProps) {
  const gradient = GRADIENT_COLORS[colorIndex % GRADIENT_COLORS.length];
  const planClass = PLAN_COLORS[org.plan] ?? PLAN_COLORS.ENTERPRISE;
  const initial = org.name.charAt(0).toUpperCase();

  return (
    <div className="group bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm hover:shadow-md hover:border-violet-300 dark:hover:border-violet-600/50 transition-all duration-200 overflow-hidden flex flex-col">
      {/* Top bar gradient */}
      <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />

      <div className="p-6 flex flex-col flex-1 gap-4">
        {/* Header row */}
        <div className="flex items-start gap-4">
          {/* Logo / Initial */}
          <div className={`flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md`}>
            {org.logoUrl ? (
              <img src={org.logoUrl} alt={org.name} className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <span className="text-white font-black text-2xl">{initial}</span>
            )}
          </div>

          {/* Name + badge */}
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-neutral-900 dark:text-white text-lg leading-tight truncate">
              {org.name}
            </h3>
            <p className="text-neutral-400 text-xs font-mono mt-0.5 truncate">
              /{org.slug}
            </p>
            <span className={`inline-flex mt-2 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${planClass}`}>
              {org.plan}
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2.5 p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl">
            <Briefcase size={16} className="text-violet-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-black text-neutral-900 dark:text-white">{org.tenantCount}</p>
              <p className="text-[10px] text-neutral-500">
                {org.tenantCount === 1 ? 'empresa' : 'empresas'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl">
            <Users size={16} className="text-blue-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-black text-neutral-900 dark:text-white">{org.memberCount}</p>
              <p className="text-[10px] text-neutral-500">
                {org.memberCount === 1 ? 'miembro' : 'miembros'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-1.5 text-neutral-400">
            <Calendar size={12} />
            <span className="text-xs">{formatDate(org.createdAt)}</span>
          </div>

          <button
            onClick={() => onNavigate(org.id)}
            className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 dark:bg-white hover:bg-neutral-700 dark:hover:bg-neutral-100 text-white dark:text-black font-black text-xs rounded-xl transition-colors group-hover:bg-violet-600 group-hover:text-white dark:group-hover:bg-violet-600 dark:group-hover:text-white shadow-sm"
          >
            Ver dashboard
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Plan tag bottom strip */}
      <div className="px-6 py-2 bg-neutral-50 dark:bg-neutral-800/40 border-t border-neutral-100 dark:border-neutral-800">
        <span className="text-[10px] text-neutral-400 font-mono">
          Plan {org.plan.charAt(0) + org.plan.slice(1).toLowerCase()}
        </span>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="w-24 h-24 bg-gradient-to-br from-violet-100 to-purple-200 dark:from-violet-500/20 dark:to-purple-500/10 rounded-3xl flex items-center justify-center mb-6 shadow-lg">
        <span className="text-5xl select-none">🏢</span>
      </div>
      <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-3">
        Sin grupos empresariales
      </h2>
      <p className="text-neutral-500 dark:text-neutral-400 text-base max-w-sm mb-8 leading-relaxed">
        Crea tu primer grupo para gestionar múltiples empresas desde un solo panel consolidado
      </p>
      <button
        onClick={onCreate}
        className="flex items-center gap-2 px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white font-black rounded-2xl text-base transition-colors shadow-lg shadow-violet-500/30 hover:shadow-violet-500/40 hover:-translate-y-0.5 transform duration-150"
      >
        <Plus size={20} />
        Crear Organización
      </button>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface EnterpriseClientProps {
  initialOrganizations: OrganizationRow[];
}

export default function EnterpriseClient({ initialOrganizations }: EnterpriseClientProps) {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<OrganizationRow[]>(initialOrganizations);
  const [showModal, setShowModal] = useState(false);

  function handleCreated(id: string) {
    // Refresh from server then navigate
    router.refresh();
    router.push(`/enterprise/${id}`);
  }

  function handleNavigate(id: string) {
    router.push(`/enterprise/${id}`);
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">

      {/* ── Page Header ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-700 rounded-xl shadow-md shadow-violet-500/30">
              <Building2 className="text-white" size={22} />
            </div>
            <h1 className="text-3xl font-black text-neutral-950 dark:text-white">
              Enterprise Multi-empresa
            </h1>
          </div>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1 ml-1">
            Gestiona grupos empresariales y consolida KPIs de todas tus subsidiarias
          </p>
        </div>

        {organizations.length > 0 && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-violet-600 hover:bg-violet-700 text-white font-black rounded-xl text-sm transition-colors shadow-md shadow-violet-500/25 hover:-translate-y-0.5 transform duration-150"
          >
            <Plus size={16} />
            Nueva Organización
          </button>
        )}
      </div>

      {/* ── Summary strip (when orgs exist) ──────────────────── */}
      {organizations.length > 0 && (
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm">
            <Building2 size={14} className="text-violet-500" />
            <span className="font-black text-neutral-900 dark:text-white">{organizations.length}</span>
            <span className="text-neutral-500">{organizations.length === 1 ? 'organización' : 'organizaciones'}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm">
            <Briefcase size={14} className="text-blue-500" />
            <span className="font-black text-neutral-900 dark:text-white">
              {organizations.reduce((s, o) => s + o.tenantCount, 0)}
            </span>
            <span className="text-neutral-500">empresas en total</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm">
            <Users size={14} className="text-emerald-500" />
            <span className="font-black text-neutral-900 dark:text-white">
              {organizations.reduce((s, o) => s + o.memberCount, 0)}
            </span>
            <span className="text-neutral-500">miembros en total</span>
          </div>
        </div>
      )}

      {/* ── Content ──────────────────────────────────────────── */}
      {organizations.length === 0 ? (
        <EmptyState onCreate={() => setShowModal(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {organizations.map((org, idx) => (
            <OrgCard
              key={org.id}
              org={org}
              colorIndex={idx}
              onNavigate={handleNavigate}
            />
          ))}
        </div>
      )}

      {/* ── Modal ─────────────────────────────────────────────── */}
      <CreateOrgModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
