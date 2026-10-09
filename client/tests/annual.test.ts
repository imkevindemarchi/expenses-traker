import test from 'node:test';
import assert from 'node:assert/strict';
import {annualMonths} from '../src/utils/annual.ts';
test('annual trend fills all twelve months and isolates the selected year',()=>{
 const months=annualMonths('2026',[{_id:{month:'2026-02',kind:'income'},total:300},{_id:{month:'2026-02',kind:'income'},total:200},{_id:{month:'2026-02',kind:'expense'},total:75},{_id:{month:'2025-02',kind:'expense'},total:900}]);
 assert.equal(months.length,12);assert.deepEqual(months[1],{month:'2026-02',income:500,expense:75});assert.deepEqual(months[11],{month:'2026-12',income:0,expense:0});
});
