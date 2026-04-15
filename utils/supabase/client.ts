import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Fallback values prevent build-time prerender failures when
  // NEXT_PUBLIC_ vars aren't available in the Vercel build environment.
  // At runtime the real values (baked into the bundle) are always used.
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'
  )
}