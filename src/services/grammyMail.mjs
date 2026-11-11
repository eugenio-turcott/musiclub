import {getTransporter} from './emailService.js';
import {GRAMMY_EVENT,grammyReminderPhase} from '../data/grammys2027.mjs';
import {deliverNotificationOnce} from './notificationDelivery.js';
export function grammyEmail(phase){
 const ready=phase==='nominations',title=ready?'Los nominados ya están en Musiclub':'Mañana se anuncian los nominados';
 const copy=ready?'Escucha los releases, publica tus reseñas y elige quién crees que ganará en cada categoría. Empieza por Campo General y las cinco categorías nuevas.':'El 16 de noviembre conoceremos a los nominados a los Grammy 2027. La transmisión comienza a las 6:45 a. m., hora de Ciudad de México. Te avisaremos cuando las predicciones estén listas en Musiclub.';
 const url='https://www.musiclub.org/grammys';
 return {subject:`${title} · Grammy 2027`,text:`${title}\n\n${copy}\n\n${url}\n\nRecibes este aviso porque activaste Notificarme. Puedes cancelarlo en ${url}. Actividad independiente de Musiclub.`,html:`<!doctype html><html lang="es"><meta name="viewport" content="width=device-width"><body style="margin:0;background:#0d0d1e;color:#fff8ff;font-family:Arial,sans-serif;padding:24px"><main style="max-width:560px;margin:auto;padding:32px;border:1px solid #facc1544;border-radius:24px;background:#19182d"><img src="https://www.musiclub.org/musiclub_logo_corchea.png" width="48" height="48" alt="Musiclub"><p style="color:#facc15;font-size:14px">MUSICLUB · GRAMMY 2027</p><h1 style="font-size:32px;line-height:1.15">${title}</h1><p style="font-size:18px;line-height:1.6;color:#d3cfe6">${copy}</p><p style="margin:32px 0"><a href="${url}" style="padding:16px 24px;display:inline-block;background:#facc15;color:#171323;border-radius:12px;text-decoration:none;font-weight:bold">${ready?'Hacer mis predicciones':'Explorar las categorías'}</a></p><p style="color:#aaa3bf;font-size:13px;line-height:1.6">Actividad independiente de Musiclub. Recibes este aviso porque activaste Notificarme. <a href="${url}" style="color:#ff91c4">Cancelar recordatorios</a>.</p></main></body></html>`};
}
export async function sendGrammyEmail(to,phase){
 const {transporter,from,replyTo,isTest,provider}=await getTransporter();
 if(isTest)throw new Error('El correo real no está configurado');
 const info=await transporter.sendMail({from,replyTo,to,...grammyEmail(phase)});
 if(!info.accepted?.length||info.rejected?.length)throw new Error('El proveedor no aceptó el correo');
 return {success:true,provider,messageId:info.messageId};
}
// Batches and durable claims keep overlapping cron runs from duplicating notices.
export async function processGrammyReminders(db,{now=Date.now(),send=sendGrammyEmail}={}){
 if(now<Date.parse(GRAMMY_EVENT.reminderAt)||now>=Date.parse(GRAMMY_EVENT.closesAt))return {phase:null,sent:0};
 const event=await db.from('grammy_events').select('status').eq('id',GRAMMY_EVENT.id).single();if(event.error)throw new Error('No se pudo consultar el evento');
 const phase=grammyReminderPhase(event.data,now);if(!phase)return {phase:null,sent:0};
 const column=phase==='reminder'?'reminder_sent_at':'nominations_sent_at';
 const pending=await db.rpc('musiclub_pending_grammy_notices',{p_phase:phase});if(pending.error)throw new Error('No se pudieron consultar los recordatorios');
 let sent=0,failed=0;
 for(const row of pending.data||[]){try{
  const result=await deliverNotificationOnce(db,`grammys:2027:${phase}:${row.user_id}`,()=>send(row.email,phase));
  if(!result.skipped){const saved=await db.from('grammy_subscriptions').update({[column]:new Date(now).toISOString()}).eq('user_id',row.user_id).eq('event_id',GRAMMY_EVENT.id);if(saved.error)throw new Error('No se pudo registrar el correo aceptado');sent++;}
 }catch{failed++;}}
 return {phase,sent,failed};
}
