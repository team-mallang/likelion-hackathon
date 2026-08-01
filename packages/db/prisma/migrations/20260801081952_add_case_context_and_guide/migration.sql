-- CreateEnum
CREATE TYPE "GuideStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- CreateTable
CREATE TABLE "TravelerContext" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "nationality" TEXT,
    "stayStartAt" TIMESTAMP(3),
    "stayEndAt" TIMESTAMP(3),
    "departureAt" TIMESTAMP(3),
    "accommodationName" TEXT,
    "accommodationEncrypted" TEXT,
    "phoneNumber" TEXT,
    "email" TEXT,
    "passportNumberKnown" BOOLEAN,
    "passportNumberEncrypted" TEXT,
    "passportCopyAvailable" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TravelerContext_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TheftDetail" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "theftWitnessed" BOOLEAN,
    "witnessExists" BOOLEAN,
    "witnessStatement" TEXT,
    "suspectSeen" BOOLEAN,
    "suspectDescription" TEXT,
    "escapeDirection" TEXT,
    "cctvPossible" BOOLEAN,
    "violenceUsed" BOOLEAN,
    "injuryOccurred" BOOLEAN,
    "injuryDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TheftDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuideStep" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "reason" TEXT,
    "preparations" JSONB,
    "institutionName" TEXT,
    "contact" TEXT,
    "stepOrder" INTEGER NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" "GuideStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuideStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TravelerContext_caseId_key" ON "TravelerContext"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "TheftDetail_caseId_key" ON "TheftDetail"("caseId");

-- CreateIndex
CREATE INDEX "GuideStep_caseId_idx" ON "GuideStep"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "GuideStep_caseId_stepOrder_key" ON "GuideStep"("caseId", "stepOrder");

-- AddForeignKey
ALTER TABLE "TravelerContext" ADD CONSTRAINT "TravelerContext_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TheftDetail" ADD CONSTRAINT "TheftDetail_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideStep" ADD CONSTRAINT "GuideStep_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;
