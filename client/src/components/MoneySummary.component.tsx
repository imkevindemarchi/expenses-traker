import { type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { PieChart, Shapes, Wallet } from "lucide-react";
import { useMoney } from "../contexts/currency.context";
import { numberFormatter } from "../utils/formatters.util";
import { budgetStatus } from "../utils/budget";
import { locale, tr } from "../i18n";
import EmptyState from "./EmptyState.component";
import type { Category, Summary } from "../types";

/** Balance of the period: the Alice & Kevin earnings hero, income vs expenses. */
export function BalanceHero({ eyebrow, summary }: { eyebrow: string; summary: Summary }) {
  useTranslation();
  const money = useMoney();
  const total = summary.income + summary.expense;
  const incomeShare = total > 0 ? (summary.income / total) * 100 : 50;
  return (
    <section className="ios-analytics__card ios-analytics__hero" aria-label={eyebrow}>
      <p className="ios-analytics__eyebrow">{eyebrow}</p>
      <p className="ios-analytics__total" data-negative={summary.balance < 0 || undefined}>
        {money(summary.balance)}
      </p>
      <p className="ios-analytics__caption">
        {tr("Entrate meno spese del periodo selezionato.")}
      </p>

      <div
        className="ios-analytics__split"
        role="img"
        aria-label={`${tr("Entrate")} ${Math.round(incomeShare)}%`}
      >
        <span style={{ width: `${incomeShare}%` }} data-kind="income" />
        <span style={{ width: `${100 - incomeShare}%` }} data-kind="expense" />
      </div>

      <dl className="ios-analytics__legend">
        <div data-kind="income">
          <dt>{tr("Entrate")}</dt>
          <dd>{money(summary.income)}</dd>
        </div>
        <div data-kind="expense">
          <dt>{tr("Spese")}</dt>
          <dd>{money(summary.expense)}</dd>
        </div>
      </dl>
    </section>
  );
}

/** Monthly budget as a grouped row with a meter (current month only). */
export function BudgetSection({
  limit,
  spent,
  className = "",
}: {
  limit: number;
  spent: number;
  className?: string;
}) {
  useTranslation();
  const money = useMoney();
  const status = budgetStatus(limit, spent);
  const state = status.remaining < 0 ? "danger" : status.progress >= 80 ? "warning" : "ok";
  return (
    <section className={`ios-analytics__section ${className}`.trim()}>
      <h2 className="ios-analytics__section-title">{tr("Budget del mese")}</h2>
      <div className="ios-analytics__card ios-analytics__list">
        <div
          className="ios-analytics__row ios-analytics__row--static ios-analytics__row--meter et-budget"
          data-state={state}
          role="progressbar"
          aria-label={tr("Budget mensile utilizzato")}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(status.progress)}
          aria-valuetext={tr("Spesi {{spent}} su {{limit}}", {
            spent: money(spent),
            limit: money(limit),
          })}
        >
          <span className="ios-analytics__row-icon" aria-hidden="true">
            <Wallet size={16} strokeWidth={2.2} />
          </span>
          <span className="ios-analytics__row-label">
            {status.remaining < 0 ? tr("Limite superato di") : tr("Ti resta da spendere")}
            <small>
              {tr("Spesi {{spent}} su {{limit}}", { spent: money(spent), limit: money(limit) })}
            </small>
          </span>
          <span className="ios-analytics__row-value">{money(Math.abs(status.remaining))}</span>
          <span className="ios-analytics__meter" aria-hidden="true">
            <span style={{ width: `${status.progress}%` }} />
          </span>
        </div>
      </div>
      <p className="ios-analytics__footnote">
        <span aria-hidden="true">{status.emoji}</span> {tr(status.message)}
      </p>
    </section>
  );
}

/** Expenses by category: one row per category with its share of the total. */
export function CategorySpending({
  summary,
  categories,
  className = "",
}: {
  summary: Summary;
  categories: Map<string, Category>;
  className?: string;
}) {
  useTranslation();
  const money = useMoney();
  return (
    <section className={`ios-analytics__section ${className}`.trim()}>
      <h2 className="ios-analytics__section-title">{tr("Spese per categoria")}</h2>
      {!summary.expense ? (
        <div className="ios-analytics__card">
          <EmptyState
            icon={<PieChart />}
            title={tr("Nessuna spesa")}
            text={tr("Le tue spese per categoria compariranno qui.")}
          />
        </div>
      ) : (
        <div className="ios-analytics__card ios-analytics__list">
          {summary.byCategory.map((item) => {
            const category = categories.get(item._id);
            const share = (item.total / summary.expense) * 100;
            return (
              <div
                key={item._id}
                className="ios-analytics__row ios-analytics__row--static ios-analytics__row--meter"
                style={{ "--row-color": category?.color ?? "#8e8e93" } as CSSProperties}
              >
                <span className="ios-analytics__row-icon" aria-hidden="true">
                  <Shapes size={16} strokeWidth={2.2} />
                </span>
                <span className="ios-analytics__row-label">
                  {category?.name ?? tr("Categoria")}
                  <small>
                    {tr("{{share}}% delle spese", {
                      share: numberFormatter(locale(), { maximumFractionDigits: 1 }).format(share),
                    })}
                  </small>
                </span>
                <span className="ios-analytics__row-value">{money(item.total)}</span>
                <span className="ios-analytics__meter" aria-hidden="true">
                  <span style={{ width: `${Math.min(100, Math.max(0, share))}%` }} />
                </span>
              </div>
            );
          })}
        </div>
      )}
      <p className="ios-analytics__footnote">
        {tr("Spese totali")}: {money(summary.expense)}
      </p>
    </section>
  );
}
