import {buildPersonalAnnual} from '../utils/annualRecap.mjs';
import {PUBLIC_REVIEW_FIELDS} from '../utils/publicData.js';

export async function readPersonalAnnual(db,user,{now=Date.now()}={}){
  if(!user?.id||!user?.email)throw new Error('Sesión no disponible');
  const rows=[];
  // RLS still applies. The identity comes exclusively from the verified session.
  for(let offset=0;;offset+=500){
    const result=await db.from('reviews')
      .select(`${PUBLIC_REVIEW_FIELDS},albums(id,album_name,artist_name,image_url,genres,tracks,total_tracks,release_type,release_year,release_date)`)
      .eq('reviewer_email',user.email).gte('created_at','2026-01-01T06:00:00Z').lt('created_at','2027-01-01T06:00:00Z')
      .order('created_at').order('id').range(offset,offset+499);
    if(result.error)throw new Error('No pudimos consultar tus reseñas de 2026');
    rows.push(...(result.data||[]));if((result.data||[]).length<500)break;
  }
  const profile=await db.from('profiles').select('name,avatar_url').eq('id',user.id).maybeSingle();
  if(profile.error)throw new Error('No pudimos consultar tu perfil');
  const albums=[...new Map(rows.filter(r=>r.albums).map(r=>[r.albums.id,r.albums])).values()];
  return buildPersonalAnnual(rows,albums,{now,name:profile.data?.name||'Mi año en Musiclub',avatar:profile.data?.avatar_url||null});
}
