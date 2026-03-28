'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  LayoutDashboard, Users, Landmark, Target, Box, Factory, Briefcase,
  ChevronLeft, ChevronRight, Menu, Sun, Moon, LogOut, ShieldAlert,
  ChevronDown, Bot, Sparkles, Building2, ShieldCheck, Blocks, History, Settings
} from 'lucide-react';

// --- ARQUITECTURA DEFINITIVA DE 7 PILARES (RUTAS CORREGIDAS) ---
const menuGroups = [
  {
    title: 'Centro Estratégico',
    icon: LayoutDashboard,
    color: 'text-blue-500',
    subItems: [
      { name: 'Dashboard Empresarial', href: '/' },
      { name: 'Calendario Inteligente', href: '/citas' },
      { name: 'BI & Reporting', href: '/bi' },
    ]
  },
  {
    title: 'Capital Humano (HCM)',
    icon: Users,
    color: 'text-emerald-500',
    subItems: [
      { name: 'Monitor de Asistencias', href: '/rrhh' },
      { name: 'Nómina y Administración', href: '/rrhh/nomina' },
      { name: 'Gestión del Talento', href: '/rrhh/talento' },
      { name: 'Cultura y Estructura', href: '/rrhh/cultura' },
      { name: 'Documentación Laboral', href: '/rrhh/documentos' },
    ]
  },
  {
    title: 'Finanzas (ERP Core)',
    icon: Landmark,
    color: 'text-amber-500',
    subItems: [
      { name: 'Tesorería y Caja Chica', href: '/finanzas/caja-chica' },
      { name: 'Gastos XML (Contabilidad)', href: '/finanzas/gastos' },
      { name: 'Impuestos y Facturación', href: '/finanzas/impuestos' },
      { name: 'Cuentas por Cobrar', href: '/finanzas/cobranza' },
      { name: 'Gestión Legal', href: '/finanzas/legal' },
    ]
  },
  {
    title: 'Comercial (CRM & CX)',
    icon: Target,
    color: 'text-purple-500',
    subItems: [
      { name: 'Marketing Automático', href: '/crm/marketing' },
      { name: 'CRM & Ventas', href: '/crm' },
      { name: 'Mesa de Ayuda (Tickets)', href: '/crm/soporte' },
    ]
  },
  {
    title: 'Operaciones (SCM)',
    icon: Box,
    color: 'text-orange-500',
    subItems: [
      { name: 'Compras (Procurement)', href: '/scm/compras' },
      { name: 'Inventarios y Almacén', href: '/scm/inventarios' },
      { name: 'Logística y Transporte', href: '/scm/logistica' },
    ]
  },
  {
    title: 'Manufactura (MRP)',
    icon: Factory,
    color: 'text-rose-500',
    subItems: [
      { name: 'Ingeniería (BOM)', href: '/mrp/bom' },
      { name: 'Planificación Producción', href: '/mrp/planificacion' },
      { name: 'Control de Calidad', href: '/mrp/calidad' },
    ]
  },
  {
    title: 'Servicios y Proyectos',
    icon: Briefcase,
    color: 'text-sky-500',
    subItems: [
      { name: 'Gestión de Proyectos', href: '/proyectos' },
      { name: 'Control de Tiempos', href: '/proyectos/tiempos' },
      { name: 'Análisis de Rentabilidad', href: '/proyectos/rentabilidad' },
    ]
  }
];

// Menú del Super Admin
const adminNavItems = [
  { name: 'Panel Principal', href: '/admin', icon: ShieldAlert },
  { name: 'Organización', href: '/admin/organizacion', icon: Building2 },
  { name: 'Seguridad y Accesos', href: '/admin/seguridad', icon: ShieldCheck },
  { name: 'Config. Fiscal', href: '/admin/fiscal', icon: Landmark },
  { name: 'Módulos y App', href: '/admin/modulos', icon: Blocks },
  { name: 'Auditoría y Logs', href: '/admin/auditoria', icon: History },
  { name: 'Mi Cuenta', href: '/admin/cuenta', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname() || '';
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const [openGroup, setOpenGroup] = useState<string | null>('Centro Estratégico');
  
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    async function getAccessData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        setUserRole(profile?.role || 'employee');
      }
    }
    getAccessData();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const toggleGroup = (groupTitle: string) => {
    if (isCollapsed) setIsCollapsed(false);
    setOpenGroup(openGroup === groupTitle ? null : groupTitle);
  };

  if (pathname.startsWith('/signin') || !mounted) return null;

  const isAdminRoute = pathname.startsWith('/admin');
  const showAdminMenu = isAdminRoute && userRole === 'super_admin';

  return (
    <aside 
      className={`bg-neutral-50 dark:bg-black border-r border-neutral-200 dark:border-neutral-800 flex flex-col transition-all duration-300 min-h-screen relative z-50
        ${isCollapsed ? 'w-20' : 'w-72'}`}
    >
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3.5 top-8 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-full p-1.5 shadow-lg hover:scale-110 transition-transform border-2 border-white dark:border-black"
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      <div className={`px-4 py-6 mb-2 flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
        {!isCollapsed ? (
          <div className="flex flex-col gap-1 overflow-hidden">
            <img src="/logo-light.png" alt="Logo" className="h-8 object-contain object-left block dark:hidden" />
            <img src="/logo-dark.png" alt="Logo" className="h-8 object-contain object-left hidden dark:block" />
            <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest truncate">
              {showAdminMenu ? 'Módulo Maestro' : 'CIFRA Workspace'}
            </p>
          </div>
        ) : (
          <Menu className="h-6 w-6 text-neutral-400" />
        )}
      </div>

      <div className="px-3 mb-4">
        <button 
          className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'justify-between px-4 py-3'} bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-md transition-all group`}
          title={isCollapsed ? "CIFRA AI" : ""}
        >
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
            <Bot className={`flex-shrink-0 ${isCollapsed ? 'h-6 w-6' : 'h-5 w-5'} group-hover:animate-bounce`} />
            {!isCollapsed && <span className="text-sm font-bold">CIFRA AI</span>}
          </div>
          {!isCollapsed && <Sparkles className="h-4 w-4 text-purple-200" />}
        </button>
      </div>
      
      <div className="flex-1 space-y-1 overflow-y-auto px-3 pb-4 custom-scrollbar">
        {showAdminMenu ? (
          adminNavItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.name} href={item.href} title={isCollapsed ? item.name : ''}
                className={`flex items-center ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'} rounded-xl transition-all ${active ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900'}`}>
                <item.icon className={`flex-shrink-0 ${isCollapsed ? 'h-5 w-5' : 'h-4 w-4'}`} />
                {!isCollapsed && <span className="text-sm truncate">{item.name}</span>}
              </Link>
            );
          })
        ) : (
          menuGroups.map((group) => {
            const isOpen = openGroup === group.title && !isCollapsed;
            const hasActiveSubItem = group.subItems.some(sub => pathname === sub.href);
            
            return (
              <div key={group.title} className="mb-1">
                <button
                  onClick={() => toggleGroup(group.title)}
                  title={isCollapsed ? group.title : ''}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'justify-between px-3 py-2.5'} rounded-xl transition-all
                    ${hasActiveSubItem && isCollapsed ? 'bg-neutral-200 dark:bg-neutral-800' : 'hover:bg-neutral-100 dark:hover:bg-neutral-900/50'}
                  `}
                >
                  <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                    <group.icon className={`flex-shrink-0 ${isCollapsed ? 'h-5 w-5 text-neutral-500' : `h-4 w-4 ${group.color}`}`} />
                    {!isCollapsed && (
                      <span className={`text-sm font-bold truncate ${hasActiveSubItem ? 'text-neutral-900 dark:text-white' : 'text-neutral-600 dark:text-neutral-400'}`}>
                        {group.title}
                      </span>
                    )}
                  </div>
                  {!isCollapsed && (
                    <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  )}
                </button>

                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-64 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                  <div className="pl-11 pr-2 space-y-1 pb-2 border-l-2 border-neutral-100 dark:border-neutral-800 ml-5">
                    {group.subItems.map((subItem) => {
                      const isSubActive = pathname === subItem.href;
                      return (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          className={`block px-3 py-2 rounded-lg text-xs transition-colors truncate
                            ${isSubActive 
                              ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold' 
                              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900/50'
                            }`}
                        >
                          {subItem.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-auto pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-2 px-3 pb-4">
        {userRole === 'super_admin' && (
          <Link href={showAdminMenu ? '/' : '/admin'} title={isCollapsed ? (showAdminMenu ? 'Vista Cliente' : 'Vista Admin') : ''}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-3'} rounded-xl transition-all font-black mb-4 ${showAdminMenu ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white' : 'bg-neutral-950 dark:bg-white text-white dark:text-black'}`}>
            <ShieldAlert className="h-4 w-4 flex-shrink-0" />
            {!isCollapsed && <span className="text-sm truncate">{showAdminMenu ? 'Vista Operativa' : 'Admin Maestro'}</span>}
          </Link>
        )}

        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title={isCollapsed ? `Modo ${theme === 'dark' ? 'Día' : 'Noche'}` : ''}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'justify-between px-3 py-2'} rounded-xl text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all`}>
          {!isCollapsed && <span className="text-sm font-medium">Modo {theme === 'dark' ? 'Día' : 'Noche'}</span>}
          {theme === 'dark' ? <Sun className="h-4 w-4 flex-shrink-0" /> : <Moon className="h-4 w-4 flex-shrink-0" />}
        </button>

        <button onClick={handleSignOut} title={isCollapsed ? 'Cerrar Sesión' : ''}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2'} rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all`}>
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">Cerrar Sesión</span>}
        </button>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e5e5; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; }
      `}</style>
    </aside>
  );
}