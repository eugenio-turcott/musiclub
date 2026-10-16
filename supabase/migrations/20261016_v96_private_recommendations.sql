-- Resolve member contact information on the database server, never in the public member directory.
begin;
create or replace function public.musiclub_send_song_recommendation(payload jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare sender public.profiles; recipient public.profiles; saved_id uuid;
begin
  if auth.uid() is null then raise exception 'Inicia sesión para recomendar una canción'; end if;
  select * into sender from public.profiles where id=auth.uid();
  select * into recipient from public.profiles where id=(payload->>'recipientId')::uuid;
  if sender.id is null or recipient.id is null then raise exception 'Miembro no disponible'; end if;
  if length(trim(coalesce(payload->>'songTitle',''))) not between 1 and 300
    or length(trim(coalesce(payload->>'artistName',''))) not between 1 and 300
    or length(coalesce(payload->>'message','')) > 2000 then raise exception 'Recomendación no válida'; end if;
  if (select count(*) from public.song_recommendations where sender_id=auth.uid() and created_at>now()-interval '1 minute')>=5
    then raise exception 'Espera antes de enviar otra recomendación'; end if;
  insert into public.song_recommendations(sender_id,sender_name,sender_email,recipient_id,recipient_name,recipient_email,
    song_title,artist_name,album_name,image_url,spotify_link,youtube_link,apple_music_link,message,is_read)
  values(sender.id,sender.name,sender.email,recipient.id,recipient.name,recipient.email,
    trim(payload->>'songTitle'),trim(payload->>'artistName'),left(payload->>'albumName',300),
    left(payload->>'imageUrl',2000),left(payload->>'spotifyLink',2000),left(payload->>'youtubeLink',2000),
    left(payload->>'appleMusicLink',2000),payload->>'message',false) returning id into saved_id;
  return jsonb_build_object('id',saved_id);
end $$;
revoke all on function public.musiclub_send_song_recommendation(jsonb) from public, anon;
grant execute on function public.musiclub_send_song_recommendation(jsonb) to authenticated;
drop policy if exists musiclub_v96_insert_guard on public.song_recommendations;
create policy musiclub_v96_insert_guard on public.song_recommendations as restrictive for insert to public
  with check (public.musiclub_is_admin());
commit;
