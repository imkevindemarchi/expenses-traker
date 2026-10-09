import bcrypt from 'bcryptjs';
import { Account } from './models.js';
import { accountCurrency } from './currency.js';
import { monthlyBudgetCents, fail } from './validation.js';
import { profileInput } from './profile.js';
import { passwordChangeInput } from './password.js';

export async function saveAccountSettings(accountId, body, accounts = Account, passwords = bcrypt) {
  const changes = { currency: accountCurrency(body.currency), monthlyBudgetCents: monthlyBudgetCents(body.monthlyBudget) };
  if (body.name !== undefined || body.surname !== undefined) Object.assign(changes, profileInput(body));
  const filter = { _id: accountId };
  const update = { $set: changes };
  const passwordChanged = body.passwordChange !== undefined;
  if (passwordChanged) {
    if (!body.passwordChange || typeof body.passwordChange !== 'object' || Array.isArray(body.passwordChange)) fail('Inserisci la password attuale.');
    const input = passwordChangeInput(body.passwordChange);
    const account = await accounts.findById(accountId).select('+passwordHash');
    if (!account) fail('Account non trovato.', 404);
    if (!await passwords.compare(input.currentPassword, account.passwordHash)) fail('La password attuale non è corretta.');
    changes.passwordHash = await passwords.hash(input.newPassword, 12);
    Object.assign(filter, { passwordHash: account.passwordHash, sessionVersion: account.sessionVersion });
    update.$inc = { sessionVersion: 1 };
  }
  const account = await accounts.findOneAndUpdate(filter, update, { new: true, runValidators: true });
  if (!account) fail(passwordChanged ? 'L’account è stato aggiornato. Riprova.' : 'Account non trovato.', passwordChanged ? 409 : 404);
  return { account, passwordChanged };
}
