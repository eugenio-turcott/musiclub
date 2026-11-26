import identity from '../utils/releaseIdentity.cjs';
import {platformFromReleaseURL} from '../utils/verifiedDiscography.mjs';
const key=value=>identity.slugify(value||'',true);
let nextRequest=0;

// MusicBrainz relationships expose release-specific links to services without
// public catalogue search APIs (notably YouTube Music and Tidal). A search link,
// an artist page or an inferred URL is never counted as release evidence.
export async function artistPlatformConcordance(name,releases,{fetcher=fetch,knownId,signal,intervalMs=1100}={}){
 const request=async path=>{
  const delay=Math.max(0,nextRequest-Date.now());nextRequest=Date.now()+delay+intervalMs;
  if(delay)await new Promise(resolve=>setTimeout(resolve,delay));
  signal?.throwIfAborted();
  const response=await fetcher(`https://musicbrainz.org/ws/2/${path}`,{signal,headers:{'User-Agent':'Musiclub/12.3.1 (https://www.musiclub.org/contacto)',Accept:'application/json'},cache:'no-store'});
  if(!response.ok)throw Error('MusicBrainz unavailable');return response.json();
 };
 const anchors=new Set(releases.map(r=>key(r.name||r.album_name)).filter(Boolean));
 if(!anchors.size)return {releases:[],providers:{MUSICBRAINZ:{status:'unavailable'}}};
 const candidates=knownId&&/^[a-f0-9-]{36}$/i.test(knownId)?[{id:knownId,name}]:
  ((await request(`artist?query=${encodeURIComponent(`artist:"${name.replace(/["\\]/g,'')}"`)}&limit=25&fmt=json`)).artists||[]).filter(a=>key(a.name)===key(name));
 const matches=[];
 for(const artist of candidates.slice(0,5)){
  const first=await request(`release-group?artist=${artist.id}&limit=100&offset=0&inc=artist-credits+url-rels+genres&fmt=json`);
  if((first['release-groups']||[]).some(r=>anchors.has(key(r.title))))matches.push({artist,first});
 }
 if(matches.length!==1||candidates.length>5)throw Error('MusicBrainz artist identity ambiguous');
 const {artist,first}=matches[0],groups=[...(first['release-groups']||[])];let complete=true;
 while(groups.length<Number(first['release-group-count'])){
  signal?.throwIfAborted();
  const page=await request(`release-group?artist=${artist.id}&limit=100&offset=${groups.length}&inc=artist-credits+url-rels+genres&fmt=json`);
  if(!page['release-groups']?.length){complete=false;break;}groups.push(...page['release-groups']);
 }
 const rows=[];
 for(const group of groups){
  const match=releases.find(r=>key(r.name||r.album_name)===key(group.title)&&(!r.releaseYear||!group['first-release-date']||Math.abs(r.releaseYear-Number(group['first-release-date'].slice(0,4)))<=1));
  if(!match)continue;
  if(group['artist-credit']?.length&&!group['artist-credit'].some(c=>c.artist?.id===artist.id))continue;
  const links=(group.relations||[]).map(r=>platformFromReleaseURL(r.url?.resource)).filter(Boolean);
  rows.push({...match,sources:[...(match.sources||[]),{provider:'MUSICBRAINZ',id:group.id,url:`https://musicbrainz.org/release-group/${group.id}`},...links]});
 }
 const providers={MUSICBRAINZ:{status:complete?'ok':'partial',artistId:artist.id,count:rows.length}};
 for(const provider of ['YOUTUBE_MUSIC','TIDAL'])providers[provider]={status:rows.some(r=>r.sources.some(s=>s.provider===provider))?'linked':'unavailable',count:rows.filter(r=>r.sources.some(s=>s.provider===provider)).length};
 return {releases:rows,providers};
}
