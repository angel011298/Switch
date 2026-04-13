-- ============================================================
-- CIFRA ERP — Row Level Security: Tenant Isolation
-- ============================================================
-- Aplica en todas las tablas que contienen tenantId.
-- La política usa el claim `tenant_id` inyectado en el JWT
-- por el custom_access_token_hook de Supabase Auth.
--
-- IMPORTANTE:
-- • Prisma usa DATABASE_URL con el rol postgres/service_role,
--   que por defecto BYPASS RLS en Supabase. Esta migración es
--   defensa en profundidad (segunda capa).
-- • El service_role bypasses RLS automáticamente en Supabase;
--   no se necesita política de bypass explícita.
-- • Las tablas hijo sin tenantId directo (InvoiceItem, JournalLine,
--   PosOrderItem, etc.) están protegidas por la capa de aplicación.
-- ============================================================

-- ─── Helper: extrae tenant_id del JWT ────────────────────────────────────────
-- Función reutilizable para leer el claim inyectado por el hook.
CREATE OR REPLACE FUNCTION auth.tenant_id()
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    auth.jwt() ->> 'tenant_id',
    ''
  )
$$;

-- ─── Macro para habilitar RLS + crear política en una tabla ──────────────────
-- Se aplica como DO $$ ... END $$ para cada tabla.

-- ============================================================
-- TABLAS CON tenantId DIRECTO
-- ============================================================

-- 1. TenantModule
ALTER TABLE "TenantModule" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "TenantModule";
CREATE POLICY "tenant_isolation" ON "TenantModule"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 2. Subscription
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "Subscription";
CREATE POLICY "tenant_isolation" ON "Subscription"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 3. PaymentProof
ALTER TABLE "PaymentProof" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "PaymentProof";
CREATE POLICY "tenant_isolation" ON "PaymentProof"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 4. TenantMembership
ALTER TABLE "TenantMembership" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "TenantMembership";
CREATE POLICY "tenant_isolation" ON "TenantMembership"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 5. Project
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "Project";
CREATE POLICY "tenant_isolation" ON "Project"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 6. Product
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "Product";
CREATE POLICY "tenant_isolation" ON "Product"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 7. PosOrder
ALTER TABLE "PosOrder" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "PosOrder";
CREATE POLICY "tenant_isolation" ON "PosOrder"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 8. Customer
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "Customer";
CREATE POLICY "tenant_isolation" ON "Customer"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 9. CsdVault
ALTER TABLE "CsdVault" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "CsdVault";
CREATE POLICY "tenant_isolation" ON "CsdVault"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 10. Invoice
ALTER TABLE "Invoice" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "Invoice";
CREATE POLICY "tenant_isolation" ON "Invoice"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 11. Account
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "Account";
CREATE POLICY "tenant_isolation" ON "Account"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 12. JournalEntry
ALTER TABLE "JournalEntry" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "JournalEntry";
CREATE POLICY "tenant_isolation" ON "JournalEntry"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 13. XmlBatch
ALTER TABLE "XmlBatch" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "XmlBatch";
CREATE POLICY "tenant_isolation" ON "XmlBatch"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 14. Employee
ALTER TABLE "Employee" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "Employee";
CREATE POLICY "tenant_isolation" ON "Employee"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 15. PayrollRun
ALTER TABLE "PayrollRun" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "PayrollRun";
CREATE POLICY "tenant_isolation" ON "PayrollRun"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 16. PettyCashFund
ALTER TABLE "PettyCashFund" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "PettyCashFund";
CREATE POLICY "tenant_isolation" ON "PettyCashFund"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 17. Warehouse
ALTER TABLE "Warehouse" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "Warehouse";
CREATE POLICY "tenant_isolation" ON "Warehouse"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 18. StockMovement
ALTER TABLE "StockMovement" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "StockMovement";
CREATE POLICY "tenant_isolation" ON "StockMovement"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 19. PipelineColumn
ALTER TABLE "PipelineColumn" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "PipelineColumn";
CREATE POLICY "tenant_isolation" ON "PipelineColumn"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 20. Deal
ALTER TABLE "Deal" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "Deal";
CREATE POLICY "tenant_isolation" ON "Deal"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 21. AuditLog
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "AuditLog";
CREATE POLICY "tenant_isolation" ON "AuditLog"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 22. Notification
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "Notification";
CREATE POLICY "tenant_isolation" ON "Notification"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 23. CalendarEvent
ALTER TABLE "CalendarEvent" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "CalendarEvent";
CREATE POLICY "tenant_isolation" ON "CalendarEvent"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 24. Supplier
ALTER TABLE "Supplier" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "Supplier";
CREATE POLICY "tenant_isolation" ON "Supplier"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 25. PurchaseOrder
ALTER TABLE "PurchaseOrder" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "PurchaseOrder";
CREATE POLICY "tenant_isolation" ON "PurchaseOrder"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 26. Shipment
ALTER TABLE "Shipment" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "Shipment";
CREATE POLICY "tenant_isolation" ON "Shipment"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 27. Campaign
ALTER TABLE "Campaign" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "Campaign";
CREATE POLICY "tenant_isolation" ON "Campaign"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 28. SupportTicket
ALTER TABLE "SupportTicket" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "SupportTicket";
CREATE POLICY "tenant_isolation" ON "SupportTicket"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 29. BOM
ALTER TABLE "BOM" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "BOM";
CREATE POLICY "tenant_isolation" ON "BOM"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 30. ProductionOrder
ALTER TABLE "ProductionOrder" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "ProductionOrder";
CREATE POLICY "tenant_isolation" ON "ProductionOrder"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 31. EmployeeDocument
ALTER TABLE "EmployeeDocument" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "EmployeeDocument";
CREATE POLICY "tenant_isolation" ON "EmployeeDocument"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 32. LeaveRequest
ALTER TABLE "LeaveRequest" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "LeaveRequest";
CREATE POLICY "tenant_isolation" ON "LeaveRequest"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 33. PerformanceReview
ALTER TABLE "PerformanceReview" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "PerformanceReview";
CREATE POLICY "tenant_isolation" ON "PerformanceReview"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 34. WebhookEndpoint
ALTER TABLE "WebhookEndpoint" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "WebhookEndpoint";
CREATE POLICY "tenant_isolation" ON "WebhookEndpoint"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 35. ApiKey
ALTER TABLE "ApiKey" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "ApiKey";
CREATE POLICY "tenant_isolation" ON "ApiKey"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 36. OrgTenant
ALTER TABLE "OrgTenant" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "OrgTenant";
CREATE POLICY "tenant_isolation" ON "OrgTenant"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 37. WorkShift
ALTER TABLE "WorkShift" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "WorkShift";
CREATE POLICY "tenant_isolation" ON "WorkShift"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 38. CashCut
ALTER TABLE "CashCut" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "CashCut";
CREATE POLICY "tenant_isolation" ON "CashCut"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 39. BankAccount
ALTER TABLE "BankAccount" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "BankAccount";
CREATE POLICY "tenant_isolation" ON "BankAccount"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 40. TreasuryTransaction
ALTER TABLE "TreasuryTransaction" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "TreasuryTransaction";
CREATE POLICY "tenant_isolation" ON "TreasuryTransaction"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 41. CfdiRecibido
ALTER TABLE "CfdiRecibido" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "CfdiRecibido";
CREATE POLICY "tenant_isolation" ON "CfdiRecibido"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 42. ContractSignature
ALTER TABLE "ContractSignature" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "ContractSignature";
CREATE POLICY "tenant_isolation" ON "ContractSignature"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 43. BankConnection
ALTER TABLE "BankConnection" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "BankConnection";
CREATE POLICY "tenant_isolation" ON "BankConnection"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 44. BankTransaction
ALTER TABLE "BankTransaction" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "BankTransaction";
CREATE POLICY "tenant_isolation" ON "BankTransaction"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 45. SatCredential
ALTER TABLE "SatCredential" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "SatCredential";
CREATE POLICY "tenant_isolation" ON "SatCredential"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 46. SatCfdiDownload
ALTER TABLE "SatCfdiDownload" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "SatCfdiDownload";
CREATE POLICY "tenant_isolation" ON "SatCfdiDownload"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 47. DiotRecord
ALTER TABLE "DiotRecord" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "DiotRecord";
CREATE POLICY "tenant_isolation" ON "DiotRecord"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 48. ComplianceAlert
ALTER TABLE "ComplianceAlert" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "ComplianceAlert";
CREATE POLICY "tenant_isolation" ON "ComplianceAlert"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 49. RepseRegistration
ALTER TABLE "RepseRegistration" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "RepseRegistration";
CREATE POLICY "tenant_isolation" ON "RepseRegistration"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 50. RepseContract
ALTER TABLE "RepseContract" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "RepseContract";
CREATE POLICY "tenant_isolation" ON "RepseContract"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 51. Nom035Survey
ALTER TABLE "Nom035Survey" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "Nom035Survey";
CREATE POLICY "tenant_isolation" ON "Nom035Survey"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 52. CashFlowProjection
ALTER TABLE "CashFlowProjection" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "CashFlowProjection";
CREATE POLICY "tenant_isolation" ON "CashFlowProjection"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- 53. CartaPorte
ALTER TABLE "CartaPorte" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "CartaPorte";
CREATE POLICY "tenant_isolation" ON "CartaPorte"
  AS PERMISSIVE FOR ALL TO authenticated
  USING      ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());

-- ============================================================
-- NOTAS
-- ============================================================
-- Tablas SIN tenantId directo (protegidas por la capa de aplicación):
--   InvoiceItem, JournalLine, PosOrderItem, Task, TimeEntry,
--   Attendance, PayrollItem, PettyCashExpense, PettyCashReplenishment,
--   PurchaseOrderItem, SupportMessage, BOMItem, QualityInspection,
--   WebhookDelivery, CustomerPortalToken, OrgMember, RepseIcsoeReport,
--   Nom035Response, EmployeePortalToken, Shipment (verificar)
--
-- Tablas globales sin aislamiento por tenant (por diseño):
--   Tenant, User, TaxRegime, TaxRule, TaxRuleRegime,
--   Rfc69bValidation, MarketingIntegration, AdCampaignLog,
--   AiGeneratedCreative, Organization
-- ============================================================
