import assert from 'node:assert/strict';
import {dailyTou} from './tou.mjs';
// Missing 22:00 register: the source report splits at the last actual reading
// before the boundary, never at the first reading after the outage.
const start=Date.UTC(2026,9,15);
const rows=Array.from({length:97},(_,i)=>({index:i,date:new Date(start+i*900000).toISOString().slice(0,10),time:new Date(start+i*900000).toISOString().slice(11,16),energy:1000+i,demand:1,zero:false}));
for(let i=85;i<=90;i++){rows[i].energy=0;rows[i].zero=true;rows[i].demand=0;}
const result=dailyTou({name:'test',rows:rows.slice(0,96),allRows:rows})[0];
assert.deepEqual(result.energy,[47,48,0,95]);
assert.match(result.status,/21:00/);
rows[0].energy=0;
assert.equal(dailyTou({name:'test',rows:rows.slice(0,96),allRows:rows},{firstDayQuarter:false})[0].energy[3],null,'Missing midnight must stay unknown');
console.log('PASS: missing TOU boundary uses preceding register; missing midnight stays unknown.');
