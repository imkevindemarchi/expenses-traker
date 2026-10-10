import { type ChangeEvent, type FC, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Plus, Search, X } from "lucide-react";

import "../styles/LiquidGlass.styles.css";

// components
import IconButton from "./IconButton.component";
import Input from "./Input.component";

// hooks
import { useTheme } from "../hooks";

interface IProps {
  title: string;
  ariaLabel?: string;
  placeholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onClick?: () => void;
  scrollToTop?: (behavior?: ScrollBehavior | undefined) => void;
}

const SCROLL_THRESHOLD = 40;
const SCROLL_RELEASE_THRESHOLD = 24;
const MOBILE_MEDIA_QUERY = "(max-width: 639px)";

const Header: FC<IProps> = ({
  title,
  ariaLabel,
  placeholder,
  searchValue,
  onSearchChange,
  onClick,
  scrollToTop,
}) => {
  const { theme } = useTheme();

  const [isCompact, setIsCompact] = useState<boolean>(false);
  const compactRef = useRef(false);
  const titleRef = useRef<HTMLButtonElement>(null);
  const previousTitleRectRef = useRef<DOMRect | null>(null);
  const titleAnimationRef = useRef<Animation | null>(null);

  const hasSearchInput: boolean =
    searchValue !== undefined && onSearchChange !== undefined;

  const hasSearchValue: boolean = Boolean(searchValue);

  const hasActionButton: boolean =
    ariaLabel !== undefined && onClick !== undefined;

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
    const mobileMediaQuery: MediaQueryList =
      window.matchMedia(MOBILE_MEDIA_QUERY);

    let animationFrameId: number | null = null;
    const updateCompactState = (): void => {
      const shouldBeCompact: boolean =
        mobileMediaQuery.matches && window.scrollY >
          (compactRef.current ? SCROLL_RELEASE_THRESHOLD : SCROLL_THRESHOLD);

      if (compactRef.current === shouldBeCompact) return;
      previousTitleRectRef.current = titleRef.current?.getBoundingClientRect() ?? null;
      compactRef.current = shouldBeCompact;
      setIsCompact(shouldBeCompact);
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
    mobileMediaQuery.addEventListener("change", updateCompactState);

    return (): void => {
      window.removeEventListener("scroll", scheduleCompactUpdate);
      mobileMediaQuery.removeEventListener("change", updateCompactState);
      if (animationFrameId !== null) window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  useLayoutEffect(() => {
    const button = titleRef.current;
    const previousRect = previousTitleRectRef.current;
    previousTitleRectRef.current = null;
    titleAnimationRef.current?.cancel();
    if (!button || !previousRect || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const nextRect = button.getBoundingClientRect();
    if (!nextRect.width || !nextRect.height) return;
    // Animate the visual difference after the layout changes, without animating layout itself.
    titleAnimationRef.current = button.animate([
      { transform: `translate3d(${previousRect.left - nextRect.left}px, ${previousRect.top - nextRect.top}px, 0) scale(${previousRect.width / nextRect.width}, ${previousRect.height / nextRect.height})` },
      { transform: "translate3d(0, 0, 0) scale(1)" },
    ], { duration: 320, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
    return () => titleAnimationRef.current?.cancel();
  }, [isCompact]);

  return (
    <div className="relative z-40 w-full">
      <div className="flex w-full flex-col">
        <div className="relative flex min-h-14 w-full items-center">
          <div
            className={`${
              isCompact
                ? "fixed left-1/2 top-[calc(env(safe-area-inset-top)+1.5rem)] z-90 flex h-14 max-w-[calc(100vw-11rem)] -translate-x-1/2 items-center justify-center sm:static sm:h-auto sm:max-w-none sm:translate-x-0"
                : "flex w-full items-center justify-center"
            }`}
          >
            <button
              ref={titleRef}
              type="button"
              onClick={handleTitleClick}
              aria-label={title}
              data-glass-theme={theme}
              className={`relative mx-auto w-fit max-w-full origin-top-left cursor-pointer overflow-hidden border px-5 text-center transition-[background-color,border-color,box-shadow] duration-300 ease-out focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:cursor-default ${
                isCompact
                  ? "glass-surface rounded-full"
                  : "rounded-none border-transparent"
              }`}
            >
              <span
                className={`relative z-10 block truncate text-center font-semibold capitalize text-primary !transition-none ${
                  isCompact
                    ? "max-w-full py-2 text-sm"
                    : "max-w-full py-3 text-2xl sm:text-3xl"
                }`}
              >
                {title}
              </span>
            </button>
          </div>
        </div>

        {hasControls && (
          <div className="mt-3 grid w-full grid-rows-[1fr]">
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
                      icon={<Search size={18} strokeWidth={1.8} />}
                      endIcon={
                        hasSearchValue ? (
                          <X size={17} strokeWidth={2} />
                        ) : undefined
                      }
                      onChange={handleSearchChange}
                      onEndIconClick={
                        hasSearchValue ? handleClearSearch : undefined
                      }
                      autoComplete="off"
                      autoFocus
                    />
                  </div>
                )}

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
      </div>
    </div>
  );
};

export default Header;
