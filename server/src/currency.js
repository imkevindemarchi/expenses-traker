import {fail} from './validation.js';
export const CURRENCIES = ['EUR','USD','GBP','CHF','CAD','AUD'];
export function accountCurrency(value) {
  if(typeof value !== 'string' || !CURRENCIES.includes(value)) {
    fail('Valuta non valida.');
  }
  return value;
}
