// Angular paper studies: irregular triangles, cover landmarks and layered print grain.
// The geometry is built locally; no generative service or reference artist's assets.
import fs from 'node:fs/promises';
import sharp from 'sharp';
import {fileURLToPath} from 'node:url';
import {facetScene} from './annual-facet-scenes.mjs';
const S=600,fmt=v=>Number(v.toFixed(2)),escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;');
function random(seed){let n=seed|0;return()=>{n=n+0x6d2b79f5|0;let t=Math.imul(n^n>>>15,1|n);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function circum(a,b,c){
  const d=2*(a[0]*(b[1]-c[1])+b[0]*(c[1]-a[1])+c[0]*(a[1]-b[1]));
  if(Math.abs(d)<.00001)return null;
  const aa=a[0]*a[0]+a[1]*a[1],bb=b[0]*b[0]+b[1]*b[1],cc=c[0]*c[0]+c[1]*c[1];
  const x=(aa*(b[1]-c[1])+bb*(c[1]-a[1])+cc*(a[1]-b[1]))/d;
  const y=(aa*(c[0]-b[0])+bb*(a[0]-c[0])+cc*(b[0]-a[0]))/d;
  return[x,y,(x-a[0])**2+(y-a[1])**2];
}
function triangulate(input){
  const pts=[...input,[-1800,-1600],[2400,-1600],[300,2400]],N=input.length;
  let triangles=[[N,N+1,N+2]];
  for(let i=0;i<N;i++){
    const edges=new Map(),keep=[];
    for(const tri of triangles){const c=circum(...tri.map(v=>pts[v]));if(c&&(pts[i][0]-c[0])**2+(pts[i][1]-c[1])**2<c[2]+.001){
      for(let j=0;j<3;j++){const a=tri[j],b=tri[(j+1)%3],key=a<b?`${a},${b}`:`${b},${a}`;if(edges.has(key))edges.delete(key);else edges.set(key,[a,b]);}
    }else keep.push(tri);}
    triangles=[...keep,...[...edges.values()].map(([a,b])=>[a,b,i])];
  }
  return triangles.filter(tri=>tri.every(v=>v<N)).map(tri=>tri.map(v=>pts[v]));
}
// Areas of recognition: eyes, faces, hands, instruments and small silhouettes.
const focus={mitski:[[300,270,180,120,210],[300,417,130,90,42]],'free-spirits':[[150,140,87,110,160],[450,140,87,110,160],[150,440,87,110,160],[450,440,87,110,160]],robyn:[[340,340,120,140,380]],'dry-cleaning':[[320,280,230,180,270]],gorillaz:[[300,315,90,85,80]],raye:[[100,480,55,80,45]],olivia:[[285,340,130,210,190]],charli:[[300,390,230,100,90]],slayyyter:[[475,180,120,180,85],[105,340,95,125,50]],ratboys:[[300,360,160,90,85]],vince:[[300,310,120,130,120]],angine:[[300,350,220,160,190]],jessie:[[285,110,60,75,90]],harry:[[91,397,55,65,90]],haute:[[410,258,70,80,160],[256,285,70,85,160]]};
export async function buildFacetArt(piece,dir){
  const {id,title,artist,description}=piece;
  const raw=await sharp(fileURLToPath(new URL(`../public/annual/2026/covers/${id}.webp`,import.meta.url))).resize(S,S).removeAlpha().raw().toBuffer();
  const rng=random([...id].reduce((a,c)=>Math.imul(a,31)+c.charCodeAt(0)|0,71));
  const pixel=(x,y)=>{const at=(Math.max(0,Math.min(599,Math.round(y)))*S+Math.max(0,Math.min(599,Math.round(x))))*3;return[raw[at],raw[at+1],raw[at+2]];};
  const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
  const sample=(x,y)=>{
    if(id==='gorillaz'&&x>220&&x<400&&y>60&&y<185)return mix(pixel(x,60),pixel(x,185),(y-60)/125);
    if(id==='raye'&&x>432&&y>40&&y<154)return pixel(452,138);
    if(id==='olivia'&&x>490&&y<105)return pixel(x-130,y+18);
    if(id==='vince')return pixel((x-300)*.65+300,(y-300)*.65+290);
    if(id==='neurosis'||id==='angine')return pixel(x*.88+36,y*.88+72);
    if(id==='rawayana'){const ox=x*.75+25,oy=y*.75+5;return ox>255&&oy>155&&oy<338?pixel(485,130):pixel(ox,oy);}
    return pixel(x,y);
  };
  const lum=(x,y)=>{const c=sample(x,y);return c[0]*.3+c[1]*.59+c[2]*.11;};
  const points=[],taken=new Set();
  const point=(x,y)=>{x=fmt(Math.max(0,Math.min(600,x)));y=fmt(Math.max(0,Math.min(600,y)));const key=`${Math.round(x/3)},${Math.round(y/3)}`;if(!taken.has(key)){taken.add(key);points.push([x,y]);}};
  // Broad directional planes, deliberately varied in scale; no regular triangle grid.
  for(let y=0;y<=600;y+=75)for(let x=0;x<=600;x+=75)point(x,y);
  for(let i=0;i<175;i++)point(rng()*600,rng()*600);
  const candidates=[];
  for(let y=8;y<592;y+=8)for(let x=8;x<592;x+=8){const edge=Math.hypot(lum(x+3,y)-lum(x-3,y),lum(x,y+3)-lum(x,y-3));if(edge>35)candidates.push({x,y,rank:edge*(.5+rng())});}
  candidates.sort((a,b)=>b.rank-a.rank);
  for(const c of candidates.slice(0,230))point(c.x+(rng()-.5)*5,c.y+(rng()-.5)*5);
  for(const [cx,cy,rx,ry,count] of focus[id]||[[300,300,190,220,90]])for(let i=0;i<count;i++){const a=rng()*Math.PI*2,r=Math.sqrt(rng());point(cx+Math.cos(a)*r*rx,cy+Math.sin(a)*r*ry);}
  const triangles=triangulate(points),polygons=[];
  for(const tri of triangles){
    const center=[tri.reduce((s,p)=>s+p[0],0)/3,tri.reduce((s,p)=>s+p[1],0)/3];
    const c=sample(...center);
    if(id==='olivia'&&c[2]>c[0]*1.1&&c[1]>c[0]*1.05)continue;
    // Colour from the core of each paper plane; preserve strong light/shadow masses.
    const l=(c[0]*.3+c[1]*.59+c[2]*.11),tone=(rng()-.5)*5;
    const fill='#'+c.map((v,i)=>{let k=l+(v-l)*1.12; k=k*.96+[8,3,6][i]+tone;return Math.max(0,Math.min(255,Math.round(k/7)*7)).toString(16).padStart(2,'0');}).join('');
    polygons.push(`<path d="M${tri.map(p=>p.map(fmt).join(' ')).join('L')}Z" fill="${fill}" stroke="${fill}" stroke-width=".65"/>`);
  }
  const scene=facetScene(id);
  const flecks=Array.from({length:1100},()=>{const x=fmt(rng()*600),y=fmt(rng()*600),s=fmt(.4+rng()*1.2);return`<path d="M${x} ${y}l${s} ${fmt(-s*.4)} ${fmt(s*.25)} ${fmt(s*.5)}Z"/>`;}).join('');
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 600 600" role="img"><title>${escape(title)} · ${escape(artist)}</title><desc>${escape(description)}. Planos triangulares y recortes de papel con textura de impresión.</desc><defs><clipPath id="silhouette"><path d="${scene.mask}"/></clipPath><filter id="paper"><feTurbulence type="fractalNoise" baseFrequency=".55" numOctaves="3" seed="13" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".22"/></feComponentTransfer><feBlend in="SourceGraphic" mode="multiply"/></filter></defs><rect width="600" height="600" fill="${scene.bg}"/>${scene.under}<g clip-path="url(#silhouette)">${polygons.join('')}</g>${scene.over}<rect width="600" height="600" fill="#f3dfb7" opacity=".065" filter="url(#paper)"/><g fill="#fff1d1" opacity=".16">${flecks}</g></svg>`;
  await fs.mkdir(dir,{recursive:true});await fs.writeFile(new URL(`${id}.svg`,dir),svg);
  const raster=await sharp(Buffer.from(svg)).png().toBuffer();
  await sharp(raster).resize(640,640).webp({quality:85,effort:6}).toFile(fileURLToPath(new URL(`${id}.webp`,dir)));
  await sharp(raster).webp({quality:91,effort:6}).toFile(fileURLToPath(new URL(`${id}-detail.webp`,dir)));
  await sharp(raster).png({palette:true,colours:256,dither:.25,effort:7}).toFile(fileURLToPath(new URL(`${id}.png`,dir)));
  return{id,triangles:triangles.length};
}
