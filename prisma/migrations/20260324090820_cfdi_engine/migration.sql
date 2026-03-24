-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SEALED', 'STAMPED', 'CANCELLED', 'ERROR');

-- CreateEnum
CREATE TYPE "TipoComprobante" AS ENUM ('I', 'E', 'T', 'P', 'N');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('PUE', 'PPD');

-- CreateTable
CREATE TABLE "CsdVault" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "cerDer" BYTEA NOT NULL,
    "keyDer" BYTEA NOT NULL,
    "passwordEnc" TEXT NOT NULL,
    "passwordIv" TEXT NOT NULL,
    "passwordTag" TEXT NOT NULL,
    "noCertificado" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CsdVault_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "serie" TEXT,
    "folio" INTEGER NOT NULL,
    "uuid" TEXT,
    "fechaEmision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipoComprobante" "TipoComprobante" NOT NULL DEFAULT 'I',
    "formaPago" TEXT NOT NULL,
    "metodoPago" "MetodoPago" NOT NULL DEFAULT 'PUE',
    "moneda" TEXT NOT NULL DEFAULT 'MXN',
    "tipoCambio" DECIMAL(10,4),
    "lugarExpedicion" TEXT NOT NULL,
    "exportacion" TEXT NOT NULL DEFAULT '01',
    "condicionesDePago" TEXT,
    "emisorRfc" TEXT NOT NULL,
    "emisorNombre" TEXT NOT NULL,
    "emisorRegimenFiscal" TEXT NOT NULL,
    "receptorRfc" TEXT NOT NULL,
    "receptorNombre" TEXT NOT NULL,
    "receptorDomicilioFiscal" TEXT NOT NULL,
    "receptorRegimenFiscal" TEXT NOT NULL,
    "receptorUsoCfdi" TEXT NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "descuento" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalImpuestosTrasladados" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalImpuestosRetenidos" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "noCertificado" TEXT,
    "certificado" TEXT,
    "sello" TEXT,
    "cadenaOriginal" TEXT,
    "selloSat" TEXT,
    "noCertificadoSat" TEXT,
    "fechaTimbrado" TIMESTAMP(3),
    "rfcProvCertif" TEXT,
    "xmlTimbrado" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "claveProdServ" TEXT NOT NULL,
    "noIdentificacion" TEXT,
    "cantidad" DECIMAL(10,6) NOT NULL,
    "claveUnidad" TEXT NOT NULL,
    "unidad" TEXT,
    "descripcion" TEXT NOT NULL,
    "valorUnitario" DECIMAL(12,6) NOT NULL,
    "importe" DECIMAL(12,2) NOT NULL,
    "descuento" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "objetoImp" TEXT NOT NULL DEFAULT '02',
    "trasladoBase" DECIMAL(12,2),
    "trasladoImpuesto" TEXT,
    "trasladoTipoFactor" TEXT,
    "trasladoTasaOCuota" DECIMAL(8,6),
    "trasladoImporte" DECIMAL(12,2),
    "retencionBase" DECIMAL(12,2),
    "retencionImpuesto" TEXT,
    "retencionTipoFactor" TEXT,
    "retencionTasaOCuota" DECIMAL(8,6),
    "retencionImporte" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CsdVault_tenantId_key" ON "CsdVault"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_uuid_key" ON "Invoice"("uuid");

-- CreateIndex
CREATE INDEX "Invoice_tenantId_status_idx" ON "Invoice"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Invoice_tenantId_fechaEmision_idx" ON "Invoice"("tenantId", "fechaEmision");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_tenantId_serie_folio_key" ON "Invoice"("tenantId", "serie", "folio");

-- CreateIndex
CREATE INDEX "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");

-- AddForeignKey
ALTER TABLE "CsdVault" ADD CONSTRAINT "CsdVault_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
