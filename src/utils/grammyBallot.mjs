import {GRAMMY_CATEGORIES,GRAMMY_EVENT} from '../data/grammys2027.mjs';
const categoryIds=new Set(GRAMMY_CATEGORIES.map(c=>c.id));
export function normalizeGrammyNominee(row){
 if(!categoryIds.has(row?.categoryId))throw new Error('Categoría no válida');
 const title=String(row.title||'').trim(),artist=String(row.artist||'').trim();
 if(!title||title.length>300||artist.length>500)throw new Error('Revisa el título y el artista');
 const url=(value,hosts)=>{if(!value)return null;const parsed=new URL(value);if(parsed.protocol!=='https:'||(hosts&&!hosts.some(h=>parsed.hostname===h||parsed.hostname.endsWith('.'+h))))throw new Error('Usa enlaces HTTPS de la plataforma correspondiente');return parsed.href;};
 const albumId=row.albumId||null;if(albumId&&!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(albumId))throw new Error('El ID del release debe ser válido');
 return {event_id:GRAMMY_EVENT.id,category_id:row.categoryId,title,artist,image_url:url(row.imageUrl),album_id:albumId,spotify_url:url(row.spotifyUrl,['spotify.com']),apple_music_url:url(row.appleMusicUrl,['music.apple.com']),youtube_url:url(row.youtubeUrl,['youtube.com','youtu.be']),deezer_url:url(row.deezerUrl,['deezer.com'])};
}
export function readyGrammyCategories(nominees){const counts=new Map();for(const row of nominees)counts.set(row.category_id,(counts.get(row.category_id)||0)+1);return GRAMMY_CATEGORIES.filter(c=>(counts.get(c.id)||0)>=2).length;}
