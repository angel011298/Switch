-- FASE 31: SCM Compras + Logística

-- CreateTable Supplier
CREATE TABLE "Supplier" (
    "id"          TEXT NOT NULL,
    "tenantId"    TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "rfc"         TEXT,
    "email"       TEXT,
    "phone"       TEXT,
    "address"     TEXT,
    "contactName" TEXT,
    "isActive"    BOOLEAN NOT NULL DEFAULT true,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable PurchaseOrder
CREATE TABLE "PurchaseOrder" (
    "id"          TEXT NOT NULL,
    "tenantId"    TEXT NOT NULL,
    "supplierId"  TEXT,
    "orderNumber" INTEGER NOT NULL,
    "status"      TEXT NOT NULL DEFAULT 'DRAFT',
    "notes"       TEXT,
    "total"       DECIMAL(14,2) NOT NULL DEFAULT 0,
    "expectedAt"  TIMESTAMP(3),
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable PurchaseOrderItem
CREATE TABLE "PurchaseOrderItem" (
    "id"               TEXT NOT NULL,
    "purchaseOrderId"  TEXT NOT NULL,
    "productId"        TEXT,
    "productName"      TEXT NOT NULL,
    "quantity"         DECIMAL(14,4) NOT NULL,
    "quantityReceived" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "unitCost"         DECIMAL(14,4) NOT NULL,
    "subtotal"         DECIMAL(14,2) NOT NULL,
    CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable Shipment
CREATE TABLE "Shipment" (
    "id"              TEXT NOT NULL,
    "tenantId"        TEXT NOT NULL,
    "purchaseOrderId" TEXT,
    "trackingNumber"  TEXT,
    "carrier"         TEXT,
    "status"          TEXT NOT NULL DEFAULT 'PENDING',
    "origin"          TEXT,
    "destination"     TEXT,
    "estimatedAt"     TIMESTAMP(3),
    "deliveredAt"     TIMESTAMP(3),
    "notes"           TEXT,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- Unique + Indexes
CREATE UNIQUE INDEX "PurchaseOrder_tenantId_orderNumber_key" ON "PurchaseOrder"("tenantId", "orderNumber");
CREATE INDEX "Supplier_tenantId_idx" ON "Supplier"("tenantId");
CREATE INDEX "PurchaseOrder_tenantId_status_idx" ON "PurchaseOrder"("tenantId", "status");
CREATE INDEX "PurchaseOrderItem_purchaseOrderId_idx" ON "PurchaseOrderItem"("purchaseOrderId");
CREATE INDEX "Shipment_tenantId_status_idx" ON "Shipment"("tenantId", "status");
CREATE INDEX "Shipment_purchaseOrderId_idx" ON "Shipment"("purchaseOrderId");

-- FK
ALTER TABLE "PurchaseOrder"     ADD CONSTRAINT "PurchaseOrder_supplierId_fkey"  FOREIGN KEY ("supplierId")     REFERENCES "Supplier"("id")      ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_poId_fkey"    FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE  ON UPDATE CASCADE;
ALTER TABLE "Shipment"          ADD CONSTRAINT "Shipment_purchaseOrderId_fkey"  FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
