// Some Grammy categories credit art directors, songwriters or engineers.
// Associate the nominated work with its real performer using its title AND
// artwork, rather than creating an artist entry for a technical credit.
import fs from 'node:fs/promises';
import sharp from 'sharp';
import genres from '../src/utils/genreCatalog.cjs';
const path=new URL('../outputs/yearbook-catalog/resolved.json',import.meta.url),rows=JSON.parse(await fs.readFile(path,'utf8'));
const fold=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const key=url=>String(url||'').replace(/https:\/\/[^/]+/,'').replace(/\/\d+x\d+[^/]*$/,'');
const pixels=new Map();async function fingerprint(url){if(!pixels.has(url))pixels.set(url,(async()=>{const r=await fetch(url,{signal:AbortSignal.timeout(12000)});if(!r.ok)throw new Error('cover unavailable');return sharp(Buffer.from(await r.arrayBuffer())).resize(16,16,{fit:'fill'}).removeAlpha().raw().toBuffer();})());return pixels.get(url);}
async function sameArtwork(a,b){if(key(a)===key(b))return true;try{const [x,y]=await Promise.all([fingerprint(a),fingerprint(b)]);return x.reduce((n,v,i)=>n+Math.abs(v-y[i]),0)/x.length/255<.09;}catch{return false;}}
for(const r of Object.values(rows).filter(r=>r.nomineeIds.length&&!r.complete)){
 try{
  const related=Object.values(rows).find(a=>a.complete&&a!==r&&fold(a.title)===fold(r.title)&&key(a.image)===key(r.image));
  if(related){r.genres=related.genres;r.canonicalIdentity=related.identity;r.complete=true;r.evidence.push({provider:'Same nominated work and artwork',identity:related.identity});continue;}
  const url='https://api.deezer.com/search/album?q='+encodeURIComponent(r.title);const data=await (await fetch(url)).json();
  let matched=false;
  for(const a of (data.data||[]).filter(a=>fold(a.title)===fold(r.title)).slice(0,5)){
   if(!await sameArtwork(r.image,a.cover_xl))continue;const album=await (await fetch('https://api.deezer.com/album/'+a.id)).json();r.genres=genres.normalizeGenres(album.genres?.data?.map(g=>g.name)||[]);r.canonicalArtist=album.artist.name;r.image=album.cover_xl;r.releaseDate=album.release_date;r.links.deezer=album.link;r.tracks=(album.tracks?.data||[]).map((t,i)=>({id:'deezer-'+t.id,name:t.title,duration_ms:t.duration*1000,track_number:i+1}));r.evidence.push({provider:'Deezer title and artwork match',id:album.id,title:album.title,artist:album.artist.name});matched=true;break;
  }
  if(!matched){const data=await (await fetch('https://itunes.apple.com/search?'+new URLSearchParams({term:r.title,entity:r.type==='single'?'song':'album',limit:'50'}))).json();for(const a of (data.results||[]).filter(a=>fold(a.trackName||a.collectionName)===fold(r.title)).slice(0,5)){const image=a.artworkUrl100?.replace('100x100bb','1200x1200bb');if(!image||!await sameArtwork(r.image,image))continue;r.genres=genres.normalizeGenres([a.primaryGenreName]);r.canonicalArtist=a.artistName;r.image=image;r.releaseDate=a.releaseDate?.slice(0,10);r.links.apple=a.trackViewUrl||a.collectionViewUrl;r.evidence.push({provider:'Apple title and artwork match',id:a.trackId||a.collectionId,title:a.trackName||a.collectionName,artist:a.artistName});break;}}
  r.complete=Boolean(r.genres.length&&r.image);console.log(r.complete?'verified':'pending',r.title);
 }catch(e){console.log('pending',r.title,e.message);}
 await fs.writeFile(path,JSON.stringify(rows,null,2));
}
await fs.writeFile(path,JSON.stringify(rows,null,2));
