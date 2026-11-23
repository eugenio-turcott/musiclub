const {slugify}=require('./releaseIdentity.cjs');
const {sameReleaseTitle,isPlaceholderTrack}=require('./releaseTracks.cjs');
const genericArtist=value=>/^(various artists?|varios artistas|artistes divers|various|v\.?\s*a\.?)$/i.test(String(value||'').trim());
const trackKey=value=>slugify(String(value||'').replace(/\s*[([]\s*(?:feat(?:uring)?\.?|ft\.?|with)\s+.*?[)\]]\s*$/i,'').replace(/\s+(?:feat(?:uring)?\.?|ft\.?)\s+.+$/i,''),true);
const kind=album=>String(album.release_type||album.releaseType||'ALBUM').toUpperCase().replace(/^SINGLE$/,'SENCILLO');
function sameCompilationEdition(left,right){
 if(!left||!right||(!genericArtist(left.artist_name)&&!genericArtist(right.artist_name)))return false;
 if(kind(left)!==kind(right)||!sameReleaseTitle(left.album_name,right.album_name))return false;
 if(left.barcode&&right.barcode&&String(left.barcode).replace(/^0+/,'')===String(right.barcode).replace(/^0+/,''))return true;
 const tracks=left.tracks,other=right.tracks;
 if(!Array.isArray(tracks)||!Array.isArray(other)||tracks.length<3||tracks.length!==other.length)return false;
 for(const album of [left,right])if(Number(album.total_tracks||album.totalTracks||album.tracks.length)!==album.tracks.length)return false;
 return tracks.every((track,i)=>{
  const name=trackKey(track.name||track.title),otherName=trackKey(other[i].name||other[i].title);
  return !isPlaceholderTrack(track)&&!isPlaceholderTrack(other[i])&&name&&name===otherName&&Number(track.duration_ms)>0&&Number(other[i].duration_ms)>0&&Math.abs(track.duration_ms-other[i].duration_ms)<=2500;
 });
}
async function canonicalAlbum(db,album){
 const seen=new Set();
 while(album?.canonical_album_id){
  if(seen.has(album.id)||seen.size>8)throw new Error('Invalid release alias');seen.add(album.id);
  const {data,error}=await db.from('albums').select('*').eq('id',album.canonical_album_id).single();if(error)throw error;album=data;
 }
 return album;
}
async function findCompilation(db,candidate){
 if(!candidate.tracks?.length&&!candidate.barcode)return null;
 const {data,error}=await db.from('albums').select('*').ilike('album_name',candidate.album_name).limit(30);if(error)throw error;
 const found=(data||[]).find(album=>sameCompilationEdition(candidate,album));
 return found?canonicalAlbum(db,found):null;
}
module.exports={genericArtist,trackKey,sameCompilationEdition,canonicalAlbum,findCompilation};
