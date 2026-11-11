import {drawUiIcon} from './drawInterfaceText.js';
import {getMelomanoLevel,MELOMANO_LEVELS,TIER_STYLES} from './badgeSystem.js';
import {badgeIcon,badgeText,LEVEL_ICONS} from './badgeIcons.mjs';
import {profileCardLayout} from './shareCardLayout.mjs';

const palettes=new Map();
function badgePalette(badge,t){
  const classes=badge.color||badge.badgeClass||'from-purple-600 to-indigo-600 text-white';
  if(palettes.has(classes))return palettes.get(classes);
  const sample=document.createElement('span');
  sample.className=`bg-linear-to-r ${classes}`;
  sample.style.cssText='position:fixed;left:-9999px;visibility:hidden;pointer-events:none';
  document.body.append(sample);
  const style=getComputedStyle(sample);
  const value={from:style.getPropertyValue('--tw-gradient-from').trim()||t.accent,to:style.getPropertyValue('--tw-gradient-to').trim()||t.other,text:style.color||'#fff',ink:/(?:^|\s)text-(?:black|[a-z]+-9(?:00|50))(?:\s|$)/.test(classes)?'#000000':'#ffffff'};
  sample.remove();palettes.set(classes,value);return value;
}

function fitted(ctx,text,size,maxWidth){
  ctx.font=`900 ${size}px ${ctx.musiclubFont||'sans-serif'}`;
  return size*Math.min(1,maxWidth/Math.max(1,ctx.measureText(String(text)).width));
}

export function drawProfileCard({ctx,W,H,t,profile,avatar,logo,disc,genres,genreImages,helpers}){
  const {box,type,line,title,photo}=helpers,L=profileCardLayout(W,H),{p,wide,gap}=L;
  const inkXp=t.id==='paper'?t.accent:'#facc15';
  const identity=L.identity,avatarSize=Math.min(identity.h*.66,identity.w*.23),outer=avatarSize*1.32;
  const cx=identity.x+outer/2,cy=identity.y+identity.h/2;
  if(disc)ctx.drawImage(disc,cx-outer/2,cy-outer/2,outer,outer);
  photo(ctx,avatar,cx-avatarSize/2,cy-avatarSize/2,avatarSize,avatarSize/2);
  const tx=identity.x+outer+identity.w*.035,tw=identity.x+identity.w-tx;
  const nameSize=Math.min(W*(wide?.029:.049),identity.h*.21);
  const nameY=identity.y+identity.h*.26;
  const end=title(ctx,profile.name||'Mi perfil musical',tx,nameY,tw,nameSize,t.ink,2);
  if(profile.bio)title(ctx,profile.bio,tx,end+nameSize*.15,tw,Math.min(W*.022,identity.h*.105),t.muted,2,550);

  const favorites=[['mic','Artista favorito',profile.favorite_artist],['disc','Release favorito',profile.favorite_album]].filter(([,label,value])=>value);
  if(!favorites.length)favorites.push(['review','Reseñas',String(profile.review_count||0)],['notes','Pistas',String(profile.total_tracks_rated||0)]);
  const f=L.favorites,fg=gap*.6;
  favorites.forEach(([icon,label,value],index)=>{
    const w=(f.w-fg*(favorites.length-1))/favorites.length,x=f.x+index*(w+fg),pad=Math.min(W*.019,f.h*.17);
    box(ctx,x,f.y,w,f.h,W*.015,t.surface,t.muted+'20');
    const iconSize=Math.min(W*.026,f.h*.26),labelSize=Math.min(W*.018,f.h*.18);
    drawUiIcon(ctx,icon,x+pad,f.y+pad,iconSize,index?t.other:t.accent);
    line(ctx,label,x+pad+iconSize*1.4,f.y+pad+iconSize*.8,w-pad*2-iconSize*1.4,labelSize,t.muted,650);
    line(ctx,value,x+pad,f.y+f.h*.78,w-2*pad,Math.min(W*.025,f.h*.25),t.ink,800);
  });

  const x=L.xp,pad=x.w*.065,xp=Math.max(0,Number(profile.total_xp)||0),value=xp.toLocaleString('es-MX');
  const level=getMelomanoLevel(xp),next=MELOMANO_LEVELS.find(item=>item.minXp>xp),progress=next?Math.max(0,Math.min(1,(xp-level.minXp)/(next.minXp-level.minXp))):1;
  box(ctx,x.x,x.y,x.w,x.h,W*.020,t.surface,inkXp+'55');
  type(ctx,'SCORE XP',x.x+pad,x.y+x.h*.18,Math.min(W*.019,x.h*.11),t.muted,800);
  const xpSize=fitted(ctx,value,Math.min(W*.069,x.h*.31),x.w-2*pad-W*.065);
  type(ctx,value,x.x+pad,x.y+x.h*.54,xpSize,inkXp,900);
  const numberWidth=ctx.measureText(value).width;
  type(ctx,'XP',x.x+pad+numberWidth+W*.012,x.y+x.h*.54,Math.min(W*.022,xpSize*.36),inkXp,800);
  const ls=Math.min(W*.023,x.h*.13),ly=x.y+x.h*.76;
  drawUiIcon(ctx,LEVEL_ICONS[level.level],x.x+pad,ly-ls*.8,ls,t.other);
  line(ctx,badgeText(level.title),x.x+pad+ls*1.4,ly,x.w-2*pad-ls*1.4,Math.min(W*.021,x.h*.115),t.ink,750);
  box(ctx,x.x+pad,x.y+x.h*.88,x.w-2*pad,Math.max(4,W*.005),W*.003,t.muted+'20');
  if(progress)box(ctx,x.x+pad,x.y+x.h*.88,(x.w-2*pad)*progress,Math.max(4,W*.005),W*.003,inkXp);

  const b=L.badges,all=Array.isArray(profile.badges)?profile.badges:[],badges=all.slice(0,L.badgeLimit),heading=Math.min(W*.021,b.h*.10);
  drawUiIcon(ctx,'award',b.x,b.y,heading,t.other);
  type(ctx,'INSIGNIAS',b.x+heading*1.4,b.y+heading*.8,heading,t.muted,800);
  if(all.length)type(ctx,all.length>badges.length?`${badges.length} / ${all.length}`:String(all.length),b.x+b.w,b.y+heading*.8,heading,t.other,800,'right');
  const top=b.y+heading*1.8;
  if(!badges.length){
    box(ctx,b.x,top,b.w,b.h-heading*1.8,W*.018,t.surface,t.muted+'20');
    line(ctx,'Tu próxima insignia empieza aquí',b.x+W*.022,top+(b.h-heading*1.8)*.48,b.w-W*.044,W*.022,t.ink,750);
    line(ctx,'Reseña y califica canciones.',b.x+W*.022,top+(b.h-heading*1.8)*.73,b.w-W*.044,W*.019,t.muted,550);
  }else{
    const cols=badges.length===1?1:2,rows=Math.ceil(badges.length/cols),bg=gap*.55,bw=(b.w-bg*(cols-1))/cols,bh=(b.h-heading*1.8-bg*(rows-1))/rows;
    badges.forEach((badge,index)=>{
      const bx=b.x+(index%cols)*(bw+bg),by=top+Math.floor(index/cols)*(bh+bg),palette=badgePalette(badge,t),gradient=ctx.createLinearGradient(bx,by,bx+bw,by+bh);
      try{gradient.addColorStop(0,palette.from);gradient.addColorStop(1,palette.to);}catch{gradient.addColorStop(0,t.accent);gradient.addColorStop(1,t.other);}
      box(ctx,bx,by,bw,bh,W*.012,gradient);
      const iconSize=Math.min(bh*.34,bw*.13),left=bx+bw*.05,copyX=left+iconSize+bw*.045,copyWidth=bx+bw-copyX-bw*.05;
      drawUiIcon(ctx,badgeIcon(badge),left,by+(bh-iconSize)/2,iconSize,palette.ink);
      title(ctx,badgeText(badge.label||badge.name||badge.title),copyX,by+bh*.34,copyWidth,Math.min(W*.026,bh*.19),palette.text,2,800);
      const tier=TIER_STYLES[`tier_${badge.tierNumber||badge.tier}`],rank=badge.type==='event'?'Grammy 2027 · Oro':tier?`${tier.tierRoman} · ${tier.tierName}`:badge.isRecord||badge.type==='record'?'Récord #1':'Musiclub';
      line(ctx,rank,copyX,by+bh*.82,copyWidth,Math.min(W*.020,bh*.15),palette.text,600);
    });
  }

  const g=L.genres,cell=g.w/Math.max(1,genres.length),font=Math.min(W*.024,cell*.18);
  ctx.font=`750 ${font}px ${ctx.musiclubFont||'sans-serif'}`;
  const lines=genres.some(name=>ctx.measureText(name).width>cell*.92)?2:1;
  const diameter=Math.min(cell*.65,g.h-font*(lines===2?2.5:1.4));
  const y=g.y+Math.max(0,(g.h-diameter-font*(lines===2?2.3:1.2))/2);
  genres.forEach((genre,index)=>{
    const center=g.x+cell*(index+.5),image=genreImages[index];
    if(image)ctx.drawImage(image,center-diameter/2,y,diameter,diameter);else drawUiIcon(ctx,'disc',center-diameter/2,y,diameter,t.other);
    const words=badgeText(genre).split(' '),split=Math.max(1,Math.ceil(words.length/2));
    if(ctx.measureText(genre).width<=cell*.92)line(ctx,genre,center,y+diameter+font,cell*.92,font,t.ink,750,'center');
    else{line(ctx,words.slice(0,split).join(' '),center,y+diameter+font,cell*.92,font,t.ink,750,'center');line(ctx,words.slice(split).join(' '),center,y+diameter+font*2.1,cell*.92,font,t.ink,750,'center');}
  });
  const fy=H*.95,logoSize=W*(wide?.025:.036);
  if(logo)ctx.drawImage(logo,p,fy-logoSize*.8,logoSize,logoSize);
  line(ctx,'Mi música en Musiclub',p+logoSize*1.3,fy,W*.52,W*(wide?.016:.021),t.ink,800);
  type(ctx,'musiclub.org',W-p,fy,W*(wide?.016:.021),t.accent,800,'right');
}
