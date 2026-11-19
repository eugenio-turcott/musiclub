// Resolve the annual edition and musical Grammy nominees against real catalog
// sources. This prepares a reviewable plan; writes use the authorized DB connector.
import fs from 'node:fs/promises';
import {GRAMMY_CATEGORIES} from '../src/data/grammys2027.mjs';
import snapshot from '../src/server/annual2026Global.json' with {type:'json'};
import genres from '../src/utils/genreCatalog.cjs';
import {annualReleaseIdentity} from '../src/utils/annualYearbook.mjs';
const dir=new URL('../outputs/yearbook-catalog/',import.meta.url);await fs.mkdir(dir,{recursive:true});
const file=name=>new URL(name,dir),fold=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/&amp;/g,'&').replace(/[^\p{L}\p{N}]/gu,'');
const titleKey=s=>fold(String(s).replace(/\s*\[[^\]]+\]\s*/g,' ').replace(/\s*[-–]\s*EP$/i,'').replace(/\s*\((?:Original (?:Motion Picture )?Soundtrack|From[^)]*)\)/ig,''));
const artistMatches=(expected,actual)=>{const a=fold(expected),b=fold(actual);return a===b||a.length>=4&&b.length>=4&&(a.includes(b)||b.includes(a))||String(actual).split(/,| & /).some(x=>fold(x).length>=4&&a.includes(fold(x)));};
const matches=(target,title,artist)=>titleKey(target.title)===titleKey(title)&&artistMatches(target.artist,artist);
async function get(url,options={}){const r=await fetch(url,{...options,signal:AbortSignal.timeout(18000)});if(!r.ok)throw new Error('HTTP '+r.status);return r.json();}
let spotifyNext=0,spotifyBlocked=!process.argv.includes("--spotify");
async function spotify(path){if(spotifyBlocked)throw new Error('Spotify paused');const when=Math.max(Date.now(),spotifyNext);spotifyNext=when+850;await new Promise(r=>setTimeout(r,Math.max(0,when-Date.now())));try{return await get('https://www.musiclub.org/api/spotify?path='+encodeURIComponent('/v1/'+path));}catch(e){if(e.message==='HTTP 429')spotifyBlocked=true;throw e;}}
const categories=new Map(GRAMMY_CATEGORIES.map(c=>[c.id,c]));
const {albums,nominees}=JSON.parse(await fs.readFile(file('source.json'),'utf8'));
await fs.writeFile(file('before.json'),JSON.stringify({albums,nominees},null,2));
const byId=new Map(albums.map(a=>[a.id,a])),byIdentity=new Map(albums.map(a=>[annualReleaseIdentity(a),a]));
const imageKey=url=>String(url||'').replace(/https:\/\/[^/]+/,'').replace(/\/(?:\d+x\d+[^/]*|\d+x0)\//,'/').replace(/\/\d+x\d+bb[^/]*$/,'');
const targets=new Map();
for(const r of snapshot.releases)targets.set(annualReleaseIdentity(r),{...r,nominees:[]});
for(const n of nominees){const category=categories.get(n.category_id);if(category?.kind==='person'||category?.id==='best-music-film')continue;const identity=annualReleaseIdentity(n),existing=targets.get(identity);if(existing)existing.nominees.push(n);else targets.set(identity,{title:n.title,artist:n.artist,type:category?.kind==='album'?'lp':'single',genres:genres.normalizeGenres(category?.genre?[category.genre]:[]),nominees:[n]});}
let cached={};try{cached=JSON.parse(await fs.readFile(file('resolved.json'),'utf8'));}catch{}
async function resolve(target){
 const identity=annualReleaseIdentity(target);if(cached[identity]?.complete&&!process.argv.includes('--refresh'))return cached[identity];
 const linked=target.nominees.map(n=>byId.get(n.album_id)).find(Boolean);
 const related=nominees.find(n=>n.album_id&&titleKey(n.title)===titleKey(target.title)&&(artistMatches(target.artist,n.artist)||target.nominees.some(t=>t.image_url&&imageKey(t.image_url)===imageKey(n.image_url))));
 const tracked=target.type==='single'&&albums.find(a=>artistMatches(target.artist,a.artist_name)&&(a.tracks||[]).some(t=>titleKey(t.name||t.title)===titleKey(target.title)));
 const existing=byIdentity.get(identity)||linked||byId.get(related?.album_id)||tracked;
 const result={identity,title:target.title,artist:target.artist,annualId:target.id||null,nomineeIds:target.nominees.map(n=>n.id),existingId:existing?.id||null,type:target.type,genres:genres.normalizeGenres([...(target.genres||[]),...(existing?.genres||[])]),releaseDate:target.releaseDate||existing?.release_date||null,image:existing?.image_url||target.nominees.find(n=>n.image_url)?.image_url||null,tracks:existing?.tracks||[],links:{spotify:existing?.spotify_link,apple:existing?.apple_music_link,deezer:existing?.other_link},evidence:[],complete:false};
 try{
  const data=await spotify('search?'+new URLSearchParams({q:`${target.title} ${target.artist}`,type:'album',limit:'10',market:'MX'}));
  const item=data.albums?.items?.find(a=>matches(target,a.name,a.artists.map(x=>x.name).join(', '))&&(!target.releaseDate||!a.release_date||a.release_date.slice(0,4)===target.releaseDate.slice(0,4)));
  if(item){const album=await spotify('albums/'+item.id);result.image=album.images?.[0]?.url||result.image;result.releaseDate=album.release_date||result.releaseDate;result.links.spotify=album.external_urls?.spotify;result.tracks=(album.tracks?.items||[]).map(t=>({id:t.id,name:t.name,duration_ms:t.duration_ms,track_number:t.track_number,disc_number:t.disc_number,spotify_url:t.external_urls?.spotify}));result.evidence.push({provider:'Spotify',id:album.id,title:album.name,artist:album.artists.map(a=>a.name).join(', ')});}
 }catch(e){result.spotifyError=e.message;}
 // Deezer supplies release genres, full-size artwork and an independent match.
 try{
  const data=await get('https://api.deezer.com/search/album?q='+encodeURIComponent(`album:"${target.title.replace(/"/g,'')}" artist:"${target.artist.replace(/"/g,'')}"`));
  let item=data.data?.find(a=>matches(target,a.title,a.artist?.name));
  if(!item){const broad=await get('https://api.deezer.com/search/album?q='+encodeURIComponent(target.title+' '+target.artist.split(/,| & /)[0]));item=broad.data?.find(a=>matches(target,a.title,a.artist?.name));}
  if(item){const album=await get('https://api.deezer.com/album/'+item.id);result.genres=genres.normalizeGenres([...result.genres,...(album.genres?.data||[]).map(g=>g.name)]);result.image=album.cover_xl||result.image;result.releaseDate=result.releaseDate||album.release_date;result.links.deezer=album.link;if(!result.tracks.length)result.tracks=(album.tracks?.data||[]).map(t=>({id:'deezer-'+t.id,name:t.title,duration_ms:t.duration*1000,track_number:t.track_position||null}));result.evidence.push({provider:'Deezer',id:album.id,title:album.title,artist:album.artist?.name});}
  if(!item&&target.type==='single'){const tracks=await get('https://api.deezer.com/search/track?q='+encodeURIComponent(target.title+' '+target.artist.split(/,| & /)[0]));const t=tracks.data?.find(t=>matches(target,t.title,t.artist?.name));if(t){const album=await get('https://api.deezer.com/album/'+t.album.id);result.image=t.album.cover_xl||album.cover_xl||result.image;result.genres=genres.normalizeGenres([...result.genres,...(album.genres?.data||[]).map(g=>g.name)]);result.releaseDate=result.releaseDate||album.release_date;result.links.deezer=t.link;result.tracks=[{id:'deezer-'+t.id,name:t.title,duration_ms:t.duration*1000}];result.evidence.push({provider:'Deezer track',id:t.id,title:t.title,artist:t.artist?.name});}}
 }catch(e){result.deezerError=e.message;}
 if(!result.image||!result.genres.length||!result.evidence.length)try{
  const data=await get('https://itunes.apple.com/search?'+new URLSearchParams({term:`${target.title} ${target.artist}`,entity:target.type==='single'?'song':'album',limit:'15',country:'US'}));
  let item=data.results?.find(a=>matches(target,a.trackName||a.collectionName,a.artistName));
  if(!item){const broad=await get('https://itunes.apple.com/search?'+new URLSearchParams({term:target.title,entity:target.type==='single'?'song':'album',limit:'50',country:'US'}));item=broad.results?.find(a=>matches(target,a.trackName||a.collectionName,a.artistName));}
  if(item){result.image=result.image||item.artworkUrl100?.replace('100x100bb','1200x1200bb');result.genres=genres.normalizeGenres([...result.genres,item.primaryGenreName]);result.releaseDate=result.releaseDate||item.releaseDate?.slice(0,10);result.links.apple=item.collectionViewUrl||item.trackViewUrl;result.evidence.push({provider:'Apple',id:item.collectionId||item.trackId,title:item.trackName||item.collectionName,artist:item.artistName});}
 }catch(e){result.appleError=e.message;}
 // Existing official nominees are themselves a verified source for the credited
 // work, artwork and category genre; lack of a streaming search hit does not
 // turn composers or award categories into fabricated tracks or listening data.
 if(!result.evidence.length&&target.nominees.length&&result.image&&result.genres.length)result.evidence.push({provider:'Grammy nominee',ids:target.nominees.map(n=>n.id),categories:target.nominees.map(n=>n.category_id)});
 result.complete=Boolean(result.image&&result.genres.length&&(result.evidence.length||existing));cached[identity]=result;await fs.writeFile(file('resolved.json'),JSON.stringify(cached,null,2));return result;
}
const queue=[...targets.values()];let index=0;
await Promise.all(Array.from({length:2},async()=>{while(index<queue.length){const target=queue[index++];const r=await resolve(target);console.log(index+'/'+queue.length,r.complete?'ready':'needs metadata',r.title);}}));
const rows=queue.map(t=>cached[annualReleaseIdentity(t)]).filter(Boolean);
await fs.writeFile(file('pending.json'),JSON.stringify(rows.filter(r=>!r.complete),null,2));
console.log({targets:queue.length,resolved:rows.filter(r=>r.complete).length,pending:rows.filter(r=>!r.complete).length});
