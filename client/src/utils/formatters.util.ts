const numbers = new Map<string, Intl.NumberFormat>();
const dates = new Map<string, Intl.DateTimeFormat>();

function cached<T>(cache: Map<string, T>, key: string, create: () => T): T {
  const previous = cache.get(key);
  if (previous) return previous;
  if (cache.size >= 32) cache.delete(cache.keys().next().value!);
  const formatter = create();
  cache.set(key, formatter);
  return formatter;
}

export const numberFormatter = (locale: string, options: Intl.NumberFormatOptions = {}) =>
  cached(numbers, JSON.stringify([locale, options]), () => new Intl.NumberFormat(locale, options));
export const dateFormatter = (locale: string, options: Intl.DateTimeFormatOptions = {}) =>
  cached(dates, JSON.stringify([locale, options]), () => new Intl.DateTimeFormat(locale, options));
