import { annualYear } from "../utils/annual-year";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Plus, TriangleAlert } from "lucide-react";
import { api, today } from "../api";
import { tr, locale } from "../i18n";
import type { AnnualSummary, Entry, Category, Subcategory } from "../types";
import Header from "../components/Header.component";
import FloatingButton from "../components/FloatingButton.component";
import PeriodPicker from "../components/PeriodPicker.component";
import EntryList from "../components/EntryList.component";
import EmptyState from "../components/EmptyState.component";
import { MonthlyBarsChart } from "../components/MoneyCharts.component";
import { BalanceHero, CategorySpending } from "../components/MoneySummary.component";
import { OverviewSkeleton } from "../components/Skeletons.component";
import { dateFormatter } from "../utils/formatters.util";
import { annualMonths } from "../utils/annual";
import "../styles/v2/Analytics.styles.css";
import "../styles/v2/Expenses.styles.css";

/** Annual summary, laid out like Alice & Kevin Analytics. */
export default function AnnualPage({
  refresh,
  categories,
  subcategories,
  onOpenEntry,
  onCreateEntry,
}: {
  refresh: number;
  categories: Map<string, Category>;
  subcategories: Map<string, Subcategory>;
  onOpenEntry: (entry: Entry) => void;
  onCreateEntry: () => void;
}) {
  useTranslation();
  const [params, setParams] = useSearchParams();
  const currentYear = Number(today().slice(0, 4));
  const year = annualYear(params.get("year"), currentYear);
  const [summary, setSummary] = useState<AnnualSummary | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setSummary(null);
    setError("");
    api<AnnualSummary>(`/annual-summary?year=${year}`, { signal: controller.signal })
      .then((result) => {
        if (active) setSummary(result);
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : "Si è verificato un errore.");
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [year, refresh]);

  const months = useMemo(() => {
    if (!summary) return null;
    const items = annualMonths(year, summary.monthly);
    return {
      labels: items.map((month) => {
        const label = dateFormatter(locale(), { month: "short" }).format(
          new Date(month.month + "-01T12:00:00Z"),
        );
        return label.charAt(0).toLocaleUpperCase(locale()) + label.slice(1);
      }),
      income: items.map((month) => month.income),
      expense: items.map((month) => month.expense),
    };
  }, [summary, year]);

  return (
    <main className="analytics-page ios-analytics w-full pb-8 md:py-10">
      <div className="analytics-content mx-auto flex w-full flex-col">
        <Header title={tr("Riepilogo annuale")} />

        <PeriodPicker mode="year" value={year} onChange={(value) => setParams({ year: value })} />

        {error ? (
          <EmptyState icon={<TriangleAlert />} title={tr("Si è verificato un errore.")} text={tr(error)} />
        ) : !summary || !months ? (
          <OverviewSkeleton layout="year" />
        ) : (
          <div className="ios-analytics__grid">
            <BalanceHero eyebrow={tr("Bilancio dell’anno")} summary={summary} />

            <section className="ios-analytics__section ios-analytics__chart-section et-pair">
              <h2 className="ios-analytics__section-title">{tr("Andamento dell’anno")}</h2>
              <div className="ios-analytics__card ios-analytics__chart">
                <p className="ios-analytics__caption">
                  {tr("Entrate e spese di ogni mese dell’anno.")}
                </p>
                <div className="ios-analytics__chart-canvas">
                  {summary.count > 0 ? (
                    <MonthlyBarsChart {...months} />
                  ) : (
                    <p className="ios-analytics__empty">{tr("Nessun movimento nell’anno.")}</p>
                  )}
                </div>
              </div>
            </section>

            <CategorySpending className="et-pair" summary={summary} categories={categories} />

            <section className="ios-analytics__section et-span-all">
              <h2 className="ios-analytics__section-title">{tr("Ultimi movimenti dell’anno")}</h2>
              <EntryList
                entries={summary.entries}
                categories={categories}
                subcategories={subcategories}
                onOpen={onOpenEntry}
              />
            </section>
          </div>
        )}
      </div>

      <div className="mobile-floating-actions fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 max-[359px]:gap-2">
        <FloatingButton
          alwaysVisibleOnMobile
          ariaLabel={tr("Nuovo movimento")}
          icon={<Plus size={28} />}
          onClick={onCreateEntry}
        />
      </div>
    </main>
  );
}
