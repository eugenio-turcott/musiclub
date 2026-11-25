const known=new Set(['SPOTIFY','APPLE','DEEZER','YOUTUBE_MUSIC','MUSICBRAINZ','TIDAL']);
export function verifiedPlatforms(release){
 const platforms=new Set((release.sources||[]).filter(s=>s.id&&known.has(s.provider)).map(s=>s.provider));
 for(const value of [release.spotify_link,release.spotifyUrl,release.apple_music_link,release.other_link]){
  try{const u=new URL(value);if(u.hostname==='open.spotify.com'&&/^\/album\/[a-zA-Z0-9]{22}\/?$/.test(u.pathname))platforms.add('SPOTIFY');
   if(u.hostname==='music.apple.com'&&/\/album\/(?:[^/]+\/)?\d+\/?$/.test(u.pathname))platforms.add('APPLE');
   if(u.hostname.replace(/^www\./,'')==='deezer.com'&&/^\/album\/\d+\/?$/.test(u.pathname))platforms.add('DEEZER');
  }catch{}
 }
 if(release.mbid&&/^[a-f0-9-]{36}$/i.test(release.mbid))platforms.add('MUSICBRAINZ');
 return [...platforms];
}
export function commonDiscography(releases=[]){return releases.map(r=>({...r,verifiedPlatforms:verifiedPlatforms(r)})).filter(r=>r.verifiedPlatforms.length>=2);}
export function verifiedArtistProfile(profile){
 if(!profile)return profile;
 const discography=commonDiscography(profile.discography||[]);
 return {...profile,discography,albums:discography.filter(a=>a.release_type==='ALBUM'),eps:discography.filter(a=>a.release_type==='EP'),singles:discography.filter(a=>/SINGLE|SENCILLO/.test(a.release_type)),compilations:discography.filter(a=>a.release_type==='COMPILACION')};
}
