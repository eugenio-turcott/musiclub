import {drawUiIcon} from './drawInterfaceText.js';
import {getMelomanoLevel,MELOMANO_LEVELS,TIER_STYLES} from './badgeSystem.js';
import {badgeIcon,badgeText,LEVEL_ICONS} from './badgeIcons.mjs';

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

export function drawProfileCard({ctx,W,H,t,profile,avatar,logo,disc,genres,genreImages,p,helpers}){
  const {box,type,line,title,photo}=helpers,wide=W/H>1.2,square=W===H,story=H/W>1.6;
  const available=W-2*p;
  const identity=wide?{cx:W*.15,cy:H*.37,size:H*.23,x:W*.26,y:H*.25,w:W*.27}
    :{cx:p+W*.16,cy:H*(story?.16:.14)+W*.13,size:W*(square?.19:.22),x:p+W*.39,y:H*(story?.16:.14)+W*.06,w:W-p*2-W*.39};
  const size=identity.size;
  if(disc){ctx.save();ctx.globalAlpha=.9;ctx.drawImage(disc,identity.cx-size*.77,identity.cy-size*.77,size*1.54,size*1.54);ctx.restore();}
  ctx.save();ctx.shadowColor=t.accent+'44';ctx.shadowBlur=W*.025;photo(ctx,avatar,identity.cx-size/2,identity.cy-size/2,size,size/2);ctx.restore();
  const nameSize=W*(wide?.037:square?.059:.061);
  const bottom=title(ctx,profile.name||'Mi perfil musical',identity.x,identity.y,identity.w,nameSize,t.ink,2);
  if(profile.bio)title(ctx,profile.bio,identity.x,bottom+W*.014,identity.w,W*(wide?.018:.026),t.muted,2,600);

  const favorites=[['mic','Artista favorito',profile.favorite_artist],['disc','Release favorito',profile.favorite_album]].filter(([,label,value])=>value);
  if(!favorites.length)favorites.push(['review','Reseñas publicadas',String(profile.review_count||0)],['notes','Pistas calificadas',String(profile.total_tracks_rated||0)]);
  const fy=H*(wide?.57:square?.40:.355),fh=H*(wide?.13:square?.10:story?.08:.09),fw=wide?W*.46:available,fg=W*.016;
  favorites.forEach(([icon,label,value],index)=>{
    const width=(fw-fg*(favorites.length-1))/favorites.length,x=p+index*(width+fg);
    box(ctx,x,fy,width,fh,W*.018,t.surface,t.muted+'24');
    const iconSize=Math.min(W*.037,fh*.34);drawUiIcon(ctx,icon,x+W*.018,fy+fh*.22,iconSize,index?t.other:t.accent);
    line(ctx,label,x+W*.018+iconSize+W*.012,fy+fh*.36,width-iconSize-W*.06,W*(wide?.014:.020),t.muted,650);
    line(ctx,value,x+W*.018,fy+fh*.77,width-W*.036,W*(wide?.023:.029),t.ink,850);
  });

  const xpBox=wide?{x:W*.55,y:H*.20,w:W*.385,h:H*.25}
    :square?{x:p,y:H*.54,w:W*.35,h:H*.19}
    :{x:p,y:H*(story?.46:.47),w:available,h:H*(story?.115:.12)};
  const xp=Math.max(0,Number(profile.total_xp)||0),level=getMelomanoLevel(xp),next=MELOMANO_LEVELS.find(item=>item.minXp>xp);
  const progress=next?Math.max(0,Math.min(1,(xp-level.minXp)/(next.minXp-level.minXp))):1;
  const {x:xx,y:xy,w:xw,h:xh}=xpBox,pad=xw*.065;
  const glow=ctx.createLinearGradient(xx,xy,xx+xw,xy+xh);glow.addColorStop(0,t.accent+'22');glow.addColorStop(1,t.other+'15');
  box(ctx,xx,xy,xw,xh,W*.024,glow,t.accent+'55');
  type(ctx,'SCORE XP',xx+pad,xy+xh*.19,Math.min(W*.022,xh*.12),t.muted,850);
  const value=xp.toLocaleString('es-MX'),baseSize=Math.min(W*.088,xh*.36,xw*.20);
  ctx.font=`900 ${baseSize}px ${ctx.musiclubFont||'sans-serif'}`;
  const fontSize=baseSize*Math.min(1,(xw-2*pad-W*.062)/Math.max(1,ctx.measureText(value).width));
  type(ctx,value,xx+pad,xy+xh*.57,fontSize,t.accent,900);
  const measured=ctx.measureText(value).width;
  type(ctx,'XP',xx+pad+measured+W*.011,xy+xh*.57,Math.min(W*.026,fontSize*.39),t.accent,850);
  const levelSize=Math.min(W*.026,xh*.15),levelY=xy+xh*.79;
  drawUiIcon(ctx,LEVEL_ICONS[level.level],xx+pad,levelY-levelSize*.8,levelSize,t.other);
  line(ctx,badgeText(level.title),xx+pad+levelSize*1.4,levelY,(wide||square?xw:xw*.53)-2*pad-levelSize*1.4,Math.min(W*.024,xh*.135),t.ink,800);
  if(!wide&&!square){
    [['review',profile.review_count||0,'Reseñas'],['notes',profile.total_tracks_rated||0,'Pistas']].forEach(([icon,value,label],index)=>{
      const x=xx+xw*(.63+index*.20),center=x+xw*.055;
      type(ctx,Number(value)>=10000?new Intl.NumberFormat('es-MX',{notation:'compact',maximumFractionDigits:1}).format(value):Number(value).toLocaleString('es-MX'),center,xy+xh*.53,Math.min(W*.046,xh*.30),t.ink,900,'center');
      const labelSize=Math.min(W*.023,xh*.15);
      drawUiIcon(ctx,icon,x-xw*.01,xy+xh*.70,labelSize,t.other);
      line(ctx,label,x+labelSize*.85,xy+xh*.78,xw*.14,labelSize,t.muted,650);
    });
  }
  box(ctx,xx+pad,xy+xh*.90,xw-2*pad,Math.max(4,W*.006),W*.003,t.muted+'25');
  if(progress)box(ctx,xx+pad,xy+xh*.90,(xw-2*pad)*progress,Math.max(4,W*.006),W*.003,t.other);

  const badgeBox=wide?{x:W*.55,y:H*.50,w:W*.385,h:H*.36,max:4}
    :square?{x:W*.45,y:H*.54,w:W*.485,h:H*.19,max:1}
    :{x:p,y:H*(story?.60:.62),w:available,h:H*(story?.16:.17),max:story?4:2};
  const all=Array.isArray(profile.badges)?profile.badges:[],badges=all.slice(0,badgeBox.max),labelSize=W*(wide?.018:.023);
  drawUiIcon(ctx,'award',badgeBox.x,badgeBox.y,labelSize,t.other);
  type(ctx,'INSIGNIAS',badgeBox.x+labelSize*1.4,badgeBox.y+labelSize*.8,labelSize,t.muted,850);
  if(all.length)type(ctx,all.length>badges.length?`${badges.length} / ${all.length}`:String(all.length),badgeBox.x+badgeBox.w,badgeBox.y+labelSize*.8,labelSize,t.other,850,'right');
  if(!badges.length){
    box(ctx,badgeBox.x,badgeBox.y+labelSize*1.6,badgeBox.w,badgeBox.h-labelSize*1.6,W*.02,t.surface,t.muted+'22');
    line(ctx,'Tu próxima insignia empieza aquí',badgeBox.x+W*.025,badgeBox.y+badgeBox.h*.53,badgeBox.w-W*.05,W*.027,t.ink,800);
    line(ctx,'Reseña y califica canciones.',badgeBox.x+W*.025,badgeBox.y+badgeBox.h*.77,badgeBox.w-W*.05,W*.023,t.muted,600);
  }else{
    const cols=badges.length===1?1:2,rows=Math.ceil(badges.length/cols),gap=W*.012,top=badgeBox.y+labelSize*1.7;
    const bw=(badgeBox.w-gap*(cols-1))/cols,bh=(badgeBox.h-labelSize*1.7-gap*(rows-1))/rows;
    badges.forEach((badge,index)=>{
      const x=badgeBox.x+(index%cols)*(bw+gap),y=top+Math.floor(index/cols)*(bh+gap),palette=badgePalette(badge,t);
      const gradient=ctx.createLinearGradient(x,y,x+bw,y+bh);
      try{gradient.addColorStop(0,palette.from);gradient.addColorStop(1,palette.to);}catch{gradient.addColorStop(0,t.accent);gradient.addColorStop(1,t.other);}
      box(ctx,x,y,bw,bh,W*.014,gradient);
      const iconSize=Math.min(bh*.49,bw*.16),left=x+bw*.045;
      drawUiIcon(ctx,badgeIcon(badge),left,y+(bh-iconSize)/2,iconSize,palette.ink);
      const tx=left+iconSize+bw*.04,tw=x+bw-tx-bw*.04;
      title(ctx,badgeText(badge.label||badge.name||badge.title),tx,y+bh*.35,tw,Math.min(W*.032,bh*(wide?.21:.25)),palette.text,2);
      const tier=TIER_STYLES[`tier_${badge.tierNumber||badge.tier}`];
      const rank=tier?`${tier.tierRoman} · ${tier.tierName}`:badge.isRecord||badge.type==='record'?'Récord #1':'Musiclub';
      line(ctx,rank,tx,y+bh*.85,tw,Math.min(W*.024,bh*.19),palette.text,650);
    });
  }

  const gx=p,gy=H*(wide?.76:square?.76:story?.79:.80),gw=wide?W*.46:available;
  const gh=H*(wide?.14:square?.12:story?.11:.11),cell=gw/Math.max(1,genres.length);
  const diameter=Math.min(cell*.64,gh*.69),genreFont=Math.min(W*(wide?.018:.030),cell*.20);
  genres.forEach((genre,index)=>{
    const center=gx+cell*(index+.5),image=genreImages[index];
    if(image)ctx.drawImage(image,center-diameter/2,gy,diameter,diameter);
    else drawUiIcon(ctx,'disc',center-diameter/2,gy,diameter,t.other);
    const width=cell*.92,name=badgeText(genre);
    ctx.font=`800 ${genreFont}px ${ctx.musiclubFont||'sans-serif'}`;
    if(ctx.measureText(name).width<=width)type(ctx,name,center,gy+diameter+genreFont,genreFont,t.ink,800,'center');
    else{
      const words=name.split(' '),split=Math.max(1,Math.ceil(words.length/2));
      line(ctx,words.slice(0,split).join(' '),center,gy+diameter+genreFont,width,genreFont,t.ink,800,'center');
      line(ctx,words.slice(split).join(' '),center,gy+diameter+genreFont*2.1,width,genreFont,t.ink,800,'center');
    }
  });

  const footerY=H*(story?.935:wide?.945:.96),logoSize=W*(wide?.027:.040);
  // The Musiclub mark keeps its complete silhouette; only the member portrait is circular.
  if(logo)ctx.drawImage(logo,p,footerY-logoSize*.8,logoSize,logoSize);
  line(ctx,'Mi música en Musiclub',p+logoSize*1.28,footerY,W*.55,W*(wide?.018:.023),t.ink,850);
  type(ctx,'musiclub.org',W-p,footerY,W*(wide?.018:.022),t.accent,850,'right');
}
