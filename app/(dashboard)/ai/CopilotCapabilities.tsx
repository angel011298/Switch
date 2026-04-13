'use client';

import { useState } from 'react';

// ─── Types ─────────────────────────────────────────────────────────────────

type CapabilityState = 'idle' | 'loading' | 'streaming' | 'done' | 'error';

interface CapabilityResult {
  state:   CapabilityState;
  text:    string;
  tool?:   string;
  error?:  string;
}

// ─── Capability Configs ────────────────────────────────────────────────────

const CAPABILITIES = [
  {
    id:          'calculate_iva_balance',
    title:       'Balance de IVA',
    description: 'IVA trasladado, acreditable y neto a pagar al SAT para un período.',
    icon:        '🧾',
    color:       'blue',
    hasForm:     'iva',
  },
  {
    id:          'validate_rfc_69b',
    title:       'Validar RFC 69-B',
    description: 'Verifica si un RFC aparece en listas de EFOS/EDOS del Art. 69-B CFF.',
    icon:        '🔍',
    color:       'amber',
    hasForm:     'rfc',
  },
  {
    id:          'get_cash_flow_summary',
    title:       'Flujo de Efectivo',
    description: 'Proyección de ingresos y egresos a 30 días con facturas pendientes.',
    icon:        '💰',
    color:       'emerald',
    hasForm:     null,
  },
  {
    id:          'get_compliance_alerts',
    title:       'Alertas de Cumplimiento',
    description: 'Obligaciones fiscales próximas, PPD sin complemento, nóminas abiertas.',
    icon:        '⚠️',
    color:       'red',
    hasForm:     null,
  },
  {
    id:          'explain_journal_entry',
    title:       'Explicar Póliza',
    description: 'Traduce una póliza contable a lenguaje claro con cargos, abonos e impacto.',
    icon:        '📒',
    color:       'violet',
    hasForm:     'entry',
  },
] as const;

type CapabilityId = (typeof CAPABILITIES)[number]['id'];

// ─── Color map ─────────────────────────────────────────────────────────────

const CARD_COLORS: Record<string, string> = {
  blue:    'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10',
  amber:   'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10',
  emerald: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10',
  red:     'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10',
  violet:  'border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-900/10',
};

const BTN_COLORS: Record<string, string> = {
  blue:    'bg-blue-600 hover:bg-blue-700',
  amber:   'bg-amber-500 hover:bg-amber-600',
  emerald: 'bg-emerald-600 hover:bg-emerald-700',
  red:     'bg-red-600 hover:bg-red-700',
  violet:  'bg-violet-600 hover:bg-violet-700',
};

// ─── Main Component ────────────────────────────────────────────────────────

export default function CopilotCapabilities() {
  const now = new Date();

  // Form state
  const [ivaMonth, setIvaMonth] = useState(String(now.getMonth() + 1));
  const [ivaYear,  setIvaYear]  = useState(String(now.getFullYear()));
  const [rfcInput, setRfcInput] = useState('');
  const [entryId,  setEntryId]  = useState('');

  // Result state per capability
  const [results, setResults] = useState<Record<CapabilityId, CapabilityResult>>(
    {} as Record<CapabilityId, CapabilityResult>,
  );

  // ── Stream helper ───────────────────────────────────────────────────────
  async function runCapability(id: CapabilityId, body: Record<string, unknown>) {
    setResults(prev => ({
      ...prev,
      [id]: { state: 'loading', text: '', tool: undefined },
    }));

    try {
      const res = await fetch('/api/ai/copilot', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ capability: id, ...body }),
      });

      if (res.status === 429) {
        setResults(prev => ({
          ...prev,
          [id]: { state: 'error', text: '', error: 'Límite diario de consultas AI alcanzado. Intenta mañana.' },
        }));
        return;
      }

      if (!res.ok || !res.body) {
        setResults(prev => ({
          ...prev,
          [id]: { state: 'error', text: '', error: 'Error al conectar con el copiloto.' },
        }));
        return;
      }

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText  = '';
      let toolName: string | undefined;

      setResults(prev => ({ ...prev, [id]: { state: 'streaming', text: '', tool: undefined } }));

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'tool_use') {
              toolName = parsed.tool as string;
              setResults(prev => ({ ...prev, [id]: { ...prev[id], tool: toolName } }));
            } else if (parsed.type === 'text') {
              fullText += parsed.text as string;
              setResults(prev => ({
                ...prev,
                [id]: { state: 'streaming', text: fullText, tool: toolName },
              }));
            }
          } catch { /* ignore parse errors */ }
        }
      }

      setResults(prev => ({
        ...prev,
        [id]: { state: 'done', text: fullText, tool: toolName },
      }));
    } catch {
      setResults(prev => ({
        ...prev,
        [id]: { state: 'error', text: '', error: 'Error de conexión. Verifica tu red.' },
      }));
    }
  }

  // ── Trigger handlers ─────────────────────────────────────────────────────
  function handleIva() {
    runCapability('calculate_iva_balance', { month: Number(ivaMonth), year: Number(ivaYear) });
  }
  function handleRfc() {
    if (!rfcInput.trim()) return;
    runCapability('validate_rfc_69b', { rfc: rfcInput.trim().toUpperCase() });
  }
  function handleCashFlow() {
    runCapability('get_cash_flow_summary', {});
  }
  function handleCompliance() {
    runCapability('get_compliance_alerts', {});
  }
  function handleEntry() {
    if (!entryId.trim()) return;
    runCapability('explain_journal_entry', { journalEntryId: entryId.trim() });
  }

  const handlers: Record<CapabilityId, () => void> = {
    calculate_iva_balance: handleIva,
    validate_rfc_69b:      handleRfc,
    get_cash_flow_summary: handleCashFlow,
    get_compliance_alerts: handleCompliance,
    explain_journal_entry: handleEntry,
  };

  // ── Year options ─────────────────────────────────────────────────────────
  const yearOptions = [now.getFullYear() - 1, now.getFullYear()];
  const monthOptions = [
    ['1', 'Enero'],  ['2', 'Febrero'],  ['3', 'Marzo'],
    ['4', 'Abril'],  ['5', 'Mayo'],     ['6', 'Junio'],
    ['7', 'Julio'],  ['8', 'Agosto'],   ['9', 'Septiembre'],
    ['10', 'Octubre'], ['11', 'Noviembre'], ['12', 'Diciembre'],
  ];

  return (
    <div className="border-b border-gray-200 dark:border-zinc-700">
      <details className="group">
        <summary className="flex items-center gap-2 px-6 py-3 cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-zinc-800/50 list-none">
          <div className="w-5 h-5 flex items-center justify-center text-gray-400 group-open:rotate-90 transition-transform">
            ▶
          </div>
          <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">
            Capacidades Estructuradas
          </span>
          <span className="text-xs text-gray-400 ml-1">
            — 5 análisis con datos reales de tu empresa
          </span>
        </summary>

        <div className="px-6 pb-6 pt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {CAPABILITIES.map(cap => {
            const result  = results[cap.id];
            const isLoading = result?.state === 'loading' || result?.state === 'streaming';
            const cardBg  = CARD_COLORS[cap.color];
            const btnBg   = BTN_COLORS[cap.color];

            return (
              <div
                key={cap.id}
                className={`rounded-xl border p-4 flex flex-col gap-3 ${cardBg}`}
              >
                {/* Header */}
                <div className="flex items-start gap-2">
                  <span className="text-xl leading-none mt-0.5">{cap.icon}</span>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">
                      {cap.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {cap.description}
                    </p>
                  </div>
                </div>

                {/* Form inputs */}
                {cap.hasForm === 'iva' && (
                  <div className="flex gap-2">
                    <select
                      value={ivaMonth}
                      onChange={e => setIvaMonth(e.target.value)}
                      disabled={isLoading}
                      className="flex-1 text-xs bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 rounded-lg px-2 py-1.5 text-gray-800 dark:text-gray-200 outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
                    >
                      {monthOptions.map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                    <select
                      value={ivaYear}
                      onChange={e => setIvaYear(e.target.value)}
                      disabled={isLoading}
                      className="text-xs bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 rounded-lg px-2 py-1.5 text-gray-800 dark:text-gray-200 outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
                    >
                      {yearOptions.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                )}

                {cap.hasForm === 'rfc' && (
                  <input
                    type="text"
                    value={rfcInput}
                    onChange={e => setRfcInput(e.target.value.toUpperCase())}
                    onKeyDown={e => { if (e.key === 'Enter') handleRfc(); }}
                    disabled={isLoading}
                    placeholder="RFC a verificar, ej. ABC123456789"
                    maxLength={13}
                    className="text-xs bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 rounded-lg px-3 py-1.5 text-gray-800 dark:text-gray-200 placeholder-gray-400 outline-none focus:ring-1 focus:ring-amber-400 font-mono disabled:opacity-50"
                  />
                )}

                {cap.hasForm === 'entry' && (
                  <input
                    type="text"
                    value={entryId}
                    onChange={e => setEntryId(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleEntry(); }}
                    disabled={isLoading}
                    placeholder="UUID de la póliza contable"
                    className="text-xs bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 rounded-lg px-3 py-1.5 text-gray-800 dark:text-gray-200 placeholder-gray-400 outline-none focus:ring-1 focus:ring-violet-400 font-mono disabled:opacity-50"
                  />
                )}

                {/* Trigger button */}
                <button
                  onClick={handlers[cap.id]}
                  disabled={isLoading}
                  className={`${btnBg} disabled:bg-gray-300 dark:disabled:bg-zinc-600 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors w-full`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      {result?.tool ? `Ejecutando ${result.tool}…` : 'Analizando…'}
                    </span>
                  ) : (
                    'Analizar'
                  )}
                </button>

                {/* Result output */}
                {result?.state === 'error' && (
                  <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                    {result.error}
                  </div>
                )}

                {(result?.state === 'streaming' || result?.state === 'done') && result.text && (
                  <div className="text-xs text-gray-800 dark:text-gray-200 bg-white/80 dark:bg-zinc-900/80 rounded-lg px-3 py-2.5 max-h-56 overflow-y-auto border border-gray-100 dark:border-zinc-700">
                    <CapabilityMarkdown text={result.text} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </details>
    </div>
  );
}

// ─── Lightweight Markdown renderer ────────────────────────────────────────

function CapabilityMarkdown({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-0.5">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) {
          return (
            <p key={i} className="font-bold text-xs mt-2 mb-0.5 text-gray-900 dark:text-white">
              {line.slice(3)}
            </p>
          );
        }
        if (line.startsWith('# ')) {
          return (
            <p key={i} className="font-bold text-sm mt-2 mb-1 text-gray-900 dark:text-white">
              {line.slice(2)}
            </p>
          );
        }
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return (
            <div key={i} className="flex gap-1.5 ml-1">
              <span className="text-gray-400 flex-shrink-0 mt-px">•</span>
              <span dangerouslySetInnerHTML={{ __html: inlineFmt(line.slice(2)) }} />
            </div>
          );
        }
        if (line.trim() === '') return <div key={i} className="h-1" />;
        return <p key={i} dangerouslySetInnerHTML={{ __html: inlineFmt(line) }} />;
      })}
    </div>
  );
}

function inlineFmt(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,   '<em>$1</em>')
    .replace(/`(.+?)`/g,    '<code class="bg-gray-100 dark:bg-zinc-700 px-0.5 rounded font-mono">$1</code>');
}
