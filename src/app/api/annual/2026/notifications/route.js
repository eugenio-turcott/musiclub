import {NextResponse} from 'next/server';
import {authorize} from '../../../../../server/authorize';
import {ANNUAL_LAUNCH} from '../../../../../data/annual2026Launch.mjs';
import {annualAdminDb} from '../../../../../server/annualNotifications.mjs';
import {deliverAnnualNotice} from '../../../../../services/annualMail.mjs';
export const dynamic='force-dynamic';
const response=value=>NextResponse.json(value,{headers:{'Cache-Control':'private, no-store','Vary':'Authorization'}});
export async function GET(request){
 const auth=await authorize(request);if(auth.error)return auth.error;
 const result=await auth.db.from('annual_subscriptions').select('enabled').eq('year',2026).eq('user_id',auth.user.id).maybeSingle();
 if(result.error)return NextResponse.json({error:'No pudimos consultar tu aviso. Inténtalo de nuevo.'},{status:503});
 return response({subscribed:!!result.data?.enabled,launchAt:ANNUAL_LAUNCH.at});
}
export async function POST(request){
 const auth=await authorize(request);if(auth.error)return auth.error;
 try{
  const body=await request.json();if(typeof body.enabled!=='boolean')return NextResponse.json({error:'Solicitud no válida'},{status:400});
  const result=await auth.db.rpc('musiclub_annual_subscribe',{p_year:2026,p_enabled:body.enabled});
  if(result.error)return NextResponse.json({error:'No pudimos guardar tu aviso. Reintenta.'},{status:503});
  let confirmationStatus='not_requested';
  if(body.enabled){try{const notice=await deliverAnnualNotice(annualAdminDb(),auth.user.id,'confirmation');confirmationStatus=notice.sent?'sent':notice.reason;}catch{confirmationStatus='pending';}}
  return response({success:true,subscribed:body.enabled,confirmationStatus});
 }catch{return NextResponse.json({error:'Solicitud no válida'},{status:400});}
}
