/**
 * Saving feedback, identical in Alice & Kevin, Expenses Traker and Gym Traker.
 *
 * The HTTP layer reports every request that changes data (POST, PUT, PATCH,
 * DELETE). When one is still running after SHOW_DELAY_MS the snackbar shows
 * "Saving…" (ActivitySnackbar) and the primary FloatingButton a ring. When the
 * last request ends the capsule waits HANDOFF_MS: the result message that the
 * page shows right after takes its place (Popup hands off), otherwise it
 * closes by itself. Quick requests never show anything.
 */
export type TActivityKind = "save" | "delete";
export type TActivityPhase = "idle" | "waiting" | "busy" | "settling";
export type TActivityState = Readonly<{
  phase: TActivityPhase;
  kind: TActivityKind;
  /** Grows with every new round of requests. */
  cycle: number;
  /** How the last round ended: replaced by the result message, or closed by itself. */
  ended: "handoff" | "timeout" | null;
}>;

const SHOW_DELAY_MS = 300;
const HANDOFF_MS = 450;
/** Requests that never show the snackbar: sign-in screens and background preferences. */
const SILENT_PATHS: readonly string[] = [
  "/auth/login",
  "/auth/register",
  "/auth/logout",
  "/auth/preferences",
  "/account/appearance",
];

let state: TActivityState = { phase: "idle", kind: "save", cycle: 0, ended: null };
let pending = 0;
let showTimer: ReturnType<typeof setTimeout> | undefined;
let settleTimer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

const update = (patch: Partial<TActivityState>): void => {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
};

const clearTimers = (): void => {
  if (showTimer !== undefined) clearTimeout(showTimer);
  if (settleTimer !== undefined) clearTimeout(settleTimer);
  showTimer = undefined;
  settleTimer = undefined;
};

export const subscribeActivity = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return (): void => {
    listeners.delete(listener);
  };
};

export const getActivity = (): TActivityState => state;

/** Whether a request changes data and should show the saving feedback. */
export const isActivityRequest = (method: string | undefined, path: string | undefined): boolean => {
  const verb: string = (method ?? "GET").toUpperCase();
  if (verb === "GET" || verb === "HEAD" || verb === "OPTIONS") return false;
  const cleanPath: string = (path ?? "").split("?")[0];
  return !SILENT_PATHS.some((silent) => cleanPath === silent || cleanPath.endsWith(silent));
};

/** Starts following one request; call the returned function once it has finished. */
export const beginActivity = (method: string | undefined): (() => void) => {
  const kind: TActivityKind = method?.toUpperCase() === "DELETE" ? "delete" : "save";
  pending += 1;

  if (state.phase === "settling") {
    clearTimers();
    update({ phase: "busy", kind, ended: null });
  } else if (state.phase === "idle") {
    clearTimers();
    update({ phase: "waiting", kind, cycle: state.cycle + 1, ended: null });
    showTimer = setTimeout((): void => {
      showTimer = undefined;
      if (state.phase === "waiting") update({ phase: "busy" });
    }, SHOW_DELAY_MS);
  }

  let finished = false;
  return (): void => {
    if (finished) return;
    finished = true;
    pending = Math.max(0, pending - 1);
    if (pending > 0) return;

    if (state.phase === "waiting") {
      clearTimers();
      update({ phase: "idle", ended: null });
      return;
    }
    if (state.phase !== "busy") return;

    update({ phase: "settling" });
    settleTimer = setTimeout((): void => {
      settleTimer = undefined;
      if (state.phase === "settling") update({ phase: "idle", ended: "timeout" });
    }, HANDOFF_MS);
  };
};

/** True while a finished round waits for the message with its result. */
export const isActivitySettling = (): boolean => state.phase === "settling";

/** The result message takes the place of the "Saving…" capsule. */
export const handOffActivity = (): void => {
  if (state.phase !== "settling") return;
  clearTimers();
  update({ phase: "idle", ended: "handoff" });
};
