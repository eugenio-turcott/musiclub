import { createClient } from '@supabase/supabase-js';
import identity from '../src/utils/releaseIdentity.cjs';
import { splitArtists } from '../src/utils/ratingUtils.js';
import { refreshStoredArtist } from '../src/services/artistDiscographyStore.mjs';
import queue from '../src/utils/artistRefreshQueue.cjs';
const url=process.env.REACT_APP_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url || !key) throw new Error('Falta la configuración privada del mantenimiento');
const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const names=new Map();
for(let offset=0;;offset+=500) {
 const {data,error}=await db.from('albums').select('artist_name').order('id').range(offset,offset+499);
 if(error) throw new Error('No se pudieron leer los artistas del club');
 for(const row of data) for(const {name,slug} of splitArtists(row.artist_name)) names.set(slug,name);
 if(data.length<500) break;
}
const upcoming=await db.from('record_club_upcoming').select('artist_name,artist_slug');
if(upcoming.error) throw new Error('No se pudieron leer los artistas de próximos estrenos');
for(const row of upcoming.data || []) if(row.artist_name) names.set(row.artist_slug || identity.slugify(row.artist_name),row.artist_name);
const selected=(process.env.ARTIST_SLUGS || '').split(',').map(s=>s.trim()).filter(Boolean);
for(const slug of selected) if(!names.has(slug)) throw new Error(`Artista no encontrado en el club: ${slug}`);
let failed=0,updated=0;
const stored=[];
for(let offset=0;;offset+=500){
 const {data,error}=await db.from('artist_discographies').select('slug,refresh_after,lease_until').order('slug').range(offset,offset+499);
 if(error)throw new Error('No se pudo leer la cola de discografías');
 stored.push(...data);if(data.length<500)break;
}
const {batch,pending}=queue.artistRefreshBatch(names,stored,{selected,limit:process.env.ARTIST_REFRESH_LIMIT});
const started=Date.now(),budget=Math.max(60000,Math.min(1800000,Number(process.env.ARTIST_REFRESH_BUDGET_MS)||1200000));
console.log(`Discografías pendientes: ${pending}. Lote: ${batch.length}.`);
for(const [slug,name] of batch) {
 if(Date.now()-started>=budget){console.log('Presupuesto del lote alcanzado; el siguiente lote retomará los pendientes más antiguos.');break;}
 try {const result=await refreshStoredArtist(db,slug,name);if(result.success)updated++;console.log(`${slug}: ${result.skipped?'vigente':result.success?`${result.count} releases guardados`:'fuentes temporalmente no disponibles'}`);if(result.skipped)continue;}
 catch {failed++;console.error(`${slug}: no se pudo guardar la actualización`);}
 await new Promise(resolve=>setTimeout(resolve,6500)); // Apple public API: avoid bursts.
}
console.log(`Discografías guardadas: ${updated}. Errores de almacenamiento: ${failed}.`);
if(failed) process.exitCode=1;
