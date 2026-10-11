const $=id=>document.getElementById(id),reports=new Map();
const fmt=n=>n.toLocaleString('en-US',{maximumFractionDigits:4});
export function parseReport(text,name){
  const doc=new DOMParser().parseFromString(text,'text/html');
  const title=doc.body.textContent.match(/TOU Daily Summary\s*:\s*([^\r\n]+)/i)?.[1]?.trim()||name;
  const period=doc.body.textContent.match(/For\s+([A-Za-z]{3})\s+(\d{4})/i);
  if(!period)throw Error('ไม่พบเดือนและปีของรายงาน');
  const month=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(period[1].toLowerCase());
  if(month<0)throw Error('เดือนไม่ถูกต้อง');
  const rows=[];let total=null;
  for(const tr of doc.querySelectorAll('tr')){
    const cells=[...tr.children].map(c=>c.textContent.replace(/\u00a0/g,' ').trim());
    if(cells.length!==8||!(/^(\d{2})\s/.test(cells[0])||/^TOTAL$/i.test(cells[0])))continue;
    const values=cells.slice(1).map(v=>v==='—'||v==='-'||v===''?null:Number(v.replaceAll(',','')));
    if(values.some(v=>v!==null&&(!Number.isFinite(v)||v<0)))throw Error('พบค่าตัวเลขที่ไม่ถูกต้อง');
    if(/^TOTAL$/i.test(cells[0])){if(total)throw Error('พบ TOTAL ซ้ำ');total=values;continue;}
    const day=Number(cells[0].slice(0,2)),date=new Date(Date.UTC(+period[2],month,day));
    if(date.getUTCMonth()!==month||rows.some(r=>r.day===day))throw Error('วันที่ไม่ถูกต้องหรือซ้ำ');
    rows.push({day,label:cells[0],date:date.toISOString().slice(0,10),values});
  }
  if(!rows.length||!total)throw Error('ไม่พบตาราง TOU รายวันและ TOTAL ตามรูปแบบตัวอย่าง');
  return {name,title,period:period[1]+' '+period[2],rows:rows.sort((a,b)=>a.day-b.day),total};
}
function drawBars(id,rows,demand){
  const colors=['#26795c','#c99e36','#4e81b9'],names=['OffPeak','OnPeak','Holiday'];
  const width=Math.max(900,rows.length*32+90),height=310,left=65,top=20,plotH=235,plotW=width-left-20;
  const maximum=Math.max(1,...rows.map(r=>r.values.slice(demand?4:0,demand?7:3).reduce((s,v)=>s+(v??0),0)))*1.1;
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox',`0 0 ${width} ${height}`);svg.style.minWidth=width+'px';svg.setAttribute('role','img');svg.setAttribute('aria-label',demand?'Demand รายวัน แท่งสะสม OffPeak OnPeak Holiday':'Energy รายวัน แท่งสะสม OffPeak OnPeak Holiday');
  const node=(tag,attrs,text)=>{const n=document.createElementNS(svg.namespaceURI,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;return n;};
  for(let j=0;j<=4;j++){const y=top+plotH-j*plotH/4;svg.append(node('line',{x1:left,x2:width-20,y1:y,y2:y,stroke:'#e1e7df'}));svg.append(node('text',{x:left-9,y:y+4,'text-anchor':'end',fill:'#65776f','font-size':11},fmt(maximum*j/4)));}
  const slot=plotW/rows.length;
  rows.forEach((r,j)=>{let base=0;for(let i=0;i<3;i++){const value=r.values[demand?i+4:i];if(value===null)continue;const h=value/maximum*plotH;const w=slot-9;const x=left+j*slot+4;const rect=node('rect',{x,y:top+plotH-h-base,width:Math.max(1,w-1),height:h,fill:colors[i],rx:1});rect.append(node('title',{},`${r.label} · ${names[i]}: ${fmt(value)} ${demand?'kW':'kWh'}`));svg.append(rect);base+=h;}
    svg.append(node('text',{x:left+j*slot+slot/2,y:top+plotH+19,'text-anchor':'middle',fill:'#65776f','font-size':11},String(r.day).padStart(2,'0')));
  });
  svg.append(node('text',{x:left+plotW/2,y:height-8,'text-anchor':'middle',fill:'#65776f','font-size':12},'วันที่'));$(id).append(svg);
}
function render(){
  const report=reports.get($('reportSelect').value);$('reportBody').replaceChildren();$('energyBars').replaceChildren();$('demandBars').replaceChildren();
  $('reportName').textContent=report?`${report.title} · ${report.period}`:'เลือกไฟล์รายงานเพื่อเริ่มต้น';
  $('htmlEnergy').textContent=report&&report.total[3]!==null?fmt(report.total[3]):'—';
  $('htmlDemand').textContent=report?fmt(Math.max(...report.total.slice(4).filter(v=>v!==null))):'—';
  $('htmlDays').textContent=report?report.rows.length:'0';$('htmlExport').disabled=!report;
  if(!report)return;
  for(const row of [...report.rows,{label:'TOTAL',values:report.total}]){
    const tr=document.createElement('tr');if(row.label==='TOTAL')tr.className='total';
    for(const v of [row.label,...row.values]){const td=document.createElement('td');td.textContent=v===null?'—':typeof v==='number'?fmt(v):v;tr.append(td);}$('reportBody').append(tr);
  }
  drawBars('energyBars',report.rows,false);
  drawBars('demandBars',report.rows,true);
}
async function load(files){const messages=[];for(const file of files){try{if(!/\.html?$/i.test(file.name))throw Error('เลือกไฟล์ .html หรือ .htm');const bytes=await file.arrayBuffer();let text=new TextDecoder('utf-8').decode(bytes);if(/charset\s*=\s*["']?windows-874/i.test(text))text=new TextDecoder('windows-874').decode(bytes);const r=parseReport(text,file.name);reports.set(file.name,r);messages.push('✓ '+file.name);}catch(e){messages.push('✕ '+file.name+': '+e.message);}}
  $('htmlMessage').textContent=messages.join('\n');const old=$('reportSelect').value;$('reportSelect').replaceChildren();for(const name of reports.keys())$('reportSelect').add(new Option(name,name));$('reportSelect').value=reports.has(old)?old:[...reports.keys()].at(-1)||'';render();
}
$('htmlFiles').onchange=e=>{load(e.target.files);e.target.value='';};$('reportSelect').onchange=render;
for(const event of ['dragenter','dragover'])$('htmlDrop').addEventListener(event,e=>{e.preventDefault();$('htmlDrop').classList.add('over');});
for(const event of ['dragleave','drop'])$('htmlDrop').addEventListener(event,e=>{e.preventDefault();$('htmlDrop').classList.remove('over');if(event==='drop')load(e.dataTransfer.files);});
$('htmlClear').onclick=()=>{reports.clear();$('reportSelect').replaceChildren();$('htmlMessage').textContent='';render();};
$('htmlExport').onclick=()=>{const r=reports.get($('reportSelect').value);if(!r)return;const rows=[['Date','Energy OffPeak (kWh)','Energy OnPeak (kWh)','Energy Holiday (kWh)','Energy Total (kWh)','Demand OffPeak (kW)','Demand OnPeak (kW)','Demand Holiday (kW)'],...r.rows.map(d=>[d.date,...d.values]),['TOTAL',...r.total]];const csv='\ufeff'+rows.map(row=>row.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=r.name.replace(/\.html?$/i,'')+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
render();
