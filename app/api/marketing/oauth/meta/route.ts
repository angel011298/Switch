import { NextRequest, NextResponse } from 'next/server';

/**
 * CIFRA — Meta (Facebook) Ads OAuth 2.0 Initiation
 * ===================================================
 * Redirige al usuario al flujo OAuth de Meta Business.
 *
 * CONFIGURACIÓN REQUERIDA (variables de entorno):
 *   META_ADS_APP_ID          — App ID de Meta Developers (developers.facebook.com)
 *   META_ADS_REDIRECT_URI    — URI de callback registrada en la app de Meta
 *
 * Permisos (scopes) necesarios:
 *   ads_management — Gestión de anuncios
 *   ads_read       — Lectura de métricas
 *   business_management — Acceso al Business Manager
 */
export async function GET(request: NextRequest) {
  const appId       = process.env.META_ADS_APP_ID;
  const redirectUri = process.env.META_ADS_REDIRECT_URI ??
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/marketing/oauth/callback`;

  if (!appId) {
    return NextResponse.json(
      { error: 'Meta Ads no configurado. Agrega META_ADS_APP_ID en las variables de entorno de Vercel.' },
      { status: 503 }
    );
  }

  const params = new URLSearchParams({
    client_id:     appId,
    redirect_uri:  redirectUri,
    response_type: 'code',
    scope:         'ads_management,ads_read,business_management',
    state:         'META_ADS', // Identificamos la plataforma en el callback
  });

  return NextResponse.redirect(
    `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`
  );
}
