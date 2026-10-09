export const getLiquidGlassClass = (theme: "light" | "dark"): string => {
  const baseClasses: string = "";

  const themeClasses: string =
    theme === "light"
      ? "backdrop-blur-xs backdrop-saturate-125 md:backdrop-blur-sm md:backdrop-saturate-150 border-white/70 bg-white/35 shadow-[0_12px_32px_rgba(15,23,42,0.14),inset_0_1px_0_rgba(255,255,255,0.75)]"
      : "backdrop-blur-xs backdrop-saturate-125 md:backdrop-blur-sm md:backdrop-saturate-150 border-white/15 bg-black/35 shadow-[0_12px_32px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.10)]";

  return `${baseClasses} ${themeClasses}`;
};
