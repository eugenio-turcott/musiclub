import {writeFile} from 'node:fs/promises';
import catalog from '../src/utils/genreCatalog.cjs';
const quote = value => "'"+value.replace(/'/g,"''")+"'";
const rows = catalog.GENRES.map(genre => `(${quote(genre.id)},${quote(genre.name)})`).join(',\n');
const sql = `-- Musiclub: replace the fixed genre whitelist with a validated, extensible registry.
-- Existing album data and album access policies are preserved. All changes are atomic.
begin;
create table if not exists public.musiclub_genre_registry (
  id text primary key,
  name text not null unique,
  constraint genre_registry_id_length check (length(id) between 1 and 120),
  constraint genre_registry_name_length check (length(name) between 1 and 120)
);
alter table public.musiclub_genre_registry enable row level security;
revoke all on public.musiclub_genre_registry from anon, authenticated;
grant select on public.musiclub_genre_registry to anon, authenticated;
grant select, insert, update on public.musiclub_genre_registry to service_role;
drop policy if exists musiclub_genres_public_read on public.musiclub_genre_registry;
create policy musiclub_genres_public_read on public.musiclub_genre_registry for select using (true);
insert into public.musiclub_genre_registry (id,name) values
${rows}
on conflict (id) do update set name=excluded.name;
create or replace function public.musiclub_release_genres_are_valid(release_genres text[])
returns boolean language sql stable security invoker set search_path = public, pg_temp
as $$
  select release_genres is not null and cardinality(release_genres)>0
    and not exists (
      select 1 from unnest(release_genres) as candidate(name)
      left join public.musiclub_genre_registry registry on registry.name=candidate.name
      where registry.id is null
    );
$$;
revoke all on function public.musiclub_release_genres_are_valid(text[]) from public;
grant execute on function public.musiclub_release_genres_are_valid(text[]) to anon, authenticated, service_role;
alter table public.albums drop constraint if exists musiclub_release_genres_valid;
alter table public.albums add constraint musiclub_release_genres_valid
  check (public.musiclub_release_genres_are_valid(genres)) not valid;
alter table public.albums validate constraint musiclub_release_genres_valid;
commit;
select count(*) as registered_genres from public.musiclub_genre_registry;
`;
await writeFile('supabase/migrations/20261019_v914_extensible_genre_registry.sql',sql);
console.log(`Prepared ${catalog.GENRES.length} genre definitions and an atomic validation migration.`);
