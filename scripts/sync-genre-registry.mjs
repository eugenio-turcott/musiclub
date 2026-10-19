import {createClient} from '@supabase/supabase-js';
import catalog from '../src/utils/genreCatalog.cjs';
const url = process.env.REACT_APP_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Missing server-side Supabase configuration');
const db = createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
for (let start=0; start<catalog.GENRES.length; start+=100) {
  const rows = catalog.GENRES.slice(start,start+100).map(({id,name}) => ({id,name}));
  const {error} = await db.from('musiclub_genre_registry').upsert(rows,{onConflict:'id'});
  if(error) throw new Error(`Genre registry sync failed (${error.code || 'unknown'}). Apply the extensible genre registry migration first.`);
}
console.log(`Synchronized ${catalog.GENRES.length} verified genre labels. Existing entries are preserved.`);
