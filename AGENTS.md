# CIFRA ERP — Roadmap de Desarrollo

> Documento de referencia para agentes de IA y desarrolladores. Actualizado: 2026-03-28.
> Este archivo define el estado actual del proyecto y las fases pendientes de desarrollo.

---

## Estado Actual

CIFRA ERP es una plataforma SaaS multi-tenant de gestión empresarial para el mercado mexicano. Construida con Next.js 14 (App Router), Prisma ORM, Supabase (PostgreSQL + Auth + Storage), Stripe y Vercel.

**Stack tecnológico:**
- Framework: Next.js 14 (App Router, Server Components, Server Actions)
- Base de datos: PostgreSQL via Supabase + Prisma ORM
- Auth: Supabase Auth (JWT, RLS)
- Pagos: Stripe (subscriptions, webhooks, customer portal)
- Email: Resend
- PDF: @react-pdf/renderer
- Charts: Recharts
- UI: Tailwind CSS + shadcn/ui
- Deploy: Vercel + CI/CD GitHub Actions

**Modelos en DB (Prisma schema):**
`Tenant`, `TenantModule`, `Subscription`, `PaymentProof`, `User`, `Project`, `Task`, `TimeEntry`, `Product`, `PosOrder`, `PosOrderItem`, `Customer`, `TaxRegime`, `TaxRule`, `CsdVault`, `Invoice`, `InvoiceItem`, `Account`, `JournalEntry`, `JournalLine`, `XmlBatch`, `Employee`, `Attendance`, `PayrollRun`, `PayrollItem`, `PettyCashFund`, `PettyCashExpense`, `Warehouse`, `StockMovement`, `PipelineColumn`, `Deal`, `AuditLog`

---

## Fases Completadas (1–25)

| # | Fase | Estado |
|---|------|--------|
| 1–11 | Auth, Supabase, multi-tenant, módulos base | ✅ |
| 12 | Onboarding fiscal + paywall | ✅ |
| 13 | CFDI 4.0 — Facturación electrónica SAT | ✅ |
| 14 | POS ↔ CFDI ↔ Contabilidad (interconexiones) | ✅ |
| 15 | RRHH — Empleados, Nómina ISR/IMSS 2026 | ✅ |
| 16 | Finanzas — Impuestos, Cobranza, Caja Chica | ✅ |
| 17 | SCM — Almacenes, Inventario, Movimientos de stock | ✅ |
| 18 | CRM Pipeline Kanban + BI Dashboard (mock data) | ✅ |
| 19 | Production readiness — Error boundaries, seguridad, tests | ✅ |
| 20 | Deploy a producción — Vercel + CI/CD + health check | ✅ |
| 21 | Wizard de Onboarding de Tenant (3 pasos + bienvenida) | ✅ |
| 22 | Stripe Billing — Checkout + Webhook + Portal + Pricing UI | ✅ |
| 23 | Landing Page — Hero, módulos, precios, WhatsApp CTA | ✅ |
| 24 | Reportes PDF/Excel — CFDI, Estado de Cuenta, Nómina | ✅ |
| 25 | RBAC — Jerarquía ADMIN>MANAGER>OPERATIVE, audit log, UI | ✅ |

---

## Roadmap Pendiente

Las fases pendientes están organizadas en tres bloques de prioridad. Cada fase es independiente salvo donde se indiquen dependencias explícitas.

---

## PRIORIDAD ALTA — Core del Producto

---

### FASE 26 — Sistema de Notificaciones en Tiempo Real

**Objetivo:** Implementar un centro de notificaciones persistente en el header para alertar a los usuarios sobre eventos críticos del negocio.

**Valor al negocio:** Reduce el tiempo de respuesta ante eventos como facturas vencidas o stock bajo, mejorando la operación diaria del tenant sin requerir que el usuario revise cada módulo manualmente.

**Módulos afectados:**
- `app/api/notifications/route.ts` (GET lista, POST crear)
- `app/api/notifications/[id]/read/route.ts` (PATCH marcar leída)
- `app/api/notifications/read-all/route.ts` (PATCH marcar todas leídas)
- `components/layout/NotificationCenter.tsx` (dropdown campana)
- `components/layout/Header.tsx` (badge de no-leídas)
- `lib/notifications.ts` (helpers para crear notificaciones desde otros módulos)
- `prisma/schema.prisma` (modelo Notification)

**Entregables:**
- [ ] Modelo Prisma `Notification`: `id`, `tenantId`, `userId`, `type` (enum), `title`, `body`, `read` (boolean), `link`, `createdAt`
- [ ] Enum `NotificationType`: `FACTURA_VENCIDA`, `PAGO_RECIBIDO`, `STOCK_BAJO`, `DEAL_GANADO`, `NOMINA_LISTA`, `SISTEMA`
- [ ] Migration de Prisma + `npx prisma generate`
- [ ] API `GET /api/notifications` — lista las últimas 50 notificaciones del tenant/usuario ordenadas por fecha desc
- [ ] API `PATCH /api/notifications/[id]/read` — marca una notificación como leída
- [ ] API `PATCH /api/notifications/read-all` — marca todas las notificaciones del usuario como leídas
- [ ] Hook `useNotifications()` — expone `{ notifications, unreadCount, markRead, markAllRead }` con polling cada 30s
- [ ] Componente `NotificationCenter` — dropdown con scroll, items agrupados por tipo, botón "Marcar todo leído"
- [ ] Badge numérico rojo en el ícono de campana del Header (solo visible si `unreadCount > 0`)
- [ ] Helper `createNotification(tenantId, userId, type, title, body, link?)` reutilizable en toda la app
- [ ] Disparador: al vencer una `Invoice` (`dueDate < now` y `status != PAID`) → crear notificación `FACTURA_VENCIDA`
- [ ] Disparador: al bajar `StockMovement` el stock de un producto bajo su umbral mínimo → notificación `STOCK_BAJO`

**Dependencias:** FASE 25 (RBAC, `userId` disponible en contexto de sesión)

**Estimado:** M (2–3 días)

---

### FASE 27 — Portal del Cliente (Customer Portal)

**Objetivo:** Crear un portal público y seguro donde los clientes del tenant puedan consultar sus facturas y descargar sus CFDIs sin necesidad de tener cuenta en el ERP.

**Valor al negocio:** Elimina la fricción del envío manual de facturas por email, reduce el soporte, y proyecta una imagen profesional al cliente final del tenant sin costos adicionales de infraestructura.

**Módulos afectados:**
- `app/portal/[token]/page.tsx` — página pública del portal (sin layout de dashboard)
- `app/portal/[token]/invoice/[id]/page.tsx` — detalle de factura individual
- `app/api/portal/[token]/route.ts` — validación de token + retorno de datos
- `app/api/portal/token/generate/route.ts` — generación y envío de token
- `app/(dashboard)/crm/clientes/[id]/page.tsx` — botón "Generar enlace portal"
- `prisma/schema.prisma` (modelo CustomerPortalToken)
- `emails/portal-invite.tsx` — template Resend para envío del enlace

**Entregables:**
- [ ] Modelo Prisma `CustomerPortalToken`: `id`, `customerId`, `tenantId`, `token` (UUID v4 único), `expiresAt`, `lastAccessAt`, `createdAt`
- [ ] Migration de Prisma + `npx prisma generate`
- [ ] API `POST /api/portal/token/generate` — recibe `customerId`, genera token UUID, persiste en DB con expiración de 30 días, envía email via Resend con el enlace
- [ ] API `GET /api/portal/[token]` — valida que el token exista y no esté expirado, actualiza `lastAccessAt`, retorna datos del cliente + sus facturas con estatus
- [ ] Página `/portal/[token]` — layout público sin sidebar, muestra: nombre del cliente, resumen de cuenta (total facturado, saldo pendiente), tabla de facturas con estatus y botones de acción
- [ ] Página `/portal/[token]/invoice/[id]` — detalle de factura: conceptos, subtotal, IVA, total, estatus de pago, botón "Descargar PDF", botón "Descargar XML"
- [ ] Si el token no existe o está expirado → página de error amigable con mensaje de contacto al tenant
- [ ] Botón "Copiar enlace portal" y "Reenviar por email" en la vista de cliente (`/crm/clientes/[id]`)
- [ ] Template email Resend `portal-invite.tsx` — diseño profesional con logo del tenant, saludo al cliente, botón CTA al portal
- [ ] Los tokens se pueden revocar manualmente desde la vista del cliente en el ERP

**Dependencias:** FASE 13 (Invoice model y generación de PDF), FASE 24 (@react-pdf/renderer para descarga de PDF)

**Estimado:** M (2–3 días)

---

### FASE 28 — BI Dashboard Real (Conectar a Prisma)

**Objetivo:** Reemplazar todos los arrays mock en `/bi` con datos reales obtenidos desde la base de datos del tenant via API routes dedicadas.

**Valor al negocio:** Convierte el BI Dashboard en una herramienta real de toma de decisiones, el diferenciador principal de CIFRA frente a ERPs que solo muestran listas de registros.

**Módulos afectados:**
- `app/(dashboard)/bi/page.tsx` — reemplazar `useState([])` mock con fetches reales
- `app/api/bi/summary/route.ts` — KPIs principales del tenant
- `app/api/bi/revenue/route.ts` — ingresos vs egresos mes a mes
- `app/api/bi/products/route.ts` — top productos por venta
- `app/api/bi/crm/route.ts` — funnel CRM por etapa del pipeline
- `app/api/bi/cashflow/route.ts` — flujo de caja proyectado

**Entregables:**
- [ ] `GET /api/bi/summary` — retorna: facturas emitidas en el mes, monto total facturado, cobros pendientes, gastos del mes (PettyCash + Finanzas), empleados activos
- [ ] `GET /api/bi/revenue?months=6` — agrega `JournalEntry` por tipo (INGRESO/EGRESO) y mes, retorna array `[{ month: "2026-01", ingreso: 0, egreso: 0 }]` para Recharts BarChart
- [ ] `GET /api/bi/products?limit=10` — agrupa `InvoiceItem` por `productId`, suma cantidades y montos totales, retorna top N con nombre de producto
- [ ] `GET /api/bi/crm` — cuenta `Deal` agrupados por `PipelineColumn.title` y orden, retorna data para funnel chart
- [ ] `GET /api/bi/cashflow` — proyección: saldo actual en cuentas + facturas con `dueDate` en próximos 30 días agrupadas por semana
- [ ] Reemplazar todos los `useState([])` mock en `/bi/page.tsx` con `useEffect` + `fetch` o `useSWR`
- [ ] Skeletons de carga mientras los endpoints responden (Suspense o estado `loading`)
- [ ] Empty states descriptivos con call-to-action cuando no hay datos (ej. "Emite tu primera factura para ver el reporte")
- [ ] KPI cards en la parte superior: Facturación del mes, Cobros pendientes, Gastos operativos, Deals activos
- [ ] Gráfica de barras agrupadas: Ingresos vs Egresos de los últimos 6 meses (Recharts `BarChart`)
- [ ] Gráfica de línea: Proyección de flujo de caja próximas 4 semanas (Recharts `LineChart`)
- [ ] Gráfica de dona: Top 5 productos por monto vendido (Recharts `PieChart`)
- [ ] Gráfica de embudo: Pipeline CRM por etapa con conteo de deals y valor total

**Dependencias:** FASE 13 (Invoice, InvoiceItem), FASE 16 (JournalEntry), FASE 18 (Deal, PipelineColumn)

**Estimado:** M (2–3 días)

---

### FASE 29 — Módulo POS Completo

**Objetivo:** Construir la interfaz completa del punto de venta a partir del stub actual de 5 líneas, con flujo de cobro end-to-end, múltiples formas de pago y generación automática de borrador de factura.

**Valor al negocio:** POS es el módulo de mayor uso diario en negocios de retail y restaurantes — completarlo desbloquea el segmento de clientes con operación física, que representa la mayoría de las PyMEs mexicanas.

**Módulos afectados:**
- `app/(dashboard)/pos/page.tsx` — reemplazar stub con UI completa
- `app/(dashboard)/pos/components/ProductSearch.tsx`
- `app/(dashboard)/pos/components/Cart.tsx`
- `app/(dashboard)/pos/components/PaymentModal.tsx`
- `app/(dashboard)/pos/components/TicketPDF.tsx`
- `app/(dashboard)/pos/components/OrderHistory.tsx`
- `app/api/pos/orders/route.ts` — POST crear orden
- `app/api/pos/orders/[id]/route.ts` — GET detalle, PATCH actualizar estatus

**Entregables:**
- [ ] Layout POS de dos paneles: panel izquierdo = búsqueda + grid de productos, panel derecho = carrito activo y totales
- [ ] Componente `ProductSearch` — input con debounce de 300ms, busca por nombre, SKU o código de barras, muestra resultados como tarjetas con imagen, nombre y precio
- [ ] Componente `Cart` — lista de ítems con cantidad editable (botones +/-), precio unitario, subtotal por línea, campo de descuento opcional por ítem, totales: subtotal + IVA 16% + total a cobrar
- [ ] Componente `PaymentModal` — selector de forma de pago con tres opciones:
  - Efectivo: campo "Monto recibido" → calcula y muestra cambio automáticamente
  - Tarjeta: campo de referencia/últimos 4 dígitos
  - Transferencia: campo CLABE / referencia bancaria
- [ ] Al confirmar pago: `POST /api/pos/orders` crea `PosOrder` + `PosOrderItem[]` en DB con `status: COMPLETED`
- [ ] Al cerrar venta: crear automáticamente `Invoice` en `status: DRAFT` asociada al `posOrderId` (integración POS ↔ CFDI de FASE 14)
- [ ] Descuento `StockMovement` tipo `OUT` de cada producto vendido (si el módulo SCM está activo para el tenant)
- [ ] Componente `TicketPDF` — ticket de compra usando `@react-pdf/renderer` con: logo del tenant, folio de orden, fecha y hora, lista de ítems, subtotal, IVA, total, forma de pago, cambio entregado
- [ ] Botones post-venta: "Imprimir Ticket", "Descargar PDF", "Nueva Venta"
- [ ] Componente `OrderHistory` — historial de órdenes del día con totales por forma de pago (cierre de caja diario)
- [ ] Validación: si el producto no tiene stock suficiente y el tenant tiene SCM activo → mostrar advertencia antes de confirmar
- [ ] Soporte para cliente anónimo (venta sin RFC) y cliente registrado (búsqueda por nombre/RFC del modelo `Customer`)

**Dependencias:** FASE 17 (StockMovement, Product, Warehouse), FASE 13 (Invoice model), FASE 24 (@react-pdf/renderer instalado y con ejemplos)

**Estimado:** L (1 semana)

---

### FASE 30 — Módulo Calendario / Citas Completo

**Objetivo:** Construir un calendario empresarial completo a partir del stub de 40 líneas, con tres vistas de tiempo y eventos automáticos generados desde el ERP.

**Valor al negocio:** Centraliza la agenda del negocio y hace visibles los vencimientos de facturas y entregas pendientes, reduciendo el olvido de compromisos y mejorando la gestión del tiempo del equipo.

**Módulos afectados:**
- `app/(dashboard)/citas/page.tsx` — reemplazar stub con UI completa
- `app/(dashboard)/citas/components/CalendarView.tsx`
- `app/(dashboard)/citas/components/EventModal.tsx`
- `app/(dashboard)/citas/components/DayView.tsx`
- `app/(dashboard)/citas/components/WeekView.tsx`
- `app/(dashboard)/citas/components/MonthView.tsx`
- `app/api/calendar/events/route.ts` — GET lista, POST crear
- `app/api/calendar/events/[id]/route.ts` — PATCH actualizar, DELETE eliminar
- `prisma/schema.prisma` (modelo CalendarEvent)

**Entregables:**
- [ ] Modelo Prisma `CalendarEvent`: `id`, `tenantId`, `userId`, `title`, `description`, `start` (DateTime), `end` (DateTime), `type` (enum), `relatedId` (nullable, FK a Invoice/Deal/etc.), `color` (hex), `allDay` (boolean), `createdAt`
- [ ] Enum `CalendarEventType`: `CITA_CLIENTE`, `ENTREGA_PEDIDO`, `VENCIMIENTO_FACTURA`, `RECORDATORIO`, `REUNION_INTERNA`, `TAREA`
- [ ] Migration de Prisma + `npx prisma generate`
- [ ] Vista mensual — grid de semanas, eventos coloreados por tipo, indicador de "más eventos" cuando hay overflow en un día
- [ ] Vista semanal — columnas de 7 días con franjas horarias de 30 minutos
- [ ] Vista de día — timeline horario detallado del día seleccionado
- [ ] Toggle entre vistas (Mes / Semana / Día) con botones en la barra superior del calendario
- [ ] Navegación: botones "Anterior" / "Hoy" / "Siguiente" para cambiar el período visible
- [ ] Componente `EventModal` — formulario de creación/edición: título, descripción, fecha y hora de inicio/fin, tipo, color, asignado a (usuario del tenant)
- [ ] API `GET /api/calendar/events?start=&end=` — retorna eventos del rango de fechas + eventos automáticos del ERP:
  - Facturas con `dueDate` en el rango → evento tipo `VENCIMIENTO_FACTURA` (color rojo si vencida, amarillo si próxima a vencer)
  - Deals en etapa de cierre → evento tipo `CITA_CLIENTE` (sugiere seguimiento)
- [ ] API `POST /api/calendar/events` — crea evento manual en DB
- [ ] API `PATCH /api/calendar/events/[id]` — actualiza evento (título, fechas, etc.)
- [ ] API `DELETE /api/calendar/events/[id]` — elimina evento (solo eventos manuales, no los automáticos del ERP)
- [ ] Click en un evento del calendario → abre `EventModal` en modo edición
- [ ] Click en un evento automático de factura → navega a `/finanzas/cobranza/[invoiceId]`
- [ ] Integración con FASE 26: crear notificación automática 24 horas antes de cada evento del calendario

**Dependencias:** FASE 13 (Invoice con dueDate), FASE 18 (Deal, PipelineColumn), FASE 26 (Notificaciones para alertas preventivas)

**Estimado:** L (1 semana)

---

## PRIORIDAD MEDIA — Completar Módulos Existentes

---

### FASE 31 — SCM: Compras y Logística Real

**Objetivo:** Completar el módulo SCM construyendo las secciones de órdenes de compra a proveedores y seguimiento de envíos con datos reales en Prisma y actualización automática del inventario al recibir mercancía.

**Valor al negocio:** Cierra el ciclo de abastecimiento: una orden de compra recibida actualiza automáticamente el inventario, eliminando la entrada manual de stock y reduciendo errores de conteo.

**Módulos afectados:**
- `app/(dashboard)/scm/compras/page.tsx`
- `app/(dashboard)/scm/compras/[id]/page.tsx`
- `app/(dashboard)/scm/logistica/page.tsx`
- `app/api/scm/purchase-orders/route.ts` — GET lista, POST crear
- `app/api/scm/purchase-orders/[id]/route.ts` — GET detalle, PATCH
- `app/api/scm/purchase-orders/[id]/receive/route.ts` — POST recepcionar mercancía
- `app/api/scm/shipments/route.ts` — GET lista, POST crear
- `prisma/schema.prisma` (modelos PurchaseOrder, PurchaseOrderItem, Shipment)

**Entregables:**
- [ ] Modelo `PurchaseOrder`: `id`, `tenantId`, `supplierId` (reutiliza modelo `Customer` con flag `isSupplier`), `folio` (auto-generado), `status` (DRAFT/SENT/PARTIAL/RECEIVED/CANCELLED), `subtotal`, `tax`, `total`, `expectedDate`, `notes`, `createdAt`
- [ ] Modelo `PurchaseOrderItem`: `id`, `purchaseOrderId`, `productId`, `sku`, `description`, `quantity`, `quantityReceived`, `unitPrice`, `subtotal`
- [ ] Modelo `Shipment`: `id`, `tenantId`, `purchaseOrderId` (nullable), `type` (IN/OUT), `carrier`, `trackingNumber`, `status` (PENDING/IN_TRANSIT/DELIVERED/CANCELLED), `originWarehouseId` (nullable), `destWarehouseId` (nullable), `estimatedAt`, `deliveredAt`
- [ ] Migration de Prisma + `npx prisma generate`
- [ ] UI `/scm/compras` — tabla de órdenes de compra con columnas: folio, proveedor, total, estatus, fecha esperada; filtros por estatus
- [ ] Formulario "Nueva Orden de Compra" — selector de proveedor, agregar ítems (producto + cantidad + precio unitario), cálculo automático de subtotal + IVA + total
- [ ] Vista detalle de OC — lista de ítems con cantidades pendientes, botón "Recibir Mercancía"
- [ ] Flujo "Recibir Mercancía" — formulario para ingresar cantidades realmente recibidas por ítem → al guardar crea `StockMovement` tipo `IN` por cada ítem en el almacén destino; actualiza `quantityReceived` y cambia estatus de la OC a PARTIAL o RECEIVED
- [ ] PDF de Orden de Compra usando `@react-pdf/renderer` — con logo tenant, datos del proveedor, tabla de ítems, totales, términos
- [ ] UI `/scm/logistica` — tabla de envíos con tracking, tipo (entrada/salida), carrier, estatus; formulario para crear envío y asociarlo a una OC o transferencia entre almacenes
- [ ] Integración: al marcar `Shipment` como DELIVERED → pregunta si crear StockMovement automático

**Dependencias:** FASE 17 (StockMovement, Warehouse, Product), FASE 24 (@react-pdf/renderer)

**Estimado:** L (1 semana)

---

### FASE 32 — CRM: Marketing y Soporte Real

**Objetivo:** Completar el módulo CRM con campañas de marketing por email y un sistema de tickets de soporte con SLA, hilos de conversación y respuestas automáticas.

**Valor al negocio:** Cierra el ciclo completo del cliente en CRM: desde captación (marketing) hasta retención (soporte post-venta), diferenciando CIFRA de ERPs que solo tienen módulos de ventas.

**Módulos afectados:**
- `app/(dashboard)/crm/marketing/page.tsx`
- `app/(dashboard)/crm/soporte/page.tsx`
- `app/(dashboard)/crm/soporte/[id]/page.tsx`
- `app/api/crm/campaigns/route.ts` — GET, POST
- `app/api/crm/campaigns/[id]/send/route.ts` — POST enviar campaña
- `app/api/crm/tickets/route.ts` — GET lista, POST crear
- `app/api/crm/tickets/[id]/route.ts` — GET detalle, PATCH estatus
- `app/api/crm/tickets/[id]/messages/route.ts` — GET, POST mensajes del hilo
- `prisma/schema.prisma` (modelos Campaign, SupportTicket, SupportMessage)

**Entregables:**
- [ ] Modelo `Campaign`: `id`, `tenantId`, `name`, `type` (EMAIL/SMS/WHATSAPP), `status` (DRAFT/SCHEDULED/SENT/CANCELLED), `subject`, `body` (HTML), `recipientSegment` (JSON con filtros), `recipientCount`, `sentCount`, `scheduledAt`, `sentAt`, `createdBy`
- [ ] Modelo `SupportTicket`: `id`, `tenantId`, `customerId`, `assignedUserId`, `folio` (auto-generado: TKT-0001), `subject`, `status` (OPEN/IN_PROGRESS/WAITING_CUSTOMER/RESOLVED/CLOSED), `priority` (LOW/MEDIUM/HIGH/URGENT), `slaDeadline`, `resolvedAt`, `createdAt`
- [ ] Modelo `SupportMessage`: `id`, `ticketId`, `senderId`, `senderType` (AGENT/CUSTOMER), `body`, `attachmentUrl`, `createdAt`
- [ ] Migration de Prisma + `npx prisma generate`
- [ ] UI `/crm/marketing` — lista de campañas con estatus, métricas de envío (enviados/abiertos), botón "Nueva Campaña"
- [ ] Formulario de campaña — nombre, tipo, asunto, editor de cuerpo HTML básico (textarea con preview), selector de segmento de destinatarios (todos los clientes / filtro por etiqueta)
- [ ] `POST /api/crm/campaigns/[id]/send` — itera sobre los clientes del segmento y envía emails via Resend en lote
- [ ] UI `/crm/soporte` — lista de tickets con filtros por estatus y prioridad, búsqueda por folio o cliente; indicador visual de SLA (verde/amarillo/rojo según tiempo restante vs `slaDeadline`)
- [ ] Vista detalle de ticket `/crm/soporte/[id]` — hilo de mensajes estilo chat, campo de respuesta del agente, selector de cambio de estatus y prioridad, asignación a otro agente
- [ ] Auto-reply automático al crear ticket: email via Resend al cliente con folio y tiempo estimado de respuesta
- [ ] Notificación (FASE 26) tipo `SISTEMA` cuando un ticket nuevo llega sin asignar
- [ ] SLA por defecto: URGENT = 4h, HIGH = 8h, MEDIUM = 24h, LOW = 72h (configurable por tenant en settings)

**Dependencias:** FASE 18 (Customer model del CRM), FASE 26 (Notificaciones para alertas de tickets)

**Estimado:** L (1 semana)

---

### FASE 33 — MRP Real (Manufactura)

**Objetivo:** Construir los módulos de manufactura con Bill of Materials, órdenes de producción con timeline y control de calidad por lotes, conectados a datos reales en Prisma.

**Valor al negocio:** Habilita a empresas manufactureras mexicanas como segmento de clientes premium, diferenciando CIFRA de soluciones contables o comerciales simples que no cubren el ciclo de producción.

**Módulos afectados:**
- `app/(dashboard)/mrp/bom/page.tsx`
- `app/(dashboard)/mrp/bom/[id]/page.tsx`
- `app/(dashboard)/mrp/planificacion/page.tsx`
- `app/(dashboard)/mrp/calidad/page.tsx`
- `app/api/mrp/bom/route.ts` — GET, POST
- `app/api/mrp/production-orders/route.ts` — GET, POST
- `app/api/mrp/production-orders/[id]/complete/route.ts` — POST completar producción
- `app/api/mrp/quality/route.ts` — GET, POST
- `prisma/schema.prisma` (modelos BOM, BOMItem, ProductionOrder, QualityInspection)

**Entregables:**
- [ ] Modelo `BOM` (Bill of Materials): `id`, `tenantId`, `productId` (producto terminado), `version` (string, e.g. "v1.0"), `status` (DRAFT/ACTIVE/OBSOLETE), `notes`, `createdAt`
- [ ] Modelo `BOMItem`: `id`, `bomId`, `componentProductId`, `quantity`, `unit` (PZA/KG/LT/M), `scrapPercent` (desperdicio estimado en %), `notes`
- [ ] Modelo `ProductionOrder`: `id`, `tenantId`, `bomId`, `quantity` (cantidad a producir), `status` (PLANNED/IN_PROGRESS/COMPLETED/CANCELLED), `startDate`, `endDate`, `assignedUserId`, `completedAt`, `notes`
- [ ] Modelo `QualityInspection`: `id`, `tenantId`, `productionOrderId`, `inspectorUserId`, `result` (PASS/FAIL/CONDITIONAL), `nonConformities` (JSON array de strings), `notes`, `inspectedAt`
- [ ] Migration de Prisma + `npx prisma generate`
- [ ] UI `/mrp/bom` — tabla de BOMs activos; formulario para crear/editar BOM con árbol de componentes (agregar componente, cantidad, unidad, % desperdicio)
- [ ] Vista detalle BOM — árbol visual de componentes con cantidades y costos estimados de insumos
- [ ] UI `/mrp/planificacion` — tabla de órdenes de producción con estatus y fechas; formulario "Nueva Orden de Producción" (seleccionar BOM, cantidad, fechas)
- [ ] Vista timeline básica de órdenes de producción (Gantt HTML/CSS sin librería externa — barras proporcionales en una tabla)
- [ ] Al completar una orden de producción (`POST /api/mrp/production-orders/[id]/complete`):
  - Crear `StockMovement` tipo `IN` del producto terminado (cantidad producida)
  - Crear `StockMovement` tipo `OUT` de cada componente del BOM (cantidad x unidades producidas)
- [ ] UI `/mrp/calidad` — lista de inspecciones por orden de producción; formulario de resultado (pass/fail/condicional) con campo de no-conformidades
- [ ] Indicador de calidad en la vista de la orden de producción (sin inspección / aprobada / rechazada)

**Dependencias:** FASE 17 (StockMovement, Product, Warehouse)

**Estimado:** L (1 semana)

---

### FASE 34 — RRHH: Asistencia, Documentos y Cultura

**Objetivo:** Completar las secciones pendientes de RRHH construyendo un reloj checador de asistencia, gestión documental de empleados con Supabase Storage y encuestas de clima laboral con NPS.

**Valor al negocio:** Convierte el módulo RRHH en una solución completa de capital humano, habilitando a CIFRA a competir con herramientas especializadas de RR.HH. y reduciendo el uso de Excel para control de asistencia.

**Módulos afectados:**
- `app/(dashboard)/rrhh/asistencia/page.tsx` — vista del reloj checador
- `app/(dashboard)/rrhh/documentos/page.tsx`
- `app/(dashboard)/rrhh/cultura/page.tsx`
- `app/api/rrhh/attendance/route.ts` — GET lista, POST registrar entrada/salida
- `app/api/rrhh/documents/route.ts` — GET lista, POST subir, DELETE
- `app/api/rrhh/surveys/route.ts` — GET lista, POST crear encuesta
- `app/api/rrhh/surveys/[id]/respond/route.ts` — POST responder encuesta
- `prisma/schema.prisma` (modelos EmployeeDocument, ClimateSurvey, SurveyResponse)

**Entregables:**
- [ ] Modelo `EmployeeDocument`: `id`, `employeeId`, `tenantId`, `type` (enum: CONTRATO/CREDENCIAL_IMSS/CONSTANCIA_SITUACION_FISCAL/ACTA_NACIMIENTO/OTRO), `name`, `fileUrl` (URL en Supabase Storage), `expiresAt` (nullable), `uploadedBy`, `createdAt`
- [ ] Modelo `ClimateSurvey`: `id`, `tenantId`, `title`, `description`, `status` (DRAFT/ACTIVE/CLOSED), `questions` (JSON array: `[{ id, text, type: NPS|OPEN|MULTIPLE }]`), `closesAt`, `createdAt`
- [ ] Modelo `SurveyResponse`: `id`, `surveyId`, `employeeId`, `answers` (JSON: `{ questionId: value }`), `npsScore` (1-10 promedio), `createdAt`
- [ ] Migration de Prisma + `npx prisma generate`
- [ ] UI `/rrhh/asistencia` — tabla del mes por empleado (columnas = días, filas = empleados), con indicadores: verde (a tiempo), amarillo (tardanza), rojo (falta); botón "Registrar Entrada/Salida" para el usuario actual (usa modelo `Attendance` existente)
- [ ] Reporte de asistencia mensual exportable a PDF/Excel (reutilizar FASE 24)
- [ ] UI `/rrhh/documentos` — tabla de documentos por empleado, filtro por tipo, indicador de vencimiento próximo (< 30 días = amarillo, vencido = rojo)
- [ ] Upload de documentos a Supabase Storage (`/tenants/{tenantId}/employees/{employeeId}/{filename}`) con validación de tipo de archivo (PDF, JPG, PNG) y tamaño máximo (5MB)
- [ ] Botón descarga y vista previa del documento
- [ ] Notificación (FASE 26) automática cuando un documento de empleado vence en los próximos 7 días
- [ ] UI `/rrhh/cultura` — lista de encuestas activas y cerradas; formulario de creación con tipos de pregunta (NPS 1-10, respuesta abierta, opción múltiple)
- [ ] Envío de encuesta por email a todos los empleados del tenant via Resend
- [ ] Vista de resultados de encuesta cerrada: NPS promedio, distribución de respuestas, respuestas abiertas (lista anónima)

**Dependencias:** FASE 15 (Employee, Attendance model), FASE 26 (Notificaciones para documentos por vencer)

**Estimado:** L (1 semana)

---

## PRIORIDAD BAJA — Crecimiento y Escalabilidad

---

### FASE 35 — Multi-idioma (i18n)

**Objetivo:** Implementar soporte completo de internacionalización para Español e Inglés en toda la aplicación usando la librería `next-intl`.

**Valor al negocio:** Abre el mercado latinoamericano y permite onboarding de empresas con operación mixta México-USA, ampliando el TAM de CIFRA sin cambios de infraestructura.

**Módulos afectados:**
- `messages/es.json` — todos los strings de UI en español
- `messages/en.json` — traducción al inglés
- `middleware.ts` — detección y redireccionamiento de locale
- `app/[locale]/layout.tsx` — wrapper con `NextIntlClientProvider`
- `components/layout/Header.tsx` — toggle de idioma (bandera ES/EN)
- `next.config.mjs` — configuración de `next-intl`

**Entregables:**
- [ ] Instalar `next-intl` y configurar plugin en `next.config.mjs`
- [ ] Crear `messages/es.json` con todos los strings actuales del UI: navegación, etiquetas de formulario, mensajes de error, botones, títulos de páginas
- [ ] Crear `messages/en.json` con traducción completa al inglés
- [ ] Configurar `middleware.ts` para detectar el idioma del browser (`Accept-Language`) y redirigir a `/es/...` o `/en/...`
- [ ] Refactorizar `app/layout.tsx` a `app/[locale]/layout.tsx` con `NextIntlClientProvider`
- [ ] Toggle de idioma en el Header — bandera del idioma actual, dropdown ES/EN, guarda preferencia en cookie
- [ ] Migrar módulos principales: dashboard, billing, finanzas, rrhh, crm, pos
- [ ] Templates de email en Resend en ambos idiomas según preferencia del tenant (`tenant.language`)
- [ ] Mensajes de validación de formularios (Zod) internacionalizados

**Dependencias:** Ninguna

**Estimado:** L (1 semana)

---

### FASE 36 — App Móvil PWA

**Objetivo:** Convertir CIFRA en una Progressive Web App instalable en dispositivos móviles con soporte offline para los módulos de POS e Inventario.

**Valor al negocio:** Permite a vendedores y almacenistas operar desde su celular sin conexión a internet, un requisito crítico en México donde la conectividad en bodegas y puntos de venta puede ser intermitente.

**Módulos afectados:**
- `public/manifest.json`
- `public/sw.js` — service worker
- `public/icons/` — íconos PNG en múltiples resoluciones
- `app/layout.tsx` — meta tags PWA
- `app/offline/page.tsx` — página fallback sin conexión
- `app/(dashboard)/pos/page.tsx` — soporte offline con IndexedDB
- `app/(dashboard)/scm/inventarios/page.tsx` — caché offline de stock

**Entregables:**
- [ ] `public/manifest.json` — nombre "CIFRA ERP", `short_name: "CIFRA"`, íconos, `display: "standalone"`, `theme_color`, `background_color`, `start_url: "/dashboard"`
- [ ] Íconos PNG generados desde el logo de CIFRA en resoluciones: 72, 96, 128, 144, 152, 192, 384, 512px
- [ ] `public/sw.js` — service worker con estrategia Cache-First para assets estáticos (JS, CSS, fuentes) y Network-First con fallback offline para rutas de la app
- [ ] Página `app/offline/page.tsx` — pantalla amigable mostrando el logo CIFRA y mensaje "Sin conexión — los datos guardados localmente están disponibles"
- [ ] Meta tags en `app/layout.tsx`: `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `theme-color`, `mobile-web-app-capable`
- [ ] IndexedDB para caché local de: lista de productos (POS), stock actual por almacén (Inventario), usando la librería `idb`
- [ ] Sincronización background (Background Sync API): cuando regresa la conexión, sincroniza las `PosOrder` creadas offline con el servidor
- [ ] Banner "Instalar app" en dispositivos móviles (evento `beforeinstallprompt`), con botón "Instalar CIFRA"
- [ ] Web Push Notifications: endpoint `POST /api/push/subscribe` para guardar suscripción, integrar con FASE 26 para enviar push cuando hay notificaciones nuevas

**Dependencias:** FASE 29 (POS completo para offline mode), FASE 17 (Inventario completo), FASE 26 (Notificaciones para push)

**Estimado:** L (1 semana)

---

### FASE 37 — Integraciones Externas

**Objetivo:** Conectar CIFRA con los servicios externos más relevantes del ecosistema empresarial mexicano: verificación de CFDIs con el SAT, validación bancaria y envío de mensajes via WhatsApp Business API.

**Valor al negocio:** Las integraciones eliminan trabajo duplicado — la conciliación bancaria automática y la verificación de CFDIs son los procesos manuales más costosos en tiempo para los contadores de PyMEs mexicanas.

**Módulos afectados:**
- `lib/integrations/sat.ts` — cliente del webservice SAT
- `lib/integrations/bank.ts` — validación CLABE y parseo de estados de cuenta
- `lib/integrations/whatsapp.ts` — cliente de Meta Cloud API
- `app/api/integrations/sat/verify/route.ts`
- `app/api/integrations/bank/reconcile/route.ts`
- `app/api/integrations/whatsapp/send/route.ts`
- `app/(dashboard)/settings/integraciones/page.tsx`

**Entregables:**
- [ ] **SAT — Verificación de CFDI:** cliente del webservice SOAP del SAT (`ConsultaCFDIService`) para verificar estatus de un UUID; exponer en `GET /api/integrations/sat/verify?uuid=`; mostrar ícono de estatus en la tabla de facturas (vigente / cancelado / no encontrado)
- [ ] **SAT — Validación de RFC:** función `validateRFC(rfc: string)` que valida el formato del RFC mexicano (estructura, longitud, dígito verificador); integrar en el formulario de creación de cliente e factura
- [ ] **Bancos — Validación CLABE:** función `validateCLABE(clabe: string)` que verifica el dígito verificador del código CLABE de 18 dígitos según el algoritmo oficial de Banxico; integrar en el módulo de cobranza
- [ ] **Bancos — Conciliación bancaria:** parseo de archivos CSV/OFX estándar de bancos mexicanos; cruce automático de movimientos bancarios con `JournalEntry` existentes por importe y fecha (tolerancia ±1 día); UI de revisión de conciliación con match manual
- [ ] **WhatsApp Business API:** integración con Meta Cloud API (WABA); función `sendWhatsAppMessage(phone, templateName, params[])` para enviar templates aprobados
- [ ] Envío automático de factura por WhatsApp al cambiar `Invoice.status` a `SENT` (si el cliente tiene `whatsappPhone` configurado)
- [ ] Envío de recordatorio de cobro por WhatsApp para facturas vencidas (integrar con FASE 26 o como job programado)
- [ ] UI `/settings/integraciones` — panel con estado de cada integración (conectada/desconectada/error), configuración de credenciales por tenant (almacenadas encriptadas), logs de última actividad

**Dependencias:** FASE 13 (Invoice), FASE 16 (JournalEntry para conciliación)

**Estimado:** XL (estimado por integración: SAT = M, Bancos = L, WhatsApp = M; total ~2 semanas)

---

### FASE 38 — AI Copilot (CIFRA IA)

**Objetivo:** Integrar un asistente de inteligencia artificial contextual al negocio del tenant, accesible como widget flotante en todas las páginas del ERP, que responde preguntas en lenguaje natural sobre los datos del negocio.

**Valor al negocio:** Diferenciador de producto de alto impacto — un ERP que responde en lenguaje natural preguntas como "¿Cuánto facturé este trimestre?" o "¿Qué productos están por agotarse?" reduce la necesidad de navegar múltiples módulos y democratiza el análisis de datos.

**Módulos afectados:**
- `components/ai/CopilotWidget.tsx` — widget flotante
- `components/ai/CopilotChat.tsx` — interfaz de chat con streaming
- `app/api/ai/chat/route.ts` — proxy a Claude API con contexto del tenant
- `app/api/ai/context/route.ts` — construcción del contexto RAG
- `lib/ai/context-builder.ts` — recopila datos del tenant para el contexto
- `app/layout.tsx` — montar `CopilotWidget` en todas las páginas autenticadas

**Entregables:**
- [ ] Widget flotante en esquina inferior derecha de todas las páginas autenticadas — ícono "CIFRA IA", expandible a panel de chat de 400px x 500px
- [ ] Componente `CopilotChat` — historial de la sesión, input de texto, botón enviar, indicador de "escribiendo..."
- [ ] `GET /api/ai/context` — recopila datos recientes del tenant para contexto RAG: últimas 10 facturas (folio, cliente, monto, estatus), top 5 productos por venta del mes, stock bajo de productos, KPIs del mes (total facturado, cobros pendientes, gastos), employees activos, deals activos por etapa
- [ ] `POST /api/ai/chat` — recibe `{ message, history[] }` + contexto del tenant, construye el prompt con los datos del negocio, llama a `claude-sonnet-4-6` via `@anthropic-ai/sdk` con streaming
- [ ] Streaming de respuesta con `ReadableStream` + `text/event-stream` para efecto de escritura progresiva en la UI
- [ ] Preguntas sugeridas al abrir el chat por primera vez: "¿Cuánto facturé este mes?", "¿Qué productos están por agotarse?", "¿Cuál es mi cliente con más ventas?", "¿Cuánto debo cobrar?"
- [ ] Respuestas con formato Markdown renderizado (usando `react-markdown`): tablas, listas, negritas
- [ ] Límite de consultas por plan de suscripción: BÁSICO = 50/mes, PRO = ilimitado (verificar contra `Subscription`)
- [ ] Contador visible de consultas restantes en el widget para plan BÁSICO
- [ ] Integración con `AuditLog`: registrar cada consulta AI con `action: "AI_QUERY"`, `details: { prompt, responseTokens }`

**Dependencias:** FASE 28 (BI con datos reales para contexto), FASE 25 (RBAC y plan de suscripción)

**Estimado:** L (1 semana)

---

### FASE 39 — Marketplace de Integraciones

**Objetivo:** Crear un panel de conectores de terceros donde los tenants puedan activar y configurar integraciones con software contable, e-commerce y marketplaces populares en México desde la interfaz del ERP.

**Valor al negocio:** Las integraciones con CONTPAQi, Shopify y MercadoLibre son los conectores más solicitados por PyMEs mexicanas y representan el argumento de venta más frecuente para el upgrade al plan Enterprise.

**Módulos afectados:**
- `app/(dashboard)/settings/integraciones/page.tsx`
- `app/api/integrations/contpaqi/route.ts`
- `app/api/integrations/shopify/webhook/route.ts`
- `app/api/integrations/mercadolibre/route.ts`
- `app/api/integrations/mercadolibre/callback/route.ts` (OAuth)
- `lib/integrations/shopify.ts`
- `lib/integrations/mercadolibre.ts`
- `prisma/schema.prisma` (modelo IntegrationConfig)

**Entregables:**
- [ ] Modelo `IntegrationConfig`: `id`, `tenantId`, `type` (enum: CONTPAQI/SAP_B1/SHOPIFY/WOOCOMMERCE/MERCADOLIBRE/WHATSAPP), `status` (ACTIVE/INACTIVE/ERROR/PENDING_AUTH), `config` (JSON encriptado con credenciales/tokens), `lastSyncAt`, `lastError`, `createdAt`
- [ ] Migration de Prisma + `npx prisma generate`
- [ ] UI `/settings/integraciones` — grid de tarjetas por conector disponible; cada tarjeta muestra: logo, nombre, descripción breve, estatus (conectado/desconectado), botón "Conectar" o "Configurar"; sección de logs de última sincronización
- [ ] **CONTPAQi:** exportación de asientos contables (`JournalEntry`) en formato XML compatible con CONTPAQi Nube; botón "Exportar a CONTPAQi" en el módulo de contabilidad
- [ ] **Shopify:** OAuth flow para conectar tienda Shopify; sincronización de productos CIFRA → Shopify (`Product.name`, `price`, `sku`, stock); webhook para importar pedidos Shopify → `PosOrder` en CIFRA
- [ ] **WooCommerce:** igual que Shopify pero via REST API Basic Auth de WooCommerce; sincronización bidireccional de productos e importación de pedidos
- [ ] **MercadoLibre:** OAuth2 con ML (`/api/integrations/mercadolibre/callback`); importar pedidos ML como `PosOrder`; sincronizar stock desde `StockMovement` hacia las publicaciones de ML
- [ ] Logs de sincronización por integración — últimas 20 operaciones con timestamp, tipo de operación, registros procesados, errores
- [ ] Webhooks entrantes: Shopify y ML notifican en tiempo real → procesar en rutas dedicadas con validación de firma
- [ ] Job de sincronización periódica configurable por el tenant (cada hora, cada día)

**Dependencias:** FASE 17 (SCM Inventario), FASE 29 (POS), FASE 25 (RBAC — solo ADMIN puede configurar integraciones)

**Estimado:** XL (2–3 semanas)

---

### FASE 40 — Enterprise: Multi-empresa Consolidada

**Objetivo:** Permitir que un usuario administre múltiples empresas (tenants) desde una sola sesión del ERP, con cambio de contexto instantáneo y reportes financieros consolidados entre empresas del mismo grupo.

**Valor al negocio:** Desbloquea el segmento enterprise de holdings y grupos empresariales mexicanos que manejan múltiples razones sociales, permitiendo a CIFRA cobrar suscripciones consolidadas de mayor valor.

**Módulos afectados:**
- `app/(dashboard)/layout.tsx` — selector de empresa en header
- `app/(dashboard)/enterprise/page.tsx` — panel de holding
- `app/(dashboard)/enterprise/reports/page.tsx` — reportes consolidados
- `app/api/enterprise/tenants/route.ts` — tenants del usuario autenticado
- `app/api/enterprise/switch/route.ts` — cambio de tenant activo
- `app/api/enterprise/reports/consolidated/route.ts` — KPIs cross-tenant
- `app/api/enterprise/invite/route.ts` — invitar usuario a un tenant
- `prisma/schema.prisma` (modelos EnterpriseGroup, UserTenantMembership)

**Entregables:**
- [ ] Modelo `EnterpriseGroup`: `id`, `name`, `ownerUserId`, `createdAt`
- [ ] Modelo `UserTenantMembership` (tabla puente muchos-a-muchos User ↔ Tenant): `id`, `userId`, `tenantId`, `role` (reutiliza enum de FASE 25), `enterpriseGroupId` (nullable), `invitedBy`, `joinedAt`, `createdAt`
- [ ] Migration de Prisma + `npx prisma generate`
- [ ] Selector de empresa en el Header — dropdown que muestra todas las empresas a las que pertenece el usuario, con indicador de la empresa activa (nombre + RFC)
- [ ] `POST /api/enterprise/switch` — cambia el `tenantId` activo en la sesión del usuario (actualiza cookie/JWT claim) sin logout; redirige al dashboard de la nueva empresa
- [ ] Middleware: verificar en cada request que el `tenantId` de la sesión pertenece al `userId` autenticado via `UserTenantMembership`
- [ ] UI `/enterprise` — panel de holding con KPIs de todas las empresas del grupo en tarjetas: nombre, facturación del mes, empleados, deuda pendiente; botón "Agregar empresa al grupo"
- [ ] `GET /api/enterprise/reports/consolidated` — suma `JournalEntry` INGRESO/EGRESO de todos los tenants del grupo por mes; retorna array para Recharts
- [ ] Reporte consolidado `/enterprise/reports` — gráfica de ingresos totales del grupo, tabla comparativa por empresa, descarga PDF del reporte consolidado
- [ ] `POST /api/enterprise/invite` — envía email via Resend a un usuario para unirse a un tenant con un rol específico; genera token de invitación con expiración de 7 días
- [ ] Página de aceptación de invitación `/invite/[token]` — valida token, muestra nombre de la empresa invitante, botón "Aceptar" que crea el `UserTenantMembership`
- [ ] Permisos granulares: un usuario puede ser `ADMIN` en empresa A y `OPERATIVE` en empresa B (el rol viene del `UserTenantMembership`, no del `User`)
- [ ] Facturación Stripe consolidada: opción de que una sola suscripción cubra múltiples tenants del mismo `EnterpriseGroup` con precio por empresa adicional

**Dependencias:** FASE 25 (RBAC — modelo de roles), FASE 22 (Stripe — suscripciones), FASE 28 (BI con datos reales para reportes)

**Estimado:** XL (2–3 semanas)

---

## Resumen del Roadmap

| Fase | Nombre | Prioridad | Estimado | Estado |
|------|--------|-----------|----------|--------|
| 26 | Sistema de Notificaciones | Alta | M | Pendiente |
| 27 | Portal del Cliente | Alta | M | Pendiente |
| 28 | BI Dashboard Real | Alta | M | Pendiente |
| 29 | POS Completo | Alta | L | Pendiente |
| 30 | Calendario / Citas | Alta | L | Pendiente |
| 31 | SCM: Compras + Logística | Media | L | Pendiente |
| 32 | CRM: Marketing + Soporte | Media | L | Pendiente |
| 33 | MRP Real (Manufactura) | Media | L | Pendiente |
| 34 | RRHH: Asistencia + Docs + Cultura | Media | L | Pendiente |
| 35 | Multi-idioma (i18n) | Baja | L | Pendiente |
| 36 | App Móvil PWA | Baja | L | Pendiente |
| 37 | Integraciones Externas | Baja | XL | Pendiente |
| 38 | AI Copilot (CIFRA IA) | Baja | L | Pendiente |
| 39 | Marketplace de Integraciones | Baja | XL | Pendiente |
| 40 | Enterprise Multi-empresa | Baja | XL | Pendiente |

**Leyenda de estimados:**
- S = 1 día
- M = 2–3 días
- L = 1 semana
- XL = 2–3 semanas

---

## Convenciones del Proyecto

### Estructura de archivos
```
app/
  (dashboard)/[modulo]/page.tsx           — Página principal del módulo
  (dashboard)/[modulo]/[sub]/page.tsx     — Subpágina del módulo
  (dashboard)/[modulo]/components/        — Componentes exclusivos del módulo
  api/[modulo]/route.ts                   — API route principal del módulo
  api/[modulo]/[id]/route.ts              — API route de recurso individual
lib/
  [modulo].ts                             — Lógica de negocio reutilizable
  integrations/[servicio].ts             — Clientes de servicios externos
prisma/
  schema.prisma                          — Fuente de verdad del esquema de DB
messages/
  es.json                                — Strings UI en español (FASE 35+)
  en.json                                — Strings UI en inglés (FASE 35+)
```

### Patrones de código
- **Server Components** por defecto; usar `"use client"` solo donde se necesite interactividad (formularios, estado local, efectos)
- **Server Actions** para mutaciones simples de formulario; **API routes** para endpoints complejos, webhooks externos o cuando se requiere streaming
- **Prisma** para todo acceso a DB — nunca SQL raw salvo en migraciones con `$executeRaw`
- **Zod** para validación de inputs en todas las API routes antes de tocar la DB
- **Supabase Auth** para autenticación — nunca implementar auth propio
- Todo acceso a datos debe filtrar por `tenantId` del usuario autenticado — es la barrera de aislamiento multi-tenant
- Los errores de API deben retornar `{ error: string }` con el código HTTP apropiado (400, 401, 403, 404, 500)
- Usar `try/catch` en todas las API routes y loguear errores internos antes de retornar 500

### Migraciones de DB
Siempre que se agregue o modifique un modelo en `prisma/schema.prisma`:
1. `npx prisma migrate dev --name descripcion-del-cambio`
2. `npx prisma generate`
3. Verificar que las políticas RLS de Supabase cubran los nuevos modelos si se accede desde el cliente

### Variables de entorno requeridas
Ver `.env.example` para la lista completa. Las críticas son:
- `DATABASE_URL` — Supabase PostgreSQL (connection pooling via PgBouncer)
- `DIRECT_URL` — Supabase PostgreSQL (conexión directa para migraciones Prisma)
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — solo en server, nunca exponer al cliente
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `RESEND_API_KEY`
- `ANTHROPIC_API_KEY` — requerido desde FASE 38 (AI Copilot)
- `META_WHATSAPP_TOKEN` / `META_PHONE_NUMBER_ID` — requerido desde FASE 37 (WhatsApp)
