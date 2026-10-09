import test from 'node:test';
import assert from 'node:assert/strict';
import { deleteAccount } from '../src/delete-account.js';

test('account deletion requires explicit confirmation before starting a transaction', async () => {
  for(const confirmation of [undefined,false,'true',1]){
    await assert.rejects(deleteAccount('owner',confirmation,{startSession:()=>{assert.fail('Must not start a session');}}),error=>error.status===400);
  }
});
test('deletion scopes every collection to the signed-in account and shares a transaction', async () => {
  const calls=[];let ended=false;
  const session={withTransaction:async action=>action(),endSession:async()=>{ended=true;}};
  const model=name=>({deleteMany:async(filter,options)=>{calls.push({name,filter,options});}});
  const models={Account:{deleteOne:async(filter,options)=>{calls.push({name:'Account',filter,options});return {deletedCount:1};}},Entry:model('Entry'),Subcategory:model('Subcategory'),Category:model('Category')};
  await deleteAccount('owner',true,{startSession:async()=>session},models);
  assert.deepEqual(calls.map(call=>[call.name,call.filter]),[['Account',{_id:'owner'}],['Entry',{user:'owner'}],['Subcategory',{user:'owner'}],['Category',{user:'owner'}]]);
  assert.ok(calls.every(call=>call.options.session===session));
  assert.equal(ended,true);
});
test('a missing account stops deletion and transaction resources close on failure', async () => {
  let ended=false;
  const session={withTransaction:async action=>action(),endSession:async()=>{ended=true;}};
  await assert.rejects(deleteAccount('owner',true,{startSession:async()=>session},{Account:{deleteOne:async()=>({deletedCount:0})}}),error=>error.status===404);
  assert.equal(ended,true);
  ended=false;
  await assert.rejects(deleteAccount('owner',true,{startSession:async()=>session},{Account:{deleteOne:async()=>({deletedCount:1})},Entry:{deleteMany:async()=>{throw new Error('database failure');}}}),/database failure/);
  assert.equal(ended,true);
});
