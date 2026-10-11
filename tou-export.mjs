export function exportTou(dataset){
  if(!dataset.sourceBuffer)throw Error('ไม่พบไฟล์ต้นฉบับ');
  const buffer=dataset.sourceBuffer.slice(0),view=new DataView(buffer);
  // Patch only edited fields so headers, spare rows and unchanged bytes stay intact.
  for(const row of dataset.allRows){
    for(const [field,offset]of [['demand',64],['energy',72]]){
      if(row.original&&row[field]!==row.original[field]){
        if(!Number.isFinite(row[field])||row[field]<0)throw Error('ข้อมูล Demand / Energy ไม่ถูกต้อง');
        view.setFloat64(offset+row.index*16,row[field],true);
      }
    }
  }
  return new Uint8Array(buffer);
}
