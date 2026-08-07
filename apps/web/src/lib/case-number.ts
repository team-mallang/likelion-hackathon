import { randomInt } from "node:crypto";

import {
  countryCodeSchema,
  generatedCaseNumberSchema,
} from "@project/shared";

const RANDOM_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const RANDOM_LENGTH = 4;

function createRandomCode(length: number) {
  return Array.from({ length }, () => {
    return RANDOM_CHARACTERS[randomInt(RANDOM_CHARACTERS.length)];
  }).join("");
}

export function createCaseNumberCandidate(
  countryCode: string,
  date = new Date(),
) {
  const normalizedCountryCode = countryCodeSchema.parse(countryCode);
  const year = String(date.getUTCFullYear());

  if (!/^\d{4}$/.test(year)) {
    throw new RangeError("Case number year must contain four digits.");
  }

  const randomPart = createRandomCode(RANDOM_LENGTH);

  return generatedCaseNumberSchema.parse(
    `${normalizedCountryCode}${year}${randomPart}`,
  );
}
