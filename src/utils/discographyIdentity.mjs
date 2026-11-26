import editions from './releaseEditions.cjs';
import identity from './releaseIdentity.cjs';
import {splitArtists} from './ratingUtils.js';
import {platformFromReleaseURL} from './verifiedDiscography.mjs';

const credits=r=>new Set((r.artists?.length?r.artists.flatMap(a=>splitArtists(typeof a==='string'?a:a.name)):splitArtists(r.artist_name||r.artist||'')).map(a=>identity.slugify(a.name)));
const title=r=>identity.slugify(editions.editionTitle(r.name||r.album_name).name,true);
const kind=r=>/^(SINGLE|SENCILLO|TRACK)$/.test(r.release_type)?'SENCILLO':r.release_type||'ALBUM';
export function compatibleDiscographyRelease(a,b){
 const names=credits(a),other=credits(b);
 // A service link is evidence only after the title, credit and edition agree.
 if(title(a)!==title(b)||kind(a)!==kind(b)||![...names].some(n=>other.has(n)))return false;
 const ac=Number(a.totalTracks||a.total_tracks||a.tracks?.length),bc=Number(b.totalTracks||b.total_tracks||b.tracks?.length);
 return !(ac&&bc&&ac!==bc);
}
export function attachClubReleases(external=[],albums=[]){
 const rows=external.map(r=>({...r}));
 for(const album of albums){
  const matches=rows.filter(r=>compatibleDiscographyRelease(r,album));
  const links=[album.spotify_link,album.apple_music_link,album.other_link].map(platformFromReleaseURL).filter(Boolean);
  const match=matches.find(r=>(r.sources||[]).some(s=>links.some(l=>s.provider===l.provider&&String(s.id)===l.id)))||(matches.length===1?matches[0]:null);
  if(match){
   Object.assign(match,{clubAlbumId:album.id,genres:album.genres||match.genres});
   // Spotify's edition artwork and count take precedence over local fallbacks.
   if(!(match.sources||[]).some(s=>s.provider==='SPOTIFY')){match.image=album.image_url||match.image;match.totalTracks=album.total_tracks||album.tracks?.length||match.totalTracks;}
   for(const field of ['spotify_link','apple_music_link','other_link','mbid'])if(album[field])match[field]=album[field];
  }else rows.push({...album,name:album.album_name,artists:[album.artist_name],image:album.image_url,releaseYear:album.release_year,releaseDate:album.release_date||'',totalTracks:album.total_tracks||album.tracks?.length,clubAlbumId:album.id});
 }
 return rows;
}
