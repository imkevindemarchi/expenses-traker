import { useId, useState, type CSSProperties, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronRight, Search } from "lucide-react";
import { tr } from "../i18n";
import Input from "./Input.component";
import "../styles/v2/Compose.styles.css";

export type TChoice = {
  key: string;
  label: string;
  description?: string;
  color?: string;
  icon?: ReactNode;
};

/**
 * An iOS choice list (the rows of the Alice & Kevin compose sheets): one row
 * per option with its icon, a check on the selected one and an optional search
 * pinned at the bottom. Used inside sheets, so choosing never opens a second
 * dialog.
 */
export default function ChoiceList({
  title,
  choices,
  value,
  searchable = true,
  searchPlaceholder,
  emptyText,
  disabled = false,
  advance = false,
  searchPosition = "top",
  onChoose,
}: {
  title: string;
  choices: TChoice[];
  value: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  /** Rows lead to a next step: a chevron instead of an empty trailing slot. */
  advance?: boolean;
  /** "top": a glass field above the list (filters, like the recipient search
   *  of Alice & Kevin); "bottom": pinned to the bottom of the sheet. */
  searchPosition?: "top" | "bottom";
  onChoose: (key: string) => void;
}) {
  useTranslation();
  const id = useId();
  const [search, setSearch] = useState("");
  const query = search.trim().toLocaleLowerCase();
  const visible = query
    ? choices.filter((choice) =>
        `${choice.label} ${choice.description ?? ""}`.toLocaleLowerCase().includes(query),
      )
    : choices;

  return (
    <div className="ios-compose__group">
      {searchable && choices.length > 0 && searchPosition === "top" && (
        <Input
          id={`${id}-search`}
          type="search"
          className="lg-search-glass"
          autoComplete="off"
          aria-label={searchPlaceholder ?? tr("Cerca")}
          placeholder={searchPlaceholder ?? tr("Cerca")}
          icon={<Search size={18} />}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      )}
      <p className="ios-compose__header">{title}</p>
      {visible.length ? (
        <div className="ios-compose__list" role="listbox" aria-label={title}>
          {visible.map((choice) => {
            const selected = choice.key === value;
            return (
              <button
                key={choice.key}
                type="button"
                role="option"
                aria-selected={selected}
                className="ios-compose__row"
                style={{ "--row-color": choice.color } as CSSProperties}
                disabled={disabled}
                onClick={() => onChoose(choice.key)}
              >
                <span className="ios-compose__icon" aria-hidden="true">
                  {choice.icon}
                </span>
                <span className="ios-compose__copy">
                  <strong>{choice.label}</strong>
                  {choice.description && <span>{choice.description}</span>}
                </span>
                {selected ? (
                  <Check size={18} className="ios-compose__check" aria-hidden="true" />
                ) : advance ? (
                  <ChevronRight size={17} className="ios-compose__chevron" aria-hidden="true" />
                ) : (
                  <span />
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="ios-compose__empty">
          {query || !emptyText ? tr("Nessun risultato.") : emptyText}
        </p>
      )}
      {/* Search at the bottom of the sheet, like the Alice & Kevin analytics detail. */}
      {searchable && choices.length > 0 && searchPosition === "bottom" && (
        <div className="et-choice-search modal-bottom-search">
          <Input
            id={`${id}-search`}
            type="search"
            aria-label={searchPlaceholder ?? tr("Cerca")}
            placeholder={searchPlaceholder ?? tr("Cerca")}
            icon={<Search size={18} />}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      )}
    </div>
  );
}
