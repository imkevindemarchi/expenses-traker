import ModalChoiceField from "./ModalChoiceField.component";
import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  Layers3,
  Shapes,
  Wallet,
} from "lucide-react";
import { tr } from "../i18n";
import type { Category, Subcategory } from "../types";
import Modal from "./Modal.component";
import Button from "./Button.component";
import "../styles/EntryModal.styles.css";
import "../styles/EntryFiltersModal.styles.css";

export type EntryFilters = { category: string; subcategory: string; kind: string };

export default function EntryFiltersModal({
  initial,
  categories,
  subcategories,
  loading,
  onClose,
  onApply,
}: {
  initial: EntryFilters;
  categories: Category[];
  subcategories: Subcategory[];
  loading: boolean;
  onClose: () => void;
  onApply: (filters: EntryFilters) => void;
}) {
  const [draft, setDraft] = useState(initial);
  const selectedCategory = categories.find((item) => item._id === draft.category);
  const selectedSubcategory = subcategories.find((item) => item._id === draft.subcategory);
  const visibleSubcategories = draft.category
    ? subcategories.filter((item) => item.category === draft.category)
    : subcategories;
  const choose = (key: "category" | "subcategory", value: string) => {
    setDraft((current) => ({
      ...current,
      [key]: value,
      ...(key === "category" &&
      value &&
      !subcategories.some((item) => item._id === current.subcategory && item.category === value)
        ? { subcategory: "" }
        : {}),
    }));

  };
  return (
    <Modal
      isOpen
      appearance="entry"
      title={tr("Filtra movimenti")}
      maxWidth="lg"
      onClose={onClose}
      footer={
        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose}>
            {tr("Annulla")}
          </Button>
          <Button className="entry-save" icon={<Check size={17} />} onClick={() => onApply(draft)}>
            {tr("Applica filtri")}
          </Button>
        </div>
      }
    >
      <div className={`entry-filters entry-edit-form ${draft.kind || "all"}`}>
        <fieldset className="entry-filter-section">
          <legend className="sr-only">{tr("Tipo di movimento")}</legend>
          <div
            className="entry-edit-kind entry-filter-kinds"
            role="group"
            aria-label={tr("Tipo di movimento")}
          >
            {[
              { value: "", label: tr("Tutti"), Icon: Wallet },
              { value: "expense", label: tr("Spesa"), Icon: ArrowUpRight },
              { value: "income", label: tr("Entrata"), Icon: ArrowDownLeft },
            ].map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                className={`entry-kind-option ${value || "all"}`}
                aria-pressed={draft.kind === value}
                onClick={() => setDraft({ ...draft, kind: value })}
              >
                <span className="entry-kind-icon">
                  <Icon size={19} aria-hidden="true" />
                </span>
                <span className="entry-kind-label">{label}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <section className="entry-edit-classification" aria-label={tr("Categorie e sottocategorie")}>
          <ModalChoiceField
            id="entry-filter-category" label={tr("Categoria")} placeholder={tr("Tutte le categorie")}
            searchPlaceholder={tr("Cerca categoria…")} icon={<Shapes size={19} />}
            value={selectedCategory ?? null} options={categories} isLoading={loading}
            getOptionKey={(item) => item._id} getOptionLabel={(item) => item.name}
            getOptionIcon={(item) => <i className="category-filter-dot" style={{ background: item.color }} />}
            onChange={(item) => choose("category", item?._id ?? "")}
          />
          <ModalChoiceField
            id="entry-filter-subcategory" label={tr("Sottocategoria")} placeholder={tr("Tutte le sottocategorie")}
            searchPlaceholder={tr("Cerca sottocategoria…")} icon={<Layers3 size={19} />}
            value={selectedSubcategory ?? null} options={visibleSubcategories} isLoading={loading}
            getOptionKey={(item) => item._id} getOptionLabel={(item) => item.name}
            getOptionDescription={(item) => !draft.category ? categories.find((parent) => parent._id === item.category)?.name : undefined}
            getOptionIcon={(item) => <i className="category-filter-dot" style={{ background: categories.find((parent) => parent._id === item.category)?.color }} />}
            onChange={(item) => choose("subcategory", item?._id ?? "")}
          />
        </section>
      </div>
    </Modal>
  );
}
