import { fail } from './validation.js';

export const profileInput = body => {
  const result = {};
  for (const [key,label] of [['name','Nome'],['surname','Cognome']]) {
    if (typeof body[key] !== 'string' || body[key].trim().length > 60) fail(`${label}: usa un massimo di 60 caratteri.`);
    result[key] = body[key].trim();
  }
  return result;
};
