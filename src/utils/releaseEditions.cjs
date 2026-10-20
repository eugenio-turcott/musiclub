const {slugify}=require('./releaseIdentity.cjs');
function editionTitle(value) {
 let title=String(value || '').trim().replace(/ - (Single|EP)$/i,'');
 const deluxe=/\bdeluxe\b/i.test(title);
 title=title.replace(/\s*[([]([^()[\]]*)[)\]]/g,(whole,inside)=>
  /\b(deluxe|edition|edici[oó]n|version|versi[oó]n|explicit|clean|remaster(?:ed)?|remasterizad[oa]|anniversary|aniversario|bonus tracks?|expanded)\b/i.test(inside) ? '' : whole);
 title=title.replace(/\s*[-–:]\s*(?:(?:\d+(?:st|nd|rd|th)?\s+)?anniversary.*|(?:\d{4}\s+)?remaster(?:ed)?.*|(?:clean|explicit|deluxe)(?: edition| version)?)$/i,'');
 title=title.replace(/\s+deluxe(?: edition| version)?$/i,'').replace(/\s*\+$/,'').trim();
 return {name:title+(deluxe?' (Deluxe)':''),deluxe};
}
function editionKey(release,artist='') {
 const title=editionTitle(release.album_name || release.album || release.name);
 const credit=release.artist_name || release.artista || release.artist || artist;
 const raw=String(release.release_type || release.releaseType || 'ALBUM').toUpperCase();
 const kind=/^(SINGLE|SENCILLO|TRACK|CANCION)$/.test(raw)?'SENCILLO':raw;
 return [slugify(credit),slugify(title.name,true),kind].join('|');
}
function preference(release) {
 const original=release.album_name || release.album || release.name || '';
 const canonical=editionTitle(original).name;
 const standard=slugify(original.replace(/ - (Single|EP)$/i,''),true)===slugify(canonical,true);
 const providers=release.sources?.map(source=>source.provider) || [];
 return (standard?1000:0)+(release.type==='CLUB'?5000:0)+(release.explicit===true?100:0)+(providers.includes('SPOTIFY')?30:providers.includes('APPLE')?20:10)+(Number(release.review_count)>0?5:0)+(Number(release.totalTracks || release.total_tracks)||0)/1000;
}
function groupReleaseEditions(releases=[],artist='') {
 const groups=new Map();
 for(const release of releases) {
  const key=editionKey(release,artist);
  if(!groups.has(key))groups.set(key,[]);
  groups.get(key).push(release);
 }
 return [...groups.values()].map(rows=>{
  const representative=[...rows].sort((a,b)=>preference(b)-preference(a))[0];
  const name=editionTitle(representative.album_name || representative.album || representative.name).name;
  const result={...representative,
   edition_member_ids:[...new Set(rows.flatMap(row=>row.edition_member_ids || [row.id]).filter(Boolean))],
   edition_names:[...new Set(rows.flatMap(row=>row.edition_names || [row.album_name || row.album || row.name]).filter(Boolean))],
   genres:[...new Set(rows.flatMap(row=>row.genres || []))],
   sources:[...new Map(rows.flatMap(row=>row.sources||[]).map(source=>[`${source.provider}:${source.id}`,source])).values()]};
  for(const field of ['name','album_name','album'])if(representative[field])result[field]=name;
  return result;
 });
}
module.exports={editionTitle,editionKey,preference,groupReleaseEditions};
