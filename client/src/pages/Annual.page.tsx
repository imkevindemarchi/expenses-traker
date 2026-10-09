import {OverviewSkeleton} from '../components/LoadingSkeleton.component';
import {useMoney} from '../contexts/currency.context';
import {useEffect,useState} from 'react';
import {useSearchParams} from 'react-router';
import {useTranslation} from 'react-i18next';
import {CalendarRange,Wallet,ArrowDownLeft,ArrowUpRight,TrendingUp} from 'lucide-react';
import {api,today} from '../api';
import {tr,locale} from '../i18n';
import type {AnnualSummary,Entry,Category,Subcategory} from '../types';
import Glass from '../components/Glass.component';
import Select from '../components/Select.component';
import EntriesTable from '../components/EntriesTable.component';
import SpendingBreakdown from '../components/SpendingBreakdown.component';
import {annualMonths} from '../utils/annual';
import Histogram from '../components/Histogram.component';
export default function AnnualPage({refresh,categories,subcategories,onEdit,onDelete}:{refresh:number;categories:Map<string,Category>;subcategories:Map<string,Subcategory>;onEdit:(entry:Entry)=>void;onDelete:(entry:Entry)=>void}) {
  const money=useMoney();
  useTranslation();
  const [params,setParams]=useSearchParams();
  const currentYear=Number(today().slice(0,4));
  const requested=params.get('year')??String(currentYear);
  const year=/^\d{4}$/.test(requested)&&Number(requested)>=2000&&Number(requested)<=currentYear?requested:String(currentYear);
  const [summary,setSummary]=useState<AnnualSummary|null>(null);
  const [error,setError]=useState('');
  useEffect(()=>{let active=true;setSummary(null);setError('');api<AnnualSummary>(`/annual-summary?year=${year}`).then(result=>{if(active)setSummary(result);}).catch(cause=>{if(active)setError(cause instanceof Error?cause.message:'Si è verificato un errore.');});return()=>{active=false;};},[year,refresh]);
  return <>
    <div className="annual-filter"><Select id="annual-year" value={year} icon={<CalendarRange size={18}/>} options={Array.from({length:currentYear-1999},(_,index)=>({value:String(currentYear-index),label:String(currentYear-index)}))} onChange={value=>setParams({year:value})}/></div>
    {error?<p className="expense-text" role="alert">{tr(error)}</p>:!summary?<OverviewSkeleton/>:<>
    <div className="overview-grid"><Glass className="balance-card"><div className="balance-heading"><span className="eyebrow">{tr('BILANCIO DELL’ANNO')}</span><span className="round-icon"><Wallet size={20}/></span></div><p className="balance-value">{money(summary.balance)}</p><p className="muted">{tr('Entrate meno spese del periodo selezionato.')}</p><span className="balance-chip"><TrendingUp size={14}/>{tr('{{count}} movimenti registrati',{count:summary.count})}</span></Glass><Glass className="stat-card income-card"><span className="stat-icon income"><ArrowDownLeft size={24}/></span><p className="muted">{tr('Entrate')}</p><strong>{money(summary.income)}</strong><small>{tr('Quello che hai guadagnato')}</small></Glass><Glass className="stat-card expense-card"><span className="stat-icon expense"><ArrowUpRight size={24}/></span><p className="muted">{tr('Spese')}</p><strong>{money(summary.expense)}</strong><small>{tr('Quello che hai speso')}</small></Glass></div>
    <div className="charts-grid"><Glass className="panel"><div className="section-heading"><h2>{tr('Andamento dell’anno')}</h2></div><AnnualTrend summary={summary} year={year}/></Glass><Glass className="panel"><h2>{tr('Spese per categoria')}</h2><SpendingBreakdown summary={summary} categories={categories}/></Glass></div>
    <Glass className="panel"><div className="section-heading"><h2>{tr('Ultimi movimenti dell’anno')}</h2></div><EntriesTable entries={summary.entries} categories={categories} subcategories={subcategories} onEdit={onEdit} onDelete={onDelete}/></Glass>
    </>}
  </>;
}
function AnnualTrend({summary,year}:{summary:AnnualSummary;year:string}) {
 const months=annualMonths(year,summary.monthly);
 return <Histogram label={tr('Andamento mensile di entrate e spese')} labels={months.map(month=>{const label=new Intl.DateTimeFormat(locale(),{month:'short'}).format(new Date(month.month+'-01T12:00:00Z'));return label.charAt(0).toLocaleUpperCase(locale())+label.slice(1);})} income={months.map(month=>month.income)} expense={months.map(month=>month.expense)}/>;
}
