import {useMoney} from '../contexts/currency.context';
import {useTranslation} from 'react-i18next';
import {Wallet} from 'lucide-react';
import {tr} from '../i18n';
import type {Summary,Category} from '../types';
export default function SpendingBreakdown({ summary, categories }: { summary: Summary; categories: Map<string, Category> }) {
  const money=useMoney();
  useTranslation();
  if (!summary.expense) return <div className="empty"><span><Wallet size={28}/></span><p>{tr('Le tue spese per categoria compariranno qui.')}</p></div>;
  let cursor = 0; const stops = summary.byCategory.map(item => { const start = cursor; cursor += item.total / summary.expense * 100; return `${categories.get(item._id)?.color ?? '#32cd32'} ${start}% ${cursor}%`; }).join(',');
  return <div className="breakdown"><div className="donut" style={{ background: `conic-gradient(${stops})` }}><div><small>{tr("Spese totali")}</small><strong>{money(summary.expense)}</strong></div></div><div className="category-legend">{summary.byCategory.map(item => <div key={item._id}><span><i style={{ background: categories.get(item._id)?.color ?? '#32cd32' }} />{categories.get(item._id)?.name ?? tr("Categoria")}</span><strong>{money(item.total)}</strong></div>)}</div></div>;
}
