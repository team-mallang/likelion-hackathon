import assert from "node:assert/strict";
import test from "node:test";

import { deleteAudioFileIfPresent } from "./audioFileCleanup.ts";

test("deletes an existing local recording", () => {
  let deleted = false;
  deleteAudioFileIfPresent("file:///cache/recording.m4a", () => ({
    exists: true,
    delete: () => { deleted = true; },
  }));
  assert.equal(deleted, true);
});

test("does not create or delete a file for an empty URI", () => {
  let called = false;
  deleteAudioFileIfPresent("", () => {
    called = true;
    return { exists: true, delete: () => undefined };
  });
  assert.equal(called, false);
});

test("does not delete a file which is already absent", () => {
  let deleted = false;
  deleteAudioFileIfPresent("file:///cache/missing.m4a", () => ({
    exists: false,
    delete: () => { deleted = true; },
  }));
  assert.equal(deleted, false);
});
