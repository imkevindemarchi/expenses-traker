import ModalChoiceField from "./ModalChoiceField.component";
import { useTranslation } from "react-i18next";
import DatePicker from "./DatePicker.component";
import { useContext, useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Check,
  ChevronLeft,
  ChevronRight,
  Shapes,
  Layers3,
} from "lucide-react";
import { tr, locale } from "../i18n";
import { CurrencyContext } from "../contexts/currency.context";
import type { Category, Subcategory } from "../types";
import Modal from "./Modal.component";
import Stepper from "./Stepper.component";
import "../styles/EntryModal.styles.css";
import Button from "./Button.component";
import Input from "./Input.component";
import InputNumber from "./InputNumber.component";
type EntryForm = {
  kind: "income" | "expense";
  category: string;
  subcategory: string;
  amount: string;
  date: string;
};
export default function EntryModal({
  initial,
  editing,
  categories,
  subcategories,
  busy,
  onClose,
  onSave,
}: {
  initial: EntryForm;
  editing: boolean;
  categories: Category[];
  subcategories: Subcategory[];
  busy: boolean;
  onClose: () => void;
  onSave: (form: EntryForm) => Promise<void>;
}) {
  useTranslation();
  const currency = useContext(CurrencyContext);
  const [form, setForm] = useState(initial);
  const [step, setStep] = useState(0);
  const [chosenKind, setChosenKind] = useState(editing);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const stepHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!editing && step > 0 && step < 3) stepHeading.current?.focus({ preventScroll: true });
  }, [editing, step]);
  const update = (patch: Partial<EntryForm>) => {
    setForm((value) => ({ ...value, ...patch }));
    setError("");
  };
  const move = (next: number) => {
    setStep(next);
    setSearch("");
    setError("");
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (!editing && step < 3) return;
    const amount = Number(form.amount.replace(",", "."));
    if (
      !/^\d{1,7}([.,]\d{1,2})?$/.test(form.amount) ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      amount > 1000000
    ) {
      setError("Inserisci un importo tra 0,01 e 1.000.000, con massimo due decimali.");
      return;
    }
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(form.date) ||
      !Number.isFinite(Date.parse(form.date + "T12:00:00Z")) ||
      new Date(form.date + "T12:00:00Z").toISOString().slice(0, 10) !== form.date
    ) {
      setError("Data non valida.");
      return;
    }
    if (
      !categories.some((item) => item._id === form.category) ||
      !form.subcategory ||
      !subcategories.some(
        (item) => item._id === form.subcategory && item.category === form.category,
      )
    ) {
      if (!editing) move(1);
      else document.getElementById(categories.some((item) => item._id === form.category) ? "entry-edit-subcategory" : "entry-edit-category")?.focus();
      setError("Seleziona una categoria valida.");
      return;
    }
    await onSave(form);
  };
  const selectedCategory = categories.find((item) => item._id === form.category);
  const filteredCategories = categories.filter((item) =>
    item.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
  );
  const filteredSubcategories = subcategories.filter(
    (item) =>
      item.category === form.category &&
      item.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
  );
  if (editing)
    return (
      <Modal
        isOpen
        appearance="entry"
        title={tr(form.kind === "expense" ? "Modifica spesa" : "Modifica entrata")}
        maxWidth="lg"
        isClosable={!busy}
        onClose={onClose}
        footer={
          <>
            <Button variant="secondary" disabled={busy} onClick={onClose}>
              {tr("Annulla")}
            </Button>
            <Button
              className="entry-save"
              type="submit"
              form="entry-edit"
              disabled={busy || !form.category || !form.subcategory || !categories.length}
              icon={<Check size={17} />}
            >
              {tr(busy ? "Salvataggio…" : "Salva modifiche")}
            </Button>
          </>
        }
      >
        <form
          id="entry-edit"
          onSubmit={submit}
          noValidate
          aria-busy={busy}
          className={`entry-edit-form ${form.kind}`}
        >
          <fieldset disabled={busy} className="entry-edit-fields">
            <legend className="sr-only">{tr("Modifica movimento")}</legend>
            <div className="entry-edit-kind" role="group" aria-label={tr("Tipo")}>
              {(["expense", "income"] as const).map((kind) => (
                <button
                  type="button"
                  key={kind}
                  className={`entry-kind-option ${kind}`}
                  aria-label={tr(kind === "expense" ? "Spesa" : "Entrata")}
                  title={tr(kind === "expense" ? "Spesa" : "Entrata")}
                  aria-pressed={form.kind === kind}
                  onClick={() => update({ kind })}
                >
                  <span className="entry-kind-icon">
                    {kind === "expense" ? <ArrowUpRight size={19} /> : <ArrowDownLeft size={19} />}
                  </span>
                  <span className="entry-kind-label">
                    {tr(kind === "expense" ? "Spesa" : "Entrata")}
                  </span>
                </button>
              ))}
            </div>
            <div className="entry-edit-details">
              <InputNumber
                id="entry-edit-amount"
                className="entry-amount-field"
                suffix={currency}
                label={tr("Importo {{currency}}", { currency })}
                value={form.amount}
                allowDecimal
                inputMode="decimal"
                placeholder={new Intl.NumberFormat(locale(), { minimumFractionDigits: 2 }).format(
                  0,
                )}
                onChange={(amount) => update({ amount })}
              />
              <DatePicker
                id="entry-edit-date"
                className="entry-edit-date-field"
                label={tr("Data")}
                value={form.date ? new Date(form.date + "T12:00:00") : null}
                disabled={busy}
                onChange={(date) =>
                  update({
                    date: date
                      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
                      : "",
                  })
                }
              />
            </div>
            <div className="entry-edit-classification">
              <ModalChoiceField
                id="entry-edit-category" label={tr("Categoria")} placeholder={tr("Scegli una categoria")}
                searchPlaceholder={tr("Cerca categoria…")} icon={<Shapes size={19} />}
                value={selectedCategory ?? null} options={categories} disabled={busy} clearable={false}
                getOptionKey={(item) => item._id} getOptionLabel={(item) => item.name}
                getOptionIcon={(item) => <i className="category-filter-dot" style={{ background: item.color }} />}
                onChange={(item) => { if (item) update({ category: item._id, subcategory: item._id === form.category ? form.subcategory : "" }); }}
              />
              <ModalChoiceField
                id="entry-edit-subcategory" label={tr("Sottocategoria")} placeholder={tr("Scegli una sottocategoria")}
                searchPlaceholder={tr("Cerca sottocategoria…")} icon={<Layers3 size={19} />}
                value={subcategories.find((item) => item._id === form.subcategory) ?? null}
                options={subcategories.filter((item) => item.category === form.category)} disabled={busy || !form.category} clearable={false}
                getOptionKey={(item) => item._id} getOptionLabel={(item) => item.name}
                getOptionIcon={() => <i className="category-filter-dot" style={{ background: selectedCategory?.color }} />}
                onChange={(item) => { if (item) update({ subcategory: item._id }); }}
              />
            </div>
          </fieldset>
          {error && (
            <p className="form-error" role="alert">
              {tr(error)}
            </p>
          )}
        </form>
      </Modal>
    );
  return (
    <Modal
      isOpen
      appearance="entry"
      title={tr("Nuovo movimento")}
      description={step === 0 ? tr("Ogni movimento, al posto giusto.") : undefined}
      maxWidth="lg"
      isClosable={!busy}
      onClose={onClose}
      footer={
        step === 0 ? undefined : (
          <>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => (step ? move(step - 1) : onClose())}
              icon={step ? <ChevronLeft size={17} /> : undefined}
            >
              {tr(step ? "Indietro" : "Annulla")}
            </Button>
            {step === 3 && (
              <Button
                className={`entry-save ${form.kind}`}
                type="submit"
                form="entry-wizard"
                disabled={busy || !form.category || !form.subcategory || !categories.length}
                icon={<Check size={17} />}
              >
                {tr(
                  busy ? "Salvataggio…" : form.kind === "income" ? "Salva entrata" : "Salva spesa",
                )}
              </Button>
            )}
          </>
        )
      }
    >
      <form
        id="entry-wizard"
        onSubmit={submit}
        noValidate
        className={`entry-wizard entry-flow ${chosenKind ? form.kind : "entry-neutral"}`}
        aria-busy={busy}
      >
        {step > 0 && (
          <>
            <div className="entry-context">
              <span className="ui-pill entry-kind-badge">
                {form.kind === "expense" ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                {tr(form.kind === "expense" ? "Spesa" : "Entrata")}
              </span>
              {step > 1 && (
                <span className="entry-context-category">
                  <span>{selectedCategory?.name}</span>
                  {form.subcategory && (
                    <>
                      <span className="entry-context-separator" aria-hidden="true">/</span>
                      <span>{subcategories.find((item) => item._id === form.subcategory)?.name}</span>
                    </>
                  )}
                </span>
              )}
            </div>
            <Stepper
              steps={["Tipo", "Categoria", "Sottocategoria", "Importo"].map((label) => ({
                label: tr(label),
              }))}
              activeStep={step}
              ariaLabel={tr("Passaggi del movimento")}
              accent="var(--entry-accent)"
              disabled={busy}
              onStepClick={move}
            />
          </>
        )}
        <fieldset key={step} disabled={busy} className="entry-step entry-step-panel">
          <legend className="sr-only">
            {tr(["Tipo", "Categoria", "Sottocategoria", "Importo e data"][step])}
          </legend>
          {step === 0 && (
            <>
              <div className="entry-intro">
                <h3>{tr("Che movimento vuoi registrare?")}</h3>
                <p>{tr("Scegli il tipo e aggiungi i dettagli in pochi tocchi.")}</p>
              </div>
              <div className="entry-create-kind" role="group" aria-label={tr("Tipo")}>
                {(["expense", "income"] as const).map((kind) => (
                  <button
                    type="button"
                    key={kind}
                    className={`entry-kind-option ${kind}`}
                    aria-label={tr(kind === "expense" ? "Spesa" : "Entrata")}
                    title={tr(kind === "expense" ? "Spesa" : "Entrata")}
                    aria-pressed={chosenKind && form.kind === kind}
                    onClick={() => {
                      update({ kind });
                      setChosenKind(true);
                      move(1);
                    }}
                  >
                    <span className="entry-kind-icon">
                      {kind === "expense" ? (
                        <ArrowUpRight size={22} />
                      ) : (
                        <ArrowDownLeft size={22} />
                      )}
                    </span>
                    <span className="entry-kind-copy">
                      <span className="entry-kind-label">
                        {tr(kind === "expense" ? "Spesa" : "Entrata")}
                      </span>
                      <span className="entry-kind-description">
                        {tr(
                          kind === "expense"
                            ? "Acquisti, bollette e uscite"
                            : "Stipendio, rimborsi e incassi",
                        )}
                      </span>
                    </span>
                    <ChevronRight className="entry-kind-next" size={20} aria-hidden="true" />
                  </button>
                ))}
              </div>
            </>
          )}
          {(step === 1 || step === 2) && (
            <>
              <h3 ref={stepHeading} tabIndex={-1}>
                {tr(step === 1 ? "Scegli la categoria" : "Scegli la sottocategoria")}
              </h3>
              <Input
                id="entry-category-search"
                aria-label={tr(step === 1 ? "Cerca categoria…" : "Cerca sottocategoria…")}
                placeholder={tr(step === 1 ? "Cerca categoria…" : "Cerca sottocategoria…")}
                icon={<Search size={18} />}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <div
                className="entry-pills"
                role="group"
                aria-label={tr(step === 1 ? "Categoria" : "Sottocategoria")}
              >
                {(step === 1 ? filteredCategories : filteredSubcategories).map((item) => {
                  const selected = (step === 1 ? form.category : form.subcategory) === item._id;
                  return (
                    <button
                      type="button"
                      key={item._id}
                      className="ui-pill entry-pill"
                      aria-pressed={selected}
                      onClick={() => {
                        update(
                          step === 1
                            ? {
                                category: item._id,
                                subcategory: item._id === form.category ? form.subcategory : "",
                              }
                            : { subcategory: item._id },
                        );
                        move(step + 1);
                      }}
                    >
                      <i
                        style={{
                          background:
                            step === 1 ? (item as Category).color : selectedCategory?.color,
                        }}
                      />
                      {item.name}
                      {selected && <Check size={15} />}
                    </button>
                  );
                })}
              </div>
              {!(step === 1 ? filteredCategories : filteredSubcategories).length && (
                <p className="muted">{tr("Nessun risultato.")}</p>
              )}
              {!categories.length && (
                <p className="form-error">
                  {tr("Crea prima una categoria dalla pagina Management.")}
                </p>
              )}
            </>
          )}
          {step === 3 && (
            <>
              <h3>{tr("Quanto e quando?")}</h3>
              <div className="entry-amount-layout">
                <div>
                  <InputNumber
                    id="entry-amount"
                    className="entry-amount-field"
                    suffix={currency}
                    autoFocus
                    label={tr("Importo {{currency}}", { currency })}
                    value={form.amount}
                    allowDecimal
                    inputMode="decimal"
                    placeholder={new Intl.NumberFormat(locale(), {
                      minimumFractionDigits: 2,
                    }).format(0)}
                    onChange={(amount) => update({ amount })}
                  />
                </div>
                <div className="entry-date-summary">
                  <DatePicker
                    id="entry-date"
                    label={tr("Data")}
                    value={new Date(form.date + "T12:00:00")}
                    disabled={busy}
                    onChange={(date) =>
                      update({
                        date: date
                          ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
                          : "",
                      })
                    }
                  />
                </div>
              </div>
            </>
          )}
        </fieldset>
        {error && (
          <p className="form-error" role="alert">
            {tr(error)}
          </p>
        )}
      </form>
    </Modal>
  );
}
