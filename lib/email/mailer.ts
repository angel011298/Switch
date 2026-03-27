/**
 * Switch OS — Mailer Transaccional
 * ==================================
 * Usa nodemailer con cualquier SMTP (Gmail, Outlook, etc.)
 * Costo: $0 — configurar via variables de entorno.
 *
 * Variables requeridas:
 *   SMTP_HOST      ej. smtp.gmail.com
 *   SMTP_PORT      ej. 587
 *   SMTP_USER      ej. soporte@switchos.mx
 *   SMTP_PASS      App Password de Gmail o contraseña SMTP
 *   SMTP_FROM      ej. "Switch OS <soporte@switchos.mx>"
 */

import nodemailer from 'nodemailer';

function createTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    // Si no hay SMTP configurado, log y no lanzar error (non-blocking)
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT ?? 587),
    secure: Number(SMTP_PORT ?? 587) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
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
  <title>Switch OS</title>
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
    <div class="header">
      <h1>Switch OS</h1>
      <p>ERP / CRM Fiscal para México</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>Este es un mensaje automático de Switch OS. No responder a este correo.</p>
      <p>© ${new Date().getFullYear()} Switch OS — Todos los derechos reservados.</p>
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
  const transporter = createTransporter();
  if (!transporter) {
    console.log('[mailer] SMTP no configurado — omitiendo correo para:', input.toEmail);
    return;
  }

  const body = `
    <span class="badge">✅ Pago confirmado</span>
    <p>Hola <strong>${input.toName}</strong>,</p>
    <p>Hemos recibido y verificado tu pago. Tu suscripción de <strong>${input.tenantName}</strong> en Switch OS ha sido renovada exitosamente.</p>
    <div class="info-box">
      <p><strong>Monto aplicado:</strong> $${input.amount.toFixed(2)} MXN</p>
      <p><strong>Días otorgados:</strong> ${input.daysGranted} días</p>
      <p><strong>Acceso vigente hasta:</strong> ${formatDate(input.newValidUntil)}</p>
    </div>
    <p>Puedes continuar usando todos los módulos de Switch OS sin interrupciones.</p>
    <p>Si tienes alguna duda, contáctanos respondiendo a este correo.</p>
    <p>¡Gracias por confiar en Switch OS! 🚀</p>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? `"Switch OS" <${process.env.SMTP_USER}>`,
    to: input.toEmail,
    subject: `✅ Suscripción renovada — ${input.tenantName} | Switch OS`,
    html: wrapHtml(body),
    text: `Pago confirmado. Suscripción de ${input.tenantName} vigente hasta ${formatDate(input.newValidUntil)}.`,
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

export async function sendExpiryReminderEmail(
  input: ExpiryReminderInput
): Promise<void> {
  const transporter = createTransporter();
  if (!transporter) return;

  const urgency = input.daysLeft <= 3 ? '🚨 URGENTE' : '⚠️ Aviso';
  const body = `
    <span class="badge" style="background:#fef3c7;color:#92400e;">${urgency}: Suscripción por vencer</span>
    <p>Hola <strong>${input.toName}</strong>,</p>
    <p>Tu suscripción de <strong>${input.tenantName}</strong> en Switch OS vence en <strong>${input.daysLeft} día${input.daysLeft !== 1 ? 's' : ''}</strong>.</p>
    <div class="info-box">
      <p><strong>Fecha de vencimiento:</strong> ${formatDate(input.validUntil)}</p>
      <p><strong>Plan:</strong> Switch OS Standard — $499 MXN/mes</p>
    </div>
    <p>Para renovar, realiza una transferencia SPEI y sube tu comprobante en la sección <strong>Suscripción</strong> de tu cuenta.</p>
    <p>Si tu suscripción vence, perderás acceso a todos los módulos hasta que el pago sea confirmado.</p>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? `"Switch OS" <${process.env.SMTP_USER}>`,
    to: input.toEmail,
    subject: `${urgency}: Tu suscripción vence en ${input.daysLeft} día${input.daysLeft !== 1 ? 's' : ''} | Switch OS`,
    html: wrapHtml(body),
    text: `Tu suscripción vence el ${formatDate(input.validUntil)}. Renueva en /billing/subscription.`,
  });
}

// ─── Correo: CFDI Timbrado ────────────────────────────────────────────────────

export interface InvoiceStampedInput {
  toEmail: string;
  toName: string;          // Nombre del receptor
  emisorName: string;      // Razón social del emisor
  uuid: string;            // Folio fiscal
  serie?: string;
  folio: number;
  total: number;
  fechaEmision: Date;
  pdfUrl?: string;         // URL del PDF del CFDI (opcional)
}

export async function sendInvoiceStampedEmail(input: InvoiceStampedInput): Promise<void> {
  const transporter = createTransporter();
  if (!transporter) {
    console.log('[mailer] SMTP no configurado — omitiendo notificación CFDI para:', input.toEmail);
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
    ${input.pdfUrl ? `<p><a href="${input.pdfUrl}" style="color:#10b981;font-weight:600;">📥 Descargar PDF del CFDI</a></p>` : ''}
    <p>Conserva este comprobante para efectos fiscales.</p>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? `"Switch OS" <${process.env.SMTP_USER}>`,
    to: input.toEmail,
    subject: `📄 CFDI ${folioRef} de ${input.emisorName} — ${totalFmt}`,
    html: wrapHtml(body),
    text: `CFDI ${folioRef} de ${input.emisorName}. Total: ${totalFmt}. UUID: ${input.uuid}. Fecha: ${formatDate(input.fechaEmision)}.`,
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
  const transporter = createTransporter();
  if (!transporter) {
    console.log('[mailer] SMTP no configurado — omitiendo alerta de stock para:', input.toEmail);
    return;
  }

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
    <p style="margin-top:20px;">Accede a <strong>SCM → Inventarios → Alertas</strong> en Switch OS para gestionar las entradas de stock.</p>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? `"Switch OS" <${process.env.SMTP_USER}>`,
    to: input.toEmail,
    subject: `📦 Alerta de inventario: ${input.products.length} producto(s) con stock crítico — ${input.tenantName}`,
    html: wrapHtml(body),
    text: `Alerta de inventario para ${input.tenantName}: ${outOfStock.length} sin stock, ${lowStock.length} bajo mínimo.`,
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
  const transporter = createTransporter();
  if (!transporter) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.switchos.mx';

  const body = `
    <div style="text-align:center;margin-bottom:24px;">
      <h1 style="font-size:28px;font-weight:700;color:#0f172a;margin:0;">¡Bienvenido a Switch OS!</h1>
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
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
    <p style="font-size:12px;color:#94a3b8;text-align:center;margin:0;">
      ¿Necesitas ayuda? Contáctanos en soporte@switchos.mx
    </p>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? `"Switch OS" <${process.env.SMTP_USER}>`,
    to: input.to,
    subject: `¡Bienvenido a Switch OS, ${input.tenantName}! 🚀`,
    html: wrapHtml(body),
    text: `¡Bienvenido a Switch OS! Tu empresa ${input.tenantName} ya está configurada con ${input.modulesActivated} módulos activos. Accede en: ${appUrl}/dashboard`,
  });
}

