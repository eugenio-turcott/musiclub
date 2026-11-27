import {NextResponse} from 'next/server';
import {authorize} from '../../../../server/authorize';
import {notificationIds} from '../../../../utils/notificationTimestamps.mjs';
import {recordNotificationReceipts} from '../../../../services/notificationReceiptStore.mjs';

export async function POST(request) {
  const auth=await authorize(request);if(auth.error)return auth.error;
  try {
    const raw=await request.text();
    if(raw.length>25000)return NextResponse.json({error:'Demasiados avisos'},{status:400});
    let body;try {body=JSON.parse(raw);}catch{return NextResponse.json({error:'Avisos inválidos'},{status:400});}
    if(!body||typeof body!=='object')return NextResponse.json({error:'Avisos inválidos'},{status:400});
    if(body.userId!==auth.user.id)return NextResponse.json({error:'La cuenta cambió. Actualiza tus avisos.'},{status:403});
    if(!Array.isArray(body.ids)||body.ids.length>100)return NextResponse.json({error:'Avisos inválidos'},{status:400});
    const ids=notificationIds(body.ids.map(id=>({id})));
    if(ids.length!==new Set(body.ids).size)return NextResponse.json({error:'Avisos inválidos'},{status:400});
    const receipts=await recordNotificationReceipts(auth.db,auth.user.id,ids);
    return NextResponse.json({receipts},{headers:{'Cache-Control':'private, no-store'}});
  } catch {return NextResponse.json({error:'No se pudo recuperar la fecha de tus avisos.'},{status:503});}
}
