import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { LoaderCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../hooks";
import "../styles/LiquidGlass.styles.css";
import { getGlobalLoaderSnapshot, subscribeGlobalLoader } from "../stores/loader.store";
export default function OperationLoader() {
 const active = useSyncExternalStore(subscribeGlobalLoader, getGlobalLoaderSnapshot, () => false);
 const [visible,setVisible] = useState(false);
 const { t } = useTranslation();
 const { theme } = useTheme();
 useEffect(() => { const timer=setTimeout(()=>setVisible(active),active ? 300 : 0); return()=>clearTimeout(timer); },[active]);
 if(!active || !visible) return null;
 return createPortal(<div className="operation-loader" role="status" aria-live="polite" aria-label={t("loader.loading")}><div data-glass-theme={theme} className={`operation-loader-card glass-surface ${theme === "dark" ? "glass-surface--dark" : ""}`}><LoaderCircle aria-hidden="true" /><span>{t("loader.loading")}</span></div></div>,document.body);
}
