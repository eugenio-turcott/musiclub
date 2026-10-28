function trackName(track) { return String(typeof track === 'string' ? track : track?.name || track?.track_name || track?.title || '').trim(); }
function providerTitleKey(value) {
  return String(value || '').normalize('NFKD').replace(/\p{M}/gu,'').toLocaleLowerCase()
    .replace(/\s+-\s+(?:single|ep)$/i,'')
    .replace(/[([](?:clean|explicit)(?: version)?[)\]]/gi,'')
    .replace(/\bdeluxe(?: edition| version)?\b/gi,'deluxe')
    .replace(/[^\p{L}\p{N}+]/gu,'');
}
function sameReleaseTitle(candidate,requested) { return Boolean(candidate && requested && providerTitleKey(candidate)===providerTitleKey(requested)); }
function sameArtistCredit(candidate,requested) {
  const key=value=>{
    const names=Array.isArray(value)?value.map(item=>typeof item==='string'?item:item?.name || item?.artist?.name).filter(Boolean).join(', '):typeof value==='object'?value?.name:value;
    return providerTitleKey(names).replace(/\+/g,'');
  };
  return Boolean(candidate && requested && key(candidate)===key(requested));
}
function isPlaceholderTrack(track) {
  if (track && typeof track === 'object' && track.name_verified === true) return false;
  const name = trackName(track);
  return !name || /^(?:track|pista|song|canci[oó]n)\s*[-:#]?\s*\d+$/i.test(name) || /^(?:tba|tbd|to be announced)$/i.test(name);
}
function tracklistIssues(release, today = new Date().toISOString().slice(0,10)) {
  const date = String(release.release_date || '').slice(0,10);
  if (date && date > today) return [];
  const tracks = Array.isArray(release.tracks) ? release.tracks : [];
  const issues = [];
  if (!tracks.length) issues.push('missing');
  else if (tracks.some(isPlaceholderTrack)) issues.push('placeholder');
  if (Number(release.total_tracks) > tracks.length) issues.push('incomplete');
  else if (Number(release.total_tracks) > 0 && Number(release.total_tracks) < tracks.length) issues.push('count_mismatch');
  return issues;
}
function selectTracklist(...candidates) {
  return candidates.filter(Array.isArray).filter(list=>list.length).map((list,priority)=>({list,priority,named:list.filter(t=>!isPlaceholderTrack(t)).length,provisional:list.filter(isPlaceholderTrack).length}))
    .sort((a,b)=>b.named-a.named || a.provisional-b.provisional || b.list.length-a.list.length || a.priority-b.priority)[0]?.list || [];
}

// Changing a provider must not disconnect existing ratings from their stored IDs.
function mergeTracklist(existing = [], incoming = []) {
  if (!incoming.length) return existing;
  const old = Array.isArray(existing) ? existing : [];
  const nameKey = track=>trackName(track).toLocaleLowerCase();
  const slot = (track,index)=>`${track?.disc_number || 1}:${track?.track_number || index+1}`;
  const consumed = new Set();
  const result = incoming.map((track,index)=>{
    const fresh = typeof track === 'string' ? {name:track,track_number:index+1,disc_number:1} : track;
    let oldIndex = old.findIndex((saved,i)=>!consumed.has(i) && (saved?.id && String(saved.id)===String(fresh.id) || !isPlaceholderTrack(saved) && nameKey(saved)===nameKey(fresh)));
    if(oldIndex<0) oldIndex=old.findIndex((saved,i)=>!consumed.has(i) && (isPlaceholderTrack(saved) || incoming.length===old.length) && slot(saved,i)===slot(fresh,index));
    if(oldIndex<0) return fresh;
    consumed.add(oldIndex);
    const saved=typeof old[oldIndex] === 'string' ? {name:old[oldIndex]} : old[oldIndex];
    const name = isPlaceholderTrack(fresh) && !isPlaceholderTrack(saved) ? trackName(saved) : trackName(fresh);
    const aliases=[...new Set([...(saved.id_aliases || []),...(fresh.id_aliases || []),fresh.id].filter(id=>id && String(id)!==String(saved.id)))];
    return {...saved,...fresh,id:saved.id || fresh.id,name,track_name:name,...(aliases.length ? {id_aliases:aliases} : {})};
  });
  // Keep unfilled slots visible to the audit; a partial response cannot masquerade as a complete album.
  old.forEach((track,index)=>{if(!consumed.has(index))result.push(track);});
  return result;
}
module.exports = {trackName,providerTitleKey,sameReleaseTitle,sameArtistCredit,isPlaceholderTrack,tracklistIssues,selectTracklist,mergeTracklist};
