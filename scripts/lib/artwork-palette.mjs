import sharp from 'sharp';
const distance=(a,b)=>a.reduce((n,v,i)=>n+(v-b[i])**2,0);
export async function extractArtworkPalette(bytes){
 const {data,info}=await sharp(bytes,{limitInputPixels:40000000}).rotate().resize(64,64,{fit:'inside'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const buckets=new Map();
 for(let i=0;i<data.length;i+=info.channels){
  if(data[i+3]<128)continue;
  const rgb=[data[i],data[i+1],data[i+2]],key=rgb.map(v=>Math.round(v/24)).join(':');
  const b=buckets.get(key)||{sum:[0,0,0],count:0};rgb.forEach((v,j)=>b.sum[j]+=v);b.count++;buckets.set(key,b);
 }
 const ranked=[...buckets.values()].map(b=>({rgb:b.sum.map(v=>Math.round(v/b.count)),count:b.count})).sort((a,b)=>b.count-a.count);
 const selected=[];
 for(const entry of ranked)if(selected.every(old=>distance(old.rgb,entry.rgb)>2700)){selected.push(entry);if(selected.length===5)break;}
 return selected.map(({rgb})=>'#'+rgb.map(v=>v.toString(16).padStart(2,'0')).join(''));
}
export function permittedArtworkURL(value){
 try{const u=new URL(value);return u.protocol==='https:'&&(/(^|\.)(image-cdn-ak\.spotifycdn\.com|f4\.bcbits\.com|shop\.echobase\.com|assets\.diggersfactory\.com|cdn\.sanity\.io|kaceymusgraves\.com|i1\.sndcdn\.com|wph-live\.s3\.amazonaws\.com|www\.musiclub\.org|scdn\.co|dzcdn\.net|mzstatic\.com|rcrd\.club|supabase\.co|musicbrainz\.org|coverartarchive\.org|archive\.org|googleusercontent\.com|ytimg\.com|tidal\.com|images\.unsplash\.com)$/.test(u.hostname))?u:null;}catch{return null;}
}
