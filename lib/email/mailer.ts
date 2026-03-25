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
