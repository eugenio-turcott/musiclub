import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import sharp from 'sharp';
import catalog from '../src/utils/genreCatalog.cjs';
import artwork from '../src/utils/genreEmailArtwork.cjs';
import files from '../src/utils/genreAssetFiles.cjs';

const require=createRequire(import.meta.url);
const sources=new Set();
function collectSources(filename) {
  if(sources.has(filename))return;
  sources.add(filename);
  for(const child of require.cache[filename]?.children || [])collectSources(child.filename);
}
collectSources(require.resolve('../src/utils/genreEmailArtwork.cjs'));
collectSources(require.resolve('../src/utils/genreAssetFiles.cjs'));
const hash = createHash('sha256');
for (const source of [...sources].sort()) {
  hash.update(path.relative(process.cwd(),source).replaceAll('\\','/'));
  hash.update(await fs.readFile(source));
}
const fingerprint = hash.digest('hex');
const directory = path.resolve('public/genre-vinyl/v5');
await fs.mkdir(directory, {recursive:true});
let current;
try {current = JSON.parse(await fs.readFile(path.join(directory,'manifest.json'),'utf8'));} catch {}
const existing=new Set(await fs.readdir(directory));
const complete=catalog.GENRES.every(genre=>existing.has(path.basename(files.genreAssetPath(genre.id))));
if (complete && current?.fingerprint===fingerprint && current.count===catalog.GENRES.length) {
  console.log(`Genre PNGs ready (${current.count}).`);
} else {
  let index=0;
  await Promise.all(Array.from({length:4},async()=>{
    while(index<catalog.GENRES.length) {
      const genre=catalog.GENRES[index++];
      const svg=artwork.genreEmailSvg(genre.id);
      if(!svg)throw new Error(`Missing genre artwork: ${genre.id}`);
      const filename=path.resolve('public',`.${files.genreAssetPath(genre.id)}`);
      const output=await sharp(Buffer.from(svg)).resize(560,560).png().toBuffer();
      const temporary=`${filename}.${process.pid}.tmp`;
      await fs.writeFile(temporary,output);
      await fs.rename(temporary,filename);
    }
  }));
  await fs.writeFile(path.join(directory,'manifest.json'),JSON.stringify({fingerprint,count:catalog.GENRES.length}));
  console.log(`Generated ${catalog.GENRES.length} genre PNGs at build time.`);
}
