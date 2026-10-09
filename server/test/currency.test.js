import test from 'node:test';
import assert from 'node:assert/strict';
import {accountCurrency,CURRENCIES} from '../src/currency.js';
import {publicAccount} from '../src/auth.js';
import {Account} from '../src/models.js';
test('supported currencies are validated and malformed currencies are rejected',()=>{
 for(const currency of CURRENCIES)assert.equal(accountCurrency(currency),currency);
 for(const currency of [undefined,null,'usd','JPY','',{},'$'])assert.throws(()=>accountCurrency(currency),error=>error.status===400);
});
test('new and legacy accounts default to EUR and expose their own saved currency',()=>{
 const base={_id:'a'.repeat(24),name:'A',email:'a@example.invalid'};
 assert.equal(publicAccount(base).currency,'EUR');
 assert.equal(publicAccount({...base,currency:'USD'}).currency,'USD');
 assert.equal(new Account(base).currency,'EUR');
 assert.equal(new Account({...base,currency:'USD'}).currency,'USD');
});
