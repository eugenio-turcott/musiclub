import artwork from './interfaceArtwork.cjs';
import icons from './interfaceIcons.cjs';

const drawings = new Map();
function drawing(name) {
  if (drawings.has(name)) return drawings.get(name);
  const document = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${artwork.ICON_BODIES[name] || artwork.ICON_BODIES.music}</svg>`, 'image/svg+xml');
  const parts=[];
  function walk(element,inherited=[]){
    const transforms=[...inherited,...(element.getAttribute('transform')?[element.getAttribute('transform')]:[])];
    if(element.tagName==='g'){for(const child of element.children)walk(child,transforms);return;}

    const path = new Path2D();
    const n = (key, fallback = 0) => Number(element.getAttribute(key) || fallback);
    if (element.tagName === 'path') path.addPath(new Path2D(element.getAttribute('d')));
    else if (element.tagName === 'circle') path.arc(n('cx'),n('cy'),n('r'),0,Math.PI*2);
    else if (element.tagName === 'ellipse') path.ellipse(n('cx'),n('cy'),n('rx'),n('ry'),0,0,Math.PI*2);
    else if (element.tagName === 'rect') path.roundRect(n('x'),n('y'),n('width'),n('height'),n('rx'));
    else if (element.tagName === 'line') { path.moveTo(n('x1'),n('y1')); path.lineTo(n('x2'),n('y2')); }
    else if (['polygon','polyline'].includes(element.tagName)) {
      const points=element.getAttribute('points').trim().split(/[ ,]+/).map(Number);
      path.moveTo(points[0],points[1]); for(let i=2;i<points.length;i+=2) path.lineTo(points[i],points[i+1]);
      if(element.tagName==='polygon') path.closePath();
    }
    parts.push({path,transforms});
  }
  for(const element of document.documentElement.children)walk(element);
  drawings.set(name,parts); return parts;
}
export function drawInterfaceText(ctx, text, x, y) {
  const parts = icons.iconParts(String(text));
  const size = Number(ctx.font.match(/([\d.]+)px/)?.[1]) || 16;
  const width = parts.reduce((sum, part) => sum + (part.icon ? size : ctx.measureText(part.text).width), 0);
  let left = x - (ctx.textAlign === 'center' ? width / 2 : ['right', 'end'].includes(ctx.textAlign) ? width : 0);
  const top = y - (ctx.textBaseline === 'middle' ? size / 2 : ['top', 'hanging'].includes(ctx.textBaseline) ? 0 : size * .8);
  ctx.save(); ctx.textAlign = 'left';
  for (const part of parts) {
    if (part.text !== undefined) { ctx.fillText(part.text, left, y); left += ctx.measureText(part.text).width; }
    else {
      ctx.save(); ctx.translate(left,top); ctx.scale(size/24,size/24);
      ctx.strokeStyle=artwork.ICON_COLORS[part.icon] || '#f472b6'; ctx.lineWidth=artwork.ICON_STROKE_WIDTH;ctx.lineCap='round';ctx.lineJoin='round';
      for(const element of drawing(part.icon)) {
        ctx.save();
        applyTransforms(ctx,element.transforms);
        ctx.stroke(element.path); ctx.restore();
      }
      ctx.restore(); left += size;
    }
  }
  ctx.restore();
}

export function drawUiIcon(ctx,name,x,y,size,color='#fff') {
  ctx.save();ctx.translate(x,y);ctx.scale(size/24,size/24);
  ctx.strokeStyle=color;ctx.lineWidth=artwork.ICON_STROKE_WIDTH;ctx.lineCap='round';ctx.lineJoin='round';
  for(const element of drawing(name)){
    ctx.save();applyTransforms(ctx,element.transforms);
    ctx.stroke(element.path);ctx.restore();
  }
  ctx.restore();
}

function applyTransforms(ctx,transforms=[]){
 for(const transform of transforms)for(const [,name,values] of transform.matchAll(/([a-zA-Z]+)\(([^)]+)\)/g)){
  const n=values.trim().split(/[ ,]+/).map(Number);
  if(name==='rotate'){const [angle,x=0,y=0]=n;ctx.translate(x,y);ctx.rotate(angle*Math.PI/180);ctx.translate(-x,-y);}
  else if(name==='translate')ctx.translate(n[0],n[1]||0);
  else if(name==='scale')ctx.scale(n[0],n[1]??n[0]);
  else if(name==='matrix')ctx.transform(...n);
  else if(name==='skewX')ctx.transform(1,0,Math.tan(n[0]*Math.PI/180),1,0,0);
  else if(name==='skewY')ctx.transform(1,Math.tan(n[0]*Math.PI/180),0,1,0,0);
 }
}
