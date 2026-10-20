import { createClient } from '@supabase/supabase-js';
import identity from '../src/utils/releaseIdentity.cjs';
import { splitArtists } from '../src/utils/ratingUtils.js';
import { refreshStoredArtist } from '../src/services/artistDiscographyStore.mjs';
const url=process.env.REACT_APP_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url || !key) throw new Error('Falta la configuración privada del mantenimiento');
const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const names=new Map();
for(let offset=0;;offset+=500) {
 const {data,error}=await db.from('albums').select('artist_name').range(offset,offset+499);
 if(error) throw new Error('No se pudieron leer los artistas del club');
 for(const row of data) for(const {name,slug} of splitArtists(row.artist_name)) names.set(slug,name);
 if(data.length<500) break;
}
const selected=(process.env.ARTIST_SLUGS || '').split(',').map(s=>s.trim()).filter(Boolean);
let failed=0,updated=0;
for(const [slug,name] of [...names].sort(([a],[b])=>a.localeCompare(b))) {
 if(selected.length && !selected.includes(slug)) continue;
 try {const result=await refreshStoredArtist(db,slug,name);if(result.success)updated++;console.log(`${slug}: ${result.skipped?'vigente':result.success?`${result.count} releases guardados`:'fuentes temporalmente no disponibles'}`);}
 catch {failed++;console.error(`${slug}: no se pudo guardar la actualización`);}
 await new Promise(resolve=>setTimeout(resolve,6500)); // Apple public API: avoid bursts.
}
console.log(`Discografías guardadas: ${updated}. Errores de almacenamiento: ${failed}.`);
if(failed) process.exitCode=1;
