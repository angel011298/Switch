-- FASE 37: Integraciones Externas — Webhooks + API Keys

CREATE TABLE "WebhookEndpoint" (
    "id"          TEXT NOT NULL,
    "tenantId"    TEXT NOT NULL,
    "url"         TEXT NOT NULL,
    "secret"      TEXT NOT NULL,
    "events"      TEXT[] NOT NULL DEFAULT '{}',
    "active"      BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookEndpoint_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WebhookDelivery" (
    "id"           TEXT NOT NULL,
    "webhookId"    TEXT NOT NULL,
    "event"        TEXT NOT NULL,
    "payload"      JSONB NOT NULL,
    "statusCode"   INTEGER,
    "responseBody" TEXT,
    "success"      BOOLEAN NOT NULL DEFAULT false,
    "attemptCount" INTEGER NOT NULL DEFAULT 1,
    "deliveredAt"  TIMESTAMP(3),
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApiKey" (
    "id"         TEXT NOT NULL,
    "tenantId"   TEXT NOT NULL,
    "name"       TEXT NOT NULL,
    "keyHash"    TEXT NOT NULL,
    "keyPrefix"  TEXT NOT NULL,
    "scopes"     TEXT[] NOT NULL DEFAULT '{}',
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt"  TIMESTAMP(3),
    "active"     BOOLEAN NOT NULL DEFAULT true,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- Unique constraints
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_keyHash_key" UNIQUE ("keyHash");

-- Foreign keys
ALTER TABLE "WebhookEndpoint" ADD CONSTRAINT "WebhookEndpoint_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_webhookId_fkey"
    FOREIGN KEY ("webhookId") REFERENCES "WebhookEndpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Indexes
CREATE INDEX "WebhookEndpoint_tenantId_idx"        ON "WebhookEndpoint"("tenantId");
CREATE INDEX "WebhookEndpoint_tenantId_active_idx" ON "WebhookEndpoint"("tenantId", "active");
CREATE INDEX "WebhookDelivery_webhookId_idx"        ON "WebhookDelivery"("webhookId");
CREATE INDEX "WebhookDelivery_webhookId_success_idx" ON "WebhookDelivery"("webhookId", "success");
CREATE INDEX "ApiKey_tenantId_idx"                 ON "ApiKey"("tenantId");
CREATE INDEX "ApiKey_keyHash_idx"                  ON "ApiKey"("keyHash");
