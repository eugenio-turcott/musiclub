// Uses existing Actions secrets; writes only the public albums.genres column.
import { createClient } from '@supabase/supabase-js';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { planReleaseGenres } from './lib/release-genres.mjs';

const url = process.env.REACT_APP_SUPABASE_URL;
if (new URL(url).hostname !== 'nzsuxrycbywbdyidvsfl.supabase.co') throw new Error('Unexpected database host');
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) throw new Error('Missing server credential');
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const { assignments } = JSON.parse(await readFile(new URL('../data/genre-assignments-v9.8.json', import.meta.url), 'utf8'));
async function readAlbums() {
  const rows = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await db.from('albums').select('id,album_name,artist_name,genres').order('id').range(offset, offset + 499);
    if (error) throw new Error(error.message);
    rows.push(...data);
    if (data.length < 500) return rows;
  }
}
const albums = await readAlbums();
if (!albums.length) throw new Error('Empty database response');
const plan = planReleaseGenres(albums, assignments);
await mkdir('genre-migration', { recursive: true });
await writeFile('genre-migration/backup.json', JSON.stringify(albums, null, 2));
await writeFile('genre-migration/plan.json', JSON.stringify(plan, null, 2));
const changes = plan.filter(row => row.changed);
console.log(JSON.stringify({ mode: process.argv.includes('--apply') ? 'apply' : 'dry-run', releases: albums.length, changes: changes.length, emptyBefore: albums.filter(a => !a.genres?.length).length, emptyAfter: plan.filter(a => !a.genres.length).length }));
if (process.argv.includes('--apply')) {
  for (const row of changes) {
    // Optimistic locking: a concurrent genre edit must never be overwritten.
    let query = db.from('albums').update({ genres: row.genres }).eq('id', row.id);
    const postgresArray = row.before === null ? null : `{${row.before.map(value => JSON.stringify(value)).join(',')}}`;
    query = row.before === null ? query.is('genres', null) : query.eq('genres', postgresArray);
    const { data, error } = await query.select('id');
    if (error || data?.length !== 1) throw new Error(`Genre update failed or changed concurrently: ${row.id}: ${error?.message || 'conflict'}`);
  }
  const verified = await readAlbums();
  const remaining = planReleaseGenres(verified, assignments).filter(row => row.changed);
  if (remaining.length) throw new Error(`Verification failed: ${remaining.length} rows`);
  await writeFile('genre-migration/verified.json', JSON.stringify(verified, null, 2));
  console.log(`Verified ${verified.length} releases; every release has recognized genres.`);
}
