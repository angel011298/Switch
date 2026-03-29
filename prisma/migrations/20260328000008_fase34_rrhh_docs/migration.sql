-- FASE 34: RRHH Documentos + Vacaciones + Evaluaciones de Desempeño

CREATE TABLE "EmployeeDocument" (
    "id"         TEXT NOT NULL,
    "tenantId"   TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type"       TEXT NOT NULL,
    "name"       TEXT NOT NULL,
    "fileUrl"    TEXT NOT NULL,
    "fileSize"   INTEGER,
    "mimeType"   TEXT,
    "expiresAt"  TIMESTAMP(3),
    "notes"      TEXT,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LeaveRequest" (
    "id"             TEXT NOT NULL,
    "tenantId"       TEXT NOT NULL,
    "employeeId"     TEXT NOT NULL,
    "type"           TEXT NOT NULL,
    "startDate"      DATE NOT NULL,
    "endDate"        DATE NOT NULL,
    "days"           INTEGER NOT NULL,
    "reason"         TEXT,
    "status"         TEXT NOT NULL DEFAULT 'PENDING',
    "approvedById"   TEXT,
    "approvedAt"     TIMESTAMP(3),
    "rejectedReason" TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PerformanceReview" (
    "id"           TEXT NOT NULL,
    "tenantId"     TEXT NOT NULL,
    "employeeId"   TEXT NOT NULL,
    "period"       TEXT NOT NULL,
    "score"        INTEGER NOT NULL,
    "goals"        TEXT,
    "achievements" TEXT,
    "improvements" TEXT,
    "reviewerName" TEXT,
    "status"       TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerformanceReview_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
ALTER TABLE "EmployeeDocument" ADD CONSTRAINT "EmployeeDocument_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PerformanceReview" ADD CONSTRAINT "PerformanceReview_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Unique
ALTER TABLE "PerformanceReview" ADD CONSTRAINT "PerformanceReview_employeeId_period_key"
    UNIQUE ("employeeId", "period");

-- Indexes
CREATE INDEX "EmployeeDocument_tenantId_idx"   ON "EmployeeDocument"("tenantId");
CREATE INDEX "EmployeeDocument_employeeId_idx" ON "EmployeeDocument"("employeeId");
CREATE INDEX "LeaveRequest_tenantId_idx"        ON "LeaveRequest"("tenantId");
CREATE INDEX "LeaveRequest_employeeId_idx"      ON "LeaveRequest"("employeeId");
CREATE INDEX "LeaveRequest_tenantId_status_idx" ON "LeaveRequest"("tenantId", "status");
CREATE INDEX "PerformanceReview_tenantId_idx"   ON "PerformanceReview"("tenantId");
CREATE INDEX "PerformanceReview_employeeId_idx" ON "PerformanceReview"("employeeId");
