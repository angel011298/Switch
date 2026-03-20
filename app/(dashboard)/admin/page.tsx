import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ShieldAlert, Building2 } from 'lucide-react';

export default async function AdminDashboard() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
      },
    }
  );

  // 1. Obtener sesión
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  // 2. Leer tu perfil
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // MODO DEPURACIÓN: Si no eres super_admin, en lugar de expulsarte, te mostramos por qué
  if (profile?.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-black text-white p-10 flex flex-col items-center justify-center">
        <h1 className="text-3xl font-black text-red-500 mb-4">Acceso Bloqueado</h1>
        <p>Tu ID de usuario es: <span className="text-emerald-500 font-mono">{user.id}</span></p>
        <p>El rol que lee la base de datos es: <span className="text-emerald-500 font-mono">{profile?.role || 'NULL (No te encuentra)'}</span></p>
        {error && <p className="text-red-400 mt-4 text-sm">Error de BD: {error.message}</p>}
      </div>
    );
  }

  // 3. Traer todas las empresas si eres Super Admin
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, created_at')
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER MAESTRO */}
        <header className="flex items-center gap-4 bg-neutral-950 dark:bg-neutral-900 text-white p-6 rounded-3xl shadow-xl">
          <div className="bg-emerald-500 p-3 rounded-2xl">
            <ShieldAlert className="h-8 w-8 text-neutral-950" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Centro de Mando</h1>
            <p className="text-emerald-500 font-bold text-sm uppercase tracking-widest mt-1">Modo Super Admin Activo</p>
          </div>
        </header>

        {/* MÉTRICAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 flex items-center gap-4">
            <Building2 className="h-10 w-10 text-neutral-400" />
            <div>
              <p className="text-sm font-bold text-neutral-400 uppercase">Empresas (Nivel 2)</p>
              <p className="text-3xl font-black text-neutral-900 dark:text-white">{orgs?.length || 0}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}