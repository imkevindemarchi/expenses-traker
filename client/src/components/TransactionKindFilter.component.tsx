import {Wallet,ArrowDownLeft,ArrowUpRight} from 'lucide-react';
import {tr} from '../i18n';
export default function TransactionKindFilter({value,onChange}:{value:string;onChange:(value:string)=>void}) {
 const items=[{value:'',label:tr('Tutti'),Icon:Wallet},{value:'income',label:tr('Entrate'),Icon:ArrowDownLeft},{value:'expense',label:tr('Spese'),Icon:ArrowUpRight}];
 return <div className="transaction-kind-filter" role="group" aria-label={tr('Tipo di movimento')}>{items.map(({value:kind,label,Icon})=><button key={kind} type="button" className={`kind-filter-option ${kind||'all'}`} aria-pressed={value===kind} onClick={()=>onChange(kind)}><Icon size={17}/><span>{label}</span></button>)}</div>;
}
