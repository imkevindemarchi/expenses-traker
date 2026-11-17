import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { ArrowDownUp, CircleCheck } from "lucide-react";
import { getLiquidGlassClass } from "../assets/constants";
import FloatingButton from "./FloatingButton.component";
import { useTheme } from "../hooks";
import { fitStaticPanel } from "../utils/fitStaticPanel";
import "../styles/v2/FilterChips.styles.css";
import type { TSelectOption } from "../types";
const PHONE_QUERY = "(max-width: 767px)";
interface IProps<TValue extends string> {
  alwaysVisibleOnMobile?: boolean;
  ariaLabel: string;
  icon: ReactNode;
  value: TValue;
  options: TSelectOption<TValue>[];
  optionCounts?: Partial<Record<TValue, number>>;
  isOpen: boolean;
  disabled?: boolean;
  placement?: "side" | "above";
  /** "sort" renders as a single pill with a menu; "filter" as a row of chips. */
  kind?: "filter" | "sort";
  /**
   * Filters only: the options shown as chips in the page's filter row. The
   * other options move to a menu behind a filter button (FloatingButton).
   */
  railValues?: TValue[];
  /** Tapping the selected chip again goes back to this value (e.g. "all"). */
  railResetValue?: TValue;
  /** Icon of the button that opens the additional filters. */
  menuIcon?: ReactNode;
  onToggle: () => void;
  onClose?: () => void;
  onChange: (value: TValue) => void;
}
const FilterFloatingMenu = <TValue extends string>({
  alwaysVisibleOnMobile = false,
  ariaLabel,
  icon,
  value,
  options,
  optionCounts,
  isOpen,
  disabled = false,
  placement = "above",
  kind = "filter",
  railValues,
  railResetValue,
  menuIcon,
  onToggle,
  onClose,
  onChange,
}: IProps<TValue>): ReactElement => {
  const { theme } = useTheme();
  const container = useRef<HTMLDivElement>(null),
    panel = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<CSSProperties>({});
  // v2: when the page header offers a slot, filters render as an inline row of
  // chips instead of a floating button with a pop-up menu.
  const [railSlot, setRailSlot] = useState<HTMLElement | null>(null);
  // Phones: the slot beside the bottom search field (Header).
  const [dockSlot, setDockSlot] = useState<HTMLElement | null>(null);
  const [isPhone, setIsPhone] = useState(
    () => typeof window !== "undefined" && window.matchMedia(PHONE_QUERY).matches,
  );
  useEffect(() => {
    const query = window.matchMedia(PHONE_QUERY);
    const sync = (): void => setIsPhone(query.matches);
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  // The slots live in the Header, which can mount after this component (lazy
  // route chunks in production). Watch the DOM until they appear — and keep
  // watching, since they are replaced on navigation — instead of polling for a
  // fixed number of frames, which left the button stuck in the top capsule.
  const [slotsSettled, setSlotsSettled] = useState(false);
  useEffect(() => {
    let frame = 0;
    const find = (): void => {
      frame = 0;
      const slot = document.querySelector<HTMLElement>(".lg-filter-rail-slot");
      const accessories = document.querySelector<HTMLElement>(".lg-search-accessories");
      setRailSlot((previous) => (previous === slot ? previous : slot));
      setDockSlot((previous) => (previous === accessories ? previous : accessories));
      // The Header is mounted (its search dock, if any, mounts with it).
      if (slot) setSlotsSettled(true);
    };
    const schedule = (): void => {
      if (!frame) frame = requestAnimationFrame(find);
    };
    find();
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    // A page without a Header: stop waiting and fall back to the button.
    const settle = window.setTimeout(() => setSlotsSettled(true), 4000);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.clearTimeout(settle);
    };
  }, []);
  // Sort and split filters become round buttons beside the search field on phones,
  // with every option in their menu (as in iOS 27).
  const inDock =
    isPhone &&
    dockSlot !== null &&
    (kind === "sort" || railValues !== undefined || railResetValue !== undefined);
  const sortInRail = kind === "sort" && railSlot !== null && !inDock;
  // Split filters: a few chips in the row, everything else in the menu.
  const isSplit = kind === "filter" && railSlot !== null && railValues !== undefined && !inDock;
  const railOptions = isSplit ? options.filter((option) => railValues.includes(option.value)) : [];
  // The reset value ("all") is reached by tapping the selected chip again, so
  // the menu only holds what has no chip; with nothing left there is no menu.
  const menuOptions = isSplit
    ? options.filter(
        (option) => !railValues.includes(option.value) && option.value !== railResetValue,
      )
    : options;
  // The reset value ("all") is not an active filter.
  // Long menus on phones: two compact columns instead of an endless list.
  const compactMenu = isPhone && menuOptions.length > 8;
  const isMenuValueSelected =
    isSplit && value !== railResetValue && menuOptions.some((option) => option.value === value);
  useLayoutEffect(() => {
    if (!isOpen) return;
    let frame = 0;
    const update = () => {
      if (!container.current) return;
      const viewport = window.visualViewport ?? {
        width: window.innerWidth,
        height: window.innerHeight,
        offsetLeft: 0,
        offsetTop: 0,
      };
      const anchorRect = container.current.getBoundingClientRect();
      // The height of the options themselves: the panel's own scrollHeight also
      // counts its decorations (the glass sheen overflows it by 25% above and
      // below), which left the menu floating far above its button.
      const list = panel.current?.firstElementChild as HTMLElement | null | undefined;
      const panelStyle = panel.current ? getComputedStyle(panel.current) : null;
      const chrome = panelStyle
        ? parseFloat(panelStyle.paddingTop) +
          parseFloat(panelStyle.paddingBottom) +
          parseFloat(panelStyle.borderTopWidth) +
          parseFloat(panelStyle.borderBottomWidth)
        : 0;
      const natural = list ? list.scrollHeight + chrome : menuOptions.length * 56 + 12;
      // Phones: the menu never fills the screen. It sits between the top of the
      // screen and its button (the dock) and scrolls inside when it is long.
      const viewportTop = viewport.offsetTop ?? 0;
      const roomAbove = anchorRect.top - viewportTop - 20;
      const roomBelow = viewportTop + viewport.height - anchorRect.bottom - 20;
      const cap = isPhone
        ? Math.max(
            180,
            Math.min(viewport.height * 0.6, inDock ? roomAbove : Math.max(roomAbove, roomBelow)),
          )
        : viewport.height - 24;
      const height = Math.min(natural, cap);
      const nextPosition = fitStaticPanel(
        anchorRect,
        isPhone && menuOptions.length > 8 ? 400 : 360,
        height,
        viewport,
        inDock
          ? "above"
          : sortInRail || (isSplit && anchorRect.top < viewport.height / 2)
            ? "below"
            : placement === "side" && viewport.width < 640
              ? "side"
              : "above",
      );
      const anchor = container.current.getBoundingClientRect();
      const originX = Math.max(
        0,
        Math.min(nextPosition.width, anchor.left + anchor.width / 2 - nextPosition.left),
      );
      const originY = Math.max(
        0,
        Math.min(height, anchor.top + anchor.height / 2 - nextPosition.top),
      );
      const positioned = {
        ...nextPosition,
        transformOrigin: `${originX}px ${originY}px`,
        maxHeight: cap,
        "--menu-close-offset": nextPosition.top < anchor.top ? "8px" : "-8px",
      } as CSSProperties;
      setPosition((previous) =>
        previous.left === positioned.left &&
        previous.top === positioned.top &&
        previous.width === positioned.width &&
        previous.maxHeight === positioned.maxHeight &&
        previous.transformOrigin === positioned.transformOrigin
          ? previous
          : positioned,
      );
    };
    const close = () => {
      (onClose ?? onToggle)();
    };
    const outside = (event: PointerEvent) => {
      if (
        !container.current?.contains(event.target as Node) &&
        !panel.current?.contains(event.target as Node)
      )
        close();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        close();
        container.current?.querySelector("button")?.focus();
      }
    };
    const scheduleUpdate = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    };
    update();
    // The button can move while the menu is open without any scroll or resize
    // event: the search dock slides when the tab bar hides or comes back, the
    // toolbar capsule collapses its other actions, the keyboard opens. Follow
    // it every frame, so the menu always opens (and stays) next to its button.
    let tracking = 0;
    let anchorKey = "";
    const track = () => {
      tracking = requestAnimationFrame(track);
      const rect = container.current?.getBoundingClientRect();
      if (!rect) return;
      const key = `${rect.left}|${rect.top}|${rect.width}|${rect.height}`;
      if (key === anchorKey) return;
      anchorKey = key;
      update();
    };
    tracking = requestAnimationFrame(track);
    const observer = new ResizeObserver(scheduleUpdate);
    if (panel.current) observer.observe(panel.current);
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("scroll", scheduleUpdate, true);
    window.visualViewport?.addEventListener("resize", scheduleUpdate);
    window.visualViewport?.addEventListener("scroll", scheduleUpdate);
    document.addEventListener("pointerdown", outside, true);
    document.addEventListener("keydown", escape);
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(tracking);
      observer.disconnect();
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("scroll", scheduleUpdate, true);
      window.visualViewport?.removeEventListener("resize", scheduleUpdate);
      window.visualViewport?.removeEventListener("scroll", scheduleUpdate);
      document.removeEventListener("pointerdown", outside, true);
      document.removeEventListener("keydown", escape);
    };
  }, [isOpen, menuOptions.length, placement, sortInRail, isSplit, inDock, isPhone, onClose, onToggle]);
  const panelNode = createPortal(
    <div
      ref={panel}
      data-floating-menu
      style={{
        maxHeight: "calc(100dvh - 24px)",
        ...position,
        transform: isOpen
          ? "translateY(0) scale(1)"
          : "translateY(var(--menu-close-offset, 8px)) scale(0.96)",
        overflowY: "auto",
        overscrollBehavior: "contain",
      }}
      aria-hidden={!isOpen}
      inert={!isOpen}
      className={`liquid-glass-panel ${isOpen ? "liquid-glass-panel--open pointer-events-auto opacity-100" : "liquid-glass-panel--closed pointer-events-none opacity-0"} fixed z-9999 overflow-hidden rounded-[22px] border p-1.5 transition-[background-color,border-color,box-shadow,opacity,transform] duration-300 ${getLiquidGlassClass(theme)} ${theme === "light" ? "border-white/70 bg-white/50 shadow-[0_18px_50px_rgba(15,23,42,0.16),inset_0_1px_0_rgba(255,255,255,0.9)]" : "border-white/10 bg-black/70 shadow-[0_20px_55px_rgba(0,0,0,0.48),inset_0_1px_0_rgba(255,255,255,0.08)]"}`}
    >
      <div
        role="menu"
        aria-label={ariaLabel}
        className={`grid gap-1 ${compactMenu ? "grid-cols-2" : ""}`}
      >
        {menuOptions.map((option) => {
          const selected = option.value === value,
            count = optionCounts?.[option.value];
          return (
            <button
              key={option.value}
              type="button"
              role="menuitemradio"
              aria-checked={selected}
              title={option.label}
              onClick={() => onChange(option.value)}
              style={selected && option.color ? { backgroundColor: option.color } : undefined}
              className={`flex ${compactMenu ? "min-h-10 gap-2 px-2 py-1.5 text-[13px]" : "min-h-11 gap-3 px-3 py-2"} w-full cursor-pointer items-center rounded-2xl text-left text-sm font-medium transition-colors ${selected ? `${option.color ? "" : "bg-primary"} text-white` : theme === "light" ? "text-black hover:bg-black/5" : "text-white hover:bg-white/7"}`}
            >
              {option.icon && (
                <span
                  style={
                    !selected && option.color
                      ? {
                          backgroundColor: `color-mix(in srgb, ${option.color} 14%, transparent)`,
                          color: option.color,
                        }
                      : undefined
                  }
                  className={`flex ${compactMenu ? "size-7" : "size-8"} shrink-0 items-center justify-center rounded-xl ${selected ? "bg-white/15 text-white" : option.color ? "" : "bg-primary/10 text-primary"}`}
                >
                  {option.icon}
                </span>
              )}
              <span className="min-w-0 flex-1 whitespace-normal break-words leading-snug">
                {option.label}
              </span>
              {count !== undefined && (
                <span
                  className={`flex min-w-8 shrink-0 items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${selected ? "bg-white/18 text-white" : "bg-primary/10 text-primary"}`}
                >
                  {count}
                </span>
              )}
              {selected && <CircleCheck size={17} strokeWidth={2.2} className="shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>,
    document.body,
  );

  // Phones: a dock-bound menu waits for the search dock rather than flashing
  // into the top capsule (which would widen it and push it over the title).
  const dockBound =
    kind === "sort" || railValues !== undefined || railResetValue !== undefined;
  if (isPhone && dockBound && !dockSlot && !slotsSettled) return <></>;

  if (inDock && dockSlot) {
    const selectedOption = options.find((option) => option.value === value);
    const selectedLabel = selectedOption?.label ?? "";
    const isFiltering =
      kind === "filter" && railResetValue !== undefined && value !== railResetValue;
    return (
      <>
        {createPortal(
          <div ref={container} className="lg-sort" data-kind={kind}>
            <button
              type="button"
              aria-label={`${ariaLabel}: ${selectedLabel}`}
              title={selectedLabel || ariaLabel}
              aria-haspopup="menu"
              aria-expanded={isOpen}
              disabled={disabled}
              onClick={onToggle}
              className="lg-chip lg-chip--round"
              data-open={isOpen || undefined}
              data-active={isFiltering || undefined}
            >
              {kind === "sort" ? (
                <ArrowDownUp className="lg-chip__icon" aria-hidden="true" />
              ) : (
                <span
                  className="lg-chip__icon"
                  style={selectedOption?.color ? { color: selectedOption.color } : undefined}
                  aria-hidden="true"
                >
                  {menuIcon ?? icon}
                </span>
              )}
            </button>
          </div>,
          dockSlot,
        )}
        {panelNode}
      </>
    );
  }

  if (sortInRail && railSlot) {
    return (
      <>
        {createPortal(
          <div ref={container} className="lg-sort">
            <button
              type="button"
              aria-label={`${ariaLabel}: ${options.find((option) => option.value === value)?.label ?? ""}`}
              title={options.find((option) => option.value === value)?.label ?? ariaLabel}
              aria-haspopup="menu"
              aria-expanded={isOpen}
              disabled={disabled}
              onClick={onToggle}
              className="lg-chip lg-chip--round"
              data-open={isOpen || undefined}
            >
              <ArrowDownUp className="lg-chip__icon" aria-hidden="true" />
            </button>
          </div>,
          railSlot,
        )}
        {panelNode}
      </>
    );
  }

  if (isSplit && railSlot) {
    return (
      <>
        {railOptions.length > 0 &&
          createPortal(
            <div
              role="radiogroup"
              aria-label={ariaLabel}
              className="lg-filter-rail"
              data-disabled={disabled || undefined}
            >
              {railOptions.map((option) => {
                const selected = option.value === value;
                const count = optionCounts?.[option.value];
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    disabled={disabled}
                    onClick={() => {
                      if (!selected) onChange(option.value);
                      else if (railResetValue !== undefined) onChange(railResetValue);
                    }}
                    className="lg-chip"
                    style={
                      option.color ? ({ "--lg-tint": option.color } as CSSProperties) : undefined
                    }
                    data-selected={selected || undefined}
                  >
                    {option.icon && <span className="lg-chip__icon">{option.icon}</span>}
                    <span className="lg-chip__label">{option.label}</span>
                    {count !== undefined && <span className="lg-chip__count">{count}</span>}
                  </button>
                );
              })}
            </div>,
            railSlot,
          )}
        {menuOptions.length > 0 &&
          createPortal(
            <div ref={container} className="lg-sort">
              <button
                type="button"
                aria-label={ariaLabel}
                title={ariaLabel}
                aria-haspopup="menu"
                aria-expanded={isOpen}
                disabled={disabled}
                onClick={onToggle}
                className="lg-chip lg-chip--round"
                data-open={isOpen || undefined}
                data-active={isMenuValueSelected || undefined}
              >
                <span className="lg-chip__icon" aria-hidden="true">
                  {menuIcon ?? icon}
                </span>
              </button>
            </div>,
            railSlot,
          )}
        {panelNode}
      </>
    );
  }

  if (railSlot && kind === "filter") {
    return createPortal(
      <div
        role="radiogroup"
        aria-label={ariaLabel}
        className="lg-filter-rail"
        data-disabled={disabled || undefined}
      >
        <span className="lg-filter-rail__glyph" aria-hidden="true">
          {icon}
        </span>
        {options.map((option) => {
          const selected = option.value === value;
          const count = optionCounts?.[option.value];
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => {
                if (!selected) onChange(option.value);
              }}
              className="lg-chip"
              style={option.color ? ({ "--lg-tint": option.color } as CSSProperties) : undefined}
              data-selected={selected || undefined}
            >
              {option.icon && <span className="lg-chip__icon">{option.icon}</span>}
              <span className="lg-chip__label">{option.label}</span>
              {count !== undefined && <span className="lg-chip__count">{count}</span>}
            </button>
          );
        })}
      </div>,
      railSlot,
    );
  }

  return (
    <div ref={container} className="relative">
      <FloatingButton
        alwaysVisibleOnMobile={alwaysVisibleOnMobile || isOpen}
        ariaLabel={ariaLabel}
        icon={icon}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={onToggle}
        className={isOpen ? "ring-2 ring-primary/35" : ""}
      />
      {panelNode}
    </div>
  );
};
export default FilterFloatingMenu;
