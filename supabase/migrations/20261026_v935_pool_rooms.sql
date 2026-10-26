-- A room owns its seasons. Existing records stay in the public Musiclub room.
-- Private proposals are filtered in BOTH base tables and public projections.
begin;

create table if not exists public.pool_rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 100),
  description text not null default '' check (length(description)<=600),
  visibility text not null check (visibility in ('public','private')),
  owner_id uuid,
  created_at timestamptz not null default now()
);
create table if not exists public.pool_room_members (
  room_id uuid not null references public.pool_rooms(id) on delete cascade,
  user_id uuid not null,
  joined_at timestamptz not null default now(),
  primary key(room_id,user_id)
);
create table if not exists public.pool_room_invites (
  token uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.pool_rooms(id) on delete cascade,
  expires_at timestamptz not null default now()+interval '7 days',
  revoked boolean not null default false
);
insert into public.pool_rooms(id,name,description,visibility)
values('00000000-0000-4000-8000-000000000000','Musiclub · Sala del club','La sala pública original de Musiclub. Su historial se conserva.','public') on conflict(id) do nothing;
alter table public.seasons add column if not exists room_id uuid not null default '00000000-0000-4000-8000-000000000000' references public.pool_rooms(id);
create index if not exists musiclub_seasons_room on public.seasons(room_id);
create index if not exists musiclub_room_members_user on public.pool_room_members(user_id,room_id);
insert into public.pool_room_members(room_id,user_id)
select distinct s.room_id,p.user_id from public.pool_entries p join public.seasons s on s.id=p.season_id where p.user_id is not null on conflict do nothing;

-- Earlier deployments may have a global unique season number/active index.
-- Replace only those global uniqueness rules, preserving all rows and IDs.
do $$ declare item record; begin
 for item in select c.conname from pg_constraint c where c.conrelid='public.seasons'::regclass and c.contype='u'
  and c.conkey=array[(select attnum from pg_attribute where attrelid='public.seasons'::regclass and attname='season_number')]::smallint[]
 loop execute format('alter table public.seasons drop constraint %I',item.conname); end loop;
 for item in select ci.relname from pg_index i join pg_class ci on ci.oid=i.indexrelid
  where i.indrelid='public.seasons'::regclass and i.indisunique and i.indnkeyatts=1
  and i.indkey[0]=(select attnum from pg_attribute where attrelid='public.seasons'::regclass and attname='is_active') and i.indpred is not null
 loop execute format('drop index public.%I',item.relname); end loop;
end $$;
create unique index if not exists musiclub_one_active_pool_per_room on public.seasons(room_id) where is_active;

-- New catalog records remain reviewable; the original room still has its own gate.
create or replace function public.musiclub_resolve_pool_release(p_album_id uuid,p_album_data jsonb)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_album uuid:=p_album_id; v_genres text[]; v_date date; v_name text; v_artist text; v_mbid public.albums.mbid%type;
begin
  if v_album is null then
    v_name := trim(coalesce(p_album_data->>'albumName',''));
    v_artist := trim(coalesce(p_album_data->>'artistName',''));
    if v_name='' or v_artist='' or length(v_name)>300 or length(v_artist)>300 then raise exception 'Faltan datos válidos del release'; end if;
    select id into v_album from public.albums where lower(trim(album_name))=lower(v_name) and lower(trim(artist_name))=lower(v_artist) limit 1;
    if v_album is null then
      select coalesce(array_agg(value),array[]::text[]) into v_genres from jsonb_array_elements_text(coalesce(p_album_data->'genres','[]'::jsonb));
      if not public.musiclub_release_genres_are_valid(v_genres) then raise exception 'Selecciona al menos un género válido'; end if;
      if coalesce(p_album_data->>'releaseDate','') <> '' then
        v_date := (case length(p_album_data->>'releaseDate') when 4 then (p_album_data->>'releaseDate')||'-01-01' when 7 then (p_album_data->>'releaseDate')||'-01' else left(p_album_data->>'releaseDate',10) end)::date;
        if v_date > (now() at time zone 'America/Mexico_City')::date then raise exception 'Elige un release que ya esté disponible para escuchar'; end if;
      end if;
      v_mbid := nullif(p_album_data->>'mbid','');
      insert into public.albums(album_name,artist_name,image_url,release_type,release_date,release_year,genres,tracks,spotify_link,youtube_link,apple_music_link,other_link,reviews_enabled,mbid)
      values(v_name,v_artist,p_album_data->>'imageUrl',coalesce(nullif(p_album_data->>'releaseType',''),'ALBUM'),v_date,extract(year from v_date)::integer,v_genres,
        case when jsonb_typeof(p_album_data->'tracks')='array' then p_album_data->'tracks' else '[]'::jsonb end,
        p_album_data->>'spotifyLink',p_album_data->>'youtubeLink',p_album_data->>'appleMusicLink',p_album_data->>'otherLink',true,v_mbid) returning id into v_album;
    end if;
  end if;
  if not exists(select 1 from public.albums where id=v_album and public.musiclub_release_is_available(release_date)) then raise exception 'El release no está disponible'; end if;
  return v_album;
end; $$;
revoke all on function public.musiclub_resolve_pool_release(uuid,jsonb) from public,anon,authenticated;


create or replace function public.musiclub_can_read_room(p_room uuid)
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select exists(select 1 from public.pool_rooms r where r.id=p_room and
  (r.visibility='public' or r.owner_id=auth.uid() or
   exists(select 1 from public.pool_room_members m where m.room_id=r.id and m.user_id=auth.uid())));
$$;
create or replace function public.musiclub_manage_room(p_room uuid)
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select auth.uid() is not null and exists(select 1 from public.pool_rooms r where r.id=p_room and (r.owner_id=auth.uid() or
  (public.musiclub_is_admin() and (r.visibility='public' or exists(select 1 from public.pool_room_members m where m.room_id=r.id and m.user_id=auth.uid())))));
$$;
create or replace function public.musiclub_read_pool_season(p_season text)
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select exists(select 1 from public.seasons s where s.id=p_season and public.musiclub_can_read_room(s.room_id));
$$;
create or replace function public.musiclub_participate_pool_season(p_season text)
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select auth.uid() is not null and exists(select 1 from public.seasons s join public.pool_rooms r on r.id=s.room_id
  where s.id=p_season and (public.musiclub_manage_room(r.id) or exists(select 1 from public.pool_room_members m where m.room_id=r.id and m.user_id=auth.uid())));
$$;
revoke all on function public.musiclub_can_read_room(uuid),public.musiclub_manage_room(uuid),public.musiclub_read_pool_season(text),public.musiclub_participate_pool_season(text) from public;
grant execute on function public.musiclub_can_read_room(uuid),public.musiclub_manage_room(uuid),public.musiclub_read_pool_season(text),public.musiclub_participate_pool_season(text) to anon,authenticated;

alter table public.pool_rooms enable row level security;
alter table public.pool_room_members enable row level security;
alter table public.pool_room_invites enable row level security;
grant select on public.pool_rooms,public.pool_room_members to anon,authenticated;
revoke all on public.pool_room_invites from anon,authenticated;
drop policy if exists musiclub_rooms_read on public.pool_rooms;
create policy musiclub_rooms_read on public.pool_rooms for select using(public.musiclub_can_read_room(id));
drop policy if exists musiclub_room_members_read on public.pool_room_members;
create policy musiclub_room_members_read on public.pool_room_members for select using(user_id=auth.uid() or public.musiclub_manage_room(room_id));
-- No direct client writes: creation, joining and invitations go through checked RPCs.

drop policy if exists musiclub_seasons_read on public.seasons;
create policy musiclub_seasons_read on public.seasons for select to anon,authenticated using(public.musiclub_can_read_room(room_id));
drop policy if exists musiclub_seasons_room_read_guard on public.seasons;
create policy musiclub_seasons_room_read_guard on public.seasons as restrictive for select to public using(public.musiclub_can_read_room(room_id));
drop policy if exists musiclub_seasons_admin on public.seasons;
create policy musiclub_seasons_admin on public.seasons for all to authenticated using(public.musiclub_manage_room(room_id)) with check(public.musiclub_manage_room(room_id));
drop policy if exists musiclub_seasons_write_guard on public.seasons;
create policy musiclub_seasons_write_guard on public.seasons as restrictive for insert to public with check(public.musiclub_manage_room(room_id));
drop policy if exists musiclub_seasons_update_guard on public.seasons;
create policy musiclub_seasons_update_guard on public.seasons as restrictive for update to public using(public.musiclub_manage_room(room_id)) with check(public.musiclub_manage_room(room_id));
drop policy if exists musiclub_seasons_delete_guard on public.seasons;
create policy musiclub_seasons_delete_guard on public.seasons as restrictive for delete to public using(public.musiclub_manage_room(room_id));
drop policy if exists musiclub_entries_room_read_guard on public.pool_entries;
create policy musiclub_entries_room_read_guard on public.pool_entries as restrictive for select to public using(public.musiclub_read_pool_season(season_id));
drop policy if exists musiclub_entries_room_insert_guard on public.pool_entries;
create policy musiclub_entries_room_insert_guard on public.pool_entries as restrictive for insert to public with check(public.musiclub_participate_pool_season(season_id));
drop policy if exists musiclub_entries_room_update_guard on public.pool_entries;
create policy musiclub_entries_room_update_guard on public.pool_entries as restrictive for update to public
 using(exists(select 1 from public.seasons s where s.id=season_id and public.musiclub_manage_room(s.room_id)))
 with check(exists(select 1 from public.seasons s where s.id=season_id and public.musiclub_manage_room(s.room_id)));
drop policy if exists musiclub_entries_room_delete_guard on public.pool_entries;
create policy musiclub_entries_room_delete_guard on public.pool_entries as restrictive for delete to public using(public.musiclub_participate_pool_season(season_id));

-- Keep the existing public view's column order/types and its redaction of email.
do $$ declare cols text; begin
 select string_agg(case when column_name ~* 'email|password|token|secret' then format('null::text as %I',column_name)
  else format('p.%I',column_name) end,', ' order by ordinal_position) into cols
 from information_schema.columns where table_schema='public' and table_name='pool_entries';
 execute format('create or replace view public.public_pool_entries with (security_barrier=true) as select %s from public.pool_entries p where public.musiclub_read_pool_season(p.season_id)',cols);
end $$;
revoke all on public.public_pool_entries from anon,authenticated;
grant select on public.public_pool_entries to anon,authenticated;

create or replace function public.musiclub_create_pool_room(p_name text,p_description text default '',p_visibility text default 'public')
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_room uuid; begin
 if auth.uid() is null then raise exception 'Inicia sesión para crear una sala'; end if;
 if length(trim(coalesce(p_name,''))) not between 1 and 100 or length(coalesce(p_description,''))>600 or p_visibility not in ('public','private') or p_visibility is null then raise exception 'Revisa el nombre, descripción y privacidad de la sala'; end if;
 if (select count(*) from public.pool_rooms where owner_id=auth.uid())>=20 then raise exception 'Puedes administrar hasta 20 salas'; end if;
 insert into public.pool_rooms(name,description,visibility,owner_id) values(trim(p_name),coalesce(p_description,''),p_visibility,auth.uid()) returning id into v_room;
 insert into public.pool_room_members(room_id,user_id) values(v_room,auth.uid());
 insert into public.seasons(id,room_id,season_number,name,description,start_date,is_active,is_open)
 values('sala-'||v_room::text||'-1',v_room,1,'Primera escucha',coalesce(nullif(p_description,''),'Propón un lanzamiento y compártelo con tu sala.'),current_date,true,false);
 return v_room;
end $$;
create or replace function public.musiclub_join_pool_room(p_room uuid)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null then raise exception 'Inicia sesión para unirte a una sala'; end if;
 if not exists(select 1 from public.pool_rooms where id=p_room and visibility='public') then raise exception 'Para esta sala necesitas una invitación válida'; end if;
 insert into public.pool_room_members(room_id,user_id) values(p_room,auth.uid()) on conflict do nothing;
 return true;
end $$;
create or replace function public.musiclub_invite_pool_room(p_room uuid,p_revoke boolean default false)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_token uuid; begin
 if not public.musiclub_manage_room(p_room) then raise exception 'Solo quien administra la sala puede gestionar invitaciones'; end if;
 perform 1 from public.pool_rooms where id=p_room for update;
 update public.pool_room_invites set revoked=true where room_id=p_room;
 if not p_revoke then insert into public.pool_room_invites(room_id) values(p_room) returning token into v_token; end if;
 return v_token;
end $$;
create or replace function public.musiclub_redeem_pool_invite(p_token uuid)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_room uuid; begin
 if auth.uid() is null then raise exception 'Inicia sesión para aceptar la invitación'; end if;
 select room_id into v_room from public.pool_room_invites where token=p_token and not revoked and expires_at>now() for update;
 if not found then raise exception 'La invitación venció o fue revocada. Pide una nueva a quien administra la sala.'; end if;
 insert into public.pool_room_members(room_id,user_id) values(v_room,auth.uid()) on conflict do nothing;
 return v_room;
end $$;
create or replace function public.musiclub_leave_pool_room(p_room uuid)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null then raise exception 'Inicia sesión'; end if;
 if exists(select 1 from public.pool_rooms where id=p_room and owner_id=auth.uid()) then raise exception 'Quien administra la sala no puede abandonarla'; end if;
 delete from public.pool_room_members where room_id=p_room and user_id=auth.uid(); return true;
end $$;

-- Preserve the mature nomination/edit implementation, behind room access checks.
do $$ begin
 if to_regprocedure('public.musiclub_nominate_pool_release_internal(text,uuid,jsonb,text)') is null then
  alter function public.musiclub_nominate_pool_release(text,uuid,jsonb,text) rename to musiclub_nominate_pool_release_internal;
 end if;
 if to_regprocedure('public.musiclub_edit_pool_release_internal(text,uuid,uuid,jsonb,text)') is null then
  alter function public.musiclub_edit_pool_release(text,uuid,uuid,jsonb,text) rename to musiclub_edit_pool_release_internal;
 end if;
end $$;
revoke all on function public.musiclub_nominate_pool_release_internal(text,uuid,jsonb,text),public.musiclub_edit_pool_release_internal(text,uuid,uuid,jsonb,text) from public,anon,authenticated;
create or replace function public.musiclub_nominate_pool_release(p_season_id text,p_album_id uuid default null,p_album_data jsonb default '{}'::jsonb,p_note text default '')
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if not public.musiclub_participate_pool_season(p_season_id) then raise exception 'Únete a la sala para proponer un release'; end if;
 return public.musiclub_nominate_pool_release_internal(p_season_id,p_album_id,p_album_data,p_note);
end $$;
create or replace function public.musiclub_edit_pool_release(p_season_id text,p_entry_id uuid,p_album_id uuid default null,p_album_data jsonb default '{}'::jsonb,p_note text default '')
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if not public.musiclub_participate_pool_season(p_season_id) then raise exception 'Necesitas pertenecer a esta sala para editar tu cápsula'; end if;
 return public.musiclub_edit_pool_release_internal(p_season_id,p_entry_id,p_album_id,p_album_data,p_note);
end $$;

create or replace function public.musiclub_pool_action(p_season_id text,p_action text,p_album_id uuid default null,p_enabled boolean default null)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare v_room uuid; begin
 select room_id into v_room from public.seasons where id=p_season_id;
 if not public.musiclub_manage_room(v_room) then raise exception 'Solo quien administra esta sala puede controlar su Pool'; end if;
 perform 1 from public.seasons where id=p_season_id and is_active for update;
 if not found then raise exception 'Selecciona el Pool activo de esta sala'; end if;
 if p_action='proposals' then update public.seasons set is_open=coalesce(p_enabled,false) where id=p_season_id;
 elsif p_action='winner' then
  if exists(select 1 from public.pool_entries where season_id=p_season_id and status='GANADOR') then raise exception 'Gradúa el ganador actual antes de elegir otro'; end if;
  perform 1 from public.pool_entries where season_id=p_season_id and album_id=p_album_id and status='ACTIVO' for update;
  if not found then raise exception 'El release no es candidato de este Pool'; end if;
  update public.pool_entries set status='GANADOR',reviews_enabled=true where season_id=p_season_id and album_id=p_album_id;
  if v_room='00000000-0000-4000-8000-000000000000' then update public.albums set reviews_enabled=true where id=p_album_id; end if;
 elsif p_action in ('reviews','graduate') then
  perform 1 from public.pool_entries where season_id=p_season_id and album_id=p_album_id and status='GANADOR' for update;
  if not found then raise exception 'El release no es el ganador de este Pool'; end if;
  update public.pool_entries set reviews_enabled=(p_action='reviews' and coalesce(p_enabled,false)),status=case when p_action='graduate' then 'GRADUADO' else 'GANADOR' end where season_id=p_season_id and album_id=p_album_id;
  if v_room='00000000-0000-4000-8000-000000000000' then update public.albums set reviews_enabled=(p_action='reviews' and coalesce(p_enabled,false)) where id=p_album_id; end if;
 else raise exception 'Acción no válida'; end if;
 return true;
end $$;
create or replace function public.musiclub_activate_season(p_season_id text)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare v_room uuid; begin
 select room_id into v_room from public.seasons where id=p_season_id;
 if not public.musiclub_manage_room(v_room) then raise exception 'Solo quien administra esta sala puede cambiar su Pool'; end if;
 perform 1 from public.pool_rooms where id=v_room for update;
 if exists(select 1 from public.pool_entries p join public.seasons s on s.id=p.season_id where s.room_id=v_room and s.is_active and s.id<>p_season_id and p.status='GANADOR') then raise exception 'Gradúa el ganador de esta sala antes de cambiar de Pool'; end if;
 update public.seasons set is_active=false,is_open=false where room_id=v_room and id<>p_season_id;
 update public.seasons set is_active=true where room_id=v_room and id=p_season_id;
 return true;
end $$;
create or replace function public.musiclub_season_room_immutable()
returns trigger language plpgsql set search_path=public,pg_temp as $$
begin if new.room_id is distinct from old.room_id then raise exception 'No se puede trasladar una temporada a otra sala'; end if; return new; end $$;
drop trigger if exists musiclub_season_room_immutable on public.seasons;
create trigger musiclub_season_room_immutable before update of room_id on public.seasons for each row execute function public.musiclub_season_room_immutable();

-- The general catalog must not be closed by a proposal in another/private room.
create or replace function public.musiclub_can_review_album(p_album_id uuid)
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select exists(select 1 from public.albums a where a.id=p_album_id and coalesce(a.reviews_enabled,true)
 and public.musiclub_release_is_available(a.release_date)
 and (not exists(select 1 from public.pool_entries p join public.seasons s on s.id=p.season_id where p.album_id=a.id and s.room_id='00000000-0000-4000-8000-000000000000')
 or exists(select 1 from public.pool_entries p join public.seasons s on s.id=p.season_id where p.album_id=a.id and s.room_id='00000000-0000-4000-8000-000000000000' and s.is_active and p.status='GANADOR' and p.reviews_enabled)));
$$;

revoke all on function public.musiclub_create_pool_room(text,text,text),public.musiclub_join_pool_room(uuid),public.musiclub_invite_pool_room(uuid,boolean),public.musiclub_redeem_pool_invite(uuid),public.musiclub_leave_pool_room(uuid),public.musiclub_nominate_pool_release(text,uuid,jsonb,text),public.musiclub_edit_pool_release(text,uuid,uuid,jsonb,text),public.musiclub_pool_action(text,text,uuid,boolean),public.musiclub_activate_season(text) from public,anon;
grant execute on function public.musiclub_create_pool_room(text,text,text),public.musiclub_join_pool_room(uuid),public.musiclub_invite_pool_room(uuid,boolean),public.musiclub_redeem_pool_invite(uuid),public.musiclub_leave_pool_room(uuid),public.musiclub_nominate_pool_release(text,uuid,jsonb,text),public.musiclub_edit_pool_release(text,uuid,uuid,jsonb,text),public.musiclub_pool_action(text,text,uuid,boolean),public.musiclub_activate_season(text) to authenticated;
commit;
