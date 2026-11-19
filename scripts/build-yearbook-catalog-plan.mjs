import fs from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import genres from '../src/utils/genreCatalog.cjs';
import {annualReleaseIdentity} from '../src/utils/annualYearbook.mjs';
import {GRAMMY_CATEGORIES} from '../src/data/grammys2027.mjs';
const dir=new URL('../outputs/yearbook-catalog/',import.meta.url),file=n=>new URL(n,dir);
const source=JSON.parse(await fs.readFile(file('source.json'),'utf8')),resolved=JSON.parse(await fs.readFile(file('resolved.json'),'utf8'));
const categories=new Map(GRAMMY_CATEGORIES.map(c=>[c.id,c]));
const byId=new Map(source.albums.map(a=>[a.id,a])),byIdentity=new Map(source.albums.map(a=>[annualReleaseIdentity(a),a]));
const imageKey=url=>String(url||'').replace(/https:\/\/[^/]+/,'').replace(/\/\d+x\d+[^/]*$/,'');
const titleKey=s=>String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const originalImage=r=>source.nominees.find(n=>r.nomineeIds.includes(n.id))?.image_url||r.image;
const relevant=r=>r.annualId||r.nomineeIds.some(id=>{const n=source.nominees.find(n=>n.id===id),c=categories.get(n?.category_id);return c?.kind!=='person'&&c?.id!=='best-music-film';});
const rows=Object.values(resolved).filter(r=>r.complete&&relevant(r)),works=new Map(),links=[],updates=new Map(),annual=[];
let previous={};try{previous=JSON.parse(await fs.readFile(file('plan.json'),'utf8'));}catch{}
for(const r of rows){
 let existing=byId.get(r.existingId),canonical=resolved[r.canonicalIdentity]||r;
 if(!existing&&r.nomineeIds.length){const peers=rows.filter(a=>titleKey(a.title)===titleKey(r.title)&&imageKey(originalImage(a))===imageKey(originalImage(r)));canonical=peers.find(a=>a.canonicalArtist)||peers.find(a=>a.evidence.some(e=>e.artist))||canonical;existing=peers.map(a=>byId.get(a.existingId)).find(Boolean);}
 const verified=canonical.evidence.find(e=>e.artist&&titleKey(e.title||'')===titleKey(canonical.title));
 const artist=canonical.canonicalArtist||verified?.artist||canonical.artist;
 const identity=annualReleaseIdentity({title:canonical.title,artist});existing=existing||byIdentity.get(identity);
 const id=existing?.id||works.get(identity)?.id||previous.works?.find(w=>w.identity===identity)?.id||randomUUID();
 const gs=genres.normalizeGenres([...(canonical.genres||[]),...r.genres]);if(!gs.length)throw new Error('Missing genre '+r.title);
 if(!existing&&!works.has(identity)){
  if(canonical.title.length>255||artist.length>255)throw new Error('Credits need review: '+canonical.title);
  works.set(identity,{identity,id,album_name:canonical.title,artist_name:artist,image_url:canonical.image,genres:gs,tracks:canonical.tracks||[],total_tracks:canonical.tracks?.length||null,release_date:canonical.releaseDate||null,release_year:canonical.releaseDate?Number(canonical.releaseDate.slice(0,4)):null,release_type:canonical.type==='ep'?'EP':canonical.type==='single'?'SENCILLO':canonical.type==='compilation'?'COMPILACION':'ALBUM',spotify_link:canonical.links.spotify||null,apple_music_link:canonical.links.apple||null,other_link:canonical.links.deezer||canonical.links.other||null,mbid:canonical.mbid||null,reviews_enabled:!canonical.releaseDate||canonical.releaseDate<='2026-11-19'});
 }
 if(existing&&annualReleaseIdentity(existing)===annualReleaseIdentity(r))updates.set(id,{id,image_url:r.image,genres:genres.normalizeGenres([...(existing.genres||[]),...r.genres])});
 for(const nomineeId of r.nomineeIds){const n=source.nominees.find(n=>n.id===nomineeId);if(!n.album_id)links.push({nomineeId,albumId:id});}
 if(r.annualId)annual.push({annualId:r.annualId,albumId:id,genres:gs,imageSource:r.image,evidence:r.evidence});
}
const plan={works:[...works.values()],updates:[...updates.values()],links,annual,pending:Object.values(resolved).filter(r=>!r.complete&&relevant(r)).map(r=>({title:r.title,artist:r.artist,annualId:r.annualId}))};
await fs.writeFile(file('plan.json'),JSON.stringify(plan,null,2));console.log({newReleases:plan.works.length,updatedCovers:plan.updates.length,nomineeLinks:plan.links.length,annual:plan.annual.length,pending:plan.pending});
