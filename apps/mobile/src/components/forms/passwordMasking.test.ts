import assert from "node:assert/strict";
import test from "node:test";

import {
  getPasswordValueFromDisplayChange,
  maskPasswordForDisplay,
} from "./passwordMasking";

test("hidden password keeps only the latest entered character visible", () => {
  let password = "";

  for (const character of ["a", "b", "c", "1"]) {
    const displayed = maskPasswordForDisplay(password, false);
    password = getPasswordValueFromDisplayChange(
      password,
      displayed,
      `${displayed}${character}`,
      false,
    );
  }

  assert.equal(password, "abc1");
  assert.equal(maskPasswordForDisplay("a", false), "a");
  assert.equal(maskPasswordForDisplay("ab", false), "•b");
  assert.equal(maskPasswordForDisplay("abc", false), "••c");
  assert.equal(maskPasswordForDisplay("abc1", false), "•••1");
});

test("visible password displays and edits the full value", () => {
  assert.equal(maskPasswordForDisplay("abc1", true), "abc1");
  assert.equal(
    getPasswordValueFromDisplayChange("abc1", "abc1", "abc12", true),
    "abc12",
  );
});

test("backspace masks the next latest character", () => {
  assert.equal(
    getPasswordValueFromDisplayChange("abc", "••c", "••", false),
    "ab",
  );
  assert.equal(maskPasswordForDisplay("ab", false), "•b");
});
