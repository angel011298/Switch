-- CreateEnum
CREATE TYPE "PersonType" AS ENUM ('FISICA', 'MORAL');

-- CreateEnum
CREATE TYPE "TaxType" AS ENUM ('IVA', 'ISR', 'IEPS', 'ISH', 'RETENCION_IVA', 'RETENCION_ISR');

-- CreateEnum
CREATE TYPE "OperationType" AS ENUM ('SALE_PRODUCT', 'SALE_SERVICE', 'PURCHASE_PRODUCT', 'PURCHASE_SERVICE', 'PAYROLL', 'LEASE', 'ROYALTY', 'COMMISSION');

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "csdCerUploaded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "csdKeyUploaded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "legalName" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "personType" "PersonType",
ADD COLUMN     "taxRegimeId" TEXT,
ADD COLUMN     "zipCode" TEXT;

-- CreateTable
CREATE TABLE "TaxRegime" (
    "id" TEXT NOT NULL,
    "satCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "personType" "PersonType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxRegime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxRule" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "taxType" "TaxType" NOT NULL,
    "operationType" "OperationType" NOT NULL,
    "rate" DECIMAL(8,6) NOT NULL,
    "isPercentage" BOOLEAN NOT NULL DEFAULT true,
    "isWithholding" BOOLEAN NOT NULL DEFAULT false,
    "emitterPersonType" "PersonType",
    "receiverPersonType" "PersonType",
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxRuleRegime" (
    "id" TEXT NOT NULL,
    "taxRuleId" TEXT NOT NULL,
    "taxRegimeId" TEXT NOT NULL,

    CONSTRAINT "TaxRuleRegime_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaxRegime_satCode_key" ON "TaxRegime"("satCode");

-- CreateIndex
CREATE INDEX "TaxRegime_personType_isActive_idx" ON "TaxRegime"("personType", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "TaxRule_code_key" ON "TaxRule"("code");

-- CreateIndex
CREATE INDEX "TaxRule_taxType_operationType_idx" ON "TaxRule"("taxType", "operationType");

-- CreateIndex
CREATE INDEX "TaxRule_validFrom_validTo_idx" ON "TaxRule"("validFrom", "validTo");

-- CreateIndex
CREATE INDEX "TaxRuleRegime_taxRegimeId_idx" ON "TaxRuleRegime"("taxRegimeId");

-- CreateIndex
CREATE UNIQUE INDEX "TaxRuleRegime_taxRuleId_taxRegimeId_key" ON "TaxRuleRegime"("taxRuleId", "taxRegimeId");

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_taxRegimeId_fkey" FOREIGN KEY ("taxRegimeId") REFERENCES "TaxRegime"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxRuleRegime" ADD CONSTRAINT "TaxRuleRegime_taxRuleId_fkey" FOREIGN KEY ("taxRuleId") REFERENCES "TaxRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxRuleRegime" ADD CONSTRAINT "TaxRuleRegime_taxRegimeId_fkey" FOREIGN KEY ("taxRegimeId") REFERENCES "TaxRegime"("id") ON DELETE CASCADE ON UPDATE CASCADE;
