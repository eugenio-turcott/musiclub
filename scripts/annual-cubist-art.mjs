// Faceted portrait studies: broad supporting planes and finer geometry at
// eyes, hands and silhouettes. Colours and light come from each verified cover.
import fs from 'node:fs/promises';
import sharp from 'sharp';
import {fileURLToPath} from 'node:url';
import {quadrilateralPlanes} from './annual-cubist-planes.mjs';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),num=v=>Number(v.toFixed(2));
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;');
const distance=(a,b)=>(a[0]-b[0])**2*.8+(a[1]-b[1])**2+(a[2]-b[2])**2*.7;
const hex=c=>'#'+c.map(v=>clamp(Math.round(v),0,255).toString(16).padStart(2,'0')).join('');
export async function buildCubistArt(piece,dir,{planes=1600,inks=128,gradient=true,quadStrength=.8}={}){
  const source=await fs.readFile(new URL(`../public/annual/2026/covers/${piece.id}.webp`,import.meta.url));
  const raw=await sharp(source).resize(600,600).median(piece.id==='underscores'?7:3).removeAlpha().raw().toBuffer();
  const pixel=(x,y)=>{const at=(clamp(Math.round(y),0,599)*600+clamp(Math.round(x),0,599))*3;return[raw[at],raw[at+1],raw[at+2]];};
  const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
  // Recompose printed labels as scenery. Tiny lettering otherwise becomes
  // broken glyphs when converted to planes; retain the cover's visual subjects.
  const sample=(x,y)=>{
    if(piece.id==='gorillaz'&&x>215&&x<390&&y>60&&y<185)return mix(pixel(x,60),pixel(x,185),(y-60)/125);
    if(piece.id==='raye'&&x>449&&x<550&&y>53&&y<154)return mix([250,225,165],[222,180,106],(y-53)/101);
    if(piece.id==='olivia'&&x>490&&y<105)return pixel(x-130,y+18);
    if(piece.id==='vince')return pixel((x-300)*.65+300,(y-300)*.65+290);
    if(piece.id==='angine'&&y<90)return pixel(20,20);
    if(piece.id==='rawayana'){
      const ox=x*.75+25,oy=y*.75+5,c=pixel(ox,oy);
      const arm=ox<340&&Math.abs(oy-(.85*ox+12))<14;
      if(ox>250&&oy>153&&oy<285&&!arm)return mix(pixel(480,145),pixel(480,290),(oy-153)/132);
      return c;
    }
    if(piece.id==='harry')return pixel(x<21?42-x:x>438?876-x:x,y<21?42-y:y>578?1156-y:y);
    return pixel(x,y);
  };
  const samples=[];for(let y=5;y<600;y+=10)for(let x=5;x<600;x+=10)samples.push(sample(x,y));
  const palette=Array.from({length:inks},(_,i)=>[...samples[Math.floor(i*samples.length/inks)]]);
  for(let iteration=0;iteration<12;iteration++){
    const sums=palette.map(()=>[0,0,0,0]);
    for(const c of samples){let best=0;for(let i=1;i<palette.length;i++)if(distance(c,palette[i])<distance(c,palette[best]))best=i;c.forEach((v,i)=>sums[best][i]+=v);sums[best][3]++;}
    sums.forEach((s,i)=>{if(s[3])palette[i]=s.slice(0,3).map(v=>v/s[3]);});
  }
  const ink=c=>{let best=0;for(let i=1;i<palette.length;i++)if(distance(c,palette[i])<distance(c,palette[best]))best=i;return palette[best];};
  const N=180,unit=600/N,across=Math.round(Math.sqrt(planes)),step=N/across;
  const pixels=Array.from({length:N*N},(_,i)=>sample(i%N*unit+unit/2,Math.floor(i/N)*unit+unit/2));
  const centers=Array.from({length:across*across},(_,i)=>{const x=(i%across+.5)*step,y=(Math.floor(i/across)+.5)*step;return{x,y,c:sample(x*unit,y*unit)};});
  const labels=new Int16Array(N*N);
  for(let iteration=0;iteration<10;iteration++){
    const best=new Float64Array(N*N).fill(Infinity),sums=centers.map(()=>[0,0,0,0,0,0]);
    centers.forEach((center,k)=>{for(let y=Math.max(0,Math.floor(center.y-step*2));y<Math.min(N,center.y+step*2);y++)for(let x=Math.max(0,Math.floor(center.x-step*2));x<Math.min(N,center.x+step*2);x++){
      const i=y*N+x,d=distance(pixels[i],center.c)/900+((x-center.x)**2+(y-center.y)**2)/(step*step);
      if(d<best[i]){best[i]=d;labels[i]=k;}
    }});
    pixels.forEach((c,i)=>{const s=sums[labels[i]];s[0]+=i%N;s[1]+=Math.floor(i/N);c.forEach((v,j)=>s[j+2]+=v);s[5]++;});
    sums.forEach((s,k)=>{if(s[5])centers[k]={x:s[0]/s[5],y:s[1]/s[5],c:s.slice(2,5).map(v=>v/s[5])};});
  }
  // Remove isolated specks, while retaining eye highlights, fingers and details.
  for(let pass=0;pass<2;pass++){const seen=new Set();for(let i=0;i<labels.length;i++){if(seen.has(i))continue;const label=labels[i],part=[i],around=new Map();seen.add(i);for(let q=0;q<part.length;q++){const at=part[q],x=at%N,y=Math.floor(at/N);for(const next of [x?at-1:-1,x<N-1?at+1:-1,y?at-N:-1,y<N-1?at+N:-1]){if(next<0)continue;if(labels[next]===label){if(!seen.has(next)){seen.add(next);part.push(next);}}else around.set(labels[next],(around.get(labels[next])||0)+1);}}if(part.length<3&&around.size){const replacement=[...around].sort((a,b)=>b[1]-a[1])[0][0];for(const at of part)labels[at]=replacement;}}}
  const edges=centers.map(()=>new Map()),key=(x,y)=>y*(N+1)+x;
  const edge=(k,x,y,xx,yy)=>{const a=key(x,y);if(!edges[k].has(a))edges[k].set(a,[]);edges[k].get(a).push(key(xx,yy));};
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const k=labels[y*N+x];if(y===0||labels[(y-1)*N+x]!==k)edge(k,x,y,x+1,y);if(x===N-1||labels[y*N+x+1]!==k)edge(k,x+1,y,x+1,y+1);if(y===N-1||labels[(y+1)*N+x]!==k)edge(k,x+1,y+1,x,y+1);if(x===0||labels[y*N+x-1]!==k)edge(k,x,y+1,x,y);}
  const tolerance=3.8;
  const rdp=p=>{if(p.length<3)return p;const a=p[0],b=p.at(-1);let max=0,index=0;for(let i=1;i<p.length-1;i++){const d=Math.abs((b[0]-a[0])*(p[i][1]-a[1])-(b[1]-a[1])*(p[i][0]-a[0]))/Math.max(1,Math.hypot(b[0]-a[0],b[1]-a[1]));if(d>max){max=d;index=i;}}return max>tolerance?[...rdp(p.slice(0,index+1)).slice(0,-1),...rdp(p.slice(index))]:[a,b];};
  const simplify=p=>{let far=1;for(let i=2;i<p.length;i++)if(Math.hypot(p[i][0]-p[0][0],p[i][1]-p[0][1])>Math.hypot(p[far][0]-p[0][0],p[far][1]-p[0][1]))far=i;const result=[...rdp(p.slice(0,far+1)).slice(0,-1),...rdp([...p.slice(far),p[0]]).slice(0,-1)];return result.length>=4?result:p;};
  const definitions=[];
  const paths=edges.map((map,k)=>{const loops=[];while(map.size){const start=map.keys().next().value;let at=start,loop=[],guard=0;do{loop.push([at%(N+1)*unit,Math.floor(at/(N+1))*unit]);const to=map.get(at);if(!to?.length)break;const next=to.pop();if(!to.length)map.delete(at);at=next;}while(at!==start&&guard++<N*N*4);if(loop.length>3)loops.push(simplify(loop));}
    const c=ink(centers[k].c).map((v,i)=>v*.55+centers[k].c[i]*.45),cx=centers[k].x*unit,cy=centers[k].y*unit,r=step*unit;
    const light=sample(cx-r*.4,cy-r*.4),dark=sample(cx+r*.4,cy+r*.4),delta=clamp((light.reduce((a,v)=>a+v,0)-dark.reduce((a,v)=>a+v,0))/6,-16,16);
    if(gradient)definitions.push(`<linearGradient id="p${k}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${hex(c.map(v=>v+delta*.7+3))}"/><stop offset="1" stop-color="${hex(c.map(v=>v-delta*.7-3))}"/></linearGradient>`);
    return `<path d="${loops.map(p=>'M'+p.map(v=>v.map(num).join(' ')).join('L')+'Z').join('')}" fill="${gradient?`url(#p${k})`:hex(c)}" stroke="${hex(c)}" stroke-width="4" stroke-linejoin="bevel" fill-rule="evenodd"/>`;
  });
  const quads=quadrilateralPlanes(sample,{strength:quadStrength,seed:piece.id});
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 600 600" role="img" data-art-edition="cubist-collage" data-main-planes="${centers.length}" data-quad-planes="${quads.count}" data-inks="${inks}"><title>${escape(piece.title)} · ${escape(piece.artist)}</title><desc>Interpretación cubista de ${escape(piece.title)}, con recortes irregulares superpuestos, luz, volumen y detalles de la portada.</desc><defs>${definitions.join('')}${quads.definitions}<filter id="paper"><feTurbulence type="fractalNoise" baseFrequency=".68" numOctaves="3" seed="17" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".14"/></feComponentTransfer><feBlend in="SourceGraphic" mode="multiply"/></filter></defs><rect width="600" height="600" fill="${hex(ink(sample(300,300)))}"/>${paths.join('')}${quads.paths}<rect width="600" height="600" fill="#f6dfbc" opacity=".035" filter="url(#paper)"/></svg>`;
  await fs.mkdir(dir,{recursive:true});await fs.writeFile(new URL(`${piece.id}.svg`,dir),svg);
  const raster=await sharp(Buffer.from(svg)).png().toBuffer();
  for(const [suffix,size,quality] of [['',640,87],['-detail',1200,94]])await fs.writeFile(new URL(`${piece.id}${suffix}.webp`,dir),await sharp(raster).resize(size,size).webp({quality,effort:6}).toBuffer());
  await fs.writeFile(new URL(`${piece.id}.png`,dir),await sharp(raster).png().toBuffer());
  return{id:piece.id,planes:centers.length};
}
