'use client';

import { useState, useEffect } from 'react';

interface Integration {
  id: string;
  name: string;
  category: string;
  description: string;
  longDescription: string;
  icon: string;
  color: string;
  installed: boolean;
  popular: boolean;
  new: boolean;
  features: string[];
  webhookEvents?: string[];
  setupSteps: string[];
  docsUrl: string;
}

const INTEGRATIONS_SEED: Integration[] = [
  {
    id: 'zapier',
    name: 'Zapier',
    category: 'Automatización',
    description: 'Conecta CIFRA con más de 6,000 apps sin código',
    longDescription:
      'Usa Zapier para automatizar tareas repetitivas entre CIFRA y tus otras herramientas. Crea "Zaps" que se activan automáticamente cuando ocurren eventos en tu ERP.',
    icon: '⚡',
    color: 'from-orange-500 to-amber-500',
    installed: false,
    popular: true,
    new: false,
    features: ['Facturas → Google Sheets', 'Nueva venta → Slack', 'Cliente nuevo → HubSpot', '+200 plantillas'],
    webhookEvents: ['invoice.stamped', 'pos.sale', 'customer.created'],
    setupSteps: [
      'Copia tu API Key de CIFRA',
      'Crea una cuenta en Zapier',
      'Busca "CIFRA" en Zapier',
      'Conecta con tu API Key',
    ],
    docsUrl: '#',
  },
  {
    id: 'slack',
    name: 'Slack',
    category: 'Comunicación',
    description: 'Recibe notificaciones de CIFRA en tus canales de Slack',
    longDescription:
      'Mantén a tu equipo informado con alertas automáticas en Slack: nuevas ventas, stock bajo, facturas pendientes y más.',
    icon: '💬',
    color: 'from-purple-500 to-violet-500',
    installed: false,
    popular: true,
    new: false,
    features: [
      'Alerta de stock bajo',
      'Resumen diario de ventas',
      'Notificaciones de nómina',
      'Alertas de facturas vencidas',
    ],
    webhookEvents: ['stock.low', 'pos.sale', 'payroll.closed', 'invoice.stamped'],
    setupSteps: [
      'Crea un Incoming Webhook en Slack',
      'Copia la URL del webhook',
      'Pégala en CIFRA > Integraciones > Webhooks',
      'Suscríbete a los eventos deseados',
    ],
    docsUrl: '#',
  },
  {
    id: 'google-sheets',
    name: 'Google Sheets',
    category: 'Reportes',
    description: 'Exporta datos de CIFRA a hojas de cálculo automáticamente',
    longDescription:
      'Sincroniza facturas, ventas, inventario y empleados con Google Sheets para crear reportes personalizados y análisis avanzados.',
    icon: '📊',
    color: 'from-green-500 to-emerald-500',
    installed: false,
    popular: false,
    new: false,
    features: [
      'Sync facturas diario',
      'Inventario en tiempo real',
      'Reportes de nómina',
      'Dashboards personalizados',
    ],
    webhookEvents: ['invoice.stamped', 'pos.sale'],
    setupSteps: [
      'Crea un script de Apps Script en Google Sheets',
      'Pega el código de nuestra plantilla',
      'Copia la URL del Web App',
      'Configura el webhook en CIFRA',
    ],
    docsUrl: '#',
  },
  {
    id: 'mercado-libre',
    name: 'Mercado Libre',
    category: 'E-commerce',
    description: 'Sincroniza tu catálogo y ventas de Mercado Libre con CIFRA',
    longDescription:
      'Conecta tu tienda de Mercado Libre con CIFRA para sincronizar automáticamente productos, stock e inventario. Las ventas de MeLi se registran como ventas POS.',
    icon: '🛒',
    color: 'from-yellow-400 to-amber-500',
    installed: false,
    popular: true,
    new: true,
    features: [
      'Sync de inventario automático',
      'Órdenes → ventas POS',
      'Facturación automática',
      'Control de stock unificado',
    ],
    webhookEvents: ['stock.low'],
    setupSteps: [
      'Conecta tu cuenta de Mercado Libre',
      'Autoriza acceso a tu cuenta',
      'Mapea tus productos',
      'Activa la sincronización automática',
    ],
    docsUrl: '#',
  },
  {
    id: 'sat-validacion',
    name: 'SAT Validación',
    category: 'Fiscal',
    description: 'Valida comprobantes fiscales contra el SAT en tiempo real',
    longDescription:
      'Verifica la autenticidad de CFDIs recibidos directamente contra los servicios del SAT. Detecta facturas falsas o canceladas al instante.',
    icon: '🏛️',
    color: 'from-red-500 to-rose-500',
    installed: true,
    popular: false,
    new: false,
    features: [
      'Validación de UUID',
      'Verificación de estado',
      'Detección de cancelaciones',
      'Historial de validaciones',
    ],
    setupSteps: ['Ya instalado — sin configuración adicional'],
    docsUrl: '#',
  },
  {
    id: 'conekta',
    name: 'Conekta',
    category: 'Pagos',
    description: 'Acepta pagos con tarjeta y OXXO Pay desde CIFRA',
    longDescription:
      'Integra Conekta para cobrar a tus clientes con tarjeta de crédito, débito u OXXO Pay directamente desde el módulo de cobranza de CIFRA.',
    icon: '💳',
    color: 'from-blue-500 to-cyan-500',
    installed: false,
    popular: false,
    new: false,
    features: ['Tarjeta de crédito/débito', 'OXXO Pay', 'Pagos en línea', 'Conciliación automática'],
    setupSteps: [
      'Crea una cuenta en Conekta',
      'Obtén tus API Keys',
      'Configura en CIFRA > Pagos',
      'Prueba con tarjeta de sandbox',
    ],
    docsUrl: '#',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    category: 'Comunicación',
    description: 'Envía facturas y notificaciones por WhatsApp a tus clientes',
    longDescription:
      'Usa la API de WhatsApp Business para enviar CFDIs, recordatorios de pago y notificaciones directamente al WhatsApp de tus clientes.',
    icon: '📱',
    color: 'from-green-500 to-teal-500',
    installed: false,
    popular: false,
    new: true,
    features: ['Envío de facturas PDF', 'Recordatorios de pago', 'Confirmaciones de pedido', 'Estado de envíos'],
    webhookEvents: ['invoice.stamped', 'payment.received'],
    setupSteps: [
      'Obtén acceso a la API de WhatsApp Business',
      'Configura tu número de teléfono',
      'Crea plantillas de mensajes',
      'Activa los eventos en CIFRA',
    ],
    docsUrl: '#',
  },
  {
    id: 'contpaqi',
    name: 'CONTPAQi',
    category: 'Contabilidad',
    description: 'Sincroniza pólizas contables con CONTPAQi Contabilidad',
    longDescription:
      'Exporta automáticamente las pólizas generadas en CIFRA hacia tu instancia de CONTPAQi Contabilidad para mantener la contabilidad unificada.',
    icon: '📒',
    color: 'from-indigo-500 to-blue-600',
    installed: false,
    popular: false,
    new: false,
    features: [
      'Exportación de pólizas',
      'Catálogo de cuentas',
      'Periodo contable',
      'Formato XML CONTPAQi',
    ],
    setupSteps: [
      'Configura el servidor de CONTPAQi',
      'Exporta el catálogo de cuentas',
      'Mapea las cuentas CIFRA → CONTPAQi',
      'Programa la sincronización',
    ],
    docsUrl: '#',
  },
];

const CATEGORIES = [
  'Todos',
  'Automatización',
  'Comunicación',
  'Reportes',
  'E-commerce',
  'Fiscal',
  'Pagos',
  'Contabilidad',
];

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastProps {
  message: string;
  type: 'success' | 'info';
  onClose: () => void;
}

function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all animate-in slide-in-from-bottom-4 ${
        type === 'success' ? 'bg-green-600' : 'bg-blue-600'
      }`}
    >
      <span>{type === 'success' ? '✓' : 'ℹ'}</span>
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
        ✕
      </button>
    </div>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

interface DetailModalProps {
  integration: Integration;
  onClose: () => void;
  onToggle: (id: string) => void;
}

function DetailModal({ integration, onClose, onToggle }: DetailModalProps) {
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleBackdrop}
    >
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Gradient header */}
        <div className={`bg-gradient-to-r ${integration.color} p-6 relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-4xl">
              {integration.icon}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{integration.name}</h2>
              <span className="text-sm text-white/80 bg-white/20 px-2.5 py-0.5 rounded-full">
                {integration.category}
              </span>
            </div>
          </div>
          {integration.installed && (
            <div className="mt-3 inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
              <span className="w-2 h-2 bg-green-300 rounded-full" />
              Integración activa
            </div>
          )}
        </div>

        {/* Body (scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
            {integration.longDescription}
          </p>

          {/* Features */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">Funcionalidades</h3>
            <ul className="space-y-1.5">
              {integration.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <span className="text-green-500 flex-shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Setup steps */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">
              Pasos de configuración
            </h3>
            <ol className="space-y-2">
              {integration.setupSteps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
                  <span
                    className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br ${integration.color}`}
                  >
                    {idx + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Webhook events */}
          {integration.webhookEvents && integration.webhookEvents.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">
                Eventos de CIFRA utilizados
              </h3>
              <div className="flex flex-wrap gap-2">
                {integration.webhookEvents.map((ev) => (
                  <span
                    key={ev}
                    className="text-xs font-mono bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-zinc-700"
                  >
                    {ev}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Esta integración escucha estos eventos via Webhooks de CIFRA.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-zinc-800 flex items-center gap-3">
          <a
            href={integration.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Ver documentación →
          </a>
          <div className="ml-auto flex items-center gap-2">
            {integration.installed ? (
              <button
                onClick={() => {
                  onToggle(integration.id);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Desinstalar
              </button>
            ) : (
              <button
                onClick={() => {
                  onToggle(integration.id);
                  onClose();
                }}
                className={`px-5 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r ${integration.color} hover:opacity-90 transition-opacity shadow-sm`}
              >
                Instalar integración
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Integration Card ─────────────────────────────────────────────────────────

interface CardProps {
  integration: Integration;
  onClick: () => void;
  onInstall: (e: React.MouseEvent) => void;
}

function IntegrationCard({ integration, onClick, onInstall }: CardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-4 group"
    >
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div
          className={`w-14 h-14 rounded-xl bg-gradient-to-br ${integration.color} flex items-center justify-center text-2xl shadow-sm group-hover:scale-105 transition-transform duration-200`}
        >
          {integration.icon}
        </div>
        <div className="flex flex-col items-end gap-1">
          {integration.installed && (
            <span className="text-xs font-semibold bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              Instalada
            </span>
          )}
          {integration.popular && !integration.installed && (
            <span className="text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full">
              Popular
            </span>
          )}
          {integration.new && (
            <span className="text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">
              Nuevo
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1">
        <p className="font-semibold text-gray-900 dark:text-white">{integration.name}</p>
        <p className="text-xs text-gray-400 mt-0.5 mb-1.5">{integration.category}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-snug">{integration.description}</p>
      </div>

      {/* Features */}
      <ul className="space-y-1">
        {integration.features.slice(0, 3).map((f) => (
          <li key={f} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <span className="text-green-500 flex-shrink-0">✓</span>
            {f}
          </li>
        ))}
      </ul>

      {/* Action button */}
      <div onClick={(e) => e.stopPropagation()}>
        {integration.installed ? (
          <button
            onClick={onInstall}
            className="w-full py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
          >
            Configurar →
          </button>
        ) : (
          <button
            onClick={onInstall}
            className="w-full py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Instalar
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MarketplaceClient() {
  const [integrations, setIntegrations] = useState<Integration[]>(INTEGRATIONS_SEED);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const selectedIntegration = integrations.find((i) => i.id === selectedId) ?? null;

  const filtered = integrations.filter((i) => {
    const matchesSearch =
      search.trim() === '' ||
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.description.toLowerCase().includes(search.toLowerCase()) ||
      i.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'Todos' || i.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const installedCount = integrations.filter((i) => i.installed).length;

  const toggleInstalled = (id: string) => {
    setIntegrations((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const nowInstalled = !i.installed;
        setToast({
          message: nowInstalled
            ? `${i.name} instalada correctamente`
            : `${i.name} desinstalada`,
          type: nowInstalled ? 'success' : 'info',
        });
        return { ...i, installed: nowInstalled };
      })
    );
  };

  const handleCardInstall = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const integration = integrations.find((i) => i.id === id);
    if (integration?.installed) {
      setSelectedId(id);
    } else {
      toggleInstalled(id);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Marketplace de Integraciones
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Conecta CIFRA con tus herramientas favoritas
          </p>
        </div>
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            🔍
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar integración..."
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 py-3 px-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-100 dark:border-zinc-800 text-sm text-gray-500 dark:text-gray-400">
        <span>
          <strong className="text-gray-900 dark:text-white">{integrations.length}</strong> integraciones disponibles
        </span>
        <span className="w-px h-4 bg-gray-200 dark:bg-zinc-700 hidden sm:block" />
        <span>
          <strong className="text-green-600 dark:text-green-400">{installedCount}</strong> instaladas
        </span>
        <span className="w-px h-4 bg-gray-200 dark:bg-zinc-700 hidden sm:block" />
        <span>Conecta con más de 6,000 apps vía Zapier</span>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-3">🔌</p>
          <p className="font-medium">No se encontraron integraciones</p>
          <p className="text-sm mt-1">Intenta con otro término o categoría</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              onClick={() => setSelectedId(integration.id)}
              onInstall={(e) => handleCardInstall(e, integration.id)}
            />
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selectedIntegration && (
        <DetailModal
          integration={selectedIntegration}
          onClose={() => setSelectedId(null)}
          onToggle={(id) => {
            toggleInstalled(id);
            setSelectedId(null);
          }}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
