import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/whatsapp-otp
 *
 * Stub for WhatsApp OTP delivery.
 * In production: integrate with Twilio Verify or Meta Cloud API.
 *
 * For demo purposes: generates a 6-digit code, stores it server-side
 * in a Map (resets on cold start), and returns success.
 */

// In-memory store — replace with Redis or DB in production
const otpStore = new Map<string, { code: string; expiresAt: number }>();

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(request: NextRequest) {
  try {
    const { phone, email } = await request.json();

    if (!phone || !email) {
      return NextResponse.json({ error: 'Teléfono y correo son requeridos' }, { status: 400 });
    }

    const code = generateOtp();
    const key  = `wa:${email}`;

    otpStore.set(key, {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 min
    });

    // TODO: Replace with Twilio Verify or Meta Cloud API call:
    // await twilioClient.verify.v2.services(VERIFY_SID)
    //   .verifications.create({ to: phone, channel: 'whatsapp' });

    console.log(`[WhatsApp OTP stub] ${phone} → code: ${code}`);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    const key    = `wa:${email}`;
    const stored = otpStore.get(key);

    if (!stored) {
      return NextResponse.json({ error: 'Código no encontrado. Solicita uno nuevo.' }, { status: 400 });
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(key);
      return NextResponse.json({ error: 'Código expirado. Solicita uno nuevo.' }, { status: 400 });
    }

    if (stored.code !== code.trim()) {
      return NextResponse.json({ error: 'Código incorrecto.' }, { status: 400 });
    }

    otpStore.delete(key);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
