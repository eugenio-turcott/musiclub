import {createClient} from '@supabase/supabase-js';
import {writeFile} from 'node:fs/promises';
import {repairOfficialMetadata} from '../src/services/officialArtistCatalog.mjs';
const url=process.env.REACT_APP_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url || !key) throw Error('Falta la configuración privada del mantenimiento');
const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const selected=(process.env.ARTIST_SLUGS || '').split(',').map(value=>value.trim()).filter(Boolean);
const report={checkedAt:new Date().toISOString(),artists:[],repaired:0,unavailable:0,conflicts:0};
for(let offset=0;;offset+=50) {
 const {data,error}=await db.from('artist_discographies').select('slug,profile,providers,updated_at,lease_until').order('slug').range(offset,offset+49);
 if(error) throw Error('No se pudieron leer las discografías guardadas');
 for(const row of data) {
  if(selected.length && !selected.includes(row.slug)) continue;
  const releases=row.profile?.discography || [];
  if(!releases.length || (row.lease_until && Date.parse(row.lease_until)>Date.now())) continue;
  const result=await repairOfficialMetadata(row.profile);
  const providers={...row.providers};
  if(providers.DEEZER && result.profile.discography.some(release=>release.sources?.some(source=>source.provider==='DEEZER') && (!release.totalTracks || !release.image))) providers.DEEZER={...providers.DEEZER,status:'partial'};
  const changed=JSON.stringify(result.profile.discography)!==JSON.stringify(releases) || JSON.stringify(providers)!==JSON.stringify(row.providers);
  let saved=false;
  if(changed) {
   result.profile.providers=providers;
   const update=await db.from('artist_discographies').update({profile:result.profile,providers,updated_at:new Date().toISOString()}).eq('slug',row.slug).eq('updated_at',row.updated_at).select('slug');
   if(update.error) throw Error('No se pudo guardar la reparación');
   saved=!!update.data?.length;if(!saved)report.conflicts++;
  }
  report.repaired+=saved ? result.repaired : 0;report.unavailable+=result.unavailable;
  report.artists.push({slug:row.slug,releases:result.profile.discography.length,repaired:saved?result.repaired:0,unavailable:result.unavailable,saved});
  console.log(`${row.slug}: ${saved?result.repaired:0} metadatos recuperados, ${result.unavailable} no disponibles`);
 }
 if(data.length<50) break;
}
await writeFile('artist-metadata-report.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({repaired:report.repaired,unavailable:report.unavailable,conflicts:report.conflicts}));
