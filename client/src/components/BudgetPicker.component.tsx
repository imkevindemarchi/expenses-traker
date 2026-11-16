import { Fragment, useEffect, useRef, type FC } from "react";
import { useTranslation } from "react-i18next";
import { tr } from "../i18n";
import { revealAboveKeyboard } from "../utils/keyboard-reveal.util";

interface IProps {
  /** Monthly limit as typed ("1250", "1250.5", "" = no limit). */
  value: string;
  currencySymbol: string;
  disabled?: boolean;
  error?: string;
  onChange: (value: string) => void;
}

type TField = "whole" | "cents";

const split = (value: string): Record<TField, string> => {
  const [whole = "", cents = ""] = value.split(/[.,]/);
  return { whole, cents };
};

const join = ({ whole, cents }: Record<TField, string>): string =>
  whole === "" && cents === ""
    ? ""
    : cents === ""
      ? whole
      : `${whole || "0"}.${cents.padStart(2, "0")}`;

/**
 * Monthly spending limit as an iOS timer-style dial (like the PPV duration on
 * Alice & Kevin): large digits for the amount and its cents.
 */
const BudgetPicker: FC<IProps> = ({ value, currencySymbol, disabled = false, error, onChange }) => {
  useTranslation();
  const invalid = Boolean(error);
  const parts = split(value);
  const block = useRef<HTMLElement>(null);
  const cancelReveal = useRef<() => void>(() => undefined);
  useEffect(() => () => cancelReveal.current(), []);

  const fields: { field: TField; caption: string; placeholder: string; max: number }[] = [
    { field: "whole", caption: currencySymbol, placeholder: "0", max: 7 },
    { field: "cents", caption: tr("Cent"), placeholder: "00", max: 2 },
  ];

  return (
    <section id="settings-budget-limit" tabIndex={-1} className="ios-group" ref={block}>
      <div className="ios-group__head">
        <h2 className="ios-group__title" id="monthly-budget-label">
          {tr("Limite di spesa mensile")}
        </h2>
        {value !== "" && (
          <button
            type="button"
            className="ios-group__action"
            disabled={disabled}
            onClick={() => onChange("")}
          >
            {tr("Rimuovi")}
          </button>
        )}
      </div>
      <div
        className="ios-group__card et-dial"
        role="group"
        aria-labelledby="monthly-budget-label"
        data-empty={value === "" || undefined}
        data-invalid={invalid || undefined}
      >
        <div className="et-dial__row">
          {fields.map(({ field, caption, placeholder, max }, index) => (
            <Fragment key={field}>
              {index > 0 && (
                <span className="et-dial__sep" aria-hidden="true">
                  ,
                </span>
              )}
              <label className="et-dial__unit" data-field={field}>
                <input
                  id={field === "whole" ? "monthly-budget" : "monthly-budget-cents"}
                  type="text"
                  inputMode="numeric"
                  enterKeyHint={field === "cents" ? "done" : "next"}
                  autoComplete="off"
                  placeholder={placeholder}
                  aria-label={tr(field === "whole" ? "Importo" : "Centesimi")}
                  aria-invalid={invalid || undefined}
                  value={
                    field === "cents" && parts.cents !== ""
                      ? parts.cents.padStart(2, "0")
                      : parts[field]
                  }
                  disabled={disabled}
                  className="et-dial__value"
                  onFocus={(event) => {
                    event.currentTarget.select();
                    cancelReveal.current();
                    cancelReveal.current = revealAboveKeyboard(block.current);
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") return;
                    event.preventDefault();
                    if (field === "whole") document.getElementById("monthly-budget-cents")?.focus();
                    else event.currentTarget.blur();
                  }}
                  onChange={(event) => {
                    // Timer-style entry: the latest digits roll in from the right.
                    const digits = event.target.value.replace(/\D/g, "").slice(-max);
                    const next = digits === "" ? "" : String(Number(digits));
                    onChange(join({ ...parts, [field]: next }));
                  }}
                />
                <span className="et-dial__caption" aria-hidden="true">
                  {caption}
                </span>
              </label>
            </Fragment>
          ))}
        </div>
      </div>
      {error && (
        <p className="ios-group__error" role="alert">
          {error}
        </p>
      )}
      <p className="ios-group__footer">
        {tr("Vuoto: nessun limite. Il residuo compare nel riepilogo del mese corrente.")}
      </p>
    </section>
  );
};

export default BudgetPicker;
