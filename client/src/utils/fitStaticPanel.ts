export type PanelAnchor = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
};
export type PanelViewport = {
  width: number;
  height: number;
  offsetLeft?: number;
  offsetTop?: number;
};
export function fitStaticPanel(
  anchor: PanelAnchor,
  requestedWidth: number,
  height: number,
  viewport: PanelViewport,
  placement: "above" | "below" | "side" = "below",
  padding = 12,
  gap = 8,
) {
  const minX = (viewport.offsetLeft ?? 0) + padding,
    minY = (viewport.offsetTop ?? 0) + padding;
  const width = Math.max(1, Math.min(requestedWidth, viewport.width - padding * 2));
  const maxX = Math.max(minX, minX + viewport.width - padding * 2 - width);
  const maxY = Math.max(minY, minY + viewport.height - padding * 2 - height);
  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));
  let left = anchor.left + anchor.width / 2 - width / 2;
  let top = placement === "above" ? anchor.top - height - gap : anchor.bottom + gap;
  if (placement === "side") {
    left = anchor.right + gap;
    top = anchor.bottom - height;
    if (left > maxX) left = anchor.left - width - gap;
  } else if (
    placement === "below" &&
    top + height > maxY + height &&
    anchor.top - height - gap >= minY
  )
    top = anchor.top - height - gap;
  else if (placement === "above" && top < minY && anchor.bottom + gap + height <= maxY + height)
    top = anchor.bottom + gap;
  return { left: clamp(left, minX, maxX), top: clamp(top, minY, maxY), width };
}
