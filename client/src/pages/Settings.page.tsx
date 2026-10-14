import SectionNavigation from "../components/SectionNavigation.component";
import CurrencyPicker from "../components/CurrencyPicker.component";
import "../styles/DeleteConfirmation.styles.css";
import { useMoney } from "../contexts/currency.context";
import { useState, useId, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Settings,
  Save,
  LockKeyhole,
  Eye,
  EyeOff,
  Trash2,
  TriangleAlert,
  X,
  UserRound,
  Database,
  Download,
  ChevronLeft,
  ChevronDown,
} from "lucide-react";
import { api } from "../api";
import { tr, locale } from "../i18n";
import type { User } from "../types";

import InputNumber from "../components/InputNumber.component";
import type { ReactNode } from "react";
import "../styles/Settings.styles.css";
import Input from "../components/Input.component";
import Button from "../components/Button.component";
import FloatingButton from "../components/FloatingButton.component";
function SettingsSection({ id, header, children, ariaLabel, collapsible = false }: { id: string; header: ReactNode; children: ReactNode; ariaLabel: string; collapsible?: boolean }) {
  const [open, setOpen] = useState(!collapsible);
  const contentId = useId();
  return <section id={id} tabIndex={-1} className="settings-section" aria-label={ariaLabel}>
    {header}
    <div className="settings-section-body">
      {collapsible && <Button unstyled type="button" className="settings-password-toggle" aria-expanded={open} aria-controls={contentId} onClick={() => setOpen(value => !value)}>{ariaLabel}<ChevronDown className={open ? "is-open" : ""} size={18} /></Button>}
      <div id={contentId} hidden={!open} className={collapsible ? "settings-password-fields" : undefined}>{children}</div>
    </div>
  </section>;
}
export default function SettingsPage({
  user,
  onSaved,
  onNotice,
  onDeleted,
}: {
  user: User;
  onSaved: (user: User) => void;
  onNotice: (error: boolean, message: string) => void;
  onDeleted: () => void;
}) {
  const money = useMoney();
  const navigate = useNavigate();
  useTranslation();
  const [amount, setAmount] = useState(
    user.monthlyBudgetCents == null ? "" : (user.monthlyBudgetCents / 100).toFixed(2),
  );
  const [currency, setCurrency] = useState(user.currency ?? "EUR");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [profile, setProfile] = useState({ name: user.name ?? "", surname: user.surname ?? "" });
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [exportBusy, setExportBusy] = useState(false);
  const exportData = async () => {
    if (busy || deleteBusy || exportBusy) return;
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
    if (!deleteConfirm || deleteBusy || busy || exportBusy) return;
    setDeleteBusy(true);
    setDeleteError("");
    try {
      await api("/account", { method: "DELETE", body: { confirm: true } });
      onDeleted();
    } catch (cause) {
      setDeleteError(cause instanceof Error ? cause.message : "Si è verificato un errore.");
    } finally {
      setDeleteBusy(false);
    }
  };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (busy || deleteBusy || exportBusy) return;
    setError("");
    if (
      amount !== "" &&
      (!/^\d{1,7}([.,]\d{1,2})?$/.test(amount) || Number(amount.replace(",", ".")) > 1_000_000)
    ) {
      setError("Inserisci un limite tra 0 e 1.000.000, con massimo due decimali.");
      return;
    }
    const passwordChanged = Object.values(passwords).some(Boolean);
    if (passwordChanged) {
      if (!passwords.currentPassword) {
        setError("Inserisci la password attuale.");
        return;
      }
      if (
        passwords.newPassword.length < 10 ||
        new TextEncoder().encode(passwords.newPassword).length > 72
      ) {
        setError("La password deve avere almeno 10 caratteri e non superare 72 byte.");
        return;
      }
      if (passwords.newPassword !== passwords.confirmPassword) {
        setError("Le nuove password non coincidono.");
        return;
      }
      if (passwords.newPassword === passwords.currentPassword) {
        setError("Scegli una password diversa da quella attuale.");
        return;
      }
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
      setError(cause instanceof Error ? cause.message : "Si è verificato un errore.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="subscription-settings-page">
      <div className="settings-layout">
      <SectionNavigation label={tr("Impostazioni")} sections={[
        { id: "expense-settings-0", title: tr("Profilo"), icon: <UserRound size={18} /> },
        { id: "expense-settings-1", title: tr("Valuta e budget mensile"), icon: <Settings size={18} /> },
        { id: "expense-settings-2", title: tr("Password"), icon: <LockKeyhole size={18} /> },
        { id: "expense-settings-3", title: tr("Gestione dati"), icon: <Database size={18} /> },
      ]} />
      <form
        id="account-settings-form"
        className="settings-sections settings-redesign"
        onSubmit={save}
        noValidate
        aria-busy={busy}
      >
        <SettingsSection id="expense-settings-0"
            ariaLabel={tr("Profilo")}
            header={
              <div className="settings-section-heading">
                <span className="settings-section-icon">
                  <UserRound size={22} />
                </span>
                <div>
                  <h2>{tr("Profilo")}</h2>
                  <p className="muted">
                    {tr("Aggiungi il tuo nome e cognome. Entrambi i campi sono facoltativi.")}
                  </p>
                </div>
              </div>
            }
          >
            <div className="form-stack">
              <div className="settings-profile-fields grid">
                <Input
                  id="account-name"
                  label={tr("Nome")}
                  placeholder={tr("Nome")}
                  autoComplete="given-name"
                  maxLength={60}
                  disabled={busy || deleteBusy || exportBusy}
                  value={profile.name}
                  onChange={(event) =>
                    setProfile((value) => ({ ...value, name: event.target.value }))
                  }
                />
                <Input
                  id="account-surname"
                  label={tr("Cognome")}
                  placeholder={tr("Cognome")}
                  autoComplete="family-name"
                  maxLength={60}
                  disabled={busy || deleteBusy || exportBusy}
                  value={profile.surname}
                  onChange={(event) =>
                    setProfile((value) => ({ ...value, surname: event.target.value }))
                  }
                />
              </div>
            </div>
        </SettingsSection>
        <SettingsSection id="expense-settings-1"
            ariaLabel={tr("Valuta e budget mensile")}
            header={
              <div className="settings-section-heading">
                <span className="settings-section-icon">
                  <Settings size={22} />
                </span>
                <div>
                  <h2>{tr("Valuta e budget mensile")}</h2>
                  <p className="muted">
                    {tr(
                      "Imposta quanto puoi spendere ogni mese. Il limite è personale e viene salvato nel tuo account.",
                    )}
                  </p>
                </div>
              </div>
            }
          >
            <div className="form-stack">
              <CurrencyPicker value={currency} onChange={setCurrency} disabled={busy || deleteBusy || exportBusy} />
              <p className="muted">
                {tr("Cambiare valuta non converte gli importi già registrati.")}
              </p>
              <InputNumber
                id="monthly-budget"
                label={tr("Limite di spesa mensile {{currency}}", { currency })}
                placeholder={new Intl.NumberFormat(locale(), { minimumFractionDigits: 2 }).format(
                  0,
                )}
                icon={<span className="text-xs">{currency}</span>}
                allowDecimal
                value={amount}
                disabled={busy}
                error={error ? tr(error) : undefined}
                onChange={(value) => {
                  setAmount(value);
                  setError("");
                }}
              />
              <p className="muted">
                {tr(
                  "Lascia il campo vuoto per non impostare un limite. Il budget residuo compare solo nella panoramica del mese corrente.",
                )}
              </p>
              {user.monthlyBudgetCents != null && (
                <p className="muted">
                  {tr("Limite attuale: {{amount}}", { amount: money(user.monthlyBudgetCents) })}
                </p>
              )}
            </div>
        </SettingsSection>
        <SettingsSection id="expense-settings-2"
            ariaLabel={tr("Cambia password")}
            collapsible
            header={
              <div className="settings-section-heading">
                <span className="settings-section-icon">
                  <LockKeyhole size={22} />
                </span>
                <div>
                  <h2>{tr("Cambia password")}</h2>
                  <p className="muted">
                    {tr(
                      "Usa almeno 10 caratteri. Dopo il cambio, le altre sessioni dovranno accedere di nuovo.",
                    )}
                  </p>
                </div>
              </div>
            }
          >
            <div className="form-stack">
              {(
                [
                  {
                    key: "currentPassword",
                    label: "Password attuale",
                    autoComplete: "current-password",
                  },
                  { key: "newPassword", label: "Nuova password", autoComplete: "new-password" },
                  {
                    key: "confirmPassword",
                    label: "Conferma nuova password",
                    autoComplete: "new-password",
                  },
                ] as const
              ).map(({ key, label, autoComplete }) => (
                <Input
                  key={key}
                  id={`account-${key}`}
                  label={tr(label)}
                  placeholder={tr(label)}
                  type={showPasswords ? "text" : "password"}
                  autoComplete={autoComplete}
                  disabled={busy || deleteBusy || exportBusy}
                  value={passwords[key]}
                  icon={<LockKeyhole size={17} />}
                  endIcon={showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
                  endIconAriaLabel={tr(showPasswords ? "Nascondi password" : "Mostra password")}
                  onEndIconClick={() => setShowPasswords((value) => !value)}
                  onChange={(event) => {
                    setPasswords((value) => ({ ...value, [key]: event.target.value }));
                    setError("");
                  }}
                />
              ))}
            </div>
        </SettingsSection>
        <SettingsSection id="expense-settings-3"
            ariaLabel={tr("I tuoi dati")}
            header={
              <div className="settings-section-heading">
                <span className="settings-section-icon">
                  <Database size={22} />
                </span>
                <div>
                  <h2>{tr("I tuoi dati")}</h2>
                  <p className="muted">
                    {tr("Gestisci una copia dei tuoi dati e il tuo account.")}
                  </p>
                </div>
              </div>
            }
          >
            <div className="settings-data-card">
              <div className="settings-data-heading">
                <span className="settings-data-icon">
                  <Database size={22} />
                </span>
                <div className="settings-data-copy">
                  <h3>{tr("Backup dei dati")}</h3>
                  <p className="muted">
                    {tr(
                      "Esporta tutti i movimenti, le categorie e le impostazioni in un file JSON.",
                    )}
                  </p>
                </div>
              </div>
              <div className="settings-data-actions">
                <Button
                  variant="secondary"
                  disabled={busy || deleteBusy || exportBusy}
                  icon={<Download size={17} />}
                  onClick={() => void exportData()}
                >
                  {tr(exportBusy ? "Esportazione…" : "Esporta backup")}
                </Button>
              </div>
              <p className="muted settings-data-note">
                {tr("Scarica una copia dei tuoi dati prima di eliminare l’account.")}
              </p>
            </div>
            <div className={`settings-delete-box ${deleteConfirm ? "is-confirming" : ""}`}>
              <div className="settings-delete-row">
                <span className="settings-delete-icon">
                  {deleteConfirm ? <TriangleAlert size={20} /> : <Trash2 size={20} />}
                </span>
                <div className="settings-delete-copy">
                  <strong>
                    {tr(deleteConfirm ? "Eliminare il tuo account?" : "Elimina account")}
                  </strong>
                  <p className="muted">
                    {deleteConfirm ? (
                      <>
                        {user.email}
                        <br />
                        {tr(
                          "Il tuo account, tutti i movimenti, le categorie e le sottocategorie saranno eliminati. Questa operazione non può essere annullata.",
                        )}
                      </>
                    ) : (
                      tr("Elimina definitivamente il tuo account e tutti i dati associati.")
                    )}
                  </p>
                </div>
              </div>
              <div className="settings-delete-actions">
                {deleteConfirm ? (
                  <>
                    <Button
                      variant="secondary"
                      disabled={deleteBusy}
                      icon={<X size={16} />}
                      onClick={() => {
                        setDeleteConfirm(false);
                        setDeleteError("");
                      }}
                    >
                      {tr("Annulla")}
                    </Button>
                    <Button
                      variant="danger"
                      disabled={deleteBusy || busy || exportBusy}
                      icon={<Trash2 size={16} />}
                      onClick={() => {
                        void removeAccount();
                      }}
                    >
                      {tr(deleteBusy ? "Eliminazione…" : "Elimina definitivamente")}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="danger"
                    disabled={busy || deleteBusy || exportBusy}
                    icon={<Trash2 size={16} />}
                    onClick={() => {
                      setDeleteError("");
                      setDeleteConfirm(true);
                    }}
                  >
                    {tr("Elimina account")}
                  </Button>
                )}
              </div>
              {deleteError && (
                <p className="form-error" role="alert">
                  {tr(deleteError)}
                </p>
              )}
            </div>
        </SettingsSection>
        {error && (
          <p className="form-error settings-panel" role="alert">
            {tr(error)}
          </p>
        )}
      </form>
      </div>
      <div className="settings-floating-actions mobile-floating-actions fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-40 flex gap-3 -translate-x-1/2">
        <FloatingButton alwaysVisibleOnMobile ariaLabel={tr("Indietro")} icon={<ChevronLeft size={27} />} onClick={()=>navigate("/")} disabled={busy || deleteBusy || exportBusy} />
        <FloatingButton
          type="submit"
          form="account-settings-form"
          ariaLabel={tr(busy ? "Salvataggio…" : "Salva impostazioni")}
          icon={<Save size={27} />}
          disabled={busy || deleteBusy || exportBusy}
        />
      </div>
    </div>
  );
}
