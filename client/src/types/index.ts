import type { ReactNode } from 'react';
export type TSelectOption<T extends string = string> = { value: T; label: string; description?: string; icon?: ReactNode };
export type User = { id: string; name: string; surname?: string; email: string; monthlyBudgetCents: number | null; currency: string };
export type Category = { _id: string; name: string; color: string };
export type Subcategory = { _id: string; name: string; category: string };
export type Entry = { _id: string; kind: 'income' | 'expense'; amountCents: number; date: string; category: string; subcategory: string | null };
export type Summary = { income: number; expense: number; balance: number; count: number; byCategory: { _id: string; total: number }[]; daily: { _id: { date: string; kind: 'expense' | 'income' }; total: number }[] };

export type TPagination = {page:number;limit:number;total_items:number;total_pages:number;has_next_page:boolean;has_previous_page:boolean};

export type AnnualSummary = Summary & {year:string;monthly:{_id:{month:string;kind:'expense'|'income'};total:number}[];entries:Entry[]};
