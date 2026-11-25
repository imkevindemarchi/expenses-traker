import { type FC, useLayoutEffect, useState, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";

// components
import Popup from "./Popup.component";

// utils
import { getActivity, subscribeActivity } from "../utils/activity.util";

/** Matches the exit animation in Popup.styles.css. */
const EXIT_MS = 220;

/**
 * "Saving…" / "Deleting…" in the snackbar of the three apps while a change is
 * being sent to the server (utils/activity.util.ts). It is the same Liquid
 * Glass capsule as every other message; the result shown by the page then
 * takes its place, or it closes by itself. Swipe up or × hides it.
 */
const ActivitySnackbar: FC = () => {
  const { t } = useTranslation();
  const activity = useSyncExternalStore(subscribeActivity, getActivity);
  const [shownCycle, setShownCycle] = useState<number | null>(null);
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const [dismissedCycle, setDismissedCycle] = useState<number | null>(null);
  const isActive: boolean = activity.phase === "busy" || activity.phase === "settling";
  const isShown: boolean = shownCycle !== null;

  useLayoutEffect(() => {
    if (isActive) {
      setShownCycle(activity.cycle);
      setIsClosing(false);
      return;
    }
    if (activity.phase === "idle" && activity.ended === "timeout" && isShown) {
      setIsClosing(true);
      const delay: number = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 0
        : EXIT_MS;
      const timer: number = window.setTimeout((): void => {
        setShownCycle(null);
        setIsClosing(false);
      }, delay);
      return (): void => window.clearTimeout(timer);
    }
    // Replaced by the result message (or a new round is starting): no exit animation.
    setShownCycle(null);
    setIsClosing(false);
  }, [isActive, isShown, activity.phase, activity.ended, activity.cycle]);

  if (shownCycle === null || dismissedCycle === shownCycle) return null;

  const isDelete: boolean = activity.kind === "delete";

  return (
    <Popup
      key={`activity-${shownCycle}`}
      popup={{
        type: "activity",
        title: t(isDelete ? "popup.deleting" : "popup.saving"),
        message: t(isDelete ? "popup.deletingMessage" : "popup.savingMessage"),
      }}
      isClosing={isClosing}
      onClose={(): void => setDismissedCycle(shownCycle)}
    />
  );
};

export default ActivitySnackbar;
