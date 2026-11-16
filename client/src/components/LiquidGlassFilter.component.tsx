import { type FC, type RefObject, useEffect, useState } from "react";

/**
 * Real refraction for Liquid Glass surfaces.
 *
 * Builds a displacement map shaped like the element (a rounded rectangle whose
 * bezel bends the backdrop like a lens) and feeds it to `backdrop-filter`
 * through an SVG filter. Only Chromium supports SVG filters in
 * `backdrop-filter`; Safari and Firefox keep the frosted material from
 * Glass.styles.css, so nothing is rendered there.
 */

const supportsRefraction = (): boolean => {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isAppleMobile =
    /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && "ontouchend" in document);
  const isChromium = /Chrome\/|Chromium\/|Edg\//.test(ua) && !/Firefox\//.test(ua);
  const reduced =
    window.matchMedia?.("(prefers-reduced-transparency: reduce)").matches ||
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  // Touch devices (Android phones and tablets) skip it: an SVG displacement in a
  // backdrop-filter on a fixed bar is re-rendered every scroll frame.
  const touch = window.matchMedia?.("(pointer: coarse)").matches;
  return isChromium && !isAppleMobile && !reduced && !touch;
};

const buildMap = (width: number, height: number, radius: number, bezel: number): string => {
  // Work at half resolution: the map is smooth and is scaled up by the filter.
  const scale = 0.5;
  const w = Math.max(2, Math.round(width * scale));
  const h = Math.max(2, Math.round(height * scale));
  const r = Math.min(radius * scale, w / 2, h / 2);
  const b = Math.max(1, bezel * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const image = ctx.createImageData(w, h);
  const data = image.data;

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const px = x + 0.5;
      const py = y + 0.5;
      // Signed distance to a rounded rectangle (negative inside).
      const qx = Math.abs(px - w / 2) - (w / 2 - r);
      const qy = Math.abs(py - h / 2) - (h / 2 - r);
      const ox = Math.max(qx, 0);
      const oy = Math.max(qy, 0);
      const outside = Math.hypot(ox, oy);
      const inside = Math.min(Math.max(qx, qy), 0);
      const sd = outside + inside - r;
      const depth = -sd; // distance from the edge, inwards

      let dx = 0;
      let dy = 0;
      if (depth > 0 && depth < b) {
        // Edge normal (points outwards).
        let nx: number;
        let ny: number;
        if (qx > 0 && qy > 0) {
          nx = ox;
          ny = oy;
        } else if (qx > qy) {
          nx = 1;
          ny = 0;
        } else {
          nx = 0;
          ny = 1;
        }
        const len = Math.hypot(nx, ny) || 1;
        nx = (nx / len) * Math.sign(px - w / 2 || 1);
        ny = (ny / len) * Math.sign(py - h / 2 || 1);
        // Convex lens profile: strongest bend right at the rim.
        const t = 1 - depth / b;
        const strength = t * t * (3 - 2 * t);
        dx = -nx * strength;
        dy = -ny * strength;
      }
      const i = (y * w + x) * 4;
      data[i] = Math.round(128 + dx * 127);
      data[i + 1] = Math.round(128 + dy * 127);
      data[i + 2] = 128;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL("image/png");
};

interface IProps {
  id: string;
  targetRef: RefObject<HTMLElement | null>;
  /** Width of the refracting rim in CSS pixels. */
  bezel?: number;
  /** Maximum displacement in CSS pixels. */
  strength?: number;
}

const LiquidGlassFilter: FC<IProps> = ({ id, targetRef, bezel = 18, strength = 26 }) => {
  const [enabled] = useState<boolean>(supportsRefraction);
  const [map, setMap] = useState<{ href: string; width: number; height: number } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    document.documentElement.classList.add("lg-refraction");
    const element = targetRef.current;
    if (!element) return;

    let frame = 0;
    const update = (): void => {
      frame = 0;
      const rect = element.getBoundingClientRect();
      if (rect.width < 4 || rect.height < 4) return;
      const radius = parseFloat(getComputedStyle(element).borderTopLeftRadius) || rect.height / 2;
      const href = buildMap(rect.width, rect.height, radius, bezel);
      if (!href) return;
      setMap({ href, width: Math.round(rect.width), height: Math.round(rect.height) });
      element.style.setProperty("--lg-refract-filter", `url(#${id})`);
    };
    const schedule = (): void => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    schedule();
    const observer = new ResizeObserver(schedule);
    observer.observe(element);
    return (): void => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      element.style.removeProperty("--lg-refract-filter");
    };
  }, [enabled, targetRef, id, bezel]);

  if (!enabled || !map) return null;

  return (
    <svg
      aria-hidden="true"
      width="0"
      height="0"
      style={{ position: "absolute", pointerEvents: "none" }}
    >
      <filter
        id={id}
        x="0"
        y="0"
        width={map.width}
        height={map.height}
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feImage
          href={map.href}
          x="0"
          y="0"
          width={map.width}
          height={map.height}
          preserveAspectRatio="none"
          result="lens"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="lens"
          scale={strength * 2}
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  );
};

export default LiquidGlassFilter;
