import fs from 'node:fs/promises';
import sharp from 'sharp';
import {fileURLToPath} from 'node:url';
const file=new URL('../src/server/annual2026Covers.json',import.meta.url),covers=JSON.parse(await fs.readFile(file,'utf8'));
const dir=new URL('../public/annual/2026/covers/',import.meta.url);await fs.mkdir(dir,{recursive:true});
for(const [id,entry] of Object.entries(covers)){
  const source=entry.sourceCover||entry.cover;
  if(!source?.startsWith('https://i.scdn.co/image/'))continue;
  const response=await fetch(source,{signal:AbortSignal.timeout(15000)});if(!response.ok)throw new Error(`Cover unavailable: ${id}`);
  await sharp(Buffer.from(await response.arrayBuffer())).resize(640,640,{fit:'cover',withoutEnlargement:true}).webp({quality:86}).toFile(fileURLToPath(new URL(`${id}.webp`,dir)));
  entry.sourceCover=source;entry.cover=`/annual/2026/covers/${id}.webp`;console.log(id,'cached');
}
await fs.writeFile(file,JSON.stringify(covers,null,2)+'\n');
