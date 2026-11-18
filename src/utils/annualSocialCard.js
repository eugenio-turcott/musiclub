import {loadCardImage,SHARE_FORMATS,clippedText} from './socialCards.js';
import {drawUiIcon} from './drawInterfaceText.js';
import genreArtwork from './genreArtworkSources.cjs';

export const ANNUAL_THEMES={night:{bg:'#24202e',ink:'#fff5e6',muted:'#c6b8d1',accent:'#ec77a3',xp:'#f1d575',line:'#514557'},paper:{bg:'#f3ead8',ink:'#292130',muted:'#776370',accent:'#b12d64',xp:'#765318',line:'#cabdaa'},mint:{bg:'#a2ddce',ink:'#203135',muted:'#3d6660',accent:'#6a3459',xp:'#f1d575',line:'#6ab5a3'}};
function image(ctx,img,x,y,w,h=w,r=6){ctx.save();ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.clip();if(img){const side=Math.min(img.width,img.height);ctx.drawImage(img,(img.width-side)/2,(img.height-side)/2,side,side,x,y,w,h);}else{ctx.fillStyle='#645168';ctx.fillRect(x,y,w,h);drawUiIcon(ctx,'disc',x+w*.3,y+h*.3,w*.4,'#f0b0cc');}ctx.restore();}
export async function renderAnnualCard(personal,{format='story',theme='night'}={}){
  if(!personal?.reviewCount)throw new Error('Necesitas una reseña para preparar tu año.');
  await document.fonts.ready;
  const f=SHARE_FORMATS.find(f=>f.id===format)||SHARE_FORMATS[0],t=ANNUAL_THEMES[theme]||ANNUAL_THEMES.night;
  const canvas=document.createElement('canvas');canvas.width=f.width;canvas.height=f.height;
  const ctx=canvas.getContext('2d'),W=f.width,H=f.height,p=W*.065,wide=W/H>1.2,compact=H/W<1.6;
  ctx.musiclubFont=getComputedStyle(document.body).fontFamily;ctx.fillStyle=t.bg;ctx.fillRect(0,0,W,H);
  const text=(str,x,y,size,color=t.ink,weight=800,width=W-p*2)=>{ctx.font=`${weight} ${size}px ${ctx.musiclubFont}`;ctx.fillStyle=color;ctx.textAlign='left';ctx.fillText(clippedText(ctx,str,width),x,y);};
  ctx.strokeStyle=t.line;ctx.lineWidth=1;for(let x=p;x<W;x+=W/12){ctx.beginPath();ctx.moveTo(x,p);ctx.lineTo(x,H-p);ctx.stroke();}
  const releases=personal.topReleases.slice(0,6),genres=personal.genres.slice(0,3);
  const [logo,photos,vinyls]=await Promise.all([loadCardImage('/musiclub_logo_corchea.png'),Promise.all(releases.map(r=>loadCardImage(r.image))),Promise.all(genres.map(g=>{const art=genreArtwork.genreArtworkSources(g.name);return Promise.all([loadCardImage(art.disc),loadCardImage(art.center)]);} ))]);
  if(logo)ctx.drawImage(logo,p,p,W*.04,W*.04);
  text('MUSICLUB',p+W*.055,p+W*.031,W*.025);text('MI AÑO EN RESEÑAS',wide?W*.69:p,p+(wide?W*.031:W*.093),W*.018,t.muted,700,W*.5);
  const yearY=wide?H*.38:compact?H*.29:H*.23;
  text('2026.',p,yearY,wide?W*.13:W*.19,t.accent,900);
  text(personal.name,p,yearY+W*.065,wide?W*.032:W*.048,t.ink,900,wide?W*.43:W-p*2);
  const stats=[['review',personal.reviewCount,'releases reseñados'],['music',personal.trackCount,'tracks calificados'],['mic',personal.artistCount,'artistas'],['star',personal.meanScore?.toFixed(1)||'—','nota media']];
  const statsX=p,statsY=wide?H*.58:compact?H*.43:H*.36,statsWidth=wide?W*.43:W-p*2,cell=statsWidth/4;
  stats.forEach(([icon,value,label],i)=>{const x=statsX+i*cell,y=statsY;drawUiIcon(ctx,icon,x,y-W*.025,W*.026,t.accent);text(String(value),x,y+W*.045,wide?W*.039:W*.055);text(wide?['releases','tracks','artistas','nota media'][i]:label,x,y+W*.073,W*(wide?.015:.022),t.muted,600,cell-W*.015);});
  const gridX=wide?W*.55:p,gridY=wide?H*.21:compact?H*.58:H*.49,gridWidth=wide?W*.39:W-p*2;
  const gap=W*.017,cols=wide?3:compact?6:3,size=(gridWidth-gap*(cols-1))/cols;
  releases.forEach((release,i)=>{const x=gridX+(i%cols)*(size+gap),y=gridY+Math.floor(i/cols)*(size+gap+W*.032);image(ctx,photos[i],x,y,size);text(release.score.toFixed(1),x,y+size+W*.027,W*.025,t.accent,900,size);});
  {const gy=wide?H*.81:compact?H*.79:H*.85,gap=W*.025,unit=(wide?W*.39:W-p*2)/3;genres.forEach((genre,i)=>{const x=(wide?W*.55:p)+i*unit,disc=vinyls[i],d=wide?W*.035:compact?W*.07:W*.09;if(disc[0])ctx.drawImage(disc[0],x,gy,d,d);if(disc[1])ctx.drawImage(disc[1],x+d*.256,gy+d*.256,d*.488,d*.488);text(genre.name,x+d+gap*.5,gy+d*.45,W*(wide?.012:.018),t.ink,800,unit-d-gap*.5);});}
  const xpY=wide?H*.9:compact?H*.93:H*.945;
  if(theme==='mint'){ctx.fillStyle='#203135';ctx.beginPath();ctx.roundRect(p-W*.01,xpY-W*.049,W*.44,W*.068,8);ctx.fill();}
  drawUiIcon(ctx,'sparkles',p,xpY-W*.028,W*.025,t.xp);text(`${personal.activityXP.toLocaleString('es-MX')} XP`,p+W*.038,xpY,W*.036,t.xp,900,wide?W*.4:W*.55);
  text('musiclub.org',wide?W*.78:W*.72,xpY,W*.022,t.accent,900,W*.22);
  return canvas;
}
