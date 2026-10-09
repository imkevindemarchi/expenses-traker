import {useContext} from 'react';
import {CurrencyContext,useMoney} from '../contexts/currency.context';
import {useTranslation} from 'react-i18next';
import {ArrowDownLeft,ArrowUpRight,Pencil,Trash2,Wallet} from 'lucide-react';
import {tr} from '../i18n';
import {displayDate} from '../api';
import {INCOME_COLOR,EXPENSE_COLOR} from '../assets/constants/transaction-colors';
import type {Entry,Category,Subcategory} from '../types';
export default function EntriesTable({entries,categories,subcategories,onEdit,onDelete}:{entries:Entry[];categories:Map<string,Category>;subcategories:Map<string,Subcategory>;onEdit:(entry:Entry)=>void;onDelete:(entry:Entry)=>void}){
  const money=useMoney();const currency=useContext(CurrencyContext);
useTranslation();
  if (!entries.length) return <div className="empty"><span><Wallet size={28}/></span><p>{tr('Nessun movimento nel periodo selezionato. Usa il pulsante + per registrarne uno.')}</p></div>;
  return <table className="entry-table"><caption className="sr-only">{tr('I tuoi movimenti')}</caption><thead className="sr-only"><tr><th scope="col">{tr('Tipo')}</th><th scope="col">{tr('Movimento')}</th><th scope="col">{tr('Importo {{currency}}',{currency})}</th><th scope="col">{tr('Azioni')}</th></tr></thead><tbody>{entries.map(entry => { const category = categories.get(entry.category); const displayTitle = (entry.subcategory ? subcategories.get(entry.subcategory)?.name : category?.name) ?? tr('Categoria'); return <tr key={entry._id} className="entry-row"><td><span className="entry-icon" style={{ color: entry.kind === 'income' ? INCOME_COLOR : EXPENSE_COLOR, background: (entry.kind === 'income' ? INCOME_COLOR : EXPENSE_COLOR) + '15' }}>{entry.kind === 'expense' ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}</span></td><td className="entry-description"><h3>{displayTitle}</h3><p>{category?.name ?? tr("Categoria")}{entry.subcategory && ` / ${subcategories.get(entry.subcategory)?.name ?? ''}`}<span> · {displayDate(entry.date)}</span></p></td><td className="entry-amount"><strong className={entry.kind === 'income' ? 'income-text' : 'expense-text'}>{entry.kind === 'expense' ? '−' : '+'}{money(entry.amountCents)}</strong></td><td className="entry-actions"><button className="quiet-icon" onClick={() => onEdit(entry)} aria-label={tr("Modifica {{name}}", {name:displayTitle})}><Pencil size={16} /></button><button className="quiet-icon danger" onClick={() => onDelete(entry)} aria-label={tr("Elimina {{name}}", {name:displayTitle})}><Trash2 size={16} /></button></td></tr>; })}</tbody></table>;
}
