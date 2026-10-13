import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { LoaderCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getGlobalLoaderSnapshot, subscribeGlobalLoader } from "../stores/loader.store";
export default function OperationLoader() {
 const active = useSyncExternalStore(subscribeGlobalLoader, getGlobalLoaderSnapshot, () => false);
 const [visible,setVisible] = useState(false);
 const { t } = useTranslation();
 useEffect(() => { if(!active) { setVisible(false); return; } const timer=setTimeout(()=>setVisible(true),300); return()=>clearTimeout(timer); },[active]);
 if(!visible) return null;
 return createPortal(<div className="operation-loader" role="status" aria-live="polite" aria-label={t("loader.loading")}><div className="operation-loader-card liquid-glass-panel liquid-glass-panel--open"><LoaderCircle aria-hidden="true" /><span>{t("loader.loading")}</span></div></div>,document.body);
}
