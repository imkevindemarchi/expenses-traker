import bcrypt from 'bcryptjs';
import { Account } from './models.js';
import { fail } from './validation.js';

export const passwordChangeInput = body => {
  const { currentPassword, newPassword, confirmPassword } = body;
  if (typeof currentPassword !== 'string' || !currentPassword || Buffer.byteLength(currentPassword, 'utf8') > 72) fail('Inserisci la password attuale.');
  if (typeof newPassword !== 'string' || newPassword.length < 10 || Buffer.byteLength(newPassword, 'utf8') > 72) fail('La password deve avere almeno 10 caratteri e non superare 72 byte.');
  if (newPassword !== confirmPassword) fail('Le nuove password non coincidono.');
  if (newPassword === currentPassword) fail('Scegli una password diversa da quella attuale.');
  return { currentPassword, newPassword };
};

export async function changePassword(accountId, body, accounts = Account, passwords = bcrypt) {
  const input = passwordChangeInput(body);
  const account = await accounts.findById(accountId).select('+passwordHash');
  if (!account) fail('Account non trovato.', 404);
  if (!await passwords.compare(input.currentPassword, account.passwordHash)) fail('La password attuale non è corretta.');
  const passwordHash = await passwords.hash(input.newPassword, 12);
  const updated = await accounts.findOneAndUpdate(
    { _id: accountId, passwordHash: account.passwordHash, sessionVersion: account.sessionVersion },
    { $set: { passwordHash }, $inc: { sessionVersion: 1 } },
    { new: true, runValidators: true },
  );
  if (!updated) fail('L’account è stato aggiornato. Riprova.', 409);
  return updated;
}
