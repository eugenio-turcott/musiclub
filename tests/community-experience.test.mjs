import test from 'node:test';
import assert from 'node:assert/strict';
import {MELOMANO_LEVELS,getMelomanoLevel,PROGRESSION_BADGES,TIER_STYLES,calculateUserGamification} from '../src/utils/badgeSystem.js';
import {SHARE_FORMATS,clippedText} from '../src/utils/socialCards.js';
import {TOUR_SECTIONS,FAQ_TOUR_ANCHORS} from '../src/data/musiclubTour.js';

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
