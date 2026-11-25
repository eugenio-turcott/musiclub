import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import {createClient} from '@supabase/supabase-js';
import {extractArtworkPalette,permittedArtworkURL} from './lib/artwork-palette.mjs';
dotenv.config({path:'.env.local',quiet:true});dotenv.config({path:'.env',quiet:true});
const apply=process.argv.includes('--apply');
const inputFile=process.argv.find(a=>a.startsWith('--input='))?.slice(8);
if(inputFile&&apply)throw Error('Input plans are saved for administrator review; apply through the database connection.');
const input=inputFile?JSON.parse(await fs.readFile(inputFile,'utf8')):null;
const updates=[];
const db=input?null:createClient(process.env.NEXT_PUBLIC_SUPABASE_URL||process.env.REACT_APP_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.REACT_APP_SUPABASE_SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const report={checked:0,saved:0,unchanged:0,unavailable:0,errors:[]},cache=new Map();
async function writeReport(){
 await fs.mkdir('outputs/v1230',{recursive:true});
 await fs.writeFile('outputs/v1230/palette-report.json',JSON.stringify({...report,apply},null,2));
 await fs.writeFile('outputs/v1230/palette-plan.json',JSON.stringify(updates));
}
async function palette(url){
 if(!cache.has(url))cache.set(url,(async()=>{
  let safe=permittedArtworkURL(url);if(!safe)throw Error('Unsupported artwork host');
  let response;for(let hop=0;hop<4;hop++){response=await fetch(safe,{redirect:'manual',signal:AbortSignal.timeout(12000)});if(response.status<300||response.status>=400)break;safe=permittedArtworkURL(new URL(response.headers.get('location')||'',safe).href);if(!safe)throw Error('Unsupported artwork redirect');}
  if(!response.ok||!response.headers.get('content-type')?.startsWith('image/'))throw Error('Artwork unavailable');
  const data=Buffer.from(await response.arrayBuffer());if(data.length>12000000)throw Error('Artwork too large');
  return extractArtworkPalette(data);
 })());
 return cache.get(url);
}
for(const table of ['albums','artist_discographies']){
 const key=table==='albums'?'id':'slug',pageSize=table==='albums'?200:50;
 for(let offset=0;;offset+=pageSize){
  const {data,error}=input?{data:(table==='albums'?input.albums:input.artists).slice(offset,offset+pageSize)}:await db.from(table).select(table==='albums'?'id,image_url,dominant_colors,palette_image_url':'slug,image_url:profile->artist->>image,dominant_colors,palette_image_url').order(key).range(offset,offset+pageSize-1);if(error){report.errors.push({table,offset,reason:error.message});await writeReport();throw Error(`Cannot read ${table}: ${error.message}`);}
  let next=0;
  await Promise.all(Array.from({length:6},async()=>{while(next<data.length){const row=data[next++],url=row.image_url||row.profile?.artist?.image;if(!url)continue;report.checked++;
   if(row.palette_image_url===url&&row.dominant_colors?.length){report.unchanged++;continue;}
   try{const colors=await palette(url);if(!colors.length)throw Error('No visible colors');
    if(apply){const result=await db.from(table).update({dominant_colors:colors,palette_image_url:url}).eq(key,row[key]).eq(table==='albums'?'image_url':'profile->artist->>image',url);if(result.error)throw Error('Cannot save palette');}
    updates.push({table,id:row[key],image_url:url,colors});report.saved++;
   }catch(error){report.unavailable++;report.errors.push({table,id:row[key],reason:error.message});}
  }}));
  await writeReport();console.log(JSON.stringify({table,offset,checked:report.checked,saved:report.saved,unavailable:report.unavailable}));if(data.length<pageSize)break;
 }
}
await writeReport();
console.log(JSON.stringify({checked:report.checked,saved:report.saved,unavailable:report.unavailable}));
