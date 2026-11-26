import fs from 'node:fs/promises';
import dotenv from 'dotenv';
import {createClient} from '@supabase/supabase-js';
import {compatibleDiscographyRelease} from '../src/utils/discographyIdentity.mjs';
import identity from '../src/utils/releaseIdentity.cjs';
import {splitArtists} from '../src/utils/ratingUtils.js';
dotenv.config({path:'.env.local',quiet:true});dotenv.config({quiet:true});
const db=createClient(process.env.REACT_APP_SUPABASE_URL,process.env.REACT_APP_SUPABASE_ANON_KEY,{auth:{persistSession:false}}),report=JSON.parse(await fs.readFile('outputs/v1233/catalog-identity-audit.json','utf8'));
const fold=identity.slugify,artistAliases={pxndx:'panda',ye:'kanye-west','miley':'miley-cyrus','varios-artistas':'various-artists'};
const names=value=>splitArtists(value).map(a=>artistAliases[fold(a.name)]||fold(a.name));
const unrelated=c=>{const a=names(c.artist),b=names(c.actual.artist||c.actual.artists?.join(' & ')||'');return !a.some(n=>b.includes(n)||b.some(m=>n.includes(m)||m.includes(n)));};
const simple=v=>fold(String(v||'').replace(/\s*[(\[][^)\]]*(?:remaster|anniversary|deluxe|expanded|edition)[^)\]]*[)\]]/ig,''),true);
const conflicts=report.checks.filter(c=>c.status==='conflict'&&(unrelated(c)||(c.provider==='SPOTIFY'&&c.actual.release_type==='ALBUM'&&!simple(c.title).includes(simple(c.actual.name))&&!simple(c.actual.name).includes(simple(c.title))))),plans=[];
for(const check of conflicts){
 const {data:album}=await db.from('albums').select('id,album_name,artist_name,release_type,total_tracks,other_link,apple_music_link,spotify_link').eq('id',check.albumId).single();if(!album)continue;if(check.provider==='SPOTIFY'&&check.title===check.actual.name)continue;
 const field=check.provider==='DEEZER'?'other_link':check.provider==='SPOTIFY'?'spotify_link':'apple_music_link',old=album[field],query=album.artist_name+' '+album.album_name;
 let replacement=check.provider==='DEEZER'?'https://www.deezer.com/search/'+encodeURIComponent(query):check.provider==='SPOTIFY'?'https://open.spotify.com/search/'+encodeURIComponent(query):'https://music.apple.com/search?term='+encodeURIComponent(query),verified=false;
 try{if(check.provider==='SPOTIFY')throw Error('Exact Spotify identity requires separate verification');const url=check.provider==='DEEZER'?'https://api.deezer.com/search/album?limit=20&q='+encodeURIComponent(query):'https://itunes.apple.com/search?entity=album&limit=20&term='+encodeURIComponent(query);const response=await fetch(url,{signal:AbortSignal.timeout(10000)}),d=await response.json();
 for(const item of d.data||d.results||[]){const r={name:item.title||item.collectionName,artist:item.artist?.name||item.artistName,release_type:album.release_type,totalTracks:item.nb_tracks||item.trackCount};if(compatibleDiscographyRelease(album,r)){replacement=check.provider==='DEEZER'?'https://www.deezer.com/album/'+item.id:item.collectionViewUrl;verified=true;break;}}
 }catch{}
 plans.push({id:album.id,title:album.album_name,artist:album.artist_name,field,old,replacement,verified,incorrectArtist:check.actual.artist||check.actual.artists?.join(' & ')});
}
const quote=v=>"'"+String(v).replaceAll("'","''")+"'";
const sql=plans.map(p=>`update public.albums set ${p.field}=${quote(p.replacement)} where id=${quote(p.id)} and ${p.field}=${quote(p.old)};`).join('\n');
await fs.writeFile('outputs/v1233/catalog-identity-repairs.json',JSON.stringify(plans,null,2));await fs.writeFile('outputs/v1233/catalog-identity-repairs.sql',sql);console.log(JSON.stringify({incorrectArtistLinks:plans.length,verifiedReplacements:plans.filter(p=>p.verified).length,searchFallbacks:plans.filter(p=>!p.verified).length}));
