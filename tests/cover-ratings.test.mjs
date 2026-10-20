import test from 'node:test';
import assert from 'node:assert/strict';
import identity from '../src/utils/coverRatingIdentity.cjs';
import { createCoverRatingsStore } from '../src/services/coverRatingsStore.mjs';

const user = { id: 'owner-a', email: 'Member_A@example.test', name: 'Alex' };
function fakeDb(results, session = user) {
  const calls = [];
  return {
    calls,
    auth: { getUser: async () => ({ data: { user: session }, error: null }) },
    from(table) {
      const call = { table, steps: [] }; calls.push(call);
      const result = results.shift();
      const query = {};
      for (const method of ['select','eq','is','ilike','order','upsert','delete','single','maybeSingle']) {
        query[method] = (...args) => { call.steps.push([method, ...args]); return query; };
      }
      query.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
      return query;
    },
  };
}

test('matching display names never confer ownership, even after changing accounts', () => {
  const rows = [{ album_id: 'album', user_id: 'other', user_name: 'Alex', rating: 9 }];
  assert.equal(identity.ownCoverRatings(rows, user).size, 0);
  assert.equal(identity.ownCoverRatings(rows, null).size, 0);
  assert.equal(identity.ownCoverRatings(rows, { id:'other', name:'Alex' }).size, 1);
  assert.equal(identity.ownsCoverRating({user_id:'other', user_email:user.email},user),false);
});

test('legacy ownership needs an email and never falls back to a name', () => {
  assert.equal(identity.ownsCoverRating({ user_email:' member_a@EXAMPLE.test ' },user),true);
  assert.equal(identity.ownsCoverRating({ user_name:'Alex' },user),false);
  assert.equal(identity.ownsCoverRating({ user_email:user.email },{ email:user.email }),false);
});

test('the most recent saved score wins when private and public snapshots overlap', () => {
  const rows = [
    { album_id:'album', user_id:user.id, rating:9, updated_at:'2026-10-20' },
    { album_id:'album', user_id:user.id, rating:7, created_at:'2026-10-19' },
    { album_id:'album', user_id:'other', rating:1, updated_at:'2026-10-21' },
  ];
  assert.equal(identity.ownCoverRatings(rows,user).get('album').rating,9);
});

test('private reads support legacy rows without exposing same-name ratings', async () => {
  const owned = {id:'mine',user_id:user.id};
  const legacy = {id:'legacy',user_email:user.email};
  const db = fakeDb([{data:[owned]},{data:[legacy,{id:'foreign',user_name:'Alex',user_id:'other'}]}]);
  const rows = await createCoverRatingsStore(db).getOwn(user);
  assert.deepEqual(rows,[owned,legacy]);
  assert.deepEqual(db.calls[0].steps.at(-1),['eq','user_id',user.id]);
  assert.deepEqual(db.calls[1].steps.at(-1),['ilike','user_email','member\\_a@example.test']);
});

test('saving uses the authenticated owner and rejects unpersisted scores', async () => {
  const saved = {id:'saved',album_id:'album',user_id:user.id,rating:8};
  const db = fakeDb([{data:saved}]);
  assert.equal(await createCoverRatingsStore(db).submit({album_id:'album',rating:8,user_id:user.id,user_email:'other@test'}),saved);
  const payload = db.calls[0].steps.find(step=>step[0]==='upsert')[1];
  assert.equal(payload.user_id,user.id);
  assert.equal(payload.user_email,'member_a@example.test');
  await assert.rejects(createCoverRatingsStore(fakeDb([{error:{message:'offline'}}])).submit({album_id:'album',rating:8}),/No se guardó/);
  await assert.rejects(createCoverRatingsStore(fakeDb([],null)).submit({album_id:'album',rating:8}),/Inicia sesión/);
  const changedSession = fakeDb([],{id:'other',email:'other@example.test'});
  await assert.rejects(createCoverRatingsStore(changedSession).submit({album_id:'album',rating:8,user_id:user.id}),/sesión cambió/);
  assert.equal(changedSession.calls.length,0);
});

test('invalid ratings never reach the database', async () => {
  for (const rating of [0,11,NaN,Infinity,'bad']) {
    const db=fakeDb([]);
    await assert.rejects(createCoverRatingsStore(db).submit({album_id:'album',rating}),/entre 1 y 10/);
    assert.equal(db.calls.length,0);
  }
});

test('deleting a same-name foreign score is refused without issuing a delete', async () => {
  const db=fakeDb([{data:{id:'foreign',album_id:'album',user_id:'other',user_name:'Alex'}}]);
  await assert.rejects(createCoverRatingsStore(db).remove('foreign','album'),/No puedes/);
  assert.equal(db.calls.length,1);
  await assert.rejects(createCoverRatingsStore(fakeDb([])).remove(null,null),/No se encontró/);
});

test('deletion must affect the exact owned row before reporting success', async () => {
  const row={id:'mine',album_id:'album',user_id:user.id};
  const db=fakeDb([{data:row},{data:[{id:'mine'}]}]);
  assert.equal(await createCoverRatingsStore(db).remove('mine','album'),true);
  assert.ok(db.calls[1].steps.some(step=>step[0]==='eq'&&step[1]==='user_id'&&step[2]===user.id));
  await assert.rejects(createCoverRatingsStore(fakeDb([{data:row},{data:[]}])).remove('mine','album'),/No se eliminó/);
  await assert.rejects(createCoverRatingsStore(fakeDb([{data:row},{error:{message:'offline'}}])).remove('mine','album'),/No se eliminó/);
});

test('public read failures stay visible instead of becoming local community votes', async () => {
  await assert.rejects(createCoverRatingsStore(fakeDb([{error:{message:'offline'}}])).getAll(),/No pudimos cargar/);
  assert.deepEqual(await createCoverRatingsStore(fakeDb([{data:[]}])).getAll(),[]);
});
