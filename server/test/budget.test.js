import assert from 'node:assert/strict';
import { test } from 'node:test';
import { monthlyBudgetCents } from '../src/validation.js';
import { publicAccount } from '../src/auth.js';
test('limite mensile salvabile in centesimi, zero o non impostato', () => {
  assert.equal(monthlyBudgetCents(''), null);
  assert.equal(monthlyBudgetCents('  '), null);
  assert.equal(monthlyBudgetCents('0'), 0);
  assert.equal(monthlyBudgetCents('0,00'), 0);
  assert.equal(monthlyBudgetCents('123,45'), 12345);
  assert.equal(monthlyBudgetCents('1000000'), 100000000);
  for (const value of [null, undefined, 100, '-1', '1.234', '1000000.01', 'NaN']) assert.throws(() => monthlyBudgetCents(value));
});
test('il budget appartiene al profilo pubblico del suo account e gli account precedenti non hanno un limite', () => {
  const base = {_id:'a'.repeat(24),name:'A',email:'a@example.invalid'};
  assert.equal(publicAccount(base).monthlyBudgetCents, null);
  assert.equal(publicAccount({...base,monthlyBudgetCents:12345}).monthlyBudgetCents, 12345);
});
