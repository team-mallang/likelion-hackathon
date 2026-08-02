import { randomBytes } from "node:crypto";

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}

function createRandomCode(length: number) {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(length);

  return Array.from(bytes, (byte) => {
    return characters[byte % characters.length];
  }).join("");
}

export function createCaseNumberCandidate() {
  const datePart = formatDate(new Date());
  const randomPart = createRandomCode(6);

  return `TG-${datePart}-${randomPart}`;
}
