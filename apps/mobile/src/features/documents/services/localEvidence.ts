/**
 * Evidence stays only in JS memory. The image-picker URI is never copied to
 * app storage or sent to our API, and leaving the documents screen clears it.
 */
export type LocalEvidence = {
  id: string;
  uri: string;
  documentType: string;
  createdAt: string;
};

let sessionEvidence: LocalEvidence[] = [];

export function addSessionEvidence(
  uri: string,
  documentType = "경찰 발급 서류",
): LocalEvidence {
  const evidence: LocalEvidence = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    uri,
    documentType,
    createdAt: new Date().toISOString(),
  };
  sessionEvidence = [evidence, ...sessionEvidence];
  return evidence;
}

export function listSessionEvidence() {
  return sessionEvidence;
}

export function clearSessionEvidence() {
  sessionEvidence = [];
}
