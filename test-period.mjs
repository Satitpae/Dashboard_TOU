import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseTou,periodFromFilename} from './parser.mjs';
import {dailyTou} from './tou.mjs';
assert.equal(periodFromFilename('D2CSep26.tou').key,'2026-09');
assert.equal(periodFromFilename('DeviceoCT26.TOU').key,'2026-10');
assert.equal(periodFromFilename('AnyFeb28.tou').end,'2028-02-29');
assert.equal(periodFromFilename('AnyFeb27.tou').end,'2027-02-28');
assert.equal(periodFromFilename('D2CSep26.tou').device,'D2C');
assert.throws(()=>periodFromFilename('Device.tou'));
const b=readFileSync(new URL('./demo.js',import.meta.url),'utf8');
const buffer=Uint8Array.from(Buffer.from(/"([^"]+)"/.exec(b)[1],'base64')).buffer;
const sep=parseTou(buffer,'DeviceSep26.tou'),oct=parseTou(buffer,'DeviceOct26.tou');
assert.equal(sep.rows.length,2880);assert.equal(oct.rows.length,2976);
assert.equal(oct.rows[0].date,'2026-10-01');
assert.equal(oct.updated,'2026-09-01 00:00:00'); // Header remains metadata, not the month source.
assert.equal(dailyTou(oct)[12].holiday,true); // October 13 official TOU holiday.
assert.equal(dailyTou(sep)[12].holiday,true); // September 13 Sunday.
assert.equal(dailyTou(oct)[1].holiday,false); // October 2 weekday.
assert.equal(dailyTou(sep)[1].holiday,false);
console.log('PASS: filename month/year, case, leap years, header mismatch, month length, TOU dates.');

