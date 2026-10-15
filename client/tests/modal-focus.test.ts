import test from "node:test";
import assert from "node:assert/strict";
import { focusScrollDelta } from "../src/utils/modal-focus.ts";

test("modal keeps an already visible field stationary", () => {
  assert.equal(focusScrollDelta({ top: 120, bottom: 180 }, { top: 80, bottom: 320 }), 0);
});
test("opening a keyboard scrolls a hidden input above the keyboard without scrolling the page", () => {
  assert.equal(focusScrollDelta({ top: 260, bottom: 320 }, { top: 80, bottom: 280 }), 52);
});
test("fields above the modal viewport scroll back into view", () => {
  assert.equal(focusScrollDelta({ top: 40, bottom: 90 }, { top: 80, bottom: 280 }), -52);
});
test("very short content regions avoid invalid scroll calculations", () => {
  assert.equal(focusScrollDelta({ top: 100, bottom: 150 }, { top: 100, bottom: 110 }), 0);
});
