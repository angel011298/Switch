import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import prisma from '@/lib/prisma';

// Module-level singleton — avoids re-instantiation on every PUT request.
// Returns null when env vars are absent (e.g. local dev without service key).
let _admin: SupabaseClient | null = null;
function getAdmin(): SupabaseClient | null {
  if (_admin) return _admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  _admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  return _admin;
}

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** POST /api/auth/whatsapp-otp — genera y persiste un código OTP en la DB. */
export async function POST(request: NextRequest) {
  try {
    const { phone, email } = await request.json();

    if (!phone || !email) {
      return NextResponse.json({ error: 'Teléfono y correo son requeridos' }, { status: 400 });
    }

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await prisma.verificationCode.deleteMany({ where: { email, channel: 'whatsapp' } });
    await prisma.verificationCode.create({ data: { email, code, channel: 'whatsapp', expiresAt } });

    // TODO: Reemplazar con Twilio Verify o Meta Cloud API:
    // await twilioClient.verify.v2.services(process.env.TWILIO_VERIFY_SID!)
    //   .verifications.create({ to: phone, channel: 'whatsapp' });
    console.log(`[WhatsApp OTP] ${phone} → code: ${code}`);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[WhatsApp OTP POST]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

/**
 * PUT /api/auth/whatsapp-otp — verifica el código y devuelve un magic link de
 * Supabase que establece la sesión y confirma el email en un solo paso.
 */
export async function PUT(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    const stored = await prisma.verificationCode.findFirst({
      where: { email, channel: 'whatsapp' },
      orderBy: { createdAt: 'desc' },
    });

    if (!stored) {
      return NextResponse.json({ error: 'Código no encontrado. Solicita uno nuevo.' }, { status: 400 });
    }

    if (new Date() > stored.expiresAt) {
      await prisma.verificationCode.delete({ where: { id: stored.id } });
      return NextResponse.json({ error: 'Código expirado. Solicita uno nuevo.' }, { status: 400 });
    }

    if (stored.code !== code.trim()) {
      return NextResponse.json({ error: 'Código incorrecto.' }, { status: 400 });
    }

    await prisma.verificationCode.delete({ where: { id: stored.id } });

    const admin = getAdmin();
    if (!admin) {
      console.error('[WhatsApp OTP] SUPABASE_SERVICE_ROLE_KEY not set');
      return NextResponse.json({ error: 'Servicio no configurado. Intenta verificar por correo.' }, { status: 503 });
    }

    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error('[WhatsApp OTP] generateLink error:', linkError);
      return NextResponse.json({ error: 'No se pudo iniciar sesión. Intenta verificar por correo.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, magicLink: linkData.properties.action_link });
  } catch (err) {
    console.error('[WhatsApp OTP PUT]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
