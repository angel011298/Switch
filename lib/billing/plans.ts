/**
 * Switch OS — Definición de Planes
 * ===================================
 * Starter  : módulos básicos (POS, CFDI, CRM, Inventario)
 * Pro      : todos los módulos operativos
 * Enterprise: todos los módulos + soporte prioritario
 *
 * Los Price IDs de Stripe se configuran en las variables de entorno.
 */

import type { ModuleKey } from '@prisma/client';

export type PlanSlug = 'starter' | 'pro' | 'enterprise';

export interface Plan {
  slug: PlanSlug;
  name: string;
  description: string;
  monthlyPrice: number;    // MXN / mes
  annualPrice: number;     // MXN / año
  stripePriceMonthly: string;  // price_xxxx de Stripe
  stripePriceAnnual: string;   // price_xxxx de Stripe
  modules: ModuleKey[];
  features: string[];
  highlighted: boolean;    // Plan recomendado
}

// Módulos incluidos en cada plan
const STARTER_MODULES: ModuleKey[] = [
  'DASHBOARD', 'BILLING_CFDI', 'POS', 'CRM',
  'INVENTORY', 'FINANCE', 'TAXES',
];

const PRO_MODULES: ModuleKey[] = [
  'DASHBOARD', 'BILLING_CFDI', 'POS', 'CRM', 'BI',
  'INVENTORY', 'SCM', 'FINANCE', 'TAXES', 'COLLECTIONS',
  'PAYROLL', 'HCM', 'PROJECTS', 'CALENDAR',
];

const ENTERPRISE_MODULES: ModuleKey[] = [
  ...PRO_MODULES, 'MARKETING', 'SUPPORT', 'LOGISTICS', 'MRP', 'QUALITY', 'TALENT',
];

export const PLANS: Plan[] = [
  {
    slug: 'starter',
    name: 'Starter',
    description: 'Para empresas que inician su digitalización',
    monthlyPrice: 499,
    annualPrice: 4_990,
    stripePriceMonthly: process.env.STRIPE_PRICE_STARTER_MONTHLY ?? '',
    stripePriceAnnual:  process.env.STRIPE_PRICE_STARTER_ANNUAL  ?? '',
    modules: STARTER_MODULES,
    features: [
      'Facturación CFDI 4.0 ilimitada',
      'Punto de Venta (POS)',
      'CRM básico',
      'Control de inventario',
      'Finanzas e impuestos',
      'Soporte por correo',
    ],
    highlighted: false,
  },
  {
    slug: 'pro',
    name: 'Pro',
    description: 'Para empresas en crecimiento con operaciones completas',
    monthlyPrice: 999,
    annualPrice: 9_990,
    stripePriceMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY ?? '',
    stripePriceAnnual:  process.env.STRIPE_PRICE_PRO_ANNUAL  ?? '',
    modules: PRO_MODULES,
    features: [
      'Todo lo de Starter',
      'BI y reportes avanzados',
      'SCM y compras',
      'Nómina ISR/IMSS 2026',
      'Recursos Humanos',
      'Gestión de proyectos',
      'Soporte prioritario',
    ],
    highlighted: true,
  },
  {
    slug: 'enterprise',
    name: 'Enterprise',
    description: 'Solución completa para empresas medianas y grandes',
    monthlyPrice: 1_999,
    annualPrice: 19_990,
    stripePriceMonthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY ?? '',
    stripePriceAnnual:  process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL  ?? '',
    modules: ENTERPRISE_MODULES,
    features: [
      'Todo lo de Pro',
      'MRP y manufactura',
      'Marketing y soporte CRM',
      'Logística avanzada',
      'Todos los módulos incluidos',
      'Soporte dedicado + SLA',
    ],
    highlighted: false,
  },
];

export function getPlanByPriceId(priceId: string): Plan | undefined {
  return PLANS.find(
    (p) => p.stripePriceMonthly === priceId || p.stripePriceAnnual === priceId
  );
}

export function getPlanBySlug(slug: string): Plan | undefined {
  return PLANS.find((p) => p.slug === slug);
}

export const formatMXN = (amount: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
