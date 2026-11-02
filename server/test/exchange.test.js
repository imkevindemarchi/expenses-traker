import test from "node:test";
import assert from "node:assert/strict";
import { entryMoney, exchangeRate, backupConversion, convertedCents } from "../src/exchange.js";

test("decimal rates round half cents exactly without binary floating point errors", () => {
  assert.equal(convertedCents(100, 1.005), 101);
  assert.equal(convertedCents(100, 1.0049), 100);
  assert.equal(convertedCents(100_000_000, 1e-7), 10);
  assert.equal(convertedCents(100, 1e3), 100000);
});

const rate = { from: "USD", to: "EUR", rate: 0.89238, rateDate: "2020-10-09", provider: "ECB" };
const body = { amount: "12.03", currency: "USD", date: "2020-10-10" };
test("foreign movements round to cents and retain the actual reference date and original amount", async () => {
  const result = await entryMoney(body, "EUR", null, async (...args) => {
    assert.deepEqual(args, ["USD", "EUR", body.date]);
    return rate;
  });
  assert.equal(result.amountCents, 1074);
  assert.deepEqual(result.conversion, { ...rate, originalCents: 1203 });
  assert.deepEqual(
    backupConversion(result.conversion, result.amountCents, body.date),
    result.conversion,
  );
  assert.throws(() => backupConversion(result.conversion, 1203, body.date));
});
test("same-currency and legacy submissions do not require a rate; classification edits preserve conversion", async () => {
  const getRate = () => assert.fail("No network required");
  const conversion = { ...rate, originalCents: 1203 };
  const existing = { amountCents: 1074, date: body.date, conversion };
  for (const currency of [undefined, "EUR"]) {
    const result = await entryMoney(
      { ...body, amount: "10,74", currency },
      "EUR",
      existing,
      getRate,
    );
    assert.deepEqual(result, { amountCents: 1074, conversion });
  }
  assert.equal(
    (await entryMoney({ ...body, currency: "EUR" }, "EUR", existing, getRate)).conversion,
    null,
  );
});
test("invalid inputs, rounded zero and converted amounts over the limit are rejected", async () => {
  for (const change of [{ amount: "0" }, { currency: "JPY" }, { date: "2020-02-30" }])
    await assert.rejects(entryMoney({ ...body, ...change }, "EUR"), { status: 400 });
  for (const value of [0.00001, 1000000])
    await assert.rejects(
      entryMoney(body, "EUR", null, async () => ({ ...rate, rate: value })),
      { status: 400 },
    );
});
test("provider requests use ECB with timeout, handle weekends and reuse cached rates", async () => {
  let calls = 0;
  const fetcher = async (url, options) => {
    calls++;
    assert.match(url, /providers\/ecb\/rate\/USD\/EUR\?date=2020-10-10$/);
    assert.ok(options.signal instanceof AbortSignal);
    return {
      ok: true,
      json: async () => ({ base: "USD", quote: "EUR", date: rate.rateDate, rate: rate.rate }),
    };
  };
  assert.deepEqual(await exchangeRate("USD", "EUR", body.date, fetcher), rate);
  await exchangeRate("USD", "EUR", body.date, fetcher);
  assert.equal(calls, 1);
});
test("provider errors and invalid or stale responses fail closed", async () => {
  const valid = { base: "USD", quote: "GBP", date: "2020-10-09", rate: 0.77 };
  for (const response of [
    null,
    { ...valid, rate: 0 },
    { ...valid, base: "EUR" },
    { ...valid, date: "2020-11-01" },
    { ...valid, date: "2020-01-01" },
  ]) {
    await assert.rejects(
      exchangeRate("USD", "GBP", body.date, async () => {
        if (!response) throw new Error("Offline");
        return { ok: true, json: async () => response };
      }),
      { status: 503 },
    );
  }
  await assert.rejects(exchangeRate("USD", "GBP", "2100-01-01"), { status: 400 });
});
