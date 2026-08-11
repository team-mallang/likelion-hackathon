ALTER TABLE "Case"
ADD COLUMN "estimatedOccurredAt" TIMESTAMP(3),
ADD COLUMN "estimatedOccurredPlace" TEXT,
ADD COLUMN "routeAfterLastSeen" TEXT,
ADD COLUMN "storageState" TEXT;

ALTER TABLE "CaseItem"
ADD COLUMN "unauthorizedTransactionOccurred" BOOLEAN,
ADD COLUMN "phoneCaseDescription" TEXT,
ADD COLUMN "findMyDeviceAvailable" BOOLEAN,
ADD COLUMN "shape" TEXT,
ADD COLUMN "contentsDescription" TEXT,
ADD COLUMN "passportDocumentType" TEXT,
ADD COLUMN "passportNumberKnown" BOOLEAN,
ADD COLUMN "departureAt" TIMESTAMP(3),
ADD COLUMN "cashAmount" DOUBLE PRECISION,
ADD COLUMN "currency" TEXT;
