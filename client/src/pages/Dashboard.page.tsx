import { lazy, Suspense, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight, Plus } from "lucide-react";
import Header from "../components/Header.component";
import FloatingButton from "../components/FloatingButton.component";
import PeriodPicker from "../components/PeriodPicker.component";
import EntryList from "../components/EntryList.component";
import { BalanceHero, BudgetSection, CategorySpending } from "../components/MoneySummary.component";
import { OverviewSkeleton, RowsSkeleton } from "../components/Skeletons.component";
import { today } from "../api";
import { tr } from "../i18n";
import type { Category, Entry, Subcategory, Summary, User } from "../types";
import "../styles/v2/Analytics.styles.css";
import "../styles/v2/Expenses.styles.css";

const DailyTrendChart = lazy(() =>
  import("../components/MoneyCharts.component").then((module) => ({ default: module.DailyTrendChart })),
);

/** Monthly summary, laid out like Alice & Kevin Analytics. */
export default function DashboardPage({
  user,
  month,
  onMonthChange,
  summary,
  summaryLoading,
  categoriesLoading,
  entries,
  entriesLoading,
  categories,
  subcategories,
  onOpenEntry,
  onCreateEntry,
  onSeeAll,
}: {
  user: User;
  month: string;
  onMonthChange: (month: string) => void;
  summary: Summary;
  summaryLoading: boolean;
  categoriesLoading: boolean;
  entries: Entry[];
  entriesLoading: boolean;
  categories: Map<string, Category>;
  subcategories: Map<string, Subcategory>;
  onOpenEntry: (entry: Entry) => void;
  onCreateEntry: () => void;
  onSeeAll: () => void;
}) {
  useTranslation();
  const showBudget = month === today().slice(0, 7) && user.monthlyBudgetCents != null;
  const daily = useMemo(() => {
    const [year, number] = month.split("-").map(Number);
    const days = new Date(year, number, 0).getDate();
    const values = Array.from({ length: days }, () => ({ expense: 0, income: 0 }));
    for (const item of summary.daily) {
      const day = Number(item._id.date.slice(-2));
      if (values[day - 1]) values[day - 1][item._id.kind] += item.total;
    }
    return {
      labels: values.map((_, index) => String(index + 1)),
      income: values.map((value) => value.income),
      expense: values.map((value) => value.expense),
    };
  }, [month, summary.daily]);

  return (
    <main className="analytics-page ios-analytics w-full pb-8 md:py-10">
      <div className="analytics-content mx-auto flex w-full flex-col">
        <Header title={tr("Riepilogo mensile")} />

        <PeriodPicker value={month} onChange={onMonthChange} />

        {summaryLoading || categoriesLoading ? (
          <OverviewSkeleton budget={showBudget} layout="month" />
        ) : (
          <div className="ios-analytics__grid">
            <BalanceHero eyebrow={tr("Bilancio del mese")} summary={summary} />

            {showBudget && (
              <BudgetSection
                className="et-span-all"
                limit={user.monthlyBudgetCents ?? 0}
                spent={summary.expense}
              />
            )}

            <section className="ios-analytics__section ios-analytics__chart-section et-pair">
              <h2 className="ios-analytics__section-title">{tr("Andamento del mese")}</h2>
              <div className="ios-analytics__card ios-analytics__chart">
                <p className="ios-analytics__caption">
                  {tr("Come si muove il tuo denaro, giorno per giorno.")}
                </p>
                <div className="ios-analytics__chart-canvas">
                  {summary.count > 0 ? (
                    <Suspense fallback={null}>
                      <DailyTrendChart {...daily} />
                    </Suspense>
                  ) : (
                    <p className="ios-analytics__empty">{tr("Nessun movimento nel mese.")}</p>
                  )}
                </div>
              </div>
            </section>

            <CategorySpending className="et-pair" summary={summary} categories={categories} />

            {/* Latest movements: under the categories, across the whole width. */}
            <section className="ios-analytics__section et-span-all">
              <div className="ios-group__head">
                <h2 className="ios-group__title">{tr("Ultimi movimenti")}</h2>
                <button type="button" className="ios-group__action" onClick={onSeeAll}>
                  {tr("Vedi tutti")}
                  <ChevronRight size={15} strokeWidth={2.4} aria-hidden="true" className="inline" />
                </button>
              </div>
              {entriesLoading ? (
                <RowsSkeleton rows={5} list />
              ) : (
                <EntryList
                  entries={entries.slice(0, 5)}
                  categories={categories}
                  subcategories={subcategories}
                  onOpen={onOpenEntry}
                />
              )}
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
