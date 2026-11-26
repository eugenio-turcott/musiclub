const known=new Set(['SPOTIFY','APPLE','DEEZER','YOUTUBE_MUSIC','MUSICBRAINZ','TIDAL']);
export const PLATFORM_WEIGHTS=Object.freeze({SPOTIFY:70,APPLE:6,DEEZER:6,YOUTUBE_MUSIC:6,MUSICBRAINZ:6,TIDAL:6});
export function platformFromReleaseURL(value){
 try{
  const url=new URL(value),host=url.hostname.replace(/^www\./,'');if(url.protocol!=='https:'||url.username||url.password)return null;
  let match;
  if(host==='open.spotify.com'&&(match=url.pathname.match(/^\/album\/([A-Za-z0-9]{22})\/?$/)))return {provider:'SPOTIFY',id:match[1],url:url.href};
  if(host==='music.apple.com'&&(match=url.pathname.match(/\/album\/(?:[^/]+\/)?(\d+)\/?$/)))return {provider:'APPLE',id:match[1],url:url.href};
  if(host==='deezer.com'&&(match=url.pathname.match(/^\/(?:[a-z]{2}\/)?album\/(\d+)\/?$/)))return {provider:'DEEZER',id:match[1],url:url.href};
  if(['tidal.com','listen.tidal.com'].includes(host)&&(match=url.pathname.match(/^\/(?:browse\/)?album\/(\d+)\/?$/)))return {provider:'TIDAL',id:match[1],url:url.href};
  if(host==='music.youtube.com'&&url.pathname==='/playlist'&&/^OLAK5uy_[\w-]+$/.test(url.searchParams.get('list')||''))return {provider:'YOUTUBE_MUSIC',id:url.searchParams.get('list'),url:url.href};
  if(host==='musicbrainz.org'&&(match=url.pathname.match(/^\/(release|release-group)\/([a-f0-9-]{36})\/?$/i)))return {provider:'MUSICBRAINZ',id:match[2],url:url.href};
 }catch{}
 return null;
}
export function verifiedPlatforms(release){
 const platforms=new Set((release.sources||[]).filter(s=>s.id&&known.has(s.provider)).map(s=>s.provider));
 for(const value of [release.spotify_link,release.spotifyUrl,release.apple_music_link,release.other_link]){
  const source=platformFromReleaseURL(value);if(source)platforms.add(source.provider);
 }
 if(release.mbid&&/^[a-f0-9-]{36}$/i.test(release.mbid))platforms.add('MUSICBRAINZ');
 return [...platforms];
}
export function releaseRelevance(release){return verifiedPlatforms(release).reduce((total,provider)=>total+PLATFORM_WEIGHTS[provider],0);}
export function commonDiscography(releases=[]){return releases.map(r=>({...r,verifiedPlatforms:verifiedPlatforms(r),relevance:releaseRelevance(r)})).filter(r=>r.verifiedPlatforms.includes('SPOTIFY')||r.verifiedPlatforms.length>=2||r.clubAlbumId||r.clubUrl).sort((a,b)=>String(b.releaseDate||b.release_date||b.releaseYear||b.release_year||'').localeCompare(String(a.releaseDate||a.release_date||a.releaseYear||a.release_year||''))||b.relevance-a.relevance||String(a.id).localeCompare(String(b.id)));}
export function verifiedArtistProfile(profile){
 if(!profile)return profile;
 const discography=commonDiscography(profile.discography||[]);
 return {...profile,discography,albums:discography.filter(a=>a.release_type==='ALBUM'),eps:discography.filter(a=>a.release_type==='EP'),singles:discography.filter(a=>/SINGLE|SENCILLO/.test(a.release_type)),compilations:discography.filter(a=>a.release_type==='COMPILACION')};
}
