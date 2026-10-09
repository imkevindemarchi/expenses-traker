import { type FC, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

// assets
import { getLiquidGlassClass } from "../assets/constants";

// components
import Select from "./Select.component";

// hooks
import { useTheme } from "../hooks";

// types
import type { TPagination } from "../types";

interface IProps {
  pagination: TPagination;
  limitOptions?: number[];
  justSelect?: boolean;
  mobileJustSelect?: boolean;
  flush?: boolean;
  compactDesktop?: boolean;
  selectId?: string;
  className?: string;
  selectContainerClassName?: string;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

type TPaginationItem = number | "ellipsis-start" | "ellipsis-end";

const Pagination: FC<IProps> = ({
  pagination,
  limitOptions = [10, 20, 50],
  justSelect = false,
  mobileJustSelect = false,
  flush = false,
  compactDesktop = false,
  selectId = "pagination-limit",
  className = "",
  selectContainerClassName = "",
  onPageChange,
  onLimitChange,
}) => {
  const { theme } = useTheme();
  const isMobile = window.matchMedia('(max-width: 639px)').matches;
  const { t } = useTranslation();

  const paginationItems: TPaginationItem[] = useMemo(() => {
    const totalPages: number = pagination.total_pages;
    const currentPage: number = pagination.page;

    if (totalPages <= 7) {
      return Array.from(
        { length: totalPages },
        (_: unknown, index: number): number => index + 1,
      );
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "ellipsis-end", totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [
        1,
        "ellipsis-start",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      "ellipsis-start",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "ellipsis-end",
      totalPages,
    ];
  }, [pagination.page, pagination.total_pages]);

  const firstVisibleItem: number =
    pagination.total_items === 0
      ? 0
      : (pagination.page - 1) * pagination.limit + 1;

  const lastVisibleItem: number = Math.min(
    pagination.page * pagination.limit,
    pagination.total_items,
  );

  const handlePreviousPage = (): void => {
    if (!pagination.has_previous_page || pagination.page <= 1) {
      return;
    }

    onPageChange(pagination.page - 1);
  };

  const handleNextPage = (): void => {
    if (
      !pagination.has_next_page ||
      pagination.page >= pagination.total_pages
    ) {
      return;
    }

    onPageChange(pagination.page + 1);
  };

  const handlePageClick = (page: number): void => {
    if (page === pagination.page) {
      return;
    }

    onPageChange(page);
  };

  const handleLimitChange = (limit: number): void => {
    if (limit === pagination.limit) {
      return;
    }

    onLimitChange(limit);
  };

  const renderLimitSelect = (id: string) => (
    <Select
      id={id}
      name={id}
      value={pagination.limit.toString()}
      options={limitOptions.map((option: number) => ({
        value: option.toString(),
        label: option.toString(),
      }))}
      openUpwardOnMobile
      onChange={(value: string): void => handleLimitChange(Number(value))}
    />
  );

  const renderLiquidGlassSelect = (id: string, responsiveClassName = "") => (
    <div className={`mx-auto w-fit ${responsiveClassName}`}>
      <div
        className={`flex items-center justify-center overflow-visible rounded-[22px] p-2`}
      >
        <div className={`w-24 ${selectContainerClassName}`}>
          {renderLimitSelect(id)}
        </div>
      </div>
    </div>
  );

  if (pagination.total_items === 0) {
    return null;
  }

  if (justSelect) {
    return renderLiquidGlassSelect(selectId);
  }

  return (
    <>
      {mobileJustSelect &&
        renderLiquidGlassSelect(`${selectId}-mobile`, "sm:hidden")}

      <div
        className={`${mobileJustSelect ? "hidden sm:block" : "block"} ${flush ? "mt-0 pt-0" : "mt-0 pt-0 sm:mt-5 sm:pt-5"} ${className}`}
      >
        <div
          className={`relative overflow-visible rounded-[26px] p-2 ${!isMobile && `${getLiquidGlassClass(theme)} border`}`}
        >
          <div className="flex w-full items-center justify-between gap-3 sm:hidden">
            <button
              type="button"
              disabled={!pagination.has_previous_page}
              onClick={handlePreviousPage}
              aria-label={t("pagination.previous")}
              className={`flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-[13px] border transition-[background-color,border-color,color,transform,box-shadow] duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 ${theme === "light" ? "border-black/6 bg-white/45 text-darkgray hover:border-primary/20 hover:bg-primary/8 hover:text-primary hover:shadow-[0_8px_20px_rgba(15,23,42,0.08)]" : "border-white/[0.07] bg-white/[0.035] text-gray hover:border-primary/25 hover:bg-primary/10 hover:text-primary hover:shadow-[0_10px_24px_rgba(0,0,0,0.24)]"}`}
            >
              <ChevronLeft size={16} strokeWidth={2.1} />
            </button>

            <div className={`w-24 shrink-0 ${selectContainerClassName}`}>
              {renderLimitSelect(`${selectId}-mobile`)}
            </div>

            <button
              type="button"
              disabled={!pagination.has_next_page}
              onClick={handleNextPage}
              aria-label={t("pagination.next")}
              className={`flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-[13px] border transition-[background-color,border-color,color,transform,box-shadow] duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 ${theme === "light" ? "border-black/6 bg-white/45 text-darkgray hover:border-primary/20 hover:bg-primary/8 hover:text-primary hover:shadow-[0_8px_20px_rgba(15,23,42,0.08)]" : "border-white/[0.07] bg-white/[0.035] text-gray hover:border-primary/25 hover:bg-primary/10 hover:text-primary hover:shadow-[0_10px_24px_rgba(0,0,0,0.24)]"}`}
            >
              <ChevronRight size={16} strokeWidth={2.1} />
            </button>
          </div>

          <div className="hidden w-full min-w-0 items-center justify-between gap-2 sm:flex">
            <div
              className={`${compactDesktop ? "hidden xl:flex" : "hidden lg:flex"} min-w-0 items-center rounded-[18px] px-3 py-2.5`}
            >
              <div className="min-w-0">
                <p
                  className={`text-[11px] uppercase ${theme === "light" ? "text-darkgray/70" : "text-gray/70"}`}
                >
                  {t("pagination.results", {
                    first: firstVisibleItem,
                    last: lastVisibleItem,
                    total: pagination.total_items,
                  })}
                </p>
                <p
                  className={`mt-0.5 text-sm font-semibold ${theme === "light" ? "text-black" : "text-white"}`}
                >
                  {pagination.page} / {pagination.total_pages}
                </p>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5 xl:gap-2">
              <nav
                aria-label={t("pagination.navigationLabel")}
                className={`flex min-w-0 items-center justify-center gap-0.5 rounded-[18px] border p-1 ${theme === "light" ? "border-white/70 bg-white/38 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]" : "border-white/8 bg-white/4 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]"}`}
              >
                <button
                  type="button"
                  disabled={!pagination.has_previous_page}
                  onClick={handlePreviousPage}
                  aria-label={t("pagination.previous")}
                  className={`flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-[13px] border transition-[background-color,border-color,color,transform,box-shadow] duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 ${theme === "light" ? "border-black/6 bg-white/45 text-darkgray hover:border-primary/20 hover:bg-primary/8 hover:text-primary hover:shadow-[0_8px_20px_rgba(15,23,42,0.08)]" : "border-white/[0.07] bg-white/[0.035] text-gray hover:border-primary/25 hover:bg-primary/10 hover:text-primary hover:shadow-[0_10px_24px_rgba(0,0,0,0.24)]"}`}
                >
                  <ChevronLeft size={16} strokeWidth={2.1} />
                </button>

                {paginationItems.map((item: TPaginationItem, index: number) => {
                  if (item === "ellipsis-start" || item === "ellipsis-end") {
                    return (
                      <span
                        key={`${item}-${index}`}
                        aria-hidden="true"
                        className={`flex h-9 w-5 shrink-0 items-center justify-center text-xs font-semibold ${theme === "light" ? "text-darkgray/60" : "text-gray/60"}`}
                      >
                        …
                      </span>
                    );
                  }

                  const isActive: boolean = item === pagination.page;

                  return (
                    <button
                      key={item}
                      type="button"
                      aria-current={isActive ? "page" : undefined}
                      aria-label={t("pagination.goToPage", { page: item })}
                      onClick={(): void => handlePageClick(item)}
                      className={`flex h-9 min-w-8 shrink-0 cursor-pointer items-center justify-center rounded-xl border px-2 text-xs font-semibold transition-[background-color,border-color,color,transform,box-shadow] duration-200 active:scale-95 disabled:cursor-not-allowed ${isActive ? "border-primary bg-primary text-white shadow-[0_8px_22px_rgba(0,0,0,0.16),inset_0_1px_0_rgba(255,255,255,0.24)]" : theme === "light" ? "border-transparent text-darkgray hover:border-primary/15 hover:bg-primary/7 hover:text-primary" : "border-transparent text-gray hover:border-primary/20 hover:bg-primary/10 hover:text-primary"}`}
                    >
                      {item}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={!pagination.has_next_page}
                  onClick={handleNextPage}
                  aria-label={t("pagination.next")}
                  className={`flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-[13px] border transition-[background-color,border-color,color,transform,box-shadow] duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 ${theme === "light" ? "border-black/6 bg-white/45 text-darkgray hover:border-primary/20 hover:bg-primary/8 hover:text-primary hover:shadow-[0_8px_20px_rgba(15,23,42,0.08)]" : "border-white/[0.07] bg-white/[0.035] text-gray hover:border-primary/25 hover:bg-primary/10 hover:text-primary hover:shadow-[0_10px_24px_rgba(0,0,0,0.24)]"}`}
                >
                  <ChevronRight size={16} strokeWidth={2.1} />
                </button>
              </nav>
            </div>

            <div
              className={`flex shrink-0 items-center gap-2 rounded-[18px] p-1 pl-2`}
            >
              <span
                className={`hidden text-sm font-medium xl:inline ${theme === "light" ? "text-darkgray" : "text-gray"}`}
              >
                {t("pagination.perPage")}
              </span>

              <div className={`w-24 shrink-0 ${selectContainerClassName}`}>
                {renderLimitSelect(`${selectId}-desktop`)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Pagination;
