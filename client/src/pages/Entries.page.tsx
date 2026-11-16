import { useState, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  ListFilter,
  Plus,
  RotateCcw,
  Wallet,
  X,
} from "lucide-react";
import Header from "../components/Header.component";
import FloatingButton from "../components/FloatingButton.component";
import FilterFloatingMenu from "../components/FilterFloatingMenu.component";
import DockFilterButton from "../components/DockFilterButton.component";
import PeriodPicker from "../components/PeriodPicker.component";
import Pagination from "../components/Pagination.component";
import EntryList from "../components/EntryList.component";
import { EntriesSkeleton } from "../components/Skeletons.component";
import { Shape } from "../components/LoadingShapes.component";
import { useMoney } from "../contexts/currency.context";
import { tr } from "../i18n";
import type { Category, Entry, Subcategory, Summary, TSelectOption } from "../types";
import "../styles/v2/Analytics.styles.css";
import "../styles/v2/Expenses.styles.css";

type TKindFilter = "all" | "expense" | "income";
const KIND_COLORS = { expense: "#ff453a", income: "#30d158" } as const;

/** Movements, laid out like the Alice & Kevin list pages. */
export default function EntriesPage({
  month,
  onMonthChange,
  search,
  onSearchChange,
  kind,
  onKindChange,
  category,
  subcategory,
  onClearCategory,
  onClearSubcategory,
  onOpenFilters,
  filtersOpen,
  filtersChanged,
  onResetFilters,
  summary,
  summaryLoading,
  entries,
  loading,
  totalEntries,
  page,
  limit,
  totalPages,
  onPageChange,
  onLimitChange,
  categories,
  subcategories,
  onOpenEntry,
  onCreateEntry,
}: {
  month: string;
  onMonthChange: (month: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  kind: string;
  onKindChange: (kind: string) => void;
  category: string;
  subcategory: string;
  onClearCategory: () => void;
  onClearSubcategory: () => void;
  onOpenFilters: () => void;
  filtersOpen: boolean;
  filtersChanged: boolean;
  onResetFilters: () => void;
  summary: Summary;
  summaryLoading: boolean;
  entries: Entry[];
  loading: boolean;
  totalEntries: number;
  page: number;
  limit: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  categories: Map<string, Category>;
  subcategories: Map<string, Subcategory>;
  onOpenEntry: (entry: Entry) => void;
  onCreateEntry: () => void;
}) {
  useTranslation();
  const money = useMoney();
  const [kindMenuOpen, setKindMenuOpen] = useState(false);
  const kindValue: TKindFilter = kind === "income" || kind === "expense" ? kind : "all";
  const income = kindValue === "income";
  const expense = kindValue === "expense";
  const amount = income ? summary.income : expense ? summary.expense : summary.balance;
  const BalanceIcon = income ? ArrowDownLeft : expense ? ArrowUpRight : Wallet;

  const kindOptions: TSelectOption<TKindFilter>[] = [
    { value: "all", label: tr("Tutti"), icon: <ArrowLeftRight size={17} strokeWidth={2} /> },
    {
      value: "expense",
      label: tr("Spese"),
      icon: <ArrowUpRight size={17} strokeWidth={2} />,
      color: KIND_COLORS.expense,
    },
    {
      value: "income",
      label: tr("Entrate"),
      icon: <ArrowDownLeft size={17} strokeWidth={2} />,
      color: KIND_COLORS.income,
    },
  ];
  const activeFilters = [
    { value: category, label: categories.get(category)?.name, clear: onClearCategory },
    { value: subcategory, label: subcategories.get(subcategory)?.name, clear: onClearSubcategory },
  ].filter((item) => item.value);

  return (
    <main className="analytics-page ios-analytics w-full pb-8 md:py-10">
      <div className="analytics-content mx-auto flex w-full flex-col">
        <Header
          title={tr("I tuoi movimenti")}
          placeholder={tr("Cerca un movimento…")}
          searchValue={search}
          onSearchChange={onSearchChange}
        />

        <PeriodPicker value={month} onChange={onMonthChange} inline />

        {activeFilters.length > 0 && (
          <div className="ios-hero__pills !mt-0" aria-label={tr("Filtri attivi")}>
            {activeFilters.map((item, index) => (
              <button
                key={index}
                type="button"
                className="ios-hero__pill"
                style={
                  {
                    "--pill-color": categories.get(category)?.color,
                  } as CSSProperties
                }
                aria-label={tr("Rimuovi filtro: {{name}}", { name: item.label })}
                onClick={item.clear}
              >
                <i aria-hidden="true" />
                {item.label}
                <X size={14} aria-hidden="true" />
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <EntriesSkeleton rows={limit} />
        ) : (
          <div className="ios-analytics__grid et-entries">
            <div className="ios-analytics__card ios-analytics__list" aria-live="polite">
              <div
                className="ios-analytics__row ios-analytics__row--static et-entry-row"
                data-kind={expense || (!income && amount < 0) ? "expense" : "income"}
                style={{ "--row-color": "var(--kind-color)" } as CSSProperties}
              >
                <span className="ios-analytics__row-icon" aria-hidden="true">
                  <BalanceIcon size={16} strokeWidth={2.2} />
                </span>
                <span className="ios-analytics__row-label">
                  {tr(
                    income
                      ? "Totale entrate filtrate"
                      : expense
                        ? "Totale spese filtrate"
                        : "Bilancio dei movimenti filtrati",
                  )}
                  <small>{tr("{{count}} movimenti", { count: totalEntries })}</small>
                </span>
                <span className="ios-analytics__row-value et-entry-amount">
                  {summaryLoading ? <Shape width={96} height={18} /> : money(amount)}
                </span>
              </div>
            </div>

            <EntryList
              entries={entries}
              categories={categories}
              subcategories={subcategories}
              emptyText={
                filtersChanged
                  ? tr("Nessun movimento corrisponde ai filtri. Prova a cambiarli o azzerarli.")
                  : undefined
              }
              onOpen={onOpenEntry}
            />

            {totalEntries > 0 && (
              <Pagination
                pagination={{
                  page,
                  limit,
                  total_items: totalEntries,
                  total_pages: Math.max(1, totalPages),
                  has_next_page: page < totalPages,
                  has_previous_page: page > 1,
                }}
                limitOptions={[10, 20, 50]}
                selectId="entries-pagination"
                onPageChange={onPageChange}
                onLimitChange={onLimitChange}
              />
            )}
          </div>
        )}
      </div>

      <div className="mobile-floating-actions fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 max-[359px]:gap-2">
        <FilterFloatingMenu<TKindFilter>
          alwaysVisibleOnMobile
          ariaLabel={tr("Tipo")}
          icon={<ArrowLeftRight size={26} strokeWidth={2} />}
          menuIcon={<ArrowLeftRight size={17} strokeWidth={2.2} />}
          railResetValue="all"
          value={kindValue}
          options={kindOptions}
          isOpen={kindMenuOpen}
          onToggle={() => setKindMenuOpen((previous) => !previous)}
          onChange={(next) => {
            onKindChange(next === "all" ? "" : next);
            setKindMenuOpen(false);
          }}
        />
        <DockFilterButton
          ariaLabel={tr("Filtri")}
          icon={<ListFilter size={26} strokeWidth={2} />}
          active={Boolean(category || subcategory)}
          expanded={filtersOpen}
          onClick={onOpenFilters}
        />
        {filtersChanged && (
          <DockFilterButton
            ariaLabel={tr("Azzera filtri")}
            icon={<RotateCcw size={24} strokeWidth={2} />}
            onClick={onResetFilters}
          />
        )}
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
