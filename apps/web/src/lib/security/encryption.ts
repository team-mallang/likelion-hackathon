import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH_BYTES = 32;
const IV_LENGTH_BYTES = 12;
const AUTH_TAG_LENGTH_BYTES = 16;

export type EncryptedData = {
  algorithm: typeof ALGORITHM;
  encoding: "base64";
  ciphertext: string;
  iv: string;
  authTag: string;
};

function decodeBase64(value: string, fieldName: string) {
  if (!value || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) {
    throw new Error(`${fieldName} must be a valid base64 string.`);
  }

  const decoded = Buffer.from(value, "base64");
  const normalizedInput = value.replace(/=+$/, "");
  const normalizedDecoded = decoded.toString("base64").replace(/=+$/, "");

  if (normalizedInput !== normalizedDecoded) {
    throw new Error(`${fieldName} must be a valid base64 string.`);
  }

  return decoded;
}

function getEncryptionKey() {
  const encodedKey = process.env.DATA_ENCRYPTION_KEY?.trim();

  if (!encodedKey) {
    throw new Error("DATA_ENCRYPTION_KEY environment variable is not configured.");
  }

  const key = decodeBase64(encodedKey, "DATA_ENCRYPTION_KEY");

  if (key.length !== KEY_LENGTH_BYTES) {
    throw new Error(
      "DATA_ENCRYPTION_KEY must be a base64-encoded 32-byte key for AES-256-GCM.",
    );
  }

  return key;
}

function validateEncryptedData(data: EncryptedData) {
  if (!data || typeof data !== "object") {
    throw new Error("Encrypted data is invalid.");
  }

  if (data.algorithm !== ALGORITHM || data.encoding !== "base64") {
    throw new Error("Encrypted data uses an unsupported format.");
  }

  const iv = decodeBase64(data.iv, "Encrypted data IV");
  const authTag = decodeBase64(data.authTag, "Encrypted data authTag");
  const ciphertext = decodeBase64(data.ciphertext, "Encrypted data ciphertext");

  if (iv.length !== IV_LENGTH_BYTES) {
    throw new Error(`Encrypted data IV must be ${IV_LENGTH_BYTES} bytes.`);
  }

  if (authTag.length !== AUTH_TAG_LENGTH_BYTES) {
    throw new Error(
      `Encrypted data authTag must be ${AUTH_TAG_LENGTH_BYTES} bytes.`,
    );
  }

  return { iv, authTag, ciphertext };
}

export function encrypt(plaintext: string): EncryptedData {
  if (typeof plaintext !== "string") {
    throw new TypeError("Plaintext must be a string.");
  }

  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH_BYTES,
  });
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  return {
    algorithm: ALGORITHM,
    encoding: "base64",
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
  };
}

export function decrypt(data: EncryptedData): string {
  const key = getEncryptionKey();
  const { iv, authTag, ciphertext } = validateEncryptedData(data);
  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH_BYTES,
  });

  decipher.setAuthTag(authTag);

  try {
    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new Error("Encrypted data authentication failed.");
  }
}
