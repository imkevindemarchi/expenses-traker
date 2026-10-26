import test from "node:test";
import assert from "node:assert/strict";
import { createPreloader } from "../src/utils/preload.util.ts";

test("intent and navigation share one pending import and the cached result", async () => {
  let calls = 0;
  let finish!: (value: string) => void;
  const preload = createPreloader(() => { calls++; return new Promise<string>((resolve) => { finish = resolve; }); });
  const intent = preload();
  assert.equal(preload(), intent);
  finish("page");
  assert.equal(await intent, "page");
  assert.equal(await preload(), "page");
  assert.equal(calls, 1);
});

test("a failed speculative import can be retried by navigation", async () => {
  let calls = 0;
  const preload = createPreloader(async () => { if (++calls === 1) throw new Error("offline"); return "page"; });
  await assert.rejects(preload(), /offline/);
  assert.equal(await preload(), "page");
  assert.equal(calls, 2);
});
