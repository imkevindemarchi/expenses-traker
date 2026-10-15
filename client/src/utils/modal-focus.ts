/** Minimal scroll needed to keep an input within the visible part of its modal. */
export function focusScrollDelta(
  field: { top: number; bottom: number },
  viewport: { top: number; bottom: number },
  padding = 12,
): number {
  const top = viewport.top + padding;
  const bottom = viewport.bottom - padding;
  if (bottom <= top) return 0;
  if (field.top < top) return field.top - top;
  if (field.bottom > bottom) return field.bottom - bottom;
  return 0;
}
