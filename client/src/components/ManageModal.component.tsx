import { useLayoutEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronLeft,
  ChevronRight,
  Layers3,
  Palette,
  Plus,
  Save,
  Shapes,
  Trash2,
  Type,
  X,
} from "lucide-react";
import { tr } from "../i18n";
import type { Category } from "../types";
import Modal from "./Modal.component";
import Button from "./Button.component";
import ChoiceList from "./ChoiceList.component";
import InlineDeleteConfirm from "./InlineDeleteConfirm.component";
import "../styles/v2/Compose.styles.css";
import "../styles/v2/Expenses.styles.css";

export type ManageForm = {
  mode: "category" | "subcategory";
  id?: string;
  name: string;
  color: string;
  category: string;
};

/** Create / edit a category or a subcategory, as an iOS grouped form sheet. */
export default function ManageModal({
  form,
  categories,
  categoriesLoading,
  busy,
  onChange,
  onClose,
  onSubmit,
  onDelete,
}: {
  form: ManageForm | null;
  categories: Category[];
  categoriesLoading: boolean;
  busy: boolean;
  onChange: (form: ManageForm) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
  /** Deletes the record being edited, after the inline confirmation. */
  onDelete: () => void | Promise<void>;
}) {
  useTranslation();
  const [choosingParent, setChoosingParent] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  // A new form (another record, or the sheet reopened) starts without the confirmation.
  const [formKey, setFormKey] = useState(form?.id ?? form?.mode ?? null);
  if ((form?.id ?? form?.mode ?? null) !== formKey) {
    setFormKey(form?.id ?? form?.mode ?? null);
    setConfirmingDelete(false);
    setChoosingParent(false);
  }
  const nameRef = useRef<HTMLInputElement>(null);
  // A new record: focus its name once the sheet has locked the page (this runs
  // after the Modal's own layout effects), without letting the browser scroll
  // the page under it; the sheet then follows the keyboard (useModalViewport).
  const openedNew = form && !form.id ? form.mode : null;
  useLayoutEffect(() => {
    if (openedNew) nameRef.current?.focus({ preventScroll: true });
  }, [openedNew]);
  const parent = categories.find((item) => item._id === form?.category);
  const accent = form?.mode === "category" ? form.color : parent?.color;
  const title = tr(
    form?.mode === "category"
      ? form.id
        ? "Modifica categoria"
        : "Nuova categoria"
      : form?.id
        ? "Modifica sottocategoria"
        : "Nuova sottocategoria",
  );

  return (
    <Modal
      isOpen={Boolean(form)}
      title={title}
      maxWidth="md"
      isClosable={!busy}
      closeOnBackdropClick={!busy}
      onClose={() => {
        setChoosingParent(false);
        setConfirmingDelete(false);
        onClose();
      }}
      footer={
        <div className="modal-record-actions flex w-full flex-col gap-3">
          {confirmingDelete && form?.id && (
            <InlineDeleteConfirm
              title={tr(form.mode === "category" ? "Elimina categoria" : "Elimina sottocategoria")}
              message={tr(
                "Le categorie collegate a sottocategorie o movimenti non vengono eliminate: riassegna prima i dati collegati.",
              )}
              confirmLabel={tr("Elimina")}
              deletingLabel={tr("Eliminazione…")}
              cancelLabel={tr("Annulla")}
              isDeleting={busy}
              preview={{
                media:
                  form.mode === "category" ? (
                    <Shapes size={20} strokeWidth={2} />
                  ) : (
                    <Layers3 size={20} strokeWidth={2} />
                  ),
                title: form.name,
              }}
              onCancel={() => setConfirmingDelete(false)}
              onConfirm={() => void onDelete()}
            />
          )}
          {choosingParent ? (
            <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:gap-3">
              <Button variant="secondary" onClick={() => setChoosingParent(false)}>
                <ChevronLeft size={17} strokeWidth={2} />
                <span>{tr("Indietro")}</span>
              </Button>
            </div>
          ) : (
            // Same footer as the note details of Alice & Kevin: trash on the
            // left, then cancel and save.
            <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:gap-3">
              {form?.id && (
<Button
                  variant="danger-outline"
                  className="mr-auto"
                  disabled={busy}
                  onClick={() => setConfirmingDelete(true)}
                >
                  <Trash2 size={17} strokeWidth={2} />
                  <span>{tr("Elimina")}</span>
                </Button>
              )}
              <Button variant="secondary" disabled={busy} onClick={onClose}>
                <X size={17} strokeWidth={2} />
                <span>{tr("Annulla")}</span>
              </Button>
              <Button
                type="submit"
                form="manage-form"
                disabled={busy || (form?.mode === "subcategory" && !parent)}
              >
                {busy ? null : form?.id ? (
                  <Save size={17} strokeWidth={2} />
                ) : (
                  <Plus size={17} strokeWidth={2} />
                )}
                <span>{tr(busy ? "Salvataggio…" : form?.id ? "Salva" : "Crea")}</span>
              </Button>
            </div>
          )}
        </div>
      }
    >
      {form && (
        <form id="manage-form" onSubmit={onSubmit} className="ios-compose" noValidate>
          {choosingParent ? (
            <ChoiceList
              title={tr("Categoria principale obbligatoria")}
              choices={categories.map((item) => ({
                key: item._id,
                label: item.name,
                color: item.color,
                icon: <Shapes size={17} />,
              }))}
              value={form.category}
              searchPlaceholder={tr("Cerca categoria…")}
              disabled={busy}
              onChoose={(key) => {
                onChange({ ...form, category: key });
                setChoosingParent(false);
              }}
            />
          ) : (
            <>
              <div className="ios-compose__group">
                <p className="ios-compose__header">
                  {tr(form.mode === "category" ? "Categoria" : "Sottocategoria")}
                </p>
                <div className="ios-compose__list" style={{ "--row-color": accent } as CSSProperties}>
                  <label className="ios-compose__row ios-compose__row--static" htmlFor="manage-name">
                    <span className="ios-compose__icon" aria-hidden="true">
                      {form.mode === "category" ? <Type size={17} /> : <Layers3 size={17} />}
                    </span>
                    <input
                      id="manage-name"
                      className="et-name-field"
                      ref={nameRef}
                      required
                      maxLength={60}
                      placeholder={tr("Nome")}
                      aria-label={tr("Nome")}
                      value={form.name}
                      disabled={busy}
                      onChange={(event) => onChange({ ...form, name: event.target.value })}
                    />
                    <span />
                  </label>
                  {form.mode === "category" && (
                    <label
                      className="ios-compose__row ios-compose__row--static et-color-cell"
                      htmlFor="manage-color"
                    >
                      <span className="ios-compose__icon" aria-hidden="true">
                        <Palette size={17} />
                      </span>
                      <span className="ios-compose__copy">
                        <strong>{tr("Colore")}</strong>
                        <span>{form.color.toUpperCase()}</span>
                      </span>
                      <input
                        id="manage-color"
                        type="color"
                        value={form.color}
                        disabled={busy}
                        onChange={(event) => onChange({ ...form, color: event.target.value })}
                      />
                    </label>
                  )}
                </div>
              </div>
              {form.mode === "subcategory" && form.id && (
                <div className="ios-compose__group">
                  <p className="ios-compose__header">{tr("Categoria principale obbligatoria")}</p>
                  <div className="ios-compose__list">
                    <button
                      type="button"
                      className="ios-compose__row"
                      style={{ "--row-color": parent?.color } as CSSProperties}
                      disabled={busy || categoriesLoading}
                      onClick={() => setChoosingParent(true)}
                    >
                      <span className="ios-compose__icon" aria-hidden="true">
                        <Shapes size={17} />
                      </span>
                      <span className="ios-compose__copy">
                        <strong>{parent?.name ?? tr("Seleziona")}</strong>
                      </span>
                      <ChevronRight size={17} className="ios-compose__chevron" aria-hidden="true" />
                    </button>
                  </div>
                  <p className="ios-compose__footnote">
                    {tr(
                      "Una sottocategoria già usata nei movimenti può essere rinominata, ma va riassegnata prima di cambiare categoria principale.",
                    )}
                  </p>
                </div>
              )}
            </>
          )}
        </form>
      )}
    </Modal>
  );
}
