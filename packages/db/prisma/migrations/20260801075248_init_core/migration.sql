-- CreateEnum
CREATE TYPE "CaseType" AS ENUM ('LOST', 'STOLEN', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('DRAFT', 'USER_REVIEW', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED');

-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "caseNumber" TEXT,
    "passwordHash" TEXT,
    "type" "CaseType" NOT NULL DEFAULT 'UNKNOWN',
    "status" "CaseStatus" NOT NULL DEFAULT 'DRAFT',
    "initialStatement" TEXT NOT NULL,
    "lastSeenAt" TIMESTAMP(3),
    "lastSeenPlace" TEXT,
    "discoveredAt" TIMESTAMP(3),
    "discoveredPlace" TEXT,
    "description" TEXT,
    "aiSummary" TEXT,
    "missingFields" JSONB,
    "retentionUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseItem" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "brand" TEXT,
    "model" TEXT,
    "color" TEXT,
    "description" TEXT,
    "identifyingFeature" TEXT,
    "lastSeenAt" TIMESTAMP(3),
    "lastSeenPlace" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Case_caseNumber_key" ON "Case"("caseNumber");

-- CreateIndex
CREATE INDEX "Case_status_idx" ON "Case"("status");

-- CreateIndex
CREATE INDEX "Case_retentionUntil_idx" ON "Case"("retentionUntil");

-- CreateIndex
CREATE INDEX "CaseItem_caseId_idx" ON "CaseItem"("caseId");

-- AddForeignKey
ALTER TABLE "CaseItem" ADD CONSTRAINT "CaseItem_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;
