import {readFile,writeFile} from 'node:fs/promises';
import catalog from '../src/utils/genreCatalog.cjs';
const source='https://itunes.apple.com/WebObjects/MZStoreServices.woa/ws/genres?id=34';
const data=process.argv.includes('--offline')?JSON.parse((await readFile('outputs/apple-music-genre-taxonomy.json','utf8')).replace(/^\uFEFF/,'')):await (await fetch(source,{signal:AbortSignal.timeout(15000)})).json();
const apple={};
function walk(nodes,parents=[]){for(const node of Object.values(nodes)){
 if(node.id!=='34'){
  const direct=catalog.normalizeGenres([node.name]);
  const genres=direct.length?direct:parents.flatMap(parent=>catalog.normalizeGenres([parent])).slice(0,1);
  if(!genres.length)throw new Error(`Unmapped Apple category ${node.id}: ${node.name}`);
  apple[node.id]={name:node.name,genres};
 }
 if(node.subgenres)walk(node.subgenres,[node.name,...parents]);
}}
walk(data);
await writeFile('src/data/appleMusicGenreMap.json',JSON.stringify({source,retrieved:new Date().toISOString().slice(0,10),categories:apple},null,2)+'\n');
console.log(`Mapped ${Object.keys(apple).length} official Apple Music categories.`);
