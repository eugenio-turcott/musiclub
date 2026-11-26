import {annualEmailDesign,ANNUAL_MAIL_PHASES} from './annualEmailTemplate.mjs';
import {annualIsPublished} from '../data/annual2026Launch.mjs';
import {getTransporter} from './emailService.js';
import {publicAssetBytes} from './publicAssetBytes.js';
import {deliverNotificationOnce} from './notificationDelivery.js';
export async function annualCampaignReady(db,phase,now=Date.now()){
 if(!ANNUAL_MAIL_PHASES.includes(phase))throw Error('Fase no válida');
 if(phase==='launch'&&!annualIsPublished(now)||phase!=='launch'&&annualIsPublished(now))return false;
 const r=await db.from('annual_mail_campaigns').select('paused,approved_at,scheduled_at').eq('year',2026).eq('phase',phase).maybeSingle();
 if(r.error)throw Error('No se pudo comprobar la aprobación del correo');
 return !!r.data?.approved_at&&!r.data.paused&&(!r.data.scheduled_at||now>=Date.parse(r.data.scheduled_at));
}
export async function prepareAnnualEmail(phase,options={},read=publicAssetBytes){
 const mail=annualEmailDesign(phase,options),sources=[...new Set([...mail.html.matchAll(/src="(https:\/\/www\.musiclub\.org[^"]+\.png)"/g)].map(m=>m[1]))];
 let html=mail.html;const attachments=await Promise.all(sources.map(async(src,i)=>{const pathname=new URL(src).pathname,content=await read(pathname);if(!content?.length)throw Error('Falta una imagen del correo anual');return {filename:pathname.split('/').at(-1),content,contentType:'image/png',cid:`annual-${phase}-${i}@musiclub`};}));
 sources.forEach((src,i)=>{html=html.replaceAll(`src="${src}"`,`src="cid:${attachments[i].cid}"`);});return {...mail,html,attachments};
}
export async function sendAnnualEmail(to,phase,options){
 const mail=await prepareAnnualEmail(phase,options),{transporter,from,replyTo,isTest,provider}=await getTransporter();if(isTest)throw Error('El correo real no está configurado');
 const info=await transporter.sendMail({from,replyTo,to,...mail});if(!info.accepted?.length||info.rejected?.length)throw Error('El proveedor no aceptó el correo');return {success:true,provider,messageId:info.messageId};
}
export async function deliverAnnualNotice(db,userId,phase,{now=Date.now(),send=sendAnnualEmail}={}){
 if(!await annualCampaignReady(db,phase,now))return {skipped:true,reason:'not_approved_or_due'};
 let row,column;
 if(phase==='announcement'){
  const r=await db.from('profiles').select('email,name').eq('id',userId).maybeSingle();if(r.error)throw Error('No se pudo consultar el destinatario');row=r.data;
 }else{
  const r=await db.from('annual_subscriptions').select('email,enabled,confirmation_sent_at,launch_sent_at').eq('year',2026).eq('user_id',userId).maybeSingle();if(r.error)throw Error('No se pudo comprobar la suscripción');row=r.data;column=phase==='launch'?'launch_sent_at':'confirmation_sent_at';
  if(!row?.enabled)return {skipped:true,reason:'disabled'};if(row[column])return {skipped:true,reason:'delivered'};
 }
 if(!row?.email)return {skipped:true,reason:'no_email'};
 const profile=row.name?null:await db.from('profiles').select('name').eq('id',userId).maybeSingle();
 const result=await deliverNotificationOnce(db,`annual:2026:${phase}:${userId}`,()=>send(row.email,phase,{name:row.name||profile?.data?.name}));if(result.skipped)return result;
 if(!column)return {sent:true,recorded:true};
 const saved=await db.from('annual_subscriptions').update({[column]:new Date(now).toISOString()}).eq('year',2026).eq('user_id',userId);return {sent:true,recorded:!saved.error};
}
export async function processAnnualNotices(db,phase,{now=Date.now(),send=sendAnnualEmail}={}){
 if(!await annualCampaignReady(db,phase,now))return {phase,sent:0,skipped:true,reason:'not_approved_or_due'};
 let sent=0,failed=0,skipped=0,recordingWarnings=0;
 for(let offset=0;;offset+=200){
  const q=phase==='announcement'?db.from('profiles').select('id').order('id').range(offset,offset+199):db.from('annual_subscriptions').select('user_id').eq('year',2026).eq('enabled',true).order('user_id').range(offset,offset+199);
  const rows=await q;if(rows.error)throw Error('No se pudieron consultar los avisos pendientes');
  for(const r of rows.data||[]){try{const result=await deliverAnnualNotice(db,r.user_id||r.id,phase,{now,send});if(result.sent){sent++;if(!result.recorded)recordingWarnings++;}else skipped++;}catch{failed++;return {phase,sent,failed,skipped,recordingWarnings};}}
  if((rows.data||[]).length<200)break;
 }
 return {phase,sent,failed,skipped,recordingWarnings};
}
