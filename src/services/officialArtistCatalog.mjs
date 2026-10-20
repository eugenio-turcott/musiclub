import identity from '../utils/releaseIdentity.cjs';
import genreCatalog from '../utils/genreCatalog.cjs';
const { slugify } = identity;
const artistKey = value => slugify(value);
const titleKey = value => slugify(String(value || '').replace(/ - (Single|EP)$/i,''), true);
export function mergeOfficialReleases(previous = [], incoming = []) {
  const merged = new Map();
  for (const release of [...previous, ...incoming]) {
    if (!release?.name || !release.sources?.length) continue;
    // Preserve different editions, clean/explicit versions and track counts.
    const base = [titleKey(release.name), release.release_type, release.totalTracks || '', release.releaseYear || ''].join('|');
    const sameSource = [...merged.entries()].find(([,value])=>value.sources.some(a=>release.sources.some(b=>a.provider===b.provider && a.id===b.id)));
    const oldEntry = sameSource || [...merged.entries()].find(([key, value]) => key.startsWith(`${base}|`) && (value.explicit == null || release.explicit == null || value.explicit === release.explicit));
    const key = oldEntry?.[0] || `${base}|${release.explicit ?? 'unknown'}`;
    const old = oldEntry?.[1];
    if (!old) { merged.set(key, {...release, sources:[...release.sources]}); continue; }
    const sources = [...new Map([...old.sources,...release.sources].map(s => [`${s.provider}:${s.id}`,s])).values()];
    merged.set(key, {...old, ...(sameSource ? release : {}), explicit:old.explicit ?? release.explicit, image:old.image || release.image, sources});
  }
  return [...merged.values()].sort((a,b)=>(b.releaseDate || '').localeCompare(a.releaseDate || ''));
}
function releaseType(name, type, count) {
  if (/remix/i.test(name)) return 'REMIX';
  if (/\b(live|en vivo)\b/i.test(name)) return 'EN VIVO';
  if (/soundtrack/i.test(name)) return 'SOUNDTRACK';
  if (['compilation','compile'].includes(type)) return 'COMPILACION';
  if (type === 'ep' || /(?: - |\()EP(?:\)|$)/i.test(name)) return 'EP';
  return type === 'single' ? (count > 2 && count <= 7 ? 'EP' : 'SENCILLO') : 'ALBUM';
}
// A matching name alone cannot disambiguate namesakes. Confirm against releases
// already attributed to this artist in Musiclub, or reuse a verified provider ID.
export async function selectOfficialArtist(candidates,{knownId,idOf,catalog,knownReleases=[]}) {
  if(knownId) {
    const artist=candidates.find(candidate=>String(idOf(candidate))===String(knownId));
    if(!artist) throw new Error('Verified artist ID missing');
    return {artist,items:await catalog(artist)};
  }
  if(candidates.length===1) return {artist:candidates[0],items:await catalog(candidates[0])};
  const titles=new Set(knownReleases.map(release=>titleKey(typeof release==='string'?release:release.album_name || release.name)).filter(Boolean));
  if(!titles.size || candidates.length>6) throw new Error('Artist identity missing or ambiguous');
  const results=await Promise.allSettled(candidates.map(async artist=>({artist,items:await catalog(artist)})));
  // An unavailable candidate cannot be ruled out safely; preserve the previous copy.
  if(results.some(result=>result.status!=='fulfilled')) throw new Error('Artist identity verification incomplete');
  const confirmed=results.map(result=>result.value).filter(result=>result.items.some(release=>titles.has(titleKey(release.title || release.name || release.collectionName))));
  if(confirmed.length!==1) throw new Error('Artist identity missing or ambiguous');
  return confirmed[0];
}
export async function collectOfficialArtist(name, { fetcher = fetch, env = process.env, knownIds = {}, knownReleases = [], timeoutMs = 45000 } = {}) {
  const controller = new AbortController(), timer = setTimeout(()=>controller.abort(),timeoutMs);
  const json = async (url, headers={}) => {
    const response = await fetcher(url,{headers,signal:controller.signal,cache:'no-store'});
    if (!response.ok) throw new Error(`Provider HTTP ${response.status}`);
    const data=await response.json(); if(data.error) throw new Error('Provider unavailable'); return data;
  };
  const paginate = async (url, origin, field, headers={}) => {
    const rows=[],seen=new Set();
    while(url) {
      const parsed=new URL(url); if(parsed.origin!==origin || seen.has(url)) throw new Error('Invalid provider pagination');
      seen.add(url);const data=await json(url,headers);rows.push(...(data[field]||[]));url=data.next || null;
    }
    return rows;
  };
  const exact = artists => artists.filter(a=>artistKey(a.name)===artistKey(name));
  const providers={};
  async function deezer() {
    const found=await json(`https://api.deezer.com/search/artist?q=${encodeURIComponent(name)}&limit=25`);
    const matches=exact(found.data || []);
    const {artist,items}=await selectOfficialArtist(matches,{knownId:knownIds.deezer,idOf:a=>a.id,knownReleases,
      catalog:a=>paginate(`https://api.deezer.com/artist/${a.id}/albums?limit=100`,'https://api.deezer.com','data')});
    // Artist listings omit track counts; resolve them before comparing editions.
    const enriched=new Array(items.length);let index=0;
    await Promise.all(Array.from({length:Math.min(4,items.length)},async()=>{
      while(index<items.length) {
        const current=index++,item=items[current];
        try {enriched[current]={...item,...await json(`https://api.deezer.com/album/${item.id}`)};} catch {enriched[current]=item;}
      }
    }));
    return {artist:{name:artist.name,image:artist.picture_xl || artist.picture_big || '',genres:[]},provider:'DEEZER',artistId:String(artist.id),complete:true,
      releases:enriched.map(a=>({id:`deezer_${a.id}`,name:a.title,artists:[artist.name],releaseDate:a.release_date || '',releaseYear:Number(a.release_date?.slice(0,4)) || null,
        release_type:releaseType(a.title,a.record_type,a.nb_tracks),totalTracks:a.nb_tracks || null,explicit:a.explicit_lyrics ?? null,image:a.cover_xl || a.cover_big || a.cover_medium || '',
        source:'DEEZER',sources:[{provider:'DEEZER',id:String(a.id),url:a.link || `https://www.deezer.com/album/${a.id}`}]}))};
  }
  async function apple() {
    const found=await json(`https://itunes.apple.com/search?term=${encodeURIComponent(name)}&entity=musicArtist&limit=25&country=mx`);
    const matches=exact((found.results||[]).map(a=>({...a,name:a.artistName})));
    const {artist,items}=await selectOfficialArtist(matches,{knownId:knownIds.apple,idOf:a=>a.artistId,knownReleases,catalog:async a=>{
      const data=await json(`https://itunes.apple.com/lookup?id=${a.artistId}&entity=album&limit=200&country=mx`);
      return (data.results||[]).filter(item=>item.wrapperType==='collection' && item.artistId===a.artistId);
    }});
    return {artist:{name:artist.name,image:'',genres:genreCatalog.normalizeGenres([artist.primaryGenreName])},provider:'APPLE',artistId:String(artist.artistId),complete:items.length<200,
      releases:items.map(a=>({id:`itunes_${a.collectionId}`,name:a.collectionName,artists:[artist.name],releaseDate:a.releaseDate?.slice(0,10) || '',releaseYear:Number(a.releaseDate?.slice(0,4)) || null,
        release_type:releaseType(a.collectionName, / - Single$/.test(a.collectionName)?'single':/ - EP$/.test(a.collectionName)?'ep':'album',a.trackCount),totalTracks:a.trackCount || null,
        explicit:a.collectionExplicitness==='explicit',image:a.artworkUrl100?.replace('100x100bb','600x600bb') || '',source:'APPLE',
        sources:[{provider:'APPLE',id:String(a.collectionId),url:a.collectionViewUrl}]}))};
  }
  async function spotify() {
    const id=env.SPOTIFY_CLIENT_ID || env.REACT_APP_SPOTIFY_CLIENT_ID,secret=env.SPOTIFY_CLIENT_SECRET || env.REACT_APP_SPOTIFY_CLIENT_SECRET;
    if(!id || !secret) throw new Error('Spotify not configured');
    const response=await fetcher('https://accounts.spotify.com/api/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded',Authorization:`Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`},body:'grant_type=client_credentials',signal:controller.signal});
    if(!response.ok) throw new Error('Spotify authorization unavailable');
    const token=await response.json(),headers={Authorization:`Bearer ${token.access_token}`};
    const found=await json(`https://api.spotify.com/v1/search?q=${encodeURIComponent(name)}&type=artist&limit=10`,headers);
    const matches=exact(found.artists?.items || []);
    const {artist,items}=await selectOfficialArtist(matches,{knownId:knownIds.spotify,idOf:a=>a.id,knownReleases,catalog:async a=>{
      const rows=await paginate(`https://api.spotify.com/v1/artists/${a.id}/albums?include_groups=album,single,compilation,appears_on&limit=10`,'https://api.spotify.com','items',headers);
      return rows.filter(release=>(release.artists||[]).some(credit=>credit.id===a.id));
    }});
    return {artist:{name:artist.name,image:artist.images?.[0]?.url || '',genres:genreCatalog.normalizeGenres(artist.genres || [])},provider:'SPOTIFY',artistId:artist.id,complete:true,
      releases:items.filter(a=>(a.artists||[]).some(credit=>credit.id===artist.id)).map(a=>({id:a.id,name:a.name,artists:a.artists.map(credit=>credit.name),
        releaseDate:a.release_date || '',releaseYear:Number(a.release_date?.slice(0,4)) || null,release_type:releaseType(a.name,a.album_type,a.total_tracks),totalTracks:a.total_tracks || null,
        explicit:a.explicit ?? null,image:a.images?.[0]?.url || '',source:'SPOTIFY',sources:[{provider:'SPOTIFY',id:a.id,url:a.external_urls?.spotify}]}))};
  }
  try {
    const results=await Promise.allSettled([spotify(),deezer(),apple()]);
    const accepted=results.filter(r=>r.status==='fulfilled').map(r=>r.value);
    ['SPOTIFY','DEEZER','APPLE'].forEach((provider,i)=>{providers[provider]=results[i].status==='fulfilled' ? {status:results[i].value.complete?'ok':'partial',count:results[i].value.releases.length,artistId:results[i].value.artistId} : {status:'unavailable'};});
    return {success:accepted.some(a=>a.releases.length),source:'OFFICIAL',artist:{name,image:accepted.find(a=>a.artist.image)?.artist.image || '',genres:[...new Set(accepted.flatMap(a=>a.artist.genres))]},
      discography:mergeOfficialReleases([],accepted.flatMap(a=>a.releases)),providers,checkedAt:new Date().toISOString()};
  } finally {clearTimeout(timer);}
}
