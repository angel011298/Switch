-- FASE 33: MRP Real — BOM, ProductionOrder, QualityInspection

CREATE TABLE "BOM" (
    "id"        TEXT NOT NULL,
    "tenantId"  TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "version"   TEXT NOT NULL DEFAULT '1.0',
    "notes"     TEXT,
    "isActive"  BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BOM_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BOMItem" (
    "id"          TEXT NOT NULL,
    "bomId"       TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "quantity"    DECIMAL(14,4) NOT NULL,
    "unit"        TEXT NOT NULL DEFAULT 'pza',
    CONSTRAINT "BOMItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductionOrder" (
    "id"        TEXT NOT NULL,
    "tenantId"  TEXT NOT NULL,
    "bomId"     TEXT NOT NULL,
    "quantity"  DECIMAL(14,4) NOT NULL,
    "status"    TEXT NOT NULL DEFAULT 'PLANNED',
    "startDate" TIMESTAMP(3),
    "endDate"   TIMESTAMP(3),
    "notes"     TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProductionOrder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QualityInspection" (
    "id"                TEXT NOT NULL,
    "productionOrderId" TEXT NOT NULL,
    "result"            TEXT NOT NULL DEFAULT 'PENDING',
    "notes"             TEXT,
    "inspectedAt"       TIMESTAMP(3),
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QualityInspection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BOM_tenantId_productId_version_key" ON "BOM"("tenantId", "productId", "version");
CREATE INDEX "BOM_tenantId_idx" ON "BOM"("tenantId");
CREATE INDEX "BOMItem_bomId_idx" ON "BOMItem"("bomId");
CREATE INDEX "ProductionOrder_tenantId_status_idx" ON "ProductionOrder"("tenantId", "status");
CREATE INDEX "QualityInspection_productionOrderId_idx" ON "QualityInspection"("productionOrderId");

ALTER TABLE "BOM"               ADD CONSTRAINT "BOM_productId_fkey"            FOREIGN KEY ("productId")         REFERENCES "Product"("id")         ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BOMItem"           ADD CONSTRAINT "BOMItem_bomId_fkey"             FOREIGN KEY ("bomId")             REFERENCES "BOM"("id")             ON DELETE CASCADE  ON UPDATE CASCADE;
ALTER TABLE "BOMItem"           ADD CONSTRAINT "BOMItem_componentId_fkey"       FOREIGN KEY ("componentId")       REFERENCES "Product"("id")         ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductionOrder"   ADD CONSTRAINT "ProductionOrder_bomId_fkey"     FOREIGN KEY ("bomId")             REFERENCES "BOM"("id")             ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "QualityInspection" ADD CONSTRAINT "QualityInspection_poId_fkey"    FOREIGN KEY ("productionOrderId") REFERENCES "ProductionOrder"("id") ON DELETE CASCADE  ON UPDATE CASCADE;
