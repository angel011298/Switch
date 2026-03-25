/*
  Warnings:

  - The `entryType` column on the `JournalEntry` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `sourceType` column on the `JournalEntry` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `endDate` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `egresos` on the `XmlBatch` table. All the data in the column will be lost.
  - You are about to drop the column `errorLog` on the `XmlBatch` table. All the data in the column will be lost.
  - You are about to drop the column `ingresos` on the `XmlBatch` table. All the data in the column will be lost.
  - You are about to drop the column `nominas` on the `XmlBatch` table. All the data in the column will be lost.
  - You are about to drop the column `pagos` on the `XmlBatch` table. All the data in the column will be lost.
  - You are about to drop the column `traslados` on the `XmlBatch` table. All the data in the column will be lost.
  - The `status` column on the `XmlBatch` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "PaymentProofStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "SubscriptionStatus" ADD VALUE 'SUSPENDED';

-- DropIndex
DROP INDEX "JournalEntry_tenantId_entryNumber_key";

-- DropIndex
DROP INDEX "XmlBatch_tenantId_status_idx";

-- AlterTable
ALTER TABLE "JournalEntry" DROP COLUMN "entryType",
ADD COLUMN     "entryType" TEXT NOT NULL DEFAULT 'DIARIO',
DROP COLUMN "sourceType",
ADD COLUMN     "sourceType" TEXT;

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "endDate",
ADD COLUMN     "trialEnds" TIMESTAMP(3),
ADD COLUMN     "validUntil" TIMESTAMP(3),
ALTER COLUMN "planId" SET DEFAULT 'standard';

-- AlterTable
ALTER TABLE "XmlBatch" DROP COLUMN "egresos",
DROP COLUMN "errorLog",
DROP COLUMN "ingresos",
DROP COLUMN "nominas",
DROP COLUMN "pagos",
DROP COLUMN "traslados",
ADD COLUMN     "totalEgresos" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalIngresos" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalNominas" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalPagos" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "totalFiles" DROP DEFAULT,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PROCESSING';

-- DropEnum
DROP TYPE "JournalEntryType";

-- DropEnum
DROP TYPE "JournalSourceType";

-- DropEnum
DROP TYPE "XmlBatchStatus";

-- CreateTable
CREATE TABLE "PaymentProof" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "transferRef" TEXT,
    "concept" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileBase64" TEXT NOT NULL,
    "status" "PaymentProofStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionNote" TEXT,
    "daysGranted" INTEGER,
    "newValidUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentProof_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentProof_tenantId_status_idx" ON "PaymentProof"("tenantId", "status");

-- CreateIndex
CREATE INDEX "PaymentProof_status_createdAt_idx" ON "PaymentProof"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Account_tenantId_parentCode_idx" ON "Account"("tenantId", "parentCode");

-- CreateIndex
CREATE INDEX "JournalEntry_tenantId_entryType_idx" ON "JournalEntry"("tenantId", "entryType");

-- CreateIndex
CREATE INDEX "JournalEntry_tenantId_sourceType_idx" ON "JournalEntry"("tenantId", "sourceType");

-- CreateIndex
CREATE INDEX "XmlBatch_tenantId_createdAt_idx" ON "XmlBatch"("tenantId", "createdAt");

-- AddForeignKey
ALTER TABLE "PaymentProof" ADD CONSTRAINT "PaymentProof_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
