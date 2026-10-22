-- Pool membership state belongs to pool_entries, never albums.
begin;
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
      insert into public.albums(album_name,artist_name,image_url,release_type,release_date,release_year,genres,tracks,spotify_link,youtube_link,apple_music_link,other_link,reviews_enabled,mbid)
      values(v_name,v_artist,p_album_data->>'imageUrl',coalesce(nullif(p_album_data->>'releaseType',''),'ALBUM'),v_date,extract(year from v_date)::integer,v_genres,
        case when jsonb_typeof(p_album_data->'tracks')='array' then p_album_data->'tracks' else '[]'::jsonb end,
        p_album_data->>'spotifyLink',p_album_data->>'youtubeLink',p_album_data->>'appleMusicLink',p_album_data->>'otherLink',false,v_mbid) returning id into v_album;
    end if;
  end if;
  if not exists(select 1 from public.albums where id=v_album and public.musiclub_release_is_available(release_date)) then raise exception 'El release no está disponible'; end if;
  if exists(select 1 from public.pool_entries where season_id=p_season_id and album_id=v_album) then raise exception 'Este release ya fue propuesto en este Pool'; end if;
  insert into public.pool_entries(season_id,album_id,nominated_by,nominated_by_email,user_id,note,status,reviews_enabled)
  values(p_season_id,v_album,coalesce(auth.jwt()->'user_metadata'->>'full_name',auth.jwt()->'user_metadata'->>'name','Miembro'),auth.jwt()->>'email',auth.uid(),p_note,'ACTIVO',false) returning id into v_entry;
  return jsonb_build_object('success',true,'albumId',v_album,'entryId',v_entry);
end; $$;


revoke all on function public.musiclub_nominate_pool_release(text,uuid,jsonb,text) from public,anon;
grant execute on function public.musiclub_nominate_pool_release(text,uuid,jsonb,text) to authenticated;
commit;
