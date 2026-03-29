-- FASE 40: Enterprise Multi-empresa — Organization, OrgMember, OrgTenant

CREATE TABLE "Organization" (
    "id"        TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "slug"      TEXT NOT NULL,
    "logoUrl"   TEXT,
    "ownerId"   TEXT NOT NULL,
    "plan"      TEXT NOT NULL DEFAULT 'ENTERPRISE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrgMember" (
    "id"             TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId"         TEXT NOT NULL,
    "role"           TEXT NOT NULL DEFAULT 'VIEWER',
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrgMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrgTenant" (
    "id"             TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "tenantId"       TEXT NOT NULL,
    "alias"          TEXT,
    "order"          INTEGER NOT NULL DEFAULT 0,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrgTenant_pkey" PRIMARY KEY ("id")
);

-- Unique constraints
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_slug_key" UNIQUE ("slug");
ALTER TABLE "OrgMember"    ADD CONSTRAINT "OrgMember_organizationId_userId_key" UNIQUE ("organizationId", "userId");
ALTER TABLE "OrgTenant"    ADD CONSTRAINT "OrgTenant_organizationId_tenantId_key" UNIQUE ("organizationId", "tenantId");

-- Foreign keys
ALTER TABLE "OrgMember" ADD CONSTRAINT "OrgMember_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrgTenant" ADD CONSTRAINT "OrgTenant_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Indexes
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");
CREATE INDEX "Organization_ownerId_idx"    ON "Organization"("ownerId");
CREATE INDEX "OrgMember_organizationId_idx" ON "OrgMember"("organizationId");
CREATE INDEX "OrgMember_userId_idx"         ON "OrgMember"("userId");
CREATE INDEX "OrgTenant_organizationId_idx" ON "OrgTenant"("organizationId");
