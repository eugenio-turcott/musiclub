import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { createReleaseLibraryStore } from '../src/services/releaseLibraryStore.mjs';
import helpers from '../src/utils/releaseLibrary.cjs';

const album = { id: 'old', album_name: 'A & B', artist_name: 'Artist', release_type: 'ALBUM', image_url: 'https://i.scdn.co/cover', spotify_link: 'https://open.spotify.com/album/123' };
const account = '10000000-0000-4000-8000-000000000001';
const other = '20000000-0000-4000-8000-000000000002';
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
function clientMock() {
  const db = { rows: [], writeError: false, writeGate: null, calls: 0 };
  db.from = () => ({ select: () => ({ eq: (_column, id) => ({ order: () => ({ range: async (from, to) => ({ data: db.rows.filter(row => row.user_id === id).slice(from, to + 1), error: db.readError }) }) }) }) });
  db.rpc = (_name, input) => ({ single: async () => {
    db.calls++;
    if (db.writeGate) await db.writeGate.promise;
    if (db.writeError) return { error: { message: 'offline' } };
    const previous = db.rows.find(row => row.release_key === input.p_release_key && row.user_id === account);
    const row = { user_id: account, listen_later: false, gashapon_dismissed: false, ...previous, release_key: input.p_release_key, release: input.p_release, [input.p_action]: input.p_value };
    db.rows = [...db.rows.filter(item => item !== previous), row];
    return { data: row };
  } });
  return db;
}

test('private SQL lists persist across reads, isolate accounts and preserve independent flags and discard history', async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth;
      grant usage on schema public,auth to anon,authenticated;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql as $$select nullif(current_setting('test.user_id',true),'')::uuid$$;
      insert into auth.users values('${account}'),('${other}');`);
    const sql = await readFile(new URL('../supabase/migrations/20261027_v938_release_library.sql', import.meta.url), 'utf8');
    await db.exec(sql);
    await db.exec(`set role authenticated; select set_config('test.user_id','${account}',false);`);
    const key = helpers.releaseKey(album), payload = JSON.stringify(helpers.releaseSnapshot(album));
    const write = (action, value) => db.query('select * from musiclub_set_release_preference($1,$2::jsonb,$3,$4)', [key, payload, action, value]);
    await write('listen_later', true);
    await write('gashapon_dismissed', true);
    let row = (await write('listen_later', false)).rows[0];
    assert.equal(row.gashapon_dismissed, true);
    assert.equal(row.listen_later, false);
    row = (await write('gashapon_dismissed', false)).rows[0];
    assert.equal(row.gashapon_dismissed, false);
    assert.ok(row.dismissed_at, 'reactivation retains the fixed history');
    assert.equal((await db.query('select * from user_release_preferences')).rows.length, 1);
    await assert.rejects(db.query('delete from user_release_preferences'), /permission denied/i);
    await db.exec(`select set_config('test.user_id','${other}',false);`);
    assert.equal((await db.query('select * from user_release_preferences')).rows.length, 0);
    await assert.rejects(db.query('insert into user_release_preferences(user_id,release_key,release) values($1,$2,$3)', [account, key, payload]), /row.level security/i);
    assert.equal((await db.query('update user_release_preferences set gashapon_dismissed=true where user_id=$1 returning *', [account])).rows.length, 0);
    await db.exec('reset role; set role anon;');
    await assert.rejects(db.query('select * from user_release_preferences'), /permission denied/i);
    await assert.rejects(write('listen_later', true), /permission denied/i);
  } finally { await db.close(); }
});

test('saved and discarded variants use stable work identity while deluxe stays separate', () => {
  const key = helpers.releaseKey(album);
  assert.equal(helpers.releaseKey({ album: 'A & B (Clean)', artista: 'Artist', id: 'new', release_type: 'ALBUM' }), key);
  assert.notEqual(helpers.releaseKey({ ...album, album_name: 'A & B (Deluxe)' }), key);
  assert.notEqual(helpers.releaseKey({ ...album, artist_name: 'Another Artist' }), key);
  assert.equal(helpers.isDismissed({ ...album, id: 'different' }, [{ release_key: key, gashapon_dismissed: true }]), true);
  assert.equal(helpers.isDismissed(album, [{ release_key: key, gashapon_dismissed: false }]), false);
  assert.equal(helpers.isDismissed({ ...album, album_name: 'Corrected title' }, [{ release_key: key, release: helpers.releaseSnapshot(album), gashapon_dismissed: true }]), true);
  assert.equal(helpers.isDismissed(album, [{ release_key: key, release: helpers.releaseSnapshot(album), gashapon_dismissed: false }, { release_key: 'older-title', release: helpers.releaseSnapshot(album), gashapon_dismissed: true }]), true);
  assert.equal(helpers.releaseSnapshot({ album: 'Title', artista: 'Artist', spotifyLink: album.spotify_link }).spotify_link, album.spotify_link);
});

test('all four streaming providers retain verified links or safely search by title and artist', () => {
  const links = helpers.streamingLinks({ ...album, other_link: 'https://unrelated.example/release', youtube_link: 'javascript:alert(1)' });
  assert.equal(links.length, 4);
  assert.equal(links[0].href, album.spotify_link);
  assert.match(links[2].href, /^https:\/\/music.youtube.com\/search\?q=Artist%20A%20%26%20B$/);
  assert.match(links[3].href, /^https:\/\/www.deezer.com\/search\//);
  assert.equal(helpers.streamingLinks({ ...album, other_link: 'https://www.deezer.com/album/12' })[3].href, 'https://www.deezer.com/album/12');
});

test('writes confirm server persistence, reject failures and prevent duplicate concurrent clicks', async () => {
  const db = clientMock(), store = createReleaseLibraryStore(db);
  await store.setAccount(account);
  db.writeError = true;
  await assert.rejects(store.setPreference(album, 'listen_later', true), /No se pudo guardar/);
  assert.deepEqual(store.getSnapshot().rows, []);
  assert.deepEqual(store.getSnapshot().pending, []);
  db.writeError = false; db.writeGate = deferred();
  const pending = store.setPreference(album, 'listen_later', true);
  assert.equal(await store.setPreference(album, 'listen_later', true), false);
  db.writeGate.resolve();
  assert.equal(await pending, true);
  assert.equal(store.getSnapshot().rows[0].listen_later, true);
  const secondDevice = createReleaseLibraryStore(db);
  await secondDevice.setAccount(account);
  assert.equal(secondDevice.getSnapshot().rows[0].listen_later, true);
  await store.setPreference(album, 'gashapon_dismissed', true);
  await secondDevice.refresh();
  assert.equal(helpers.isDismissed(album, secondDevice.getSnapshot().rows), true);
});

test('account changes clear previous private lists and ignore late writes from the old account', async () => {
  const db = clientMock(), store = createReleaseLibraryStore(db);
  await store.setAccount(account);
  db.writeGate = deferred();
  const pending = store.setPreference(album, 'gashapon_dismissed', true);
  await store.setAccount(other);
  db.writeGate.resolve();
  assert.equal(await pending, false);
  assert.equal(store.getSnapshot().account, other);
  assert.deepEqual(store.getSnapshot().rows, []);
  await store.setAccount(null);
  await assert.rejects(store.setPreference(album, 'listen_later', true), /Inicia sesión/);
});

test('private list reads paginate beyond the first database page and preserve exclusions on read errors', async () => {
  const db = clientMock();
  db.rows = Array.from({ length: 1001 }, (_, index) => ({ user_id: account, release_key: `key-${index}`, gashapon_dismissed: true }));
  const store = createReleaseLibraryStore(db);
  await store.setAccount(account);
  assert.equal(store.getSnapshot().rows.length, 1001);
  db.readError = { message: 'offline' };
  await assert.rejects(store.refresh(), /No pudimos cargar/);
  assert.equal(store.getSnapshot().rows.length, 1001);
  assert.ok(store.getSnapshot().error);
});
