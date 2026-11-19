import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
import snapshot from '../src/server/annual2026Global.json' with {type:'json'};
import genres from '../src/utils/genreCatalog.cjs';
const dir=new URL('../outputs/yearbook-catalog/',import.meta.url),file=n=>new URL(n,dir);
const rows=JSON.parse(await fs.readFile(file('resolved.json'),'utf8'));
const decode=s=>String(s).replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const meta=(h,name)=>decode(h.match(new RegExp('<meta[^>]+(?:property|name)=["\']'+name+'["\'][^>]+content=["\']([^"\']+)'))?.[1]||'');
const sources=[
 ['aoty-1607155','spotify','2VDn7Y8xO8c09edBK3waKj'],
 ['aoty-1384430','spotify','3Ge6S7DSl3XH69XR3Cg6T6',['Hip-Hop']],
 ['aoty-1860919','spotify','3hwveWhYFxGDLy6K6xlwFh',['Hip-Hop']],
 ['aoty-1438836','deezer','859881652',['Hip-Hop']],
 ['aoty-1797235','bandcamp','https://janeremover.bandcamp.com/album/status-update-music'],
 ['aoty-1962089','bandcamp','https://gingerbee.bandcamp.com/album/gingerbee-at-thalia-hall'],
 ['aoty-1615049','bandcamp','https://geesebandnyc.bandcamp.com/album/live-at-third-man-records'],
 ['aoty-1695089','bandcamp','https://thecomingstriferecords.bandcamp.com/album/tcs-160-dusks-cold-embrace'],
 ['aoty-1595896','bandcamp','https://dbeatdropdeadpowerhead.bandcamp.com/album/arin-cot',['Indie Rock']],
 ['aoty-1773837','apple','6768201775'],
 ['aoty-1875805','spotify','3OJ9TwVn8TZxuQDIwo721s'],
 ['aoty-1709835','bandcamp','https://heavenpierceher.bandcamp.com/album/ultrakill-fraud'],
 ['aoty-2023226','bandcamp',"https://carissaswierd.bandcamp.com/album/somewhere-further-than-far-away"],
 ['aoty-1507177','image','https://cdn.sanity.io/images/3skntwub/production/1b9b7086a45832aa5bca3e5a668fd207d71ecc5d-1024x1024.webp'],
 ['aoty-2093995','store','https://kaceymusgraves.com/products/middle-of-nowhere-vol-2-tex-mex-tapes-cd',['Country']],
 ['aoty-2000228','store','https://allthekingsmen.chvrch.es/es/cd/336888/chvrches-all-the-kings-men-cd',['Synth-Pop','Rock Alternativo']],
 ['aoty-2119087','store','https://shop.echobase.com/products/glaive-polesden-lacey',['Pop']],
];
for(const [id,provider,source,verifiedGenres=[]] of process.argv.includes('--cache-only')?[]:sources){const r=Object.values(rows).find(r=>r.annualId===id);if(!r)continue;try{
 let image,tracks=[],evidence;
 if(provider==='spotify'){
  const h=await (await fetch('https://open.spotify.com/embed/album/'+source)).text(),entity=JSON.parse(h.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s)[1]).props.pageProps.state.data.entity;
  image=[...entity.visualIdentity.image].sort((a,b)=>b.maxWidth-a.maxWidth)[0].url;tracks=entity.trackList.map((t,i)=>({id:t.uri.split(':').at(-1),name:t.title,duration_ms:t.duration,track_number:i+1}));r.links.spotify='https://open.spotify.com/album/'+source;evidence={provider:'Spotify public album',url:r.links.spotify,title:entity.title||entity.name,artist:entity.subtitle};
 }else if(provider==='bandcamp'){
  const h=await (await fetch(source)).text();image=meta(h,'og:image');evidence={provider:'Artist/label Bandcamp',url:source,title:meta(h,'og:title')};r.links.other=source;
  const data=h.match(/data-tralbum="([^"]+)"/)?.[1];if(data){const j=JSON.parse(decode(data));tracks=(j.trackinfo||[]).map(t=>({id:'bandcamp-'+t.track_id,name:t.title,duration_ms:Math.round(t.duration*1000),track_number:t.track_num}));}
 }else if(provider==='deezer'){
  const a=await (await fetch('https://api.deezer.com/album/'+source)).json();image=a.cover_xl;r.genres=genres.normalizeGenres([...r.genres,...a.genres.data.map(g=>g.name)]);tracks=a.tracks.data.map((t,i)=>({id:'deezer-'+t.id,name:t.title,duration_ms:t.duration*1000,track_number:i+1}));r.links.deezer=a.link;evidence={provider:'Deezer',id:a.id,title:a.title,artist:a.artist.name};
 }else if(provider==='image'){
  image=source;evidence={provider:'Official artist store artwork',url:'https://www.after.band/mobile'};
 }else if(provider==='store'){
  const h=await (await fetch(source)).text();image=meta(h,'og:image').replace(/^http:/,'https:');evidence={provider:'Official artist store',url:source,title:meta(h,'og:title')};r.links.other=source;
 }else{
  const j=await (await fetch('https://itunes.apple.com/lookup?id='+source+'&entity=song')).json(),a=j.results.find(r=>r.wrapperType==='collection');image=a.artworkUrl100.replace('100x100bb','1200x1200bb');tracks=j.results.filter(t=>t.wrapperType==='track').map(t=>({id:'apple-'+t.trackId,name:t.trackName,duration_ms:t.trackTimeMillis,track_number:t.trackNumber}));r.links.apple=a.collectionViewUrl;evidence={provider:'Apple Music',id:a.collectionId,title:a.collectionName,artist:a.artistName};
 }
 if(!image)throw new Error('No cover supplied by source');
 r.image=image;r.tracks=tracks.length?tracks:r.tracks;r.genres=genres.normalizeGenres([...r.genres,...verifiedGenres]);r.evidence.push(evidence);r.complete=Boolean(r.genres.length);console.log(r.title,'verified',tracks.length);
 }catch(e){console.log(r.title,e.message);}}
await fs.writeFile(file('resolved.json'),JSON.stringify(rows,null,2));
// Cache actual source pixels, never upscale a small thumbnail to claim HD.
if(process.argv.includes('--cache'))for(const r of Object.values(rows).filter(r=>r.annualId&&r.complete)){
 if(process.argv.includes('--missing')&&snapshot.releases.find(a=>a.id===r.annualId)?.imageWidth>=500)continue;
 try{const response=await fetch(r.image,{signal:AbortSignal.timeout(18000)});if(!response.ok)throw new Error('HTTP '+response.status);const bytes=Buffer.from(await response.arrayBuffer()),info=await sharp(bytes).metadata(),minimum=snapshot.groups.albums.includes(r.annualId)?600:500;if(info.width<minimum||info.height<minimum)throw new Error('Source below '+minimum+'px: '+info.width);const path='/annual/2026/global/'+r.annualId+'-hd.webp';await sharp(bytes).resize(1200,1200,{fit:'cover',withoutEnlargement:true}).webp({quality:91}).toFile(fileURLToPath(new URL('../public'+path,import.meta.url)));const release=snapshot.releases.find(a=>a.id===r.annualId);release.image=path;release.imageSource=r.image;release.genres=r.genres;release.imageWidth=Math.min(info.width,1200);console.log('HD',r.title,info.width);}catch(e){console.log('cover pending',r.title,e.message);}}
if(process.argv.includes('--cache'))await fs.writeFile(new URL('../src/server/annual2026Global.json',import.meta.url),JSON.stringify(snapshot,null,2)+'\n');
