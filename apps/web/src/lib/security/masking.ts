type MaskableValue = string | null | undefined;

function normalize(value: MaskableValue) {
  return typeof value === "string" ? value.trim() : "";
}

export function maskString(
  value: MaskableValue,
  visibleStart = 1,
  visibleEnd = 1,
) {
  const normalized = normalize(value);

  if (!normalized) {
    return "";
  }

  const safeVisibleStart = Math.max(0, Math.trunc(visibleStart));
  const safeVisibleEnd = Math.max(0, Math.trunc(visibleEnd));
  const visibleLength = safeVisibleStart + safeVisibleEnd;

  if (normalized.length <= visibleLength) {
    return "*".repeat(normalized.length);
  }

  return [
    normalized.slice(0, safeVisibleStart),
    "*".repeat(normalized.length - visibleLength),
    safeVisibleEnd > 0 ? normalized.slice(-safeVisibleEnd) : "",
  ].join("");
}

function maskAlphanumericKeepingSeparators(
  value: MaskableValue,
  visibleStart: number,
  visibleEnd: number,
) {
  const normalized = normalize(value);
  const positions = Array.from(normalized.matchAll(/[A-Za-z0-9]/g), (match) =>
    match.index,
  );

  if (positions.length === 0) {
    return "";
  }

  const masked = [...normalized];
  const hiddenStart = Math.min(visibleStart, positions.length);
  const hiddenEnd = Math.max(hiddenStart, positions.length - visibleEnd);

  for (let index = hiddenStart; index < hiddenEnd; index += 1) {
    masked[positions[index]] = "*";
  }

  return masked.join("");
}

export function maskPassportNumber(value: MaskableValue) {
  return maskAlphanumericKeepingSeparators(value, 1, 3);
}

export function maskPhoneNumber(value: MaskableValue) {
  return maskAlphanumericKeepingSeparators(value, 3, 4);
}

export function maskEmail(value: MaskableValue) {
  const normalized = normalize(value);
  const separatorIndex = normalized.lastIndexOf("@");

  if (
    separatorIndex <= 0 ||
    separatorIndex === normalized.length - 1 ||
    normalized.indexOf("@") !== separatorIndex
  ) {
    return normalized ? maskString(normalized, 1, 0) : "";
  }

  const localPart = normalized.slice(0, separatorIndex);
  const domain = normalized.slice(separatorIndex + 1);

  return `${localPart[0]}${"*".repeat(Math.max(3, localPart.length - 1))}@${domain}`;
}

export function maskDocumentNumber(value: MaskableValue) {
  return maskAlphanumericKeepingSeparators(value, 2, 4);
}
