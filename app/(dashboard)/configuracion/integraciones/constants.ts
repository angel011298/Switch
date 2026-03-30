/**
 * Constantes de integraciones — sin 'use server' para poder exportar objetos.
 */

export const WEBHOOK_EVENTS = [
  { value: 'invoice.created',   label: 'Factura creada' },
  { value: 'invoice.stamped',   label: 'Factura timbrada' },
  { value: 'invoice.cancelled', label: 'Factura cancelada' },
  { value: 'pos.sale',          label: 'Venta POS' },
  { value: 'customer.created',  label: 'Cliente creado' },
  { value: 'customer.updated',  label: 'Cliente actualizado' },
  { value: 'payment.received',  label: 'Pago recibido' },
  { value: 'stock.low',         label: 'Stock bajo mínimo' },
  { value: 'payroll.closed',    label: 'Nómina cerrada' },
  { value: 'employee.created',  label: 'Empleado creado' },
  { value: 'order.completed',   label: 'Orden de producción completada' },
  { value: 'leave.approved',    label: 'Vacaciones aprobadas' },
] as const;

export const API_SCOPES = [
  { value: 'read:invoices',   label: 'Leer facturas' },
  { value: 'write:invoices',  label: 'Crear/modificar facturas' },
  { value: 'read:customers',  label: 'Leer clientes' },
  { value: 'write:customers', label: 'Crear/modificar clientes' },
  { value: 'read:inventory',  label: 'Leer inventario' },
  { value: 'write:inventory', label: 'Modificar stock' },
  { value: 'read:employees',  label: 'Leer empleados' },
  { value: 'read:payroll',    label: 'Leer nómina' },
  { value: 'read:crm',        label: 'Leer CRM' },
  { value: 'write:crm',       label: 'Crear/modificar CRM' },
  { value: 'read:reports',    label: 'Leer reportes' },
] as const;
