import test from 'node:test';
import assert from 'node:assert/strict';
import {yearRange} from '../src/validation.js';
test('annual range includes January through December and rejects invalid years',()=>{
 assert.deepEqual(yearRange('2026'),{from:'2026-01-01',to:'2026-12-31'});
 for(const year of [undefined,'2026-01','1999','2101','2026x',2026])assert.throws(()=>yearRange(year));
 const currentYear=new Intl.DateTimeFormat('en',{timeZone:'Europe/Rome',year:'numeric'}).format(new Date());
 assert.equal(yearRange('2000').from,'2000-01-01');assert.equal(yearRange(currentYear).to,currentYear+'-12-31');assert.throws(()=>yearRange(String(Number(currentYear)+1)));
});
