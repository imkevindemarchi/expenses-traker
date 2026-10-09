import { tr } from '../i18n';
import { useTranslation } from 'react-i18next';
import {
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Check, ChevronDown } from "lucide-react";
import { createPortal } from "react-dom";

// assets
import { getLiquidGlassClass } from "../assets/constants";

// hooks
import { useTheme } from "../hooks";

// types
import type { TSelectOption } from "../types";

interface IProps<TValue extends string = string> {
  id?: string;
  name?: string;
  label?: string;
  value: TValue;
  options: TSelectOption<TValue>[];
  icon?: ReactNode;
  placeholder?: string;
  disabled?: boolean;
  openUpwardOnMobile?: boolean;
  onChange: (value: TValue) => void;
}

const VIEWPORT_PADDING = 12;
const MENU_GAP = 8;
const MENU_MAX_HEIGHT = 288;
const MENU_MIN_WIDTH = 320;
const MENU_ADDITIONAL_WIDTH = 96;

const Select = <TValue extends string = string>({
  id,
  name,
  label,
  value,
  options,
  icon,
  placeholder,
  disabled = false,
  openUpwardOnMobile = false,
  onChange,
}: IProps<TValue>): ReactElement => {
  const { theme } = useTheme();
  useTranslation();
  const translatedPlaceholder = placeholder ?? tr("Seleziona");

  const selectRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMenuAbove, setIsMenuAbove] = useState<boolean>(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const [menuOrigin, setMenuOrigin] = useState<{
    x: number;
    y: number;
  }>({
    x: 0,
    y: 0,
  });

  const selectId: string = id || name || label || "select";

  const selectedOption: TSelectOption<TValue> | undefined = options.find(
    (option: TSelectOption<TValue>): boolean => option.value === value,
  );

  const hasLeadingIcon: boolean = Boolean(icon || selectedOption?.icon);

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

  const handleToggleMenu = (): void => {
    if (disabled) {
      return;
    }

    if (!isOpen) {
      updateMenuPosition();
    }

    setIsOpen((previousValue: boolean): boolean => !previousValue);
  };

  const handleOptionClick = (optionValue: TValue): void => {
    onChange(optionValue);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: PointerEvent): void => {
      const target: Node = event.target as Node;

      if (
        isOpen &&
        !selectRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return (): void => {
      document.removeEventListener("pointerdown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    updateMenuPosition();

    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return (): void => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [isOpen, updateMenuPosition]);

  return (
    <>
      <div ref={selectRef} className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className={`mb-2 block text-sm font-semibold ${
              theme === "light" ? "text-black" : "text-white"
            }`}
          >
            {label}
          </label>
        )}

        <div
          className={`group relative isolate w-full overflow-hidden rounded-2xl ${getLiquidGlassClass(theme)}`}
        >
          {/* <span className="pointer-events-none absolute inset-px rounded-2xl bg-linear-to-b from-white/30 via-white/5 to-transparent opacity-70 transition-[color,background-color,border-color,box-shadow,opacity,transform,translate,scale,rotate] duration-500 group-hover:inset-0 group-hover:opacity-100" />

          <span className="pointer-events-none absolute -left-6 -top-8 size-16 rounded-2xl bg-white/45 blur-xl transition-[color,background-color,border-color,box-shadow,opacity,transform,translate,scale,rotate] duration-700 ease-out group-hover:translate-x-10 group-hover:translate-y-8 group-hover:scale-125" />

          <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/20 transition-[color,background-color,border-color,box-shadow,opacity,transform,translate,scale,rotate] duration-500 group-hover:ring-white/40" /> */}

          <button
            ref={triggerRef}
            id={selectId}
            name={name}
            type="button"
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            onClick={handleToggleMenu}
            className={`relative z-10 flex h-12 w-full cursor-pointer items-center rounded-2xl border text-left outline-none transition-[border-color,box-shadow] duration-300 disabled:cursor-not-allowed disabled:opacity-50 ${hasLeadingIcon ? "gap-3 px-3.5" : "gap-2 px-3"} ${
              isOpen
                ? "border-primary/40 ring-4 ring-primary/8"
                : theme === "light"
                  ? "border-black/7 hover:border-black/12"
                  : "border-white/8 hover:border-white/15"
            } ${
              theme === "light"
                ? "bg-black/[0.018] text-black"
                : "bg-white/2.5 text-white"
            }`}
          >
            {(icon || selectedOption?.icon) && (
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-xl transition-[background-color,color,box-shadow] duration-300 ${
                  isOpen
                    ? "bg-primary text-white shadow-[0_6px_18px_rgba(0,0,0,0.14)]"
                    : "bg-primary/10 text-primary"
                }`}
              >
                {icon ?? selectedOption?.icon}
              </span>
            )}

            <span
              className={`min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium ${
                selectedOption
                  ? ""
                  : theme === "light"
                    ? "text-gray-400"
                    : "text-gray-500"
              }`}
            >
              {selectedOption?.label ?? translatedPlaceholder}
            </span>

            <ChevronDown
              size={16}
              strokeWidth={2.2}
              className={`shrink-0 transition-[color,transform] duration-300 ${
                isOpen
                  ? "rotate-180 text-primary"
                  : theme === "light"
                    ? "rotate-0 text-darkgray"
                    : "rotate-0 text-gray"
              }`}
            />
          </button>
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
          className={`liquid-glass-panel ${isOpen ? "liquid-glass-panel--open" : "liquid-glass-panel--closed"} fixed z-9999 isolate overflow-hidden border p-1.5 transition-[color,background-color,border-color,box-shadow,opacity,transform,translate,scale,rotate] duration-400 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-[transform,opacity] ${getLiquidGlassClass(theme)} ${
            theme === "light" ? "border-black/7" : "border-white/8"
          } ${
            isOpen
              ? "pointer-events-auto rounded-[22px] opacity-100"
              : "pointer-events-none rounded-[22px] opacity-0"
          }`}
        >
          <div
            role="listbox"
            aria-label={label || translatedPlaceholder}
            className="relative z-10 flex max-h-72 flex-col gap-1 overflow-y-auto overscroll-contain"
          >
            {options.map((option: TSelectOption<TValue>) => {
              const isSelected: boolean = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={isOpen ? 0 : -1}
                  onClick={(): void => handleOptionClick(option.value)}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-[background-color,border-color,color,box-shadow] duration-300 ${
                    isSelected
                      ? theme === "light"
                        ? "border-white/80 bg-white/60 text-primary shadow-[0_8px_24px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.95)]"
                        : "border-white/12 bg-white/9 text-primary shadow-[0_10px_28px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.10)]"
                      : theme === "light"
                        ? "border-transparent text-black hover:border-white/65 hover:bg-white/40"
                        : "border-transparent text-white hover:border-white/8 hover:bg-white/6"
                  }`}
                >
                  {option.icon && (
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${
                        isSelected
                          ? "bg-primary text-white shadow-[0_6px_18px_rgba(0,0,0,0.14)]"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {option.icon}
                    </span>
                  )}

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {option.label}
                    </span>

                    {option.description && (
                      <span
                        className={`mt-0.5 block truncate text-xs ${
                          isSelected
                            ? "text-primary/70"
                            : theme === "light"
                              ? "text-darkgray"
                              : "text-gray"
                        }`}
                      >
                        {option.description}
                      </span>
                    )}
                  </span>

                  <span
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full transition-[opacity,transform] duration-300 ${
                      isSelected
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

export default Select;
