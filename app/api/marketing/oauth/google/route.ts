import { NextRequest, NextResponse } from 'next/server';

/**
 * CIFRA — Google Ads OAuth 2.0 Initiation
 * ==========================================
 * Redirige al usuario al flujo OAuth de Google Ads.
 *
 * CONFIGURACIÓN REQUERIDA (variables de entorno):
 *   GOOGLE_ADS_CLIENT_ID     — OAuth Client ID de Google Cloud Console
 *   GOOGLE_ADS_REDIRECT_URI  — URI de callback (https://cifra-mx.vercel.app/api/marketing/oauth/callback)
 *
 * Scopes necesarios para Google Ads API:
 *   https://www.googleapis.com/auth/adwords
 */
export async function GET(request: NextRequest) {
  const clientId    = process.env.GOOGLE_ADS_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_ADS_REDIRECT_URI ??
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/marketing/oauth/callback`;

  if (!clientId) {
    return NextResponse.json(
      { error: 'Google Ads no configurado. Agrega GOOGLE_ADS_CLIENT_ID en las variables de entorno de Vercel.' },
      { status: 503 }
    );
  }

  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  redirectUri,
    response_type: 'code',
    scope:         'https://www.googleapis.com/auth/adwords',
    access_type:   'offline',
    prompt:        'consent',
    state:         'GOOGLE_ADS', // Identificamos la plataforma en el callback
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
}
