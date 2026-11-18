import {NextResponse} from 'next/server';
import {authorize} from '../../../../server/authorize';
import {getPublicCatalog} from '../../../../server/catalog';
import {readPersonalAnnual} from '../../../../server/annualRecap.mjs';
import {buildClubAnnual} from '../../../../utils/annualRecap.mjs';
import {ANNUAL_SELECTION,ANNUAL_SOURCES,RESEARCH_DATE} from '../../../../server/annual2026Selection.mjs';
import releaseIdentity from '../../../../utils/releaseIdentity.cjs';
import covers from '../../../../server/annual2026Covers.json';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export async function GET(request){
  const auth=await authorize(request,{admin:true});if(auth.error)return auth.error;
  const [catalog,personal]=await Promise.allSettled([getPublicCatalog(),readPersonalAnnual(auth.db,auth.user)]);
  const albums=catalog.status==='fulfilled'?catalog.value.albums:[];
  const fold=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
  const selection=ANNUAL_SELECTION.map(release=>{
    const album=albums.find(a=>fold(a.album_name)===fold(release.title)&&fold(a.artist_name)===fold(release.artist));
    return {...release,...(covers[release.id]||{}),catalogPath:album?releaseIdentity.releasePath(album):null,cover:album?.image_url||covers[release.id]?.cover||null};
  });
  return NextResponse.json({viewerId:auth.user.id,researchDate:RESEARCH_DATE,selection,sources:ANNUAL_SOURCES,
    club:catalog.status==='fulfilled'?buildClubAnnual(catalog.value):null,
    personal:personal.status==='fulfilled'?personal.value:null,
    errors:[...(catalog.status==='rejected'?['No se pudo cargar el resumen del club.']:[]),...(personal.status==='rejected'?['No se pudo cargar tu resumen personal.']:[])],
  },{headers:{'Cache-Control':'private, no-store','Vary':'Authorization'}});
}
