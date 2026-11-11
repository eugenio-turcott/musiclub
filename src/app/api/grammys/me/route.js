import {NextResponse} from 'next/server';
import {authorize} from '../../../../server/authorize';
import {GRAMMY_EVENT,GRAMMY_CATEGORIES} from '../../../../data/grammys2027.mjs';
export const dynamic='force-dynamic';
export async function GET(request){
 const auth=await authorize(request);if(auth.error)return auth.error;
 const [subscription,predictions,awards]=await Promise.all([auth.db.from('grammy_subscriptions').select('enabled').eq('user_id',auth.user.id).eq('event_id',GRAMMY_EVENT.id).maybeSingle(),auth.db.from('grammy_predictions').select('category_id,nominee_id').eq('user_id',auth.user.id).eq('event_id',GRAMMY_EVENT.id),auth.db.from('grammy_awards').select('category_id,xp').eq('user_id',auth.user.id).eq('event_id',GRAMMY_EVENT.id)]);
 if(subscription.error||predictions.error||awards.error)return NextResponse.json({error:'No pudimos cargar tus predicciones. Reintenta.'},{status:503});
 return NextResponse.json({subscribed:Boolean(subscription.data?.enabled),predictions:predictions.data||[],awards:awards.data||[]},{headers:{'Cache-Control':'private, no-store'}});
}
export async function POST(request){
 const auth=await authorize(request);if(auth.error)return auth.error;
 try{const body=await request.json();let result;
 if(body.action==='subscribe'&&typeof body.enabled==='boolean')result=await auth.db.rpc('musiclub_grammy_subscribe',{p_enabled:body.enabled});
 else if(body.action==='predict'&&GRAMMY_CATEGORIES.some(c=>c.id===body.categoryId)&&(body.nomineeId===null||/^[0-9a-f-]{36}$/i.test(body.nomineeId||'')))result=await auth.db.rpc('musiclub_grammy_predict',{p_category:body.categoryId,p_nominee:body.nomineeId});
 else return NextResponse.json({error:'Solicitud no válida'},{status:400});
 if(result.error)return NextResponse.json({error:'No se pudo guardar. Comprueba que las predicciones estén abiertas y vuelve a intentarlo.'},{status:409});
 return NextResponse.json({success:true});
 }catch{return NextResponse.json({error:'No se pudo procesar la solicitud'},{status:400});}
}
