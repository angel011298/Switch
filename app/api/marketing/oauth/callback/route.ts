import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * CIFRA — Marketing OAuth Callback Handler
 * ==========================================
 * Recibe el código de autorización de Google Ads o Meta Ads,
 * intercambia por tokens y guarda la integración en BD.
 *
 * El parámetro `state` identifica la plataforma: 'GOOGLE_ADS' | 'META_ADS'
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cifra-mx.vercel.app';

async function exchangeGoogleCode(code: string): Promise<{ accessToken: string; refreshToken: string; accountId: string }> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id:     process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      redirect_uri:  process.env.GOOGLE_ADS_REDIRECT_URI ?? `${SITE_URL}/api/marketing/oauth/callback`,
      grant_type:    'authorization_code',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google token exchange failed: ${err}`);
  }

  const data = await res.json();
  // Customer ID de Google Ads (se obtiene de la API después del auth)
  return {
    accessToken:  data.access_token,
    refreshToken: data.refresh_token ?? '',
    accountId:    'pending_setup', // Se configura desde el panel después
  };
}

async function exchangeMetaCode(code: string): Promise<{ accessToken: string; accountId: string }> {
  const redirectUri = process.env.META_ADS_REDIRECT_URI ?? `${SITE_URL}/api/marketing/oauth/callback`;

  const res = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?` +
    `client_id=${process.env.META_ADS_APP_ID}` +
    `&client_secret=${process.env.META_ADS_APP_SECRET}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&code=${code}`
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Meta token exchange failed: ${err}`);
  }

  const data = await res.json();
  return {
    accessToken: data.access_token,
    accountId:   'pending_setup', // Se configura desde el panel después
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code    = searchParams.get('code');
  const state   = searchParams.get('state');   // 'GOOGLE_ADS' | 'META_ADS'
  const errParam = searchParams.get('error');

  if (errParam) {
    return NextResponse.redirect(`${SITE_URL}/admin/marketing?error=${encodeURIComponent(errParam)}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${SITE_URL}/admin/marketing?error=missing_params`);
  }

  try {
    if (state === 'GOOGLE_ADS') {
      const { accessToken, refreshToken, accountId } = await exchangeGoogleCode(code);
      await prisma.marketingIntegration.upsert({
        where:  { id: 'google-ads-singleton' }, // Usamos upsert con ID fijo para integración única
        update: { accessToken, refreshToken, accountId, isActive: true },
        create: { id: 'google-ads-singleton', platform: 'GOOGLE_ADS', accessToken, refreshToken, accountId, isActive: true },
      });
    } else if (state === 'META_ADS') {
      const { accessToken, accountId } = await exchangeMetaCode(code);
      await prisma.marketingIntegration.upsert({
        where:  { id: 'meta-ads-singleton' },
        update: { accessToken, accountId, isActive: true },
        create: { id: 'meta-ads-singleton', platform: 'META_ADS', accessToken, accountId, isActive: true },
      });
    }

    return NextResponse.redirect(`${SITE_URL}/admin/marketing?connected=${state}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Marketing OAuth Callback]', msg);
    return NextResponse.redirect(`${SITE_URL}/admin/marketing?error=${encodeURIComponent(msg)}`);
  }
}
