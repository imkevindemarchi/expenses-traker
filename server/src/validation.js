export class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export const fail = (message, status = 400) => { throw new ApiError(status, message); };
export const text = (value, name, max = 80) => {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) fail(`${name}: inserisci da 1 a ${max} caratteri.`);
  return value.trim();
};
export const objectId = value => {
  if (typeof value !== 'string' || !/^[a-f\d]{24}$/i.test(value)) fail('Identificativo non valido.');
  return value;
};
export const dateKey = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) fail('Data non valida.');
  const parsed = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) fail('Data non valida.');
  if (value < '2000-01-01' || value > '2100-12-31') fail('Scegli una data tra il 2000 e il 2100.');
  return value;
};
export const amountCents = value => {
  if (typeof value !== 'string' || !/^\d{1,7}([.,]\d{1,2})?$/.test(value)) fail('Importo non valido: usa un massimo di due decimali.');
  const [whole, fraction = ''] = value.replace(',', '.').split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(cents) || cents <= 0 || cents > 100_000_000) fail('L’importo deve essere compreso tra 0,01 e 1.000.000.');
  return cents;
};
export const color = value => {
  if (typeof value !== 'string' || !/^#[a-f\d]{6}$/i.test(value)) fail('Colore non valido.');
  return value;
};
export const monthRange = value => {
  if (typeof value !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) fail('Mese non valido.');
  const [year, month] = value.split('-').map(Number);
  if (year < 2000 || year > 2100) fail('Scegli un anno tra il 2000 e il 2100.');
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { from: `${value}-01`, to: `${value}-${last}` };
};
export const owned = (userId, id) => ({ user: userId, ...(id ? { _id: objectId(id) } : {}) });
export const credentials = (body, registration = false) => {
  const email = text(body.email, 'Email', 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('Email non valida.');
  if (typeof body.password !== 'string' || body.password.length < 10 || Buffer.byteLength(body.password, 'utf8') > 72) fail('La password deve avere almeno 10 caratteri e non superare 72 byte.');
  return { email, password: body.password, ...(registration ? { name: text(body.name, 'Nome', 60) } : {}) };
};

export const monthlyBudgetCents = value => {
 if (typeof value !== 'string') fail('Limite mensile non valido.');
 const normalized = value.trim();
 if (!normalized) return null;
 if (/^0([.,]0{1,2})?$/.test(normalized)) return 0;
 return amountCents(normalized);
};

export const transactionPageLimit = value => {const limit=Number(value ?? 20);if (![10,20,50].includes(limit)) fail('Numero di righe non valido.');return limit;};

export const yearRange = value => {if(typeof value !== 'string' || !/^\d{4}$/.test(value) || Number(value)<2000 || Number(value)>Number(new Intl.DateTimeFormat('en',{timeZone:'Europe/Rome',year:'numeric'}).format(new Date()))) fail('Anno non valido.');return {from:value+'-01-01',to:value+'-12-31'};};
