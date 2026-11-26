import identity from '../utils/releaseIdentity.cjs';
const validId=id=>/^[A-Za-z0-9]{22}$/.test(id||'');
const image=sources=>[...(sources||[])].sort((a,b)=>(b.width||0)-(a.width||0))[0]?.url||'';
export function spotifyPageState(html){
 const script=String(html).match(/<script\b(?=[^>]*\bid=["']initialState["'])[^>]*>([\s\S]*?)<\/script>/i)?.[1];
 if(!script)throw Error('Spotify public metadata unavailable');
 try{return JSON.parse(script);}catch{return JSON.parse(Buffer.from(script,'base64').toString('utf8'));}
}
async function page(path,{fetcher=fetch,signal}={}){
 const response=await fetcher(`https://open.spotify.com/${path}`,{headers:{'User-Agent':'Mozilla/5.0'},signal,cache:'no-store'});
 if(!response.ok)throw Error(`Spotify public HTTP ${response.status}`);
 return spotifyPageState(await response.text());
}
export async function spotifyPublicAlbum(id,options={}){
 if(!validId(id))throw Error('Invalid Spotify album ID');
 const state=await page(`album/${id}`,options),a=state.entities?.items?.[`spotify:album:${id}`];
 if(!a?.name||a.uri!==`spotify:album:${id}`)throw Error('Spotify album identity missing');
 const artists=(a.artists?.items||[]).map(c=>({id:c.uri?.split(':')[2],name:c.profile?.name})).filter(c=>c.id&&c.name);
 const total=Number(a.tracksV2?.totalCount),date=a.date;
 if(!artists.length||!total||!date?.year)throw Error('Incomplete Spotify album');
 const tracks=(a.tracksV2?.items||[]).map(row=>row.track).filter(t=>t?.id&&t.name).map(t=>({id:t.id,name:t.name,duration_ms:t.duration?.totalMilliseconds||0,disc_number:t.discNumber||1,track_number:t.trackNumber,artists:(t.artists?.items||[]).map(c=>c.profile?.name).filter(Boolean)}));
 const releaseDate=[date.year,...(date.month?[String(date.month).padStart(2,'0')]:[]),...(date.day?[String(date.day).padStart(2,'0')]:[])].join('-');
 return {id,name:a.name,artists:artists.map(c=>c.name),artistIds:artists.map(c=>c.id),releaseDate,releaseYear:date.year,
  release_type:/remix/i.test(a.name)?'REMIX':/\b(live|en vivo)\b/i.test(a.name)?'EN VIVO':a.type==='COMPILATION'?'COMPILACION':/\bEP\b/i.test(a.name)||a.type==='EP'?'EP':a.type==='SINGLE'?'SENCILLO':'ALBUM',
  totalTracks:total,tracks:tracks.length===total?tracks:[],image:image(a.coverArt?.sources),source:'SPOTIFY',sources:[{provider:'SPOTIFY',id,url:`https://open.spotify.com/album/${id}`}],genres:[]};
}
// This public snapshot is intentionally partial: it must never claim full API pagination.
export async function spotifyPublicArtist(name,{artistId,knownReleases=[],fetcher=fetch,signal}={}){
 const options={fetcher,signal};
 if(!validId(artistId)){
  for(const anchor of knownReleases.slice(0,5)){
   const match=String(anchor.spotify_link||'').match(/^https:\/\/open\.spotify\.com\/album\/([A-Za-z0-9]{22})(?:[/?#]|$)/);if(!match)continue;
   try{const album=await spotifyPublicAlbum(match[1],options);
    if(identity.slugify(album.name,true)!==identity.slugify(anchor.album_name||anchor.name,true))continue;
    artistId=album.artistIds.find((id,i)=>identity.slugify(album.artists[i])===identity.slugify(name));if(artistId)break;
   }catch{ /* Another verified album may resolve the artist. */ }
  }
 }
 if(!validId(artistId))throw Error('Verified Spotify artist ID unavailable');
 const state=await page(`artist/${artistId}`,options),a=state.entities?.items?.[`spotify:artist:${artistId}`];
 if(!a||identity.slugify(a.profile?.name)!==identity.slugify(name))throw Error('Spotify artist identity mismatch');
 const releases=new Map();
 for(const key of ['albums','singles','compilations'])for(const group of a.discography?.[key]?.items||[])for(const r of group.releases?.items||[]){const id=r.uri?.split(':')[2];if(validId(id))releases.set(id,r);}
 const rows=[...releases.keys()],verified=[];let next=0;
 // The artist's own listing also includes featured credits whose album-level
 // artist is someone else (for example B2b featuring Tinashe).
 await Promise.all(Array.from({length:Math.min(3,rows.length)},async()=>{while(next<rows.length){const id=rows[next++];try{verified.push(await spotifyPublicAlbum(id,options));}catch{ /* Keep other independently verified releases. */ }}}));
 if(!verified.length)throw Error('Spotify public discography unavailable');
 return {artist:{name:a.profile.name,image:image(a.visuals?.avatarImage?.sources),genres:[]},provider:'SPOTIFY',artistId,complete:false,mode:'public',releases:verified};
}
