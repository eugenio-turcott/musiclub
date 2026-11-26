// A preview containing one of an album's tracks is not a one-track release.
function isSingleTrackRelease(release){
 const tracks=release?.tracks;
 const declared=Number(release?.total_tracks||release?.totalTracks);
 return Array.isArray(tracks)&&tracks.length===1&&(!declared||declared===1);
}
function singleTrackScore(release,ratings={}){
 if(!isSingleTrackRelease(release))return null;
 const track=release.tracks[0];
 const keys=typeof track==='string'?[track,'1','0']:[track.id,track.spotify_id,...(track.id_aliases||[]),track.name,track.track_name,'1','0'];
 const key=keys.find(key=>key!=null&&Object.hasOwn(ratings,key));
 const raw=ratings[key],score=raw===null||raw===undefined||raw===''?NaN:Number(raw);
 return Number.isFinite(score)&&score>=1&&score<=10?score:null;
}
module.exports={isSingleTrackRelease,singleTrackScore};
