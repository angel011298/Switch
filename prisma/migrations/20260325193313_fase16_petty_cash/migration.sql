-- CreateTable
CREATE TABLE "PettyCashFund" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Caja Chica',
    "fundAmount" DECIMAL(12,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PettyCashFund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PettyCashExpense" (
    "id" TEXT NOT NULL,
    "fundId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "concept" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'General',
    "receiptRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PettyCashExpense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PettyCashFund_tenantId_idx" ON "PettyCashFund"("tenantId");

-- CreateIndex
CREATE INDEX "PettyCashExpense_fundId_idx" ON "PettyCashExpense"("fundId");

-- CreateIndex
CREATE INDEX "PettyCashExpense_fundId_date_idx" ON "PettyCashExpense"("fundId", "date");

-- AddForeignKey
ALTER TABLE "PettyCashFund" ADD CONSTRAINT "PettyCashFund_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PettyCashExpense" ADD CONSTRAINT "PettyCashExpense_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "PettyCashFund"("id") ON DELETE CASCADE ON UPDATE CASCADE;
