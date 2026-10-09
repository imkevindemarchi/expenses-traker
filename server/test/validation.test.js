import assert from 'node:assert/strict';
import { test } from 'node:test';
import { amountCents, dateKey, monthRange, owned, credentials } from '../src/validation.js';
import { auth } from '../src/auth.js';
test('importi in centesimi, virgola italiana e nessun errore di floating point', () => {
  assert.equal(amountCents('12,34'), 1234); assert.equal(amountCents('0.10'), 10); assert.equal(amountCents('10'), 1000);
  for (const input of ['0', '-1', '1.234', 'NaN', '1000001', 10]) assert.throws(() => amountCents(input));
});
test('validazione dei giorni reali e dei mesi bisestili', () => {
  assert.equal(dateKey('2024-02-29'), '2024-02-29'); assert.throws(() => dateKey('2026-02-29'));
  assert.throws(() => dateKey('2026-13-01')); assert.equal(monthRange('2024-02').to, '2024-02-29');
});
test('tutti i filtri per record includono il proprietario', () => {
  const id = '0123456789abcdef01234567';
  assert.deepEqual(owned('user-a', id), { user: 'user-a', _id: id });
  assert.notDeepEqual(owned('user-a', id), owned('user-b', id));
  assert.throws(() => owned('user-a', { $ne: null }));
});
test('password con limiti bcrypt, email normalizzata e login non autenticato', async () => {
  assert.equal(credentials({ email: ' TEST@example.com ', password: 'password-lunga' }).email, 'test@example.com');
  assert.throws(() => credentials({ email: 'bad', password: 'password-lunga' }));
  assert.throws(() => credentials({ email: 'test@example.com', password: 'é'.repeat(40) }));
  let caught; await auth({ headers: {} }, {}, error => { caught = error; }); assert.equal(caught.status, 401);
});
