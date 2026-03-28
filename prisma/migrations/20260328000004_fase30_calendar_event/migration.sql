-- FASE 30: CalendarEvent
-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id"          TEXT NOT NULL,
    "tenantId"    TEXT NOT NULL,
    "userId"      TEXT,
    "title"       TEXT NOT NULL,
    "description" TEXT,
    "start"       TIMESTAMP(3) NOT NULL,
    "end"         TIMESTAMP(3) NOT NULL,
    "allDay"      BOOLEAN NOT NULL DEFAULT false,
    "type"        TEXT NOT NULL DEFAULT 'MANUAL',
    "color"       TEXT,
    "relatedId"   TEXT,
    "relatedType" TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CalendarEvent_tenantId_start_idx" ON "CalendarEvent"("tenantId", "start");
CREATE INDEX "CalendarEvent_tenantId_type_idx" ON "CalendarEvent"("tenantId", "type");
