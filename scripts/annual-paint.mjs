// Deterministic, cover-referenced pigment studies. No generative model or image embedding.
import sharp from 'sharp';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const S=600;
const n=x=>Number(x.toFixed(1));
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;');
function random(seed){let v=seed;return()=>{v|=0;v=v+0x6D2B79F5|0;let t=Math.imul(v^v>>>15,1|v);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
export async function paintRelease({id,title,artist,description},outDir,{saveVector=false}={}){
  const {data}=await sharp(fileURLToPath(new URL(`../public/annual/2026/covers/${id}.webp`,import.meta.url))).resize(S,S,{fit:'cover'}).removeAlpha().raw().toBuffer({resolveWithObject:true});
  const rng=random([...id].reduce((a,c)=>a*31+c.charCodeAt(0),17));
  const original=(x,y)=>{const at=(Math.max(0,Math.min(599,Math.round(y)))*S+Math.max(0,Math.min(599,Math.round(x))))*3;return[data[at],data[at+1],data[at+2]];};
  const mix=(a,b,t)=>a.map((c,i)=>c+(b[i]-c)*t);
  const soften=(x,y,box,replacement)=>{
    const [x1,y1,x2,y2]=box;
    if(x<=x1||x>=x2||y<=y1||y>=y2)return original(x,y);
    const edge=Math.min(x-x1,x2-x,y-y1,y2-y),t=Math.min(1,edge/24);
    return mix(original(x,y),replacement,t*t*(3-2*t));
  };
  // Art-directed crops and feathered retouching remove typography without seams.
  const sample=(x,y)=>{
    if(id==='gorillaz'&&x>210&&x<402&&y>60&&y<188)return soften(x,y,[210,60,402,188],mix(original(x,60),original(x,188),(y-60)/128));
    if(id==='raye'&&x>432&&y>40&&y<154)return original(452,138);
    if(id==='olivia'&&x>490&&y<105)return original(x-130,y+18);
    if(id==='vince')return original((x-300)*.65+300,(y-300)*.65+290);
    if(id==='neurosis'||id==='angine')return original(x*.88+36,y*.88+72);
    if(id==='rawayana'){
      const ox=x*.75+25,oy=y*.75+5;
      if(ox>255&&oy>155&&oy<338)return soften(ox,oy,[255,155,620,338],original(485,130));
      return original(ox,oy);
    }
    return original(x,y);
  };
  const luma=(x,y)=>{const c=sample(x,y);return c[0]*.3+c[1]*.59+c[2]*.11;};
  const color=(rgb,lift=0)=>{const avg=rgb.reduce((a,b)=>a+b)/3;return '#'+rgb.map((c,i)=>Math.round(Math.max(0,Math.min(255,(avg+(c-avg)*.88)*.94+[11,6,6][i]+lift))).toString(16).padStart(2,'0')).join('');};
  const marks=[];
  // Loose underpainting, then progressively smaller curved pigment strokes.
  for(const [step,width,len,alpha] of [[16,28,27,.92],[8,13,16,.87],[4,5,8,.8],[2.5,2.5,5,.67]]){
    const pass=[];
    for(let y=0;y<S;y+=step)for(let x=0;x<S;x+=step){
      const px=x+(rng()-.5)*step,py=y+(rng()-.5)*step;
      const gx=luma(px+2,py)-luma(px-2,py),gy=luma(px,py+2)-luma(px,py-2);
      const edge=Math.hypot(gx,gy);
      if(step<4&&edge<17&&rng()>.23)continue;
      const angle=edge>12?Math.atan2(gy,gx)+Math.PI/2:Math.sin(px/93+py/110)*.6-.65;
      const length=len*(.65+rng()*.65)/(edge>45?1.4:1);
      const dx=Math.cos(angle)*length/2,dy=Math.sin(angle)*length/2,bend=(rng()-.5)*length*.4;
      const c=sample(px,py),strokeWidth=width*(.7+rng()*.55);
      pass.push(`<path d="M${n(px-dx)} ${n(py-dy)}Q${n(px-dy*.3+bend)} ${n(py+dx*.3+bend)} ${n(px+dx)} ${n(py+dy)}" stroke="${color(c,(rng()-.5)*5)}" stroke-width="${n(strokeWidth)}"/>`);
    }
    // In a fixed order the drawing is reproducible; order isn't scanline-visible.
    for(let i=pass.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[pass[i],pass[j]]=[pass[j],pass[i]];}
    marks.push(`<g opacity="${alpha}">${pass.join('')}</g>`);
  }
  const pencil=[];
  for(let y=4;y<596;y+=3)for(let x=4;x<596;x+=3){
    const gx=luma(x+2,y)-luma(x-2,y),gy=luma(x,y+2)-luma(x,y-2),edge=Math.hypot(gx,gy);
    if(edge<46||rng()>.24)continue;
    const a=Math.atan2(gy,gx)+Math.PI/2,dx=Math.cos(a)*3,dy=Math.sin(a)*3;
    pencil.push(`<path d="M${n(x-dx)} ${n(y-dy)}q${n(dx*.8)} ${n(dy*.8-1)} ${n(dx*2)} ${n(dy*2)}"/>`);
  }
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 600 600" role="img"><title>${esc(title)} · ${esc(artist)}</title><desc>${esc(description)}. Estudio digital de pigmento y lápiz a partir de la portada.</desc><defs><filter id="paper" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".64" numOctaves="3" seed="24" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".13"/></feComponentTransfer><feBlend in="SourceGraphic" mode="multiply"/></filter><radialGradient id="light"><stop stop-color="#fff6df" stop-opacity=".06"/><stop offset="1" stop-color="#17122b" stop-opacity=".09"/></radialGradient></defs><rect width="600" height="600" fill="#e9dfcc"/><g fill="none" stroke-linecap="round" stroke-linejoin="round">${marks.join('')}<g stroke="#302938" stroke-width=".65" opacity=".34">${pencil.join('')}</g></g><rect width="600" height="600" fill="url(#light)"/><rect width="600" height="600" fill="#f3e8d4" opacity=".08" filter="url(#paper)"/></svg>`;
  await fs.mkdir(outDir,{recursive:true});
  if(saveVector)await fs.writeFile(new URL(`${id}.svg`,outDir),svg);
  const raster=await sharp(Buffer.from(svg)).png().toBuffer();
  await sharp(raster).resize(640,640).webp({quality:84,effort:6}).toFile(fileURLToPath(new URL(`${id}.webp`,outDir)));
  await sharp(raster).webp({quality:89,effort:6}).toFile(fileURLToPath(new URL(`${id}-detail.webp`,outDir)));
  await sharp(raster).png({palette:true,colours:256,dither:.35,effort:10}).toFile(fileURLToPath(new URL(`${id}.png`,outDir)));
  return {id,bytes:Buffer.byteLength(svg)};
}
