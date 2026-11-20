import appleGenres from '../utils/appleMusicGenres.cjs';
import identity from '../utils/remoteReleaseGenres.cjs';
const read=async url=>{const response=await fetch(url,{signal:AbortSignal.timeout(4000)});if(!response.ok)throw new Error('Apple Music unavailable');return response.json();};
const summary=item=>({id:String(item.collectionId),name:item.collectionName,artist:item.artistName,artists:[item.artistName],genres:appleGenres.normalizeAppleGenres(item),totalTracks:item.trackCount,image:item.artworkUrl100?.replace('100x100bb','1000x1000bb'),external_urls:{itunes:item.collectionViewUrl}});
export async function searchAppleReleases(query,limit=10){
 const data=await read(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=album&limit=${Math.min(limit,15)}`);
 return {albums:(data.results||[]).filter(item=>item.collectionId&&item.collectionName).map(summary)};
}
export async function getAppleReleaseDetails(id){
 if(!/^\d+$/.test(String(id)))return null;
 const data=await read(`https://itunes.apple.com/lookup?id=${id}&entity=song`);
 const collection=(data.results||[]).find(item=>item.wrapperType==='collection'&&String(item.collectionId)===String(id));
 if(!collection)return null;
 const tracks=(data.results||[]).filter(item=>item.wrapperType==='track'&&String(item.collectionId)===String(id)).map(song=>({id:String(song.trackId),name:song.trackName,duration_ms:song.trackTimeMillis||0,track_number:song.trackNumber,disc_number:song.discNumber||1})).sort((a,b)=>a.disc_number-b.disc_number||a.track_number-b.track_number);
 return {...summary(collection),tracks,releaseDate:collection.releaseDate?.slice(0,10)};
}
export async function findAppleRelease(artist,title){
 const result=await searchAppleReleases(`${artist} ${title}`);
 for(const candidate of result.albums.filter(album=>identity.sameRelease(artist,title,album)).slice(0,2)){
  const album=await getAppleReleaseDetails(candidate.id);
  if(identity.sameRelease(artist,title,album)&&album.tracks.length===album.totalTracks)return album;
 }
 return null;
}
