import {test} from 'node:test';
import assert from 'node:assert/strict';
import {restoreReviewDraft} from '../src/utils/reviewDraft.mjs';

const user={id:'member',email:'member@example.test'};
test('partial drafts preserve an intentional midpoint score and the exact step without filling other criteria',()=>{
  const draft=restoreReviewDraft({version:2,userId:user.id,ratings:{produccion:3},trackRatings:{a:8},wizardStep:'criteria',currentTrackIndex:2,currentCriterionIndex:1},user);
  assert.deepEqual(draft.ratings,{produccion:3});
  assert.deepEqual(draft.trackRatings,{a:8});
  assert.equal(draft.wizardStep,'criteria');assert.equal(draft.currentCriterionIndex,1);assert.equal(draft.currentTrackIndex,2);
});
test('legacy track-only drafts discard automatic criteria but keep the actual tracks and position',()=>{
  const draft=restoreReviewDraft({userEmail:user.email,ratings:{produccion:3,composicion:3,letras:3,originalidad:3,cohesion:3,replay:3,general:5},trackRatings:{a:9},wizardStep:'tracks',currentTrackIndex:1},user);
  assert.deepEqual(draft.ratings,{});assert.deepEqual(draft.trackRatings,{a:9});assert.equal(draft.currentTrackIndex,1);assert.equal(draft.migrated,true);
});
test('legacy non-default scores survive, invalid scores do not become completed criteria',()=>{
  const draft=restoreReviewDraft({userEmail:user.email,ratings:{produccion:4,composicion:3,general:10,letras:9},trackRatings:{a:0,b:5,c:null}},user);
  assert.deepEqual(draft.ratings,{produccion:4,general:10});assert.deepEqual(draft.trackRatings,{b:5});
});
test('drafts belong to their account and corrupt navigation cannot restore invalid steps',()=>{
  assert.equal(restoreReviewDraft({version:2,userId:'someone-else'},user),null);
  assert.equal(restoreReviewDraft({userEmail:'someone-else@example.test'},user),null);
  assert.equal(restoreReviewDraft(null,user),null);
  const draft=restoreReviewDraft({version:2,userId:user.id,wizardStep:'invalid',currentTrackIndex:-2,currentCriterionIndex:NaN},user);
  assert.equal(draft.wizardStep,'tracks');assert.equal(draft.currentTrackIndex,0);assert.equal(draft.currentCriterionIndex,0);
});
