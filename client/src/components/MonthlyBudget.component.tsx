import {useMoney} from '../contexts/currency.context';
import {budgetStatus} from '../utils/budget';
import { useTranslation } from 'react-i18next';
import { tr } from '../i18n';
import Glass from './Glass.component';
export default function MonthlyBudget({limit,spent}: {limit:number;spent:number}) {
  const money=useMoney();
  useTranslation(); const status = budgetStatus(limit,spent);
  return <Glass className={`panel budget-panel ${status.remaining < 0 ? 'budget-exceeded' : ''}`}>
    <div className="budget-heading"><div><p className="eyebrow">{tr('BUDGET DEL MESE CORRENTE')}</p><h2>{status.remaining < 0 ? tr('Limite superato di') : tr('Ti resta da spendere')}</h2></div><span className="budget-emoji" role="img" aria-label={tr(status.message)}>{status.emoji}</span></div>
    <strong className="budget-remaining">{money(Math.abs(status.remaining))}</strong><p className="muted">{tr(status.message)}</p>
    <div className="budget-progress" role="progressbar" aria-label={tr('Budget mensile utilizzato')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={status.progress} aria-valuetext={tr('Spesi {{spent}} su {{limit}}',{spent:money(spent),limit:money(limit)})}><span style={{width:`${status.progress}%`}}/></div>
    <p className="muted">{tr('Spesi {{spent}} su {{limit}}',{spent:money(spent),limit:money(limit)})}</p>
  </Glass>;
}
