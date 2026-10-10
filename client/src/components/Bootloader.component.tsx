import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";



import "../styles/Bootloader.styles.css";

export default function Bootloader({ children }: { children: ReactNode }) {

  const { t } = useTranslation();
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finish = window.setTimeout(() => setLeaving(true), reducedMotion ? 350 : 1900);
    const dismiss = window.setTimeout(() => {
      setVisible(false);
    }, reducedMotion ? 400 : 2350);
    return () => {
      window.clearTimeout(finish);
      window.clearTimeout(dismiss);
    };
  }, [visible]);

  return (
    <>
      <div inert={visible} aria-hidden={visible || undefined}>{children}</div>
      {visible && (
        <div className={`bootloader${leaving ? " bootloader--leaving" : ""}`} role="status" aria-live="polite" aria-label={t("loader.loading")}>
          <div className="bootloader__glow" aria-hidden="true" />
          <div className="bootloader__content">
            <div className="bootloader__emblem" aria-hidden="true">
              <div className="bootloader__orbit" />
              <div className="bootloader__orbit bootloader__orbit--inner" />
              <div className="bootloader__glass">
                <img src="/expenses-logo.png?v=2" alt="" />
              </div>
            </div>
            <p className="bootloader__brand">Expenses Traker</p>
            <div className="bootloader__track" aria-hidden="true"><div /></div>
            <p className="bootloader__caption">{t("loader.loading")}</p>
          </div>
        </div>
      )}
    </>
  );
}
