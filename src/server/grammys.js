import 'server-only';
import {createClient} from '@supabase/supabase-js';
import {unstable_cache} from 'next/cache';
import {GRAMMY_EVENT} from '../data/grammys2027.mjs';
export function grammyDb(service=false){return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL||process.env.REACT_APP_SUPABASE_URL,service?(process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.REACT_APP_SUPABASE_SERVICE_KEY):(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||process.env.REACT_APP_SUPABASE_ANON_KEY),{auth:{persistSession:false,autoRefreshToken:false}});}
export const getGrammyState=unstable_cache(async()=>{
 const db=grammyDb();const [event,nominees]=await Promise.all([db.from('grammy_events').select('id,status,published_at,source_url').eq('id',GRAMMY_EVENT.id).single(),db.from('grammy_nominees').select('*,albums(id,album_name,artist_name,release_type)').eq('event_id',GRAMMY_EVENT.id).order('title')]);
 if(event.error||nominees.error)throw new Error('No pudimos consultar la actividad Grammy');
 return {event:event.data,nominees:nominees.data||[]};
},['grammys-2027-v12'],{revalidate:60,tags:['grammys-2027']});
