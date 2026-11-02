import test from "node:test";
import assert from "node:assert/strict";
import { numberFormatter, dateFormatter } from "../src/utils/formatters.util.ts";

test("cached formatters preserve locale, currency, timezone and date parts", () => {
  for (const locale of ["it-IT", "en-US"]) {
    for (const currency of ["EUR", "USD", "JPY"]) {
      const options: Intl.NumberFormatOptions = {
        style: "currency",
        currency,
        currencyDisplay: "narrowSymbol",
      };
      for (const value of [0, -12.5, 1234567.89])
        assert.equal(
          numberFormatter(locale, options).format(value),
          new Intl.NumberFormat(locale, options).format(value),
        );
    }
    const options: Intl.DateTimeFormatOptions = {
      timeZone: "Europe/Rome",
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    for (const instant of [
      "2026-03-29T00:30:00Z",
      "2026-10-25T01:30:00Z",
      "2026-10-28T23:30:00Z",
    ]) {
      const date = new Date(instant);
      assert.deepEqual(
        dateFormatter(locale, options).formatToParts(date),
        new Intl.DateTimeFormat(locale, options).formatToParts(date),
      );
    }
  }
});

test("identical options reuse formatter instances without mixing locales or currencies", () => {
  assert.equal(
    numberFormatter("it-IT", { style: "currency", currency: "EUR" }),
    numberFormatter("it-IT", { style: "currency", currency: "EUR" }),
  );
  assert.notEqual(numberFormatter("it-IT"), numberFormatter("en-US"));
  assert.notEqual(
    numberFormatter("it-IT", { style: "currency", currency: "EUR" }),
    numberFormatter("it-IT", { style: "currency", currency: "USD" }),
  );
  assert.equal(
    dateFormatter("it-IT", { month: "long" }),
    dateFormatter("it-IT", { month: "long" }),
  );
});
