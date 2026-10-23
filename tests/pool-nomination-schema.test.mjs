import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('a new Pool capsule inserts an album without a legacy status column and keeps membership state in pool_entries',async()=>{
 const db=new PGlite();
 try {
 await db.exec(`
 create role anon; create role authenticated; create schema auth;
 create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('test.user_id',true),'')::uuid $$;
 create function auth.jwt() returns jsonb language sql as $$ select '{"user_metadata":{"full_name":"Miembro de Prueba"}}'::jsonb $$;
 create table seasons(id text primary key,is_active boolean,is_open boolean);
 create table albums(id uuid primary key default gen_random_uuid(),album_name text,artist_name text,image_url text,release_type text,release_date date,release_year integer,genres text[],tracks jsonb,spotify_link text,youtube_link text,apple_music_link text,other_link text,reviews_enabled boolean,mbid text);
 create table pool_entries(id uuid primary key default gen_random_uuid(),season_id text,album_id uuid references albums(id),nominated_by text,nominated_by_email text,user_id uuid,note text,status text,reviews_enabled boolean);
 create function musiclub_release_genres_are_valid(genres text[]) returns boolean language sql as $$ select coalesce(array_length(genres,1),0)>0 $$;
 create function musiclub_release_is_available(released date) returns boolean language sql as $$ select released is null or released<=current_date $$;
 insert into seasons values('current',true,true);
 set test.user_id='00000000-0000-4000-8000-000000000001';
 `);
 await db.exec(await readFile(new URL('../supabase/migrations/20261022_v932_pool_nomination_status.sql',import.meta.url),'utf8'));
 const payload={albumName:'Nuevo álbum',artistName:'Artista',genres:['Pop'],releaseDate:'2025-01-01',tracks:[]};
 const submit=()=>db.query("select musiclub_nominate_pool_release('current',null,$1::jsonb,'Una cápsula') as result",[JSON.stringify(payload)]);
 const result=(await submit()).rows[0].result;
 assert.equal(result.success,true);
 const saved=(await db.query('select * from albums')).rows[0];
 assert.equal(saved.album_name,'Nuevo álbum');assert.equal(Object.hasOwn(saved,'status'),false);
 const entry=(await db.query('select * from pool_entries')).rows[0];
 assert.equal(entry.status,'ACTIVO');assert.equal(entry.album_id,saved.id);assert.equal(entry.reviews_enabled,false);
 await assert.rejects(submit(),/ya fue propuesto/);
 assert.equal((await db.query('select count(*)::int as n from albums')).rows[0].n,1);
 await db.exec("update seasons set is_open=false;");
 await assert.rejects(submit(),/cerradas/);
 await db.exec("update seasons set is_open=true; set test.user_id='';");
 await assert.rejects(submit(),/Inicia sesión/);
 }finally{await db.close();}
});


test('one capsule per season is enforced and only its owner can edit a pending entry, including at full capacity', async () => {
 const db = new PGlite();
 try {
  await db.exec(`
   create role anon; create role authenticated; create schema auth;
   create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('test.user_id',true),'')::uuid $$;
   create function auth.jwt() returns jsonb language sql as $$ select '{"user_metadata":{"full_name":"Member"}}'::jsonb $$;
   create table seasons(id text primary key,is_active boolean,is_open boolean,max_releases int);
   create table albums(id uuid primary key default gen_random_uuid(),album_name text,artist_name text,image_url text,release_type text,release_date date,release_year integer,genres text[],tracks jsonb,spotify_link text,youtube_link text,apple_music_link text,other_link text,reviews_enabled boolean,mbid text);
   create table pool_entries(id uuid primary key default gen_random_uuid(),season_id text,album_id uuid references albums(id),nominated_by text,nominated_by_email text,user_id uuid,note text,status text,reviews_enabled boolean,created_at timestamptz default now(),spotify_link text,youtube_link text,apple_music_link text,other_link text);
   create function musiclub_release_genres_are_valid(genres text[]) returns boolean language sql as $$ select coalesce(array_length(genres,1),0)>0 $$;
   create function musiclub_release_is_available(released date) returns boolean language sql as $$ select released is null or released<=current_date $$;
   create function capacity_guard() returns trigger language plpgsql as $$ begin
    perform 1 from seasons where id=new.season_id for update;
    if (select count(*) from pool_entries where season_id=new.season_id)>=(select max_releases from seasons where id=new.season_id) then raise exception 'Cupo completo'; end if;
    return new;
   end; $$;
   create trigger capacity_guard before insert on pool_entries for each row execute function capacity_guard();
   insert into seasons values('current',true,true,2),('other',true,true,5),('legacy',false,false,10);
   insert into albums(id,album_name,artist_name,reviews_enabled) values('00000000-0000-4000-8000-000000000010','Shared album','Artist',true);
   -- Historical duplicates remain untouched by the migration.
   insert into pool_entries(season_id,user_id,album_id,status) select 'legacy','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000010','GRADUADO' from generate_series(1,2);
   set test.user_id='00000000-0000-4000-8000-000000000001';
  `);
  await db.exec(await readFile(new URL('../supabase/migrations/20261023_v933_pool_member_edit.sql',import.meta.url),'utf8'));
  const payload = name => JSON.stringify({albumName:name,artistName:'Artist',genres:['Pop'],releaseDate:'2025-01-01'});
  const nominate = (name,season='current') => db.query("select musiclub_nominate_pool_release($1,null,$2::jsonb,'Note') as result",[season,payload(name)]);
  const first=(await nominate('First')).rows[0].result;
  const before=(await db.query('select * from pool_entries where id=$1',[first.entryId])).rows[0];
  await assert.rejects(nominate('Unwanted second'),/Solo puedes proponer/);
  assert.equal((await db.query("select count(*)::int as n from albums where album_name='Unwanted second'")).rows[0].n,0);
  await assert.rejects(db.query("insert into pool_entries(season_id,user_id,album_id,status) values('current',null,$1,'ACTIVO')",[first.albumId]),/Solo puedes proponer/);
  const otherSeason=(await nominate('Other season','other')).rows[0].result;
  assert.equal(otherSeason.success,true);
  await db.exec("set test.user_id='00000000-0000-4000-8000-000000000002';");
  const second=(await nominate('Second')).rows[0].result;
  const edit = (entry=first.entryId,name='Replacement',note='Updated') => db.query("select musiclub_edit_pool_release('current',$1,null,$2::jsonb,$3) as result",[entry,payload(name),note]);
  await assert.rejects(edit(),/propia cápsula/);
  await db.exec("set test.user_id='00000000-0000-4000-8000-000000000001';");
  await db.query("update pool_entries set spotify_link='https://old-release.example' where id=$1",[first.entryId]);
  assert.equal((await edit()).rows[0].result.success,true);
  const after=(await db.query('select * from pool_entries where id=$1',[first.entryId])).rows[0];
  assert.equal(after.id,before.id); assert.equal(after.user_id,before.user_id);
  assert.equal(+after.created_at,+before.created_at); assert.equal(after.note,'Updated'); assert.equal(after.spotify_link,null);
  assert.equal(after.status,'ACTIVO'); assert.equal(after.reviews_enabled,false);
  assert.equal((await db.query("select count(*)::int as n from pool_entries where season_id='current'")).rows[0].n,2);
  assert.equal((await db.query('select album_name from albums where id=$1',[first.albumId])).rows[0].album_name,'First');
  await assert.rejects(db.query("select musiclub_edit_pool_release('current',$1,$2,'{}','')",[first.entryId,second.albumId]),/ya fue propuesto/);
  await assert.rejects(db.query("select musiclub_edit_pool_release('current',$1,null,$2::jsonb,'')",[first.entryId,JSON.stringify({albumName:'Future',artistName:'Artist',genres:['Pop'],releaseDate:'2099-01-01'})]),/disponible/);
  await assert.rejects(edit(first.entryId,'Replacement','x'.repeat(601)),/600/);
  await db.exec("update seasons set is_open=false where id='current';");
  await assert.rejects(edit(),/cerradas/);
  await db.exec("update seasons set is_open=true where id='current'; update pool_entries set status='GANADOR' where id='"+first.entryId+"';");
  await assert.rejects(edit(),/en espera/);
  await assert.rejects(nominate('Winner cannot nominate twice'),/Solo puedes proponer/);
  await db.exec("set test.user_id='';");
  await assert.rejects(edit(),/Inicia sesión/);
  assert.equal((await db.query("select count(*)::int as n from pool_entries where season_id='legacy'")).rows[0].n,2);
  assert.equal((await db.query("select has_function_privilege('anon','musiclub_edit_pool_release(text,uuid,uuid,jsonb,text)','EXECUTE') as allowed")).rows[0].allowed,false);
  assert.equal((await db.query("select has_function_privilege('authenticated','musiclub_resolve_pool_release(uuid,jsonb)','EXECUTE') as allowed")).rows[0].allowed,false);
 } finally { await db.close(); }
});
