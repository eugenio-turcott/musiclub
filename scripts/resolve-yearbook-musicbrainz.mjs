import fs from 'node:fs/promises';
import genres from '../src/utils/genreCatalog.cjs';
const path=new URL('../outputs/yearbook-catalog/resolved.json',import.meta.url),rows=JSON.parse(await fs.readFile(path,'utf8'));
const fold=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
async function mb(resource){await new Promise(r=>setTimeout(r,1100));const response=await fetch('https://musicbrainz.org/ws/2/'+resource,{headers:{'User-Agent':'Musiclub/12.2.1 (https://www.musiclub.org/contacto)','Accept':'application/json'},signal:AbortSignal.timeout(18000)});if(!response.ok)throw new Error('MusicBrainz '+response.status);return response.json();}
for(const r of Object.values(rows).filter(r=>r.annualId&&!r.complete))try{
 const data=await mb('release-group?'+new URLSearchParams({query:`releasegroup:"${r.title.replace(/"/g,'')}" AND artist:"${r.artist.split(/,| & /)[0]}"`,limit:'5',fmt:'json'}));
 const group=data['release-groups']?.find(g=>fold(g.title)===fold(r.title)&&g['artist-credit']?.some(a=>fold(r.artist).includes(fold(a.name))));if(!group){console.log('pending',r.title);continue;}
 const g=await mb('release-group/'+group.id+'?inc=genres+url-rels&fmt=json');
 r.genres=genres.normalizeGenres([...r.genres,...(g.genres||[]).map(a=>a.name)]);
 const cover=await fetch('https://coverartarchive.org/release-group/'+group.id,{signal:AbortSignal.timeout(15000)});if(cover.ok){const j=await cover.json();r.image=(j.images?.find(i=>i.front)||j.images?.[0])?.image||r.image;}
 if(!r.genres.length){const a=await mb('artist/'+group['artist-credit'][0].artist.id+'?inc=genres&fmt=json');r.genres=genres.normalizeGenres((a.genres||[]).map(g=>g.name));}
 r.evidence.push({provider:'MusicBrainz',id:group.id,title:g.title,artist:group['artist-credit'].map(a=>a.name).join(', ')});r.mbid=group.id;r.complete=Boolean(r.image&&r.genres.length);console.log(r.complete?'verified':'pending',r.title);
 await fs.writeFile(path,JSON.stringify(rows,null,2));
}catch(e){console.log('pending',r.title,e.message);}
