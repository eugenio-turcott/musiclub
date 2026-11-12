import test from 'node:test';
import assert from 'node:assert/strict';
import {MELOMANO_LEVELS,getMelomanoLevel,PROGRESSION_BADGES,TIER_STYLES,calculateUserGamification,XP_CONFIG} from '../src/utils/badgeSystem.js';
import {SHARE_FORMATS,clippedText} from '../src/utils/socialCards.js';
import {TOUR_SECTIONS,FAQ_TOUR_ANCHORS} from '../src/data/musiclubTour.js';
import {profileCardLayout,tierBoardLayout} from '../src/utils/shareCardLayout.mjs';
import {DEFAULT_TIERS} from '../src/utils/tierList.mjs';

test('rated tracks award five XP across the existing history without changing review, comment or badge rewards',()=>{
 assert.equal(XP_CONFIG.TRACK_RATED,5);
 const history={review_count:1,total_tracks_rated:8,avg_score:9.03,reviews:[{created_at:'2025-01-01',comment:'Una reseña anterior',rating_general:10,track_ratings:Object.fromEntries(Array.from({length:8},(_,i)=>['track-'+i,9]))}]};
 const result=calculateUserGamification(history);
 assert.equal(result.activityXp,115); // 50 por reseña + 25 comentario + 8 × 5.
 assert.equal(result.totalXp,result.activityXp+result.badgesXp+result.recordXp+result.grammyXp);
 assert.equal(calculateUserGamification({...history,total_tracks_rated:0}).activityXp,75);
});

const intersects=(a,b)=>Math.min(a.x+a.w,b.x+b.w)>Math.max(a.x,b.x)+.01&&Math.min(a.y+a.h,b.y+b.h)>Math.max(a.y,b.y)+.01;
test('profile sections have independent space in every export format',()=>{
 for(const {width:W,height:H} of SHARE_FORMATS){
  const layout=profileCardLayout(W,H),boxes=['identity','favorites','xp','badges','genres'].map(key=>layout[key]);
  for(const b of boxes){assert.ok(b.x>=0&&b.y>=0&&b.x+b.w<=W+.01&&b.y+b.h<H*.92);assert.ok(b.w>0&&b.h>0);}
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++)assert.ok(!intersects(boxes[i],boxes[j]));
 }
});
test('a complete tier sheet preserves six tiers and up to sixty distinct covers without overlap',()=>{
 for(const {width:W,height:H} of SHARE_FORMATS)for(const counts of [[10,10,10,10,10,10],[10,2,0,7,1,0],[0,0,0,0,0,0]]){
  const groups=Object.fromEntries(DEFAULT_TIERS.map((t,i)=>[t.id,Array.from({length:counts[i]},()=>({}))]));
  const result=tierBoardLayout(W,H,groups);assert.deepEqual(result.tiers.map(t=>t.id),DEFAULT_TIERS.map(t=>t.id));
  const covers=[];
  result.tiers.forEach((tier,index)=>{
   assert.equal(tier.covers.length,counts[index]);assert.ok(tier.y>=result.top-.01&&tier.y+tier.h<=result.bottom+.01);
   for(const cover of tier.covers){assert.ok(cover.size>=20);assert.ok(cover.x>=tier.x+tier.label&&cover.y>=tier.y-.01&&cover.x+cover.size<=tier.x+tier.w+.01&&cover.y+cover.size<=tier.y+tier.h+.01);covers.push({x:cover.x,y:cover.y,w:cover.size,h:cover.size});}
   for(const y of new Set(tier.covers.map(c=>c.y)))assert.ok(Math.abs(Math.min(...tier.covers.filter(c=>c.y===y).map(c=>c.x))-(tier.x+tier.label+W*.024))<.01,'Every cover row starts at the left inset, including sparse and incomplete rows');
  });
  for(let i=0;i<covers.length;i++)for(let j=i+1;j<covers.length;j++)assert.ok(!intersects(covers[i],covers[j]));
 }
});

test('progression has continuous boundaries, preserves existing starting levels and gives a next goal above 12,829 XP',()=>{
 assert.ok(MELOMANO_LEVELS.length>=16);
 assert.equal(getMelomanoLevel(0).level,1);assert.equal(getMelomanoLevel(249).level,1);assert.equal(getMelomanoLevel(250).level,2);
 const level=getMelomanoLevel(12829),next=MELOMANO_LEVELS.find(item=>item.minXp>12829);
 assert.equal(level.level,8);assert.ok(next);assert.ok(next.minXp>level.minXp);
 for(let i=1;i<MELOMANO_LEVELS.length;i++){
  assert.equal(MELOMANO_LEVELS[i-1].maxXp+1,MELOMANO_LEVELS[i].minXp);
  assert.equal(getMelomanoLevel(MELOMANO_LEVELS[i].minXp).level,MELOMANO_LEVELS[i].level);
 }
 for(const badge of Object.values(PROGRESSION_BADGES)){
  assert.ok(badge.tiers.length>=9);
  for(let i=1;i<badge.tiers.length;i++){assert.ok(badge.tiers[i].req>badge.tiers[i-1].req);assert.ok(TIER_STYLES[`tier_${badge.tiers[i].tier}`]);}
 }
 const user={review_count:1,total_tracks_rated:0,avg_score:8,reviews:[{rating_general:8}]};
 assert.equal(calculateUserGamification(user).activityXp,50);
});
test('export formats retain their aspect ratios and long text is bounded even without spaces',()=>{
 const sizes=new Map(SHARE_FORMATS.map(f=>[f.id,[f.width,f.height]]));
 assert.deepEqual(sizes.get('story'),[1080,1920]);assert.deepEqual(sizes.get('landscape'),[1600,900]);assert.deepEqual(sizes.get('compact'),[720,960]);
 const ctx={measureText:value=>({width:Array.from(value).length*7})};
 const text='UnaPalabraLarguísima'.repeat(20),result=clippedText(ctx,text,140);
 assert.ok(ctx.measureText(result).width<=140);assert.ok(result.endsWith('…'));
 assert.equal(clippedText(ctx,'Música',140),'Música');
});
test('FAQ destinations point to actual tour chapters and every chapter has a simulated example and a real destination',()=>{
 const ids=new Set(TOUR_SECTIONS.map(s=>s.id));assert.equal(ids.size,TOUR_SECTIONS.length);assert.ok(ids.size>=16);
 for(const anchor of Object.values(FAQ_TOUR_ANCHORS))assert.ok(ids.has(anchor));
 for(const section of TOUR_SECTIONS){assert.ok(section.demo);assert.equal(section.steps.length,3);assert.ok(section.details.length>=2);assert.ok(section.action[0].startsWith('/'));}
});
