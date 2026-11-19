// Larger four-sided planes sit above the detailed portrait layer. High-contrast
// landmarks retain more of that layer, so eyes and hands remain recognizable.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hex=c=>'#'+c.map(v=>clamp(Math.round(v),0,255).toString(16).padStart(2,'0')).join('');
export function quadrilateralPlanes(sample,{across=24,strength=.62}={}){
  const step=600/across;
  const point=(x,y)=>[x===0?0:x===across?600:x*step+Math.sin(x*7.1+y*3.7)*step*.13,y===0?0:y===across?600:y*step+Math.cos(x*3.9+y*5.3)*step*.13];
  const definitions=[],paths=[];
  for(let y=0;y<across;y++)for(let x=0;x<across;x++){
    const p=[point(x,y),point(x+1,y),point(x+1,y+1),point(x,y+1)],cx=p.reduce((a,v)=>a+v[0],0)/4,cy=p.reduce((a,v)=>a+v[1],0)/4;
    const probes=[sample(cx,cy),sample(cx-step*.25,cy),sample(cx+step*.25,cy),sample(cx,cy-step*.25),sample(cx,cy+step*.25)];
    const c=[0,1,2].map(i=>probes.reduce((a,v)=>a+v[i],0)/probes.length),variance=Math.sqrt(probes.reduce((a,v)=>a+v.reduce((a,n,i)=>a+(n-c[i])**2,0),0)/probes.length);
    const alpha=strength*clamp(1-variance/105,.28,1),id=`q${y*across+x}`;
    const shade=5+Math.sin(x*2.3+y*4.7)*4;
    definitions.push(`<linearGradient id="${id}"><stop stop-color="${hex(c.map(v=>v+shade))}"/><stop offset="1" stop-color="${hex(c.map(v=>v-shade))}"/></linearGradient>`);
    paths.push(`<path data-cubist-quad="true" d="M${p.map(v=>v.map(n=>Number(n.toFixed(2))).join(' ')).join('L')}Z" fill="url(#${id})" opacity="${alpha.toFixed(3)}"/>`);
  }
  return {definitions:definitions.join(''),paths:paths.join(''),count:paths.length};
}
