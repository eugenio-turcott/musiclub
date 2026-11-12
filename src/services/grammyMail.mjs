import {getTransporter} from './emailService.js';
import {publicAssetBytes} from './publicAssetBytes.js';
import {GRAMMY_EVENT,grammyReminderPhase} from '../data/grammys2027.mjs';
import {deliverNotificationOnce} from './notificationDelivery.js';
import {grammyEmailDesign} from './grammyEmailTemplate.mjs';
export const grammyEmail=grammyEmailDesign;

// Prepare approved local PNGs before claiming a subscriber's delivery slot.
export async function prepareGrammyEmail(phase,read=publicAssetBytes){
 const mail=grammyEmail(phase),sources=[...new Set([...mail.html.matchAll(/src="(https:\/\/www\.musiclub\.org[^"]+\.png)"/g)].map(m=>m[1]))];
 let html=mail.html;
 const attachments=await Promise.all(sources.map(async(src,index)=>{
  const pathname=new URL(src).pathname,cid=`grammy-${phase}-${index}@musiclub`;
  const content=await read(pathname);if(!content?.length)throw new Error('Falta una imagen del correo Grammy');
  return {filename:pathname.split('/').at(-1),content,contentType:'image/png',cid};
 }));
 sources.forEach((src,index)=>{html=html.replaceAll(`src="${src}"`,`src="cid:${attachments[index].cid}"`);});
 return {...mail,html,attachments};
}
export async function sendGrammyEmail(to,phase,prepared){
 const mail=prepared||await prepareGrammyEmail(phase);
 const {transporter,from,replyTo,isTest,provider}=await getTransporter();
 if(isTest)throw new Error('El correo real no está configurado');
 const info=await transporter.sendMail({from,replyTo,to,...mail});
 if(!info.accepted?.length||info.rejected?.length)throw new Error('El proveedor no aceptó el correo');
 return {success:true,provider,messageId:info.messageId};
}
export async function deliverGrammyNotice(db,userId,phase,{now=Date.now(),send=sendGrammyEmail,prepared}={}){
 if(!['confirmation','reminder'].includes(phase))throw new Error('Fase de correo no válida');
 if(phase==='confirmation'&&now>=Date.parse(GRAMMY_EVENT.reminderAt))return {skipped:true,reason:'registration_closed'};
 if(phase==='reminder'&&grammyReminderPhase(null,now)!=='reminder')return {skipped:true,reason:'outside_window'};
 const subscription=await db.from('grammy_subscriptions').select('email,enabled,confirmation_sent_at,reminder_sent_at').eq('user_id',userId).eq('event_id',GRAMMY_EVENT.id).maybeSingle();
 if(subscription.error)throw new Error('No se pudo comprobar la suscripción');
 const row=subscription.data,column=phase==='confirmation'?'confirmation_sent_at':'reminder_sent_at';
 if(!row?.enabled)return {skipped:true,reason:'disabled'};
 if(row[column])return {skipped:true,reason:'delivered'};
 const mail=prepared||(send===sendGrammyEmail?await prepareGrammyEmail(phase):undefined);
 const result=await deliverNotificationOnce(db,`grammys:2027:${phase}:${userId}`,()=>send(row.email,phase,mail));
 if(result.skipped)return result;
 const saved=await db.from('grammy_subscriptions').update({[column]:new Date(now).toISOString()}).eq('user_id',userId).eq('event_id',GRAMMY_EVENT.id);
 return {sent:true,recorded:!saved.error};
}
async function processNotices(db,phase,{now=Date.now(),send=sendGrammyEmail}={}){
 const pending=await db.rpc('musiclub_pending_grammy_notices',{p_phase:phase});
 if(pending.error)throw new Error('No se pudieron consultar los avisos pendientes');
 const rows=pending.data||[],prepared=rows.length&&send===sendGrammyEmail?await prepareGrammyEmail(phase):undefined;
 let sent=0,failed=0,skipped=0,recordingWarnings=0;
 for(const row of rows){try{
  const result=await deliverGrammyNotice(db,row.user_id,phase,{now,send,prepared});
  if(result.sent){sent++;if(!result.recorded)recordingWarnings++;}else skipped++;
 }catch{failed++;break;}}
 return {phase,sent,failed,skipped,recordingWarnings};
}
export async function processGrammyConfirmations(db,options={}){
 if((options.now??Date.now())>=Date.parse(GRAMMY_EVENT.reminderAt))return {phase:null,sent:0};
 return processNotices(db,'confirmation',options);
}
// No queries before Sunday 19:00 CDMX or after Sunday midnight. No third notice.
export async function processGrammyReminders(db,options={}){
 const now=options.now??Date.now();
 if(grammyReminderPhase(null,now)!=='reminder')return {phase:null,sent:0};
 return processNotices(db,'reminder',{...options,now});
}
export async function grammyMailStatus(db){
 const [subs,ledger]=await Promise.all([
  db.from('grammy_subscriptions').select('user_id,confirmation_sent_at,reminder_sent_at').eq('event_id',GRAMMY_EVENT.id).eq('enabled',true),
  db.from('musiclub_notification_deliveries').select('delivery_key,status').like('delivery_key','grammys:2027:%'),
 ]);
 if(subs.error||ledger.error)throw new Error('No se pudo consultar el estado de los correos');
 const deliveries=new Map((ledger.data||[]).map(r=>[r.delivery_key,r.status]));
 const summary={subscribers:subs.data?.length||0,confirmed:0,pending:0,reviewRequired:0,remindersSent:0};
 for(const row of subs.data||[]){
  const status=deliveries.get(`grammys:2027:confirmation:${row.user_id}`);
  if(row.confirmation_sent_at||status==='sent')summary.confirmed++;
  else if(status)summary.reviewRequired++;
  else summary.pending++;
  if(row.reminder_sent_at||deliveries.get(`grammys:2027:reminder:${row.user_id}`)==='sent')summary.remindersSent++;
 }
 return summary;
}
