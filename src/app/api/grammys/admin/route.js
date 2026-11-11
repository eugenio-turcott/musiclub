import {NextResponse} from 'next/server';
import {createHash} from 'node:crypto';
import {revalidateTag} from 'next/cache';
import {authorize} from '../../../../server/authorize';
import {grammyDb} from '../../../../server/grammys';
import {GRAMMY_EVENT} from '../../../../data/grammys2027.mjs';
import {normalizeGrammyNominee,readyGrammyCategories} from '../../../../utils/grammyBallot.mjs';
export const dynamic='force-dynamic';
export async function POST(request){
 const auth=await authorize(request,{admin:true});if(auth.error)return auth.error;
 try{const body=await request.json(),db=grammyDb(true);
  if(body.action==='import'){
   if(!Array.isArray(body.nominees)||!body.nominees.length||body.nominees.length>1000)throw new Error('Importa entre 1 y 1.000 nominados');
   const rows=body.nominees.map(normalizeGrammyNominee).map(row=>{const hash=createHash('sha256').update([row.event_id,row.category_id,row.title.toLowerCase(),row.artist.toLowerCase()].join('|')).digest('hex');return {...row,id:`${hash.slice(0,8)}-${hash.slice(8,12)}-4${hash.slice(13,16)}-8${hash.slice(17,20)}-${hash.slice(20,32)}`};});
   const saved=await db.from('grammy_nominees').upsert(rows,{onConflict:'id'});if(saved.error)throw new Error('No se pudo importar el lote');
  }else if(body.action==='publish'){
   if(Date.now()<Date.parse(GRAMMY_EVENT.nomineeListAt))throw new Error('Espera al anuncio oficial del 16 de noviembre');
   const source=new URL(body.source||'');if(source.protocol!=='https:'||!['www.grammy.com','grammy.com'].includes(source.hostname))throw new Error('Indica la fuente oficial en Grammy.com');
   const nominees=await db.from('grammy_nominees').select('category_id').eq('event_id',GRAMMY_EVENT.id);
   if(nominees.error||readyGrammyCategories(nominees.data||[])!==100)throw new Error('Completa y revisa las 100 categorías antes de abrir');
   const saved=await db.from('grammy_events').update({status:'open',published_at:new Date().toISOString(),source_url:source.href}).eq('id',GRAMMY_EVENT.id);if(saved.error)throw new Error('No se pudo abrir la actividad');
  }else throw new Error('Acción no válida');
  revalidateTag('grammys-2027',{expire:0});return NextResponse.json({success:true});
 }catch(error){return NextResponse.json({error:error.message||'No se pudo guardar'},{status:400});}
}
