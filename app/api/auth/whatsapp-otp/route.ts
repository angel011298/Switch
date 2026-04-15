import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import prisma from '@/lib/prisma';

/**
 * POST /api/auth/whatsapp-otp
 *
 * Genera y almacena un código OTP para verificación por WhatsApp.
 * El código se guarda en la DB (no en memoria) para sobrevivir cold starts.
 *
 * Producción: integrar con Twilio Verify o Meta Cloud API para envío real.
 */

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request: NextRequest) {
  try {
    const { phone, email } = await request.json();

    if (!phone || !email) {
      return NextResponse.json({ error: 'Teléfono y correo son requeridos' }, { status: 400 });
    }

    const code = generateOtp();

    // Eliminar códigos anteriores del mismo email/canal
    await prisma.verificationCode.deleteMany({
      where: { email, channel: 'whatsapp' },
    });

    // Guardar nuevo código en DB (persiste entre cold starts)
    await prisma.verificationCode.create({
      data: {
        email,
        code,
        channel: 'whatsapp',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
      },
    });

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
 * PUT /api/auth/whatsapp-otp
 *
 * Verifica el código OTP y genera un magic link de Supabase para
 * establecer la sesión del usuario sin necesitar confirmación por email.
 */
export async function PUT(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    // Buscar código en DB
    const stored = await prisma.verificationCode.findFirst({
      where: { email, channel: 'whatsapp' },
      orderBy: { createdAt: 'desc' },
    });

    if (!stored) {
      return NextResponse.json(
        { error: 'Código no encontrado. Solicita uno nuevo.' },
        { status: 400 }
      );
    }

    if (new Date() > stored.expiresAt) {
      await prisma.verificationCode.delete({ where: { id: stored.id } });
      return NextResponse.json(
        { error: 'Código expirado. Solicita uno nuevo.' },
        { status: 400 }
      );
    }

    if (stored.code !== code.trim()) {
      return NextResponse.json({ error: 'Código incorrecto.' }, { status: 400 });
    }

    // Eliminar código usado
    await prisma.verificationCode.delete({ where: { id: stored.id } });

    // Generar magic link con Supabase Admin para establecer sesión
    // Esto también confirma el email si no estaba confirmado.
    const admin = getSupabaseAdmin();
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error('[WhatsApp OTP] generateLink error:', linkError);
      return NextResponse.json(
        { error: 'Código correcto pero no se pudo iniciar sesión. Intenta verificar por correo.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, magicLink: linkData.properties.action_link });
  } catch (err) {
    console.error('[WhatsApp OTP PUT]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
