// Rebuild only from a reviewed public-page capture. No external fetch occurs in page renders.
import fs from 'node:fs/promises';
import sharp from 'sharp';
import {ANNUAL_ART} from '../src/data/annual2026Art.mjs';
const evidence=JSON.parse(await fs.readFile(new URL('../docs/data/annual-2026-global-observed.json',import.meta.url),'utf8'));
const counts=value=>{const s=String(value||'').replace(/[(),]/g,'').trim(),n=Number(s.match(/[\d.]+/)?.[0]);return Number.isFinite(n)?Math.round(n*(/k/i.test(s)?1000:1)):null;};
const date=(label,year)=>{const raw=String(label||'').split(' • ')[0];const time=Date.parse(raw.includes(String(year))?raw:`${raw}, ${year}`);return Number.isFinite(time)?new Date(time).toISOString().slice(0,10):null;};
const limits={albums:20,eps:10,singles:10,popular:60,critics:10,live:8,soundtracks:8,compilations:8,upcoming:8};
const releases=new Map(),groups={};
for(const [key,limit] of Object.entries(limits)){
 const snapshot=evidence[key];if(!snapshot?.rows?.length)throw Error(`Missing reviewed source: ${key}`);
 const candidates=key==='upcoming'?snapshot.rows.filter(r=>r.type==='lp'):snapshot.rows;
 groups[key]=candidates.slice(0,limit).map(row=>{
  const match=row.url.match(/\/album\/(\d+)/);if(!match)throw Error('Invalid release identity');const id=`aoty-${match[1]}`,previous=releases.get(id)||{};
  const ratings=Object.fromEntries(row.ratings.map(r=>[r.kind.replaceAll(' ','').replace('score',''),{score:r.score,count:counts(r.count),countDisplay:String(r.count||'').replace(/[()]/g,'').replace(/\s*(ratings|reviews)$/,'').trim(),approximate:/k/i.test(r.count||'')}]));
  const releaseDate=date(row.dateLabel,key==='upcoming'?2027:2026);
  releases.set(id,{...previous,id,title:row.title,artist:row.artist,type:row.type||previous.type,releaseDate,genres:row.genres?.length?row.genres:previous.genres||[],imageSource:row.image,image:`/annual/2026/global/${id}.webp`,sourceUrl:row.url,global:{...previous.global,...ratings}});
  return id;
 });
}
const snapshot={asOf:'2026-11-19',source:'AOTY',sources:Object.fromEntries(Object.entries(evidence).map(([key,value])=>[key,value.url])),groups,releases:[...releases.values()]};
const dir=new URL('../public/annual/2026/global/',import.meta.url);await fs.mkdir(dir,{recursive:true});
const bundles=await fs.readFile(new URL('../outputs/annual-global-bundles.json',import.meta.url),'utf8').then(JSON.parse).catch(error=>{if(error.code==='ENOENT')return [];throw error;});
const missing=[];
const fold=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
for(const r of snapshot.releases){
 const target=new URL(r.id+'.webp',dir),asset=bundles.find(a=>a.url.includes('/album/'+r.id.replace('aoty-','')+'-')),native=ANNUAL_ART.find(a=>fold(a.title)===fold(r.title)&&fold(a.artist)===fold(r.artist));
 let buffer=null;
 if(asset)try{buffer=await fs.readFile(asset.path);}catch(error){if(error.code!=='ENOENT')throw error;}
 if(!buffer&&native)buffer=await fs.readFile(new URL('../public/annual/2026/covers/'+native.id+'.webp',import.meta.url));
 if(buffer)await fs.writeFile(target,await sharp(buffer).resize(400,400,{fit:'cover',withoutEnlargement:true}).webp({quality:86}).toBuffer());
 else try{await fs.access(target);}catch{r.image=null;missing.push(r.id);}
}
await fs.writeFile(new URL('../src/server/annual2026Global.json',import.meta.url),JSON.stringify(snapshot,null,2)+'\n');
console.log({releases:snapshot.releases.length,uncached:missing.length,groups:Object.fromEntries(Object.entries(groups).map(([key,ids])=>[key,ids.length]))});
