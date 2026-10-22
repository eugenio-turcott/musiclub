import 'server-only';
import { after } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { loadStoredArtist, refreshStoredArtist, repairStoredArtistName } from '../services/artistDiscographyStore.mjs';
import { allowRequest } from './rateLimit';

export async function getStoredArtistProfile(db,slug,name,hasLocal=false) {
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  const valid=typeof slug==='string' && slug.length>=2 && slug.length<=120 && /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u.test(slug);
  const requestHeaders=await headers();
  const ip=requestHeaders.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const refresh=async()=>{
    if(!allowRequest(`artist-discovery:${ip}`,10)) return;
    try {
      const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL,key,
        {auth:{persistSession:false,autoRefreshToken:false}});
      await refreshStoredArtist(admin,slug,name);
    } catch {console.warn('La discografía se conserva; se reintentará su actualización.');}
  };
  return loadStoredArtist(db,slug,{hasLocal,canDiscover:!!key && valid && !!name,refresh,
    repairName:async()=>{
      try {
        const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL,key,{auth:{persistSession:false,autoRefreshToken:false}});
        await repairStoredArtistName(admin,slug);
      } catch {console.warn('Se reintentará guardar el nombre oficial del artista.');}
    },
    schedule:task=>after(task)});
}
