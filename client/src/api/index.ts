import { locale } from "../i18n";

import { numberFormatter, dateFormatter } from "../utils/formatters.util";
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
export async function api<T>(
  path: string,
  options?: { method?: string; body?: unknown; signal?: AbortSignal },
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method: options?.method ?? "GET",
    credentials: "same-origin",
    signal: options?.signal,
    headers: options?.body ? { "Content-Type": "application/json" } : undefined,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  }).catch((error) => {
    if (options?.signal?.aborted) throw error;
    throw new ApiError(
      "Il server non è raggiungibile. Verifica la connessione e che il back-end sia avviato.",
      0,
    );
  });
  const data = await response.json().catch(() => ({
    message: "Il server non è raggiungibile. Verifica di avere avviato il back-end.",
  }));
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith("/auth"))
      window.dispatchEvent(new Event("session-expired"));
    throw new ApiError(data.message ?? "Richiesta non riuscita.", response.status);
  }
  return data as T;
}
export const money = (cents: number, currency = "EUR") =>
  numberFormatter(locale(), { style: "currency", currency }).format(cents / 100);
export const today = () => {
  const parts = dateFormatter("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  return ["year", "month", "day"]
    .map((key) => parts.find((part) => part.type === key)?.value)
    .join("-");
};
export const displayDate = (date: string) =>
  dateFormatter(locale(), { day: "2-digit", month: "short" }).format(
    new Date(`${date}T12:00:00Z`),
  );
export const csvCell = (value: string) =>
  `"${(/^[=+\-@\t\r]/.test(value) ? `'${value}` : value).replaceAll('"', '""')}"`;
