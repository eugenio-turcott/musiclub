import {GRAMMY_CATEGORIES,GRAMMY_EVENT} from '../data/grammys2027.mjs';
const categoryIds=new Set(GRAMMY_CATEGORIES.map(c=>c.id));
export function normalizeGrammyNominee(row){
 if(!categoryIds.has(row?.categoryId))throw new Error('Categoría no válida');
 const title=String(row.title||'').trim(),artist=String(row.artist||'').trim();
 if(!title||title.length>300||artist.length>500)throw new Error('Revisa el título y el artista');
 const url=(value,hosts)=>{if(!value)return null;const parsed=new URL(value);if(parsed.protocol!=='https:'||parsed.username||parsed.password||(hosts&&!hosts.some(h=>parsed.hostname===h||parsed.hostname.endsWith('.'+h))))throw new Error('Usa enlaces HTTPS de la plataforma correspondiente, sin credenciales');return parsed.href;};
 const albumId=row.albumId||null;if(albumId&&!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(albumId))throw new Error('El ID del release debe ser válido');
 return {event_id:GRAMMY_EVENT.id,category_id:row.categoryId,title,artist,image_url:url(row.imageUrl),album_id:albumId,spotify_url:url(row.spotifyUrl,['spotify.com']),apple_music_url:url(row.appleMusicUrl,['music.apple.com']),youtube_url:url(row.youtubeUrl,['youtube.com','youtu.be']),deezer_url:url(row.deezerUrl,['deezer.com'])};
}
export function readyGrammyCategories(nominees){const counts=new Map();for(const row of nominees)counts.set(row.category_id,(counts.get(row.category_id)||0)+1);return GRAMMY_CATEGORIES.filter(c=>(counts.get(c.id)||0)>=2).length;}

export function grammyNomineeInput(row){
 return {id:row.id,categoryId:row.category_id,title:row.title,artist:row.artist||'',imageUrl:row.image_url||'',albumId:row.album_id||'',spotifyUrl:row.spotify_url||'',appleMusicUrl:row.apple_music_url||'',youtubeUrl:row.youtube_url||'',deezerUrl:row.deezer_url||''};
}

export function validGrammyId(id){return typeof id==='string'&&/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id);}

export function grammyOfficialSource(value){
 let source;
 try{source=new URL(value);}catch{throw new Error('Indica la fuente oficial en Grammy.com');}
 if(source.protocol!=='https:'||source.username||source.password||!['www.grammy.com','grammy.com'].includes(source.hostname))throw new Error('Indica la fuente oficial en Grammy.com');
 return source.href;
}

export function normalizeGrammyEvent(row){
 const nominations=Date.parse(row?.nominationsAt),closes=Date.parse(row?.closesAt);
 if(!Number.isFinite(nominations)||!Number.isFinite(closes)||closes<=nominations)throw new Error('El cierre debe ser posterior al anuncio de nominaciones');
 return {nominations_at:new Date(nominations).toISOString(),closes_at:new Date(closes).toISOString(),source_url:grammyOfficialSource(row.source)};
}

export function mergeGrammyCategories(rows=[]){
 const names=new Map(rows.map(row=>[row.id,row.name]));
 return GRAMMY_CATEGORIES.map(category=>({...category,name:names.get(category.id)||category.name}));
}
