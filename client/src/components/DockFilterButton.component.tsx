import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import FloatingButton from "./FloatingButton.component";
import "../styles/v2/FilterChips.styles.css";

const PHONE_QUERY = "(max-width: 767px)";

interface IProps {
  ariaLabel: string;
  icon: ReactNode;
  /** Filters applied: the button is tinted, like an active filter chip. */
  active?: boolean;
  /** The dialog the button opens is showing. */
  expanded?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

/**
 * A filter action that sits with the other filters, like the Alice & Kevin
 * list pages: beside the search field at the bottom on phones, in the filter
 * row under the title on wider screens (the slots of the Header), never in
 * the top toolbar with the page actions.
 */
export default function DockFilterButton({
  ariaLabel,
  icon,
  active = false,
  expanded,
  disabled = false,
  onClick,
}: IProps) {
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const [settled, setSettled] = useState(false);
  const [isPhone, setIsPhone] = useState(
    () => typeof window !== "undefined" && window.matchMedia(PHONE_QUERY).matches,
  );
  useEffect(() => {
    const query = window.matchMedia(PHONE_QUERY);
    const sync = (): void => setIsPhone(query.matches);
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  // The slots live in the Header, which can mount after this button.
  useEffect(() => {
    let frame = 0;
    const find = (): void => {
      frame = 0;
      const next = document.querySelector<HTMLElement>(
        isPhone ? ".lg-search-accessories" : ".lg-filter-rail-slot",
      );
      setSlot((previous) => (previous === next ? previous : next));
      if (next) setSettled(true);
    };
    const schedule = (): void => {
      if (!frame) frame = requestAnimationFrame(find);
    };
    find();
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    const settle = window.setTimeout(() => setSettled(true), 4000);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.clearTimeout(settle);
    };
  }, [isPhone]);

  if (slot)
    return createPortal(
      <div className="lg-sort">
        <button
          type="button"
          aria-label={ariaLabel}
          title={ariaLabel}
          aria-haspopup="dialog"
          aria-expanded={expanded}
          disabled={disabled}
          onClick={onClick}
          className="lg-chip lg-chip--round"
          data-open={expanded || undefined}
          data-active={active || undefined}
        >
          <span className="lg-chip__icon" aria-hidden="true">
            {icon}
          </span>
        </button>
      </div>,
      slot,
    );
  // Waiting for the Header: no flash in the top toolbar.
  if (!settled) return null;
  return (
    <FloatingButton
      alwaysVisibleOnMobile
      ariaLabel={ariaLabel}
      title={ariaLabel}
      icon={icon}
      disabled={disabled}
      aria-haspopup="dialog"
      aria-expanded={expanded}
      onClick={onClick}
    />
  );
}
