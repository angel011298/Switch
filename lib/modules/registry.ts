/**
 * Switch OS — Registro Central de Módulos
 * ========================================
 * Fuente de verdad que mapea cada ModuleKey del enum de Prisma
 * a su metadata de UI (icono, rutas, color, agrupación).
 *
 * El Sidebar y el middleware leen este archivo para determinar
 * qué mostrar y qué proteger según los active_modules del JWT.
 */

import {
  LayoutDashboard,
  CalendarDays,
  BarChart3,
  Users,
  Receipt,
  GraduationCap,
  Landmark,
  Calculator,
  HandCoins,
  FileText,
  ShoppingCart,
  Target,
  Megaphone,
  HeadphonesIcon,
  Box,
  Warehouse,
  Truck,
  Factory,
  ShieldCheck,
  Briefcase,
  type LucideIcon,
} from 'lucide-react';

// ─── Tipos ──────────────────────────────────────────────

export type ModuleKey =
  | 'DASHBOARD' | 'CALENDAR' | 'BI'
  | 'HCM' | 'PAYROLL' | 'TALENT'
  | 'FINANCE' | 'TAXES' | 'COLLECTIONS'
  | 'BILLING_CFDI'
  | 'POS'
  | 'CRM' | 'MARKETING' | 'SUPPORT'
  | 'SCM' | 'INVENTORY' | 'LOGISTICS'
  | 'MRP' | 'QUALITY'
  | 'PROJECTS';

export interface ModuleRoute {
  name: string;
  href: string;
}

export interface ModuleDef {
  key: ModuleKey;
  label: string;
  icon: LucideIcon;
  color: string;         // Tailwind text color class
  routes: ModuleRoute[];
}

export interface ModuleGroup {
  title: string;
  color: string;         // Tailwind text color class del grupo
  modules: ModuleKey[];  // Qué ModuleKeys pertenecen a este pilar
}

// ─── Definiciones individuales de cada módulo ───────────

export const MODULE_DEFS: Record<ModuleKey, ModuleDef> = {
  // Centro Estratégico
  DASHBOARD: {
    key: 'DASHBOARD',
    label: 'Dashboard Hub',
    icon: LayoutDashboard,
    color: 'text-blue-500',
    routes: [{ name: 'Dashboard Empresarial', href: '/dashboard' }],
  },
  CALENDAR: {
    key: 'CALENDAR',
    label: 'Calendario',
    icon: CalendarDays,
    color: 'text-blue-500',
    routes: [{ name: 'Calendario Inteligente', href: '/citas' }],
  },
  BI: {
    key: 'BI',
    label: 'BI & Analytics',
    icon: BarChart3,
    color: 'text-blue-500',
    routes: [{ name: 'BI & Reporting', href: '/bi' }],
  },

  // Capital Humano
  HCM: {
    key: 'HCM',
    label: 'Capital Humano',
    icon: Users,
    color: 'text-emerald-500',
    routes: [
      { name: 'Monitor de Asistencias', href: '/rrhh' },
      { name: 'Cultura y Estructura', href: '/rrhh/cultura' },
      { name: 'Documentos Laborales', href: '/rrhh/documentos' },
    ],
  },
  PAYROLL: {
    key: 'PAYROLL',
    label: 'Nomina',
    icon: Receipt,
    color: 'text-emerald-500',
    routes: [{ name: 'Nomina y Administracion', href: '/rrhh/nomina' }],
  },
  TALENT: {
    key: 'TALENT',
    label: 'Talento',
    icon: GraduationCap,
    color: 'text-emerald-500',
    routes: [{ name: 'Gestion del Talento', href: '/rrhh/talento' }],
  },

  // Finanzas
  FINANCE: {
    key: 'FINANCE',
    label: 'Finanzas',
    icon: Landmark,
    color: 'text-amber-500',
    routes: [
      { name: 'Tesoreria y Caja Chica', href: '/finanzas/caja-chica' },
      { name: 'Gastos XML', href: '/finanzas/gastos' },
      { name: 'Gestion Legal', href: '/finanzas/legal' },
    ],
  },
  TAXES: {
    key: 'TAXES',
    label: 'Impuestos',
    icon: Calculator,
    color: 'text-amber-500',
    routes: [{ name: 'Impuestos y Declaraciones', href: '/finanzas/impuestos' }],
  },
  COLLECTIONS: {
    key: 'COLLECTIONS',
    label: 'Cobranza',
    icon: HandCoins,
    color: 'text-amber-500',
    routes: [{ name: 'Cuentas por Cobrar', href: '/finanzas/cobranza' }],
  },

  // Facturacion Electronica (independiente)
  BILLING_CFDI: {
    key: 'BILLING_CFDI',
    label: 'Facturacion CFDI',
    icon: FileText,
    color: 'text-cyan-500',
    routes: [
      { name: 'Emitir Factura', href: '/billing' },
      { name: 'Mis CFDI', href: '/billing/historial' },
    ],
  },

  // Punto de Venta (independiente)
  POS: {
    key: 'POS',
    label: 'Punto de Venta',
    icon: ShoppingCart,
    color: 'text-pink-500',
    routes: [
      { name: 'Terminal POS', href: '/pos' },
      { name: 'Corte de Caja', href: '/pos/corte' },
    ],
  },

  // CRM
  CRM: {
    key: 'CRM',
    label: 'CRM & Ventas',
    icon: Target,
    color: 'text-purple-500',
    routes: [
      { name: 'CRM & Clientes',  href: '/crm' },
      { name: 'Pipeline Kanban', href: '/crm/pipeline' },
    ],
  },
  MARKETING: {
    key: 'MARKETING',
    label: 'Marketing',
    icon: Megaphone,
    color: 'text-purple-500',
    routes: [{ name: 'Marketing Automatico', href: '/crm/marketing' }],
  },
  SUPPORT: {
    key: 'SUPPORT',
    label: 'Soporte',
    icon: HeadphonesIcon,
    color: 'text-purple-500',
    routes: [{ name: 'Mesa de Ayuda', href: '/crm/soporte' }],
  },

  // SCM
  SCM: {
    key: 'SCM',
    label: 'Cadena Suministro',
    icon: Box,
    color: 'text-orange-500',
    routes: [{ name: 'Compras (Procurement)', href: '/scm/compras' }],
  },
  INVENTORY: {
    key: 'INVENTORY',
    label: 'Inventarios',
    icon: Warehouse,
    color: 'text-orange-500',
    routes: [{ name: 'Inventarios y Almacen', href: '/scm/inventarios' }],
  },
  LOGISTICS: {
    key: 'LOGISTICS',
    label: 'Logistica',
    icon: Truck,
    color: 'text-orange-500',
    routes: [{ name: 'Logistica y Transporte', href: '/scm/logistica' }],
  },

  // MRP
  MRP: {
    key: 'MRP',
    label: 'Manufactura',
    icon: Factory,
    color: 'text-rose-500',
    routes: [
      { name: 'Ingenieria (BOM)', href: '/mrp/bom' },
      { name: 'Planificacion', href: '/mrp/planificacion' },
    ],
  },
  QUALITY: {
    key: 'QUALITY',
    label: 'Calidad',
    icon: ShieldCheck,
    color: 'text-rose-500',
    routes: [{ name: 'Control de Calidad', href: '/mrp/calidad' }],
  },

  // Proyectos
  PROJECTS: {
    key: 'PROJECTS',
    label: 'Proyectos',
    icon: Briefcase,
    color: 'text-sky-500',
    routes: [
      { name: 'Gestion de Proyectos', href: '/proyectos' },
      { name: 'Control de Tiempos', href: '/proyectos/tiempos' },
      { name: 'Analisis de Rentabilidad', href: '/proyectos/rentabilidad' },
    ],
  },
};

// ─── Agrupación por Pilar (7 pilares de Switch OS) ─────

export const MODULE_GROUPS: ModuleGroup[] = [
  {
    title: 'Centro Estrategico',
    color: 'text-blue-500',
    modules: ['DASHBOARD', 'CALENDAR', 'BI'],
  },
  {
    title: 'Capital Humano',
    color: 'text-emerald-500',
    modules: ['HCM', 'PAYROLL', 'TALENT'],
  },
  {
    title: 'Finanzas',
    color: 'text-amber-500',
    modules: ['FINANCE', 'TAXES', 'COLLECTIONS'],
  },
  {
    title: 'Facturacion CFDI',
    color: 'text-cyan-500',
    modules: ['BILLING_CFDI'],
  },
  {
    title: 'Punto de Venta',
    color: 'text-pink-500',
    modules: ['POS'],
  },
  {
    title: 'Comercial (CRM)',
    color: 'text-purple-500',
    modules: ['CRM', 'MARKETING', 'SUPPORT'],
  },
  {
    title: 'Operaciones (SCM)',
    color: 'text-orange-500',
    modules: ['SCM', 'INVENTORY', 'LOGISTICS'],
  },
  {
    title: 'Manufactura (MRP)',
    color: 'text-rose-500',
    modules: ['MRP', 'QUALITY'],
  },
  {
    title: 'Servicios y Proyectos',
    color: 'text-sky-500',
    modules: ['PROJECTS'],
  },
];

// ─── Helpers ────────────────────────────────────────────

/**
 * Filtra los grupos de módulos según los módulos activos del tenant.
 * Solo devuelve grupos que tengan al menos 1 módulo activo.
 */
export function getActiveGroups(activeModules: string[]): {
  title: string;
  color: string;
  modules: ModuleDef[];
}[] {
  const activeSet = new Set(activeModules);

  return MODULE_GROUPS
    .map((group) => ({
      title: group.title,
      color: group.color,
      modules: group.modules
        .filter((key) => activeSet.has(key))
        .map((key) => MODULE_DEFS[key]),
    }))
    .filter((group) => group.modules.length > 0);
}

/**
 * Dado un pathname, determina qué ModuleKey necesita estar activo.
 * Retorna null si la ruta es pública o no pertenece a ningún módulo.
 */
export function getRequiredModuleForPath(pathname: string): ModuleKey | null {
  for (const [key, def] of Object.entries(MODULE_DEFS)) {
    for (const route of def.routes) {
      if (pathname === route.href || pathname.startsWith(route.href + '/')) {
        return key as ModuleKey;
      }
    }
  }
  return null;
}
