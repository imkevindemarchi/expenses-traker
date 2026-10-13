import type { ReactNode } from "react";
import LanguageSelector from "./LanguageSelector.component";
import "../styles/AuthShell.styles.css";

type Props = { brand: string; logo: ReactNode; title: string; description: string; children: ReactNode };

export default function AuthShell({ brand, logo, title, description, children }: Props) {
  return (
    <main className="auth-shell ui-refresh">
      <div className="auth-shell-language"><LanguageSelector /></div>
      <section className="auth-shell-content" aria-labelledby="auth-shell-title">
        <div className="auth-shell-brand"><span className="auth-shell-mark" aria-hidden="true">{logo}</span><span>{brand}</span></div>
        <header className="auth-shell-heading"><h1 id="auth-shell-title">{title}</h1><p>{description}</p></header>
        <div className="auth-shell-fields">{children}</div>
      </section>
    </main>
  );
}
