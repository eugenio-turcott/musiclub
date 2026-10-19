-- Optional capacity is enforced under the same season lock used by nominations.
begin;
alter table public.seasons add column if not exists max_releases integer;
alter table public.seasons add column if not exists appearance jsonb not null default '{}'::jsonb;
alter table public.seasons drop constraint if exists musiclub_season_capacity;
alter table public.seasons add constraint musiclub_season_capacity check (max_releases is null or max_releases between 1 and 1000);
alter table public.seasons drop constraint if exists musiclub_season_appearance;
alter table public.seasons add constraint musiclub_season_appearance check (jsonb_typeof(appearance)='object' and octet_length(appearance::text)<=10000);

create or replace function public.musiclub_pool_proposals_open(p_season_id text)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists(select 1 from public.seasons s where s.id=p_season_id and s.is_active and s.is_open
    and (s.max_releases is null or (select count(*) from public.pool_entries p where p.season_id=s.id)<s.max_releases));
$$;
create or replace function public.musiclub_pool_capacity_guard()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare v_limit integer; v_active boolean; v_open boolean;
begin
  select max_releases,is_active,is_open into v_limit,v_active,v_open from public.seasons where id=new.season_id for update;
  if not found or not v_active or not v_open then raise exception 'Las propuestas de este Pool están cerradas'; end if;
  if v_limit is not null and (select count(*) from public.pool_entries where season_id=new.season_id)>=v_limit then raise exception 'El cupo del Pool ya está completo. Tu cápsula no se guardó.'; end if;
  return new;
end; $$;
revoke all on function public.musiclub_pool_capacity_guard() from public, anon, authenticated;
drop trigger if exists musiclub_pool_capacity_guard on public.pool_entries;
create trigger musiclub_pool_capacity_guard before insert on public.pool_entries for each row execute function public.musiclub_pool_capacity_guard();

create or replace function public.musiclub_pool_settings_guard()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.max_releases is not null and new.max_releases < (select count(*) from public.pool_entries where season_id=new.id) then raise exception 'El cupo no puede ser menor a los releases ya registrados'; end if;
  return new;
end; $$;
revoke all on function public.musiclub_pool_settings_guard() from public, anon, authenticated;
drop trigger if exists musiclub_pool_settings_guard on public.seasons;
create trigger musiclub_pool_settings_guard before update of max_releases on public.seasons for each row execute function public.musiclub_pool_settings_guard();

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('pool-media','pool-media',true,8388608,array['image/jpeg','image/png','image/webp','image/gif']) on conflict(id) do nothing;
drop policy if exists musiclub_pool_media_read on storage.objects;
create policy musiclub_pool_media_read on storage.objects for select to anon,authenticated using (bucket_id='pool-media');
drop policy if exists musiclub_pool_media_admin_insert on storage.objects;
create policy musiclub_pool_media_admin_insert on storage.objects for insert to authenticated with check (bucket_id='pool-media' and public.musiclub_is_admin() and (storage.foldername(name))[1]='design');
-- No public/member writes, overwrites or deletes. Every upload has its own UUID.
commit;
