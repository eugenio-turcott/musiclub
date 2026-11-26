import {NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {revalidateTag} from 'next/cache';
import {ensureArtworkPalette} from '../../../server/artworkPalette.mjs';
import {allowRequest} from '../../../server/rateLimit';
export async function GET(request){
 const params=new URL(request.url).searchParams,entity=params.get('entity'),id=params.get('id');
 if(!['album','artist'].includes(entity)||!id||id.length>140||!/^[\p{L}\p{N}-]+$/u.test(id))return NextResponse.json({error:'Imagen no disponible'},{status:400});
 const ip=request.headers.get('cf-connecting-ip')||request.headers.get('x-forwarded-for')?.split(',')[0]||'unknown';
 if(!allowRequest(`artwork:${ip}`,30))return NextResponse.json({error:'Intenta de nuevo en un momento'},{status:429});
 try{
  const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL||process.env.REACT_APP_SUPABASE_URL||process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  const palette=await ensureArtworkPalette(db,entity,id);
  if(palette.changed)revalidateTag('catalog',{expire:0});
  return NextResponse.json(palette,{headers:{'Cache-Control':'public, s-maxage=60'}});
 }catch{return NextResponse.json({error:'Los colores se completarán automáticamente.'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
