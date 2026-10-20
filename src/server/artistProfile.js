import 'server-only';
import { after } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { readStoredArtist, refreshStoredArtist } from '../services/artistDiscographyStore.mjs';

export async function getStoredArtistProfile(db,slug,name) {
  const stored=await readStoredArtist(db,slug);
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  // The response only waits for a database read, never for streaming providers.
  if(key && name && (!stored || Date.parse(stored.refresh_after)<=Date.now())) {
    after(async()=>{
      try {
        const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL,key,
          {auth:{persistSession:false,autoRefreshToken:false}});
        await refreshStoredArtist(admin,slug,name);
      } catch { console.warn('La discografía se conserva; se reintentará su actualización.'); }
    });
  }
  return stored?.profile?.discography?.length ? stored.profile : null;
}
