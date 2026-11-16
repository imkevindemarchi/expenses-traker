/** Opening a page must not summon a touch device's keyboard. */
export const allowsAutomaticTextFocus = (): boolean =>
  typeof window !== "undefined" &&
  !window.matchMedia("(max-width: 760px), (pointer: coarse)").matches;
