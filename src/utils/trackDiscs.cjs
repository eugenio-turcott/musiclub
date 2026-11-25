function normalizeTrackDiscs(tracks=[]) {
 let disc=1,previous=0;
 return tracks.map((value,index)=>{
  const track=typeof value==='string'?{name:value}:value;
  const explicit=Number(track.disc_number||track.discNumber||track.mediumPosition);
  const number=Number(track.track_number||track.trackNumber);
  if(explicit>disc){disc=explicit;previous=0;}
  else if(number===1&&previous>1&&(!explicit||explicit===disc||explicit===1))disc++;
  const result={...track,disc_number:disc,track_number:number>0?number:(previous+1||1),global_index:index};
  previous=result.track_number;return result;
 });
}
function trackDiscSections(tracks=[]) {
 const sections=[];
 for(const track of normalizeTrackDiscs(tracks)){
  if(sections.at(-1)?.disc!==track.disc_number)sections.push({disc:track.disc_number,tracks:[]});
  sections.at(-1).tracks.push(track);
 }
 return sections;
}
module.exports={normalizeTrackDiscs,trackDiscSections};
