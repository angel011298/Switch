'use server';

import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { ModuleKey } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

// ─── Helper: Supabase Admin Client (Service Role) ─────────────────────────────
// Returns null (instead of throwing) if env vars are not set, so Prisma deletion
// can still proceed even when Supabase keys are unavailable.

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

const SUPER_ADMIN_EMAIL = '553angelortiz@gmail.com'

// ─── TOGGLE MÓDULO ────────────────────────────────────────────────────────────

/**
 * Toggle un modulo para un tenant.
 * Solo ejecutable por Super Admins.
 */
export async function toggleTenantModule(
  tenantId: string,
  moduleKey: string,
  activate: boolean
) {
  const session = await getSwitchSession();
  if (!session?.isSuperAdmin) throw new Error('Acceso denegado: se requiere Super Admin');

  const validKeys: string[] = [
    'DASHBOARD', 'CALENDAR', 'BI',
    'HCM', 'PAYROLL', 'TALENT',
    'FINANCE', 'TAXES', 'COLLECTIONS',
    'BILLING_CFDI', 'POS',
    'CRM', 'MARKETING', 'SUPPORT',
    'SCM', 'INVENTORY', 'LOGISTICS',
    'MRP', 'QUALITY', 'PROJECTS',
  ];

  if (!validKeys.includes(moduleKey)) throw new Error(`ModuleKey invalido: ${moduleKey}`);

  await prisma.tenantModule.upsert({
    where:  { tenantId_moduleKey: { tenantId, moduleKey: moduleKey as ModuleKey } },
    update: { isActive: activate },
    create: { tenantId, moduleKey: moduleKey as ModuleKey, isActive: activate },
  });

  revalidatePath('/admin');
  return { success: true, moduleKey, isActive: activate };
}

// ─── ACTIVAR / DESACTIVAR TODOS ───────────────────────────────────────────────

export async function activateAllModules(tenantId: string) {
  const session = await getSwitchSession();
  if (!session?.isSuperAdmin) throw new Error('Acceso denegado: se requiere Super Admin');

  const allKeys: ModuleKey[] = [
    'DASHBOARD', 'CALENDAR', 'BI',
    'HCM', 'PAYROLL', 'TALENT',
    'FINANCE', 'TAXES', 'COLLECTIONS',
    'BILLING_CFDI', 'POS',
    'CRM', 'MARKETING', 'SUPPORT',
    'SCM', 'INVENTORY', 'LOGISTICS',
    'MRP', 'QUALITY', 'PROJECTS',
  ];

  await Promise.all(
    allKeys.map((moduleKey) =>
      prisma.tenantModule.upsert({
        where:  { tenantId_moduleKey: { tenantId, moduleKey } },
        update: { isActive: true },
        create: { tenantId, moduleKey, isActive: true },
      })
    )
  );

  revalidatePath('/admin');
  return { success: true };
}

export async function deactivateAllModules(tenantId: string) {
  const session = await getSwitchSession();
  if (!session?.isSuperAdmin) throw new Error('Acceso denegado: se requiere Super Admin');

  await prisma.tenantModule.updateMany({
    where: { tenantId },
    data:  { isActive: false },
  });

  revalidatePath('/admin');
  return { success: true };
}

// ─── ELIMINAR TENANT DEFINITIVAMENTE ─────────────────────────────────────────

/**
 * Elimina un tenant de forma permanente:
 *  1. Bloquea la eliminación del tenant del Super Admin
 *  2. Elimina los usuarios exclusivos de Supabase Auth (service role, opcional)
 *  3. Borra todos los registros relacionados en Prisma vía una transacción explícita
 *     (más seguro que confiar únicamente en ON DELETE CASCADE del DB)
 *
 * ⚠️ ACCIÓN IRREVERSIBLE — solo Super Admin.
 */
export async function deleteTenant(
  tenantId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await getSwitchSession();
  if (!session?.isSuperAdmin) throw new Error('Acceso denegado: se requiere Super Admin');

  try {
    // 0. Proteger el tenant del Super Admin — nunca se puede eliminar
    const superAdminMembership = await prisma.tenantMembership.findFirst({
      where: { tenantId, user: { email: SUPER_ADMIN_EMAIL } },
    });
    if (superAdminMembership) {
      return { success: false, error: 'El tenant del Super Admin no puede eliminarse.' };
    }

    // 1. Obtener usuarios vinculados a este tenant
    const memberships = await prisma.tenantMembership.findMany({
      where:   { tenantId },
      include: { user: { select: { id: true, email: true } } },
    });
    const tenantUsers = memberships.map(m => m.user);

    // 2. Eliminar de Supabase Auth SOLO usuarios sin otras membresías
    //    (getSupabaseAdmin devuelve null si las env vars no están disponibles)
    const supabaseAdmin = getSupabaseAdmin();
    if (supabaseAdmin && tenantUsers.length > 0) {
      for (const user of tenantUsers) {
        const otherCount = await prisma.tenantMembership.count({
          where: { userId: user.id, NOT: { tenantId } },
        });
        if (otherCount === 0) {
          const { error: deleteErr } = await supabaseAdmin.auth.admin.deleteUser(user.id);
          if (deleteErr) {
            console.warn(`[deleteTenant] Supabase delete skipped for ${user.email}:`, deleteErr.message);
          }
        } else {
          console.info(`[deleteTenant] Keeping ${user.email} — belongs to ${otherCount} other tenant(s).`);
        }
      }
    } else if (!supabaseAdmin) {
      console.warn('[deleteTenant] SUPABASE_SERVICE_ROLE_KEY not set — Supabase Auth users NOT deleted.');
    }

    // 3. Borrar todos los datos del tenant en una transacción explícita.
    //    Los modelos se eliminan en orden hoja→raíz para evitar violaciones
    //    de FK en relaciones sin ON DELETE CASCADE en el DB.
    await prisma.$transaction(async (tx) => {

      // ── PASO A: Leaf-nodes sin tenantId propio ─────────────────────────

      // BOMs → ProductionOrders → QualityInspections (chain: Product→BOM→ProductionOrder→QualityInspection)
      const productIds = await tx.product
        .findMany({ where: { tenantId }, select: { id: true } })
        .then(r => r.map(p => p.id));
      if (productIds.length > 0) {
        const bomIds = await tx.bOM
          .findMany({ where: { productId: { in: productIds } }, select: { id: true } })
          .then(r => r.map(b => b.id));
        if (bomIds.length > 0) {
          // QualityInspection cascade desde ProductionOrder, pero borramos antes para certeza
          await tx.productionOrder.deleteMany({ where: { bomId: { in: bomIds } } });
          // BOMItem.componentId → Product (sin cascade) — borrar antes del product
          await tx.bOMItem.deleteMany({ where: { bomId: { in: bomIds } } });
          await tx.bOM.deleteMany({ where: { id: { in: bomIds } } });
        }
        await tx.stockMovement.deleteMany({ where: { tenantId } });
      }

      // PosOrderItems: PosOrderItem.productId → Product (sin cascade)
      const posOrderIds = await tx.posOrder
        .findMany({ where: { tenantId }, select: { id: true } })
        .then(r => r.map(o => o.id));
      if (posOrderIds.length > 0) {
        await tx.posOrderItem.deleteMany({ where: { orderId: { in: posOrderIds } } });
      }

      // InvoiceItems (cascade desde Invoice, OK)
      const invoiceIds = await tx.invoice
        .findMany({ where: { tenantId }, select: { id: true } })
        .then(r => r.map(i => i.id));
      if (invoiceIds.length > 0) {
        await tx.invoiceItem.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
      }

      // PayrollItems: PayrollItem.employeeId → Employee (sin cascade) — borrar antes de Employee
      const payrollRunIds = await tx.payrollRun
        .findMany({ where: { tenantId }, select: { id: true } })
        .then(r => r.map(p => p.id));
      if (payrollRunIds.length > 0) {
        await tx.payrollItem.deleteMany({ where: { payrollRunId: { in: payrollRunIds } } });
      }

      // Tasks + TimeEntries (cascade desde Project/Task)
      const projectIds = await tx.project
        .findMany({ where: { tenantId }, select: { id: true } })
        .then(r => r.map(p => p.id));
      if (projectIds.length > 0) {
        const taskIds = await tx.task
          .findMany({ where: { projectId: { in: projectIds } }, select: { id: true } })
          .then(r => r.map(t => t.id));
        if (taskIds.length > 0) {
          await tx.timeEntry.deleteMany({ where: { taskId: { in: taskIds } } });
          await tx.task.deleteMany({ where: { id: { in: taskIds } } });
        }
        await tx.timeEntry.deleteMany({ where: { projectId: { in: projectIds } } });
      }

      // JournalLines: JournalLine.accountId → Account (sin cascade) — borrar antes de Account
      const journalEntryIds = await tx.journalEntry
        .findMany({ where: { tenantId }, select: { id: true } })
        .then(r => r.map(j => j.id));
      if (journalEntryIds.length > 0) {
        await tx.journalLine.deleteMany({ where: { journalEntryId: { in: journalEntryIds } } });
      }

      // SupportMessages (cascade desde SupportTicket)
      const supportTicketIds = await tx.supportTicket
        .findMany({ where: { tenantId }, select: { id: true } })
        .then(r => r.map(t => t.id));
      if (supportTicketIds.length > 0) {
        await tx.supportMessage.deleteMany({ where: { ticketId: { in: supportTicketIds } } });
      }

      // PurchaseOrderItems + Shipments → PurchaseOrder → Supplier
      // PurchaseOrder.supplierId → Supplier (sin cascade) — borrar PO antes que Supplier
      const purchaseOrderIds = await tx.purchaseOrder
        .findMany({ where: { tenantId }, select: { id: true } })
        .then(r => r.map(o => o.id));
      if (purchaseOrderIds.length > 0) {
        await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: { in: purchaseOrderIds } } });
        await tx.shipment.deleteMany({ where: { purchaseOrderId: { in: purchaseOrderIds } } });
      }
      // Shipments con tenantId sin purchaseOrderId
      await tx.shipment.deleteMany({ where: { tenantId } });

      // Deals → PipelineColumns
      await tx.deal.deleteMany({ where: { tenantId } });

      // ── PASO B: Modelos con tenantId directo (orden dependencias) ──────

      // Finanzas: JournalEntry antes de Account (JournalLine.accountId → Account)
      await tx.journalEntry.deleteMany({ where: { tenantId } });

      // Nómina: PayrollRun después de PayrollItem (ya borrado arriba)
      await tx.payrollRun.deleteMany({ where: { tenantId } });

      // Productos, órdenes, facturas
      await tx.posOrder.deleteMany({ where: { tenantId } });
      await tx.product.deleteMany({ where: { tenantId } });
      await tx.invoice.deleteMany({ where: { tenantId } });

      // Proyectos
      await tx.project.deleteMany({ where: { tenantId } });

      // CRM
      await tx.pipelineColumn.deleteMany({ where: { tenantId } });
      await tx.supportTicket.deleteMany({ where: { tenantId } });
      await tx.campaign.deleteMany({ where: { tenantId } });

      // SCM: PurchaseOrders antes de Suppliers
      await tx.purchaseOrder.deleteMany({ where: { tenantId } });
      await tx.supplier.deleteMany({ where: { tenantId } });

      // RRHH: Employee después de PayrollItem (ya borrado) y antes de dependencias
      await tx.employee.deleteMany({ where: { tenantId } });

      // Contabilidad: Account después de JournalEntry
      await tx.account.deleteMany({ where: { tenantId } });

      // Resto de modelos
      await tx.customer.deleteMany({ where: { tenantId } });
      await tx.xmlBatch.deleteMany({ where: { tenantId } });
      await tx.pettyCashFund.deleteMany({ where: { tenantId } });
      await tx.warehouse.deleteMany({ where: { tenantId } });
      await tx.calendarEvent.deleteMany({ where: { tenantId } });
      await tx.workShift.deleteMany({ where: { tenantId } });
      await tx.cashCut.deleteMany({ where: { tenantId } });
      await tx.bankAccount.deleteMany({ where: { tenantId } });
      await tx.treasuryTransaction.deleteMany({ where: { tenantId } });
      await tx.cfdiRecibido.deleteMany({ where: { tenantId } });
      await tx.csdVault.deleteMany({ where: { tenantId } });
      await tx.webhookEndpoint.deleteMany({ where: { tenantId } });
      await tx.apiKey.deleteMany({ where: { tenantId } });
      await tx.paymentProof.deleteMany({ where: { tenantId } });
      await tx.subscription.deleteMany({ where: { tenantId } });
      await tx.tenantModule.deleteMany({ where: { tenantId } });
      await tx.tenantMembership.deleteMany({ where: { tenantId } });

      // ── PASO C: El Tenant ──────────────────────────────────────────────
      await tx.tenant.delete({ where: { id: tenantId } });
    }, { timeout: 30000 });

    revalidatePath('/admin');
    return { success: true };
  } catch (error: any) {
    console.error('[deleteTenant] Error:', error);
    return {
      success: false,
      error: error?.message ?? 'Error al eliminar el tenant. Intenta de nuevo.',
    };
  }
}
