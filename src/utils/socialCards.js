import {drawUiIcon} from './drawInterfaceText.js';
import {REVIEW_CRITERIA} from './reviewCriteria.mjs';
import {getWeightedReviewScore,getReviewFavoriteTrack,getTrackDisplayName} from './ratingUtils.js';
import {getMelomanoLevel} from './badgeSystem.js';
import genreArt from './genreArtworkSources.cjs';
import {DEFAULT_TIERS,tierPageSize} from './tierList.mjs';

export const SHARE_FORMATS=[
  {id:'story',label:'Historia',detail:'9:16',width:1080,height:1920,icon:'phone'},
  {id:'portrait',label:'Publicación',detail:'4:5',width:1080,height:1350,icon:'image'},
  {id:'square',label:'Cuadrada',detail:'1:1',width:1080,height:1080,icon:'grid'},
  {id:'landscape',label:'Horizontal',detail:'16:9',width:1600,height:900,icon:'image'},
  {id:'compact',label:'Compacta',detail:'720 × 960',width:720,height:960,icon:'phone'},
];
export const SHARE_THEMES=[
  {id:'neon',label:'Noche del club',bg:'#0d0d1e',surface:'#19182d',ink:'#fff8ff',muted:'#b8b5ce',accent:'#ff75b2',other:'#48ded8'},
  {id:'paper',label:'Edición en papel',bg:'#f2eade',surface:'#fff8ed',ink:'#171323',muted:'#6b6472',accent:'#bc275e',other:'#087b86'},
  {id:'blue',label:'Hora azul',bg:'#061c35',surface:'#102d48',ink:'#efffff',muted:'#a6c6df',accent:'#57e9d9',other:'#cc99ff'},
];
const images=new Map();
export function loadCardImage(source){
  if(!source)return Promise.resolve(null);
  if(images.has(source))return images.get(source);
  if(images.size>=32)images.delete(images.keys().next().value);
  const promise=new Promise(resolve=>{
    const image=new Image();let timer,finished=false;
    const finish=value=>{if(finished)return;finished=true;clearTimeout(timer);resolve(value);};
    image.crossOrigin='anonymous';image.onload=()=>finish(image);image.onerror=()=>finish(null);
    timer=setTimeout(()=>finish(null),5000);
    let url=source;
    try{const parsed=new URL(source,location.origin);if(!['http:','https:','data:','blob:'].includes(parsed.protocol))return finish(null);
      if(['http:','https:'].includes(parsed.protocol)&&parsed.origin!==location.origin&&!/^(?:i\.scdn\.co|[^/]+\.supabase\.co|coverartarchive\.org|archive\.org|wsrv\.nl)$/.test(parsed.hostname))url=`https://wsrv.nl/?url=${encodeURIComponent(source)}&w=1000&h=1000&fit=cover&output=png`;
    }catch{return finish(null);}
    image.src=url;
  });images.set(source,promise);return promise;
}
function box(ctx,x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.5;ctx.stroke();}}
function type(ctx,text,x,y,size,color,weight=700,align='left'){ctx.font=`${weight} ${size}px ${ctx.musiclubFont || "sans-serif"}`;ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='alphabetic';ctx.fillText(String(text),x,y);}
export function clippedText(ctx,text,maxWidth){const value=String(text||'').replace(/\s+/g,' ').trim();if(ctx.measureText(value).width<=maxWidth)return value;let result=value;while(result.length&&ctx.measureText(result+'…').width>maxWidth)result=result.slice(0,-1);return result.trimEnd()+'…';}
function line(ctx,text,x,y,maxWidth,size,color,weight=700,align='left'){ctx.font=`${weight} ${size}px ${ctx.musiclubFont || "sans-serif"}`;type(ctx,clippedText(ctx,text,maxWidth),x,y,size,color,weight,align);}
function title(ctx,text,x,y,width,size,color,maxLines=2){
  const words=String(text||'').split(/\s+/);const lines=[];let current='';ctx.font=`900 ${size}px ${ctx.musiclubFont || "sans-serif"}`;
  for(const word of words){const candidate=current?current+' '+word:word;if(current&&ctx.measureText(candidate).width>width){lines.push(current);current=word;}else current=candidate;}
  if(current)lines.push(current);
  for(let i=0;i<Math.min(maxLines,lines.length);i++)line(ctx,i===maxLines-1?lines.slice(i).join(' '):lines[i],x,y+i*size*1.12,width,size,color,900);
  return y+Math.min(maxLines,lines.length)*size*1.12;
}
function photo(ctx,img,x,y,size,r=24){
  ctx.save();ctx.beginPath();ctx.roundRect(x,y,size,size,r);ctx.clip();
  if(img){const side=Math.min(img.width,img.height);ctx.drawImage(img,(img.width-side)/2,(img.height-side)/2,side,side,x,y,size,size);}else{ctx.fillStyle='#24223c';ctx.fillRect(x,y,size,size);drawUiIcon(ctx,'disc',x+size*.3,y+size*.3,size*.4,'#ff81b7');}
  ctx.restore();
}
function background(ctx,W,H,t,logo,story=false){
  ctx.fillStyle=t.bg;ctx.fillRect(0,0,W,H);
  const glow=ctx.createRadialGradient(W*.85,H*.2,0,W*.85,H*.2,W*.9);glow.addColorStop(0,t.accent+'24');glow.addColorStop(1,t.bg+'00');ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
  ctx.strokeStyle=t.muted+'12';ctx.lineWidth=1;for(let x=0;x<W;x+=W/20){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  const p=W*.065;
  const headerY=H*(story?.085:.055);
  if(logo)ctx.drawImage(logo,p,headerY,W*.048,W*.048);
  type(ctx,'MUSICLUB',p+W*.062,headerY+W*.035,W*.025,t.ink,900);
  line(ctx,'TU MÚSICA. TU CRITERIO.',W-p,headerY+W*.033,W*.48,W*.014,t.muted,700,'right');
  return p;
}
function criteria(ctx,review,x,y,width,t){
  const gap=width*.012,cell=(width-gap*6)/7;
  REVIEW_CRITERIA.forEach(([key,label,icon,max,color],i)=>{
    const left=x+i*(cell+gap);box(ctx,left,y,cell,cell*1.15,cell*.2,t.surface,t.muted+'22');
    drawUiIcon(ctx,icon,left+cell*.33,y+cell*.16,cell*.34,color);
    type(ctx,review[key]??'—',left+cell*.5,y+cell*.88,cell*.31,t.ink,900,'center');
  });
}
function footer(ctx,W,H,t,avatar,name,label,baseline=.91){
  const p=W*.065,y=H*baseline,size=Math.min(W*.046,58);
  photo(ctx,avatar,p,y-size*.75,size,size/2);
  line(ctx,name||'Un miembro del club',p+size*1.3,y,W*.55,W*.027,t.ink,800);
  line(ctx,label||'Escuchado y compartido en comunidad',p+size*1.3,y+W*.025,W*.5,W*.014,t.muted,500);
  type(ctx,'musiclub.org',W-p,y+W*.01,W*.022,t.accent,900,'right');
}
export async function renderSocialCard({kind='review',review={},album={},profile={},format='story',theme='neon',includeQuote=false,tierGroups={},tier='S',page=0}){
  await Promise.race([document.fonts.ready,new Promise(resolve=>setTimeout(resolve,2500))]);
  const f=SHARE_FORMATS.find(item=>item.id===format)||SHARE_FORMATS[0],t=SHARE_THEMES.find(item=>item.id===theme)||SHARE_THEMES[0];
  const W=f.width,H=f.height,landscape=W/H>1.2,square=W===H;
  const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext('2d');ctx.musiclubFont=getComputedStyle(document.body).fontFamily;
  const art=genreArt.genreArtworkSources((kind==='profile'?profile.favorite_genres:album.genres)?.[0] || 'Pop');
  const [cover,avatar,logo,disc]=await Promise.all([loadCardImage(album.image_url||album.imagen),loadCardImage(profile.avatar_url||profile.avatar||review.reviewer_avatar),loadCardImage('/musiclub_logo_corchea.png'),loadCardImage(art.disc)]);
  const p=background(ctx,W,H,t,logo,format==='story'),available=W-p*2;
  if(kind==='tierlist'){
    const config=DEFAULT_TIERS.find(item=>item.id===tier)||DEFAULT_TIERS[0],perPage=tierPageSize(format);
    const all=(tierGroups[tier]||[]).slice(0,10),pages=Math.max(1,Math.ceil(all.length/perPage)),current=Math.min(Math.max(0,page),pages-1),items=all.slice(current*perPage,(current+1)*perPage);
    const photos=await Promise.all(items.map(item=>loadCardImage(item.imagen)));
    const head=H*(format==='story'?.17:.16);
    box(ctx,p,head-W*.055,W*.092,W*.092,W*.02,config.hexColor);type(ctx,tier,p+W*.046,head+W*.012,W*.058,'#171323',900,'center');
    type(ctx,config.name,p+W*.12,head,W*.043,t.ink,900);line(ctx,profile.name||'Mi tier list',p+W*.12,head+W*.04,available-W*.13,W*.027,t.muted);
    const cols=landscape?5:2,rows=Math.max(1,Math.ceil(items.length/cols)),start=H*(landscape?.29:square?.29:.26),end=H*.87,gap=W*.022,cw=(available-gap*(cols-1))/cols,rh=(end-start-gap*(rows-1))/rows;
    items.forEach((item,i)=>{const x=p+(i%cols)*(cw+gap),y=start+Math.floor(i/cols)*(rh+gap),side=Math.min(cw,rh*.68);box(ctx,x,y,cw,rh,W*.018,t.surface,t.muted+'22');photo(ctx,photos[i],x+(cw-side)/2,y+W*.009,side,side*.07);const baseline=y+side+W*.037;line(ctx,item.album,x+W*.016,baseline,cw-W*.032,W*(landscape?.019:.026),t.ink,900);line(ctx,item.artista,x+W*.016,baseline+W*.029,cw-W*.032,W*(landscape?.015:.021),t.muted,600);const score=Number(item.score).toFixed(1);box(ctx,x+cw-W*.10,y+W*.014,W*.084,W*.044,W*.012,config.hexColor);type(ctx,score,x+cw-W*.058,y+W*.046,W*.026,'#171323',900,'center');});
    footer(ctx,W,H,t,avatar,profile.name||'Mi selección musical',`Tier ${tier} · ${current+1}/${pages} · musiclub.org`,format==='story'?.94:.95);return canvas;
  }
  if(kind==='profile'){
    const columns=landscape||square;
    const cx=columns?W*.27:W*.5,cy=landscape?H*.43:square?H*.39:H*(format==='story'?.29:.27),size=landscape?H*.30:W*(format==='story'?.29:.26);
    if(disc){ctx.save();ctx.globalAlpha=.85;ctx.drawImage(disc,cx-size*.95,cy-size*.95,size*1.9,size*1.9);ctx.restore();}
    ctx.save();ctx.shadowColor=t.accent+'55';ctx.shadowBlur=35;photo(ctx,avatar,cx-size/2,cy-size/2,size,size/2);ctx.restore();
    const x=columns?W*.56:p,y=columns?H*.30:H*(format==='story'?.53:format==='portrait'?.57:.56),tw=columns?W*.375:available;
    let bottom=title(ctx,profile.name||'Mi perfil musical',x,y,tw,W*(landscape?.045:square?.055:.065),t.ink,2);
    if(profile.bio){line(ctx,profile.bio,x,bottom+W*.018,tw,W*.025,t.muted,500);bottom+=W*.065;}
    const favorites=[['mic',profile.favorite_artist],['disc',profile.favorite_album]].filter(([,value])=>value);
    favorites.slice(0,2).forEach(([icon,value],i)=>{const yy=bottom+W*.035+i*W*.052;drawUiIcon(ctx,icon,x,yy-W*.023,W*.027,t.accent);line(ctx,value,x+W*.043,yy,tw-W*.05,W*.027,t.ink,700);});
    const genres=[...new Set((profile.favorite_genres||[]).flatMap(g=>String(g).split(/\s*\/\s*/)))].slice(0,4);
    const gy=H*(landscape?.82:square?.80:format==='story'?.80:.86);
    line(ctx,genres.join('  ·  '),landscape?x:p,gy,landscape?tw:available,W*.024,t.other,800);
    const xp=Number(profile.total_xp)||0;
    const label=xp?getMelomanoLevel(xp).title.replace(/^[^\p{L}]+/u,''):'Descubre · Reseña · Comparte';
    footer(ctx,W,H,t,logo,'Tu próxima escucha empieza aquí.',label,format==='story'||landscape?.91:.95);
  }else{
    const aName=album.album_name||album.album||'Tu próxima escucha',artist=album.artist_name||album.artista||'Musiclub';
    const columns=landscape||square;
    const size=landscape?H*.60:W*(square?.37:format==='story'?.65:format==='portrait'?.43:.52);
    const x=columns?p:(W-size)/2-W*.04,y=H*(format==='story'?.16:landscape?.18:.145);
    if(disc)ctx.drawImage(disc,x+size*.30,y-size*.015,size*1.04,size*1.04);
    ctx.save();ctx.shadowColor='#0006';ctx.shadowBlur=40;photo(ctx,cover,x,y,size,size*.055);ctx.restore();
    const tx=columns?W*.57:p,ty=H*(landscape?.245:square?.25:format==='story'?.63:format==='portrait'?.565:.62),tw=columns?W*.365:available;
    const titleSize=W*(landscape?.038:square?.043:format==='story'?.062:format==='portrait'?.056:.058);
    const textBottom=title(ctx,aName,tx,ty,tw,titleSize,t.ink,columns?3:2);
    const artistY=textBottom-titleSize*.60+W*.008;
    line(ctx,artist,tx,artistY,tw,W*(columns?.026:.032),t.muted,600);
    const fav=getReviewFavoriteTrack(review),favorite=fav?getTrackDisplayName(fav,album.tracks||[]):null;
    if(favorite){const fy=artistY+W*.055;drawUiIcon(ctx,'crown',tx,fy-W*.025,W*.030,t.accent);line(ctx,favorite,tx+W*.044,fy,tw-W*.046,W*.026,t.ink,700);}
    const score=getWeightedReviewScore(review)??review.rating_general;
    const sx=columns?tx:x+size*.70,sy=columns?H*(landscape?.565:.48):y+size*.72,sw=W*(columns?.24:.245),sh=landscape?H*.16:W*.145;
    box(ctx,sx,sy,sw,sh,sh*.26,t.accent);
    type(ctx,score==null?'—':Number(score).toFixed(1).replace(/\.0$/,''),sx+sw*.44,sy+sh*.73,landscape?H*.105:W*.092,t.bg,900,'center');type(ctx,'/10',sx+sw*.81,sy+sh*.7,W*.023,t.bg,700,'center');
    const criteriaY=H*(landscape?.78:square?.72:format==='story'?.78:format==='portrait'?.755:.775);
    const criteriaW=landscape?W*.40:available;
    if(includeQuote&&review.comment)title(ctx,'“'+String(review.comment).slice(0,140)+'”',landscape?W*.53:p,criteriaY+W*.032,criteriaW,W*.026,t.ink,2);
    else criteria(ctx,review,landscape?W*.53:p,criteriaY,criteriaW,t);
    footer(ctx,W,H,t,avatar,review.reviewer_name||profile.name,'Una reseña. Un nuevo descubrimiento.',format==='story'||landscape?.91:.95);
  }

  return canvas;
}
