/**
 * Constantes de onboarding — sin 'use server' para poder exportar objetos.
 */
import { ModuleKey } from '@prisma/client';

export type ModuleGroup = {
  group: string;
  modules: { key: ModuleKey; label: string; description: string; icon: string }[];
};

export const MODULE_GROUPS: ModuleGroup[] = [
  {
    group: 'Facturación y Finanzas',
    modules: [
      { key: ModuleKey.BILLING_CFDI, label: 'Facturación CFDI 4.0',   description: 'Emite y timbra facturas ante el SAT',           icon: '🧾' },
      { key: ModuleKey.FINANCE,      label: 'Finanzas',                description: 'Contabilidad, balanza y flujo de efectivo',      icon: '💰' },
      { key: ModuleKey.TAXES,        label: 'Impuestos',               description: 'IVA, ISR provisional y declaraciones',           icon: '📊' },
      { key: ModuleKey.COLLECTIONS,  label: 'Cobranza',                description: 'Aging CxC y seguimiento de pagos',               icon: '📥' },
    ],
  },
  {
    group: 'Punto de Venta y CRM',
    modules: [
      { key: ModuleKey.POS,          label: 'Punto de Venta',          description: 'Ventas rápidas con auto-facturación',            icon: '🛒' },
      { key: ModuleKey.CRM,          label: 'CRM y Pipeline',          description: 'Prospectos, deals y pipeline Kanban',            icon: '🎯' },
      { key: ModuleKey.BI,           label: 'Business Intelligence',   description: 'Dashboards y reportes ejecutivos',               icon: '📈' },
    ],
  },
  {
    group: 'Operaciones e Inventario',
    modules: [
      { key: ModuleKey.INVENTORY,    label: 'Inventarios',             description: 'Control de stock y almacenes',                   icon: '📦' },
      { key: ModuleKey.SCM,          label: 'Compras y SCM',           description: 'Proveedores, órdenes y logística',               icon: '🚚' },
      { key: ModuleKey.PROJECTS,     label: 'Proyectos',               description: 'Gestión de proyectos y tiempos',                 icon: '📋' },
    ],
  },
  {
    group: 'Capital Humano',
    modules: [
      { key: ModuleKey.PAYROLL,      label: 'Nómina',                  description: 'ISR/IMSS 2026 y cálculo de quincenas',           icon: '💼' },
      { key: ModuleKey.HCM,          label: 'Recursos Humanos',        description: 'Empleados, asistencias y expedientes',           icon: '👥' },
    ],
  },
];
