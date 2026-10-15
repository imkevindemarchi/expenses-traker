/** Calendar limits use the same Rome day as the trackers, independent of the device timezone. */
export function todayDateKey(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  return ["year", "month", "day"]
    .map((key) => parts.find((part) => part.type === key)?.value)
    .join("-");
}

function calendarDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function maximumCalendarDate(
  maxDate?: Date,
  allowFuture = false,
  now = new Date(),
): Date | undefined {
  const validMax = maxDate && Number.isFinite(maxDate.getTime()) ? maxDate : undefined;
  if (allowFuture) return validMax;
  const today = new Date(`${todayDateKey(now)}T00:00:00`);
  return validMax && calendarDay(validMax) < today.getTime() ? validMax : today;
}

export function isSelectableDate(date: Date, minDate?: Date, maxDate?: Date): boolean {
  const day = calendarDay(date);
  return (
    Number.isFinite(day) &&
    (!minDate || day >= calendarDay(minDate)) &&
    (!maxDate || day <= calendarDay(maxDate))
  );
}

export function isSelectablePeriod(value: string, current: string): boolean {
  return (
    /^\d{4}(?:-(?:0[1-9]|1[0-2]))?$/.test(value) &&
    value.length === current.length &&
    value >= (current.length === 4 ? "2000" : "2000-01") &&
    value <= current
  );
}
