import {NextResponse} from 'next/server';
import {authorize} from '../../../../../server/authorize';
import {annualAdminDb} from '../../../../../server/annualNotifications.mjs';
import {processAnnualNotices} from '../../../../../services/annualMail.mjs';
export const runtime='nodejs';
export async function POST(request){
 const auth=await authorize(request,{admin:true,cron:true});if(auth.error)return auth.error;
 try{
  // Scheduled calls only process opt-in confirmation and launch; no bulk announcement.
  const db=annualAdminDb(),results=[];
  for(const phase of ['confirmation','launch'])results.push(await processAnnualNotices(db,phase));
  return NextResponse.json({results},{headers:{'Cache-Control':'private, no-store'}});
 }catch{return NextResponse.json({error:'No se pudieron procesar los avisos del año'},{status:503});}
}
