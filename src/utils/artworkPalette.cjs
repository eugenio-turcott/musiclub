function paletteFromPixels(data,{width,height,channels=4,depth=8}){
 const buckets=new Map(),step=Math.max(1,Math.ceil(Math.sqrt(width*height/4096))),scale=depth===16?257:1;
 for(let y=0;y<height;y+=step)for(let x=0;x<width;x+=step){
  const i=(y*width+x)*channels,alpha=channels===2?data[i+1]:channels===4?data[i+3]:255*scale;
  if(alpha/scale<128)continue;
  const rgb=(channels<3?[data[i],data[i],data[i]]:[data[i],data[i+1],data[i+2]]).map(v=>Math.round(v/scale));
  const key=rgb.map(v=>Math.round(v/24)).join(':');const b=buckets.get(key)||{sum:[0,0,0],count:0};rgb.forEach((v,j)=>b.sum[j]+=v);b.count++;buckets.set(key,b);
 }
 const ranked=[...buckets.values()].map(b=>({rgb:b.sum.map(v=>Math.round(v/b.count)),count:b.count})).sort((a,b)=>b.count-a.count),selected=[];
 for(const entry of ranked)if(selected.every(old=>old.rgb.reduce((d,v,i)=>d+(v-entry.rgb[i])**2,0)>2700)){selected.push(entry);if(selected.length===5)break;}
 return selected.map(({rgb})=>'#'+rgb.map(v=>v.toString(16).padStart(2,'0')).join(''));
}
function permittedArtworkURL(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&/(^|\.)(image-cdn-ak\.spotifycdn\.com|f4\.bcbits\.com|shop\.echobase\.com|assets\.diggersfactory\.com|cdn\.sanity\.io|kaceymusgraves\.com|i1\.sndcdn\.com|wph-live\.s3\.amazonaws\.com|www\.musiclub\.org|scdn\.co|dzcdn\.net|mzstatic\.com|rcrd\.club|supabase\.co|musicbrainz\.org|coverartarchive\.org|archive\.org|googleusercontent\.com|ytimg\.com|tidal\.com|images\.unsplash\.com)$/.test(u.hostname)?u:null;}catch{return null;}}
module.exports={paletteFromPixels,permittedArtworkURL};
