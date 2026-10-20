import { collectOfficialArtist, mergeOfficialReleases } from './officialArtistCatalog.mjs';
export const ARTIST_FIELDS='slug,name,profile,providers,checked_at,refresh_after';
export async function readStoredArtist(db,slug) {
  const {data,error}=await db.from('artist_discographies').select(ARTIST_FIELDS).eq('slug',slug).maybeSingle();
  if(error) return null; // Missing migration must not take the public pages down.
  return data;
}
export async function refreshStoredArtist(db,slug,name,{collect=collectOfficialArtist}={}) {
  const claim=await db.rpc('musiclub_claim_artist_refresh',{p_slug:slug,p_name:name});
  if(claim.error) throw new Error('No se pudo reservar la actualización del artista');
  if(!claim.data) return {skipped:true};
  const previous=await readStoredArtist(db,slug);
  let profile;
  try {profile=await collect(name,{knownIds:Object.fromEntries(Object.entries(previous?.providers||{}).map(([key,value])=>[key.toLowerCase(),value.artistId]))});}
  catch {profile={success:false};}
  const now=new Date();
  const patch={lease_until:null,refresh_after:new Date(now.getTime()+(profile.success?86400000:3600000)).toISOString(),updated_at:now.toISOString()};
  if(profile.success) {
    patch.profile={...profile,discography:mergeOfficialReleases(previous?.profile?.discography || [],profile.discography)};
    patch.providers=Object.fromEntries(Object.entries(profile.providers).map(([provider,value])=>[provider,{...previous?.providers?.[provider],...value}]));
    patch.profile.providers=patch.providers;patch.checked_at=profile.checkedAt;
  }
  const result=await db.from('artist_discographies').update(patch).eq('slug',slug);
  if(result.error) throw new Error('No se pudo guardar la discografía oficial');
  return {success:!!profile.success,count:patch.profile?.discography?.length || 0};
}


// Always return persisted public data, including after a first-time discovery.
export async function loadStoredArtist(db,slug,{hasLocal=false,canDiscover=false,refresh,schedule}={}) {
  const stored=await readStoredArtist(db,slug);
  const profile=stored?.profile?.discography?.length ? stored.profile : null;
  const needsRefresh=!stored || Date.parse(stored.refresh_after)<=Date.now();
  if(profile || hasLocal) {
    if(canDiscover && needsRefresh) schedule(refresh);
    return profile;
  }
  if(!canDiscover || !needsRefresh) return null;
  await refresh();
  const saved=await readStoredArtist(db,slug);
  return saved?.profile?.discography?.length ? saved.profile : null;
}
