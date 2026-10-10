import '../styles/DatePicker.styles.css';
import {
  type CSSProperties,
  type FC,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { ChevronDown } from "lucide-react";
import Calendar from "react-calendar";

import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

// assets
import "react-calendar/dist/Calendar.css";

// hooks
import { useTheme } from "../hooks";

type TDatePickerValue = Date | string | null | undefined;

type TCalendarValue = Date | null | [Date | null, Date | null];

type TDatePickerColor = "primary" | "sky" | "rose" | "emerald" | "amber";

type TDatePickerColorClasses = {
  iconActive: string;
  iconInactive: string;
  endIconActive: string;
  endIconHover: string;
  underline: string;
  shadow: string;
  calendarColor: string;
};

const COLOR_CLASSES: Record<TDatePickerColor, TDatePickerColorClasses> = {
  primary: {
    iconActive: "bg-primary text-white",
    iconInactive:
      "bg-primary/10 text-primary group-focus-within:bg-primary group-focus-within:text-white",
    endIconActive: "bg-primary/10 text-primary",
    endIconHover: "hover:bg-primary/10 hover:text-primary",
    underline: "bg-primary",
    shadow: "shadow-primary/20",
    calendarColor: import.meta.env.VITE_PRIMARY_COLOR || "#32cd32",
  },
  sky: {
    iconActive: "bg-sky-500 text-white",
    iconInactive:
      "bg-sky-400/15 text-sky-500 group-focus-within:bg-sky-500 group-focus-within:text-white",
    endIconActive: "bg-sky-400/15 text-sky-500",
    endIconHover: "hover:bg-sky-400/15 hover:text-sky-500",
    underline: "bg-sky-500",
    shadow: "shadow-sky-500/20",
    calendarColor: "#0ea5e9",
  },
  rose: {
    iconActive: "bg-rose-500 text-white",
    iconInactive:
      "bg-rose-400/15 text-rose-500 group-focus-within:bg-rose-500 group-focus-within:text-white",
    endIconActive: "bg-rose-400/15 text-rose-500",
    endIconHover: "hover:bg-rose-400/15 hover:text-rose-500",
    underline: "bg-rose-500",
    shadow: "shadow-rose-500/20",
    calendarColor: "#f43f5e",
  },
  emerald: {
    iconActive: "bg-emerald-500 text-white",
    iconInactive:
      "bg-emerald-400/15 text-emerald-500 group-focus-within:bg-emerald-500 group-focus-within:text-white",
    endIconActive: "bg-emerald-400/15 text-emerald-500",
    endIconHover: "hover:bg-emerald-400/15 hover:text-emerald-500",
    underline: "bg-emerald-500",
    shadow: "shadow-emerald-500/20",
    calendarColor: "#10b981",
  },
  amber: {
    iconActive: "bg-amber-500 text-white",
    iconInactive:
      "bg-amber-400/15 text-amber-500 group-focus-within:bg-amber-500 group-focus-within:text-white",
    endIconActive: "bg-amber-400/15 text-amber-500",
    endIconHover: "hover:bg-amber-400/15 hover:text-amber-500",
    underline: "bg-amber-500",
    shadow: "shadow-amber-500/20",
    calendarColor: "#f59e0b",
  },
};

interface IProps {
  label: string;
  value?: TDatePickerValue;
  icon?: ReactNode;
  endIcon?: ReactNode;
  placeholder?: string;
  error?: string;
  className?: string;
  id?: string;
  name?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  autoFocus?: boolean;
  color?: TDatePickerColor;
  onChange: (date: Date | null) => void;
}

type TCalendarPosition = {
  top: number;
  left: number;
  width: number;
};

const DatePicker: FC<IProps> = ({
  label,
  value,
  icon,
  endIcon,
  placeholder,
  error,
  className,
  id,
  name,
  minDate,
  maxDate,
  disabled = false,
  autoFocus = false,
  color = "primary",
  onChange,
}) => {
  const { theme } = useTheme();
  const { i18n, t } = useTranslation();

  const containerRef = useRef<HTMLDivElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState<boolean>(() => {
    return autoFocus && !disabled;
  });

  const [calendarPosition, setCalendarPosition] = useState<TCalendarPosition>({
    top: 0,
    left: 0,
    width: 350,
  });

  const inputId: string = id || name || label;

  const colorClasses: TDatePickerColorClasses = COLOR_CLASSES[color];

  const normalizeValue = (dateValue?: TDatePickerValue): Date | null => {
    if (!dateValue) {
      return null;
    }

    const parsedDate: Date =
      dateValue instanceof Date ? dateValue : new Date(dateValue);

    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    return parsedDate;
  };

  const getFormattedValue = (dateValue?: TDatePickerValue): string => {
    const parsedDate: Date | null = normalizeValue(dateValue);

    if (!parsedDate) {
      return "";
    }

    return new Intl.DateTimeFormat(i18n.resolvedLanguage === "it" ? "it-IT" : "en-US", {day:"2-digit",month:"2-digit",year:"numeric"}).format(parsedDate);
  };

  const updateCalendarPosition = (): void => {
    if (!inputContainerRef.current) {
      return;
    }

    const inputRect: DOMRect =
      inputContainerRef.current.getBoundingClientRect();

    const calendarHeight: number = calendarRef.current?.offsetHeight ?? 390;
    const spacing: number = 8;
    const horizontalSpacing: number = 16;
    const availableBelow: number = window.innerHeight - inputRect.bottom;
    const availableAbove: number = inputRect.top;

    const shouldOpenAbove: boolean =
      availableBelow < calendarHeight && availableAbove > availableBelow;

    const availableWidth: number = window.innerWidth - horizontalSpacing * 2;

    const calendarWidth: number = Math.min(350, availableWidth);

    const maximumLeft: number =
      window.innerWidth - calendarWidth - horizontalSpacing;

    const left: number = Math.max(
      horizontalSpacing,
      Math.min(inputRect.left, maximumLeft),
    );

    const top: number = shouldOpenAbove
      ? Math.max(spacing, inputRect.top - calendarHeight - spacing)
      : inputRect.bottom + spacing;

    setCalendarPosition({
      top,
      left,
      width: calendarWidth,
    });
  };

  const handleOpenCalendar = (): void => {
    if (disabled) {
      return;
    }

    setIsOpen(true);
  };

  const handleToggleCalendar = (): void => {
    if (disabled) {
      return;
    }

    setIsOpen((previousIsOpen: boolean): boolean => !previousIsOpen);
  };

  const handleCalendarChange = (calendarValue: TCalendarValue): void => {
    if (Array.isArray(calendarValue)) {
      return;
    }

    onChange(calendarValue);
    setIsOpen(false);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (disabled) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleToggleCalendar();
    }

    if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleEndIconClick = (event: MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
    handleToggleCalendar();
  };

  useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }

    updateCalendarPosition();

    window.addEventListener("resize", updateCalendarPosition);
    window.addEventListener("scroll", updateCalendarPosition, true);

    return (): void => {
      window.removeEventListener("resize", updateCalendarPosition);
      window.removeEventListener("scroll", updateCalendarPosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent): void => {
      const target: EventTarget | null = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      const clickedInput: boolean =
        containerRef.current?.contains(target) ?? false;

      const clickedCalendar: boolean =
        calendarRef.current?.contains(target) ?? false;

      if (!clickedInput && !clickedCalendar) {
        setIsOpen(false);
      }
    };

    const handleEscapeKey = (event: globalThis.KeyboardEvent): void => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside, true);
    document.addEventListener("keydown", handleEscapeKey);

    return (): void => {
      document.removeEventListener("mousedown", handleClickOutside, true);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, []);

  useEffect(() => {
    if (!autoFocus || disabled) {
      return;
    }

    inputRef.current?.focus();
  }, [autoFocus, disabled]);

  const normalizedValue: Date | null = normalizeValue(value);
  const formattedValue: string = getFormattedValue(value);

  return (
    <div ref={containerRef} className={`w-full ${className || ""}`}>
      <label
        htmlFor={inputId}
        className={`mb-2 block text-base font-semibold sm:text-sm ${theme === "light" ? "text-black" : "text-white"}`}
      >
        {label}
      </label>

      <div
        ref={inputContainerRef}
        onClick={handleOpenCalendar}
        className={`group relative flex items-center gap-3 ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
      >
        {icon && (
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${isOpen ? `${colorClasses.iconActive} shadow-md ${colorClasses.shadow}` : `${colorClasses.iconInactive} group-focus-within:shadow-md ${colorClasses.shadow}`}`}
          >
            {icon}
          </div>
        )}

        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type="text"
          readOnly
          value={formattedValue}
          placeholder={placeholder || t("datePicker.placeholder")}
          disabled={disabled}
          autoFocus={autoFocus}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          onFocus={handleOpenCalendar}
          onKeyDown={handleInputKeyDown}
          className={`w-full cursor-pointer bg-transparent py-5 text-base outline-none disabled:cursor-not-allowed sm:text-sm ${theme === "light" ? "text-black placeholder:text-gray-400" : "text-white placeholder:text-gray-500"}`}
        />

        <button
          type="button"
          disabled={disabled}
          onClick={handleEndIconClick}
          aria-label={t("datePicker.toggleCalendar")}
          className={`relative z-10 flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-all duration-300 focus:outline-none disabled:cursor-not-allowed ${colorClasses.endIconHover} ${isOpen ? colorClasses.endIconActive : theme === "light" ? "text-gray-500" : "text-gray-400"}`}
        >
          <span
            className={`flex transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
          >
            {endIcon || <ChevronDown size={18} strokeWidth={2} />}
          </span>
        </button>

        <div
          className={`absolute bottom-0 left-0 h-px w-full transition-colors duration-300 ${error ? "bg-red-500" : theme === "light" ? "bg-black/20" : "bg-white/20"}`}
        />

        {!error && (
          <div
            className={`absolute bottom-0 left-1/2 h-0.5 -translate-x-1/2 transition-all duration-300 ease-out ${colorClasses.underline} ${isOpen ? "w-full" : "w-0 group-focus-within:w-full"}`}
          />
        )}
      </div>

      {error && (
        <p id={`${inputId}-error`} className="mt-2 text-xs text-red-500">
          {error}
        </p>
      )}

      {isOpen &&
        createPortal(
          <div
            ref={calendarRef}
            role="dialog"
            aria-label={label}
            className={`liquid-glass-panel liquid-glass-panel--open origin-top fixed z-9999 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border p-3 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl ${theme === "light" ? "border-black/10 bg-white/95 text-black" : "border-white/10 bg-[#111111]/95 text-white"}`}
            style={
              {
                top: calendarPosition.top,
                left: calendarPosition.left,
                width: calendarPosition.width,
                "--calendar-primary": colorClasses.calendarColor,
              } as CSSProperties
            }
          >
            <Calendar
              value={normalizedValue}
              locale={i18n.language}
              minDate={minDate}
              maxDate={maxDate}
              defaultActiveStartDate={normalizedValue || new Date()}
              onChange={handleCalendarChange}
              prev2Label={null}
              next2Label={null}
              className={`custom-calendar ${theme === "light" ? "ak-calendar ak-calendar-light" : "ak-calendar ak-calendar-dark"}`}
            />
          </div>,
          document.body,
        )}
    </div>
  );
};

export default DatePicker;
