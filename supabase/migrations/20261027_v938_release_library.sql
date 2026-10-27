-- Private, durable listening lists. Each member can read/write only their own rows.
begin;
create table if not exists public.user_release_preferences (
  user_id uuid not null references auth.users(id) on delete cascade,
  release_key text not null check (length(release_key) between 3 and 1200),
  release jsonb not null check (jsonb_typeof(release) = 'object' and octet_length(release::text) <= 12000),
  listen_later boolean not null default false,
  gashapon_dismissed boolean not null default false,
  saved_at timestamptz,
  dismissed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, release_key)
);
alter table public.user_release_preferences enable row level security;
revoke all on public.user_release_preferences from public, anon;
grant select, insert, update on public.user_release_preferences to authenticated;
drop policy if exists own_release_preferences on public.user_release_preferences;
create policy own_release_preferences on public.user_release_preferences
  for all to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Each action changes one flag atomically, preserving the other list.
create or replace function public.musiclub_set_release_preference(
  p_release_key text, p_release jsonb, p_action text, p_value boolean
) returns public.user_release_preferences
language plpgsql security invoker set search_path = '' as $$
declare saved public.user_release_preferences;
begin
  if auth.uid() is null then raise exception 'Inicia sesión para guardar tus preferencias'; end if;
  if p_action not in ('listen_later', 'gashapon_dismissed') or p_action is null or p_value is null then
    raise exception 'Acción no válida';
  end if;
  if length(trim(coalesce(p_release->>'album_name',''))) = 0 or
     length(trim(coalesce(p_release->>'artist_name',''))) = 0 then
    raise exception 'El release necesita un título y un artista';
  end if;
  insert into public.user_release_preferences(user_id, release_key, release, listen_later, gashapon_dismissed, saved_at, dismissed_at)
  values(auth.uid(), p_release_key, p_release,
    p_action = 'listen_later' and p_value, p_action = 'gashapon_dismissed' and p_value,
    case when p_action = 'listen_later' and p_value then now() end,
    case when p_action = 'gashapon_dismissed' and p_value then now() end)
  on conflict(user_id, release_key) do update set
    release = excluded.release,
    listen_later = case when p_action = 'listen_later' then p_value else user_release_preferences.listen_later end,
    gashapon_dismissed = case when p_action = 'gashapon_dismissed' then p_value else user_release_preferences.gashapon_dismissed end,
    saved_at = case when p_action = 'listen_later' and p_value then now() else user_release_preferences.saved_at end,
    dismissed_at = case when p_action = 'gashapon_dismissed' and p_value then now() else user_release_preferences.dismissed_at end,
    updated_at = now()
  returning * into saved;
  return saved;
end $$;
revoke all on function public.musiclub_set_release_preference(text,jsonb,text,boolean) from public, anon;
grant execute on function public.musiclub_set_release_preference(text,jsonb,text,boolean) to authenticated;
notify pgrst, 'reload schema';
commit;
