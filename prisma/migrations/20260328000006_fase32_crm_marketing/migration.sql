-- FASE 32: CRM Marketing + Soporte

CREATE TABLE "Campaign" (
    "id"             TEXT NOT NULL,
    "tenantId"       TEXT NOT NULL,
    "name"           TEXT NOT NULL,
    "subject"        TEXT NOT NULL,
    "htmlBody"       TEXT NOT NULL,
    "status"         TEXT NOT NULL DEFAULT 'DRAFT',
    "sentAt"         TIMESTAMP(3),
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "openCount"      INTEGER NOT NULL DEFAULT 0,
    "clickCount"     INTEGER NOT NULL DEFAULT 0,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupportTicket" (
    "id"          TEXT NOT NULL,
    "tenantId"    TEXT NOT NULL,
    "customerId"  TEXT,
    "title"       TEXT NOT NULL,
    "description" TEXT,
    "status"      TEXT NOT NULL DEFAULT 'OPEN',
    "priority"    TEXT NOT NULL DEFAULT 'MEDIUM',
    "assigneeId"  TEXT,
    "resolvedAt"  TIMESTAMP(3),
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupportMessage" (
    "id"         TEXT NOT NULL,
    "ticketId"   TEXT NOT NULL,
    "authorId"   TEXT,
    "authorName" TEXT NOT NULL,
    "body"       TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupportMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Campaign_tenantId_status_idx"       ON "Campaign"("tenantId", "status");
CREATE INDEX "SupportTicket_tenantId_status_idx"  ON "SupportTicket"("tenantId", "status");
CREATE INDEX "SupportTicket_tenantId_priority_idx" ON "SupportTicket"("tenantId", "priority");
CREATE INDEX "SupportMessage_ticketId_idx"        ON "SupportMessage"("ticketId");

ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_ticketId_fkey"
  FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
