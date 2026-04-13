'use client';

import { useState, useRef, useEffect } from 'react';
import CopilotCapabilities from './CopilotCapabilities';

// Re-use the same chat logic but in full page layout
// Similar to CopilotChat but full-screen with:
// - Left panel: conversation history / recent topics
// - Center: main chat area (wider, bigger messages)
// - Suggested prompts organized by category

const PROMPT_CATEGORIES = [
  {
    category: 'Análisis',
    icon: '📊',
    prompts: [
      '¿Cómo están los ingresos este mes?',
      '¿Cuántos clientes tengo activos?',
      '¿Qué productos tienen stock bajo?',
      'Resume la situación actual de la empresa',
    ],
  },
  {
    category: 'Facturación',
    icon: '🧾',
    prompts: [
      '¿Cómo cancelo una factura?',
      '¿Qué es una nota de crédito?',
      '¿Cuáles son mis obligaciones fiscales?',
      '¿Cómo configuro el CFDI 4.0?',
    ],
  },
  {
    category: 'RRHH',
    icon: '👥',
    prompts: [
      '¿Cómo calculo el ISR de un empleado?',
      '¿Qué es la cuota obrera del IMSS?',
      '¿Cómo aprobar vacaciones?',
      '¿Cómo cierro una nómina?',
    ],
  },
  {
    category: 'Inventario',
    icon: '📦',
    prompts: [
      '¿Cómo hago un ajuste de inventario?',
      '¿Qué son los movimientos de stock?',
      '¿Cómo creo una orden de compra?',
      '¿Cómo bloqueo un almacén?',
    ],
  },
];

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  loading?: boolean;
}

export default function AiPage() {
  const [messages, setMessages] = useState<Message[]>([{
    id: 'welcome',
    role: 'assistant',
    content: '¡Bienvenido a **CIFRA AI**! Soy tu asistente inteligente con acceso a los datos de tu empresa en tiempo real.\n\nPuedo ayudarte a:\n- Analizar métricas y KPIs\n- Explicar cómo usar cualquier módulo\n- Responder dudas sobre fiscalidad mexicana\n- Sugerirte acciones basadas en tu situación actual\n\n¿Con qué empezamos?',
  }]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || streaming) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content };
    const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: '', loading: true };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput('');
    setStreaming(true);

    try {
      const history = [...messages.filter(m => !m.loading), userMsg].map(m => ({
        role: m.role, content: m.content,
      }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok || !res.body) throw new Error('Error');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

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
            if (parsed.type === 'text') {
              fullText += parsed.text;
              setMessages(prev => prev.map(m =>
                m.id === assistantMsg.id ? { ...m, content: fullText, loading: false } : m
              ));
            }
          } catch { /* ignore */ }
        }
      }
    } catch {
      setMessages(prev => prev.map(m =>
        m.id === assistantMsg.id
          ? { ...m, content: 'Error al conectar. Verifica la variable ANTHROPIC_API_KEY.', loading: false }
          : m
      ));
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <CopilotCapabilities />
      <div className="flex flex-1 min-h-0">
      {/* Left sidebar: prompt categories */}
      <div className="w-64 border-r border-gray-200 dark:border-zinc-700 p-4 overflow-y-auto hidden md:block">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Sugerencias</p>
        <div className="space-y-4">
          {PROMPT_CATEGORIES.map((cat) => (
            <div key={cat.category}>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                <span>{cat.icon}</span> {cat.category}
              </p>
              <div className="space-y-1">
                {cat.prompts.map((p) => (
                  <button
                    key={p}
                    onClick={() => sendMessage(p)}
                    disabled={streaming}
                    className="w-full text-left text-xs text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main chat */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-zinc-700 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <div>
            <h1 className="font-semibold text-gray-900 dark:text-white">CIFRA AI Copilot</h1>
            <p className="text-xs text-gray-500">Asistente con contexto de tu empresa · Powered by Claude</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            <span className="text-xs text-gray-500">En línea</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex-shrink-0 flex items-center justify-center mt-1">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
              )}
              <div className={`max-w-2xl rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white rounded-bl-sm'
              }`}>
                {msg.loading ? (
                  <div className="flex items-center gap-1 py-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                ) : (
                  <FullMarkdown text={msg.content} />
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 dark:border-zinc-700">
          <div className="max-w-3xl mx-auto flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              disabled={streaming}
              placeholder="Pregunta sobre tu empresa, facturas, nómina, inventario..."
              className="flex-1 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || streaming}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-zinc-600 text-white px-5 py-3 rounded-xl font-medium text-sm transition-colors"
            >
              {streaming ? '...' : 'Enviar'}
            </button>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-2">
            CIFRA AI tiene acceso a los datos en tiempo real de tu empresa · Powered by Anthropic Claude
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}

function FullMarkdown({ text }: { text: string }) {
  const lines = text.split('\n');
  const elements: JSX.Element[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="font-bold text-base mt-2 mb-1">{line.slice(3)}</h2>);
    } else if (line.startsWith('# ')) {
      elements.push(<h1 key={i} className="font-bold text-lg mt-2 mb-1">{line.slice(2)}</h1>);
    } else if (line.startsWith('- ') || line.startsWith('• ')) {
      elements.push(
        <div key={i} className="flex gap-2 ml-2">
          <span className="text-blue-400 mt-0.5 flex-shrink-0">•</span>
          <span dangerouslySetInnerHTML={{ __html: inlineFormat(line.slice(2)) }} />
        </div>
      );
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(<p key={i} dangerouslySetInnerHTML={{ __html: inlineFormat(line) }} />);
    }

    i++;
  }

  return <div className="space-y-0.5">{elements}</div>;
}

function inlineFormat(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-gray-200 dark:bg-zinc-700 px-1 py-0.5 rounded text-xs font-mono">$1</code>');
}
