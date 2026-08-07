import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { after, beforeEach, describe, test } from "node:test";

import { decrypt, encrypt, type EncryptedData } from "./encryption.ts";

const originalEncryptionKey = process.env.DATA_ENCRYPTION_KEY;

after(() => {
  if (originalEncryptionKey === undefined) {
    delete process.env.DATA_ENCRYPTION_KEY;
  } else {
    process.env.DATA_ENCRYPTION_KEY = originalEncryptionKey;
  }
});

beforeEach(() => {
  process.env.DATA_ENCRYPTION_KEY = randomBytes(32).toString("base64");
});

describe("AES-256-GCM encryption", () => {
  test("decrypts an encrypted value to the original plaintext", () => {
    const plaintext = "여권번호 M12345678";

    assert.equal(decrypt(encrypt(plaintext)), plaintext);
  });

  test("uses a different random IV for every encryption", () => {
    const first = encrypt("same value");
    const second = encrypt("same value");

    assert.notEqual(first.iv, second.iv);
    assert.notEqual(first.ciphertext, second.ciphertext);
  });

  test("rejects a missing or incorrectly sized key", () => {
    delete process.env.DATA_ENCRYPTION_KEY;
    assert.throws(() => encrypt("value"), /not configured/);

    process.env.DATA_ENCRYPTION_KEY = randomBytes(16).toString("base64");
    assert.throws(() => encrypt("value"), /32-byte key/);
  });

  test("cannot decrypt with a different valid key", () => {
    const encrypted = encrypt("protected value");
    process.env.DATA_ENCRYPTION_KEY = randomBytes(32).toString("base64");

    assert.throws(() => decrypt(encrypted), /authentication failed/);
  });

  test("rejects tampered ciphertext and authentication tags", () => {
    const encrypted = encrypt("protected value");
    const ciphertext = Buffer.from(encrypted.ciphertext, "base64");
    ciphertext[0] ^= 1;

    assert.throws(
      () =>
        decrypt({
          ...encrypted,
          ciphertext: ciphertext.toString("base64"),
        }),
      /authentication failed/,
    );

    const authTag = Buffer.from(encrypted.authTag, "base64");
    authTag[0] ^= 1;

    assert.throws(
      () =>
        decrypt({
          ...encrypted,
          authTag: authTag.toString("base64"),
        }),
      /authentication failed/,
    );
  });

  test("rejects malformed encrypted data", () => {
    assert.throws(
      () => decrypt({ ciphertext: "!", iv: "!", authTag: "!" } as EncryptedData),
      /unsupported format|valid base64/,
    );
  });
});
