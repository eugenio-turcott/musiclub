import {NextResponse} from 'next/server';
import {authorize} from '../../../../server/authorize';
import {grammyDb} from '../../../../server/grammys';
import {grammyMailStatus,processGrammyConfirmations} from '../../../../services/grammyMail.mjs';
export const dynamic='force-dynamic';
export const runtime='nodejs';
const headers={'Cache-Control':'private, no-store'};
export async function GET(request){
 const auth=await authorize(request,{admin:true});if(auth.error)return auth.error;
 try{return NextResponse.json(await grammyMailStatus(grammyDb(true)),{headers});}
 catch{return NextResponse.json({error:'No se pudo consultar el estado de los correos'},{status:503,headers});}
}
export async function POST(request){
 const auth=await authorize(request,{admin:true});if(auth.error)return auth.error;
 try{return NextResponse.json(await processGrammyConfirmations(grammyDb(true)),{headers});}
 catch{return NextResponse.json({error:'No se pudo preparar el lote de confirmaciones'},{status:503,headers});}
}
