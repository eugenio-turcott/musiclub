import editions from '../utils/releaseEditions.cjs';

export const catalogSearchKey = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
export function matchesCatalogQuery(album, query) {
  const key=catalogSearchKey(query);
  return [album.album_name,album.artist_name,album.added_by,album.added_by_email].some(value=>catalogSearchKey(value).includes(key));
}
export function normalizeSpotifySearch(items=[]) {
  return editions.groupReleaseEditions(items.filter(item=>item?.id && item.name && item.artists?.length).map(item=>({
    id:item.id,spotify_id:item.id,album_name:item.name,artist_name:item.artists.map(artist=>artist.name).join(', '),
    image_url:item.images?.[0]?.url || '',release_date:item.release_date || null,
    release_year:parseInt(item.release_date,10) || null,
    release_type:item.album_type==='compilation'?'COMPILACION':item.album_type==='single'?(item.total_tracks>=3 && item.total_tracks<=7?'EP':'SENCILLO'):/\bep\b/i.test(item.name)&&item.total_tracks<=7?'EP':'ALBUM',
    total_tracks:item.total_tracks || null,spotify_link:item.external_urls?.spotify || `https://open.spotify.com/album/${item.id}`,
    genres:[],tracks:[],source:'SPOTIFY',sources:[{provider:'SPOTIFY',id:item.id}],is_external_spotify:true,
    is_in_club:false,is_reviewed:false,final_rating:null,review_count:0,
  })));
}
export async function searchSpotifyCatalog(query,{signal,offset=0,fetcher=globalThis.fetch}={}) {
  const params=new URLSearchParams({q:query.trim(),type:'album',limit:'10',offset:String(offset),market:'MX'});
  const response=await fetcher(`/api/spotify?path=${encodeURIComponent('/v1/search?'+params)}`,{signal});
  if(!response.ok)throw new Error(response.status===429?'Spotify está recibiendo muchas búsquedas. Inténtalo de nuevo en un momento.':'No pudimos consultar Spotify. Puedes intentarlo de nuevo.');
  const data=await response.json();
  if(!Array.isArray(data.albums?.items))throw new Error('Spotify no devolvió una lista de releases válida.');
  return {albums:normalizeSpotifySearch(data.albums.items),nextOffset:data.albums.next && offset+10<=1000?offset+10:null};
}
