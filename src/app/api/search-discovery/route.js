import {NextResponse} from 'next/server';
import {authorize} from '../../../server/authorize';
import {discoveryDb,runSearchDiscovery} from '../../../server/searchDiscovery';
export const dynamic='force-dynamic';
export const runtime='nodejs';
const headers={'Cache-Control':'private, no-store'};
export async function GET(request){
 const auth=await authorize(request,{admin:true});if(auth.error)return auth.error;
 try{const {data,error}=await discoveryDb().rpc('musiclub_search_discovery_status');if(error)throw error;return NextResponse.json(data,{headers});}
 catch{return NextResponse.json({error:'No pudimos consultar las comprobaciones.'},{status:503,headers});}
}
export async function POST(request){
 const auth=await authorize(request,{admin:true,cron:true});if(auth.error)return auth.error;
 try{
  const body=await request.json().catch(()=>({})),db=discoveryDb();
  if(body.action==='retry'){if(auth.cron)return NextResponse.json({error:'Acción no disponible'},{status:403,headers});const retried=await db.rpc('musiclub_retry_search_discovery');if(retried.error)throw retried.error;}
  else if(body.action&&body.action!=='process')return NextResponse.json({error:'Acción no válida'},{status:400,headers});
  return NextResponse.json(await runSearchDiscovery(db),{headers});
 }catch{return NextResponse.json({error:'No se pudo completar el lote. Los pendientes conservan su registro y volverán a comprobarse.'},{status:503,headers});}
}
