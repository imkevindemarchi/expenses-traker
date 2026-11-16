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

// assets
import { getLiquidGlassClass } from "../assets/constants";

// hooks
import { useTheme } from "../hooks";

// types
type TPopupType = "success" | "warning" | "error";
type TPopupState = { type: TPopupType; message: string; title?: string };

interface IProps {
  popup: TPopupState;
  isClosing: boolean;
  onClose: () => void;
}

/** Each kind of message: its icon, its title and its colour (Popup.styles.css). */
const POPUP_STYLES: Record<TPopupType, { icon: typeof CircleCheck; titleTranslationKey: string }> =
  {
    success: { icon: CircleCheck, titleTranslationKey: "popup.success" },
    warning: { icon: TriangleAlert, titleTranslationKey: "popup.warning" },
    error: { icon: CircleX, titleTranslationKey: "popup.error" },
  };

const SWIPE_CLOSE_THRESHOLD = 18;

/** Phones show popups at the bottom, above the tab bar (see System.styles.css). */
const isBottomPlacement = (): boolean => window.matchMedia("(max-width: 767px)").matches;

const Popup: FC<IProps> = ({ popup, isClosing: externallyClosing, onClose }) => {
  const [locallyClosing, setLocallyClosing] = useState(false);
  const isClosing = externallyClosing || locallyClosing;
  const closeCallback = useRef(onClose);
  useLayoutEffect(() => {
    closeCallback.current = onClose;
  }, [onClose]);
  const requestClose = () => {
    if (isClosing) return;
    touchStartYRef.current = null;
    setIsDragging(false);
    setLocallyClosing(true);
  };
  useEffect(() => {
    if (!locallyClosing) return;
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 200;
    const timer = window.setTimeout(() => closeCallback.current(), delay);
    return () => window.clearTimeout(timer);
  }, [locallyClosing]);
  const { t } = useTranslation();
  const { theme } = useTheme();

  const touchStartYRef = useRef<number | null>(null);

  const [translateY, setTranslateY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const style = POPUP_STYLES[popup.type];

  const Icon = style.icon;

  const defaultTitle: string = t(style.titleTranslationKey);
  const title: string = popup.title || defaultTitle;

  const role: "alert" | "status" = popup.type === "success" ? "status" : "alert";

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>): void => {
    if (isClosing) {
      return;
    }

    touchStartYRef.current = event.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>): void => {
    if (touchStartYRef.current === null || isClosing) {
      return;
    }

    const currentY: number = event.touches[0].clientY;
    const difference: number = currentY - touchStartYRef.current;

    // Phones: the popup sits above the tab bar, so it is swiped down to close.
    if (isBottomPlacement()) {
      setTranslateY(Math.max(0, difference));
      return;
    }

    // Il popup può essere trascinato solamente verso l'alto.
    setTranslateY(Math.min(0, difference));
  };

  const handleTouchEnd = (): void => {
    if (touchStartYRef.current === null || isClosing) {
      return;
    }

    touchStartYRef.current = null;
    setIsDragging(false);

    if (Math.abs(translateY) >= SWIPE_CLOSE_THRESHOLD) {
      requestClose();
      return;
    }

    setTranslateY(0);
  };

  const handleTouchCancel = (): void => {
    touchStartYRef.current = null;
    setIsDragging(false);
    setTranslateY(0);
  };

  const popupStyle: CSSProperties = {
    transform: `translate3d(0, ${translateY}px, 0)`,
    opacity: Math.max(0.35, 1 - Math.abs(translateY) / 150),
    touchAction: "pan-x pan-down",
  };

  return createPortal(
    <div className="popup-shell pointer-events-none fixed inset-x-3 top-20 z-9999 flex justify-center sm:inset-x-auto sm:right-5 sm:top-5 sm:justify-end">
      <div
        role={role}
        aria-live={popup.type === "success" ? "polite" : "assertive"}
        aria-atomic="true"
        data-tone={popup.type}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        style={popupStyle}
        className={`popup-surface ${
          isClosing ? "animate-popup-exit" : translateY === 0 ? "animate-popup-enter" : ""
        } ${
          isDragging && !isClosing ? "transition-none" : "transition-[transform,opacity] duration-300 ease-out"
        } ${getLiquidGlassClass(theme)} pointer-events-auto relative isolate flex w-full max-w-sm items-center gap-3 overflow-hidden border select-none sm:max-w-md`}
      >
        <span className="popup-surface__icon" aria-hidden="true">
          <Icon size={19} strokeWidth={2.4} />
        </span>

        <div className="popup-surface__copy">
          <h3 className="popup-surface__title">{title}</h3>
          <p className="popup-surface__message">{popup.message}</p>
        </div>

        <button
          type="button"
          aria-label={t("popup.close")}
          disabled={isClosing}
          onTouchStart={(event) => event.stopPropagation()}
          onTouchEnd={(event) => event.stopPropagation()}
          onClick={requestClose}
          className="popup-surface__close"
        >
          <X size={15} strokeWidth={2.4} />
        </button>
      </div>
    </div>,
    document.body,
  );
};

export default Popup;
