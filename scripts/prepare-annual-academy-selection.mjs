import fs from 'node:fs/promises';
import academy from '../src/server/annual2026Academy.json' with {type:'json'};
import identity from '../src/utils/releaseIdentity.cjs';
import {createClient} from '@supabase/supabase-js';
import dotenv from 'dotenv';
import {GRAMMY_CATEGORIES} from '../src/data/grammys2027.mjs';
dotenv.config({path:'.env.local',quiet:true});dotenv.config({quiet:true});
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL||process.env.REACT_APP_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||process.env.REACT_APP_SUPABASE_ANON_KEY,{auth:{persistSession:false}});
const {data:nominees,error}=await db.from('grammy_nominees').select('category_id,albums(id,album_name,artist_name,image_url,release_type,release_year,release_date,genres,spotify_link,apple_music_link,other_link)');if(error)throw Error('Cannot read nominated catalogue projects');
await fs.mkdir('outputs/v1233',{recursive:true});
const replacements={'madonna':['charlie-puth',"Whatever's Clever!"],'olivia-dean':['jill-scott','To Whom This May Concern'],'taylor':['muse','The Wow! Signal'],'geese':['rapsody','God Gotta Afro & Gold Hoops'],'leon-thomas':['lakecia-benjamin','We Dream'],'angine':['charli','Wuthering Heights']};
const rows=academy.releases.map(r=>{
 const replacement=replacements[r.id];if(!replacement)return {...r};
 const [id,title]=replacement,n=nominees.find(n=>n.albums?.album_name===title&&n.albums.release_year===2026&&n.albums.release_type==='ALBUM');if(!n)throw Error('Missing 2026 nominated album: '+title);const a=n.albums;
 return {id,title:a.album_name,artist:a.artist_name,albumId:a.id,image:a.image_url,date:a.release_date,year:a.release_year,type:a.release_type,genres:a.genres,spotify:a.spotify_link,apple:a.apple_music_link,other:a.other_link,category:GRAMMY_CATEGORIES.find(c=>c.id===n.category_id)?.name||n.category_id};
});
const evidence=[];
for(const r of rows){
 if(r.year!==2026||r.type!=='ALBUM')throw Error('Artwork must depict a 2026 album: '+r.title);
 const key=value=>identity.slugify(String(value||'').replace(/ - (Single|EP)$/i,''),true),candidates=[];
 const appleId=r.apple?.match(/\/album\/(?:[^/]+\/)?(\d+)/)?.[1];
 try{const url=appleId?'https://itunes.apple.com/lookup?id='+appleId+'&country=mx':'https://itunes.apple.com/search?entity=album&limit=15&country=mx&term='+encodeURIComponent(r.artist+' '+r.title);const response=await fetch(url,{signal:AbortSignal.timeout(12000)}),data=await response.json();candidates.push(...(data.results||[]).filter(a=>key(a.collectionName)===key(r.title)&&key(a.artistName)===key(r.artist)&&a.releaseDate?.startsWith('2026')).map(a=>({image:a.artworkUrl100.replace('100x100bb','1200x1200bb'),date:a.releaseDate.slice(0,10),apple:a.collectionViewUrl,provider:'APPLE',id:a.collectionId})));}catch{}
 if(!candidates.length&&r.other?.includes('/album/'))try{const id=r.other.match(/\/album\/(\d+)/)?.[1],response=await fetch('https://api.deezer.com/album/'+id,{signal:AbortSignal.timeout(12000)}),a=await response.json();if(key(a.title)===key(r.title)&&key(a.artist?.name)===key(r.artist)&&a.release_date?.startsWith('2026'))candidates.push({image:a.cover_xl,date:a.release_date,provider:'DEEZER',id:a.id});}catch{}
 if(!candidates.length)throw Error('No verified 2026 cover found: '+r.title);
 const chosen=candidates[0];r.image=chosen.image;r.date=chosen.date;if(chosen.apple)r.apple=chosen.apple;
 evidence.push({artworkId:r.id,albumId:r.albumId,title:r.title,artist:r.artist,year:2026,...chosen,providerId:chosen.id});
}
if(new Set(rows.map(r=>r.albumId)).size!==20)throw Error('Expected 20 distinct albums');
await fs.writeFile('outputs/v1233/academy-artwork-evidence.json',JSON.stringify(evidence,null,2));
await fs.writeFile('src/server/annual2026Academy.json',JSON.stringify({...academy,asOf:'2026-11-26',method:'Veinte álbumes distintos publicados en 2026, representados en categorías Grammy. Las portadas y fechas se contrastan con las fichas oficiales de cada edición.',releases:rows},null,2)+'\n');
const pieces=rows.map(r=>({id:r.id,title:r.title,artist:r.artist,description:`La portada de ${r.title}, de ${r.artist}, reinterpretada con planos cubistas y recortes irregulares.`,catalogPath:identity.releasePath({album_name:r.title,artist_name:r.artist_name||r.artist,release_type:'ALBUM'})}));
await fs.writeFile('src/data/annual2026Art.mjs','// Twenty verified 2026 albums represented in the Grammy field. Public art only.\nexport const ANNUAL_ART = '+JSON.stringify(pieces,null,2)+".map(piece=>({...piece,assetId:piece.id,src:`/annual/2026/cubist-grammys/${piece.id}.webp`,detailSrc:`/annual/2026/cubist-grammys/${piece.id}-detail.webp`,download:`/annual/2026/cubist-grammys/${piece.id}.png`}));\n");
console.log('Verified twenty distinct 2026 album covers.');
