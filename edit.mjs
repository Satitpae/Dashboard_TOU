export function prepareEditing(dataset){
  for(const row of dataset.allRows)row.original={demand:row.demand,energy:row.energy};
  return dataset;
}
export function isEdited(row){return row.demand!==row.original.demand||row.energy!==row.original.energy;}
export function recalculateRows(dataset){
  let previous=null;
  for(const row of dataset.allRows){
    row.zero=row.demand===0&&row.energy===0;row.delta=null;
    row.status=row.zero?'zero':'value';
    if(!row.zero){
      if(previous&&!previous.zero){if(row.energy>=previous.energy)row.delta=row.energy-previous.energy;else row.status='decreased';}
      else row.status=previous?'after_gap':'baseline';
    }
    previous=row;
  }
}
export function editReading(dataset,index,field,value){
  if(!['demand','energy'].includes(field))throw Error('แก้ไขได้เฉพาะ Demand และ Energy');
  if(String(value).trim()==='')throw Error('กรุณาใส่ตัวเลข ไม่เว้นว่าง');
  const numeric=Number(value);
  if(!Number.isFinite(numeric)||numeric<0)throw Error('ค่าต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป');
  const row=dataset.allRows.find(r=>r.index===index);
  if(!row)throw Error('ไม่พบแถวข้อมูล');
  row[field]=numeric;recalculateRows(dataset);
}
export function restoreRows(dataset,indexes){
  const selected=new Set(indexes);
  for(const row of dataset.allRows)if(selected.has(row.index)){row.demand=row.original.demand;row.energy=row.original.energy;}
  recalculateRows(dataset);
}
