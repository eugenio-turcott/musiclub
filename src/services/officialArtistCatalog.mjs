import editions from '../utils/releaseEditions.cjs';
import identity from '../utils/releaseIdentity.cjs';
import genreCatalog from '../utils/genreCatalog.cjs';
const { slugify } = identity;
const artistKey = value => slugify(value);
const titleKey = value => slugify(String(value || '').replace(/ - (Single|EP)$/i,''), true);
export function mergeOfficialReleases(previous = [], incoming = []) {
  const variants=new Map();
  for(const grouped of [...previous,...incoming]) {
    for(const release of grouped.editionVariants || [grouped]) {
      if(!release?.name || !release.sources?.length)continue;
      const key=release.sources.map(source=>`${source.provider}:${source.id}`).sort().join('|');
      const existing=[...variants.entries()].find(([,old])=>old.sources.some(a=>release.sources.some(b=>a.provider===b.provider && String(a.id)===String(b.id))));
      const old=existing?.[1] || {};
      const filled=Object.fromEntries(Object.entries(release).filter(([,value])=>value!==null && value!==undefined && value!=='' && (!Array.isArray(value)||value.length)));
      const {editionVariants,edition_member_ids,edition_names,...row}={...release,...old,...filled};
      variants.set(existing?.[0] || key,{...row,sources:[...new Map([...(old.sources||[]),...release.sources].map(source=>[`${source.provider}:${source.id}`,source])).values()]});
    }
  }
  const rows=[...variants.values()];
  return editions.groupReleaseEditions(rows).map(group=>({...group,
    editionVariants:rows.filter(row=>editions.editionKey(row)===editions.editionKey(group))
  })).sort((a,b)=>(b.releaseDate || '').localeCompare(a.releaseDate || ''));
}
function releaseType(name, type, count) {
  if (/remix/i.test(name)) return 'REMIX';
  if (/\b(live|en vivo)\b/i.test(name)) return 'EN VIVO';
  if (/soundtrack/i.test(name)) return 'SOUNDTRACK';
  if (['compilation','compile'].includes(type)) return 'COMPILACION';
  if (type === 'ep' || /(?: - |\()EP(?:\)|$)/i.test(name)) return 'EP';
  return type === 'single' ? 'SENCILLO' : 'ALBUM';
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
  if(!titles.size) throw new Error('Artist identity missing or ambiguous');
  const results=new Array(candidates.length);let index=0;
  await Promise.all(Array.from({length:Math.min(3,candidates.length)},async()=>{
    while(index<candidates.length) {
      const current=index++,artist=candidates[current];
      try {results[current]={status:'fulfilled',value:{artist,items:await catalog(artist)}};} catch {results[current]={status:'rejected'};}
    }
  }));
  // An unavailable candidate cannot be ruled out safely; preserve the previous copy.
  if(results.some(result=>result.status!=='fulfilled')) throw new Error('Artist identity verification incomplete');
  const confirmed=results.map(result=>result.value).filter(result=>result.items.some(release=>titles.has(titleKey(release.title || release.name || release.collectionName))));
  if(confirmed.length!==1) throw new Error('Artist identity missing or ambiguous');
  return confirmed[0];
}
export async function collectOfficialArtist(name, { fetcher = fetch, env = process.env, knownIds = {}, knownReleases = [], knownDiscography = [], timeoutMs = 45000 } = {}) {
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
  // Resolve identity from a known official album URL before comparing namesakes.
  // Only provider hosts and album IDs are accepted; never fetch a stored arbitrary URL.
  async function anchorArtist(provider,headers={}) {
    for(const release of knownReleases.filter(item=>item && typeof item==='object').slice(0,5)) {
      for(const link of [release.other_link,release.spotify_link,release.apple_music_link].filter(Boolean)) {
        let url;try {url=new URL(link);} catch {continue;}
        const host=url.hostname.replace(/^www\./,'');let data,credits=[];
        try {
          if(provider==='DEEZER' && host==='deezer.com' && /^\/album\/\d+\/?$/.test(url.pathname)) {
            data=await json(`https://api.deezer.com/album/${url.pathname.split('/')[2]}`);
            credits=[data.artist];
          } else if(provider==='APPLE' && ['music.apple.com','itunes.apple.com'].includes(host) && /\/album\/(?:[^/]+\/)?(\d+)\/?$/.test(url.pathname)) {
            const id=url.pathname.match(/(\d+)\/?$/)[1];
            const lookup=await json(`https://itunes.apple.com/lookup?id=${id}&entity=album&country=mx`);
            data=(lookup.results||[]).find(item=>item.wrapperType==='collection');
            if(data) credits=[{id:data.artistId,name:data.artistName}];
          } else if(provider==='SPOTIFY' && host==='open.spotify.com' && /^\/album\/[A-Za-z0-9]{22}\/?$/.test(url.pathname)) {
            data=await json(`https://api.spotify.com/v1/albums/${url.pathname.split('/')[2]}`,headers);
            credits=data.artists || [];
          } else continue;
          if(titleKey(data?.title || data?.name || data?.collectionName)!==titleKey(release.album_name || release.name)) continue;
          const exact=credits.filter(artist=>artist?.id && artistKey(artist.name)===artistKey(name));
          if(exact.length===1) return exact[0];
        } catch { /* Try another verified release or the catalog comparison. */ }
      }
    }
    return null;
  }
  async function deezer() {
    const found=knownIds.deezer ? {data:[await json(`https://api.deezer.com/artist/${knownIds.deezer}`)]} : await json(`https://api.deezer.com/search/artist?q=${encodeURIComponent(name)}&limit=25`);
    const matches=knownIds.deezer ? found.data : exact(found.data || []);
    const anchor=!knownIds.deezer ? await anchorArtist('DEEZER') : null;
    if(anchor && !matches.some(a=>String(a.id)===String(anchor.id))) matches.push(await json(`https://api.deezer.com/artist/${anchor.id}`));
    const {artist,items}=await selectOfficialArtist(matches,{knownId:knownIds.deezer || anchor?.id,idOf:a=>a.id,knownReleases,
      catalog:a=>paginate(`https://api.deezer.com/artist/${a.id}/albums?limit=100`,'https://api.deezer.com','data')});
    // Artist listings omit track counts; resolve them before comparing editions.
    const enriched=new Array(items.length);let index=0;
    const cached=new Map(knownDiscography.flatMap(release=>release.editionVariants || [release]).flatMap(release=>(release.sources||[]).filter(source=>source.provider==='DEEZER').map(source=>[String(source.id),release])));
    await Promise.all(Array.from({length:Math.min(4,items.length)},async()=>{
      while(index<items.length) {
        const current=index++,item=items[current];
        const saved=cached.get(String(item.id));
        if(saved?.totalTracks && saved?.image && saved?.genres?.length) {enriched[current]={...item,nb_tracks:saved.totalTracks,genres:{data:saved.genres.map(name=>({name}))},upc:saved.barcode};continue;}
        try {enriched[current]={...item,...await json(`https://api.deezer.com/album/${item.id}`)};} catch {enriched[current]={...item,nb_tracks:saved?.totalTracks,cover_xl:saved?.image,genres:{data:(saved?.genres||[]).map(name=>({name}))}};}
      }
    }));
    return {artist:{name:artist.name,image:artist.picture_xl || artist.picture_big || '',genres:[]},provider:'DEEZER',artistId:String(artist.id),complete:enriched.every(item=>item.nb_tracks && (item.cover_xl || item.cover_big || item.cover_medium)),
      releases:enriched.map(a=>({id:`deezer_${a.id}`,name:a.title,artists:[artist.name],releaseDate:a.release_date || '',releaseYear:Number(a.release_date?.slice(0,4)) || null,
        release_type:releaseType(a.title,a.record_type,a.nb_tracks),totalTracks:a.nb_tracks || null,barcode:a.upc || null,genres:genreCatalog.normalizeGenres(a.genres?.data || []),explicit:a.explicit_lyrics ?? null,image:a.cover_xl || a.cover_big || a.cover_medium || '',
        source:'DEEZER',sources:[{provider:'DEEZER',id:String(a.id),url:a.link || `https://www.deezer.com/album/${a.id}`}]}))};
  }
  async function apple() {
    const found=knownIds.apple ? {results:[{artistId:Number(knownIds.apple),artistName:name}]} : await json(`https://itunes.apple.com/search?term=${encodeURIComponent(name)}&entity=musicArtist&limit=25&country=mx`);
    const matches=exact((found.results||[]).map(a=>({...a,name:a.artistName})));
    const anchor=!knownIds.apple ? await anchorArtist('APPLE') : null;
    if(anchor && !matches.some(a=>String(a.artistId)===String(anchor.id))) matches.push({artistId:anchor.id,name:anchor.name});
    const {artist,items}=await selectOfficialArtist(matches,{knownId:knownIds.apple || anchor?.id,idOf:a=>a.artistId,knownReleases,catalog:async a=>{
      const data=await json(`https://itunes.apple.com/lookup?id=${a.artistId}&entity=album&limit=200&country=mx`);
      return (data.results||[]).filter(item=>item.wrapperType==='collection' && item.artistId===a.artistId);
    }});
    return {artist:{name:artist.name,image:'',genres:genreCatalog.normalizeGenres([artist.primaryGenreName])},provider:'APPLE',artistId:String(artist.artistId),complete:items.length<200,
      releases:items.map(a=>({id:`itunes_${a.collectionId}`,name:a.collectionName,artists:[artist.name],releaseDate:a.releaseDate?.slice(0,10) || '',releaseYear:Number(a.releaseDate?.slice(0,4)) || null,
        release_type:releaseType(a.collectionName, / - Single$/.test(a.collectionName)?'single':/ - EP$/.test(a.collectionName)?'ep':'album',a.trackCount),totalTracks:a.trackCount || null,
        explicit:a.collectionExplicitness==='explicit',genres:genreCatalog.normalizeGenres([a.primaryGenreName]),image:a.artworkUrl100?.replace('100x100bb','600x600bb') || '',source:'APPLE',
        sources:[{provider:'APPLE',id:String(a.collectionId),url:a.collectionViewUrl}]}))};
  }
  async function spotify() {
    const id=env.SPOTIFY_CLIENT_ID || env.REACT_APP_SPOTIFY_CLIENT_ID,secret=env.SPOTIFY_CLIENT_SECRET || env.REACT_APP_SPOTIFY_CLIENT_SECRET;
    if(!id || !secret) throw new Error('Spotify not configured');
    const response=await fetcher('https://accounts.spotify.com/api/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded',Authorization:`Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`},body:'grant_type=client_credentials',signal:controller.signal});
    if(!response.ok) throw new Error('Spotify authorization unavailable');
    const token=await response.json(),headers={Authorization:`Bearer ${token.access_token}`};
    const found=knownIds.spotify ? {artists:{items:[await json(`https://api.spotify.com/v1/artists/${knownIds.spotify}`,headers)]}} : await json(`https://api.spotify.com/v1/search?q=${encodeURIComponent(name)}&type=artist&limit=10`,headers);
    const matches=knownIds.spotify ? found.artists.items : exact(found.artists?.items || []);
    const anchor=!knownIds.spotify ? await anchorArtist('SPOTIFY',headers) : null;
    if(anchor && !matches.some(a=>a.id===anchor.id)) matches.push(await json(`https://api.spotify.com/v1/artists/${anchor.id}`,headers));
    const {artist,items}=await selectOfficialArtist(matches,{knownId:knownIds.spotify || anchor?.id,idOf:a=>a.id,knownReleases,catalog:async a=>{
      const rows=await paginate(`https://api.spotify.com/v1/artists/${a.id}/albums?include_groups=album,single,compilation,appears_on&limit=10`,'https://api.spotify.com','items',headers);
      return rows.filter(release=>(release.artists||[]).some(credit=>credit.id===a.id));
    }});
    return {artist:{name:artist.name,image:artist.images?.[0]?.url || '',genres:genreCatalog.normalizeGenres(artist.genres || [])},provider:'SPOTIFY',artistId:artist.id,complete:true,
      releases:items.filter(a=>(a.artists||[]).some(credit=>credit.id===artist.id)).map(a=>({id:a.id,name:a.name,artists:a.artists.map(credit=>credit.name),
        releaseDate:a.release_date || '',releaseYear:Number(a.release_date?.slice(0,4)) || null,release_type:releaseType(a.name,a.album_type,a.total_tracks),totalTracks:a.total_tracks || null,
        explicit:a.explicit ?? null,genres:[],image:a.images?.[0]?.url || '',source:'SPOTIFY',sources:[{provider:'SPOTIFY',id:a.id,url:a.external_urls?.spotify}]}))};
  }
  try {
    const results=await Promise.allSettled([spotify(),deezer(),apple()]);
    const accepted=results.filter(r=>r.status==='fulfilled').map(r=>r.value);
    ['SPOTIFY','DEEZER','APPLE'].forEach((provider,i)=>{providers[provider]=results[i].status==='fulfilled' ? {status:results[i].value.complete?'ok':'partial',count:results[i].value.releases.length,artistId:results[i].value.artistId} : {status:'unavailable'};});
    return {success:accepted.some(a=>a.releases.length),source:'OFFICIAL',artist:{name,image:accepted.find(a=>a.artist.image)?.artist.image || '',genres:[...new Set(accepted.flatMap(a=>a.artist.genres))]},
      discography:mergeOfficialReleases([],accepted.flatMap(a=>a.releases)),providers,checkedAt:new Date().toISOString()};
  } finally {clearTimeout(timer);}
}

// Repair only incomplete records; never invent counts or replace a verified value with an empty response.
let nextMetadataRequest=0;
export async function repairOfficialMetadata(profile,{fetcher=fetch,requestIntervalMs=150}={}) {
  const releases=(profile.discography || []).flatMap(release=>release.editionVariants || [release]).map(release=>({...release}));
  let index=0,repaired=0,unavailable=0;
  await Promise.all(Array.from({length:Math.min(4,releases.length)},async()=>{
    while(index<releases.length) {
      const release=releases[index++];
      const source=release.sources?.find(source=>source.provider==='DEEZER' && /^\d+$/.test(String(source.id)));
      if(!source || (release.totalTracks && release.image)) continue;
      try {
        let data;
        for(let attempt=0;attempt<3;attempt++) {
          const wait=Math.max(0,nextMetadataRequest-Date.now());nextMetadataRequest=Date.now()+wait+requestIntervalMs;
          if(wait)await new Promise(resolve=>setTimeout(resolve,wait));
          const response=await fetcher(`https://api.deezer.com/album/${source.id}`,{signal:AbortSignal.timeout(8000)});
          data=await response.json();
          if(response.status===429 || data.error?.code===4) {
            nextMetadataRequest=Math.max(nextMetadataRequest,Date.now()+5000);
            if(attempt<2)continue;
          }
          if(!response.ok)throw Error('Unavailable');
          break;
        }
        if(String(data.id)!==String(source.id) || data.error) throw Error('Unavailable');
        const patch={totalTracks:data.nb_tracks || release.totalTracks,image:release.image || data.cover_xl || data.cover_big || data.cover_medium,
          genres:genreCatalog.normalizeGenres([...(release.genres||[]),...(data.genres?.data||[])]),barcode:release.barcode || data.upc || null};
        if((!release.totalTracks && patch.totalTracks) || (!release.image && patch.image)) repaired++;
        Object.assign(release,patch);
      } catch {unavailable++;}
    }
  }));
  return {profile:{...profile,discography:mergeOfficialReleases([],releases)},repaired,unavailable};
}
