import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
export async function poolDatabase() {
 const db=new PGlite();
  await db.exec(`
   create role anon; create role authenticated; create schema auth;
   grant usage on schema auth,public to anon,authenticated;
   create function auth.uid() returns uuid language sql as $$select nullif(current_setting('test.user_id',true),'')::uuid$$;
   create function auth.jwt() returns jsonb language sql as $$select '{"user_metadata":{"full_name":"Member"}}'::jsonb$$;
   create function musiclub_is_admin() returns boolean language sql as $$select coalesce(current_setting('test.admin',true)='on',false)$$;
   create table seasons(id text primary key,season_number int unique,name text,description text,start_date date,is_active boolean,is_open boolean,max_releases int,appearance jsonb default '{}');
   create unique index legacy_one_active on seasons(is_active) where is_active;
   create table albums(id uuid primary key default gen_random_uuid(),album_name text,artist_name text,image_url text,release_type text,release_date text,release_year int,genres text[],tracks jsonb,spotify_link text,youtube_link text,apple_music_link text,other_link text,reviews_enabled boolean,mbid text);
   create table pool_entries(id uuid primary key default gen_random_uuid(),season_id text references seasons(id),album_id uuid references albums(id),nominated_by text,nominated_by_email text,user_id uuid,note text,status text,reviews_enabled boolean,created_at timestamptz default now(),spotify_link text,youtube_link text,apple_music_link text,other_link text);
   create function musiclub_release_genres_are_valid(genres text[]) returns boolean language sql as $$select coalesce(array_length(genres,1),0)>0$$;
   create function musiclub_release_is_available(released text) returns boolean language sql as $$select released is null or released::date<=current_date$$;
   insert into seasons(id,season_number,name,is_active,is_open) values('legacy',1,'Original',true,false);
   alter table seasons enable row level security; alter table pool_entries enable row level security;
   create policy legacy_seasons on seasons for all using(true) with check(true);
   create policy legacy_entries on pool_entries for all using(true) with check(true);
   grant all on seasons,pool_entries,albums to anon,authenticated;
  `);
  await db.exec(await readFile(new URL('../../supabase/migrations/20261023_v933_pool_member_edit.sql',import.meta.url),'utf8'));
  const migration=await readFile(new URL('../../supabase/migrations/20261026_v935_pool_rooms.sql',import.meta.url),'utf8');
  await db.exec(migration);
 return db;
}
