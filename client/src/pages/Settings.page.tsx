import { numberFormatter } from "../utils/formatters.util";
import { useMoney, CURRENCIES, CURRENCY_SYMBOLS } from "../contexts/currency.context";
import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Banknote,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  LockKeyhole,
  Trash2,
  Upload,
  UserRound,
  Wallet,
} from "lucide-react";
import { api } from "../api";
import { tr, locale } from "../i18n";
import type { User } from "../types";
import Header from "../components/Header.component";
import FloatingButton from "../components/FloatingButton.component";
import AppearanceSettings from "../components/AppearanceSettings.component";
import Modal from "../components/Modal.component";
import ChoiceList from "../components/ChoiceList.component";
import DeleteConfirmModal from "../components/DeleteConfirmModal.component";
import BudgetPicker from "../components/BudgetPicker.component";
import "../styles/v2/Expenses.styles.css";

const SPLIT_QUERY = "(min-width: 1024px)";
const PASSWORD_FIELDS = [
  { key: "currentPassword", label: "Password attuale", autoComplete: "current-password" },
  { key: "newPassword", label: "Nuova password", autoComplete: "new-password" },
  { key: "confirmPassword", label: "Conferma nuova password", autoComplete: "new-password" },
] as const;

/** Settings, laid out like Alice & Kevin: hero, then iOS grouped sections. */
export default function SettingsPage({
  user,
  onSaved,
  onNotice,
  onDeleted,
  onImported,
}: {
  user: User;
  onSaved: (user: User) => void;
  onNotice: (error: boolean, message: string) => void;
  onDeleted: () => void;
  onImported: () => void;
}) {
  const money = useMoney();
  const navigate = useNavigate();
  const location = useLocation();
  useTranslation();
  const [amount, setAmount] = useState(
    user.monthlyBudgetCents == null ? "" : (user.monthlyBudgetCents / 100).toFixed(2),
  );
  const [currency, setCurrency] = useState(user.currency ?? "EUR");
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [busy, setBusy] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [revealPasswords, setRevealPasswords] = useState(false);
  const [profile, setProfile] = useState({ name: user.name ?? "", surname: user.surname ?? "" });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const importInput = useRef<HTMLInputElement>(null);
  const dataBusy = exportBusy || importBusy;
  const disabled = busy || deleteBusy || dataBusy;
  const [wideSplit, setWideSplit] = useState(() => window.matchMedia(SPLIT_QUERY).matches);
  useEffect(() => {
    const query = window.matchMedia(SPLIT_QUERY);
    const sync = () => setWideSplit(query.matches);
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const budgetValue = Number(amount.replace(",", "."));
  const budgetLabel =
    amount.trim() !== "" && Number.isFinite(budgetValue)
      ? numberFormatter(locale(), { style: "currency", currency }).format(budgetValue)
      : tr("Nessun limite");

  const importData = async (file: File) => {
    if (disabled) return;
    setImportBusy(true);
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error(tr("Il backup non può superare 10 MB."));
      let data: unknown;
      try {
        data = JSON.parse((await file.text()).replace(/^﻿/, ""));
      } catch {
        throw new Error(tr("Seleziona un backup JSON valido di ExpensesTraker."));
      }
      const result = await api<{ entries: number }>("/backup/import", {
        method: "POST",
        body: data,
      });
      onImported();
      onNotice(
        false,
        tr("Importazione completata: {{count}} movimenti aggiunti.", { count: result.entries }),
      );
    } catch (cause) {
      onNotice(true, cause instanceof Error ? cause.message : "Si è verificato un errore.");
    } finally {
      setImportBusy(false);
    }
  };
  const exportData = async () => {
    if (disabled) return;
    setExportBusy(true);
    try {
      const data = await api<unknown>("/backup");
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      );
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `expensestraker-backup-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (cause) {
      onNotice(true, cause instanceof Error ? cause.message : "Si è verificato un errore.");
    } finally {
      setExportBusy(false);
    }
  };
  const removeAccount = async () => {
    if (deleteBusy || busy || dataBusy) return;
    setDeleteBusy(true);
    try {
      await api("/account", { method: "DELETE", body: { confirm: true } });
      setDeleteOpen(false);
      onDeleted();
    } catch (cause) {
      onNotice(true, cause instanceof Error ? cause.message : "Si è verificato un errore.");
    } finally {
      setDeleteBusy(false);
    }
  };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (disabled) return;
    setError("");
    setPasswordError("");
    if (
      amount !== "" &&
      (!/^\d{1,7}([.,]\d{1,2})?$/.test(amount) || Number(amount.replace(",", ".")) > 1_000_000)
    ) {
      setError("Inserisci un limite tra 0 e 1.000.000, con massimo due decimali.");
      return;
    }
    const passwordChanged = Object.values(passwords).some(Boolean);
    if (passwordChanged) {
      const fail = (message: string) => {
        setShowPasswords(true);
        setPasswordError(message);
      };
      if (!passwords.currentPassword) return fail("Inserisci la password attuale.");
      if (
        passwords.newPassword.length < 10 ||
        new TextEncoder().encode(passwords.newPassword).length > 72
      )
        return fail("La password deve avere almeno 10 caratteri e non superare 72 byte.");
      if (passwords.newPassword !== passwords.confirmPassword)
        return fail("Le nuove password non coincidono.");
      if (passwords.newPassword === passwords.currentPassword)
        return fail("Scegli una password diversa da quella attuale.");
    }
    setBusy(true);
    try {
      const result = await api<{ user: User }>("/account/settings", {
        method: "PATCH",
        body: {
          ...profile,
          monthlyBudget: amount,
          currency,
          ...(passwordChanged ? { passwordChange: passwords } : {}),
        },
      });
      onSaved(result.user);
      setProfile({ name: result.user.name, surname: result.user.surname ?? "" });
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPasswords(false);
      onNotice(false, "Impostazioni salvate.");
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Si è verificato un errore.";
      if (passwordChanged) setPasswordError(message);
      else setError(message);
    } finally {
      setBusy(false);
    }
  };

  const cellColor = (color: string) => ({ "--cell-color": color }) as CSSProperties;

  // Data (export / import / delete): last on phones, under the budget on wide
  // screens so the two columns stay balanced.
  const dataSection = (
    <section id="settings-data" tabIndex={-1} className="ios-group">
      <div className="ios-group__head">
        <h2 className="ios-group__title">{tr("I tuoi dati")}</h2>
      </div>
      <div className="ios-group__card">
        <button
          type="button"
          className="ios-cell ios-cell--action"
          disabled={disabled}
          onClick={() => void exportData()}
        >
          <span className="ios-cell__icon" style={cellColor("#0a84ff")}>
            <Download aria-hidden="true" />
          </span>
          <span className="ios-cell__label">
            {tr(exportBusy ? "Esportazione…" : "Esporta backup")}
            <small>
              {tr("Esporta tutti i movimenti, le categorie e le impostazioni in un file JSON.")}
            </small>
          </span>
          <span className="ios-cell__value" />
        </button>
        <button
          type="button"
          className="ios-cell ios-cell--action"
          disabled={disabled}
          onClick={() => importInput.current?.click()}
        >
          <span className="ios-cell__icon" style={cellColor("#30b0c7")}>
            <Upload aria-hidden="true" />
          </span>
          <span className="ios-cell__label">
            {tr(importBusy ? "Importazione…" : "Importa backup")}
            <small>{tr("Aggiunge i dati di un backup al tuo account.")}</small>
          </span>
          <span className="ios-cell__value" />
        </button>
        <input
          ref={importInput}
          type="file"
          hidden
          accept="application/json,.json"
          disabled={disabled}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void importData(file);
          }}
        />
        <button
          type="button"
          className="ios-cell ios-cell--danger"
          disabled={disabled}
          onClick={() => setDeleteOpen(true)}
        >
          <span className="ios-cell__icon" style={cellColor("#ff453a")}>
            <Trash2 aria-hidden="true" />
          </span>
          <span className="ios-cell__label">
            {tr("Elimina account")}
            <small>{tr("Elimina definitivamente il tuo account e tutti i dati associati.")}</small>
          </span>
          <span className="ios-cell__value" />
        </button>
      </div>
      <p className="ios-group__footer">
        {tr(
          "L’importazione aggiunge categorie, sottocategorie e movimenti al tuo account. Importare più volte lo stesso backup può duplicare i movimenti.",
        )}
      </p>
    </section>
  );

  return (
    <main className="subscription-settings-page ios-settings w-full pb-8 md:py-10">
      <Header title={tr("Impostazioni")} />
      <form
        id="account-settings-form"
        className="ios-page ios-page--split"
        onSubmit={save}
        noValidate
        aria-busy={busy}
      >
        {/* Hero: the monthly budget, live while editing. */}
        <section className="ios-hero ios-page__wide" aria-label={tr("Budget mensile")}>
          <p className="ios-hero__eyebrow">
            <Wallet size={17} aria-hidden="true" />
            {tr("Budget mensile")}
          </p>
          <p className="ios-hero__value">
            {budgetLabel}
            {amount.trim() !== "" && <small>{tr("/ mese")}</small>}
          </p>
          <p className="ios-hero__caption">
            {tr("Il budget residuo compare solo nella panoramica del mese corrente.")}
          </p>
          <div className="ios-hero__pills">
            <span className="ios-hero__pill">
              <i aria-hidden="true" />
              {tr(`currency.${currency}`)} · {currency}
            </span>
            {user.monthlyBudgetCents != null && (
              <span className="ios-hero__pill" data-muted>
                {tr("Limite attuale: {{amount}}", { amount: money(user.monthlyBudgetCents) })}
              </span>
            )}
          </div>
        </section>

        <div className="ios-page__column">
          <section id="settings-profile" tabIndex={-1} className="ios-group">
            <div className="ios-group__head">
              <h2 className="ios-group__title">{tr("Profilo")}</h2>
            </div>
            <div className="ios-group__card">
              {(["name", "surname"] as const).map((key) => (
                <div key={key} className="ios-cell-block">
                  <input
                    id={`account-${key}`}
                    placeholder={tr(key === "name" ? "Nome" : "Cognome")}
                    aria-label={tr(key === "name" ? "Nome" : "Cognome")}
                    autoComplete={key === "name" ? "given-name" : "family-name"}
                    maxLength={60}
                    disabled={disabled}
                    value={profile[key]}
                    onChange={(event) =>
                      setProfile((value) => ({ ...value, [key]: event.target.value }))
                    }
                  />
                  <UserRound size={18} className="mr-3 shrink-0 opacity-40" aria-hidden="true" />
                </div>
              ))}
            </div>
            <p className="ios-group__footer">
              {tr("Aggiungi il tuo nome e cognome. Entrambi i campi sono facoltativi.")}
            </p>
          </section>

          <section id="settings-budget" tabIndex={-1} className="ios-group">
            <div className="ios-group__head">
              <h2 className="ios-group__title">{tr("Valuta")}</h2>
            </div>
            <div className="ios-group__card">
              <button
                type="button"
                className="ios-cell"
                disabled={disabled}
                aria-haspopup="dialog"
                aria-expanded={currencyOpen}
                onClick={() => setCurrencyOpen(true)}
              >
                <span className="ios-cell__icon" style={cellColor("#34c759")}>
                  <Banknote aria-hidden="true" />
                </span>
                <span className="ios-cell__label">{tr("Valuta dell’account")}</span>
                <span className="ios-cell__value">
                  {currency}
                  <ChevronRight
                    size={17}
                    strokeWidth={2.4}
                    className="ios-cell__chevron"
                    aria-hidden="true"
                  />
                </span>
              </button>
            </div>
            <p className="ios-group__footer">
              {tr("Cambiare valuta non converte gli importi già registrati.")}
            </p>
          </section>
          <BudgetPicker
            value={amount}
            currencySymbol={CURRENCY_SYMBOLS[currency] ?? currency}
            disabled={disabled}
            error={error ? tr(error) : undefined}
            onChange={(next) => {
              setAmount(next);
              setError("");
            }}
          />
          {wideSplit && dataSection}
        </div>

        <div className="ios-page__column">
          <section id="settings-security" tabIndex={-1} className="ios-group">
            <div className="ios-group__head">
              <h2 className="ios-group__title">{tr("Sicurezza")}</h2>
            </div>
            <div className="ios-group__card">
              <button
                type="button"
                className="ios-cell"
                disabled={disabled}
                aria-expanded={showPasswords}
                aria-controls="account-password-fields"
                onClick={() => setShowPasswords((value) => !value)}
              >
                <span className="ios-cell__icon" style={cellColor("#8e8e93")}>
                  <LockKeyhole aria-hidden="true" />
                </span>
                <span className="ios-cell__label">{tr("Cambia password")}</span>
                <span className="ios-cell__value">
                  <ChevronRight
                    size={17}
                    strokeWidth={2.4}
                    className="ios-cell__chevron"
                    aria-hidden="true"
                  />
                </span>
              </button>
              {showPasswords && (
                <div id="account-password-fields" className="ios-reveal">
                  {PASSWORD_FIELDS.map(({ key, label, autoComplete }, index) => (
                    <div key={key} className="ios-cell-block">
                      <input
                        id={`account-${key}`}
                        type={revealPasswords ? "text" : "password"}
                        placeholder={tr(label)}
                        aria-label={tr(label)}
                        autoComplete={autoComplete}
                        value={passwords[key]}
                        disabled={disabled}
                        onChange={(event) => {
                          setPasswords((value) => ({ ...value, [key]: event.target.value }));
                          setPasswordError("");
                        }}
                      />
                      {index === 0 && (
                        <button
                          type="button"
                          className="ios-cell-block__button"
                          aria-label={tr(revealPasswords ? "Nascondi password" : "Mostra password")}
                          aria-pressed={revealPasswords}
                          onClick={() => setRevealPasswords((value) => !value)}
                        >
                          {revealPasswords ? <EyeOff size={19} /> : <Eye size={19} />}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {passwordError && (
              <p role="alert" className="ios-group__error">
                {tr(passwordError)}
              </p>
            )}
            <p className="ios-group__footer">
              {tr(
                "Usa almeno 10 caratteri. Dopo il cambio, le altre sessioni dovranno accedere di nuovo.",
              )}
            </p>
          </section>

          <AppearanceSettings />

          {!wideSplit && dataSection}
        </div>
      </form>

      <Modal
        isOpen={currencyOpen}
        title={tr("Scegli la valuta")}
        description={tr("Cambiare valuta non converte gli importi già registrati.")}
        maxWidth="lg"
        onClose={() => setCurrencyOpen(false)}
      >
        <div className="ios-compose">
          <ChoiceList
            title={tr("Valute disponibili")}
            searchable={false}
            value={currency}
            choices={CURRENCIES.map((code) => ({
              key: code,
              label: tr(`currency.${code}`),
              description: code,
              color: "#34c759",
              icon: <span className="text-[13px] font-semibold">{CURRENCY_SYMBOLS[code]}</span>,
            }))}
            onChoose={(code) => {
              setCurrency(code);
              setCurrencyOpen(false);
            }}
          />
        </div>
      </Modal>

      <DeleteConfirmModal
        isOpen={deleteOpen}
        title={tr("Eliminare il tuo account?")}
        warning={tr(
          "Il tuo account, tutti i movimenti, le categorie e le sottocategorie saranno eliminati. Questa operazione non può essere annullata.",
        )}
        preview={{
          media: <UserRound size={20} strokeWidth={2} />,
          title: [user.name, user.surname].filter(Boolean).join(" ") || user.email,
          detail: user.email,
        }}
        isDeleting={deleteBusy}
        onClose={() => !deleteBusy && setDeleteOpen(false)}
        onConfirm={() => void removeAccount()}
      />

      <div className="floating-actions mobile-floating-actions settings-floating-actions fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-40 -translate-x-1/2">
        <FloatingButton
          alwaysVisibleOnMobile
          ariaLabel={tr("Indietro")}
          icon={<ChevronLeft size={27} />}
          onClick={() =>
            location.key === "default" ? navigate("/", { replace: true }) : navigate(-1)
          }
        />
        <FloatingButton
          alwaysVisibleOnMobile
          type="submit"
          form="account-settings-form"
          ariaLabel={tr(busy ? "Salvataggio…" : "Salva")}
          icon={<Check size={26} strokeWidth={2.6} />}
          disabled={disabled}
        />
      </div>
    </main>
  );
}
