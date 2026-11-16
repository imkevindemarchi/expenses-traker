import { networkInterfaces } from "node:os";

// Stessa logica di aliceandkevin 2.0: in produzione solo le origini configurate,
// in sviluppo anche gli indirizzi di rete di questo PC sulle porte dell'app
// (così il telefono sulla stessa Wi-Fi può usare http://IP-DEL-PC:3001).
export const DEV_PORTS = ["3001", "4101"];

export function configuredOrigins(env = process.env) {
  return [env.APP_ORIGIN, ...(env.APP_ORIGINS || "").split(",")]
    .map((value) => value?.trim())
    .filter(Boolean);
}

export function allowedOrigin(origin, env = process.env, interfaces = networkInterfaces()) {
  if (configuredOrigins(env).includes(origin)) return true;
  if (env.NODE_ENV === "production") return false;
  try {
    const url = new URL(origin);
    if (url.origin !== origin || url.protocol !== "http:" || !DEV_PORTS.includes(url.port))
      return false;
    const addresses = new Set(["localhost", "127.0.0.1", "::1"]);
    for (const entries of Object.values(interfaces))
      for (const entry of entries || []) addresses.add(entry.address);
    return addresses.has(url.hostname.replace(/^\[|\]$/g, ""));
  } catch {
    return false;
  }
}
