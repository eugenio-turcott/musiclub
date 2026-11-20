import {NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {revalidatePath,revalidateTag} from 'next/cache';
import {authorize} from '../../../../server/authorize';
import {processGenreEnrichment} from '../../../../services/genreEnrichment.mjs';
import catalog from '../../../../utils/genreCatalog.cjs';
import identity from '../../../../utils/releaseIdentity.cjs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
const serviceDb=()=>createClient(process.env.NEXT_PUBLIC_SUPABASE_URL||process.env.REACT_APP_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.REACT_APP_SUPABASE_SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const invalidate=album=>{revalidateTag('catalog',{expire:0});const path=identity.releasePath(album);if(path)revalidatePath(path);};
export async function GET(request){
 const auth=await authorize(request,{admin:true});if(auth.error)return auth.error;
 try{
  const url=new URL(request.url),offset=Math.max(0,Math.min(100000,Number(url.searchParams.get('offset'))||0));
  const {data,count,error}=await auth.db.from('albums').select('id,album_name,artist_name,image_url,release_type,spotify_link,apple_music_link,other_link,genre_retry_count,genre_retry_at',{count:'exact'}).eq('genres','{}').order('created_at',{ascending:false}).range(offset,offset+24);
  if(error)throw error;return NextResponse.json({total:count||0,albums:data||[],offset},{headers});
 }catch{return NextResponse.json({error:'No pudimos consultar los géneros pendientes.'},{status:503,headers});}
}
export async function POST(request){
 const auth=await authorize(request,{admin:true,cron:true});if(auth.error)return auth.error;
 try{
  const body=await request.json().catch(()=>({})),id=body.albumId;
  if(id&&!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id))return NextResponse.json({error:'Release no válido.'},{status:400,headers});
  const db=auth.cron?serviceDb():auth.db;
  if(body.action==='assign'){
   if(auth.cron)return NextResponse.json({error:'Acción no disponible.'},{status:403,headers});
   const genres=catalog.normalizeGenres(body.genres);
   if(!id||!genres.length)return NextResponse.json({error:'Selecciona al menos un género reconocido.'},{status:400,headers});
   const saved=await db.from('albums').update({genres,genre_retry_count:0}).eq('id',id).select('id,album_name,artist_name,release_type').single();
   if(saved.error)throw saved.error;invalidate(saved.data);return NextResponse.json({success:true},{headers});
  }
  if(body.action==='retry'){
   if(auth.cron||!id)return NextResponse.json({error:'Acción no disponible.'},{status:400,headers});
   const reset=await db.from('albums').update({genre_retry_at:new Date().toISOString()}).eq('id',id).eq('genres','{}');if(reset.error)throw reset.error;
  }else if(body.action&&body.action!=='process')return NextResponse.json({error:'Acción no válida.'},{status:400,headers});
  return NextResponse.json(await processGenreEnrichment(db,{albumId:id,onResolved:invalidate}),{headers});
 }catch{return NextResponse.json({error:'La comprobación no terminó. Los releases siguen disponibles y conservan su próximo reintento.'},{status:503,headers});}
}
