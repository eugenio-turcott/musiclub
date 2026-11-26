-- Use the sole recording's score for every one-track format, including old clients.
-- Invoker privileges preserve album visibility and existing review RLS policies.
create or replace function public.musiclub_single_track_review()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  song jsonb;
  declared integer;
  stored_tracks jsonb;
  raw_score text;
  score integer;
  song_key text;
begin
  select a.tracks::jsonb, a.total_tracks into stored_tracks, declared
  from public.albums a where a.id = new.album_id;
  if jsonb_typeof(stored_tracks) is distinct from 'array' then return new; end if;
  if jsonb_array_length(stored_tracks) <> 1 or coalesce(declared,1) <> 1 then return new; end if;
  song := stored_tracks->0;
  song_key := coalesce(nullif(song->>'id',''),nullif(song->>'spotify_id',''),nullif(song->>'name',''),nullif(song->>'track_name',''),nullif(song#>>'{}',''),'1');
  select v.value into raw_score from jsonb_each_text(coalesce(new.track_ratings,'{}'::jsonb)) v
  where v.key = any(array[song->>'id',song->>'spotify_id',song->>'name',song->>'track_name',song#>>'{}','1','0'])
     or v.key in (select jsonb_array_elements_text(case when jsonb_typeof(song->'id_aliases')='array' then song->'id_aliases' else '[]'::jsonb end))
  order by case when v.key=song_key then 0 when v.key='1' then 2 when v.key='0' then 3 else 1 end limit 1;
  if raw_score is null then raw_score := new.rating_general::text; end if;
  if raw_score is null or raw_score !~ '^([1-9]|10)(\.0+)?$' then
    raise exception 'Califica la canción entre 1 y 10.' using errcode='23514';
  end if;
  score := raw_score::numeric::integer;
  new.track_ratings := jsonb_build_object(song_key,score);
  new.rating_general := score;
  new.rating_produccion := null; new.rating_composicion := null; new.rating_letras := null;
  new.rating_originalidad := null; new.rating_cohesion := null; new.rating_replay := null;
  return new;
end;
$$;
revoke all on function public.musiclub_single_track_review() from public, anon, authenticated;
drop trigger if exists musiclub_single_track_review on public.reviews;
create trigger musiclub_single_track_review before insert or update of album_id,track_ratings,rating_general,rating_produccion,rating_composicion,rating_letras,rating_originalidad,rating_cohesion,rating_replay
on public.reviews for each row execute function public.musiclub_single_track_review();

-- Apply the same rule to existing one-track reviews. No individual review
-- payload is exported; validation uses aggregate counts only.
update public.reviews r set rating_general=r.rating_general
from public.albums a
where a.id=r.album_id
  and jsonb_typeof(a.tracks::jsonb)='array'
  and jsonb_array_length(a.tracks::jsonb)=1
  and coalesce(a.total_tracks,1)=1;
