import assert from "node:assert/strict";
import test from "node:test";
import {
  todayDateKey,
  maximumCalendarDate,
  isSelectableDate,
  isSelectablePeriod,
} from "../src/utils/date-limits.ts";

const now = new Date("2026-10-14T22:30:00Z");
const day = (value: string) => new Date(`${value}T12:00:00`);

test("date limits use today's Rome calendar day, including DST boundaries", () => {
  assert.equal(todayDateKey(now), "2026-10-15");
  assert.equal(todayDateKey(new Date("2026-01-01T23:30:00Z")), "2026-01-02");
  assert.equal(todayDateKey(new Date("2026-07-01T22:30:00Z")), "2026-07-02");
});

test("today is allowed in full; future days are rejected even with a future maximum", () => {
  for (const requestedMax of [undefined, day("2026-10-20")]) {
    const max = maximumCalendarDate(requestedMax, false, now);
    assert.ok(isSelectableDate(day("2026-10-15"), undefined, max));
    assert.ok(isSelectableDate(day("2026-10-14"), undefined, max));
    assert.equal(isSelectableDate(day("2026-10-16"), undefined, max), false);
    assert.equal(isSelectableDate(new Date("invalid"), undefined, max), false);
  }
});

test("stricter period bounds remain effective and future scheduling requires explicit opt-in", () => {
  const max = maximumCalendarDate(day("2026-10-10"), false, now);
  assert.equal(isSelectableDate(day("2026-10-11"), undefined, max), false);
  assert.equal(isSelectableDate(day("2026-10-08"), day("2026-10-09"), max), false);
  assert.equal(maximumCalendarDate(undefined, true, now), undefined);
  const scheduledMax = maximumCalendarDate(day("2026-11-01"), true, now);
  assert.ok(isSelectableDate(day("2026-10-20"), undefined, scheduledMax));
  assert.equal(isSelectableDate(day("2026-11-02"), undefined, scheduledMax), false);
});

test("monthly and yearly navigation stops at the current period, including year rollover", () => {
  assert.ok(isSelectablePeriod("2026-10", "2026-10"));
  assert.ok(isSelectablePeriod("2026-09", "2026-10"));
  assert.equal(isSelectablePeriod("2026-11", "2026-10"), false);
  assert.equal(isSelectablePeriod("2027-01", "2026-12"), false);
  assert.equal(isSelectablePeriod("2026-02", "2026-01"), false);
  assert.ok(isSelectablePeriod("2026", "2026"));
  assert.equal(isSelectablePeriod("2027", "2026"), false);
  for (const invalid of ["1999-12", "2026-00", "2026-13", "invalid"])
    assert.equal(isSelectablePeriod(invalid, "2026-10"), false);
});
