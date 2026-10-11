export function fixtureTou() {
  const bytes=new Uint8Array(64+3072*16),view=new DataView(bytes.buffer);
  bytes.set(new TextEncoder().encode('TOUReg\0\0'));view.setUint16(8,64,true);
  bytes.set(new TextEncoder().encode('01/09/202600:00:00'),10);
  for(let i=0;i<3072;i++){view.setFloat64(64+i*16,40+i%20,true);view.setFloat64(72+i*16,100000+i*10,true);}
  return bytes;
}
