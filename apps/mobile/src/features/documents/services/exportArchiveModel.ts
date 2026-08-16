export function sanitizeExportName(value: string, fallback = "case") {
  const safe = value.replace(/[^A-Za-z0-9_-]/g, "_").replace(/^_+|_+$/g, "");
  return safe || fallback;
}

export function attachmentExtension(fileName: string, mimeType: string) {
  const fromName = fileName.toLowerCase().match(/\.([a-z0-9]{1,5})$/)?.[1];
  if (fromName && ["jpg", "jpeg", "png", "webp", "heic"].includes(fromName)) return fromName === "jpeg" ? "jpg" : fromName;
  const fromMime = mimeType.toLowerCase().split("/")[1];
  return fromMime === "jpeg" ? "jpg" : ["jpg", "png", "webp", "heic"].includes(fromMime) ? fromMime : "jpg";
}

export function attachmentFileName(index: number, fileName: string, mimeType: string) {
  return `attachment-${String(index).padStart(3, "0")}.${attachmentExtension(fileName, mimeType)}`;
}
