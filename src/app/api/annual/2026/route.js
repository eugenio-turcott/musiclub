import {NextResponse} from 'next/server';
import {authorize} from '../../../../server/authorize';
import {getPublicCatalog} from '../../../../server/catalog';
import {readPersonalAnnual} from '../../../../server/annualRecap.mjs';
import {buildClubAnnual} from '../../../../utils/annualRecap.mjs';
import {buildAnnualYearbook} from '../../../../utils/annualYearbook.mjs';
import {readAnnualPlaylists} from '../../../../server/annualYearbook.mjs';
import globalSnapshot from '../../../../server/annual2026Global.json';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export async function GET(request){
  const auth=await authorize(request,{admin:true});if(auth.error)return auth.error;
  const [catalog,personal,playlists]=await Promise.allSettled([getPublicCatalog(),readPersonalAnnual(auth.db,auth.user),readAnnualPlaylists(auth.db)]);
  const yearbook=buildAnnualYearbook(catalog.status==='fulfilled'?catalog.value:null,globalSnapshot);
  return NextResponse.json({viewerId:auth.user.id,researchDate:globalSnapshot.asOf,selection:yearbook.clubRanking,yearbook,playlists:playlists.status==='fulfilled'?playlists.value:[],
    club:catalog.status==='fulfilled'?buildClubAnnual(catalog.value):null,
    personal:personal.status==='fulfilled'?personal.value:null,
    errors:[...(catalog.status==='rejected'?['No se pudo cargar el resumen del club.']:[]),...(personal.status==='rejected'?['No se pudo cargar tu resumen personal.']:[])],
  },{headers:{'Cache-Control':'private, no-store','Vary':'Authorization'}});
}
