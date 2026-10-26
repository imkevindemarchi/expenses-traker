import IconButton from "./IconButton.component";
import { useContext, type CSSProperties } from "react";
import { CurrencyContext, useMoney } from "../contexts/currency.context";
import { useTranslation } from "react-i18next";
import { ArrowDownLeft, ArrowUpRight, Pencil, Trash2, Wallet, CalendarDays } from "lucide-react";
import { tr } from "../i18n";
import { displayDate } from "../api";
import { INCOME_COLOR, EXPENSE_COLOR } from "../assets/constants/transaction-colors";
import type { Entry, Category, Subcategory } from "../types";
import "../styles/EntryCards.styles.css";
export default function EntriesTable({
  entries,
  categories,
  subcategories,
  onEdit,
  onDelete,
}: {
  entries: Entry[];
  categories: Map<string, Category>;
  subcategories: Map<string, Subcategory>;
  onEdit: (entry: Entry) => void;
  onDelete: (entry: Entry) => void;
}) {
  const money = useMoney();
  const currency = useContext(CurrencyContext);
  useTranslation();
  const renderActions = (entry: Entry, displayTitle: string) => (
    <>
      <IconButton
        className="quiet-icon"
        onClick={() => onEdit(entry)}
        aria-label={tr("Modifica {{name}}", { name: displayTitle })}
        size="compact"
      >
        <Pencil size={16} />
      </IconButton>
      <IconButton
        className="quiet-icon danger"
        onClick={() => onDelete(entry)}
        aria-label={tr("Elimina {{name}}", { name: displayTitle })}
        size="compact"
        variant="danger"
      >
        <Trash2 size={16} />
      </IconButton>
    </>
  );
  if (!entries.length)
    return (
      <div className="empty">
        <span>
          <Wallet size={28} />
        </span>
        <p>
          {tr("Nessun movimento nel periodo selezionato. Usa il pulsante + per registrarne uno.")}
        </p>
      </div>
    );
  return (
    <>
      <div className="entry-cards" role="list" aria-label={tr("I tuoi movimenti")}>
        {entries.map((entry) => {
          const category = categories.get(entry.category);
          const title =
            (entry.subcategory ? subcategories.get(entry.subcategory)?.name : category?.name) ??
            tr("Categoria");
          const tone = entry.kind === "income" ? INCOME_COLOR : EXPENSE_COLOR;
          return (
            <article
              key={entry._id}
              role="listitem"
              className="entry-card"
              style={
                {
                  "--entry-card-tone": tone,
                  "--entry-card-category": category?.color ?? tone,
                } as CSSProperties
              }
            >
              <button type="button" className="entry-card-open"
                aria-label={tr("Modifica {{name}}", { name: title })}
                onClick={() => onEdit(entry)} />
              <div className="entry-card-main">
                <span
                  className="entry-card-icon"
                  aria-label={tr(entry.kind === "income" ? "Entrata" : "Spesa")}
                >
                  {entry.kind === "income" ? (
                    <ArrowDownLeft size={19} />
                  ) : (
                    <ArrowUpRight size={19} />
                  )}
                </span>
                <h3>{title}</h3>
                <div className="entry-card-actions">{renderActions(entry, title)}</div>
              </div>
              <div className="entry-card-footer">
                <div className="entry-card-meta">
                  <span className="entry-card-category">
                    <i aria-hidden="true" />
                    {category?.name ?? tr("Categoria")}
                  </span>
                  <span className="entry-card-date">
                    <CalendarDays size={12} aria-hidden="true" />
                    {displayDate(entry.date)}
                  </span>
                </div>
                <strong className="entry-card-amount">
                  {entry.kind === "expense" ? "−" : "+"}
                  {money(entry.amountCents)}
                </strong>
              </div>
            </article>
          );
        })}
      </div>
      <table className="entry-table entry-table--desktop">
        <caption className="sr-only">{tr("I tuoi movimenti")}</caption>
        <thead className="sr-only lg:not-sr-only">
          <tr>
            <th scope="col">{tr("Azioni")}</th>
            <th scope="col">{tr("Tipo")}</th>
            <th scope="col">{tr("Movimento")}</th>
            <th scope="col">{tr("Importo {{currency}}", { currency })}</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const category = categories.get(entry.category);
            const displayTitle =
              (entry.subcategory ? subcategories.get(entry.subcategory)?.name : category?.name) ??
              tr("Categoria");
            return (
              <tr key={entry._id} className="entry-row"
                role="button" tabIndex={0} aria-label={tr("Modifica {{name}}", { name: displayTitle })}
                onClick={(event) => {
                  if (event.target instanceof Element && !event.target.closest("a, button, input, select, textarea")) onEdit(entry);
                }}
                onKeyDown={(event) => {
                  if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
                    event.preventDefault();
                    onEdit(entry);
                  }
                }}>
                <td className="entry-actions">{renderActions(entry, displayTitle)}</td>
                <td>
                  <span
                    className="entry-icon"
                    style={{
                      color: entry.kind === "income" ? INCOME_COLOR : EXPENSE_COLOR,
                      background: (entry.kind === "income" ? INCOME_COLOR : EXPENSE_COLOR) + "15",
                    }}
                  >
                    {entry.kind === "expense" ? (
                      <ArrowUpRight size={20} />
                    ) : (
                      <ArrowDownLeft size={20} />
                    )}
                  </span>
                </td>
                <td className="entry-description">
                  <h3>{displayTitle}</h3>
                  <p>
                    {category?.name ?? tr("Categoria")}
                    {entry.subcategory && ` / ${subcategories.get(entry.subcategory)?.name ?? ""}`}
                    <span> · {displayDate(entry.date)}</span>
                  </p>
                </td>
                <td className="entry-amount">
                  <strong className={entry.kind === "income" ? "income-text" : "expense-text"}>
                    {entry.kind === "expense" ? "−" : "+"}
                    {money(entry.amountCents)}
                  </strong>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
