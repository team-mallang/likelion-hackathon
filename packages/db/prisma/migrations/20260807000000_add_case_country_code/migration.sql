-- Existing cases remain nullable for backward compatibility.
ALTER TABLE "Case" ADD COLUMN "countryCode" TEXT;
