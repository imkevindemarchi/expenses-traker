import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { changePassword, passwordChangeInput } from '../src/password.js';

const input = { currentPassword: 'old-password-123', newPassword: 'new-password-456', confirmPassword: 'new-password-456' };
test('password changes validate confirmation, length, bcrypt byte limit and current password', () => {
  assert.deepEqual(passwordChangeInput(input), { currentPassword: input.currentPassword, newPassword: input.newPassword });
  for (const patch of [{currentPassword:''},{currentPassword:123},{newPassword:'short'},{newPassword:'é'.repeat(37)},{confirmPassword:'different'},{newPassword:input.currentPassword,confirmPassword:input.currentPassword}]) {
    assert.throws(()=>passwordChangeInput({...input,...patch}),error=>error.status===400);
  }
});
test('password change checks the old hash, stores a new hash and invalidates earlier sessions', async () => {
  const account = { _id:'account', sessionVersion:3, passwordHash:await bcrypt.hash(input.currentPassword,4) };
  let mutation;
  const accounts = {
    findById:()=>({select:async()=>account}),
    findOneAndUpdate:async(filter,update)=>{mutation={filter,update};return {...account,passwordHash:update.$set.passwordHash,sessionVersion:4};},
  };
  const result = await changePassword('account',input,accounts);
  assert.equal(await bcrypt.compare(input.newPassword,result.passwordHash),true);
  assert.equal(await bcrypt.compare(input.currentPassword,result.passwordHash),false);
  assert.equal(result.sessionVersion,4);
  assert.deepEqual(mutation.filter,{_id:'account',passwordHash:account.passwordHash,sessionVersion:3});
  assert.deepEqual(mutation.update.$inc,{sessionVersion:1});
  mutation=undefined;
  await assert.rejects(changePassword('account',{...input,currentPassword:'incorrect-password'},accounts),error=>error.status===400);
  assert.equal(mutation,undefined);
  await assert.rejects(changePassword('account',input,{...accounts,findOneAndUpdate:async()=>null}),error=>error.status===409);
});
