import { type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { ArrowDownLeft, ArrowUpRight, ChevronRight, Wallet } from "lucide-react";
import { useMoney } from "../contexts/currency.context";
import { displayDate } from "../api";
import { tr } from "../i18n";
import EmptyState from "./EmptyState.component";
import type { Category, Entry, Subcategory } from "../types";

/**
 * Movements as an iOS inset grouped list (Wallet style): a coloured kind
 * glyph, the subcategory with its category and date, the signed amount.
 * A tap opens the movement sheet, where it can also be deleted.
 */
export default function EntryList({
  entries,
  categories,
  subcategories,
  emptyText,
  onOpen,
}: {
  entries: Entry[];
  categories: Map<string, Category>;
  subcategories: Map<string, Subcategory>;
  emptyText?: string;
  onOpen: (entry: Entry) => void;
}) {
  useTranslation();
  const money = useMoney();

  if (!entries.length)
    return (
      <EmptyState
        icon={<Wallet />}
        title={tr("Nessun movimento")}
        text={
          emptyText ??
          tr("Nessun movimento nel periodo selezionato. Usa il pulsante + per registrarne uno.")
        }
      />
    );

  return (
    <div className="ios-analytics__card et-entry-list" role="list" aria-label={tr("I tuoi movimenti")}>
      {entries.map((entry) => {
        const category = categories.get(entry.category);
        const title =
          (entry.subcategory ? subcategories.get(entry.subcategory)?.name : category?.name) ??
          tr("Categoria");
        const income = entry.kind === "income";
        const Icon = income ? ArrowDownLeft : ArrowUpRight;
        return (
          <button
            key={entry._id}
            type="button"
            role="listitem"
            className="ios-analytics__row et-entry-row"
            data-kind={entry.kind}
            style={{ "--row-color": "var(--kind-color)" } as CSSProperties}
            aria-label={tr("Modifica {{name}}", { name: title })}
            onClick={() => onOpen(entry)}
          >
            <span className="ios-analytics__row-icon" aria-hidden="true">
              <Icon size={16} strokeWidth={2.2} />
            </span>
            <span className="ios-analytics__row-label">
              {title}
              <small
                className="et-entry-category"
                style={{ "--category-color": category?.color } as CSSProperties}
              >
                {entry.subcategory ? `${category?.name ?? tr("Categoria")} · ` : ""}
                {displayDate(entry.date)}
              </small>
            </span>
            <span className="ios-analytics__row-value et-entry-amount">
              {income ? "+" : "−"}
              {money(entry.amountCents)}
            </span>
            <ChevronRight size={16} className="ios-analytics__chevron" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
