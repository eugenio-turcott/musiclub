import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { POOL_THEMES } from '../src/data/poolThemes.js';

function serviceFixture({ entries = [], albums = [], rpc = async () => ({ data: false, error: null }) } = {}) {
  const filters = [];
  const supabase = { rpc, from: () => ({ select() { return this; }, eq(field, value) { filters.push([field,value]); return this; }, async order() { return { data: entries, error: null }; } }) };
  const source = fs.readFileSync(new URL('../src/services/poolService.js', import.meta.url), 'utf8').replace(/^import .*;\r?$/gm, '').replace(/export const /g, 'const ').replace('export default poolService;', 'poolService;');
  const service = vm.runInNewContext(source, { supabase, supabaseService: { getAllAlbumsWithFullStats: async () => albums }, console, Date, window: undefined });
  service.getSeasons = async () => [{ id: 'old', is_active: false }, { id: 'current', is_active: true, is_open: false }];
  return { service, filters };
}

test('an empty current Pool never falls back to unrelated catalog releases', async () => {
  const { service, filters } = serviceFixture({ albums: [{ id:'unrelated', status:'ACTIVO', album_name:'Other' }] });
  const result = await service.getPoolData();
  assert.equal(result.season.id, 'current');
  assert.equal(result.active.length, 0);
  assert.equal(result.history.length, 0);
  assert.equal(result.winner, null);
  assert.deepEqual(filters, [['season_id','current']]);
});

test('a database review closure wins over stale enabled flags in the catalog or entry', async () => {
  const { service } = serviceFixture({ albums: [{id:'album',album_name:'Album',reviews_enabled:true}], entries: [{id:'entry',album_id:'album',status:'GANADOR',reviews_enabled:true}], rpc: async () => ({ data:false,error:null }) });
  const result = await service.getPoolData();
  assert.equal(result.winner.reviews_enabled, false);
});

test('a rejected nomination reports the closure instead of inserting an orphaned album', async () => {
  let calls = [];
  const { service } = serviceFixture({ rpc: async (name, args) => { calls.push([name,args]); return { error:{message:'Pool cerrado'} }; } });
  await assert.rejects(service.nominateAlbumToPool({seasonId:'current',albumData:{albumName:'Example'},user:{id:'member'},note:'For this Pool'}), /Pool cerrado/);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'musiclub_nominate_pool_release');
  assert.equal(calls[0][1].p_season_id, 'current');
});

test('manual controls use the active Pool and never report success after a database rejection', async () => {
  const calls = [];
  const { service } = serviceFixture({ rpc: async (name,args) => { calls.push([name,args]); return { error:{message:'Solo administrador'} }; } });
  await assert.rejects(service.setPoolOpenStatus(true), /Solo administrador/);
  assert.equal(calls[0][1].p_season_id, 'current');
  assert.equal(calls[0][1].p_action, 'proposals');
  await assert.rejects(service.toggleWinnerReviews('album', false, 'current'), /Solo administrador/);
  assert.equal(calls[1][1].p_enabled, false);
});

test('the club receives ten distinct Pool ideas with a rule and a group game', () => {
  assert.equal(POOL_THEMES.length, 10);
  assert.equal(new Set(POOL_THEMES.map(theme=>theme.id)).size, 10);
  assert.ok(POOL_THEMES.every(theme=>theme.rule && theme.game));
});
