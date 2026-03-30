/**
 * CIFRA — Mailer Transaccional
 * ==================================
 * Usa Resend (https://resend.com) — Gratis: 3,000 emails/mes.
 *
 * Variables requeridas:
 *   RESEND_API_KEY     ej. re_xxxxxxxxxxxx
 *   RESEND_FROM        ej. "CIFRA <noreply@cifra-mx.com>" (dominio verificado)
 *                      Si no está configurado, usa onboarding@resend.dev (solo para testing)
 */

import { Resend } from 'resend';

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log('[mailer] RESEND_API_KEY no configurado — emails omitidos');
    return null;
  }
  return new Resend(apiKey);
}

function getFrom(): string {
  return process.env.RESEND_FROM ?? 'CIFRA <onboarding@resend.dev>';
}

// ─── Plantillas ───────────────────────────────────────────────────────────────

function formatDate(d: Date): string {
  return d.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Mexico_City',
  });
}

function wrapHtml(content: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CIFRA</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f4f4f5; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.08); }
    .header { background: #09090b; padding: 28px 32px; }
    .header h1 { color: #10b981; margin: 0; font-size: 22px; letter-spacing: -0.5px; }
    .header p { color: #a1a1aa; margin: 4px 0 0; font-size: 13px; }
    .body { padding: 32px; color: #3f3f46; line-height: 1.6; }
    .badge { display: inline-block; background: #d1fae5; color: #065f46; padding: 4px 12px; border-radius: 99px; font-size: 13px; font-weight: 600; margin-bottom: 16px; }
    .info-box { background: #f4f4f5; border-radius: 8px; padding: 16px 20px; margin: 20px 0; }
    .info-box p { margin: 4px 0; font-size: 14px; }
    .info-box strong { color: #09090b; }
    .footer { background: #f4f4f5; padding: 20px 32px; font-size: 12px; color: #a1a1aa; border-top: 1px solid #e4e4e7; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header" style="padding:0;text-align:center;">
      <img src="https://cifra-mx.vercel.app/email-header.png" alt="CIFRA" width="560"
           style="display:block;width:100%;max-width:560px;height:auto;" />
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>Este es un mensaje automático de CIFRA. No responder a este correo.</p>
      <p>© ${new Date().getFullYear()} CIFRA — Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Correo: Confirmación de suscripción ─────────────────────────────────────

export interface SubscriptionConfirmationInput {
  toEmail: string;
  toName: string;
  tenantName: string;
  daysGranted: number;
  newValidUntil: Date;
  amount: number;
}

export async function sendSubscriptionConfirmationEmail(
  input: SubscriptionConfirmationInput
): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const body = `
    <span class="badge">✅ Pago confirmado</span>
    <p>Hola <strong>${input.toName}</strong>,</p>
    <p>Hemos recibido y verificado tu pago. Tu suscripción de <strong>${input.tenantName}</strong> en CIFRA ha sido renovada exitosamente.</p>
    <div class="info-box">
      <p><strong>Monto aplicado:</strong> $${input.amount.toFixed(2)} MXN</p>
      <p><strong>Días otorgados:</strong> ${input.daysGranted} días</p>
      <p><strong>Acceso vigente hasta:</strong> ${formatDate(input.newValidUntil)}</p>
    </div>
    <p>Puedes continuar usando todos los módulos de CIFRA sin interrupciones.</p>
    <p>¡Gracias por confiar en CIFRA! 🚀</p>
  `;

  await resend.emails.send({
    from: getFrom(),
    to: input.toEmail,
    subject: `✅ Suscripción renovada — ${input.tenantName} | CIFRA`,
    html: wrapHtml(body),
  });
}

// ─── Correo: Suscripción por vencer ──────────────────────────────────────────

export interface ExpiryReminderInput {
  toEmail: string;
  toName: string;
  tenantName: string;
  validUntil: Date;
  daysLeft: number;
}

export async function sendExpiryReminderEmail(input: ExpiryReminderInput): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const urgency = input.daysLeft <= 3 ? '🚨 URGENTE' : '⚠️ Aviso';
  const body = `
    <span class="badge" style="background:#fef3c7;color:#92400e;">${urgency}: Suscripción por vencer</span>
    <p>Hola <strong>${input.toName}</strong>,</p>
    <p>Tu suscripción de <strong>${input.tenantName}</strong> en CIFRA vence en <strong>${input.daysLeft} día${input.daysLeft !== 1 ? 's' : ''}</strong>.</p>
    <div class="info-box">
      <p><strong>Fecha de vencimiento:</strong> ${formatDate(input.validUntil)}</p>
      <p><strong>Plan:</strong> CIFRA Standard — $499 MXN/mes</p>
    </div>
    <p>Para renovar, realiza una transferencia SPEI y sube tu comprobante en la sección <strong>Suscripción</strong> de tu cuenta.</p>
  `;

  await resend.emails.send({
    from: getFrom(),
    to: input.toEmail,
    subject: `${urgency}: Tu suscripción vence en ${input.daysLeft} día${input.daysLeft !== 1 ? 's' : ''} | CIFRA`,
    html: wrapHtml(body),
  });
}

// ─── Correo: CFDI Timbrado ────────────────────────────────────────────────────

export interface InvoiceStampedInput {
  toEmail: string;
  toName: string;
  emisorName: string;
  uuid: string;
  serie?: string;
  folio: number;
  total: number;
  fechaEmision: Date;
  pdfBuffer?: Buffer;     // PDF adjunto del CFDI
  xmlContent?: string;    // XML del CFDI para adjuntar
}

export async function sendInvoiceStampedEmail(input: InvoiceStampedInput): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.log('[mailer] RESEND_API_KEY no configurado — omitiendo notificación CFDI para:', input.toEmail);
    return;
  }

  const folioRef = `${input.serie ?? ''}${String(input.folio).padStart(4, '0')}`;
  const totalFmt = input.total.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 });

  const body = `
    <span class="badge">📄 Comprobante Fiscal Digital</span>
    <p>Hola <strong>${input.toName}</strong>,</p>
    <p><strong>${input.emisorName}</strong> te ha enviado un Comprobante Fiscal Digital por Internet (CFDI 4.0).</p>
    <div class="info-box">
      <p><strong>Folio:</strong> ${folioRef}</p>
      <p><strong>Folio Fiscal (UUID):</strong> ${input.uuid}</p>
      <p><strong>Total:</strong> ${totalFmt} MXN</p>
      <p><strong>Fecha de emisión:</strong> ${formatDate(input.fechaEmision)}</p>
    </div>
    <p>Este CFDI fue timbrado ante el SAT y tiene plena validez fiscal. Puedes verificarlo en el portal del SAT con el UUID indicado.</p>
    <p>Se adjuntan el PDF y el XML de este comprobante.</p>
  `;

  const attachments: { filename: string; content: Buffer }[] = [];
  if (input.pdfBuffer) {
    attachments.push({ filename: `CFDI_${folioRef}.pdf`, content: input.pdfBuffer });
  }
  if (input.xmlContent) {
    attachments.push({ filename: `CFDI_${folioRef}.xml`, content: Buffer.from(input.xmlContent, 'utf-8') });
  }

  await resend.emails.send({
    from: getFrom(),
    to: input.toEmail,
    subject: `📄 CFDI ${folioRef} de ${input.emisorName} — ${totalFmt}`,
    html: wrapHtml(body),
    attachments,
  });
}

// ─── Correo: Alerta de Stock Bajo ─────────────────────────────────────────────

export interface LowStockAlertInput {
  toEmail: string;
  toName: string;
  tenantName: string;
  products: Array<{
    name: string;
    sku: string | null;
    stock: number;
    minStock: number;
  }>;
}

export async function sendLowStockAlertEmail(input: LowStockAlertInput): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const outOfStock = input.products.filter((p) => p.stock <= 0);
  const lowStock   = input.products.filter((p) => p.stock > 0 && p.stock <= p.minStock);

  const productRows = input.products.map((p) => `
    <tr>
      <td style="padding:8px 12px;font-weight:600;color:#09090b;">${p.name}</td>
      <td style="padding:8px 12px;color:#71717a;font-family:monospace;font-size:12px;">${p.sku ?? '—'}</td>
      <td style="padding:8px 12px;text-align:center;font-weight:700;color:${p.stock <= 0 ? '#ef4444' : '#f59e0b'};">
        ${p.stock <= 0 ? '⚠ Sin stock' : p.stock}
      </td>
      <td style="padding:8px 12px;text-align:center;color:#71717a;">${p.minStock}</td>
    </tr>
  `).join('');

  const body = `
    <span class="badge" style="background:#fef3c7;color:#92400e;">📦 Alerta de Inventario — ${input.tenantName}</span>
    <p>Hola <strong>${input.toName}</strong>,</p>
    <p>Se detectaron <strong>${outOfStock.length} producto(s) sin stock</strong> y <strong>${lowStock.length} con stock bajo el mínimo</strong> en <strong>${input.tenantName}</strong>.</p>
    <table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:13px;">
      <thead>
        <tr style="background:#f4f4f5;">
          <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#71717a;letter-spacing:.05em;">Producto</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#71717a;letter-spacing:.05em;">SKU</th>
          <th style="padding:8px 12px;text-align:center;font-size:11px;text-transform:uppercase;color:#71717a;letter-spacing:.05em;">Stock</th>
          <th style="padding:8px 12px;text-align:center;font-size:11px;text-transform:uppercase;color:#71717a;letter-spacing:.05em;">Mínimo</th>
        </tr>
      </thead>
      <tbody>${productRows}</tbody>
    </table>
    <p style="margin-top:20px;">Accede a <strong>SCM → Inventarios → Alertas</strong> en CIFRA para gestionar las entradas de stock.</p>
  `;

  await resend.emails.send({
    from: getFrom(),
    to: input.toEmail,
    subject: `📦 Alerta de inventario: ${input.products.length} producto(s) con stock crítico — ${input.tenantName}`,
    html: wrapHtml(body),
  });
}

// ─── Correo: Bienvenida post-onboarding ──────────────────────────────────────

export interface WelcomeEmailInput {
  to: string;
  tenantName: string;
  userName: string;
  modulesActivated: number;
}

export async function sendWelcomeEmail(input: WelcomeEmailInput): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://cifra-mx.vercel.app';

  const body = `
    <div style="text-align:center;margin-bottom:24px;">
      <h1 style="font-size:28px;font-weight:700;color:#0f172a;margin:0;">¡Bienvenido a CIFRA!</h1>
      <p style="font-size:16px;color:#64748b;margin-top:8px;">Hola ${input.userName}, tu empresa <strong>${input.tenantName}</strong> ya está configurada.</p>
    </div>
    <div style="background:#f8fafc;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0;font-size:14px;color:#475569;">
        ✅ <strong>${input.modulesActivated} módulos activados</strong> en tu cuenta de prueba (14 días gratis).<br/>
        Explora el sistema y descubre todo lo que puedes hacer desde el dashboard.
      </p>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${appUrl}/dashboard"
         style="display:inline-block;background:#0f172a;color:#fff;font-weight:600;font-size:14px;
                padding:12px 32px;border-radius:10px;text-decoration:none;letter-spacing:.02em;">
        Ir al Dashboard →
      </a>
    </div>
  `;

  await resend.emails.send({
    from: getFrom(),
    to: input.to,
    subject: `¡Bienvenido a CIFRA, ${input.tenantName}! 🚀`,
    html: wrapHtml(body),
  });
}

// ─── sendEmail genérico (para reportes PDF/Excel) ─────────────────────────────

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer; contentType: string }[];
}

export async function sendEmail(opts: SendEmailOptions): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn('[mailer] RESEND_API_KEY no configurado — email omitido:', opts.subject);
    return;
  }
  await resend.emails.send({
    from: getFrom(),
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    attachments: opts.attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
    })),
  });
}
