import fs from 'node:fs/promises';
import {ANNUAL_SELECTION} from '../src/server/annual2026Selection.mjs';
const fold=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
let covers={};try{covers=JSON.parse(await fs.readFile(new URL('../src/server/annual2026Covers.json',import.meta.url),'utf8'));}catch{}
for(const release of ANNUAL_SELECTION){
  if(process.argv.includes('--missing')&&covers[release.id])continue;
  const params=new URLSearchParams({q:`${release.title.replace(/[’‘]/g,"'")} ${release.artist}`,type:'album',limit:'10',market:'MX'});
  const url=new URL('/api/spotify','https://www.musiclub.org');url.searchParams.set('path','/v1/search?'+params);
  try{
    const response=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!response.ok)throw new Error(String(response.status));
    const data=await response.json();const album=data.albums?.items?.find(a=>fold(a.name)===fold(release.title)&&fold(a.artists.map(x=>x.name).join(' '))===fold(release.artist)&&a.release_date?.startsWith('2026'));
    if(album)covers[release.id]={cover:album.images?.[0]?.url||null,spotifyUrl:album.external_urls?.spotify||null,releaseDate:album.release_date};
    console.log(release.id,album?'verified':'no exact edition');
  }catch(error){console.log(release.id,'unavailable',error.message);}
}
await fs.writeFile(new URL('../src/server/annual2026Covers.json',import.meta.url),JSON.stringify(covers,null,2)+'\n');
