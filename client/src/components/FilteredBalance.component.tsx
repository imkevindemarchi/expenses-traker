import {SkeletonBlock} from './LoadingSkeleton.component';
import {useMoney} from '../contexts/currency.context';
import {ArrowDownLeft,ArrowUpRight,Wallet} from 'lucide-react';
import {tr} from '../i18n';
import type {Summary} from '../types';
export default function FilteredBalance({summary,kind,loading}:{summary:Summary;kind:string;loading:boolean}) {
  const money=useMoney();
 const income=kind==='income',expense=kind==='expense';
 const amount=income?summary.income:expense?summary.expense:summary.balance;
 const Icon=income?ArrowDownLeft:expense?ArrowUpRight:Wallet;
 return <div className="filtered-balance" aria-live="polite" aria-busy={loading}>
   <span className={`stat-icon ${expense?'expense':'income'}`}><Icon size={22}/></span>
   <div><p className="muted">{tr(income?'Totale entrate filtrate':expense?'Totale spese filtrate':'Bilancio dei movimenti filtrati')}</p><strong className={expense||(!income&&amount<0)?'expense-text':'income-text'}>{loading?<SkeletonBlock className="skeleton-amount"/>:money(amount)}</strong></div>
 </div>;
}
