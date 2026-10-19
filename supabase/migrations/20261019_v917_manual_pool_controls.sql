-- Manual Pool controls, season isolation and database-enforced review closure.
-- Does not open a Pool or change existing proposals/reviews.
begin;
alter table public.seasons add column if not exists is_open boolean not null default false;
alter table public.seasons enable row level security;
drop policy if exists musiclub_seasons_read on public.seasons;
create policy musiclub_seasons_read on public.seasons for select to anon, authenticated using (true);
drop policy if exists musiclub_seasons_admin on public.seasons;
create policy musiclub_seasons_admin on public.seasons for all to authenticated using (public.musiclub_is_admin()) with check (public.musiclub_is_admin());
drop policy if exists musiclub_seasons_write_guard on public.seasons;
create policy musiclub_seasons_write_guard on public.seasons as restrictive for insert to public with check (public.musiclub_is_admin());
drop policy if exists musiclub_seasons_update_guard on public.seasons;
create policy musiclub_seasons_update_guard on public.seasons as restrictive for update to public using (public.musiclub_is_admin()) with check (public.musiclub_is_admin());
drop policy if exists musiclub_seasons_delete_guard on public.seasons;
create policy musiclub_seasons_delete_guard on public.seasons as restrictive for delete to public using (public.musiclub_is_admin());

create or replace function public.musiclub_pool_proposals_open(p_season_id text)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists(select 1 from public.seasons where id=p_season_id and is_active and is_open);
$$;
create or replace function public.musiclub_release_is_available(p_date text)
returns boolean language plpgsql stable set search_path = public, pg_temp as $$
declare v_date date;
begin
  if p_date is null or trim(p_date)='' then return true; end if;
  if p_date ~ '^\d{4}$' then v_date := make_date(p_date::integer,1,1);
  elsif p_date ~ '^\d{4}-\d{2}$' then v_date := make_date(left(p_date,4)::integer,right(p_date,2)::integer,1);
  elsif p_date ~ '^\d{4}-\d{2}-\d{2}' then v_date := left(p_date,10)::date;
  else return false; end if;
  return v_date <= (now() at time zone 'America/Mexico_City')::date;
exception when others then return false;
end; $$;
revoke all on function public.musiclub_release_is_available(text) from public;
grant execute on function public.musiclub_release_is_available(text) to anon, authenticated;
create or replace function public.musiclub_can_review_album(p_album_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists(select 1 from public.albums a where a.id=p_album_id
    and coalesce(a.reviews_enabled,true)
    and public.musiclub_release_is_available(a.release_date)
    and (not exists(select 1 from public.pool_entries p where p.album_id=a.id)
      or exists(select 1 from public.pool_entries p join public.seasons s on s.id=p.season_id where p.album_id=a.id and s.is_active and p.status='GANADOR' and p.reviews_enabled)));
$$;
revoke all on function public.musiclub_pool_proposals_open(text), public.musiclub_can_review_album(uuid) from public;
grant execute on function public.musiclub_pool_proposals_open(text), public.musiclub_can_review_album(uuid) to anon, authenticated;
drop policy if exists musiclub_pool_open_insert on public.pool_entries;
create policy musiclub_pool_open_insert on public.pool_entries as restrictive for insert to authenticated with check (public.musiclub_pool_proposals_open(season_id));
drop policy if exists musiclub_reviews_open_insert on public.reviews;
create policy musiclub_reviews_open_insert on public.reviews as restrictive for insert to authenticated with check (public.musiclub_can_review_album(album_id));
drop policy if exists musiclub_reviews_open_update on public.reviews;
create policy musiclub_reviews_open_update on public.reviews as restrictive for update to authenticated using (public.musiclub_can_review_album(album_id)) with check (public.musiclub_can_review_album(album_id));

-- A single transaction avoids abandoned album records when the Pool closes.
create or replace function public.musiclub_nominate_pool_release(p_season_id text, p_album_id uuid default null, p_album_data jsonb default '{}'::jsonb, p_note text default '')
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_album uuid := p_album_id; v_entry uuid; v_genres text[]; v_date date; v_name text; v_artist text; v_mbid public.albums.mbid%type;
begin
  if auth.uid() is null then raise exception 'Inicia sesión para proponer un release'; end if;
  perform 1 from public.seasons where id=p_season_id and is_active and is_open for update;
  if not found then raise exception 'Las propuestas de este Pool están cerradas'; end if;
  if length(coalesce(p_note,'')) > 600 then raise exception 'La nota admite hasta 600 caracteres'; end if;
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
      insert into public.albums(album_name,artist_name,image_url,release_type,release_date,release_year,genres,tracks,spotify_link,youtube_link,apple_music_link,other_link,reviews_enabled,status,mbid)
      values(v_name,v_artist,p_album_data->>'imageUrl',coalesce(nullif(p_album_data->>'releaseType',''),'ALBUM'),v_date,extract(year from v_date)::integer,v_genres,
        case when jsonb_typeof(p_album_data->'tracks')='array' then p_album_data->'tracks' else '[]'::jsonb end,
        p_album_data->>'spotifyLink',p_album_data->>'youtubeLink',p_album_data->>'appleMusicLink',p_album_data->>'otherLink',false,'ACTIVO',v_mbid) returning id into v_album;
    end if;
  end if;
  if not exists(select 1 from public.albums where id=v_album and public.musiclub_release_is_available(release_date)) then raise exception 'El release no está disponible'; end if;
  if exists(select 1 from public.pool_entries where season_id=p_season_id and album_id=v_album) then raise exception 'Este release ya fue propuesto en este Pool'; end if;
  insert into public.pool_entries(season_id,album_id,nominated_by,nominated_by_email,user_id,note,status,reviews_enabled)
  values(p_season_id,v_album,coalesce(auth.jwt()->'user_metadata'->>'full_name',auth.jwt()->'user_metadata'->>'name','Miembro'),auth.jwt()->>'email',auth.uid(),p_note,'ACTIVO',false) returning id into v_entry;
  return jsonb_build_object('success',true,'albumId',v_album,'entryId',v_entry);
end; $$;

create or replace function public.musiclub_pool_action(p_season_id text, p_action text, p_album_id uuid default null, p_enabled boolean default null)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.musiclub_is_admin() then raise exception 'Solo el administrador puede controlar el Pool'; end if;
  perform 1 from public.seasons where id=p_season_id and is_active for update;
  if not found then raise exception 'Selecciona el Pool activo'; end if;
  if p_action='proposals' then
    update public.seasons set is_open=coalesce(p_enabled,false) where id=p_season_id;
  elsif p_action='winner' then
    if exists(select 1 from public.pool_entries where season_id=p_season_id and status='GANADOR') then raise exception 'Gradúa el ganador actual antes de elegir otro'; end if;
    perform 1 from public.pool_entries where season_id=p_season_id and album_id=p_album_id and status='ACTIVO' for update;
    if not found then raise exception 'El release no es candidato de este Pool'; end if;
    update public.pool_entries set status='GANADOR',reviews_enabled=true where season_id=p_season_id and album_id=p_album_id;
    update public.albums set reviews_enabled=true where id=p_album_id;
  elsif p_action in ('reviews','graduate') then
    perform 1 from public.pool_entries where season_id=p_season_id and album_id=p_album_id and status='GANADOR' for update;
    if not found then raise exception 'El release no es el ganador de este Pool'; end if;
    update public.pool_entries set reviews_enabled=(p_action='reviews' and coalesce(p_enabled,false)),status=case when p_action='graduate' then 'GRADUADO' else 'GANADOR' end where season_id=p_season_id and album_id=p_album_id;
    update public.albums set reviews_enabled=(p_action='reviews' and coalesce(p_enabled,false)) where id=p_album_id;
  else raise exception 'Acción no válida'; end if;
  return true;
end; $$;
create or replace function public.musiclub_activate_season(p_season_id text)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.musiclub_is_admin() then raise exception 'Solo el administrador puede cambiar el Pool'; end if;
  lock table public.seasons in share row exclusive mode;
  if not exists(select 1 from public.seasons where id=p_season_id) then raise exception 'El Pool no existe'; end if;
  if exists(select 1 from public.pool_entries p join public.seasons s on s.id=p.season_id where s.is_active and s.id<>p_season_id and p.status='GANADOR') then raise exception 'Gradúa el ganador antes de cambiar de Pool'; end if;
  update public.seasons set is_active=false,is_open=false where id<>p_season_id;
  update public.seasons set is_active=true where id=p_season_id;
  return true;
end; $$;
revoke all on function public.musiclub_nominate_pool_release(text,uuid,jsonb,text), public.musiclub_pool_action(text,text,uuid,boolean), public.musiclub_activate_season(text) from public, anon;
grant execute on function public.musiclub_nominate_pool_release(text,uuid,jsonb,text), public.musiclub_pool_action(text,text,uuid,boolean), public.musiclub_activate_season(text) to authenticated;
commit;
