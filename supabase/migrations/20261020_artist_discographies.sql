begin;
create table if not exists public.artist_discographies (
  slug text primary key check(length(slug) between 1 and 180),
  name text not null,
  profile jsonb not null default '{}'::jsonb check(jsonb_typeof(profile)='object'),
  providers jsonb not null default '{}'::jsonb,
  checked_at timestamptz,
  refresh_after timestamptz not null default now(),
  lease_until timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.artist_discographies enable row level security;
revoke all on public.artist_discographies from anon, authenticated;
grant select on public.artist_discographies to anon, authenticated;
grant all on public.artist_discographies to service_role;
create policy artist_discographies_public_read on public.artist_discographies for select to anon, authenticated using (true);
create or replace function public.musiclub_claim_artist_refresh(p_slug text,p_name text)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
begin
  insert into public.artist_discographies(slug,name,lease_until)
  values(p_slug,p_name,now()+interval '2 minutes')
  on conflict(slug) do update set lease_until=excluded.lease_until
    where artist_discographies.refresh_after<=now()
    and (artist_discographies.lease_until is null or artist_discographies.lease_until<now());
  return found;
end;
$$;
revoke all on function public.musiclub_claim_artist_refresh(text,text) from public,anon,authenticated;
grant execute on function public.musiclub_claim_artist_refresh(text,text) to service_role;
commit;
