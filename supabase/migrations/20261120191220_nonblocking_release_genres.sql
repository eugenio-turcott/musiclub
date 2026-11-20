-- Verified releases remain available while their musical genre is pending.
begin;
insert into public.musiclub_genre_registry(id,name) values ('a cappella','A Cappella'),
('alternative','Alternativo'),
('indie','Indie'),
('karaoke','Karaoke'),
('marching music','Marchas'),
('african music','Música Africana'),
('arabic music','Música Árabe'),
('asian music','Música Asiática'),
('brazilian music','Música Brasileña'),
('chinese music','Música China'),
('korean music','Música Coreana'),
('christian music','Música Cristiana'),
('cuban music','Música Cubana'),
('anime music','Música de Anime'),
('disney music','Música de Disney'),
('holiday','Música Festiva'),
('indian music','Música India'),
('inspirational music','Música Inspiracional'),
('jewish music','Música Judía'),
('fitness & workout','Música para Entrenar'),
('russian music','Música Rusa'),
('turkish music','Música Turca'),
('vocal music','Música Vocal'),
('world music','Músicas del Mundo'),
('soundtrack','Soundtrack'),
('tarab','Tarab'),
('latin urban','Urbano')
on conflict(id) do update set name=excluded.name;
create or replace function public.musiclub_release_genres_are_valid(release_genres text[])
returns boolean language sql stable security invoker set search_path=public,pg_temp
as $$ select release_genres is not null and not exists (
 select 1 from unnest(release_genres) as candidate(name)
 left join public.musiclub_genre_registry registry on registry.name=candidate.name
 where registry.id is null
); $$;
alter table public.albums add column if not exists genre_retry_at timestamptz not null default now();
alter table public.albums add column if not exists genre_retry_count integer not null default 0 check(genre_retry_count>=0);
create index if not exists musiclub_missing_genres_retry on public.albums(genre_retry_at,id) where genres='{}'::text[];
comment on column public.albums.genre_retry_at is 'Next automatic genre lookup; an empty genres array means verification pending, never a musical genre.';
commit;
