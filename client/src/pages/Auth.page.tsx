import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router";
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import AuthShell, {
  AuthButton,
  AuthField,
  AuthGroup,
  AuthNotice,
} from "../components/AuthShell.component";
import { api } from "../api";
import { tr } from "../i18n";
import { ROUTE_PATHS } from "../routes/routes.config";
import type { User } from "../types";

const errorText = (error: unknown) =>
  error instanceof Error ? error.message : tr("Si è verificato un errore.");

export default function AuthPage({ onLogin }: { onLogin: (user: User) => void }) {
  useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const register = location.pathname === ROUTE_PATHS.register;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<"name" | "email" | "password", string>>
  >({});
  const changeField = (field: "name" | "email" | "password", value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setFieldErrors((previous) => ({ ...previous, [field]: undefined }));
    setError("");
  };
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const errors: Partial<Record<"name" | "email" | "password", string>> = {};
    if (register && !form.name.trim()) errors.name = "Inserisci il tuo nome.";
    else if (register && form.name.trim().length > 60)
      errors.name = "Il nome può contenere al massimo 60 caratteri.";
    if (!form.email.trim()) errors.email = "Inserisci la tua email.";
    else if (
      form.email.trim().length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    )
      errors.email = "Inserisci un indirizzo email valido.";
    if (!form.password) errors.password = "Inserisci la password.";
    else if (form.password.length < 10)
      errors.password = "La password deve avere almeno 10 caratteri.";
    else if (new TextEncoder().encode(form.password).length > 72)
      errors.password = "La password è troppo lunga (massimo 72 byte).";
    setFieldErrors(errors);
    setError("");
    if (Object.keys(errors).length) {
      document.getElementById("auth-" + Object.keys(errors)[0])?.focus();
      return;
    }
    setBusy(true);
    try {
      const result = await api<{ user: User }>(register ? "/auth/register" : "/auth/login", {
        method: "POST",
        body: form,
      });
      onLogin(result.user);
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy(false);
    }
  };
  return (
    <AuthShell
      brand="Expenses Traker"
      logo={<img src="/expenses-logo.png?v=2" alt="" />}
      title={register ? tr("Crea il tuo account") : tr("Accedi al tuo account")}
      description={tr(register ? "Crea il tuo account per iniziare." : "Accedi per continuare.")}
      footer={
        <>
          {register ? tr("Hai già un account?") : tr("È la tua prima volta?")}{" "}
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              navigate(register ? ROUTE_PATHS.login : ROUTE_PATHS.register, {
                state: location.state,
              });
              setError("");
              setFieldErrors({});
            }}
          >
            {register ? tr("Accedi") : tr("Registrati")}
          </button>
        </>
      }
    >
      <form onSubmit={submit} className="auth-form" noValidate aria-busy={busy}>
        <AuthGroup
          footnote={
            register
              ? tr(
                  "Almeno 10 caratteri. Le tue categorie iniziali saranno Lavoro, Extra e Necessità.",
                )
              : undefined
          }
        >
          {register && (
            <AuthField
              id="auth-name"
              label={tr("Il tuo nome")}
              placeholder={tr("Inserisci il tuo nome")}
              error={fieldErrors.name ? tr(fieldErrors.name!) : undefined}
              icon={<UserRound />}
              autoComplete="name"
              enterKeyHint="next"
              required
              disabled={busy}
              maxLength={60}
              value={form.name}
              onChange={(event) => changeField("name", event.target.value)}
            />
          )}
          <AuthField
            id="auth-email"
            label={tr("Email")}
            error={fieldErrors.email ? tr(fieldErrors.email!) : undefined}
            placeholder={tr("Inserisci la tua email")}
            icon={<Mail />}
            autoComplete="email"
            type="email"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint="next"
            required
            disabled={busy}
            value={form.email}
            onChange={(event) => changeField("email", event.target.value)}
          />
          <AuthField
            id="auth-password"
            label={tr("Password")}
            error={fieldErrors.password ? tr(fieldErrors.password!) : undefined}
            placeholder={tr("Inserisci la tua password")}
            icon={<LockKeyhole />}
            autoComplete={register ? "new-password" : "current-password"}
            type={showPassword ? "text" : "password"}
            action={{
              icon: showPassword ? <EyeOff size={20} /> : <Eye size={20} />,
              label: showPassword ? tr("Nascondi password") : tr("Mostra password"),
              onClick: () => setShowPassword((value) => !value),
            }}
            minLength={register ? 10 : undefined}
            enterKeyHint="go"
            required
            disabled={busy}
            value={form.password}
            onChange={(event) => changeField("password", event.target.value)}
          />
        </AuthGroup>
        {error && <AuthNotice>{tr(error)}</AuthNotice>}
        <AuthButton type="submit" disabled={busy} busy={busy}>
          {register ? tr("Crea account") : tr("Accedi")}
        </AuthButton>
      </form>
    </AuthShell>
  );
}
