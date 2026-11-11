import {NextResponse} from 'next/server';
import {authorize} from '../../../../server/authorize';
import {grammyDb} from '../../../../server/grammys';
import {processGrammyReminders} from '../../../../services/grammyMail.mjs';
export const dynamic='force-dynamic';export const runtime='nodejs';
export async function POST(request){const auth=await authorize(request,{admin:true,cron:true});if(auth.error)return auth.error;try{return NextResponse.json(await processGrammyReminders(grammyDb(true)));}catch{return NextResponse.json({error:'No se pudo procesar el lote de recordatorios'},{status:503});}}
