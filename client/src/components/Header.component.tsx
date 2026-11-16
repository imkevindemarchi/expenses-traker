import {
  type ChangeEvent,
  type FC,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Plus, Search, X } from "lucide-react";

import "../styles/LiquidGlass.styles.css";

// components
import IconButton from "./IconButton.component";
import Input from "./Input.component";

// hooks
import { useTheme } from "../hooks";

interface IProps {
  title: string;
  subtitle?: ReactNode;
  recordAction?: ReactNode;
  recordAvatar?: ReactNode;
  recordStatus?: ReactNode;
  ariaLabel?: string;
  placeholder?: string;
  searchValue?: string;
  searchDisabled?: boolean;
  onSearchChange?: (value: string) => void;
  onClick?: () => void;
  scrollToTop?: (behavior?: ScrollBehavior | undefined) => void;
}

const SCROLL_THRESHOLD = 40;
/** Same motion as Alice & Kevin 1.0: one quick, soft-landing transform. */
const TITLE_MORPH_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
const TITLE_MORPH_DURATION = 320;

type TMorphHandle = { cancel: () => void };

/**
 * Alice & Kevin 1.0 title motion (FLIP): the title that appears starts
 * exactly where the other one was — same position and size — and slides and
 * scales into its own place, pill included, so the title itself seems to
 * travel to the toolbar and back. The one that leaves disappears at once.
 * The record action (copy) travels the same way beside it.
 */
const flip = (from: HTMLElement | null, to: HTMLElement | null): Animation | null => {
  if (!from || !to || typeof to.animate !== "function") return null;
  const previous = from.getBoundingClientRect();
  const next = to.getBoundingClientRect();
  if (!previous.width || !previous.height || !next.width || !next.height) return null;
  return to.animate(
    [
      {
        transformOrigin: "0 0",
        opacity: 1,
        visibility: "visible",
        transform: `translate3d(${previous.left - next.left}px, ${previous.top - next.top}px, 0) scale(${previous.width / next.width}, ${previous.height / next.height})`,
      },
      { transformOrigin: "0 0", opacity: 1, visibility: "visible", transform: "translate3d(0, 0, 0) scale(1)" },
    ],
    { duration: TITLE_MORPH_DURATION, easing: TITLE_MORPH_EASING },
  );
};

const morphTitle = ({
  from,
  to,
  fromAction,
  toAction,
}: {
  from: HTMLElement | null;
  to: HTMLElement | null;
  fromAction?: HTMLElement | null;
  toAction?: HTMLElement | null;
}): TMorphHandle | null => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
  const animations: Animation[] = [];
  const title = flip(from, to);
  if (!title) return null;
  animations.push(title);
  // The title that leaves is gone at once: only one title is ever on screen.
  if (from) animations.push(from.animate([{ opacity: 0 }, { opacity: 0 }], { duration: TITLE_MORPH_DURATION }));
  const action = flip(fromAction ?? null, toAction ?? null);
  if (action) animations.push(action);
  if (fromAction)
    animations.push(fromAction.animate([{ opacity: 0 }, { opacity: 0 }], { duration: TITLE_MORPH_DURATION }));
  return { cancel: () => animations.forEach((animation) => animation.cancel()) };
};
const SCROLL_RELEASE_THRESHOLD = 24;
const MOBILE_MEDIA_QUERY = "(max-width: 639px)";

const Header: FC<IProps> = ({
  title,
  subtitle,
  recordAction,
  recordAvatar,
  recordStatus,
  ariaLabel,
  placeholder,
  searchValue,
  searchDisabled = false,
  onSearchChange,
  onClick,
  scrollToTop,
}) => {
  const { theme } = useTheme();
  const hasRecordContent = Boolean(subtitle || recordAction);

  const [isCompact, setIsCompact] = useState<boolean>(false);
  const compactRef = useRef(false);
  const previousCompactRef = useRef(false);
  const inlinePillRef = useRef<HTMLButtonElement>(null);
  const largePillRef = useRef<HTMLButtonElement>(null);
  const largeActionRef = useRef<HTMLDivElement>(null);
  const inlineActionRef = useRef<HTMLDivElement>(null);
  const morphRef = useRef<TMorphHandle | null>(null);
  // Phones only: the inline (pinned) title lives in the toolbar row.
  const [isPhone, setIsPhone] = useState<boolean>(
    () => typeof window !== "undefined" && window.matchMedia(MOBILE_MEDIA_QUERY).matches,
  );

  const hasSearchInput: boolean = searchValue !== undefined && onSearchChange !== undefined;

  const hasSearchValue: boolean = Boolean(searchValue);

  const hasActionButton: boolean = ariaLabel !== undefined && onClick !== undefined;

  const hasControls: boolean = hasSearchInput || hasActionButton;

  const handleTitleClick = (): void => {
    if (scrollToTop) {
      scrollToTop("smooth");
      return;
    }

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onSearchChange?.(event.target.value);
  };

  const handleClearSearch = (): void => {
    onSearchChange?.("");
  };

  useEffect(() => {
    const mobileMediaQuery: MediaQueryList = window.matchMedia(MOBILE_MEDIA_QUERY);

    let animationFrameId: number | null = null;
    const updateCompactState = (): void => {
      const shouldBeCompact: boolean =
        mobileMediaQuery.matches &&
        window.scrollY > (compactRef.current ? SCROLL_RELEASE_THRESHOLD : SCROLL_THRESHOLD);

      if (compactRef.current === shouldBeCompact) return;
      compactRef.current = shouldBeCompact;
      setIsCompact(shouldBeCompact);
    };
    const handleMediaChange = (): void => {
      setIsPhone(mobileMediaQuery.matches);
      updateCompactState();
    };

    const scheduleCompactUpdate = (): void => {
      if (animationFrameId !== null) return;
      animationFrameId = window.requestAnimationFrame(() => {
        animationFrameId = null;
        updateCompactState();
      });
    };

    updateCompactState();

    window.addEventListener("scroll", scheduleCompactUpdate, {
      passive: true,
    });
    mobileMediaQuery.addEventListener("change", handleMediaChange);

    return (): void => {
      window.removeEventListener("scroll", scheduleCompactUpdate);
      mobileMediaQuery.removeEventListener("change", handleMediaChange);
      if (animationFrameId !== null) window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // The title that appears travels from the one that disappears.
  useLayoutEffect(() => {
    if (previousCompactRef.current === isCompact) return;
    previousCompactRef.current = isCompact;
    morphRef.current?.cancel();
    morphRef.current = isCompact
      ? morphTitle({
          from: largePillRef.current,
          to: inlinePillRef.current,
          fromAction: largeActionRef.current,
          toAction: inlineActionRef.current,
        })
      : morphTitle({
          from: inlinePillRef.current,
          to: largePillRef.current,
          fromAction: inlineActionRef.current,
          toAction: largeActionRef.current,
        });
  }, [isCompact]);

  useEffect(() => (): void => morphRef.current?.cancel(), []);

  /**
   * The page title. Two copies, neither of which ever changes size or moves in
   * the layout: the large title stays in the page and fades out as it reaches
   * the toolbar, while the inline title (phones) is always mounted in the
   * toolbar row and fades/settles in. Only opacity and transform change, on the
   * compositor (Toolbar.styles.css → "Title crossfade").
   */
  const renderTitle = ({ compact, hidden }: { compact: boolean; hidden: boolean }) => (
    <button
      ref={compact ? inlinePillRef : largePillRef}
      type="button"
      onClick={handleTitleClick}
      aria-label={title}
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : undefined}
      data-glass-theme={theme}
      data-ui-compact={compact}
      data-lg-hidden={hidden || undefined}
      className={`ui-page-heading lg-title relative mx-auto w-fit max-w-full cursor-pointer overflow-hidden border px-5 text-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:cursor-default ${
        compact ? "glass-surface rounded-full" : "rounded-none border-transparent"
      }`}
    >
      <span
        role={hasRecordContent && !compact ? "heading" : undefined}
        aria-level={hasRecordContent && !compact ? 1 : undefined}
        className={`ui-page-title relative z-10 block truncate text-center font-semibold capitalize text-primary !transition-none ${
          compact ? "max-w-full py-2 text-sm" : "max-w-full py-3 text-2xl sm:text-3xl"
        }`}
      >
        {title}
      </span>
    </button>
  );

  return (
    <div
      className={`lg-header relative w-full ${hasRecordContent ? "record-header" : ""} ${isCompact ? "z-60" : "z-40"}`}
    >
      <div className="lg-header__inner flex w-full flex-col">
        <div
          className={`relative flex min-h-14 w-full items-center ${hasRecordContent ? "record-header-slot" : ""}`}
        >
          <div className="flex w-full items-center justify-center">
            <div
              data-glass-theme={theme}
              className={
                hasRecordContent
                  ? `record-header-shell ${recordAvatar ? "has-record-avatar" : ""}`
                  : "contents"
              }
            >
              {recordAvatar && (
                <div className="record-header-avatar" aria-hidden="true">
                  {recordAvatar}
                </div>
              )}
              {renderTitle({ compact: false, hidden: isCompact })}
              {hasRecordContent && (
                <div className="record-header-subtitle">
                  {subtitle}
                  {recordStatus && <span className="record-header-status">{recordStatus}</span>}
                </div>
              )}
              {recordAction && (
                <div
                  ref={largeActionRef}
                  className="record-header-action lg-title-fade"
                  data-lg-hidden={isCompact || undefined}
                  aria-hidden={isCompact || undefined}
                  inert={isCompact || undefined}
                >
                  {recordAction}
                </div>
              )}
            </div>
          </div>

          {/* Phones: the inline title in the toolbar row. Always mounted, so
              showing it is a pure opacity/transform transition. */}
          {isPhone && (
            <div
              className="lg-title-bar pointer-events-none fixed left-1/2 top-[calc(var(--crm-offset,0px)+var(--app-safe-top)+1.5rem)] z-90 flex h-14 max-w-[calc(100vw-11rem)] -translate-x-1/2 items-center justify-center sm:hidden"
              data-lg-hidden={!isCompact || undefined}
              inert={!isCompact || undefined}
            >
              <div className="contents">
                {renderTitle({ compact: true, hidden: !isCompact })}
                {/* The record's action (copy) stays reachable beside the pinned name. */}
                {recordAction && (
                  <div
                    ref={inlineActionRef}
                    className="lg-inline-action lg-title-fade"
                    data-lg-hidden={!isCompact || undefined}
                  >
                    {recordAction}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {hasControls && (
          <div
            className={`mt-3 grid w-full grid-rows-[1fr] ${hasSearchInput ? "lg-search-dock" : ""}`}
          >
            <div className="min-h-0 overflow-visible">
              <div
                className={`flex w-full items-center gap-4 pb-1 ${
                  hasSearchInput ? "" : "justify-end"
                }`}
              >
                {hasSearchInput && (
                  <div className="w-full sm:w-96">
                    <Input
                      id="management-search"
                      name="management-search"
                      type="text"
                      placeholder={placeholder}
                      value={searchValue}
                      disabled={searchDisabled}
                      icon={<Search size={18} strokeWidth={1.8} />}
                      endIcon={hasSearchValue ? <X size={17} strokeWidth={2} /> : undefined}
                      onChange={handleSearchChange}
                      onEndIconClick={hasSearchValue ? handleClearSearch : undefined}
                      autoComplete="off"
                      autoFocus={!searchDisabled}
                    />
                  </div>
                )}

                {/* Phones: sort and filter buttons sit beside the search field (FilterFloatingMenu). */}
                {hasSearchInput && <div className="lg-search-accessories" />}

                {hasActionButton && (
                  <IconButton
                    icon={<Plus size={20} strokeWidth={1.8} />}
                    ariaLabel={ariaLabel ?? ""}
                    onClick={onClick}
                    rotateOnHover
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Filters on this page render here as a row of chips (see FilterFloatingMenu). */}
        {!hasRecordContent && <div className="lg-filter-rail-slot" />}
      </div>
    </div>
  );
};

export default Header;
