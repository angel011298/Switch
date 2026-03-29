'use client';

import { useState, useTransition } from 'react';
import type { WebhookEndpointRow, ApiKeyRow, WebhookDeliveryRow } from './actions';
import {
  createWebhook,
  toggleWebhook,
  deleteWebhook,
  getWebhookDeliveries,
  createApiKey,
  revokeApiKey,
  WEBHOOK_EVENTS,
  API_SCOPES,
} from './actions';

// ─── PROPS ────────────────────────────────────────────────────────────────────

interface Props {
  initialWebhooks: WebhookEndpointRow[];
  initialApiKeys: ApiKeyRow[];
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function successRateColor(rate: number): string {
  if (rate >= 95) return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400';
  if (rate >= 75) return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400';
  return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
}

function statusCodeColor(code: number | null): string {
  if (code === null) return 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400';
  if (code >= 200 && code < 300) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
  if (code >= 400 && code < 500) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function truncateUrl(url: string, max = 45): string {
  return url.length > max ? url.slice(0, max) + '…' : url;
}

// ─── COPY BUTTON ─────────────────────────────────────────────────────────────

function CopyButton({ text, label = 'Copiar' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors"
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Copiado
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}

// ─── TOGGLE SWITCH ────────────────────────────────────────────────────────────

function ToggleSwitch({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-neutral-600'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-4.5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

// ─── MODAL WRAPPER ────────────────────────────────────────────────────────────

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// ─── SIDE PANEL ───────────────────────────────────────────────────────────────

function DeliveryPanel({
  open,
  onClose,
  webhookUrl,
  deliveries,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  webhookUrl: string;
  deliveries: WebhookDeliveryRow[];
  loading: boolean;
}) {
  return (
    <div
      className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-neutral-900 shadow-2xl border-l border-neutral-200 dark:border-neutral-800 transform transition-transform duration-300 ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h2 className="text-sm font-bold text-neutral-900 dark:text-white">Historial de entregas</h2>
          <p className="text-xs text-neutral-500 truncate max-w-[280px]">{webhookUrl}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="overflow-y-auto h-[calc(100vh-65px)] p-4 space-y-2">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <svg className="w-6 h-6 animate-spin text-emerald-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}

        {!loading && deliveries.length === 0 && (
          <div className="text-center py-12 text-neutral-400 dark:text-neutral-600">
            <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-sm font-medium">Sin entregas aún</p>
          </div>
        )}

        {!loading && deliveries.map((d) => (
          <div
            key={d.id}
            className="flex items-start gap-3 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50"
          >
            <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${d.success ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
              {d.success ? (
                <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-3 h-3 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-semibold text-neutral-700 dark:text-neutral-300">{d.event}</span>
                {d.statusCode !== null && (
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${statusCodeColor(d.statusCode)}`}>
                    {d.statusCode}
                  </span>
                )}
                {d.attemptCount > 1 && (
                  <span className="text-xs text-neutral-400">{d.attemptCount} intentos</span>
                )}
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">{formatDate(d.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function IntegracionesClient({ initialWebhooks, initialApiKeys }: Props) {
  const [activeTab, setActiveTab] = useState<'webhooks' | 'apikeys'>('webhooks');
  const [isPending, startTransition] = useTransition();

  // Webhooks state
  const [webhooks, setWebhooks] = useState<WebhookEndpointRow[]>(initialWebhooks);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [webhookForm, setWebhookForm] = useState({ url: '', description: '', events: [] as string[] });
  const [webhookError, setWebhookError] = useState<string | null>(null);
  const [newWebhookSecret, setNewWebhookSecret] = useState<string | null>(null);

  // Delivery panel state
  const [deliveryPanel, setDeliveryPanel] = useState<{ open: boolean; webhookId: string; webhookUrl: string }>({
    open: false, webhookId: '', webhookUrl: '',
  });
  const [deliveries, setDeliveries] = useState<WebhookDeliveryRow[]>([]);
  const [deliveriesLoading, setDeliveriesLoading] = useState(false);

  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKeyRow[]>(initialApiKeys);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyForm, setApiKeyForm] = useState({ name: '', scopes: [] as string[], expiresAt: '' });
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);

  // ── Webhook handlers ────────────────────────────────────────────────────────

  function handleWebhookEventToggle(value: string) {
    setWebhookForm((f) => ({
      ...f,
      events: f.events.includes(value)
        ? f.events.filter((e) => e !== value)
        : [...f.events, value],
    }));
  }

  function handleCreateWebhookSubmit(e: React.FormEvent) {
    e.preventDefault();
    setWebhookError(null);
    startTransition(async () => {
      try {
        const result = await createWebhook({
          url: webhookForm.url,
          events: webhookForm.events,
          description: webhookForm.description || undefined,
        });
        const newRow: WebhookEndpointRow = {
          id: result.id,
          url: webhookForm.url,
          events: webhookForm.events,
          active: true,
          description: webhookForm.description || null,
          deliveriesCount: 0,
          successRate: 100,
          createdAt: new Date().toISOString(),
        };
        setWebhooks((prev) => [newRow, ...prev]);
        setNewWebhookSecret(result.secret);
        setWebhookForm({ url: '', description: '', events: [] });
      } catch (err) {
        setWebhookError(err instanceof Error ? err.message : 'Error al crear webhook');
      }
    });
  }

  function handleToggleWebhook(webhookId: string) {
    startTransition(async () => {
      try {
        const newActive = await toggleWebhook(webhookId);
        setWebhooks((prev) =>
          prev.map((w) => (w.id === webhookId ? { ...w, active: newActive } : w))
        );
      } catch {
        // silent
      }
    });
  }

  function handleDeleteWebhook(webhookId: string) {
    if (!confirm('¿Eliminar este webhook? Se borrará el historial de entregas.')) return;
    startTransition(async () => {
      try {
        await deleteWebhook(webhookId);
        setWebhooks((prev) => prev.filter((w) => w.id !== webhookId));
      } catch {
        // silent
      }
    });
  }

  async function handleOpenDeliveries(wh: WebhookEndpointRow) {
    setDeliveryPanel({ open: true, webhookId: wh.id, webhookUrl: wh.url });
    setDeliveries([]);
    setDeliveriesLoading(true);
    try {
      const rows = await getWebhookDeliveries(wh.id);
      setDeliveries(rows);
    } finally {
      setDeliveriesLoading(false);
    }
  }

  function handleCloseWebhookModal() {
    setShowWebhookModal(false);
    setWebhookError(null);
    setNewWebhookSecret(null);
    setWebhookForm({ url: '', description: '', events: [] });
  }

  // ── API Key handlers ─────────────────────────────────────────────────────────

  function handleScopeToggle(value: string) {
    setApiKeyForm((f) => ({
      ...f,
      scopes: f.scopes.includes(value)
        ? f.scopes.filter((s) => s !== value)
        : [...f.scopes, value],
    }));
  }

  function handleCreateApiKeySubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiKeyError(null);
    startTransition(async () => {
      try {
        const result = await createApiKey({
          name: apiKeyForm.name,
          scopes: apiKeyForm.scopes,
          expiresAt: apiKeyForm.expiresAt || undefined,
        });
        const newRow: ApiKeyRow = {
          id: result.id,
          name: apiKeyForm.name,
          keyPrefix: result.key.slice(0, 16),
          scopes: apiKeyForm.scopes,
          lastUsedAt: null,
          expiresAt: apiKeyForm.expiresAt ? new Date(apiKeyForm.expiresAt).toISOString() : null,
          active: true,
          createdAt: new Date().toISOString(),
        };
        setApiKeys((prev) => [newRow, ...prev]);
        setNewApiKey(result.key);
        setApiKeyForm({ name: '', scopes: [], expiresAt: '' });
      } catch (err) {
        setApiKeyError(err instanceof Error ? err.message : 'Error al crear API key');
      }
    });
  }

  function handleRevokeApiKey(keyId: string) {
    if (!confirm('¿Revocar esta API key? Las integraciones que la usen dejarán de funcionar.')) return;
    startTransition(async () => {
      try {
        await revokeApiKey(keyId);
        setApiKeys((prev) =>
          prev.map((k) => (k.id === keyId ? { ...k, active: false } : k))
        );
      } catch {
        // silent
      }
    });
  }

  function handleCloseApiKeyModal() {
    setShowApiKeyModal(false);
    setApiKeyError(null);
    setNewApiKey(null);
    setApiKeyForm({ name: '', scopes: [], expiresAt: '' });
  }

  // ─── RENDER ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tighter">Integraciones</h1>
        <p className="text-neutral-500 dark:text-neutral-400 font-medium mt-1">
          Conecta CIFRA con tus apps mediante webhooks y API keys.
        </p>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl w-fit">
        {(['webhooks', 'apikeys'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === tab
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
            }`}
          >
            {tab === 'webhooks' ? 'Webhooks' : 'API Keys'}
          </button>
        ))}
      </div>

      {/* ── TAB: WEBHOOKS ─────────────────────────────────────────────────────── */}
      {activeTab === 'webhooks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Webhook Endpoints</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{webhooks.length} endpoint{webhooks.length !== 1 ? 's' : ''} configurado{webhooks.length !== 1 ? 's' : ''}</p>
            </div>
            <button
              onClick={() => setShowWebhookModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-950 dark:bg-white text-white dark:text-black text-sm font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Agregar Webhook
            </button>
          </div>

          {webhooks.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-700">
              <svg className="w-12 h-12 mx-auto text-neutral-300 dark:text-neutral-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <p className="text-neutral-500 font-medium">No hay webhooks configurados</p>
              <p className="text-neutral-400 text-sm mt-1">Agrega un endpoint para recibir eventos en tiempo real.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 dark:border-neutral-800">
                    <th className="text-left px-5 py-3 text-xs font-black uppercase text-neutral-400 tracking-wider">URL</th>
                    <th className="text-left px-5 py-3 text-xs font-black uppercase text-neutral-400 tracking-wider">Eventos</th>
                    <th className="text-center px-5 py-3 text-xs font-black uppercase text-neutral-400 tracking-wider">Estado</th>
                    <th className="text-center px-5 py-3 text-xs font-black uppercase text-neutral-400 tracking-wider">Éxito</th>
                    <th className="text-center px-5 py-3 text-xs font-black uppercase text-neutral-400 tracking-wider">Entregas</th>
                    <th className="text-right px-5 py-3 text-xs font-black uppercase text-neutral-400 tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {webhooks.map((wh) => (
                    <tr key={wh.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-mono text-xs text-neutral-700 dark:text-neutral-300">{truncateUrl(wh.url)}</div>
                        {wh.description && (
                          <div className="text-xs text-neutral-400 mt-0.5">{wh.description}</div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {wh.events.slice(0, 3).map((ev) => (
                            <span key={ev} className="text-[10px] font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 px-1.5 py-0.5 rounded-md">{ev}</span>
                          ))}
                          {wh.events.length > 3 && (
                            <span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-500 px-1.5 py-0.5 rounded-md font-medium">+{wh.events.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <ToggleSwitch
                          checked={wh.active}
                          onChange={() => handleToggleWebhook(wh.id)}
                          disabled={isPending}
                        />
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${successRateColor(wh.successRate)}`}>
                          {wh.successRate}%
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">{wh.deliveriesCount}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenDeliveries(wh)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Entregas
                          </button>
                          <button
                            onClick={() => handleDeleteWebhook(wh.id)}
                            disabled={isPending}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: API KEYS ─────────────────────────────────────────────────────── */}
      {activeTab === 'apikeys' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">API Keys</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{apiKeys.filter((k) => k.active).length} activa{apiKeys.filter((k) => k.active).length !== 1 ? 's' : ''}</p>
            </div>
            <button
              onClick={() => setShowApiKeyModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-950 dark:bg-white text-white dark:text-black text-sm font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Crear API Key
            </button>
          </div>

          {apiKeys.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-700">
              <svg className="w-12 h-12 mx-auto text-neutral-300 dark:text-neutral-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <p className="text-neutral-500 font-medium">No hay API keys</p>
              <p className="text-neutral-400 text-sm mt-1">Crea una key para integrar CIFRA con tus sistemas.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 dark:border-neutral-800">
                    <th className="text-left px-5 py-3 text-xs font-black uppercase text-neutral-400 tracking-wider">Nombre</th>
                    <th className="text-left px-5 py-3 text-xs font-black uppercase text-neutral-400 tracking-wider">Prefijo</th>
                    <th className="text-left px-5 py-3 text-xs font-black uppercase text-neutral-400 tracking-wider">Permisos</th>
                    <th className="text-left px-5 py-3 text-xs font-black uppercase text-neutral-400 tracking-wider">Último uso</th>
                    <th className="text-left px-5 py-3 text-xs font-black uppercase text-neutral-400 tracking-wider">Expira</th>
                    <th className="text-center px-5 py-3 text-xs font-black uppercase text-neutral-400 tracking-wider">Estado</th>
                    <th className="text-right px-5 py-3 text-xs font-black uppercase text-neutral-400 tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {apiKeys.map((k) => (
                    <tr key={k.id} className={`hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors ${!k.active ? 'opacity-50' : ''}`}>
                      <td className="px-5 py-4">
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">{k.name}</span>
                      </td>
                      <td className="px-5 py-4">
                        <code className="text-xs font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-2 py-1 rounded-lg">{k.keyPrefix}…</code>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-semibold bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-lg">
                          {k.scopes.length} permiso{k.scopes.length !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-neutral-500">{formatDate(k.lastUsedAt)}</td>
                      <td className="px-5 py-4 text-xs text-neutral-500">
                        {k.expiresAt ? (
                          new Date(k.expiresAt) < new Date() ? (
                            <span className="text-red-500 font-semibold">Expirada</span>
                          ) : (
                            formatDate(k.expiresAt)
                          )
                        ) : (
                          <span className="text-neutral-400">Sin expiración</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${k.active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800'}`}>
                          {k.active ? 'Activa' : 'Revocada'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {k.active && (
                          <button
                            onClick={() => handleRevokeApiKey(k.id)}
                            disabled={isPending}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 ml-auto"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                            Revocar
                          </button>
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

      {/* ── DOCUMENTATION PANEL ───────────────────────────────────────────────── */}
      <div className="bg-neutral-950 dark:bg-black rounded-2xl p-6 space-y-5 border border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Documentación rápida</h3>
            <p className="text-xs text-neutral-400">Referencia de la API REST pública de CIFRA</p>
          </div>
          <a href="#" className="ml-auto text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
            Docs completos →
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">Base URL</p>
              <code className="block text-xs font-mono bg-neutral-900 text-emerald-400 px-3 py-2 rounded-lg border border-neutral-800">
                https://api.cifra.app/v1
              </code>
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">Autenticación</p>
              <pre className="text-xs font-mono bg-neutral-900 text-neutral-300 px-3 py-2.5 rounded-lg border border-neutral-800 overflow-x-auto whitespace-pre-wrap">{`Authorization: Bearer cifra_sk_xxxx`}</pre>
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">Ejemplo cURL</p>
              <pre className="text-xs font-mono bg-neutral-900 text-neutral-300 px-3 py-2.5 rounded-lg border border-neutral-800 overflow-x-auto">{`curl https://api.cifra.app/v1/invoices \\
  -H "Authorization: Bearer cifra_sk_..." \\
  -H "Content-Type: application/json"`}</pre>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">Endpoints disponibles</p>
            {[
              { method: 'GET',  path: '/v1/invoices',        desc: 'Listar facturas' },
              { method: 'GET',  path: '/v1/invoices/:id',    desc: 'Obtener factura' },
              { method: 'GET',  path: '/v1/customers',       desc: 'Listar clientes' },
              { method: 'POST', path: '/v1/customers',       desc: 'Crear cliente' },
              { method: 'GET',  path: '/v1/inventory',       desc: 'Listar productos' },
              { method: 'GET',  path: '/v1/employees',       desc: 'Listar empleados' },
              { method: 'GET',  path: '/v1/reports/summary', desc: 'Resumen financiero' },
            ].map((ep) => (
              <div key={ep.path} className="flex items-center gap-2 text-xs">
                <span className={`font-mono font-bold w-10 text-center px-1 py-0.5 rounded text-[10px] ${ep.method === 'GET' ? 'bg-blue-900/40 text-blue-400' : 'bg-emerald-900/40 text-emerald-400'}`}>
                  {ep.method}
                </span>
                <code className="text-neutral-300 font-mono">{ep.path}</code>
                <span className="text-neutral-600 ml-auto">{ep.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MODAL: CREAR WEBHOOK ───────────────────────────────────────────────── */}
      <Modal
        open={showWebhookModal && !newWebhookSecret}
        onClose={handleCloseWebhookModal}
        title="Agregar Webhook"
      >
        <form onSubmit={handleCreateWebhookSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase text-neutral-400 tracking-wider">URL del Endpoint *</label>
            <input
              type="url"
              required
              value={webhookForm.url}
              onChange={(e) => setWebhookForm((f) => ({ ...f, url: e.target.value }))}
              placeholder="https://mi-app.com/webhooks/cifra"
              className="w-full px-4 py-3 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono"
            />
            <p className="text-xs text-neutral-400">Debe usar HTTPS.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase text-neutral-400 tracking-wider">Descripción</label>
            <input
              type="text"
              value={webhookForm.description}
              onChange={(e) => setWebhookForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Ej: Notificaciones de facturación para Slack"
              className="w-full px-4 py-3 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-neutral-400 tracking-wider">
              Eventos a suscribir * ({webhookForm.events.length} seleccionados)
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {WEBHOOK_EVENTS.map((ev) => (
                <label key={ev.value} className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all text-sm ${webhookForm.events.includes(ev.value) ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'}`}>
                  <input
                    type="checkbox"
                    checked={webhookForm.events.includes(ev.value)}
                    onChange={() => handleWebhookEventToggle(ev.value)}
                    className="w-4 h-4 accent-emerald-500 rounded flex-shrink-0"
                  />
                  <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 leading-tight">{ev.label}</span>
                </label>
              ))}
            </div>
          </div>

          {webhookError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {webhookError}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={handleCloseWebhookModal} className="flex-1 px-4 py-2.5 text-sm font-semibold border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2.5 text-sm font-bold bg-neutral-950 dark:bg-white text-white dark:text-black rounded-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 disabled:scale-100 flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creando…
                </>
              ) : 'Crear Webhook'}
            </button>
          </div>
        </form>
      </Modal>

      {/* WEBHOOK SECRET REVEAL */}
      <Modal open={!!newWebhookSecret} onClose={handleCloseWebhookModal} title="Webhook creado">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Guarda este secreto ahora</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">No lo podrás ver de nuevo. Úsalo para verificar la firma HMAC-SHA256 de los payloads.</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-black uppercase text-neutral-400 tracking-wider">Webhook Secret</p>
            <div className="flex items-center gap-2 p-3 bg-neutral-900 rounded-xl border border-neutral-700">
              <code className="flex-1 text-xs font-mono text-emerald-400 break-all">{newWebhookSecret}</code>
              <CopyButton text={newWebhookSecret ?? ''} />
            </div>
          </div>

          <div className="space-y-1.5 text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800 rounded-xl p-3">
            <p className="font-semibold text-neutral-700 dark:text-neutral-300">Verificar la firma en tu servidor:</p>
            <pre className="font-mono overflow-x-auto text-[11px]">{`const sig = req.headers['x-cifra-signature'];
const expected = 'sha256=' + createHmac('sha256', secret)
  .update(rawBody).digest('hex');
if (sig !== expected) throw new Error('Invalid signature');`}</pre>
          </div>

          <button
            onClick={handleCloseWebhookModal}
            className="w-full px-4 py-2.5 text-sm font-bold bg-neutral-950 dark:bg-white text-white dark:text-black rounded-xl hover:scale-[1.01] transition-all"
          >
            Entendido, ya copié el secreto
          </button>
        </div>
      </Modal>

      {/* ── MODAL: CREAR API KEY ───────────────────────────────────────────────── */}
      <Modal
        open={showApiKeyModal && !newApiKey}
        onClose={handleCloseApiKeyModal}
        title="Crear API Key"
      >
        <form onSubmit={handleCreateApiKeySubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase text-neutral-400 tracking-wider">Nombre descriptivo *</label>
            <input
              type="text"
              required
              value={apiKeyForm.name}
              onChange={(e) => setApiKeyForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ej: App móvil, Integración Zapier, ERP externo"
              className="w-full px-4 py-3 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-neutral-400 tracking-wider">
              Permisos * ({apiKeyForm.scopes.length} seleccionados)
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
              {API_SCOPES.map((sc) => (
                <label key={sc.value} className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all text-sm ${apiKeyForm.scopes.includes(sc.value) ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'}`}>
                  <input
                    type="checkbox"
                    checked={apiKeyForm.scopes.includes(sc.value)}
                    onChange={() => handleScopeToggle(sc.value)}
                    className="w-4 h-4 accent-blue-500 rounded flex-shrink-0"
                  />
                  <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 leading-tight">{sc.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase text-neutral-400 tracking-wider">Fecha de expiración (opcional)</label>
            <input
              type="date"
              value={apiKeyForm.expiresAt}
              onChange={(e) => setApiKeyForm((f) => ({ ...f, expiresAt: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
            <p className="text-xs text-neutral-400">Deja vacío para no expirar nunca.</p>
          </div>

          {apiKeyError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {apiKeyError}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={handleCloseApiKeyModal} className="flex-1 px-4 py-2.5 text-sm font-semibold border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2.5 text-sm font-bold bg-neutral-950 dark:bg-white text-white dark:text-black rounded-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 disabled:scale-100 flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generando…
                </>
              ) : 'Generar API Key'}
            </button>
          </div>
        </form>
      </Modal>

      {/* API KEY REVEAL */}
      <Modal open={!!newApiKey} onClose={handleCloseApiKeyModal} title="API Key generada">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Copia tu API key ahora</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Por seguridad, solo se muestra una vez. Guárdala en un lugar seguro.</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-black uppercase text-neutral-400 tracking-wider">Tu API Key</p>
            <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-700 space-y-2">
              <code className="block text-xs font-mono text-emerald-400 break-all">{newApiKey}</code>
              <CopyButton text={newApiKey ?? ''} label="Copiar key completa" />
            </div>
          </div>

          <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4">
            <p className="font-bold text-neutral-800 dark:text-neutral-200 text-sm">Instrucciones de uso</p>
            <p>Incluye la key en el encabezado <code className="font-mono bg-neutral-200 dark:bg-neutral-700 px-1 rounded">Authorization</code> de cada request:</p>
            <pre className="font-mono overflow-x-auto text-[11px] bg-neutral-900 dark:bg-black text-neutral-300 rounded-lg p-2.5">{`curl https://api.cifra.app/v1/invoices \\
  -H "Authorization: Bearer ${newApiKey ?? 'cifra_sk_...'}" \\
  -H "Content-Type: application/json"`}</pre>
            <p className="text-neutral-500">Nunca compartas tu key en repositorios públicos ni en el cliente.</p>
          </div>

          <button
            onClick={handleCloseApiKeyModal}
            className="w-full px-4 py-2.5 text-sm font-bold bg-neutral-950 dark:bg-white text-white dark:text-black rounded-xl hover:scale-[1.01] transition-all"
          >
            Entendido, ya copié la key
          </button>
        </div>
      </Modal>

      {/* DELIVERY SIDE PANEL BACKDROP */}
      {deliveryPanel.open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setDeliveryPanel((s) => ({ ...s, open: false }))}
        />
      )}

      {/* DELIVERY SIDE PANEL */}
      <DeliveryPanel
        open={deliveryPanel.open}
        onClose={() => setDeliveryPanel((s) => ({ ...s, open: false }))}
        webhookUrl={deliveryPanel.webhookUrl}
        deliveries={deliveries}
        loading={deliveriesLoading}
      />
    </div>
  );
}
