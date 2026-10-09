import type { AnnualSummary } from '../types/index.ts';
export function annualMonths(year:string, monthly:AnnualSummary['monthly']) {
  const months=Array.from({length:12},(_,index)=>({month:`${year}-${String(index+1).padStart(2,'0')}`,income:0,expense:0}));
  for(const item of monthly) {const row=months.find(month=>month.month===item._id.month);if(row) row[item._id.kind]+=item.total;}
  return months;
}
