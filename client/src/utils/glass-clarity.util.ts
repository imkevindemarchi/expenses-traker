/**
 * Liquid Glass clarity, like the iOS 27 slider: 0 = frosted (most legible),
 * 1 = clear (most transparent). It belongs to the account and is saved on
 * the server, so every device shows the same glass; the browser keeps a copy
 * only to paint the right glass before the account has loaded.
 * Applied as --lg-glass-clarity on <html>, which every glass material reads.
 */
const STORAGE_KEY = "lg-glass-clarity";
/** Default: the clearest glass. */
export const DEFAULT_GLASS_CLARITY = 1;
/** Fired on window whenever the clarity changes (e.g. the account loaded). */
export const GLASS_CLARITY_EVENT = "lg-glass-clarity-change";

const clamp = (value: number): number => Math.min(1, Math.max(0, value));

let persist: ((value: number) => Promise<unknown>) | null = null;
let saveTimer: number | undefined;

export const getGlassClarity = (): number => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const value = stored === null ? NaN : Number(stored);
    return Number.isFinite(value) ? clamp(value) : DEFAULT_GLASS_CLARITY;
  } catch {
    return DEFAULT_GLASS_CLARITY;
  }
};

const remember = (value: number): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    // Private mode: the value still applies for this visit.
  }
};

export const applyGlassClarity = (value: number = getGlassClarity()): void => {
  const next = clamp(value);
  const root = document.documentElement;
  root.style.setProperty("--lg-glass-clarity", String(next));
  // At full clarity every surface wears the search field's clear material:
  // the tab bar drops its refraction lens too (Glass.styles.css).
  root.toggleAttribute("data-glass-clear", next >= 0.995);
  window.dispatchEvent(new CustomEvent(GLASS_CLARITY_EVENT, { detail: next }));
};

/** How the app saves the value on the account (registered once in main.tsx). */
export const setGlassClarityPersistence = (save: (value: number) => Promise<unknown>): void => {
  persist = save;
};

/** The value stored on the account, once it has loaded (login, session restore). */
export const receiveGlassClarity = (value: unknown): void => {
  if (typeof value !== "number" || !Number.isFinite(value)) return;
  const next = clamp(value);
  remember(next);
  applyGlassClarity(next);
};

/** The user moved the slider: apply now, save on the account shortly after. */
export const setGlassClarity = (value: number): void => {
  const next = clamp(value);
  applyGlassClarity(next);
  remember(next);
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    void persist?.(next).catch((error: unknown) => {
      console.error("Unable to save the Liquid Glass clarity:", error);
    });
  }, 400);
};
