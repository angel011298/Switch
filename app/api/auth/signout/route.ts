import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * GET /api/auth/signout
 *
 * Server-side sign-out handler.
 * - Calls supabase.auth.signOut() on the server so the session token
 *   is actually revoked in Supabase (not just deleted client-side).
 * - Explicitly removes ALL sb-* cookies and the 2FA cookie from the
 *   response so the browser cannot replay a stale session.
 * - Returns a hard redirect to /login (not a client-side navigation).
 */
export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/login', request.url));

  // Build a server Supabase client that reads cookies from the request
  // and writes cookie mutations to the redirect response.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Revoke the session on the Supabase server
  await supabase.auth.signOut();

  // Explicitly delete every sb-* cookie (access_token, refresh_token, etc.)
  request.cookies.getAll().forEach(({ name }) => {
    if (name.startsWith('sb-') || name === 'cifra_2fa_verified') {
      response.cookies.set(name, '', {
        maxAge: 0,
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
    }
  });

  return response;
}
