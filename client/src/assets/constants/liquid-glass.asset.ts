/** The shared surface used by the month/year selector and glass controls. */
export const getLiquidGlassClass = (theme: "light" | "dark"): string =>
  `glass-surface glass-surface--${theme}`;
