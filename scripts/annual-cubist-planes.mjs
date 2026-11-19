// Uneven, slanted paper planes. The partition follows the cover's detail rather
// than rows and columns; selected planes extend over neighbouring fragments.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hex=c=>'#'+c.map(v=>clamp(Math.round(v),0,255).toString(16).padStart(2,'0')).join('');
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const length=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const area=p=>Math.abs(p.reduce((s,a,i)=>{const b=p[(i+1)%4];return s+a[0]*b[1]-b[0]*a[1];},0))/2;
function random(seed){let n=seed|0;return()=>{n=n+0x6d2b79f5|0;let t=Math.imul(n^n>>>15,1|n);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
export function quadrilateralPlanes(sample,{count=512,strength=.8,seed='musiclub'}={}){
  const rng=random([...seed].reduce((n,c)=>Math.imul(n,31)+c.charCodeAt(0)|0,2987));
  function plane(p,depth=0){
    const center=[0,1].map(i=>p.reduce((s,v)=>s+v[i],0)/4);
    const probes=[sample(...center),...p.map(v=>sample(...mix(center,v,.4)))];
    const c=[0,1,2].map(i=>probes.reduce((a,v)=>a+v[i],0)/probes.length),variance=Math.sqrt(probes.reduce((a,v)=>a+v.reduce((a,n,i)=>a+(n-c[i])**2,0),0)/probes.length);
    return{p,center,c,variance,depth,priority:area(p)*(.5+variance/35)*(.5+rng()*1.8)};
  }
  const leaves=[plane([[0,0],[600,0],[600,600],[0,600]])];
  while(leaves.length<count){
    let index=0;for(let i=1;i<leaves.length;i++)if(leaves[i].priority>leaves[index].priority)index=i;
    const {p,depth}=leaves[index],w=(length(p[0],p[1])+length(p[3],p[2]))/2,h=(length(p[0],p[3])+length(p[1],p[2]))/2;
    const vertical=w/h>2.5?rng()>.1:h/w>2.5?rng()<.1:rng()>.5;
    const a=.24+rng()*.52,b=clamp(a+(rng()-.5)*.46,.16,.84);let halves;
    if(vertical){const top=mix(p[0],p[1],a),bottom=mix(p[3],p[2],b);halves=[[p[0],top,bottom,p[3]],[top,p[1],p[2],bottom]];}
    else{const left=mix(p[0],p[3],a),right=mix(p[1],p[2],b);halves=[[p[0],p[1],right,left],[left,right,p[2],p[3]]];}
    leaves.splice(index,1,...halves.map(p=>plane(p,depth+1)));
  }
  const definitions=[],paths=[],overlaps=[];
  const path=p=>'M'+p.map(v=>v.map(n=>Number(n.toFixed(2))).join(' ')).join('L')+'Z';
  for(const [k,{p,center,c,variance}] of leaves.entries()){
    const alpha=strength*clamp(1-variance/110,.28,1),id=`q${k}`,shade=5+rng()*9;
    definitions.push(`<linearGradient id="${id}" x1="${rng()>.5?'0%':'100%'}" y1="0%" x2="${rng()>.5?'100%':'0%'}" y2="100%"><stop stop-color="${hex(c.map(v=>v+shade))}"/><stop offset="1" stop-color="${hex(c.map(v=>v-shade))}"/></linearGradient>`);
    paths.push(`<path data-cubist-quad="true" d="${path(p)}" fill="url(#${id})" opacity="${alpha.toFixed(3)}"/>`);
    if(k%7===0&&variance<60){
      const angle=(rng()-.5)*.14,cos=Math.cos(angle),sin=Math.sin(angle),scale=1.05+rng()*.12;
      const shifted=p.map(v=>{const x=(v[0]-center[0])*scale,y=(v[1]-center[1])*scale;return[center[0]+x*cos-y*sin,center[1]+x*sin+y*cos];});
      overlaps.push(`<path data-cubist-overlap="true" d="${path(shifted)}" fill="url(#${id})" opacity="${(.08+rng()*.12).toFixed(3)}"/>`);
    }
  }
  return {definitions:definitions.join(''),paths:paths.join('')+overlaps.join(''),count:paths.length,overlaps:overlaps.length};
}
