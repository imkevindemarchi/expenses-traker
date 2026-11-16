import { dateFormatter } from "../utils/formatters.util";
import { isSelectablePeriod } from "../utils/date-limits";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarDays, CalendarRange, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { locale, tr } from "../i18n";
import { today } from "../api";
import Modal from "./Modal.component";
import Button from "./Button.component";

/**
 * Month / year of a summary: the Alice & Kevin period pill (above the tab
 * bar on phones), opening a sheet with the months or years as tiles.
 */
export default function PeriodPicker({
  value,
  onChange,
  mode = "month",
  inline = false,
}: {
  value: string;
  onChange: (value: string) => void;
  mode?: "month" | "year";
  /** In the page flow (pages whose bottom dock already holds the search field). */
  inline?: boolean;
}) {
  useTranslation();
  const annual = mode === "year";
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(Number(value.slice(0, 4)));
  const currentYear = Number(today().slice(0, 4));
  const current = today().slice(0, annual ? 4 : 7);
  const monthName = (month: number, style: "long" | "short") => {
    const name = dateFormatter(locale(), { month: style }).format(new Date(2020, month, 1));
    return name.charAt(0).toLocaleUpperCase(locale()) + name.slice(1);
  };
  const yearPageStart = Math.floor((year - 2000) / 12) * 12 + 2000;
  const options = annual
    ? Array.from({ length: 12 }, (_, index) => String(yearPageStart + index)).map((option) => ({
        value: option,
        label: option,
      }))
    : Array.from({ length: 12 }, (_, index) => ({
        value: `${year}-${String(index + 1).padStart(2, "0")}`,
        label: monthName(index, "short"),
      }));
  const label = annual
    ? value
    : `${monthName(Number(value.slice(5, 7)) - 1, "long")} ${value.slice(0, 4)}`;

  const select = (next: string) => {
    if (!isSelectablePeriod(next, current)) return;
    onChange(next);
    setOpen(false);
  };

  return (
    <>
      {/* Period: a glass pill above the tab bar on phones (like the search field). */}
      <div className={inline ? "et-period-inline" : "ios-analytics__period-dock"}>
        <button
          type="button"
          className="ios-analytics__period"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={
            annual
              ? tr("Seleziona anno: {{year}}", { year: value })
              : tr("Seleziona mese: {{month}}", { month: label })
          }
          onClick={() => {
            setYear(Number(value.slice(0, 4)));
            setOpen(true);
          }}
        >
          {annual ? (
            <CalendarRange size={18} strokeWidth={2} aria-hidden="true" />
          ) : (
            <CalendarDays size={18} strokeWidth={2} aria-hidden="true" />
          )}
          <span className="ios-analytics__period-label">{label}</span>
          <ChevronDown size={16} strokeWidth={2.4} aria-hidden="true" />
        </button>
      </div>

      <Modal
        isOpen={open}
        title={tr(annual ? "Scegli l’anno" : "Scegli il mese")}
        description={tr(
          annual
            ? "La tua panoramica, un anno alla volta."
            : "La tua panoramica, un mese alla volta.",
        )}
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              {tr("Annulla")}
            </Button>
            <Button type="button" disabled={value === current} onClick={() => select(current)}>
              {tr("Oggi")}
            </Button>
          </>
        }
      >
        <div className="ios-compose">
          <div className="et-period__bar">
            <button
              type="button"
              className="et-period__step"
              disabled={annual ? yearPageStart <= 2000 : year <= 2000}
              aria-label={tr("Anno precedente")}
              onClick={() => setYear((previous) => Math.max(2000, previous - (annual ? 12 : 1)))}
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <span aria-live="polite">
              {annual ? `${yearPageStart}–${Math.min(currentYear, yearPageStart + 11)}` : year}
            </span>
            <button
              type="button"
              className="et-period__step"
              disabled={annual ? yearPageStart + 12 > currentYear : year >= currentYear}
              aria-label={tr("Anno successivo")}
              onClick={() =>
                setYear((previous) => Math.min(currentYear, previous + (annual ? 12 : 1)))
              }
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
          <div role="listbox" aria-label={tr(annual ? "Anni" : "Mesi")} className="et-period__grid">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                className="et-period__tile"
                aria-selected={value === option.value}
                data-current={current === option.value || undefined}
                disabled={!isSelectablePeriod(option.value, current)}
                onClick={() => select(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </>
  );
}
