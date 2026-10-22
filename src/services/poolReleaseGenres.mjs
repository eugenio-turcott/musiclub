import catalog from '../utils/genreCatalog.cjs';
const key = value => String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
export async function enrichPoolReleaseGenres(item, {searchDeezer, deezerDetails, searchMusicBrainz, musicBrainzDetails}) {
  const known=catalog.normalizeGenres(item.genres || []);
  if(known.length)return {...item,genres:known};
  const matches=(name,artist)=>key(name)===key(item.albumName) && key(artist)===key(item.artistName);
  try {
    const results=await searchDeezer(`artist:"${item.artistName}" album:"${item.albumName}"`,8);
    const match=(results?.albums || []).find(release=>matches(release.name,release.artist));
    if(match) {
      const details=await deezerDetails(match.deezer_id || match.id);
      if(details && matches(details.name,details.artist)) {
        const genres=catalog.normalizeGenres(details.genres || []);
        if(genres.length)return {...item,genres,otherLink:item.otherLink || details.external_urls?.deezer};
      }
    }
  } catch { /* Continue with another source; never invent a genre. */ }
  try {
    const results=await searchMusicBrainz(`${item.artistName} ${item.albumName}`,8);
    const match=results.find(release=>matches(release.name,release.artist));
    if(match) {
      const details=await musicBrainzDetails(match.mbid);
      const genres=catalog.normalizeGenres(details?.genres || []);
      if(genres.length)return {...item,genres};
    }
  } catch { /* The member can complete missing metadata. */ }
  return {...item,genres:[]};
}
