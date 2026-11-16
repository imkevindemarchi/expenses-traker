import { type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight, Layers3, Plus, Shapes, Trash2 } from "lucide-react";
import Header from "../components/Header.component";
import FloatingButton from "../components/FloatingButton.component";
import EmptyState from "../components/EmptyState.component";
import { CategoriesSkeleton } from "../components/Skeletons.component";
import { tr } from "../i18n";
import type { Category, Subcategory } from "../types";
import "../styles/v2/Analytics.styles.css";
import "../styles/v2/Expenses.styles.css";

/**
 * Categories and their subcategories, as iOS inset groups (one per category):
 * the group title edits the category, every row a subcategory, the last row
 * adds one. Laid out like the Alice & Kevin categories page.
 */
export default function ManagementPage({
  categories,
  subcategoriesByCategory,
  loading,
  onCreateCategory,
  onEditCategory,
  onCreateSubcategory,
  onEditSubcategory,
  onDeleteSubcategory,
}: {
  categories: Category[];
  subcategoriesByCategory: Map<string, Subcategory[]>;
  loading: boolean;
  onCreateCategory: () => void;
  onEditCategory: (category: Category) => void;
  onCreateSubcategory: (category: Category) => void;
  onEditSubcategory: (subcategory: Subcategory, category: Category) => void;
  onDeleteSubcategory: (subcategory: Subcategory) => void;
}) {
  useTranslation();
  return (
    <main className="categories-library-page w-full pb-8 md:py-10">
      <div className="analytics-content mx-auto flex w-full flex-col">
        <Header title={tr("Categorie")} />
        <p className="ios-analytics__footnote !-mt-5">
          {tr(
            "Ogni sottocategoria appartiene a una categoria principale. Tutto quello che crei è visibile solo nel tuo account.",
          )}
        </p>

        {loading ? (
          <CategoriesSkeleton />
        ) : !categories.length ? (
          <EmptyState
            icon={<Shapes />}
            title={tr("Un nuovo inizio.")}
            text={tr("Crea la tua prima categoria per iniziare.")}
          />
        ) : (
          <div className="et-categories">
            {categories.map((category) => {
              const items = subcategoriesByCategory.get(category._id) ?? [];
              const color = {
                "--cell-color": category.color,
                "--category-color": category.color,
              } as CSSProperties;
              return (
                <section
                  key={category._id}
                  className="ios-group et-category-card"
                  style={color}
                  aria-label={tr("Sottocategorie di {{name}}", { name: category.name })}
                >
                  <div className="ios-group__head et-category-card__head">
                    <span className="et-category-card__badge" aria-hidden="true">
                      <Shapes />
                    </span>
                    <h2 className="ios-group__title">{category.name}</h2>
                    <span className="et-category-card__count">
                      {tr("{{count}} sottocategorie", { count: items.length })}
                    </span>
                    <button
                      type="button"
                      className="ios-group__action"
                      aria-label={tr("Modifica {{name}}", { name: category.name })}
                      onClick={() => onEditCategory(category)}
                    >
                      {tr("Modifica")}
                    </button>
                  </div>
                  <div className="ios-group__card ios-category-list" role="list">
                    {items.map((item) => (
                      <div key={item._id} className="ios-category" role="listitem">
                        <button
                          type="button"
                          className="ios-cell ios-category__open"
                          aria-label={tr("Modifica {{name}}", { name: item.name })}
                          onClick={() => onEditSubcategory(item, category)}
                        >
                          <span className="ios-cell__icon" style={color}>
                            <Layers3 aria-hidden="true" />
                          </span>
                          <span className="ios-cell__label">{item.name}</span>
                          <span className="ios-cell__value">
                            <ChevronRight
                              size={17}
                              strokeWidth={2.4}
                              className="ios-cell__chevron"
                              aria-hidden="true"
                            />
                          </span>
                        </button>
                        <button
                          type="button"
                          className="ios-category__delete"
                          aria-label={tr("Elimina {{name}}", { name: item.name })}
                          title={tr("Elimina")}
                          onClick={() => onDeleteSubcategory(item)}
                        >
                          <Trash2 size={17} strokeWidth={2.1} aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="ios-cell ios-cell--action"
                      onClick={() => onCreateSubcategory(category)}
                    >
                      <span className="ios-cell__icon" style={color}>
                        <Plus aria-hidden="true" />
                      </span>
                      <span className="ios-cell__label">{tr("Nuova sottocategoria")}</span>
                      <span />
                    </button>
                  </div>
                  <p className="ios-group__footer et-category-card__footer">
                    {tr("{{count}} sottocategorie", { count: items.length })}
                  </p>
                </section>
              );
            })}
          </div>
        )}
      </div>

      <div className="mobile-floating-actions fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 max-[359px]:gap-2">
        <FloatingButton
          alwaysVisibleOnMobile
          ariaLabel={tr("Nuova categoria")}
          icon={<Plus size={28} />}
          onClick={onCreateCategory}
        />
      </div>
    </main>
  );
}
