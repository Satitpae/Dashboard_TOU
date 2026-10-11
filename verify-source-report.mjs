import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {parseTou} from './parser.mjs';
import {dailyTou,totalTou} from './tou.mjs';
const [touPath,htmlPath,output='outputs/tou-verification/NSTDA-COOP_comparison.csv']=process.argv.slice(2);
if(!touPath||!htmlPath)throw Error('Usage: node verify-source-report.mjs file.tou report.htm [output.csv]');
const bytes=readFileSync(touPath),name=touPath.replaceAll('\\','/').split('/').at(-1);
const ds=parseTou(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),name),days=dailyTou(ds),total=totalTou(days);
const text=readFileSync(htmlPath,'latin1');
const rr=[...text.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(r=>[...r[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(c=>c[1].replace(/<[^>]*>/g,'').replace(/&nbsp;/g,' ').trim()));
const csv=[['Date','Metric','HTML','Dashboard','AbsoluteDifference']],metrics=['Energy OffPeak','Energy OnPeak','Energy Holiday','Energy Total','Demand OffPeak','Demand OnPeak','Demand Holiday'];let count=0,worst=0;
for(const row of rr){
  if(row.length!==8||(!/^\d\d/.test(row[0])&&row[0]!=='TOTAL'))continue;
  const d=row[0]==='TOTAL'?total:days[Number(row[0].slice(0,2))-1];
  const calculated=[...d.energy,...d.demand];
  for(let i=0;i<7;i++){const expected=Number(row[i+1]),actual=calculated[i],diff=actual===null?Infinity:Math.abs(actual-expected);if(!Number.isFinite(expected)||diff>0.00011)throw Error(`${row[0]} ${metrics[i]}: HTML ${expected}, Dashboard ${actual}`);csv.push([row[0],metrics[i],expected,actual,diff]);worst=Math.max(worst,diff);count++;}
}
if(count!==(days.length+1)*7)throw Error('Missing daily rows or TOTAL');
mkdirSync(output.replace(/[\\/][^\\/]+$/,''),{recursive:true});
writeFileSync(output,'\ufeff'+csv.map(row=>row.map(x=>'"'+String(x).replaceAll('"','""')+'"').join(',')).join('\r\n'),'utf8');
console.log(JSON.stringify({source:name,checkedValues:count,maxDifference:worst,energyTotal:total.energy,demandMaximum:total.demand},null,2));
