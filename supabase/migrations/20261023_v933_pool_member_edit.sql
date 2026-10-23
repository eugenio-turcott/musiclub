-- Keep legacy history intact. Serialize all new ownership checks on the season row.
begin;
create or replace function public.musiclub_pool_member_guard()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if TG_OP='UPDATE' then
    if new.season_id is not distinct from old.season_id and new.user_id is not distinct from old.user_id then return new; end if;
  end if;
  new.user_id:=coalesce(new.user_id,auth.uid());
  if new.user_id is null then raise exception 'La cápsula debe pertenecer a un usuario'; end if;
  perform 1 from public.seasons where id=new.season_id for update;
  if new.user_id is not null and exists(select 1 from public.pool_entries where season_id=new.season_id and user_id=new.user_id and id is distinct from new.id) then
    raise exception 'Solo puedes proponer un release por temporada. Edita tu cápsula existente.';
  end if;
  return new;
end; $$;
drop trigger if exists musiclub_pool_member_guard on public.pool_entries;
create trigger musiclub_pool_member_guard before insert or update of season_id,user_id on public.pool_entries for each row execute function public.musiclub_pool_member_guard();

-- Internal helper cannot be invoked directly by visitors or authenticated clients.
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
        p_album_data->>'spotifyLink',p_album_data->>'youtubeLink',p_album_data->>'appleMusicLink',p_album_data->>'otherLink',false,v_mbid) returning id into v_album;
    end if;
  end if;
  if not exists(select 1 from public.albums where id=v_album and public.musiclub_release_is_available(release_date)) then raise exception 'El release no está disponible'; end if;
  return v_album;
end; $$;
revoke all on function public.musiclub_resolve_pool_release(uuid,jsonb) from public,anon,authenticated;

create or replace function public.musiclub_nominate_pool_release(p_season_id text,p_album_id uuid default null,p_album_data jsonb default '{}'::jsonb,p_note text default '')
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_album uuid; v_entry uuid;
begin
  if auth.uid() is null then raise exception 'Inicia sesión para proponer un release'; end if;
  perform 1 from public.seasons where id=p_season_id and is_active and is_open for update;
  if not found then raise exception 'Las propuestas de este Pool están cerradas'; end if;
  if exists(select 1 from public.pool_entries where season_id=p_season_id and user_id=auth.uid()) then
    raise exception 'Solo puedes proponer un release por temporada. Edita tu cápsula existente.';
  end if;
  if length(coalesce(p_note,''))>600 then raise exception 'La nota admite hasta 600 caracteres'; end if;
  v_album:=public.musiclub_resolve_pool_release(p_album_id,p_album_data);
  if exists(select 1 from public.pool_entries where season_id=p_season_id and album_id=v_album) then raise exception 'Este release ya fue propuesto en este Pool'; end if;
  insert into public.pool_entries(season_id,album_id,nominated_by,nominated_by_email,user_id,note,status,reviews_enabled)
  values(p_season_id,v_album,coalesce(auth.jwt()->'user_metadata'->>'full_name',auth.jwt()->'user_metadata'->>'name','Miembro'),auth.jwt()->>'email',auth.uid(),coalesce(p_note,''),'ACTIVO',false) returning id into v_entry;
  return jsonb_build_object('success',true,'albumId',v_album,'entryId',v_entry);
end; $$;

create or replace function public.musiclub_edit_pool_release(p_season_id text,p_entry_id uuid,p_album_id uuid default null,p_album_data jsonb default '{}'::jsonb,p_note text default '')
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_album uuid;
begin
  if auth.uid() is null then raise exception 'Inicia sesión para editar tu cápsula'; end if;
  -- Same lock order as nomination; editing does not consume capacity.
  perform 1 from public.seasons where id=p_season_id and is_active and is_open for update;
  if not found then raise exception 'Las propuestas de este Pool están cerradas'; end if;
  perform 1 from public.pool_entries where id=p_entry_id and season_id=p_season_id and user_id=auth.uid() and status='ACTIVO' for update;
  if not found then raise exception 'Solo puedes editar tu propia cápsula mientras esté en espera'; end if;
  if length(coalesce(p_note,''))>600 then raise exception 'La nota admite hasta 600 caracteres'; end if;
  v_album:=public.musiclub_resolve_pool_release(p_album_id,p_album_data);
  if exists(select 1 from public.pool_entries where season_id=p_season_id and album_id=v_album and id<>p_entry_id) then raise exception 'Este release ya fue propuesto en este Pool'; end if;
  update public.pool_entries set
    spotify_link=case when album_id=v_album then spotify_link else null end,
    youtube_link=case when album_id=v_album then youtube_link else null end,
    apple_music_link=case when album_id=v_album then apple_music_link else null end,
    other_link=case when album_id=v_album then other_link else null end,
    album_id=v_album,note=coalesce(p_note,'') where id=p_entry_id;
  return jsonb_build_object('success',true,'albumId',v_album,'entryId',p_entry_id);
end; $$;
revoke all on function public.musiclub_pool_member_guard() from public,anon,authenticated;
revoke all on function public.musiclub_nominate_pool_release(text,uuid,jsonb,text) from public,anon;
revoke all on function public.musiclub_edit_pool_release(text,uuid,uuid,jsonb,text) from public,anon;
grant execute on function public.musiclub_nominate_pool_release(text,uuid,jsonb,text) to authenticated;
grant execute on function public.musiclub_edit_pool_release(text,uuid,uuid,jsonb,text) to authenticated;
commit;
