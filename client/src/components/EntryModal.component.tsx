import { numberFormatter } from "../utils/formatters.util";
import { useTranslation } from "react-i18next";
import DatePicker from "./DatePicker.component";
import {
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Check,
  ChevronLeft,
  ChevronRight,
  Layers3,
  Save,
  Shapes,
  Trash2,
  X,
} from "lucide-react";
import { tr, locale } from "../i18n";
import { CurrencyContext, CURRENCIES, CURRENCY_SYMBOLS } from "../contexts/currency.context";
import { api, money } from "../api";
import type { Category, Subcategory, Entry } from "../types";
import Modal from "./Modal.component";
import Button from "./Button.component";
import ChoiceList from "./ChoiceList.component";
import InlineDeleteConfirm from "./InlineDeleteConfirm.component";
import "../styles/v2/Compose.styles.css";
import "../styles/v2/Expenses.styles.css";

type EntryForm = {
  kind: "income" | "expense";
  category: string;
  subcategory: string;
  amount: string;
  currency?: string;
  date: string;
};
type TView = "form" | "category" | "subcategory" | "currency";

const KIND_COLOR = { expense: "#ff453a", income: "#30d158" } as const;
const AMOUNT_PATTERN = /^\d{1,7}([.,]\d{1,2})?$/;
const toDateKey = (date: Date | null) =>
  date
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    : "";

/**
 * New / edit movement, as an Alice & Kevin compose sheet: a new movement is
 * a short flow (type → category → subcategory → amount), an existing one a
 * grouped form whose rows open their choices inside the same sheet.
 */
export default function EntryModal({
  initial,
  editing,
  categories,
  subcategories,
  busy,
  onClose,
  onSave,
  onDelete,
  originalConversion,
}: {
  initial: EntryForm;
  editing: boolean;
  categories: Category[];
  subcategories: Subcategory[];
  busy: boolean;
  onClose: () => void;
  onSave: (form: EntryForm) => Promise<void>;
  /** Deletes the movement (edit only), after the inline confirmation. */
  onDelete?: () => void | Promise<void>;
  originalConversion?: Entry["conversion"];
}) {
  useTranslation();
  const currency = useContext(CurrencyContext);
  const [form, setForm] = useState({ ...initial, currency: initial.currency ?? currency });
  const [quote, setQuote] = useState<{
    key: string;
    amountCents: number;
    conversion: NonNullable<Entry["conversion"]>;
  } | null>(null);
  const [quoteError, setQuoteError] = useState<{ key: string; message: string } | null>(null);
  const [quoteAttempt, setQuoteAttempt] = useState(0);
  const quoteKey = JSON.stringify([form.amount, form.currency, form.date, currency]);
  const foreign = form.currency !== currency;
  const conversionReady = !foreign || quote?.key === quoteKey;
  useEffect(() => {
    if (!foreign || !AMOUNT_PATTERN.test(form.amount) || !form.date) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      api<{ amountCents: number; conversion: NonNullable<Entry["conversion"]> }>(
        "/exchange/preview",
        {
          method: "POST",
          body: { amount: form.amount, currency: form.currency, date: form.date },
          signal: controller.signal,
        },
      )
        .then((result) => {
          if (!controller.signal.aborted) {
            setQuote({ ...result, key: quoteKey });
            setQuoteError(null);
          }
        })
        .catch((error: unknown) => {
          if (!controller.signal.aborted)
            setQuoteError({
              key: quoteKey,
              message:
                error instanceof Error
                  ? error.message
                  : "Cambio non disponibile. Riprova tra poco: il movimento non è stato salvato.",
            });
        });
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [form.amount, form.currency, form.date, currency, foreign, quoteKey, quoteAttempt]);

  // New movement: 0 type · 1 category · 2 subcategory · 3 amount and date.
  const [step, setStep] = useState(0);
  const [chosenKind, setChosenKind] = useState(editing);
  // Choices open inside the sheet ("form" = the grouped form itself).
  const [view, setView] = useState<TView>("form");
  const [error, setError] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  // New movement: the amount gets the focus on its step once the sheet is in
  // place, without the browser scrolling the page under it.
  const amountRef = useRef<HTMLInputElement>(null);
  const amountStep = !editing && step === 3 && view === "form";
  useLayoutEffect(() => {
    if (amountStep) amountRef.current?.focus({ preventScroll: true });
  }, [amountStep]);
  const update = (patch: Partial<EntryForm>) => {
    setForm((value) => ({ ...value, ...patch }));
    setError("");
  };
  const move = (next: number) => {
    setStep(next);
    setView("form");
    setError("");
  };

  const selectedCategory = categories.find((item) => item._id === form.category);
  const selectedSubcategory = subcategories.find((item) => item._id === form.subcategory);
  const categoryChoices = categories.map((item) => ({
    key: item._id,
    label: item.name,
    color: item.color,
    icon: <Shapes size={17} />,
  }));
  const subcategoryChoices = subcategories
    .filter((item) => item.category === form.category)
    .map((item) => ({
      key: item._id,
      label: item.name,
      color: selectedCategory?.color,
      icon: <Layers3 size={17} />,
    }));
  const currencyChoices = CURRENCIES.map((code) => ({
    key: code,
    label: tr(`currency.${code}`),
    description: code,
    icon: <span className="text-[13px] font-semibold">{CURRENCY_SYMBOLS[code]}</span>,
  }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (!editing && step < 3) return;
    if (!conversionReady) return;
    const amount = Number(form.amount.replace(",", "."));
    if (
      !AMOUNT_PATTERN.test(form.amount) ||
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
      !selectedCategory ||
      !form.subcategory ||
      !subcategories.some(
        (item) => item._id === form.subcategory && item.category === form.category,
      )
    ) {
      if (!editing) move(1);
      else setView(selectedCategory ? "subcategory" : "category");
      setError("Seleziona una categoria valida.");
      return;
    }
    await onSave(form);
  };

  const kindStyle = { "--kind-color": KIND_COLOR[form.kind] } as CSSProperties;
  const canSave =
    !busy &&
    conversionReady &&
    Boolean(form.category) &&
    Boolean(form.subcategory) &&
    categories.length > 0;

  const amountField = (
    <label className="et-amount" style={kindStyle}>
      <span className="sr-only">{tr("Importo {{currency}}", { currency: form.currency })}</span>
      <input
        id={editing ? "entry-edit-amount" : "entry-amount"}
        inputMode="decimal"
        autoComplete="off"
        ref={amountRef}
        placeholder={numberFormatter(locale(), { minimumFractionDigits: 2 }).format(0)}
        value={form.amount}
        disabled={busy}
        aria-invalid={Boolean(error) || undefined}
        onChange={(event) => {
          const next = event.target.value.replace(/[^\d.,]/g, "");
          if (next === "" || /^\d{0,7}([.,]\d{0,2})?$/.test(next)) update({ amount: next });
        }}
      />
      <span className="et-amount__currency">
        {CURRENCY_SYMBOLS[form.currency] ?? form.currency}
      </span>
    </label>
  );

  const conversionNote = (
    <>
      {foreign && (
        <div className="et-conversion" role="status" aria-live="polite">
          {quote?.key === quoteKey ? (
            <>
              <strong>
                {tr("Verranno registrati {{amount}}", {
                  amount: money(quote.amountCents, currency),
                })}
              </strong>
              <span>
                {tr("Cambio del {{date}}: 1 {{from}} = {{rate}} {{to}}", {
                  date: quote.conversion.rateDate,
                  from: form.currency,
                  to: currency,
                  rate: numberFormatter(locale(), { maximumFractionDigits: 6 }).format(
                    quote.conversion.rate,
                  ),
                })}
              </span>
              <span>
                {tr("Tasso di riferimento BCE. La conversione resta fissata al salvataggio.")}
              </span>
            </>
          ) : quoteError?.key === quoteKey ? (
            <>
              <span className="ios-compose__error">{tr(quoteError.message)}</span>
              <button
                type="button"
                className="ios-group__action justify-self-start"
                disabled={busy}
                onClick={() => {
                  setQuoteError(null);
                  setQuoteAttempt((attempt) => attempt + 1);
                }}
              >
                {tr("Riprova")}
              </button>
            </>
          ) : (
            <span>
              {tr(
                form.amount
                  ? "Recupero del cambio…"
                  : "Inserisci un importo per vedere la conversione.",
              )}
            </span>
          )}
        </div>
      )}
      {editing && originalConversion && !foreign && (
        <p className="ios-compose__footnote">
          {tr("Importo originale: {{amount}} · cambio del {{date}}", {
            amount: money(originalConversion.originalCents, originalConversion.from),
            date: originalConversion.rateDate,
          })}
        </p>
      )}
    </>
  );

  /** A grouped row that opens one of the choices inside the sheet. */
  const choiceRow = (
    target: TView,
    label: string,
    value: string | undefined,
    icon: ReactNode,
    color: string | undefined,
    disabled = false,
  ) => (
    <button
      type="button"
      className="ios-compose__row"
      style={{ "--row-color": color } as CSSProperties}
      disabled={busy || disabled}
      onClick={() => setView(target)}
    >
      <span className="ios-compose__icon" aria-hidden="true">
        {icon}
      </span>
      <span className="ios-compose__copy">
        <strong>{label}</strong>
        <span>{value ?? tr("Seleziona")}</span>
      </span>
      <ChevronRight size={17} className="ios-compose__chevron" aria-hidden="true" />
    </button>
  );

  const choiceView =
    view === "category" ? (
      <ChoiceList
        title={tr("Categoria")}
        choices={categoryChoices}
        value={form.category}
        searchPlaceholder={tr("Cerca categoria…")}
        emptyText={tr("Crea prima una categoria dalla pagina Management.")}
        onChoose={(key) => {
          update({ category: key, subcategory: key === form.category ? form.subcategory : "" });
          setView(key === form.category ? "form" : "subcategory");
        }}
      />
    ) : view === "subcategory" ? (
      <ChoiceList
        title={tr("Sottocategoria")}
        choices={subcategoryChoices}
        value={form.subcategory}
        searchPlaceholder={tr("Cerca sottocategoria…")}
        onChoose={(key) => {
          update({ subcategory: key });
          setView("form");
        }}
      />
    ) : view === "currency" ? (
      <ChoiceList
        title={tr("Valuta del movimento")}
        choices={currencyChoices}
        value={form.currency}
        searchable={false}
        onChoose={(key) => {
          update({ currency: key });
          setView("form");
        }}
      />
    ) : null;

  const detailsGroup = (
    <>
      <div className="ios-compose__field">
        <DatePicker
          id={editing ? "entry-edit-date" : "entry-date"}
          label={tr("Data")}
          value={form.date ? new Date(form.date + "T12:00:00") : null}
          disabled={busy}
          onChange={(date) => update({ date: toDateKey(date) })}
        />
      </div>
      <div className="ios-compose__group">
        <p className="ios-compose__header">{tr("Valuta del movimento")}</p>
        <div className="ios-compose__list">
          {choiceRow(
            "currency",
            tr(`currency.${form.currency}`),
            form.currency,
            <Banknote size={17} />,
            "#8e8e93",
          )}
        </div>
        {conversionNote}
      </div>
    </>
  );

  /** Expense or income: two Control Center toggles (Alice & Kevin recording device). */
  const kindPicker = (
    selected: EntryForm["kind"] | null,
    onPick: (kind: EntryForm["kind"]) => void,
  ) => (
    <div className="et-kind-picker" role="group" aria-label={tr("Tipo")}>
      {(["expense", "income"] as const).map((kind) => (
        <button
          type="button"
          key={kind}
          className="et-kind-toggle"
          data-kind={kind}
          aria-pressed={selected === kind}
          disabled={busy}
          onClick={() => onPick(kind)}
        >
          <span className="et-kind-toggle__icon" aria-hidden="true">
            {kind === "expense" ? (
              <ArrowUpRight size={22} strokeWidth={2} />
            ) : (
              <ArrowDownLeft size={22} strokeWidth={2} />
            )}
          </span>
          <span className="et-kind-toggle__label">
            {tr(kind === "expense" ? "Spesa" : "Entrata")}
          </span>
          <span className="et-kind-toggle__state">
            {tr(
              kind === "expense" ? "Acquisti, bollette e uscite" : "Stipendio, rimborsi e incassi",
            )}
          </span>
        </button>
      ))}
    </div>
  );

  const errorNote = error && (
    <p className="ios-compose__error" role="alert">
      {tr(error)}
    </p>
  );

  if (editing)
    return (
      <Modal
        isOpen
        title={tr(form.kind === "expense" ? "Modifica spesa" : "Modifica entrata")}
        maxWidth="lg"
        isClosable={!busy}
        closeOnBackdropClick={!busy}
        onClose={onClose}
        footer={
          <div className="modal-record-actions flex w-full flex-col gap-3">
            {confirmingDelete && onDelete && (
              <InlineDeleteConfirm
                title={tr(form.kind === "expense" ? "Elimina spesa" : "Elimina entrata")}
                message={tr("Il movimento verrà eliminato definitivamente.")}
                confirmLabel={tr("Elimina")}
                deletingLabel={tr("Eliminazione…")}
                cancelLabel={tr("Annulla")}
                isDeleting={busy}
                onCancel={() => setConfirmingDelete(false)}
                onConfirm={() => void onDelete()}
              />
            )}
            {view !== "form" ? (
              <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:gap-3">
                <Button variant="secondary" disabled={busy} onClick={() => setView("form")}>
                  <ChevronLeft size={17} strokeWidth={2} />
                  <span>{tr("Indietro")}</span>
                </Button>
              </div>
            ) : (
              // Same footer as the note details of Alice & Kevin.
              <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:gap-3">
                {onDelete && (
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
                <Button type="submit" form="entry-edit" disabled={!canSave}>
                  {busy ? null : <Save size={17} strokeWidth={2} />}
                  <span>{tr(busy ? "Salvataggio…" : "Salva")}</span>
                </Button>
              </div>
            )}
          </div>
        }
      >
        <form id="entry-edit" onSubmit={submit} noValidate aria-busy={busy} className="ios-compose">
          {view !== "form" ? (
            choiceView
          ) : (
            <>
              {kindPicker(form.kind, (kind) => update({ kind }))}
              {amountField}
              <div className="ios-compose__group">
                <p className="ios-compose__header">{tr("Categoria")}</p>
                <div className="ios-compose__list">
                  {choiceRow(
                    "category",
                    tr("Categoria"),
                    selectedCategory?.name,
                    <Shapes size={17} />,
                    selectedCategory?.color,
                  )}
                  {choiceRow(
                    "subcategory",
                    tr("Sottocategoria"),
                    selectedSubcategory?.name,
                    <Layers3 size={17} />,
                    selectedCategory?.color,
                    !form.category,
                  )}
                </div>
              </div>
              {detailsGroup}
            </>
          )}
          {errorNote}
        </form>
      </Modal>
    );

  const steps = ["Tipo", "Categoria", "Sottocategoria", "Importo"].map((label) => tr(label));
  return (
    <Modal
      isOpen
      title={tr("Nuovo movimento")}
      description={step === 0 ? tr("Ogni movimento, al posto giusto.") : undefined}
      maxWidth="lg"
      isClosable={!busy}
      onClose={onClose}
      footer={
        <>
          {step === 0 && view === "form" ? (
            <Button variant="secondary" disabled={busy} onClick={onClose}>
              {tr("Annulla")}
            </Button>
          ) : (
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => (view !== "form" ? setView("form") : move(step - 1))}
            >
              <ChevronLeft size={17} strokeWidth={2} />
              <span>{tr("Indietro")}</span>
            </Button>
          )}
          {step === 3 && view === "form" && (
            <Button type="submit" form="entry-wizard" disabled={!canSave}>
              <Check size={17} strokeWidth={2.4} />
              <span>{tr(busy ? "Salvataggio…" : "Salva")}</span>
            </Button>
          )}
        </>
      }
    >
      <form id="entry-wizard" onSubmit={submit} noValidate aria-busy={busy} className="ios-compose">
        {step > 0 && (
          <div className="ios-compose__progress">
            <div
              className="ios-compose__steps"
              role="progressbar"
              aria-label={tr("Passaggi del movimento")}
              aria-valuemin={1}
              aria-valuemax={steps.length}
              aria-valuenow={step + 1}
            >
              {steps.map((label, index) => (
                <button
                  key={label}
                  type="button"
                  className="ios-compose__step"
                  data-state={index < step ? "done" : index === step ? "current" : undefined}
                  aria-label={label}
                  disabled={busy || index > step}
                  onClick={() => move(index)}
                />
              ))}
            </div>
            <p className="ios-compose__step-label">
              {steps[step]}
              <span>
                {step + 1}/{steps.length}
              </span>
            </p>
          </div>
        )}

        {step === 0 && (
          <div className="ios-compose__group">
            <p className="ios-compose__header">{tr("Che movimento vuoi registrare?")}</p>
            {kindPicker(chosenKind ? form.kind : null, (kind) => {
              update({ kind });
              setChosenKind(true);
              move(1);
            })}
          </div>
        )}
        {step === 1 && (
          <ChoiceList
            title={tr("Scegli la categoria")}
            advance
            layout="tiles"
            choices={categoryChoices}
            value={form.category}
            searchPlaceholder={tr("Cerca categoria…")}
            emptyText={tr("Crea prima una categoria dalla pagina Management.")}
            onChoose={(key) => {
              update({ category: key, subcategory: key === form.category ? form.subcategory : "" });
              move(2);
            }}
          />
        )}
        {step === 2 && (
          <ChoiceList
            title={tr("Scegli la sottocategoria")}
            advance
            layout="tiles"
            choices={subcategoryChoices}
            value={form.subcategory}
            searchPlaceholder={tr("Cerca sottocategoria…")}
            onChoose={(key) => {
              update({ subcategory: key });
              move(3);
            }}
          />
        )}
        {step === 3 &&
          (view !== "form" ? (
            choiceView
          ) : (
            <>
              {amountField}
              <p className="ios-compose__footnote">
                {tr(form.kind === "expense" ? "Spesa" : "Entrata")} · {selectedCategory?.name}
                {selectedSubcategory ? ` / ${selectedSubcategory.name}` : ""}
              </p>
              {detailsGroup}
            </>
          ))}
        {errorNote}
      </form>
    </Modal>
  );
}
