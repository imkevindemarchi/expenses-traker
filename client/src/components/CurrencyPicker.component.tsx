import { useId, useState } from "react";
import { Banknote, Check, ChevronDown, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CURRENCIES } from "../contexts/currency.context";
import { tr } from "../i18n";
import Button from "./Button.component";
import Input from "./Input.component";
import Modal from "./Modal.component";
import "../styles/CurrencyPicker.styles.css";

const SYMBOLS: Record<string, string> = { EUR: "€", USD: "$", GBP: "£", CHF: "CHF", CAD: "CA$", AUD: "A$" };

export default function CurrencyPicker({ value, disabled, onChange }: {
  value: string; disabled?: boolean; onChange: (value: string) => void;
}) {
  useTranslation();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const query = search.trim().toLocaleLowerCase();
  const currencies = CURRENCIES.filter(code => `${code} ${tr(`currency.${code}`)} ${SYMBOLS[code]}`.toLocaleLowerCase().includes(query));
  return <>
    <div className="currency-picker">
      <span id={`${id}-label`} className="currency-picker-label">{tr("Valuta dell’account")}</span>
      <Button unstyled id="account-currency" className="currency-picker-trigger" aria-labelledby={`${id}-label ${id}-value`} aria-haspopup="dialog" aria-expanded={open} disabled={disabled} onClick={() => { setSearch(""); setOpen(true); }}>
        <Banknote size={20} aria-hidden="true" />
        <span id={`${id}-value`}>{tr(`currency.${value}`)} <small>{value}</small></span>
        <ChevronDown size={18} aria-hidden="true" />
      </Button>
    </div>
    <Modal isOpen={open} title={tr("Scegli la valuta")} description={tr("Cambiare valuta non converte gli importi già registrati.")} maxWidth="lg" onClose={() => setOpen(false)}>
      <div className="currency-picker-content">
        <Input id={`${id}-search`} type="search" label={tr("Cerca valuta")} placeholder={tr("Cerca per nome o codice…")} icon={<Search size={18} />} value={search} onChange={event => setSearch(event.target.value)} />
        <div className="currency-picker-cards" role="group" aria-label={tr("Valute disponibili")}>
          {currencies.map(code => <button key={code} type="button" className="currency-picker-card" aria-pressed={value === code} disabled={disabled} onClick={() => { onChange(code); setOpen(false); }}>
            <span className="currency-picker-symbol" aria-hidden="true">{SYMBOLS[code]}</span>
            <span className="currency-picker-copy"><strong>{tr(`currency.${code}`)}</strong><span>{code}</span></span>
            {value === code && <Check size={20} className="currency-picker-check" aria-hidden="true" />}
          </button>)}
        </div>
        {!currencies.length && <p className="currency-picker-empty" role="status">{tr("Nessun risultato.")}</p>}
      </div>
    </Modal>
  </>;
}
