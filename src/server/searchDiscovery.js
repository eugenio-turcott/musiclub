import 'server-only';
import {createClient} from '@supabase/supabase-js';
import {revalidateTag,revalidatePath} from 'next/cache';
import {getPublicCatalog} from './catalog';
import {processSearchDiscovery,readDiscoveryPublic} from '../services/searchDiscovery.mjs';
export function discoveryDb(){return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL||process.env.REACT_APP_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.REACT_APP_SUPABASE_SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});}
export async function runSearchDiscovery(db=discoveryDb()){
 let fetcher=fetch;
 if(process.env.CLOUDFLARE_DEPLOYMENT==='1'){const {getCloudflareContext}=await import('@opennextjs/cloudflare');const service=getCloudflareContext().env.WORKER_SELF_REFERENCE;fetcher=request=>service.fetch(request);}
 return processSearchDiscovery(db,{readPublic:path=>readDiscoveryPublic(path,fetcher),refresh:async()=>{revalidateTag('catalog',{expire:0});return getPublicCatalog();},invalidate:paths=>{for(const path of paths)revalidatePath(path);}});
}
