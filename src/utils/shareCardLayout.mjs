import {DEFAULT_TIERS,TIER_LIMIT} from './tierList.mjs';

export function profileCardLayout(W,H){
  const p=W*.065,gap=W*.024,w=W-2*p,wide=W/H>1.2,square=W===H;
  if(wide){
    const lw=w*.47,rw=w-lw-gap,x=p+lw+gap,top=H*.19;
    return {p,gap,wide,square,identity:{x:p,y:top,w:lw,h:H*.30},favorites:{x:p,y:H*.52,w:lw,h:H*.12},xp:{x,y:top,w:rw,h:H*.23},badges:{x,y:H*.46,w:rw,h:H*.39},genres:{x:p,y:H*.68,w:lw,h:H*.18},badgeLimit:4};
  }
  if(square){
    const xw=w*.40;
    return {p,gap,wide,square,identity:{x:p,y:H*.16,w,h:H*.22},favorites:{x:p,y:H*.40,w,h:H*.085},xp:{x:p,y:H*.515,w:xw,h:H*.205},badges:{x:p+xw+gap,y:H*.515,w:w-xw-gap,h:H*.205},genres:{x:p,y:H*.755,w,h:H*.135},badgeLimit:1};
  }
  const top=H*.15,bottom=H*.89,usable=bottom-top-4*gap;
  const names=['identity','favorites','xp','badges','genres'],weights=[.245,.10,.17,.285,.20];
  let y=top;const result={p,gap,wide,square,badgeLimit:H/W>1.6?4:2};
  names.forEach((name,index)=>{const h=usable*weights[index];result[name]={x:p,y,w,h};y+=h+gap;});
  return result;
}

// All six tiers share one sheet. A common cover size preserves visual weight;
// denser tiers wrap, and empty tiers remain visible without invented releases.
export function tierBoardLayout(W,H,groups={}){
  const p=W*.065,gap=W*.018,columns=W/H>=1?2:1,rows=6/columns;
  const top=H*(H/W>1.6?.16:.17),bottom=H*.89;
  const columnWidth=(W-2*p-gap*(columns-1))/columns,label=Math.min(W*.07,columnWidth*.15),pad=W*.012;
  const coverWidth=columnWidth-label-pad*3;
  const counts=DEFAULT_TIERS.map(t=>Math.min(TIER_LIMIT,groups[t.id]?.length||0));
  function geometry(side,make=false){
    const maxCols=Math.max(1,Math.floor((coverWidth+pad)/(side+pad)));
    const perColumn=Array.from({length:columns},()=>[]);
    counts.forEach((count,index)=>{
      const lines=Math.max(1,Math.ceil(count/maxCols));
      const h=Math.max(label*.75,count?lines*side+(lines-1)*pad:0)+pad*2;
      perColumn[Math.floor(index/rows)].push({index,count,lines,h,cols:Math.max(1,Math.ceil(count/lines))});
    });
    if(!make)return perColumn.every(list=>list.reduce((sum,item)=>sum+item.h,0)+gap*(rows-1)<=bottom-top);
    const result=[];
    perColumn.forEach((list,column)=>{
      const used=list.reduce((sum,item)=>sum+item.h,0)+gap*(rows-1),extra=(bottom-top-used)/rows;
      let y=top;
      list.forEach(item=>{
        const x=p+column*(columnWidth+gap),h=item.h+extra,tier=DEFAULT_TIERS[item.index];
        const covers=[];
        for(let i=0;i<item.count;i++){
          const row=Math.floor(i/item.cols),col=i%item.cols;
          covers.push({x:x+label+pad*2+col*(side+pad),y:y+(h-item.lines*side-(item.lines-1)*pad)/2+row*(side+pad),size:side,index:i});
        }
        result.push({id:tier.id,color:tier.hexColor,x,y,w:columnWidth,h,label,covers});y+=h+gap;
      });
    });return result;
  }
  let lo=1,hi=Math.min(coverWidth,H*.25);
  for(let i=0;i<28;i++){const middle=(lo+hi)/2;if(geometry(middle))lo=middle;else hi=middle;}
  return {tiers:geometry(Math.floor(lo),true),side:Math.floor(lo),p,top,bottom};
}
