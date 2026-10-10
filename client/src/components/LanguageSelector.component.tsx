import {
  type CSSProperties,
  type FC,
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Check, ChevronDown } from "lucide-react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
const ReactCountryFlag = ({countryCode, style}: {countryCode: string; svg?: boolean; style?: import('react').CSSProperties; 'aria-hidden'?: string}) => <img aria-hidden="true" alt="" src={`/flags/${countryCode === "it" ? "it" : "us"}.svg`} style={{...style, objectFit:"contain"}} />;

// assets
import { getLiquidGlassClass } from "../assets/constants";
import {
  AVAILABLE_LANGUAGES,
  type ILanguage,
  type TLanguageCode,
} from "../i18n/languages";

// hooks
import { useTheme } from "../hooks";

type TDropdownPlacement = "top" | "bottom";
type TDropdownAlignment = "left" | "right";

interface IProps {
  className?: string;
  placement?: TDropdownPlacement;
  alignment?: TDropdownAlignment;
}

const DROPDOWN_GAP = 8;
const DROPDOWN_MIN_WIDTH = 224;
const VIEWPORT_PADDING = 12;

const LanguageSelector: FC<IProps> = ({
  className = "",
  placement = "bottom",
  alignment = "right",
}) => {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();

  const selectorRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({});
  const [dropdownOrigin, setDropdownOrigin] = useState<{
    x: number;
    y: number;
  }>({
    x: 0,
    y: 0,
  });

  const resolvedLanguage: string =
    i18n.resolvedLanguage || i18n.language || "en";

  const currentLanguageCode: TLanguageCode = resolvedLanguage
    .toLowerCase()
    .startsWith("it")
    ? "it"
    : "en";

  const currentLanguage: ILanguage =
    AVAILABLE_LANGUAGES.find((language: ILanguage): boolean => {
      return language.code === currentLanguageCode;
    }) || AVAILABLE_LANGUAGES[0];

  const isDropdownOnTop: boolean = placement === "top";
  const isDropdownAlignedLeft: boolean = alignment === "left";

  const updateDropdownPosition = useCallback((): void => {
    if (!triggerRef.current) {
      return;
    }

    const triggerRect: DOMRect = triggerRef.current.getBoundingClientRect();
    const availableWidth: number = window.innerWidth - VIEWPORT_PADDING * 2;

    const dropdownWidth: number = Math.min(
      Math.max(triggerRect.width, DROPDOWN_MIN_WIDTH),
      availableWidth,
    );

    const dropdownHeight: number =
      dropdownRef.current?.scrollHeight ?? AVAILABLE_LANGUAGES.length * 53 + 12;

    const preferredLeft: number = isDropdownAlignedLeft
      ? triggerRect.left
      : triggerRect.right - dropdownWidth;

    const clampedLeft: number = Math.min(
      Math.max(preferredLeft, VIEWPORT_PADDING),
      window.innerWidth - dropdownWidth - VIEWPORT_PADDING,
    );

    const preferredTop: number = isDropdownOnTop
      ? triggerRect.top - dropdownHeight - DROPDOWN_GAP
      : triggerRect.bottom + DROPDOWN_GAP;

    const clampedTop: number = Math.min(
      Math.max(preferredTop, VIEWPORT_PADDING),
      window.innerHeight - dropdownHeight - VIEWPORT_PADDING,
    );

    const triggerAnchorX: number = isDropdownAlignedLeft
      ? triggerRect.left + 24
      : triggerRect.right - 24;

    setDropdownOrigin({
      x: Math.min(Math.max(triggerAnchorX - clampedLeft, 0), dropdownWidth),
      y: isDropdownOnTop ? dropdownHeight : 0,
    });

    setDropdownStyle({
      left: clampedLeft,
      top: clampedTop,
      width: dropdownWidth,
    });
  }, [isDropdownAlignedLeft, isDropdownOnTop]);

  const handleToggle = (): void => {
    if (!isOpen) {
      updateDropdownPosition();
    }

    setIsOpen((previousValue: boolean): boolean => !previousValue);
  };

  const handleLanguageChange = async (
    languageCode: TLanguageCode,
  ): Promise<void> => {
    setIsOpen(false);

    await i18n.changeLanguage(languageCode);
  };

  useEffect(() => {
    const handleOutsideClick = (event: PointerEvent): void => {
      const target: Node = event.target as Node;

      if (
        isOpen &&
        !selectorRef.current?.contains(target) &&
        !dropdownRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleEscapeKey);

    return (): void => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    updateDropdownPosition();

    window.addEventListener("resize", updateDropdownPosition);
    window.addEventListener("scroll", updateDropdownPosition, true);

    return (): void => {
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
    };
  }, [isOpen, updateDropdownPosition]);

  return (
    <>
      <div
        ref={selectorRef}
        data-glass-theme={theme}
        className={`group relative isolate overflow-hidden rounded-full ${getLiquidGlassClass(theme)} ${className}`}
      >
        <button
          ref={triggerRef}
          type="button"
          onClick={handleToggle}
          aria-label={t("languageSelector.ariaLabel")}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={`liquid-glass-interaction relative z-10 flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-left outline-none transition-[color,background-color,border-color,box-shadow,opacity,transform,translate,scale,rotate] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-[0.9] ${
            isOpen
              ? "border-primary/40 ring-4 ring-primary/8"
              : theme === "light"
                ? "border-black/7 hover:border-black/12"
                : "border-white/8 hover:border-white/15"
          } ${
            theme === "light"
              ? "text-black"
              : "text-white"
          }`}
        >
          <span
            className={`flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full transition-[color,background-color,border-color,box-shadow,opacity,transform,translate,scale,rotate] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-rotate-6 group-hover:scale-110 ${
              isOpen
                ? "bg-primary/15 shadow-[0_6px_18px_rgba(0,0,0,0.14)]"
                : "bg-primary/10"
            }`}
          >
            <ReactCountryFlag
              countryCode={
                currentLanguage.code === "en" ? "us" : currentLanguage.code
              }
              svg
              aria-label={t(
                `languageSelector.languages.${currentLanguage.code}`,
              )}
              style={{
                width: 20,
                height: 20,
              }}
            />
          </span>

          <span className="hidden text-sm font-semibold transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-[1.06] sm:block">
            {currentLanguage.code.toUpperCase()}
          </span>

          <ChevronDown
            size={16}
            strokeWidth={2.2}
            className={`shrink-0 transition-[color,background-color,border-color,box-shadow,opacity,transform,translate,scale,rotate] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:translate-y-0.5 group-hover:scale-110 ${
              isOpen
                ? "rotate-180 text-primary"
                : theme === "light"
                  ? "rotate-0 text-darkgray"
                  : "rotate-0 text-gray"
            }`}
          />
        </button>
      </div>

      {createPortal(
        <div
          ref={dropdownRef}
        data-glass-theme={theme}
          inert={!isOpen}
          role="listbox"
          aria-hidden={!isOpen}
          aria-label={t("languageSelector.ariaLabel")}
          style={{
            ...dropdownStyle,
            transform: isOpen
              ? "translateY(0) scale(1)"
              : `translateY(${isDropdownOnTop ? "8px" : "-8px"}) scale(0.96)`,
            transformOrigin: `${dropdownOrigin.x}px ${dropdownOrigin.y}px`,
          }}
          className={`liquid-glass-panel glass-surface--clear ${isOpen ? "liquid-glass-panel--open" : "liquid-glass-panel--closed"} fixed z-9999 isolate overflow-hidden rounded-[22px] border p-1.5 transition-[color,background-color,border-color,box-shadow,opacity,transform,translate,scale,rotate] duration-400 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-[transform,opacity] ${
            theme === "light" ? "border-black/7" : "border-white/8"
          } ${getLiquidGlassClass(theme)} ${
            isOpen
              ? "pointer-events-auto rounded-[22px] opacity-100"
              : "pointer-events-none rounded-[22px] opacity-0"
          }`}
        >
          <div className="relative z-10 flex flex-col gap-1">
            {AVAILABLE_LANGUAGES.map((language: ILanguage) => {
              const isActive: boolean = language.code === currentLanguageCode;

              const languageLabel: string = t(
                `languageSelector.languages.${language.code}`,
              );

              return (
                <button
                  key={language.code}
                  type="button"
                  role="option"
                  aria-label={languageLabel}
                  aria-selected={isActive}
                  tabIndex={isOpen ? 0 : -1}
                  onClick={(
                    event: ReactMouseEvent<HTMLButtonElement>,
                  ): void => {
                    event.stopPropagation();
                    void handleLanguageChange(language.code);
                  }}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-[background-color,border-color,color,box-shadow] duration-300 ${
                    isActive
                      ? theme === "light"
                        ? "border-white/80 bg-white/60 text-primary shadow-[0_8px_24px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.95)]"
                        : "border-white/12 bg-white/9 text-primary shadow-[0_10px_28px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.10)]"
                      : theme === "light"
                        ? "border-transparent text-black hover:border-white/65 hover:bg-white/40"
                        : "border-transparent text-white hover:border-white/8 hover:bg-white/6"
                  }`}
                >
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-xl ${
                      isActive
                        ? "bg-primary/15 shadow-[0_6px_18px_rgba(0,0,0,0.14)]"
                        : "bg-primary/10"
                    }`}
                  >
                    <ReactCountryFlag
                      countryCode={
                        language.code === "en" ? "us" : language.code
                      }
                      svg
                      aria-hidden="true"
                      style={{
                        width: 20,
                        height: 20,
                      }}
                    />
                  </span>

                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {languageLabel}
                  </span>

                  <span
                    aria-hidden="true"
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full transition-[opacity,transform] duration-300 ${
                      isActive
                        ? "scale-100 bg-primary text-white opacity-100 shadow-[0_4px_12px_rgba(0,0,0,0.12)]"
                        : "scale-75 opacity-0"
                    }`}
                  >
                    <Check size={13} strokeWidth={2.5} />
                  </span>
                </button>
              );
            })}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
};

export default LanguageSelector;
