import mongoose from 'mongoose';
import { Account, Category, Subcategory, Entry } from './models.js';
import { fail } from './validation.js';

export async function deleteAccount(accountId, confirmation, database = mongoose, models = { Account, Category, Subcategory, Entry }) {
  if (confirmation !== true) fail('Conferma l’eliminazione dell’account.');
  const session = await database.startSession();
  try {
    await session.withTransaction(async () => {
      const deleted = await models.Account.deleteOne({ _id: accountId }, { session });
      if (deleted.deletedCount !== 1) fail('Account non trovato.', 404);
      for (const model of [models.Entry, models.Subcategory, models.Category]) {
        await model.deleteMany({ user: accountId }, { session });
      }
    });
  } finally {
    await session.endSession();
  }
}
