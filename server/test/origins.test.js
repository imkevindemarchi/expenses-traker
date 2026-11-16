import assert from "node:assert/strict";
import { test } from "node:test";
import { allowedOrigin } from "../src/origins.js";

const interfaces = {
  wifi: [{ address: "192.168.1.55", family: "IPv4", internal: false }],
};

test("development accepts this computer's LAN origins on the app ports", () => {
  for (const origin of [
    "http://192.168.1.55:3001",
    "http://192.168.1.55:4101",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
  ])
    assert.equal(allowedOrigin(origin, {}, interfaces), true);
  for (const origin of [
    "http://192.168.1.56:3001",
    "http://192.168.1.55:3000",
    "http://192.168.1.55:3001.evil.test",
    "null",
    "https://evil.test",
  ])
    assert.equal(allowedOrigin(origin, {}, interfaces), false);
});

test("production only accepts explicitly configured origins", () => {
  const env = {
    NODE_ENV: "production",
    APP_ORIGIN: "https://spese.example.test",
    APP_ORIGINS: "https://www.spese.example.test",
  };
  assert.equal(allowedOrigin("http://192.168.1.55:3001", env, interfaces), false);
  assert.equal(allowedOrigin("http://localhost:3001", env, interfaces), false);
  assert.equal(allowedOrigin("https://spese.example.test", env, interfaces), true);
  assert.equal(allowedOrigin("https://www.spese.example.test", env, interfaces), true);
});
