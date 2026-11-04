import 'server-only';
import {getPublicCatalog} from './catalog';
import {buildTourExamples} from '../utils/tourExamples.mjs';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL||process.env.REACT_APP_SUPABASE_URL;
const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||process.env.REACT_APP_SUPABASE_ANON_KEY;
// These are public RLS reads; no session or service-role credential enters the guide.
async function publicRows(table,query){
 try{const response=await fetch(`${url}/rest/v1/${table}?${query}`,{headers:{apikey:key,Authorization:`Bearer ${key}`},next:{revalidate:300,tags:['catalog']},signal:AbortSignal.timeout(5000)});return response.ok?await response.json():[];}catch{return [];}
}
export async function getTourExamples(){
 const today=new Date().toISOString().slice(0,10);
 const [catalog,upcoming,rooms,playlists]=await Promise.all([getPublicCatalog(),publicRows('record_club_upcoming',`select=id,album_name,artist_name,image_url,release_date&release_date=gt.${today}&order=release_date.asc&limit=30`),publicRows('pool_rooms','select=id,name,description,visibility&visibility=eq.public&order=created_at.asc&limit=8'),publicRows('playlists','select=id,title,curator_name,image_url,genre_or_mood&order=created_at.desc&limit=3')]);
 const seasons=rooms.length?await publicRows('seasons',`select=id,room_id,name,description,is_active,is_open,season_number,appearance&room_id=in.(${rooms.map(r=>r.id).join(',')})&order=is_active.desc,season_number.desc&limit=16`):[];
 return buildTourExamples({...catalog,albums:[...catalog.albums,...upcoming]},{rooms,seasons,playlists});
}
