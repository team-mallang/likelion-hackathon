-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('POLICE_REPORT', 'EMBASSY_OR_CONSULAR', 'INSURANCE', 'RECEIPT', 'OTHER_EVIDENCE');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('ANALYZED', 'NEEDS_REVIEW', 'CONFIRMED');

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'ANALYZED',
    "analysisSummary" TEXT,
    "extractedData" JSONB,
    "missingFields" JSONB,
    "analyzedAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Document_caseId_idx" ON "Document"("caseId");

-- CreateIndex
CREATE INDEX "Document_status_idx" ON "Document"("status");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;
