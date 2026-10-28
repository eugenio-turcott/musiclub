import fs from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';
import {createClient} from '@supabase/supabase-js';
import tracks from '../src/utils/releaseTracks.cjs';
dotenv.config({path:'.env.local',quiet:true});
dotenv.config({path:'.env',quiet:true});
const url=process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
if(!url || !key) throw new Error('Falta la configuración pública de Supabase');
const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
async function rows(table,fields='*') {
 const all=[];
 for(let offset=0;;offset+=500){const {data,error}=await db.from(table).select(fields).order('id').range(offset,offset+499);if(error)throw new Error(`${table}: ${error.message}`);all.push(...data);if(data.length<500)return all;}
}
const tables={};
for(const table of ['albums','record_club_releases','record_club_upcoming']) tables[table]=await rows(table,table==='albums'?'id,album_name,artist_name,tracks,total_tracks,release_date,release_year,release_type,spotify_link,apple_music_link,other_link,mbid':'*');
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Mexico_City',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const report={date:today,counts:{},issues:[]};
for(const [table,rows] of Object.entries(tables)){
 report.counts[table]=rows.length;
 if(table==='record_club_releases') {
   // Trend rows have no tracks column; each published trend must resolve to the catalogue.
   const identity=row=>`${tracks.providerTitleKey(row.artist_name)}|${tracks.providerTitleKey(row.album_name)}`;
   const canonical=new Set(tables.albums.map(identity));
   for(const row of rows){if(String(row.release_date || '').slice(0,10)>today || canonical.has(identity(row)))continue;report.issues.push({table,id:row.id,album:row.album_name,artist:row.artist_name,issues:['missing_catalog_release']});}
   continue;
 }
 for(const row of rows){const issues=tracks.tracklistIssues(row,today);if(!issues.length)continue;report.issues.push({table,id:row.id,album:row.album_name,artist:row.artist_name,date:row.release_date,total:row.total_tracks,count:row.tracks?.length || 0,issues});}
}
const dir=path.resolve('outputs/v10-track-audit');await fs.mkdir(dir,{recursive:true});
const suffix=process.argv.includes('--after')?'after':new Date().toISOString().replace(/[:.]/g,'-');
await fs.writeFile(path.join(dir,`audit-${suffix}.json`),JSON.stringify(report,null,2));
await fs.writeFile(path.join(dir,`catalog-${suffix}.json`),JSON.stringify(tables,null,2));
console.log(JSON.stringify(report,null,2));
