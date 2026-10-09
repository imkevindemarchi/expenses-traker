import test from 'node:test';
import assert from 'node:assert/strict';
import { saveAccountSettings } from '../src/account-settings.js';
import { profileInput } from '../src/profile.js';
import { publicAccount } from '../src/auth.js';

test('optional names are trimmed, validated and available on legacy and updated profiles',()=>{
  assert.deepEqual(profileInput({name:' Kevin ',surname:' Rossi '}),{name:'Kevin',surname:'Rossi'});
  assert.deepEqual(profileInput({name:'',surname:''}),{name:'',surname:''});
  for(const input of [{name:123,surname:''},{name:'',surname:'x'.repeat(61)},{name:'Kevin'}])assert.throws(()=>profileInput(input));
  assert.equal(publicAccount({_id:'owner',name:'Kevin',email:'k@example.test'}).surname,'');
  assert.equal(publicAccount({_id:'owner',name:'Kevin',surname:'Rossi',email:'k@example.test'}).surname,'Rossi');
});

test('general save updates profile and budget together without changing an untouched password',async()=>{
  let mutation;
  const account={_id:'owner',name:'Kevin',surname:'Rossi'};
  const accounts={findOneAndUpdate:async(filter,update)=>{mutation={filter,update};return account;}};
  const result=await saveAccountSettings('owner',{name:' Kevin ',surname:' Rossi ',currency:'EUR',monthlyBudget:'120,50'},accounts);
  assert.equal(result.passwordChanged,false);
  assert.deepEqual(mutation,{filter:{_id:'owner'},update:{$set:{name:'Kevin',surname:'Rossi',currency:'EUR',monthlyBudgetCents:12050}}});
});

test('password validation failures prevent every change in the general settings save',async()=>{
  let updates=0;
  const accounts={findById:()=>({select:async()=>({passwordHash:'old-hash',sessionVersion:2})}),findOneAndUpdate:async()=>{updates++;}};
  const body={name:'Kevin',surname:'Rossi',currency:'EUR',monthlyBudget:'100',passwordChange:{currentPassword:'old-password-123',newPassword:'new-password-456',confirmPassword:'new-password-456'}};
  await assert.rejects(saveAccountSettings('owner',{...body,passwordChange:{...body.passwordChange,confirmPassword:'mismatch'}},accounts),error=>error.status===400);
  await assert.rejects(saveAccountSettings('owner',body,accounts,{compare:async()=>false}),error=>error.status===400);
  assert.equal(updates,0);
});

test('general save changes settings and password in one guarded write and rotates sessions',async()=>{
  let mutation;
  const accounts={findById:()=>({select:async()=>({passwordHash:'old-hash',sessionVersion:2})}),findOneAndUpdate:async(filter,update)=>{mutation={filter,update};return {_id:'owner',sessionVersion:3};}};
  const body={name:'Kevin',surname:'Rossi',currency:'USD',monthlyBudget:'',passwordChange:{currentPassword:'old-password-123',newPassword:'new-password-456',confirmPassword:'new-password-456'}};
  const result=await saveAccountSettings('owner',body,accounts,{compare:async()=>true,hash:async(value,cost)=>{assert.equal(value,body.passwordChange.newPassword);assert.equal(cost,12);return 'new-hash';}});
  assert.equal(result.passwordChanged,true);
  assert.deepEqual(mutation,{filter:{_id:'owner',passwordHash:'old-hash',sessionVersion:2},update:{$set:{name:'Kevin',surname:'Rossi',currency:'USD',monthlyBudgetCents:null,passwordHash:'new-hash'},$inc:{sessionVersion:1}}});
});
