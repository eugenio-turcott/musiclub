import fs from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';
import {createClient} from '@supabase/supabase-js';
import {getSortedTrackRatings,getTrackDisplayName} from '../src/utils/ratingUtils.js';
import editions from '../src/utils/releaseEditions.cjs';

dotenv.config({path:'.env.local',quiet:true});dotenv.config({path:'.env',quiet:true});
const db=process.env.TRACK_AUDIT_INPUT?null:createClient(process.env.NEXT_PUBLIC_SUPABASE_URL||process.env.REACT_APP_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||process.env.REACT_APP_SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
async function read(table,fields){const rows=[];for(let from=0;;from+=500){const {data,error}=await db.from(table).select(fields).order('id').range(from,from+499);if(error)throw new Error(`${table}: ${error.message}`);rows.push(...data);if(data.length<500)return rows;}}
const {albums,reviews}=process.env.TRACK_AUDIT_INPUT?JSON.parse(await fs.readFile(process.env.TRACK_AUDIT_INPUT,'utf8')):await Promise.all([read('albums','id,album_name,artist_name,tracks,total_tracks,release_type,release_date,spotify_link,apple_music_link,other_link,mbid'),read('public_reviews','id,album_id,reviewer_name,track_ratings,favorite_track,created_at')]).then(([albums,reviews])=>({albums,reviews}));
const byId=new Map(albums.map(a=>[a.id,a]));
const grouped=new Map(editions.groupReleaseEditions(albums).flatMap(a=>a.edition_member_ids.map(id=>[id,a])));
const issues=[];let ratingKeys=0,favorites=0;
for(const review of reviews){
 const raw=byId.get(review.album_id),rendered=grouped.get(review.album_id);
 const tracks=rendered?.tracks||[];
 const ratings=typeof review.track_ratings==='string'?JSON.parse(review.track_ratings):review.track_ratings||{};
 const rows=getSortedTrackRatings(ratings,tracks);ratingKeys+=rows.length;
 const unresolved=rows.filter(r=>r.index<0).map(r=>({key:r.key,display:getTrackDisplayName(r.key,tracks)}));
 const favorite=review.favorite_track; if(favorite)favorites++;
 const favoriteUnresolved=Boolean(favorite&&getSortedTrackRatings({[favorite]:1},tracks)[0]?.index<0);
 if(!raw||unresolved.length||favoriteUnresolved)issues.push({album_id:review.album_id,album:raw?.album_name,artist:raw?.artist_name,review_id:review.id,reviewer:review.reviewer_name,tracks:tracks.length,ratings:rows.length,unresolved,favorite:favoriteUnresolved?favorite:null,source_track_count:raw?.tracks?.length||0,edition_member_ids:rendered?.edition_member_ids});
}
const directory=path.resolve(process.env.TRACK_AUDIT_DIR||`outputs/review-track-audit-${new Date().toISOString().slice(0,10)}`);await fs.mkdir(directory,{recursive:true});
await fs.writeFile(path.join(directory,'snapshot.json'),JSON.stringify({albums,reviews},null,2));
const report={audited_at:new Date().toISOString(),counts:{albums:albums.length,reviews:reviews.length,rating_references:ratingKeys,favorites,affected_reviews:issues.length,affected_albums:new Set(issues.map(i=>i.album_id)).size},issues};
await fs.writeFile(path.join(directory,'report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({counts:report.counts,affected:issues.map(i=>({album:i.album,artist:i.artist,reviewer:i.reviewer,unknown:i.unresolved.length,favorite:i.favorite}))},null,2));
