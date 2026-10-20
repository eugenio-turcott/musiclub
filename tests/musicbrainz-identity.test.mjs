import test from 'node:test';
import assert from 'node:assert/strict';
import identity from '../src/utils/musicBrainzIdentity.cjs';
const group=(title,artist)=>({title,'artist-credit':[{name:artist}]});

test('a high-scoring compilation or partial title cannot replace the requested release',()=>{
  assert.equal(identity.releaseGroupMatches('Led Zeppelin','Led Zeppelin',group('Led Zeppelin x Led Zeppelin','Led Zeppelin')),false);
  assert.equal(identity.releaseGroupMatches('A','Blue',group('Blue','Another A')),false);
  assert.equal(identity.releaseGroupMatches('A','Blue',group('Blue Songs','A')),false);
});
test('punctuation and mastering annotations are tolerated without merging editions',()=>{
  assert.equal(identity.releaseGroupMatches('ROSALÍA','MOTOMAMI',group('Motomami','Rosalia')),true);
  assert.equal(identity.releaseGroupMatches('A','Blue (2019 Remaster)',group('Blue','A')),true);
  for(const title of ['Blue (Deluxe)','Blue +','Blue Live','Blue Remixes']) assert.equal(identity.releaseGroupMatches('A',title,group('Blue','A')),false);
  assert.equal(identity.releaseGroupMatches('A','D.O.A.',group('DOA','A')),false);
});
test('the full credited collaboration must match, not just one contributor',()=>{
  const release={title:'Together','artist-credit':[{name:'A',joinphrase:' & '},{artist:{name:'B'}}]};
  assert.equal(identity.releaseGroupMatches('A & B','Together',release),true);
  assert.equal(identity.releaseGroupMatches('A','Together',release),false);
  assert.equal(identity.releaseGroupMatches('A','Together',{title:'Together'}),false);
});
