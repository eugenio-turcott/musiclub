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


const { resolveGenres, sameRelease } = (await import('../src/utils/remoteReleaseGenres.cjs')).default;
test('Deluxe without embed genres gets canonical genres from the exact Deezer edition',async()=>{
  const selected={name:'House of LION BABE (Deluxe)',artist:'LION BABE',tracks:[{name:'Bonus track'}]};
  const before=JSON.stringify(selected), requested=[];
  const genres=await resolveGenres(selected.artist,selected.name,[[],['not-a-genre-code']],{
    search:async()=>({albums:[{id:'standard',name:'House of LION BABE',artist:'LION BABE'},{id:'deluxe',...selected}]}),
    details:async id=>{requested.push(id);return {...selected,genres:['Dance','Pop']};}
  });
  assert.deepEqual(genres,['Dance','Pop']);
  assert.deepEqual(requested,['deluxe']);
  assert.equal(JSON.stringify(selected),before);
});
test('genre fallback rejects another artist, edition and mismatched detail responses',async()=>{
  assert.equal(sameRelease('A','Blue (Deluxe)',{name:'Blue',artist:'A'}),false);
  assert.equal(sameRelease('A','Blue',{name:'Blue',artist:'B'}),false);
  assert.deepEqual(await resolveGenres('A','Blue (Deluxe)',[],{
    search:async()=>({albums:[{id:'x',name:'Blue (Deluxe)',artist:'A'}]}),
    details:async()=>({name:'Blue',artist:'A',genres:['Rock']})
  }),[]);
});
test('recognized source genres avoid an extra lookup and outages never invent genres',async()=>{
  assert.deepEqual(await resolveGenres('A','Blue',[['R&B/Soul']],{search:()=>{throw new Error('must not run');}}),['R&B','Soul']);
  assert.deepEqual(await resolveGenres('A','Blue',[],{search:async()=>{throw new Error('offline');}}),[]);
});


const { resolvePublicRelease } = (await import('../src/utils/publicReleaseLookup.cjs')).default;
test('a newly inserted Deluxe is resolved immediately despite a stale collection cache',async()=>{
  const standard={id:'standard',album_name:'House of LION BABE',artist_name:'LION BABE'};
  const deluxe={id:'deluxe',album_name:'House of LION BABE (Deluxe)',artist_name:'LION BABE'};
  const result=await resolvePublicRelease('lion-babe-house-of-lion-babe-deluxe',[standard],async()=>[standard,deluxe]);
  assert.equal(result.album,deluxe); assert.equal(result.fresh,true);
  assert.equal((await resolvePublicRelease('lion-babe-house-of-lion-babe',[standard],()=>{throw new Error('unneeded refresh');})).album,standard);
});
test('fresh misses and ambiguous legacy titles still return no arbitrary release',async()=>{
  const albums=[{album_name:'Blue',artist_name:'A'},{album_name:'Blue',artist_name:'B'}];
  assert.equal((await resolvePublicRelease('blue',albums,()=>{throw new Error('ambiguous');})).album,null);
  assert.equal((await resolvePublicRelease('not-found',[],async()=>albums)).album,null);
});
