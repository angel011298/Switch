import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-10 font-sans text-slate-900">
            <div className="max-w-xl w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center space-y-4">
                <div className="mx-auto h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h1 className="text-3xl font-bold tracking-tight">¡Bienvenido a Switch OS!</h1>
                <p className="text-slate-500">
                    Si estás viendo esta pantalla, el flujo de autenticación, Prisma y Supabase están funcionando a la perfección.
                </p>
                <div className="mt-6 p-4 bg-slate-100 rounded-lg text-sm text-left font-mono text-slate-600 overflow-auto">
                    Usuario autenticado: {user.email}
                </div>
            </div>
        </div>
    )
}