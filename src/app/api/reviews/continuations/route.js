import {NextResponse} from 'next/server';
import {authorize} from '../../../../server/authorize';
import {getPublicCatalog} from '../../../../server/catalog';
import {reviewContinuations} from '../../../../utils/reviewContinuations.mjs';
async function ownReviews(db,email){
 const rows=[];
 for(let from=0;;from+=500){
  const {data,error}=await db.from('reviews').select('id,album_id,track_ratings,created_at').ilike('reviewer_email',email).order('id').range(from,from+499);
  if(error)throw error;
  rows.push(...(data||[]));
  if(!data||data.length<500)return rows;
 }
}
export async function GET(request){
 const auth=await authorize(request);if(auth.error)return auth.error;
 try{
  const email=auth.user.email?.replace(/[\\%_]/g,'\\$&');if(!email)return NextResponse.json({continuations:[]});
  const [data,catalog]=await Promise.all([ownReviews(auth.db,email),getPublicCatalog()]);
  return NextResponse.json({continuations:reviewContinuations(catalog.albums,data,{targetId:new URL(request.url).searchParams.get('albumId')||undefined})},{headers:{'Cache-Control':'private, no-store'}});
 }catch{return NextResponse.json({error:'No se pudieron recuperar tus canciones calificadas.'},{status:503});}
}
