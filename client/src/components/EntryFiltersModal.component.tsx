import { useState, type CSSProperties, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Layers3, Shapes } from "lucide-react";
import { tr } from "../i18n";
import type { Category, Subcategory } from "../types";
import Modal from "./Modal.component";
import Button from "./Button.component";
import ChoiceList from "./ChoiceList.component";
import "../styles/v2/Compose.styles.css";

type Filters = { category: string; subcategory: string; kind: string };

/** Category filters of Movements, as a compose sheet with inline choices. */
export default function EntryFiltersModal({
  initial,
  categories,
  subcategories,
  loading,
  onClose,
  onApply,
}: {
  initial: Filters;
  categories: Category[];
  subcategories: Subcategory[];
  loading: boolean;
  onClose: () => void;
  onApply: (filters: Filters) => void;
}) {
  useTranslation();
  const [draft, setDraft] = useState(initial);
  const [view, setView] = useState<"form" | "category" | "subcategory">("form");
  const category = categories.find((item) => item._id === draft.category);
  const subcategory = subcategories.find((item) => item._id === draft.subcategory);
  const all = { key: "", label: tr("Tutte"), color: "#8e8e93", icon: <Shapes size={17} /> };

  const row = (
    target: "category" | "subcategory",
    label: string,
    value: string,
    icon: ReactNode,
    disabled = false,
  ) => (
    <button
      type="button"
      className="ios-compose__row"
      style={{ "--row-color": category?.color ?? "#8e8e93" } as CSSProperties}
      disabled={disabled}
      onClick={() => setView(target)}
    >
      <span className="ios-compose__icon" aria-hidden="true">
        {icon}
      </span>
      <span className="ios-compose__copy">
        <strong>{label}</strong>
        <span>{value}</span>
      </span>
      <ChevronRight size={17} className="ios-compose__chevron" aria-hidden="true" />
    </button>
  );

  return (
    <Modal
      isOpen
      title={tr("Filtra movimenti")}
      description={tr("Combina i filtri per trovare i movimenti che cerchi.")}
      maxWidth="lg"
      onClose={onClose}
      footer={
        view !== "form" ? (
          <Button variant="secondary" onClick={() => setView("form")}>
            <ChevronLeft size={17} strokeWidth={2} />
            <span>{tr("Indietro")}</span>
          </Button>
        ) : (
          <>
            <Button
              variant="secondary"
              disabled={!draft.category && !draft.subcategory}
              onClick={() => setDraft({ ...draft, category: "", subcategory: "" })}
            >
              {tr("Azzera")}
            </Button>
            <Button onClick={() => onApply(draft)}>{tr("Applica")}</Button>
          </>
        )
      }
    >
      <div className="ios-compose">
        {view === "category" ? (
          <ChoiceList
            title={tr("Categoria")}
            choices={[
              all,
              ...categories.map((item) => ({
                key: item._id,
                label: item.name,
                color: item.color,
                icon: <Shapes size={17} />,
              })),
            ]}
            value={draft.category}
            searchPlaceholder={tr("Cerca categoria…")}
            searchPosition="top"
            onChoose={(key) => {
              setDraft({
                ...draft,
                category: key,
                subcategory: key === draft.category ? draft.subcategory : "",
              });
              setView("form");
            }}
          />
        ) : view === "subcategory" ? (
          <ChoiceList
            title={tr("Sottocategoria")}
            choices={[
              { ...all, label: tr("Tutte le sottocategorie"), color: category?.color },
              ...subcategories
                .filter((item) => item.category === draft.category)
                .map((item) => ({
                  key: item._id,
                  label: item.name,
                  color: category?.color,
                  icon: <Layers3 size={17} />,
                })),
            ]}
            value={draft.subcategory}
            searchPlaceholder={tr("Cerca sottocategoria…")}
            searchPosition="top"
            onChoose={(key) => {
              setDraft({ ...draft, subcategory: key });
              setView("form");
            }}
          />
        ) : (
          <div className="ios-compose__group">
            <p className="ios-compose__header">{tr("Categorie e sottocategorie")}</p>
            <div className="ios-compose__list">
              {row("category", tr("Categoria"), category?.name ?? tr("Tutte"), <Shapes size={17} />, loading)}
              {row(
                "subcategory",
                tr("Sottocategoria"),
                subcategory?.name ?? tr("Tutte le sottocategorie"),
                <Layers3 size={17} />,
                loading || !draft.category,
              )}
            </div>
            <p className="ios-compose__footnote">
              {tr("Scegli prima una categoria per filtrare anche per sottocategoria.")}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
