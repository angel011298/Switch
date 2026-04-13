import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getSwitchSession } from '@/lib/auth/session';
import { logAudit } from '@/lib/auth/rbac';
import { COPILOT_TOOLS, executeToolById } from '@/lib/ai/tools';
import { checkAiRateLimit } from '@/lib/ai/rate-limit';
import prisma from '@/lib/prisma';

export const runtime    = 'nodejs';
export const maxDuration = 60;

// ─── System Prompt ───────────────────────────────────────────────────────────

async function buildCopilotSystemPrompt(tenantId: string): Promise<string> {
  const [invoiceCount, customerCount, employeeCount, lowStock] = await Promise.all([
    prisma.invoice.count({ where: { tenantId } }),
    prisma.customer.count({ where: { tenantId } }),
    prisma.employee.count({ where: { tenantId, active: true } }),
    prisma.product.count({ where: { tenantId, trackStock: true, stock: { lte: 5 } } }),
  ]);

  const today = new Date().toLocaleDateString('es-MX', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Mexico_City',
  });

  return `Eres CIFRA AI, el copiloto fiscal y contable integrado en el ERP CIFRA para empresas mexicanas.
Hoy es ${today}.

## Contexto de la empresa (datos en tiempo real):
- Facturas: ${invoiceCount}
- Clientes activos: ${customerCount}
- Empleados activos: ${employeeCount}
- Productos con stock bajo (≤5): ${lowStock}

## Tu función:
Eres un experto en fiscalidad mexicana (SAT, CFF, LISR, LIVA, IMSS) y contabilidad (NIF).
Tienes acceso a herramientas que consultan la base de datos real del tenant.
Cuando el usuario solicita una capacidad, DEBES invocar el tool correspondiente para obtener
datos reales antes de responder. Nunca inventes cifras.

## Formato de respuesta:
- Responde siempre en español
- Usa Markdown: encabezados ##, listas, negritas para cifras clave
- Para montos usa formato "$1,234.56 MXN"
- Sé conciso pero completo; incluye una recomendación accionable al final`;
}

// ─── Capability → User Message ───────────────────────────────────────────────

function buildUserMessage(
  capability: string,
  params: { month?: number; year?: number; rfc?: string; journalEntryId?: string },
): string {
  switch (capability) {
    case 'calculate_iva_balance':
      return `Calcula el balance de IVA para ${params.month}/${params.year}.`;
    case 'validate_rfc_69b':
      return `Verifica el RFC "${params.rfc}" contra las listas del Art. 69-B CFF.`;
    case 'get_cash_flow_summary':
      return 'Genera el resumen ejecutivo del flujo de efectivo con proyección a 30 días.';
    case 'get_compliance_alerts':
      return 'Revisa el estado de cumplimiento fiscal y alertas pendientes.';
    case 'explain_journal_entry':
      return `Explica la póliza contable con ID "${params.journalEntryId}" en lenguaje claro.`;
    default:
      return `Ejecuta la capacidad: ${capability}.`;
  }
}

// ─── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const session = await getSwitchSession();
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  const { tenantId, userId, name: actorName, email: actorEmail } = session;

  // ── Parse body ──────────────────────────────────────────────────────────────
  const body = await req.json().catch(() => ({}));
  const {
    capability,
    month,
    year,
    rfc,
    journalEntryId,
  } = body as {
    capability:       string;
    month?:           number;
    year?:            number;
    rfc?:             string;
    journalEntryId?:  string;
  };

  if (!capability) {
    return NextResponse.json({ error: 'capability requerido' }, { status: 400 });
  }

  // ── Rate limit ──────────────────────────────────────────────────────────────
  const rl = await checkAiRateLimit(tenantId);
  if (!rl.allowed) {
    void logAudit({
      tenantId,
      actorId:    userId,
      actorName,
      actorEmail,
      action:     'AI_RATE_LIMIT_EXCEEDED',
      resource:   'copilot',
      resourceId: capability,
      severity:   'warning',
    });
    return new NextResponse(
      JSON.stringify({ error: 'Límite diario de consultas AI alcanzado.' }),
      {
        status:  429,
        headers: { 'Content-Type': 'application/json', ...rl.headers, 'Retry-After': '86400' },
      },
    );
  }

  // ── Mock if no API key ───────────────────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const mockStream = new ReadableStream({
      start(controller) {
        const text =
          'El AI Copilot requiere configurar `ANTHROPIC_API_KEY` en las variables de entorno. ' +
          'Una vez configurado, ejecutaré consultas reales sobre los datos de tu empresa.';
        controller.enqueue(
          new TextEncoder().encode(`data: ${JSON.stringify({ type: 'text', text })}\n\n`),
        );
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
        controller.close();
      },
    });
    return new Response(mockStream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', ...rl.headers },
    });
  }

  // ── Build inputs ─────────────────────────────────────────────────────────────
  const systemPrompt = await buildCopilotSystemPrompt(tenantId);
  const userMessage  = buildUserMessage(capability, { month, year, rfc, journalEntryId });
  const anthropic    = new Anthropic({ apiKey });

  // ── Phase 1: Force tool call ─────────────────────────────────────────────────
  let toolName:   string;
  let toolInput:  Record<string, unknown>;
  let toolUseId:  string;

  try {
    const phase1 = await anthropic.messages.create({
      model:       'claude-sonnet-4-6',
      max_tokens:  1024,
      system:      systemPrompt,
      tools:       COPILOT_TOOLS,
      tool_choice: { type: 'any' },
      messages:    [{ role: 'user', content: userMessage }],
    });

    const toolBlock = phase1.content.find(b => b.type === 'tool_use');
    if (!toolBlock || toolBlock.type !== 'tool_use') {
      return NextResponse.json({ error: 'El modelo no invocó ningún tool.' }, { status: 502 });
    }

    toolName  = toolBlock.name;
    toolInput = toolBlock.input as Record<string, unknown>;
    toolUseId = toolBlock.id;
  } catch (err) {
    console.error('[AI Copilot Phase 1]', err);
    return NextResponse.json({ error: 'Error al conectar con AI (fase 1).' }, { status: 502 });
  }

  // ── Execute tool ─────────────────────────────────────────────────────────────
  let toolResult: string;
  try {
    toolResult = await executeToolById(toolName, toolInput, tenantId);
  } catch (err) {
    console.error('[AI Copilot Tool Exec]', err);
    toolResult = JSON.stringify({ error: 'Error al consultar la base de datos.' });
  }

  // ── AuditLog (fire-and-forget, sin contenido) ────────────────────────────────
  void logAudit({
    tenantId,
    actorId:    userId,
    actorName,
    actorEmail,
    action:     'AI_QUERY',
    resource:   'copilot',
    resourceId: capability,
    severity:   'info',
    ip:         req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip'),
    userAgent:  req.headers.get('user-agent'),
  });

  // ── Phase 2: Streaming answer with tool result ──────────────────────────────
  const encoder  = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      // Notify client which tool was used
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: 'tool_use', tool: toolName })}\n\n`,
        ),
      );

      try {
        const stream = anthropic.messages.stream({
          model:      'claude-sonnet-4-6',
          max_tokens: 2048,
          system:     systemPrompt,
          messages: [
            { role: 'user', content: userMessage },
            {
              role:    'assistant',
              content: [{ type: 'tool_use', id: toolUseId, name: toolName, input: toolInput }],
            },
            {
              role:    'user',
              content: [
                {
                  type:        'tool_result',
                  tool_use_id: toolUseId,
                  content:     toolResult,
                },
              ],
            },
          ],
        });

        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: 'text', text: event.delta.text })}\n\n`,
              ),
            );
          }
        }
      } catch (err) {
        console.error('[AI Copilot Phase 2]', err);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'text', text: '\n\n_Error al generar la respuesta._' })}\n\n`,
          ),
        );
      } finally {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type':     'text/event-stream',
      'Cache-Control':    'no-cache',
      'X-Accel-Buffering': 'no',
      ...rl.headers,
    },
  });
}
