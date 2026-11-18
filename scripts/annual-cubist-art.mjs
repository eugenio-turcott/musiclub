// One construction for all twenty studies: one hundred broad colour planes,
// sixteen inks and the same print finish. No triangle mesh or embedded image.
import fs from 'node:fs/promises';
import sharp from 'sharp';
import {fileURLToPath} from 'node:url';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),num=v=>Number(v.toFixed(2));
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;');
export async function buildCubistArt(piece,dir){
  const source=await fs.readFile(new URL(`../public/annual/2026/facets/${piece.id}.svg`,import.meta.url));
  const raw=await sharp(source).resize(600,600).removeAlpha().raw().toBuffer();
  const sample=(x,y)=>{const at=(clamp(Math.round(y),0,599)*600+clamp(Math.round(x),0,599))*3;return[raw[at],raw[at+1],raw[at+2]];};
  const samples=[];for(let y=10;y<600;y+=20)for(let x=10;x<600;x+=20)samples.push(sample(x,y));
  const palette=Array.from({length:16},(_,i)=>[...samples[Math.floor(i*samples.length/16)]]);
  const distance=(a,b)=>(a[0]-b[0])**2*.8+(a[1]-b[1])**2+(a[2]-b[2])**2*.7;
  for(let iteration=0;iteration<12;iteration++){
    const sums=palette.map(()=>[0,0,0,0]);
    for(const c of samples){let best=0;for(let i=1;i<palette.length;i++)if(distance(c,palette[i])<distance(c,palette[best]))best=i;c.forEach((v,i)=>sums[best][i]+=v);sums[best][3]++;}
    sums.forEach((s,i)=>{if(s[3])palette[i]=s.slice(0,3).map(v=>v/s[3]);});
  }
  const ink=c=>{let best=0;for(let i=1;i<palette.length;i++)if(distance(c,palette[i])<distance(c,palette[best]))best=i;return '#'+palette[best].map(v=>clamp(Math.round(v),0,255).toString(16).padStart(2,'0')).join('');};
  // Colour-aware regions follow the cover's silhouettes rather than imposing a
  // square pixel grid. Simplified shared edges make broad cut-paper shapes.
  const N=60,pixels=Array.from({length:N*N},(_,i)=>sample(i%N*10+5,Math.floor(i/N)*10+5));
  const centers=Array.from({length:100},(_,i)=>{const x=i%10*6+3,y=Math.floor(i/10)*6+3;return{x,y,c:sample(x*10,y*10)};});
  let labels=new Int16Array(N*N);
  for(let iteration=0;iteration<9;iteration++){
    const best=new Float64Array(N*N).fill(Infinity),sums=centers.map(()=>[0,0,0,0,0,0]);
    centers.forEach((center,k)=>{for(let y=Math.max(0,Math.floor(center.y-12));y<Math.min(N,center.y+12);y++)for(let x=Math.max(0,Math.floor(center.x-12));x<Math.min(N,center.x+12);x++){
      const i=y*N+x,d=distance(pixels[i],center.c)/1100+((x-center.x)**2+(y-center.y)**2)/36;
      if(d<best[i]){best[i]=d;labels[i]=k;}
    }});
    pixels.forEach((c,i)=>{const s=sums[labels[i]];s[0]+=i%N;s[1]+=Math.floor(i/N);c.forEach((v,j)=>s[j+2]+=v);s[5]++;});
    sums.forEach((s,k)=>{if(s[5])centers[k]={x:s[0]/s[5],y:s[1]/s[5],c:s.slice(2,5).map(v=>v/s[5])};});
  }
  // Fold tiny colour islands into their surroundings before tracing: paper
  // planes remain broad instead of becoming a photographic pixel treatment.
  for(let pass=0;pass<3;pass++){const seen=new Set();for(let i=0;i<labels.length;i++){if(seen.has(i))continue;const label=labels[i],part=[i],around=new Map();seen.add(i);for(let q=0;q<part.length;q++){const at=part[q],x=at%N,y=Math.floor(at/N);for(const next of [x?at-1:-1,x<N-1?at+1:-1,y?at-N:-1,y<N-1?at+N:-1]){if(next<0)continue;if(labels[next]===label){if(!seen.has(next)){seen.add(next);part.push(next);}}else around.set(labels[next],(around.get(labels[next])||0)+1);}}if(part.length<8&&around.size){const replacement=[...around].sort((a,b)=>b[1]-a[1])[0][0];for(const at of part)labels[at]=replacement;}}}
  const edges=centers.map(()=>new Map()),key=(x,y)=>y*61+x;
  const edge=(k,x,y,xx,yy)=>{const a=key(x,y);if(!edges[k].has(a))edges[k].set(a,[]);edges[k].get(a).push(key(xx,yy));};
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const k=labels[y*N+x];if(y===0||labels[(y-1)*N+x]!==k)edge(k,x,y,x+1,y);if(x===N-1||labels[y*N+x+1]!==k)edge(k,x+1,y,x+1,y+1);if(y===N-1||labels[(y+1)*N+x]!==k)edge(k,x+1,y+1,x,y+1);if(x===0||labels[y*N+x-1]!==k)edge(k,x,y+1,x,y);}
  const rdp=(p)=>{if(p.length<3)return p;const a=p[0],b=p.at(-1);let max=0,index=0;for(let i=1;i<p.length-1;i++){const d=Math.abs((b[0]-a[0])*(p[i][1]-a[1])-(b[1]-a[1])*(p[i][0]-a[0]))/Math.max(1,Math.hypot(b[0]-a[0],b[1]-a[1]));if(d>max){max=d;index=i;}}return max>12?[...rdp(p.slice(0,index+1)).slice(0,-1),...rdp(p.slice(index))]:[a,b];};
  const simplify=(p)=>{let far=1;for(let i=2;i<p.length;i++)if(Math.hypot(p[i][0]-p[0][0],p[i][1]-p[0][1])>Math.hypot(p[far][0]-p[0][0],p[far][1]-p[0][1]))far=i;const result=[...rdp(p.slice(0,far+1)).slice(0,-1),...rdp([...p.slice(far),p[0]]).slice(0,-1)];return result.length>=4?result:p;};
  const paths=edges.map((map,k)=>{const loops=[];while(map.size){const start=map.keys().next().value;let at=start,loop=[],guard=0;do{loop.push([at%61*10,Math.floor(at/61)*10]);const to=map.get(at);if(!to?.length)break;const next=to.pop();if(!to.length)map.delete(at);at=next;}while(at!==start&&guard++<15000);if(loop.length>3)loops.push(simplify(loop));}const fill=ink(centers[k].c);return `<path d="${loops.map(p=>'M'+p.map(v=>v.map(num).join(' ')).join('L')+'Z').join('')}" fill="${fill}" stroke="${fill}" stroke-width="20" stroke-linejoin="bevel" fill-rule="evenodd"/>`;});
  const id=`cubist-${piece.id}`;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 600 600" role="img" data-art-edition="cubist" data-main-planes="100" data-inks="16"><title>${escape(piece.title)} · ${escape(piece.artist)}</title><desc>Collage cubista de ${escape(piece.title)}, con planos amplios, recortes de papel y dieciséis tintas.</desc><defs><filter id="${id}"><feTurbulence type="fractalNoise" baseFrequency=".64" numOctaves="3" seed="17" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".14"/></feComponentTransfer><feBlend in="SourceGraphic" mode="multiply"/></filter></defs>${paths.join('')}<rect width="600" height="600" fill="#f6dfbc" opacity=".06" filter="url(#${id})"/></svg>`;
  await fs.mkdir(dir,{recursive:true});await fs.writeFile(new URL(`${piece.id}.svg`,dir),svg);
  const raster=await sharp(Buffer.from(svg)).png().toBuffer();
  for(const [suffix,size,quality] of [['',640,87],['-detail',1200,92]])await sharp(raster).resize(size,size).webp({quality,effort:6}).toFile(fileURLToPath(new URL(`${piece.id}${suffix}.webp`,dir)));
  await sharp(raster).png({palette:true,colours:64,dither:.1}).toFile(fileURLToPath(new URL(`${piece.id}.png`,dir)));
  return{id:piece.id,planes:100};
}
