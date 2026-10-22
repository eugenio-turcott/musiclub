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
