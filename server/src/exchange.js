import { accountCurrency } from "./currency.js";
import { amountCents, dateKey, fail } from "./validation.js";

const cache = new Map();
// Round decimal reference rates exactly, including half-cent boundaries.
export function convertedCents(cents, rate) {
  const [coefficient, exponent = "0"] = String(rate).split("e");
  const [whole, fraction = ""] = coefficient.split(".");
  const scale = fraction.length - Number(exponent);
  const numerator =
    BigInt(cents) * BigInt(whole + fraction) * (scale < 0 ? 10n ** BigInt(-scale) : 1n);
  const denominator = scale > 0 ? 10n ** BigInt(scale) : 1n;
  return Number((numerator * 2n + denominator) / (denominator * 2n));
}
export async function exchangeRate(from, to, date, fetcher = fetch) {
  accountCurrency(from);
  accountCurrency(to);
  dateKey(date);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" }).format(new Date());
  if (date > today) fail("La conversione non è disponibile per date future.");
  const key = `${from}:${to}:${date}`;
  const cached = cache.get(key);
  if (cached && cached.until > Date.now()) return cached.value;
  try {
    const response = await fetcher(
      `https://api.frankfurter.dev/v2/providers/ecb/rate/${from}/${to}?date=${date}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!response.ok) throw new Error("Rate unavailable");
    const data = await response.json();
    if (data.base !== from || data.quote !== to || !Number.isFinite(data.rate) || data.rate <= 0)
      throw new Error("Invalid rate");
    dateKey(data.date);
    if (data.date > date || (Date.parse(date) - Date.parse(data.date)) / 86400000 > 7)
      throw new Error("Outdated rate");
    const value = { from, to, rate: data.rate, rateDate: data.date, provider: "ECB" };
    if (cache.size >= 1000) cache.delete(cache.keys().next().value);
    cache.set(key, { value, until: Date.now() + 15 * 60 * 1000 });
    return value;
  } catch {
    fail("Cambio non disponibile. Riprova tra poco: il movimento non è stato salvato.", 503);
  }
}

export async function entryMoney(body, target, existing = null, getRate = exchangeRate) {
  const originalCents = amountCents(body.amount);
  const from = body.currency === undefined ? target : accountCurrency(body.currency);
  accountCurrency(target);
  const date = dateKey(body.date);
  if (from === target) {
    // Editing classification must never revalue an already converted movement.
    const unchanged = existing?.amountCents === originalCents && existing.date === date;
    return {
      amountCents: originalCents,
      conversion: unchanged ? (existing.conversion ?? null) : null,
    };
  }
  const rate = await getRate(from, target, date);
  const converted = convertedCents(originalCents, rate.rate);
  if (!Number.isSafeInteger(converted) || converted < 1 || converted > 100_000_000)
    fail("L’importo convertito deve essere compreso tra 0,01 e 1.000.000.");
  return { amountCents: converted, conversion: { ...rate, originalCents } };
}

export function backupConversion(value, cents, date) {
  if (value == null) return null;
  const { from, to, originalCents, rate, rateDate, provider } = value;
  accountCurrency(from);
  accountCurrency(to);
  dateKey(rateDate);
  if (
    from === to ||
    !Number.isSafeInteger(originalCents) ||
    originalCents < 1 ||
    originalCents > 100_000_000 ||
    !Number.isFinite(rate) ||
    rate <= 0 ||
    convertedCents(originalCents, rate) !== cents ||
    rateDate > date ||
    provider !== "ECB"
  )
    fail("Dati di conversione non validi nel backup.");
  return { from, to, originalCents, rate, rateDate, provider };
}
