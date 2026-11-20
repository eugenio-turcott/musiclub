import catalog from '../utils/genreCatalog.cjs';
import {resolveReleaseGenres} from './releaseGenres.mjs';

export function genreRetryDelay(attempt){return Math.min(24*60,15*2**Math.min(7,Math.max(0,attempt-1)))*60000;}
export async function processGenreEnrichment(db,{resolve=resolveReleaseGenres,now=()=>Date.now(),albumId=null,limit=3,onResolved=()=>{}}={}){
 const stamp=new Date(now()).toISOString();
 let query=db.from('albums').select('*').eq('genres','{}').lte('genre_retry_at',stamp).order('genre_retry_at',{ascending:true}).limit(Math.min(3,limit));
 if(albumId)query=query.eq('id',albumId);
 const {data:rows,error}=await query;if(error)throw error;
 const result={checked:0,resolved:0,pending:0};
 for(const album of rows||[]){
  const lease=new Date(now()+120000).toISOString(),attempt=(album.genre_retry_count||0)+1;
  const claim=await db.from('albums').update({genre_retry_at:lease,genre_retry_count:attempt}).eq('id',album.id).eq('genres','{}').eq('genre_retry_at',album.genre_retry_at).select('id');
  if(claim.error)throw claim.error;if(!claim.data?.length)continue;
  result.checked++;
  let genres=[];
  try{genres=catalog.normalizeGenres(await resolve(album.artist_name,album.album_name,[],{barcode:album.barcode,tracks:album.tracks,totalTracks:album.total_tracks,budgetMs:10000}));}catch{/* The next attempt remains scheduled. */}
  const patch=genres.length?{genres,genre_retry_count:0,genre_retry_at:stamp}:{genre_retry_at:new Date(now()+genreRetryDelay(attempt)).toISOString()};
  const saved=await db.from('albums').update(patch).eq('id',album.id).eq('genres','{}').eq('genre_retry_at',lease).select('id');
  if(saved.error)throw saved.error;
  if(saved.data?.length&&genres.length){result.resolved++;await onResolved(album);}else result.pending++;
 }
 return result;
}
