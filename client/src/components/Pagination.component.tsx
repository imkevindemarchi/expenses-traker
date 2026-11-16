import {
  type CSSProperties,
  type FC,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { pageLimit, pageLimitOptions, paginationState } from "../utils/pagination.util";
import "../styles/v2/Pagination.styles.css";

import type { TPagination } from "../types";

interface IProps {
  pagination: TPagination;
  limitOptions?: number[];
  flush?: boolean;
  /** Kept for compatibility with existing call sites. */
  compactDesktop?: boolean;
  selectId?: string;
  className?: string;
  /** Kept for compatibility with existing call sites. */
  selectContainerClassName?: string;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

/** Horizontal travel (px) that turns a drag on the capsule into a page change. */
const SWIPE_DISTANCE = 44;

/**
 * Pagination (iOS 27): one Liquid Glass capsule — previous, "Page 2 of 4"
 * with the visible range, next — and a hairline progress along its edge.
 * Tapping the middle opens a glass panel to jump to any page or change the
 * page size; a horizontal swipe on the capsule turns the page.
 */
const Pagination: FC<IProps> = ({
  pagination: inputPagination,
  limitOptions = [10, 20, 50],
  flush = true,
  selectId = "pagination",
  className = "",
  onPageChange,
  onLimitChange,
}) => {
  const { t } = useTranslation();
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const pagination = paginationState(inputPagination);
  const sizes = pageLimitOptions(limitOptions, pagination.limit);
  const totalPages = Math.max(1, pagination.total_pages);
  const page = Math.min(Math.max(1, pagination.page), totalPages);

  useEffect(() => {
    if (inputPagination.limit !== pagination.limit) onLimitChange(pagination.limit);
    else if (inputPagination.page !== pagination.page) onPageChange(pagination.page);
  }, [
    inputPagination.limit,
    inputPagination.page,
    pagination.limit,
    pagination.page,
    onLimitChange,
    onPageChange,
  ]);

  // The panel closes on a tap elsewhere, on Escape, and when the page changes.
  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: PointerEvent): void => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const goTo = (target: number): void => {
    if (!Number.isInteger(target) || target < 1 || target > totalPages || target === page) return;
    setIsOpen(false);
    onPageChange(target);
  };

  const first = pagination.total_items === 0 ? 0 : (page - 1) * pagination.limit + 1;
  const last = Math.min(page * pagination.limit, pagination.total_items);
  const canGoBack = pagination.has_previous_page && page > 1;
  const canGoForward = pagination.has_next_page && page < totalPages;

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (event.pointerType === "mouse") return;
    swipe.current = { x: event.clientX, y: event.clientY };
  };
  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const start = swipe.current;
    swipe.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    if (Math.abs(dx) < SWIPE_DISTANCE || Math.abs(dx) < Math.abs(event.clientY - start.y)) return;
    if (dx < 0 && canGoForward) goTo(page + 1);
    if (dx > 0 && canGoBack) goTo(page - 1);
  };

  return (
    <div
      className={`pagination-surface lg-pager ${flush ? "" : "sm:mt-5"} ${className}`}
      data-open={isOpen || undefined}
    >
      <div ref={rootRef} className="lg-pager__anchor">
        <nav
          aria-label={t("pagination.navigationLabel")}
          className="lg-pager__capsule"
          style={{ "--pager-progress": `${(page / totalPages) * 100}%` } as CSSProperties}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (swipe.current = null)}
        >
          <button
            type="button"
            className="lg-pager__arrow"
            disabled={!canGoBack}
            aria-label={t("pagination.previous")}
            onClick={() => goTo(page - 1)}
          >
            <ChevronLeft size={21} strokeWidth={2.5} aria-hidden="true" />
          </button>

          <button
            type="button"
            className="lg-pager__center"
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            aria-controls={panelId}
            onClick={() => setIsOpen((open) => !open)}
          >
            <span className="lg-pager__page" aria-live="polite">
              {t("pagination.pageOf", { page, total: totalPages })}
            </span>
            <span className="lg-pager__range">
              {t("pagination.results", { first, last, total: pagination.total_items })}
            </span>
          </button>

          <button
            type="button"
            className="lg-pager__arrow"
            disabled={!canGoForward}
            aria-label={t("pagination.next")}
            onClick={() => goTo(page + 1)}
          >
            <ChevronRight size={21} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </nav>

        {isOpen && (
          <div id={panelId} role="dialog" aria-label={t("pagination.jumpTo")} className="lg-pager__panel">
            <p className="lg-pager__label">{t("pagination.jumpTo")}</p>
            <div className="lg-pager__pages">
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((item) => (
                <button
                  key={item}
                  type="button"
                  className="lg-pager__number"
                  aria-current={item === page ? "page" : undefined}
                  aria-label={t("pagination.goToPage", { page: item })}
                  onClick={() => goTo(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            <p className="lg-pager__label" id={`${selectId}-size`}>
              {t("pagination.perPage")}
            </p>
            <div className="lg-pager__sizes" role="group" aria-labelledby={`${selectId}-size`}>
              {sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  aria-pressed={size === pagination.limit}
                  onClick={() => {
                    setIsOpen(false);
                    if (size !== pagination.limit) onLimitChange(pageLimit(size));
                  }}
                >
                  {size === pagination.limit && (
                    <Check size={14} strokeWidth={2.8} aria-hidden="true" />
                  )}
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pagination;
