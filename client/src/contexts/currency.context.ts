import {createContext,useContext} from 'react';
import {money as formatMoney} from '../api';
export const CURRENCIES=['EUR','USD','GBP','CHF','CAD','AUD'] as const;
export const CurrencyContext=createContext('EUR');
export function useMoney(){const currency=useContext(CurrencyContext);return (cents:number)=>formatMoney(cents,currency);}
