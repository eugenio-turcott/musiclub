import {NextResponse} from 'next/server';
import {revalidateTag} from 'next/cache';
import {authorize} from '../../../../server/authorize';
import {grammyDb} from '../../../../server/grammys';
import {readGrammyAdmin,searchGrammyReleases,mutateGrammyAdmin} from '../../../../server/grammyAdmin.mjs';

export const dynamic='force-dynamic';
export const runtime='nodejs';
const headers={'Cache-Control':'private, no-store'};

export async function GET(request){
 const auth=await authorize(request,{admin:true});if(auth.error)return auth.error;
 try{
  const query=new URL(request.url).searchParams.get('releaseQuery'),db=grammyDb(true);
  return NextResponse.json(query!==null?{releases:await searchGrammyReleases(db,query)}:await readGrammyAdmin(db),{headers});
 }catch(error){return NextResponse.json({error:error.message||'No pudimos cargar los Grammy'},{status:error.status||503,headers});}
}
export async function POST(request){
 const auth=await authorize(request,{admin:true});if(auth.error)return auth.error;
 try{
  const result=await mutateGrammyAdmin(grammyDb(true),await request.json());
  revalidateTag('grammys-2027',{expire:0});
  return NextResponse.json({success:true,...result},{headers});
 }catch(error){return NextResponse.json({error:error.message||'No se pudo guardar'},{status:error.status||400,headers});}
}
