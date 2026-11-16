import {createHash,randomUUID} from 'node:crypto';
import {GRAMMY_EVENT,GRAMMY_CATEGORIES} from '../data/grammys2027.mjs';
import {normalizeGrammyNominee,normalizeGrammyEvent,grammyOfficialSource,validGrammyId,readyGrammyCategories} from '../utils/grammyBallot.mjs';

const eventId=GRAMMY_EVENT.id;
export class GrammyAdminError extends Error {
 constructor(message,status=400){super(message);this.status=status;}
}
function databaseError(error,message){
 if(error?.code==='23503')throw new GrammyAdminError('El nominado tiene predicciones o resultados asociados, o el release ya no existe. Actualiza el panel antes de continuar.',409);
 if(error)throw new GrammyAdminError(message,503);
}
async function eventState(db){
 const result=await db.from('grammy_events').select('*').eq('id',eventId).single();
 databaseError(result.error,'No pudimos consultar la actividad');
 if(!result.data)throw new GrammyAdminError('No se encontró la actividad',404);
 return result.data;
}
async function existingNominee(db,id){
 if(!validGrammyId(id))throw new GrammyAdminError('El ID del nominado no es válido');
 const result=await db.from('grammy_nominees').select('id,category_id').eq('id',id).eq('event_id',eventId).maybeSingle();
 databaseError(result.error,'No pudimos consultar el nominado');
 if(!result.data)throw new GrammyAdminError('No se encontró el nominado. Actualiza el panel.',404);
 return result.data;
}
async function validateAlbum(db,id){
 if(!id)return;
 const result=await db.from('albums').select('id').eq('id',id).maybeSingle();
 databaseError(result.error,'No pudimos verificar el release');
 if(!result.data)throw new GrammyAdminError('El release asociado no existe en el catálogo');
}
export async function readGrammyAdmin(db){
 const [event,nominees,categories]=await Promise.all([
  eventState(db),
  db.from('grammy_nominees').select('*,albums(id,album_name,artist_name,release_type)').eq('event_id',eventId).order('title').limit(1000),
  db.from('grammy_categories').select('id,name,field_id').order('name'),
 ]);
 databaseError(nominees.error||categories.error,'No pudimos cargar la administración de los Grammy');
 return {event,nominees:nominees.data||[],categories:categories.data||[]};
}
export async function searchGrammyReleases(db,query){
 const term=String(query||'').trim();
 if(term.length<2)return [];
 if(term.length>120)throw new GrammyAdminError('Busca un título de hasta 120 caracteres');
 const result=await db.from('albums').select('id,album_name,artist_name,image_url,spotify_link,apple_music_link,youtube_link,other_link,release_type').ilike('album_name','%'+term.replace(/[\\%_]/g,'\\$&')+'%').order('album_name').limit(15);
 databaseError(result.error,'No pudimos buscar en el catálogo');
 return result.data||[];
}
export async function mutateGrammyAdmin(db,body,{now=Date.now()}={}){
 if(body?.action==='save-nominee'){
  const row=normalizeGrammyNominee(body.nominee);
  await validateAlbum(db,row.album_id);
  if(body.nominee.id){
   const existing=await existingNominee(db,body.nominee.id);
   if(existing.category_id!==row.category_id){
    const event=await eventState(db);
    if(event.published_at)throw new GrammyAdminError('Las categorías de los nominados publicados no se pueden cambiar. Corrige sus datos dentro de la categoría actual.',409);
   }
   // Keep the UUID so title, artwork and link corrections preserve every ballot.
   const result=await db.from('grammy_nominees').update(row).eq('id',existing.id).eq('event_id',eventId).select('id').maybeSingle();
   databaseError(result.error,'No se pudo actualizar el nominado');
   if(!result.data)throw new GrammyAdminError('El nominado ya no existe. Actualiza el panel.',409);
   return {id:existing.id};
  }
  const id=randomUUID(),result=await db.from('grammy_nominees').insert({...row,id});
  databaseError(result.error,'No se pudo añadir el nominado');
  return {id};
 }
 if(body?.action==='delete-nominee'){
  const existing=await existingNominee(db,body.nomineeId),event=await eventState(db);
  if(event.published_at){
   const count=await db.from('grammy_nominees').select('id',{count:'exact',head:true}).eq('event_id',eventId).eq('category_id',existing.category_id);
   databaseError(count.error,'No pudimos revisar la categoría');
   if(count.count<=2)throw new GrammyAdminError('Una categoría publicada debe conservar al menos dos nominados.',409);
  }
  const result=await db.from('grammy_nominees').delete().eq('id',existing.id).eq('event_id',eventId).select('id').maybeSingle();
  databaseError(result.error,'No se pudo eliminar el nominado');
  if(!result.data)throw new GrammyAdminError('El nominado ya no existe. Actualiza el panel.',409);
  return {};
 }
 if(body?.action==='save-category'){
  const name=String(body.category?.name||'').trim(),id=body.category?.id;
  if(!GRAMMY_CATEGORIES.some(c=>c.id===id)||!name||name.length>200)throw new GrammyAdminError('Revisa el nombre de la categoría');
  const result=await db.from('grammy_categories').update({name}).eq('id',id).select('id').maybeSingle();
  databaseError(result.error,'No se pudo guardar la categoría');
  if(!result.data)throw new GrammyAdminError('No se encontró la categoría',404);
  return {};
 }
 if(body?.action==='save-event'){
  const row=normalizeGrammyEvent(body.event),event=await eventState(db);
  const results=await db.from('grammy_results').select('category_id').eq('event_id',eventId).limit(1);
  databaseError(results.error,'No pudimos verificar los resultados');
  if(results.data?.length&&(Date.parse(row.closes_at)!==Date.parse(event.closes_at)||Date.parse(row.nominations_at)!==Date.parse(event.nominations_at)))throw new GrammyAdminError('La actividad ya tiene ganadores verificados. Sus fechas no se pueden modificar.',409);
  const result=await db.from('grammy_events').update(row).eq('id',eventId);
  databaseError(result.error,'No se pudo guardar la configuración');return {};
 }
 if(body?.action==='close'){
  const event=await eventState(db);
  if(!event.published_at)throw new GrammyAdminError('Publica los nominados antes de cerrar las predicciones');
  const result=await db.from('grammy_events').update({status:'closed'}).eq('id',eventId);
  databaseError(result.error,'No se pudieron cerrar las predicciones');return {};
 }
 if(body?.action==='import'){
  if(!Array.isArray(body.nominees)||!body.nominees.length||body.nominees.length>1000)throw new GrammyAdminError('Importa entre 1 y 1.000 nominados');
  const event=await eventState(db);
  if(event.published_at)throw new GrammyAdminError('La actividad ya está publicada. Edita los nominados desde el panel para conservar las predicciones.',409);
  const rows=body.nominees.map(input=>{
   const row=normalizeGrammyNominee(input);
   const hash=createHash('sha256').update([row.event_id,row.category_id,row.title.toLowerCase(),row.artist.toLowerCase()].join('|')).digest('hex');
   if(input.id&&!validGrammyId(input.id))throw new GrammyAdminError('Revisa los identificadores del archivo');
   return {...row,id:input.id||`${hash.slice(0,8)}-${hash.slice(8,12)}-4${hash.slice(13,16)}-8${hash.slice(17,20)}-${hash.slice(20,32)}`};
  });
  const existing=await db.from('grammy_nominees').select('id,event_id').in('id',rows.map(row=>row.id)).limit(1000);
  databaseError(existing.error,'No pudimos revisar los identificadores del lote');
  if(existing.data?.some(row=>row.event_id!==eventId))throw new GrammyAdminError('El archivo contiene identificadores de otra edición de los Grammy');
  const result=await db.from('grammy_nominees').upsert(rows,{onConflict:'id'});
  databaseError(result.error,'No se pudo importar el lote');return {};
 }
 if(body?.action==='publish'){
  const event=await eventState(db);
  if(now<Math.max(Date.parse(GRAMMY_EVENT.nomineeListAt),Date.parse(event.nominations_at)))throw new GrammyAdminError('Espera al anuncio oficial antes de abrir las predicciones');
  if(now>=Date.parse(event.closes_at))throw new GrammyAdminError('El cierre de predicciones ya pasó. Revisa la configuración.');
  const source=grammyOfficialSource(body.source||event.source_url);
  const nominees=await db.from('grammy_nominees').select('category_id').eq('event_id',eventId);
  if(nominees.error||readyGrammyCategories(nominees.data||[])!==100)throw new GrammyAdminError('Completa y revisa las 100 categorías antes de abrir');
  const results=await db.from('grammy_results').select('category_id').eq('event_id',eventId).limit(1);
  databaseError(results.error,'No pudimos verificar los resultados');
  if(results.data?.length)throw new GrammyAdminError('La actividad ya tiene ganadores verificados y no se puede reabrir.',409);
  const result=await db.from('grammy_events').update({status:'open',published_at:event.published_at||new Date(now).toISOString(),source_url:source}).eq('id',eventId);
  databaseError(result.error,'No se pudo abrir la actividad');return {};
 }
 if(body?.action==='results'){
  if(!Array.isArray(body.winners)||!body.winners.length||body.winners.length>100)throw new GrammyAdminError('Revisa la lista de ganadores oficiales');
  const result=await db.rpc('musiclub_settle_grammy_results',{p_winners:body.winners,p_source:grammyOfficialSource(body.source)});
  if(result.error)throw new GrammyAdminError(result.error.message||'No se pudieron acreditar los aciertos');return {};
 }
 throw new GrammyAdminError('Acción no válida');
}
