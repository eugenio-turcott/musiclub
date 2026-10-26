-- Review scheduling is informational. Opening reviews remains a manual room action.
begin;
alter table public.pool_entries add column if not exists review_scheduled_for date;
alter table public.pool_entries add column if not exists review_policy_version integer not null default 1;
create table if not exists public.pool_review_confirmations (
 user_id uuid not null, entry_id uuid not null references public.pool_entries(id) on delete cascade,
 policy_version integer not null, confirmed_at timestamptz not null default now(),
 primary key(user_id,entry_id)
);
alter table public.pool_review_confirmations enable row level security;
revoke all on public.pool_review_confirmations from anon,authenticated;
grant select on public.pool_review_confirmations to authenticated;
drop policy if exists musiclub_review_confirmation_own on public.pool_review_confirmations;
create policy musiclub_review_confirmation_own on public.pool_review_confirmations for select to authenticated using(user_id=auth.uid());

create or replace function public.musiclub_review_policy_changed()
returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 if (new.status,new.reviews_enabled,new.review_scheduled_for,new.album_id) is distinct from
    (old.status,old.reviews_enabled,old.review_scheduled_for,old.album_id) then
  new.review_policy_version:=old.review_policy_version+1;
 else new.review_policy_version:=old.review_policy_version; end if;
 return new;
end $$;
drop trigger if exists musiclub_review_policy_changed on public.pool_entries;
create trigger musiclub_review_policy_changed before update on public.pool_entries for each row execute function public.musiclub_review_policy_changed();

-- Only the caller's own active rooms are returned; private room data never leaks.
create or replace function public.musiclub_my_review_pools(p_album_id uuid)
returns table(entry_id uuid,room_id uuid,room_name text,pool_name text,status text,reviews_enabled boolean,review_scheduled_for date,version integer,blocked boolean,confirmed boolean)
language sql stable security definer set search_path=public,pg_temp as $$
 select p.id,r.id,r.name,coalesce(nullif(s.appearance->>'heading',''),s.name),p.status,coalesce(p.reviews_enabled,false),p.review_scheduled_for,p.review_policy_version,
 p.status='ACTIVO' or not coalesce(p.reviews_enabled,false),
 exists(select 1 from public.pool_review_confirmations c where c.entry_id=p.id and c.user_id=auth.uid() and c.policy_version=p.review_policy_version)
 from public.pool_entries p join public.seasons s on s.id=p.season_id join public.pool_rooms r on r.id=s.room_id
 where p.album_id=p_album_id and s.is_active and p.status in ('ACTIVO','GANADOR') and auth.uid() is not null
 and (r.owner_id=auth.uid() or exists(select 1 from public.pool_room_members m where m.room_id=r.id and m.user_id=auth.uid()));
$$;
revoke all on function public.musiclub_my_review_pools(uuid) from public,anon,authenticated;

create or replace function public.musiclub_can_review_album(p_album_id uuid)
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select exists(select 1 from public.albums a where a.id=p_album_id and coalesce(a.reviews_enabled,true)
 and public.musiclub_release_is_available(a.release_date))
 and not exists(select 1 from public.musiclub_my_review_pools(p_album_id) p where p.blocked and not p.confirmed);
$$;
create or replace function public.musiclub_review_context(p_album_id uuid)
returns jsonb language sql stable security definer set search_path=public,pg_temp as $$
 select jsonb_build_object('catalog_allowed',exists(select 1 from public.albums a where a.id=p_album_id and coalesce(a.reviews_enabled,true) and public.musiclub_release_is_available(a.release_date)),
 'allowed',public.musiclub_can_review_album(p_album_id),
 'requires_confirmation',exists(select 1 from public.musiclub_my_review_pools(p_album_id) p where p.blocked),
 'pools',coalesce((select jsonb_agg(to_jsonb(p) order by p.entry_id) from public.musiclub_my_review_pools(p_album_id) p),'[]'::jsonb));
$$;
create or replace function public.musiclub_confirm_pool_review(p_album_id uuid,p_expected jsonb)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_expected jsonb; v_current jsonb;
begin
 if auth.uid() is null then raise exception 'Inicia sesión para confirmar tu reseña'; end if;
 -- Serialize against room actions and policy edits while validating the version shown.
 perform 1 from public.seasons s where s.is_active and exists(select 1 from public.pool_entries p where p.season_id=s.id and p.album_id=p_album_id) order by s.id for update;
 perform 1 from public.pool_entries p where p.album_id=p_album_id order by p.id for update;
 select coalesce(jsonb_agg(jsonb_build_object('entry_id',p.entry_id,'version',p.version) order by p.entry_id),'[]'::jsonb) into v_current from public.musiclub_my_review_pools(p_album_id) p where p.blocked;
 select coalesce(jsonb_agg(jsonb_build_object('entry_id',(x->>'entry_id')::uuid,'version',(x->>'version')::integer) order by (x->>'entry_id')::uuid),'[]'::jsonb) into v_expected from jsonb_array_elements(p_expected) x;
 if v_current is distinct from v_expected then raise exception 'El Pool cambió. Revisa la fecha y confirma de nuevo.'; end if;
 if not exists(select 1 from public.albums a where a.id=p_album_id and coalesce(a.reviews_enabled,true) and public.musiclub_release_is_available(a.release_date)) then raise exception 'Este release no admite reseñas en este momento'; end if;
 insert into public.pool_review_confirmations(user_id,entry_id,policy_version)
 select auth.uid(),p.entry_id,p.version from public.musiclub_my_review_pools(p_album_id) p where p.blocked
 on conflict(user_id,entry_id) do update set policy_version=excluded.policy_version,confirmed_at=now();
 return public.musiclub_review_context(p_album_id);
end $$;

create or replace function public.musiclub_schedule_pool_reviews(p_season_id text,p_album_id uuid,p_date date default null)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare v_room uuid;
begin
 select room_id into v_room from public.seasons where id=p_season_id and is_active for update;
 if not found or not public.musiclub_manage_room(v_room) then raise exception 'Solo quien administra el Pool activo puede programar su fecha de reseña'; end if;
 update public.pool_entries set review_scheduled_for=p_date where season_id=p_season_id and album_id=p_album_id and status='GANADOR';
 if not found then raise exception 'El release ya no es el ganador de este Pool'; end if;
 return true;
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
  update public.pool_entries set status='GANADOR',reviews_enabled=false where season_id=p_season_id and album_id=p_album_id;
 elsif p_action in ('reviews','graduate') then
  perform 1 from public.pool_entries where season_id=p_season_id and album_id=p_album_id and status='GANADOR' for update;
  if not found then raise exception 'El release no es el ganador de este Pool'; end if;
  update public.pool_entries set reviews_enabled=(p_action='reviews' and coalesce(p_enabled,false)),status=case when p_action='graduate' then 'GRADUADO' else 'GANADOR' end where season_id=p_season_id and album_id=p_album_id;
 else raise exception 'Acción no válida'; end if;
 return true;
end $$;
-- Remove the old coupling between the original Pool and the entire public catalog.
update public.albums a set reviews_enabled=true where a.reviews_enabled=false and exists
 (select 1 from public.pool_entries p join public.seasons s on s.id=p.season_id where p.album_id=a.id and s.room_id='00000000-0000-4000-8000-000000000000');
-- This winner was automatically opened by the old selection routine. Preserve its reviews.
update public.pool_entries p set reviews_enabled=false from public.seasons s,public.albums a
where p.season_id=s.id and p.album_id=a.id and s.is_active and s.room_id='00000000-0000-4000-8000-000000000000'
and p.status='GANADOR' and a.album_name='Through The Wall' and a.artist_name='Rochelle Jordan';

do $$ declare cols text; begin
 select string_agg(case when column_name ~* 'email|password|token|secret' then format('null::text as %I',column_name) else format('p.%I',column_name) end,', ' order by ordinal_position) into cols
 from information_schema.columns where table_schema='public' and table_name='pool_entries';
 execute format('create or replace view public.public_pool_entries with (security_barrier=true) as select %s from public.pool_entries p where public.musiclub_read_pool_season(p.season_id)',cols);
end $$;
revoke all on function public.musiclub_review_context(uuid),public.musiclub_confirm_pool_review(uuid,jsonb),public.musiclub_schedule_pool_reviews(text,uuid,date) from public,anon,authenticated;
grant execute on function public.musiclub_review_context(uuid),public.musiclub_can_review_album(uuid) to anon,authenticated;
grant execute on function public.musiclub_confirm_pool_review(uuid,jsonb),public.musiclub_schedule_pool_reviews(text,uuid,date) to authenticated;
commit;
