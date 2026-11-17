import type { CSSProperties } from "react";
import { Shape } from "./LoadingShapes.component";
import "../styles/v2/Skeletons.styles.css";

/**
 * Skeletons built on the real iOS markup of each page, so the loading state
 * has exactly the size, radius and rhythm of the content that replaces it.
 */

/** A skeleton line inside a box as tall as the real line of text. */
function TextLine({
  line,
  width,
  height,
}: {
  line: number;
  width: CSSProperties["width"];
  height: number;
}) {
  return (
    <span className="ios-skeleton__text" style={{ "--line": `${line}px` } as CSSProperties}>
      <Shape width={width} height={height} />
    </span>
  );
}

function SectionTitle({ width }: { width: number }) {
  return (
    <div className="ios-analytics__section-title">
      <TextLine line={25} width={width} height={18} />
    </div>
  );
}

/** Rows of an inset grouped list: icon, two lines, value (Movements, categories). */
export function RowsSkeleton({
  rows,
  meter = false,
  chevron = true,
  list = false,
}: {
  rows: number;
  meter?: boolean;
  chevron?: boolean;
  /** Movement rows: the card of EntryList (et-entry-list) instead of a stats list. */
  list?: boolean;
}) {
  return (
    <div
      className={`ios-analytics__card ${list ? "et-entry-list" : "ios-analytics__list"}`}
    >
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className={`ios-analytics__row ${chevron ? "" : "ios-analytics__row--static"} ${meter ? "ios-analytics__row--meter" : ""} ${list ? "et-entry-row" : ""}`}
        >
          <Shape width={30} height={30} />
          <span className="ios-analytics__row-label">
            <TextLine line={22} width={`${46 + ((i * 17) % 34)}%`} height={15} />
            <TextLine line={18} width="38%" height={11} />
          </span>
          <TextLine line={22} width={72} height={15} />
          {chevron && <span />}
          {meter && (
            <span className="ios-analytics__meter">
              <span style={{ width: `${30 + ((i * 15) % 60)}%`, background: "transparent" }} />
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/** The footnote under a section (.ios-analytics__footnote, 13/18). */
function Footnote({ width }: { width: CSSProperties["width"] }) {
  return (
    <div className="ios-analytics__footnote">
      <TextLine line={18} width={width} height={11} />
    </div>
  );
}

function ChartSkeleton({ titleWidth }: { titleWidth: number }) {
  return (
    <section className="ios-analytics__section ios-analytics__chart-section et-pair">
      <SectionTitle width={titleWidth} />
      <div className="ios-analytics__card ios-analytics__chart">
        <div className="ios-analytics__caption">
          <TextLine line={18} width="64%" height={11} />
        </div>
        <div className="ios-analytics__chart-canvas ios-skeleton__bars">
          {[42, 68, 50, 82, 58, 92, 70, 84, 64, 76].map((height, i) => (
            <Shape key={i} width="100%" height={`${height}%`} />
          ))}
        </div>
      </div>
    </section>
  );
}

/** The balance hero: eyebrow, total, caption, income/expense split and legend. */
function HeroSkeleton() {
  return (
    <section className="ios-analytics__card ios-analytics__hero">
      <TextLine line={20} width={140} height={14} />
      <span className="ios-skeleton__text ios-skeleton__text--hero">
        <Shape width="52%" height="78%" />
      </span>
      <TextLine line={18} width={240} height={11} />
      <div className="ios-analytics__split">
        <Shape width="48%" height={10} round />
        <Shape width="52%" height={10} round />
      </div>
      <div className="ios-analytics__legend">
        {[0, 1].map((i) => (
          <div key={i}>
            <Shape width={10} height={10} round />
            <Shape width="40%" height={14} />
            <span className="ios-skeleton__push" />
            <Shape width={84} height={16} />
          </div>
        ))}
      </div>
    </section>
  );
}

/** Expenses by category: title, rows with their meter, total footnote. */
function CategoriesSpendingSkeleton() {
  return (
    <section className="ios-analytics__section et-pair">
      <SectionTitle width={190} />
      <RowsSkeleton rows={4} meter chevron={false} />
      <Footnote width={150} />
    </section>
  );
}

/**
 * Summaries, section by section in the order of the pages:
 * month — hero, budget, chart, categories, latest movements ("See all");
 * year — hero, chart, categories, latest movements of the year.
 */
export function OverviewSkeleton({
  layout,
  budget = false,
}: {
  layout: "month" | "year";
  budget?: boolean;
}) {
  return (
    <div className="ios-analytics__grid ios-skeleton" aria-hidden="true">
      <HeroSkeleton />
      {layout === "month" ? (
        <>
          {budget && (
            <section className="ios-analytics__section et-span-all">
              <SectionTitle width={160} />
              <RowsSkeleton rows={1} meter chevron={false} />
              <Footnote width="60%" />
            </section>
          )}
          <ChartSkeleton titleWidth={180} />
          <CategoriesSpendingSkeleton />
          <section className="ios-analytics__section et-span-all">
            <div className="ios-group__head">
              <TextLine line={25} width={170} height={18} />
              <TextLine line={20} width={70} height={13} />
            </div>
            <RowsSkeleton rows={5} list />
          </section>
        </>
      ) : (
        <>
          <ChartSkeleton titleWidth={180} />
          <CategoriesSpendingSkeleton />
          <section className="ios-analytics__section et-span-all">
            <SectionTitle width={210} />
            <RowsSkeleton rows={5} list />
          </section>
        </>
      )}
    </div>
  );
}

/** Movements: filtered balance, then the list. */
export function EntriesSkeleton({ rows }: { rows: number }) {
  return (
    <div className="ios-analytics__grid et-entries ios-skeleton" aria-hidden="true">
      <RowsSkeleton rows={1} chevron={false} />
      <RowsSkeleton rows={Math.min(rows, 12)} list />
    </div>
  );
}

function GroupSkeleton({
  titleWidth,
  rows,
  footer = false,
  className = "",
}: {
  titleWidth: number;
  rows: number;
  footer?: boolean;
  className?: string;
}) {
  return (
    <section className={`ios-group ${className}`.trim()}>
      <div className="ios-group__head">
        <TextLine line={25} width={titleWidth} height={18} />
      </div>
      <div className="ios-group__card">
        {Array.from({ length: rows }, (_, i) => (
          <div className="ios-cell" key={i}>
            <Shape width={30} height={30} />
            <TextLine line={22} width={`${40 + ((i * 19) % 36)}%`} height={15} />
            <Shape width={9} height={14} />
          </div>
        ))}
      </div>
      {footer && (
        <div className="ios-group__footer">
          <TextLine line={18} width="72%" height={11} />
        </div>
      )}
    </section>
  );
}

/** Management: one card per category (badge, name, count, edit) with its subcategories. */
export function CategoriesSkeleton() {
  return (
    <div className="et-categories ios-skeleton" aria-hidden="true">
      {[2, 1, 2, 1, 2].map((rows, i) => (
        <section
          key={i}
          className="ios-group et-category-card"
          style={{ "--category-color": "var(--lg-fill-strong)" } as CSSProperties}
        >
          {/* The real head: the badge (a dot on phones), the name, the count, "Edit". */}
          <div className="ios-group__head et-category-card__head">
            <span className="et-category-card__badge" />
            <span className="ios-group__title">
              <TextLine line={25} width={90 + (i % 3) * 30} height={18} />
            </span>
            <span className="et-category-card__count">
              <TextLine line={18} width={90} height={11} />
            </span>
            <TextLine line={22} width={64} height={14} />
          </div>
          <div className="ios-group__card ios-category-list">
            {Array.from({ length: rows }, (_, row) => (
              <div className="ios-category" key={row}>
                <div className="ios-cell ios-category__open">
                  <Shape width={30} height={30} />
                  <TextLine line={22} width={`${40 + ((row * 19 + i * 7) % 36)}%`} height={15} />
                  <Shape width={9} height={14} />
                </div>
                <span className="ios-category__delete">
                  <Shape width={17} height={17} />
                </span>
              </div>
            ))}
            {/* "New subcategory" */}
            <div className="ios-cell ios-cell--action">
              <Shape width={30} height={30} />
              <TextLine line={22} width="52%" height={15} />
            </div>
          </div>
          <div className="ios-group__footer et-category-card__footer">
            <TextLine line={18} width={110} height={11} />
          </div>
        </section>
      ))}
    </div>
  );
}

/**
 * Settings: hero, then the grouped sections in two columns on wide screens
 * (profile, currency, monthly limit dial, data | security, appearance).
 */
export function SettingsSkeleton() {
  return (
    <div className="ios-page ios-page--split ios-skeleton" aria-hidden="true">
      <section className="ios-hero ios-page__wide">
        <TextLine line={20} width={170} height={14} />
        <span className="ios-skeleton__text ios-skeleton__text--hero">
          <Shape width={180} height="78%" />
        </span>
        <TextLine line={18} width={230} height={11} />
      </section>
      <div className="ios-page__column">
        <GroupSkeleton titleWidth={80} rows={2} footer />
        <GroupSkeleton titleWidth={70} rows={1} footer />
        <section className="ios-group">
          <div className="ios-group__head">
            <TextLine line={25} width={190} height={18} />
          </div>
          <div className="ios-group__card et-dial">
            <div className="et-dial__row">
              <span className="et-dial__unit" data-field="whole">
                <Shape width="100%" height={64} />
                <TextLine line={16} width={18} height={10} />
              </span>
              <span className="et-dial__sep" />
              <span className="et-dial__unit" data-field="cents">
                <Shape width="100%" height={64} />
                <TextLine line={16} width={34} height={10} />
              </span>
            </div>
          </div>
          <div className="ios-group__footer">
            <TextLine line={18} width="80%" height={11} />
          </div>
        </section>
        <GroupSkeleton titleWidth={90} rows={3} footer className="max-lg:hidden" />
      </div>
      <div className="ios-page__column">
        <GroupSkeleton titleWidth={100} rows={1} footer />
        <section className="ios-group">
          <div className="ios-group__head">
            <TextLine line={25} width={110} height={18} />
          </div>
          <div className="ios-group__card ios-group__card--padded lg-clarity">
            <Shape width="100%" height={112} />
            <TextLine line={20} width="45%" height={13} />
            <TextLine line={28} width="100%" height={8} />
          </div>
          <div className="ios-group__footer">
            <TextLine line={18} width="70%" height={11} />
          </div>
        </section>
        <GroupSkeleton titleWidth={90} rows={3} footer className="lg:hidden" />
      </div>
    </div>
  );
}
