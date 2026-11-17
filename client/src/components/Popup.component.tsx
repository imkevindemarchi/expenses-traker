import {
  type CSSProperties,
  type FC,
  type TouchEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { CircleCheck, CircleX, TriangleAlert, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import "../styles/Popup.styles.css";

// types
type TPopupType = "success" | "warning" | "error";
type TPopupState = { type: TPopupType; message: string; title?: string };

interface IProps {
  popup: TPopupState;
  isClosing: boolean;
  /** Closes itself after this time, with the exit animation (apps without a provider). */
  autoCloseMs?: number;
  onClose: () => void;
}

/** Each kind of message: its glyph and its title (colours in Popup.styles.css). */
const POPUP_STYLES: Record<TPopupType, { icon: typeof CircleCheck; titleTranslationKey: string }> =
  {
    success: { icon: CircleCheck, titleTranslationKey: "popup.success" },
    warning: { icon: TriangleAlert, titleTranslationKey: "popup.warning" },
    error: { icon: CircleX, titleTranslationKey: "popup.error" },
  };

/** Upward drag (px) that dismisses the banner. */
const SWIPE_CLOSE_THRESHOLD = 24;
/** Matches the exit animation in Popup.styles.css. */
const EXIT_MS = 220;

/**
 * The snackbar of the three apps, as an iOS 27 banner: a Liquid Glass capsule
 * that drops in at the top centre (clear of the tab bar, the dock, the
 * floating buttons and the main actions at the bottom), with the coloured
 * glyph of its kind, a title and the message. Swipe it up or tap × to dismiss;
 * it stays while touched.
 */
const Popup: FC<IProps> = ({ popup, isClosing: externallyClosing, autoCloseMs, onClose }) => {
  const { t } = useTranslation();
  const [locallyClosing, setLocallyClosing] = useState(false);
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isHeld, setIsHeld] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const closeCallback = useRef(onClose);
  useLayoutEffect(() => {
    closeCallback.current = onClose;
  }, [onClose]);
  const isClosing = externallyClosing || locallyClosing;

  const requestClose = (): void => {
    if (isClosing) return;
    touchStartY.current = null;
    setIsDragging(false);
    setLocallyClosing(true);
  };

  useEffect(() => {
    if (!autoCloseMs || isHeld || isClosing) return;
    const timer = window.setTimeout(() => setLocallyClosing(true), autoCloseMs);
    return () => window.clearTimeout(timer);
  }, [autoCloseMs, isHeld, isClosing]);

  useEffect(() => {
    if (!locallyClosing) return;
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : EXIT_MS;
    const timer = window.setTimeout(() => closeCallback.current(), delay);
    return () => window.clearTimeout(timer);
  }, [locallyClosing]);

  const style = POPUP_STYLES[popup.type];
  const Icon = style.icon;
  const title: string = popup.title || t(style.titleTranslationKey);
  const role: "alert" | "status" = popup.type === "success" ? "status" : "alert";

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>): void => {
    if (isClosing) return;
    touchStartY.current = event.touches[0].clientY;
    setIsDragging(true);
    setIsHeld(true);
  };
  const handleTouchMove = (event: TouchEvent<HTMLDivElement>): void => {
    if (touchStartY.current === null || isClosing) return;
    const delta = event.touches[0].clientY - touchStartY.current;
    // Up follows the finger; down only stretches a little, like a rubber band.
    setOffset(delta < 0 ? delta : Math.sqrt(delta) * 2);
  };
  const handleTouchEnd = (): void => {
    if (touchStartY.current === null || isClosing) return;
    touchStartY.current = null;
    setIsDragging(false);
    setIsHeld(false);
    if (offset <= -SWIPE_CLOSE_THRESHOLD) {
      requestClose();
      return;
    }
    setOffset(0);
  };
  const handleTouchCancel = (): void => {
    touchStartY.current = null;
    setIsDragging(false);
    setIsHeld(false);
    setOffset(0);
  };

  const surfaceStyle: CSSProperties = {
    translate: `0 ${offset}px`,
    opacity: offset < 0 ? Math.max(0.3, 1 + offset / 120) : 1,
    touchAction: "pan-x",
  };

  return createPortal(
    <div className="lg-toast-shell">
      <div
        role={role}
        aria-live={popup.type === "success" ? "polite" : "assertive"}
        aria-atomic="true"
        data-tone={popup.type}
        data-closing={isClosing || undefined}
        data-dragging={isDragging || undefined}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        onMouseEnter={() => setIsHeld(true)}
        onMouseLeave={() => setIsHeld(false)}
        style={surfaceStyle}
        className="lg-toast"
      >
        <span className="lg-toast__icon" aria-hidden="true">
          <Icon size={18} strokeWidth={2.4} />
        </span>
        <div className="lg-toast__copy">
          <p className="lg-toast__title">{title}</p>
          <p className="lg-toast__message">{popup.message}</p>
        </div>
        <button
          type="button"
          aria-label={t("popup.close")}
          disabled={isClosing}
          onTouchStart={(event) => event.stopPropagation()}
          onTouchEnd={(event) => event.stopPropagation()}
          onClick={requestClose}
          className="lg-toast__close"
        >
          <X size={14} strokeWidth={2.6} />
        </button>
      </div>
    </div>,
    document.body,
  );
};

export default Popup;
