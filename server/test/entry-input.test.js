import assert from 'node:assert/strict';
import { test } from 'node:test';
import { entryInput } from '../src/app.js';
const base = { amount: '12,34', date: '2026-10-09', category: 'a'.repeat(24), subcategory:'b'.repeat(24) };
for (const kind of ['expense','income']) {
  test(`${kind}: transazioni con soli tipo, importo, data, categoria e sottocategoria`, () => {
    const input = entryInput({...base,kind});
    assert.deepEqual(input, {kind,amountCents:1234,date:base.date,category:base.category,subcategory:base.subcategory});
    assert.throws(() => entryInput({...base,kind,category:''}));
    for(const subcategory of [undefined,null,'','invalid'])assert.throws(()=>entryInput({...base,kind,subcategory}));
    assert.throws(() => entryInput({...base,kind,amount:'0'}));
    assert.throws(() => entryInput({...base,kind,date:'2026-02-30'}));
  });
}
