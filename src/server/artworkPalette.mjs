import jpeg from 'jpeg-js';
import {decode,convertIndexedToRgb} from 'fast-png';
import pixels from '../utils/artworkPalette.cjs';

export function decodePalette(bytes){
 let image;
 if(bytes[0]===255&&bytes[1]===216)image=jpeg.decode(bytes,{useTArray:true,maxResolutionInMP:4,maxMemoryUsageInMB:64});
 else if(bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71){
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);if(bytes.length<24||view.getUint32(16)*view.getUint32(20)>4000000)throw Error('Image resolution limit');
  image=decode(bytes);
  if(image.palette)image={...image,data:convertIndexedToRgb(image),channels:image.palette[0].length,depth:8};
 }else throw Error('Unsupported artwork format');
 return pixels.paletteFromPixels(image.data,{...image,channels:image.channels||4});
}
export async function imagePalette(url,{fetcher=fetch}={}){
 let safe=pixels.permittedArtworkURL(url);if(!safe)throw Error('Unsupported artwork host');
 // Decode a small official thumbnail where the provider supports it.
 if(safe.hostname.endsWith('mzstatic.com'))safe.pathname=safe.pathname.replace(/\d+x\d+bb/, '128x128bb');
 if(safe.hostname.endsWith('dzcdn.net'))safe.pathname=safe.pathname.replace(/\d+x\d+-/, '128x128-');
 let response;
 for(let hop=0;hop<4;hop++){
  response=await fetcher(safe,{redirect:'manual',signal:AbortSignal.timeout(8000),headers:{Accept:'image/jpeg,image/png;q=0.9'}});
  if(response.status<300||response.status>=400)break;
  safe=pixels.permittedArtworkURL(new URL(response.headers.get('location')||'',safe).href);if(!safe)throw Error('Unsupported artwork redirect');
 }
 if(!response.ok)throw Error('Artwork unavailable');
 const reader=response.body.getReader(),chunks=[];let size=0;
 try{for(;;){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>8000000)throw Error('Image size limit');chunks.push(value);}}finally{await reader.cancel();}
 const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
 return decodePalette(bytes);
}
const pending=new Map();
export async function ensureArtworkPalette(db,entity,id,{extract=imagePalette}={}){
 const table=entity==='artist'?'artist_discographies':'albums',key=entity==='artist'?'slug':'id';
 const {data:row,error}=await db.from(table).select(entity==='artist'?'slug,image_url:profile->artist->>image,dominant_colors,palette_image_url':'id,image_url,dominant_colors,palette_image_url').eq(key,id).maybeSingle();
 if(error||!row)throw Error('Artwork not found');
 if(!row.image_url)return {colors:[],image_url:null};
 if(row.palette_image_url===row.image_url&&row.dominant_colors?.length)return {colors:row.dominant_colors,image_url:row.image_url};
 const token=`${table}:${id}:${row.image_url}`;
 if(!pending.has(token))pending.set(token,(async()=>{
  const colors=await extract(row.image_url);if(!colors.length)throw Error('No visible artwork colors');
  const result=await db.from(table).update({dominant_colors:colors,palette_image_url:row.image_url}).eq(key,id).eq(entity==='artist'?'profile->artist->>image':'image_url',row.image_url).select(key);
  if(result.error)throw Error('Palette could not be saved');
  if(!result.data?.length)throw Error('Artwork changed during analysis');
  return {colors,image_url:row.image_url,changed:true};
 })().finally(()=>pending.delete(token)));
 return pending.get(token);
}
