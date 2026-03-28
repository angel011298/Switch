-- CreateTable
CREATE TABLE "CustomerPortalToken" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastAccessAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerPortalToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomerPortalToken_token_key" ON "CustomerPortalToken"("token");

-- CreateIndex
CREATE INDEX "CustomerPortalToken_token_idx" ON "CustomerPortalToken"("token");

-- CreateIndex
CREATE INDEX "CustomerPortalToken_customerId_idx" ON "CustomerPortalToken"("customerId");

-- AddForeignKey
ALTER TABLE "CustomerPortalToken" ADD CONSTRAINT "CustomerPortalToken_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
