import { NextRequest, NextResponse } from 'next/server';
import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';
export const maxDuration = 60;

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// System prompt for CIFRA ERP assistant
async function buildSystemPrompt(tenantId: string): Promise<string> {
  // Get live context from DB
  const [invoiceCount, customerCount, employeeCount, lowStock, pendingLeaves] = await Promise.all([
    prisma.invoice.count({ where: { tenantId } }),
    prisma.customer.count({ where: { tenantId } }),
    prisma.employee.count({ where: { tenantId, active: true } }),
    prisma.product.count({ where: { tenantId, trackStock: true, stock: { lte: 5 } } }),
    prisma.leaveRequest.count({ where: { tenantId, status: 'PENDING' } }).catch(() => 0),
  ]);

  return `Eres CIFRA AI, el asistente inteligente integrado en el ERP CIFRA para empresas mexicanas.

## Tu empresa en números (datos en tiempo real):
- Facturas: ${invoiceCount}
- Clientes activos: ${customerCount}
- Empleados activos: ${employeeCount}
- Productos con stock bajo: ${lowStock}
- Solicitudes de vacaciones pendientes: ${pendingLeaves}

## Módulos que maneja CIFRA:
- **Facturación CFDI 4.0**: Facturas timbradas con el SAT, notas de crédito
- **POS**: Punto de venta con tickets, corte de caja, historial
- **CRM**: Pipeline de ventas, clientes, campañas de email, soporte
- **RRHH**: Empleados, nómina (ISR/IMSS), asistencias, vacaciones, evaluaciones
- **SCM Inventarios**: Almacenes, productos, movimientos de stock, alertas
- **SCM Compras**: Órdenes de compra, proveedores, recepción de mercancía
- **MRP**: Listas de materiales (BOM), órdenes de producción, calidad
- **Finanzas**: Contabilidad, caja chica, cobranza, impuestos
- **BI Dashboard**: Métricas en tiempo real, gráficas, exportación

## Cómo responder:
- Responde siempre en español
- Sé conciso pero completo
- Si preguntan cómo hacer algo, da instrucciones paso a paso dentro de CIFRA
- Si preguntan sobre datos, menciona que tienes acceso a los datos en tiempo real
- Si no puedes hacer algo, sugiere la alternativa dentro de CIFRA
- Usa listas y formato Markdown cuando sea útil
- Nunca inventes datos que no tienes

## Lo que PUEDES hacer:
- Explicar cómo usar cualquier módulo
- Analizar la situación actual de la empresa según los KPIs
- Sugerir acciones: "Tienes 3 facturas sin timbrar — ve a Facturación > Timbrar"
- Ayudar a interpretar reportes y métricas
- Dar consejos de mejores prácticas fiscales y administrativas en México
- Explicar conceptos fiscales (CFDI, IVA, ISR, IMSS, etc.)`;
}

export async function POST(req: NextRequest) {
  const session = await getSwitchSession();
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { messages } = await req.json();
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'Mensajes requeridos' }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Return a helpful mock response if no API key configured
    const mockStream = new ReadableStream({
      start(controller) {
        const text = 'El AI Copilot requiere configurar `ANTHROPIC_API_KEY` en las variables de entorno. Una vez configurado, podré responder todas tus preguntas sobre CIFRA ERP en tiempo real.';
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'text', text })}\n\n`));
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
        controller.close();
      },
    });
    return new Response(mockStream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });
  }

  const systemPrompt = await buildSystemPrompt(session.tenantId);

  // Call Anthropic API with streaming
  const anthropicRes = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      stream: true,
      system: systemPrompt,
      messages: messages.slice(-20).map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    }),
  });

  if (!anthropicRes.ok) {
    const err = await anthropicRes.text();
    console.error('[AI Copilot]', err);
    return NextResponse.json({ error: 'Error al conectar con AI' }, { status: 502 });
  }

  // Forward the SSE stream from Anthropic to the client
  const transformer = new TransformStream({
    transform(chunk, controller) {
      const text = new TextDecoder().decode(chunk);
      // Parse Anthropic SSE and re-emit simplified events
      const lines = text.split('\n').filter(Boolean);
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
            return;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
              controller.enqueue(
                new TextEncoder().encode(
                  `data: ${JSON.stringify({ type: 'text', text: parsed.delta.text })}\n\n`
                )
              );
            } else if (parsed.type === 'message_stop') {
              controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
            }
          } catch { /* ignore parse errors */ }
        }
      }
    },
  });

  return new Response(anthropicRes.body!.pipeThrough(transformer), {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
}
