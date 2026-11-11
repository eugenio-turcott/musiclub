import {tierBoardLayout} from './shareCardLayout.mjs';
import {DEFAULT_TIERS,TIER_LIMIT} from './tierList.mjs';

export function tierCardItems(groups={}){
  return DEFAULT_TIERS.flatMap(t=>(groups[t.id]||[]).slice(0,TIER_LIMIT));
}

export function drawTierCard({ctx,W,H,t,profile,tierGroups,photos,helpers}){
  const {box,type,line,photo}=helpers,layout=tierBoardLayout(W,H,tierGroups);
  let offset=0;
  for(const row of layout.tiers){
    box(ctx,row.x,row.y,row.w,row.h,W*.012,t.surface,t.muted+'20');
    box(ctx,row.x,row.y,row.label,row.h,W*.012,row.color);
    type(ctx,row.id,row.x+row.label/2,row.y+row.h/2+Math.min(row.label*.43,row.h*.3)*.33,Math.min(row.label*.43,row.h*.3),'#171323',900,'center');
    row.covers.forEach(cover=>{photo(ctx,photos[offset+cover.index],cover.x,cover.y,cover.size,cover.size*.04);});
    offset+=row.covers.length;
  }
  line(ctx,profile.name||'Mi selección musical',layout.p,H*.95,W*.60,W*.024,t.ink,800);
  type(ctx,'musiclub.org',W-layout.p,H*.95,W*.022,t.accent,800,'right');
}
