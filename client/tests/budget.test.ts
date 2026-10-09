import assert from 'node:assert/strict';
import { test } from 'node:test';
import { budgetStatus } from '../src/utils/budget.ts';
test('budget residuo e indicatori cambiano alle soglie del 50%, 80% e oltre il 100%', () => {
  assert.equal(budgetStatus(10000, 4999).emoji, '😊');
  assert.equal(budgetStatus(10000, 5000).emoji, '😐');
  assert.equal(budgetStatus(10000, 8000).emoji, '😟');
  assert.equal(budgetStatus(10000, 10000).remaining, 0);
  assert.equal(budgetStatus(10000, 10001).emoji, '🚨');
  assert.equal(budgetStatus(10000, 12500).remaining, -2500);
  assert.equal(budgetStatus(10000, 12500).progress, 100);
});
test('il limite zero evita divisioni per zero e distingue assenza di spese e sforamento', () => {
  assert.equal(budgetStatus(0, 0).progress, 0);
  assert.equal(budgetStatus(0, 0).emoji, '😊');
  assert.equal(budgetStatus(0, 1).progress, 100);
  assert.equal(budgetStatus(0, 1).emoji, '🚨');
});
