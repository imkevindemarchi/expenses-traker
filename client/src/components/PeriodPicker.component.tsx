import { isSelectablePeriod } from "../utils/date-limits";
import { fitStaticPanel } from "../utils/fitStaticPanel";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { getLiquidGlassClass } from "../assets/constants";
import { useTheme } from "../hooks";
import { locale, tr } from "../i18n";
import { today } from "../api";
export default function PeriodPicker({
  value,
  onChange,
  mode = "month",
}: {
  value: string;
  onChange: (value: string) => void;
  mode?: "month" | "year";
}) {
  useTranslation();
  const { theme } = useTheme();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(Number(value.slice(0, 4)));
  const [position, setPosition] = useState<CSSProperties>({});
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const wrapper = useRef<HTMLDivElement>(null);
  const glass = getLiquidGlassClass(theme);
  const months = Array.from({ length: 12 }, (_, month) =>
    new Intl.DateTimeFormat(locale(), { month: "long" }).format(new Date(2020, month, 1)),
  );
  const annual = mode === "year";
  const currentYear = Number(today().slice(0, 4));
  const maxYear = currentYear;
  const selectedMonth = Number(value.slice(5, 7)) - 1;
  const current = today().slice(0, annual ? 4 : 7);

  const yearPageStart = Math.floor((year - 2000) / 12) * 12 + 2000;
  const compact = (window.visualViewport?.height ?? window.innerHeight) < 480;
  const columns = compact ? 4 : 3;
  const options = annual
    ? Array.from({ length: 12 }, (_, index) => ({
        value: String(yearPageStart + index),
        label: String(yearPageStart + index),
      })).filter((option) => Number(option.value) <= maxYear)
    : months.map((month, index) => ({
        value: `${year}-${String(index + 1).padStart(2, "0")}`,
        label: month,
      }));
  const update = useCallback(() => {
    if (!wrapper.current) return;
    const rect = wrapper.current.getBoundingClientRect();
    const viewport = window.visualViewport ?? {
      width: window.innerWidth,
      height: window.innerHeight,
      offsetLeft: 0,
      offsetTop: 0,
    };
    const height = panel.current?.offsetHeight || 340;
    const next = fitStaticPanel(rect, 344, height, viewport, "below", 12, 8, "left");
    const originX = Math.max(0, Math.min(next.width, rect.left + rect.width / 2 - next.left));
    setPosition({ ...next, transformOrigin: `${originX}px ${next.top < rect.top ? height : 0}px`, overflow:"hidden" });
  }, []);
  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };
  const select = (month: string) => {
    if (!isSelectablePeriod(month, current)) return;
    onChange(month);
    close();
  };
  const shift = (direction: number) => {
    if (annual) {
      const next = Number(value) + direction;
      if (next >= 2000 && next <= maxYear) onChange(String(next));
      setOpen(false);
      return;
    }
    const next = new Date(Number(value.slice(0, 4)), selectedMonth + direction, 1);
    const nextYear = next.getFullYear();
    if (nextYear < 2000 || !isSelectablePeriod(`${nextYear}-${String(next.getMonth() + 1).padStart(2, "0")}`, current)) return;
    onChange(`${nextYear}-${String(next.getMonth() + 1).padStart(2, "0")}`);
    setOpen(false);
  };
  useEffect(() => {
    if (!open) return;
    update();
    const outside = (event: PointerEvent) => {
      if (
        !panel.current?.contains(event.target as Node) &&
        !wrapper.current?.contains(event.target as Node)
      )
        setOpen(false);
    };
    const escape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        close();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    window.visualViewport?.addEventListener("scroll", update);
    const observer = new ResizeObserver(update);
    if (panel.current) observer.observe(panel.current);
    window.addEventListener("scroll", update, true);
    panel.current?.querySelector<HTMLButtonElement>('[data-month][aria-selected="true"]')?.focus();
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
      observer.disconnect();
      window.removeEventListener("scroll", update, true);
    };
  }, [open, update]);
  const key = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const offset =
      event.key === "ArrowRight"
        ? 1
        : event.key === "ArrowLeft"
          ? -1
          : event.key === "ArrowDown"
            ? columns
            : event.key === "ArrowUp"
              ? -columns
              : 0;
    if (offset) {
      event.preventDefault();
      panel.current
        ?.querySelector<HTMLButtonElement>(
          `[data-month="${(index + offset + options.length) % options.length}"]:not(:disabled)`,
        )
        ?.focus();
    }
  };
  return (
    <>
      <div ref={wrapper} className="month-picker">
        <button
          type="button"
          className="month-step"
          aria-label={tr(annual ? tr("Anno precedente") : tr("Mese precedente"))}
          title={tr(annual ? tr("Anno precedente") : tr("Mese precedente"))}
          disabled={value === (annual ? "2000" : "2000-01")}
          onClick={() => shift(-1)}
        >
          <ChevronLeft size={18} strokeWidth={1.8} />
        </button>
        <button
          ref={trigger}
          type="button"
          className={`month-picker-trigger ${open ? "is-open" : ""}`}
          aria-label={
            annual
              ? tr("Seleziona anno: {{year}}", { year: value })
              : tr("Seleziona mese: {{month}}", {
                  month: `${months[selectedMonth]} ${value.slice(0, 4)}`,
                })
          }
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => {
            setYear(Number(value.slice(0, 4)));
            setOpen((current) => !current);
          }}
        >
          <span className="month-picker-icon">
            <CalendarDays size={19} strokeWidth={1.7} />
          </span>
          <span className="month-picker-value">
            <strong>{annual ? value : months[selectedMonth]}</strong>
            <span>{annual ? tr("Riepilogo annuale") : value.slice(0, 4)}</span>
          </span>
          <ChevronDown size={15} className={`month-picker-chevron ${open ? "is-open" : ""}`} />
        </button>
        <button
          type="button"
          className="month-step"
          aria-label={tr(annual ? tr("Anno successivo") : tr("Mese successivo"))}
          title={tr(annual ? tr("Anno successivo") : tr("Mese successivo"))}
          disabled={value >= current}
          onClick={() => shift(1)}
        >
          <ChevronRight size={18} strokeWidth={1.8} />
        </button>
      </div>
      {open &&
        createPortal(
          <div
            ref={panel}
            id={id}
            role="dialog"
            aria-label={tr(annual ? tr("Seleziona anno") : tr("Seleziona mese"))}
            style={position}
            className={`month-picker-panel ${annual ? "year-picker-panel" : ""} ${compact ? "period-picker-compact" : ""} liquid-glass-panel liquid-glass-panel--open ${glass}`}
          >
            <div className="month-picker-panel-heading">
              <span className="month-picker-icon">
                <CalendarDays size={19} strokeWidth={1.7} />
              </span>
              <div>
                <h3>{tr(annual ? tr("Scegli l’anno") : tr("Scegli il mese"))}</h3>
                <p>
                  {tr(
                    annual
                      ? tr("La tua panoramica, un anno alla volta.")
                      : tr("La tua panoramica, un mese alla volta."),
                  )}
                </p>
              </div>
            </div>
            <div className="month-year-bar">
              <button
                type="button"
                disabled={annual ? yearPageStart <= 2000 : year <= 2000}
                aria-label={tr("Anno precedente")}
                className="month-step"
                onClick={() => setYear((current) => Math.max(2000, current - (annual ? 12 : 1)))}
              >
                <ChevronLeft size={17} />
              </button>
              <span aria-live="polite">
                {annual ? `${yearPageStart}–${Math.min(maxYear, yearPageStart + 11)}` : year}
              </span>
              <button
                type="button"
                disabled={annual ? yearPageStart + 12 > maxYear : year >= maxYear}
                aria-label={tr("Anno successivo")}
                className="month-step"
                onClick={() => setYear((current) => Math.min(maxYear, current + (annual ? 12 : 1)))}
              >
                <ChevronRight size={17} />
              </button>
            </div>
            <div role="listbox" aria-label={tr(annual ? "Anni" : "Mesi")} className="month-grid">
              {options.map((option, index) => {
                const monthValue = option.value;
                const active = value === monthValue;
                return (
                  <button
                    key={index}
                    data-month={index}
                    type="button"
                    role="option"
                    aria-selected={active}
                    disabled={!isSelectablePeriod(monthValue, current)}
                    onKeyDown={(event) => key(event, index)}
                    onClick={() => select(monthValue)}
                    className={`month-tile ${active ? "is-selected" : ""} ${current === monthValue ? "is-current" : ""}`}
                  >
                    <span>{option.label}</span>
                    {active ? (
                      <Check size={13} strokeWidth={2.4} />
                    ) : current === monthValue ? (
                      <span
                        className="month-current-dot"
                        aria-label={tr(annual ? tr("Anno corrente") : tr("Mese corrente"))}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
            {value !== current && (
              <button type="button" className="month-current" onClick={() => select(current)}>
                <RotateCcw size={14} strokeWidth={1.8} />
                {tr(annual ? tr("Torna all’anno corrente") : tr("Torna al mese corrente"))}
              </button>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
