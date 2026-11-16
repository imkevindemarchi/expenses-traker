import {
  useId,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { CircleAlert } from "lucide-react";
import LanguageSelector from "./LanguageSelector.component";
import "../styles/AuthShell.styles.css";

/*
 * Sign-in / sign-up screens, shared verbatim by Alice & Kevin, Expenses Traker
 * and Gym Traker. The same screen as the Alice & Kevin landing ("Choose your
 * CRM"), like a native iOS 27 account screen: the app icon on glass, a large
 * title, the fields in one inset grouped card, a full-width capsule button
 * and the secondary action as the footnote.
 */

type ShellProps = {
  brand: string;
  logo: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
  /** Secondary action under the form (e.g. "First time here? Sign up"). */
  footer?: ReactNode;
};

export default function AuthShell({ brand, logo, title, description, children, footer }: ShellProps) {
  return (
    <main className="auth-shell">
      <div className="auth-backdrop" aria-hidden="true" />
      {/* The same round flag button as the phone sidebar. */}
      <div className="auth-language">
        <LanguageSelector
          className="[&>button]:size-12 [&>button]:justify-center [&>button]:gap-0 [&>button]:p-0 [&>button>svg]:hidden [&>button>span:nth-child(2)]:hidden"
          placement="bottom"
          alignment="right"
        />
      </div>
      <section className="auth-sheet" aria-labelledby="auth-title">
        <header className="auth-hero">
          <span className="auth-icon" aria-hidden="true">
            {logo}
          </span>
          <p className="auth-brand">{brand}</p>
          <h1 id="auth-title" className="auth-title">
            {title}
          </h1>
          <p className="auth-subtitle">{description}</p>
        </header>
        <div className="auth-body">{children}</div>
        {footer && <footer className="auth-footer">{footer}</footer>}
      </section>
    </main>
  );
}

/** The inset grouped card that holds the fields. */
export function AuthGroup({ children, footnote }: { children: ReactNode; footnote?: ReactNode }) {
  return (
    <div className="auth-group">
      <div className="auth-group__card">{children}</div>
      {footnote && <p className="auth-group__footnote">{footnote}</p>}
    </div>
  );
}

type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  id: string;
  label: string;
  icon: ReactNode;
  error?: string;
  /** Trailing button inside the row (e.g. show / hide password). */
  action?: { icon: ReactNode; label: string; onClick: () => void };
};

/** One row of the card: tinted glyph, small label, the field, an optional action. */
export function AuthField({ id, label, icon, error, action, disabled, ...input }: FieldProps) {
  const errorId = `${id}-error`;
  return (
    <div className="auth-field" data-invalid={error ? true : undefined}>
      <span className="auth-field__icon" aria-hidden="true">
        {icon}
      </span>
      <span className="auth-field__main">
        <label htmlFor={id} className="auth-field__label">
          {label}
        </label>
        <input
          id={id}
          className="auth-field__input"
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...input}
        />
        {error && (
          <span id={errorId} className="auth-field__error">
            {error}
          </span>
        )}
      </span>
      {action && (
        <button
          type="button"
          className="auth-field__action"
          aria-label={action.label}
          title={action.label}
          disabled={disabled}
          onClick={action.onClick}
        >
          {action.icon}
        </button>
      )}
    </div>
  );
}

/** Inline alert above the button (wrong credentials, server unavailable…). */
export function AuthNotice({ children }: { children: ReactNode }) {
  return (
    <div className="auth-notice" role="alert" aria-live="polite">
      <CircleAlert size={18} strokeWidth={2.2} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

/** Full-width capsule; shows a spinner while the request runs. */
export function AuthButton({
  busy = false,
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { busy?: boolean }) {
  const labelId = useId();
  return (
    <button
      {...props}
      className={`auth-button ${className}`}
      data-busy={busy || undefined}
      aria-busy={busy || undefined}
      aria-labelledby={labelId}
    >
      <span id={labelId} className="auth-button__label">
        {children}
      </span>
      <span className="auth-button__spinner" aria-hidden="true" />
    </button>
  );
}
