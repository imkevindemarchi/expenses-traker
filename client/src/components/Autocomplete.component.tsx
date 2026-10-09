import {SkeletonBlock} from './LoadingSkeleton.component';
import {
  type ChangeEvent,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

// assets
import { getLiquidGlassClass } from "../assets/constants";

// components
import Button from "./Button.component";
import Input from "./Input.component";

// hooks
import { useTheme } from "../hooks";

interface IProps<TOption> {
  id?: string;
  name?: string;
  label?: string;
  value: TOption | null;
  options: TOption[];
  icon?: ReactNode;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  loadingMessage?: string;
  error?: string;
  disabled?: boolean;
  isLoading?: boolean;
  clearable?: boolean;
  openUpwardOnMobile?: boolean;
  getOptionKey: (option: TOption) => string;
  getOptionLabel: (option: TOption) => string;
  getOptionDescription?: (option: TOption) => string | undefined;
  getOptionIcon?: (option: TOption) => ReactNode;
  onSearchChange?: (value: string) => void;
  onChange: (value: TOption | null) => void;
}

const VIEWPORT_PADDING = 12;
const MENU_GAP = 8;
const MENU_MAX_HEIGHT = 320;
const MENU_MIN_WIDTH = 320;
const MENU_ADDITIONAL_WIDTH = 96;

const Autocomplete = <TOption,>({
  id,
  name,
  label,
  value,
  options,
  icon,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  loadingMessage,
  error,
  disabled = false,
  isLoading = false,
  clearable = true,
  openUpwardOnMobile = false,
  getOptionKey,
  getOptionLabel,
  getOptionDescription,
  getOptionIcon,
  onSearchChange,
  onChange,
}: IProps<TOption>): ReactElement => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const resolvedPlaceholder: string =
    placeholder ?? t("autocomplete.placeholder");
  const resolvedSearchPlaceholder: string =
    searchPlaceholder ?? t("autocomplete.searchPlaceholder");
  const resolvedEmptyMessage: string =
    emptyMessage ?? t("autocomplete.emptyMessage");
  const resolvedLoadingMessage: string =
    loadingMessage ?? t("autocomplete.loadingMessage");

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchValue, setSearchValue] = useState<string>("");
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [isMenuAbove, setIsMenuAbove] = useState<boolean>(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const [menuOrigin, setMenuOrigin] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const autocompleteId: string = id || name || label || "autocomplete";
  const selectedLabel: string = value ? getOptionLabel(value) : "";
  const displayedValue: string = searchValue || selectedLabel;
  const normalizedSearch: string = searchValue.trim().toLowerCase();

  const visibleOptions: TOption[] = useMemo((): TOption[] => {
    if (onSearchChange || !normalizedSearch) {
      return options;
    }

    return options.filter((option: TOption): boolean => {
      const optionLabel: string = getOptionLabel(option).toLowerCase();
      const optionDescription: string =
        getOptionDescription?.(option)?.toLowerCase() ?? "";

      return (
        optionLabel.includes(normalizedSearch) ||
        optionDescription.includes(normalizedSearch)
      );
    });
  }, [
    getOptionDescription,
    getOptionLabel,
    normalizedSearch,
    onSearchChange,
    options,
  ]);

  const getInputElement = useCallback((): HTMLInputElement | null => {
    return document.getElementById(autocompleteId) as HTMLInputElement | null;
  }, [autocompleteId]);

  const updateMenuPosition = useCallback((): void => {
    if (!triggerRef.current) {
      return;
    }

    const triggerRect: DOMRect = triggerRef.current.getBoundingClientRect();
    const isMobile: boolean = window.innerWidth < 640;
    const shouldOpenAbove: boolean = openUpwardOnMobile && isMobile;

    const preferredWidth: number = Math.max(
      triggerRect.width + MENU_ADDITIONAL_WIDTH,
      MENU_MIN_WIDTH,
    );

    const availableWidth: number = window.innerWidth - VIEWPORT_PADDING * 2;
    const menuWidth: number = Math.min(preferredWidth, availableWidth);

    const menuHeight: number = Math.min(
      menuRef.current?.scrollHeight ?? MENU_MAX_HEIGHT,
      MENU_MAX_HEIGHT,
    );

    const centeredLeft: number =
      triggerRect.left + triggerRect.width / 2 - menuWidth / 2;

    const clampedLeft: number = Math.min(
      Math.max(centeredLeft, VIEWPORT_PADDING),
      window.innerWidth - menuWidth - VIEWPORT_PADDING,
    );

    const preferredTop: number = shouldOpenAbove
      ? triggerRect.top - menuHeight - MENU_GAP
      : triggerRect.bottom + MENU_GAP;

    const clampedTop: number = Math.min(
      Math.max(preferredTop, VIEWPORT_PADDING),
      window.innerHeight - menuHeight - VIEWPORT_PADDING,
    );

    const triggerCenterX: number = triggerRect.left + triggerRect.width / 2;

    setIsMenuAbove(shouldOpenAbove);
    setMenuOrigin({
      x: Math.min(Math.max(triggerCenterX - clampedLeft, 0), menuWidth),
      y: shouldOpenAbove ? menuHeight : 0,
    });
    setMenuStyle({
      left: clampedLeft,
      top: clampedTop,
      width: menuWidth,
    });
  }, [openUpwardOnMobile]);

  const openMenu = useCallback((): void => {
    if (disabled) {
      return;
    }

    updateMenuPosition();
    setIsOpen(true);
    setActiveIndex(-1);

    window.requestAnimationFrame((): void => {
      const inputElement: HTMLInputElement | null = getInputElement();

      inputElement?.focus();

      if (selectedLabel && !searchValue) {
        inputElement?.select();
      }
    });
  }, [
    disabled,
    getInputElement,
    searchValue,
    selectedLabel,
    updateMenuPosition,
  ]);

  const closeMenu = useCallback((): void => {
    setIsOpen(false);
    setActiveIndex(-1);
    setSearchValue("");
    onSearchChange?.("");
  }, [onSearchChange]);

  const handleSearchChange = (nextValue: string): void => {
    if (value) {
      onChange(null);
    }

    setSearchValue(nextValue);
    setActiveIndex(-1);
    onSearchChange?.(nextValue);

    if (!isOpen) {
      setIsOpen(true);
      window.requestAnimationFrame(updateMenuPosition);
    }
  };

  const handleOptionSelect = (option: TOption): void => {
    onChange(option);
    setSearchValue("");
    onSearchChange?.("");
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleClear = (): void => {
    if (disabled) {
      return;
    }

    onChange(null);
    setSearchValue("");
    onSearchChange?.("");
    setActiveIndex(-1);

    window.requestAnimationFrame((): void => {
      getInputElement()?.focus();
      updateMenuPosition();
    });
  };

  const handleEndIconClick = (): void => {
    if (clearable && displayedValue) {
      handleClear();
      return;
    }

    if (isOpen) {
      closeMenu();
      return;
    }

    openMenu();
  };

  const handleInputClick = (): void => {
    if (!isOpen) {
      openMenu();
    }
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
      getInputElement()?.blur();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();

      if (!isOpen) {
        openMenu();
      }

      setActiveIndex((previousIndex: number): number => {
        if (visibleOptions.length === 0) {
          return -1;
        }

        return previousIndex >= visibleOptions.length - 1
          ? 0
          : previousIndex + 1;
      });

      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      if (!isOpen) {
        openMenu();
      }

      setActiveIndex((previousIndex: number): number => {
        if (visibleOptions.length === 0) {
          return -1;
        }

        return previousIndex <= 0
          ? visibleOptions.length - 1
          : previousIndex - 1;
      });

      return;
    }

    if (event.key === "Enter") {
      if (!isOpen) {
        event.preventDefault();
        openMenu();
        return;
      }

      const normalizedActiveIndex: number =
        activeIndex >= 0 && activeIndex < visibleOptions.length
          ? activeIndex
          : visibleOptions.length === 1
            ? 0
            : -1;

      if (normalizedActiveIndex >= 0) {
        event.preventDefault();
        handleOptionSelect(visibleOptions[normalizedActiveIndex]);
      }
    }
  };

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent): void => {
      const target: Node = event.target as Node;

      if (
        isOpen &&
        !containerRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        closeMenu();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return (): void => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [closeMenu, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleViewportChange = (): void => {
      updateMenuPosition();
    };

    window.requestAnimationFrame(handleViewportChange);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return (): void => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [isOpen, updateMenuPosition]);

  return (
    <>
      <div ref={containerRef} className="w-full">
        <div ref={triggerRef} className="relative w-full">
          <Input
            id={autocompleteId}
            name={name}
            type="text"
            label={label}
            placeholder={
              isOpen ? resolvedSearchPlaceholder : resolvedPlaceholder
            }
            value={displayedValue}
            icon={
              icon ??
              (value ? getOptionIcon?.(value) : undefined) ?? (
                <Search size={18} strokeWidth={1.8} />
              )
            }
            endIcon={
              clearable && displayedValue ? (
                <X size={17} strokeWidth={2} />
              ) : (
                <ChevronDown
                  size={17}
                  strokeWidth={2.1}
                  className={`transition-transform duration-300 ${
                    isOpen ? "rotate-180 text-primary" : ""
                  }`}
                />
              )
            }
            error={error}
            disabled={disabled}
            autoComplete="off"
            role="combobox"
            aria-autocomplete="list"
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-controls={`${autocompleteId}-listbox`}
            onFocus={openMenu}
            onClick={handleInputClick}
            onChange={(event: ChangeEvent<HTMLInputElement>): void =>
              handleSearchChange(event.target.value)
            }
            onKeyDown={handleInputKeyDown}
            onEndIconClick={handleEndIconClick}
          />
        </div>
      </div>

      {createPortal(
        <div
          ref={menuRef}
          style={{
            ...menuStyle,
            transform: isOpen
              ? "translateY(0) scale(1)"
              : `translateY(${isMenuAbove ? "8px" : "-8px"}) scale(0.96)`,
            transformOrigin: `${menuOrigin.x}px ${menuOrigin.y}px`,
          }}
          className={`liquid-glass-panel ${isOpen ? "liquid-glass-panel--open" : "liquid-glass-panel--closed"} fixed z-9999 isolate overflow-hidden border p-1.5 transition-[color,background-color,border-color,box-shadow,opacity,transform,translate,scale,rotate] duration-400 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-[transform,opacity] ${getLiquidGlassClass(
            theme,
          )} ${theme === "light" ? "border-black/7" : "border-white/8"} ${
            isOpen
              ? "pointer-events-auto rounded-[22px] opacity-100"
              : "pointer-events-none rounded-[22px] opacity-0"
          }`}
        >
          <div
            id={`${autocompleteId}-listbox`}
            role="listbox"
            aria-label={label || resolvedPlaceholder}
            className="relative z-10 flex max-h-72 flex-col gap-1 overflow-y-auto overscroll-contain"
          >
            {isLoading ? (
              <div role="status" aria-label={resolvedLoadingMessage} className="skeleton-stack p-4">{[0,1,2].map(index=><SkeletonBlock key={index} className="skeleton-bar"/>)}</div>
            ) : visibleOptions.length === 0 ? (
              <div
                className={`flex min-h-24 items-center justify-center rounded-2xl px-4 text-center text-sm ${
                  theme === "light" ? "text-darkgray" : "text-gray"
                }`}
              >
                {resolvedEmptyMessage}
              </div>
            ) : (
              visibleOptions.map((option: TOption, index: number) => {
                const optionKey: string = getOptionKey(option);
                const optionLabel: string = getOptionLabel(option);
                const optionDescription: string | undefined =
                  getOptionDescription?.(option);
                const optionIcon: ReactNode = getOptionIcon?.(option);
                const isSelected: boolean =
                  value !== null && getOptionKey(value) === optionKey;
                const isActive: boolean = index === activeIndex;

                return (
                  <Button
                    unstyled
                    key={optionKey}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseDown={(
                      event: MouseEvent<HTMLButtonElement>,
                    ): void => {
                      event.preventDefault();
                    }}
                    onMouseEnter={(): void => setActiveIndex(index)}
                    onClick={(): void => handleOptionSelect(option)}
                    className={`flex w-full cursor-pointer items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-[color,background-color,border-color,box-shadow,opacity,transform,translate,scale,rotate] duration-200 ${
                      isSelected
                        ? theme === "light"
                          ? "border-white/80 bg-white/60 text-primary shadow-[0_8px_24px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.95)]"
                          : "border-white/12 bg-white/9 text-primary shadow-[0_10px_28px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.10)]"
                        : isActive
                          ? "border-primary/20 bg-primary/8"
                          : theme === "light"
                            ? "border-transparent text-black hover:border-white/65 hover:bg-white/40"
                            : "border-transparent text-white hover:border-white/8 hover:bg-white/6"
                    }`}
                  >
                    {optionIcon && (
                      <span
                        className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
                          isSelected
                            ? "bg-primary text-white"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {optionIcon}
                      </span>
                    )}

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {optionLabel}
                      </span>

                      {optionDescription && (
                        <span
                          className={`mt-0.5 block truncate text-xs ${
                            isSelected
                              ? "text-primary/75"
                              : theme === "light"
                                ? "text-darkgray"
                                : "text-gray"
                          }`}
                        >
                          {optionDescription}
                        </span>
                      )}
                    </span>

                    {isSelected && (
                      <Check
                        size={17}
                        strokeWidth={2.2}
                        className="shrink-0 text-primary"
                      />
                    )}
                  </Button>
                );
              })
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
};

export default Autocomplete;
