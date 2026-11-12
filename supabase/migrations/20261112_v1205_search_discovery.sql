begin;
alter table public.albums add column public_content_updated_at timestamptz;
-- Real content dates for existing releases; no fabricated modification dates.
update public.albums a set public_content_updated_at=greatest(a.created_at,r.last_review)
from (select album_id,max(created_at) last_review from public.reviews group by album_id) r where r.album_id=a.id;

create table public.musiclub_search_discovery (
 album_id uuid primary key references public.albums(id) on delete cascade,
 revision bigint not null default 1, verified_revision bigint not null default 0,
 status text not null default 'pending' check(status in ('pending','processing','retry','verified','attention')),
 attempts integer not null default 0, requested_at timestamptz not null default now(),
 changed_at timestamptz not null, next_attempt_at timestamptz not null default now(),
 lease_token uuid, locked_until timestamptz, verified_at timestamptz,
 public_url text, sitemap_url text, result_kind text check(result_kind in ('listed','excluded')),
 last_error text
);
create index musiclub_search_discovery_due on public.musiclub_search_discovery(status,next_attempt_at);
alter table public.musiclub_search_discovery enable row level security;
revoke all on public.musiclub_search_discovery from public,anon,authenticated;
grant select,insert,update on public.musiclub_search_discovery to service_role;

create function public.musiclub_queue_release_discovery(p_album uuid,p_changed timestamptz default clock_timestamp()) returns void
language plpgsql security definer set search_path='' as $$
declare v_changed timestamptz;
begin
 update public.albums set public_content_updated_at=greatest(coalesce(public_content_updated_at,created_at,p_changed),p_changed)
 where id=p_album returning public_content_updated_at into v_changed;
 if not found then return;end if;
 insert into public.musiclub_search_discovery(album_id,changed_at) values(p_album,v_changed)
 on conflict(album_id) do update set revision=musiclub_search_discovery.revision+1,changed_at=excluded.changed_at,
 requested_at=clock_timestamp(),next_attempt_at=clock_timestamp(),attempts=0,last_error=null,
 status=case when musiclub_search_discovery.status='processing' then 'processing' else 'pending' end;
end $$;
revoke all on function public.musiclub_queue_release_discovery(uuid,timestamptz) from public,anon,authenticated;
grant execute on function public.musiclub_queue_release_discovery(uuid,timestamptz) to service_role;

create function public.musiclub_review_discovery_trigger() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if tg_op='UPDATE' and new is not distinct from old then return new;end if;
 if tg_op='DELETE' then perform public.musiclub_queue_release_discovery(old.album_id);return old;end if;
 if tg_op='UPDATE' and old.album_id is distinct from new.album_id then perform public.musiclub_queue_release_discovery(old.album_id);end if;
 perform public.musiclub_queue_release_discovery(new.album_id);return new;
end $$;
revoke all on function public.musiclub_review_discovery_trigger() from public,anon,authenticated;
create trigger musiclub_review_discovery after insert or update or delete on public.reviews for each row execute function public.musiclub_review_discovery_trigger();

create function public.musiclub_album_discovery_trigger() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new is distinct from old and exists(select 1 from public.reviews where album_id=new.id) then
  perform public.musiclub_queue_release_discovery(new.id);
 end if;
 return new;
end $$;
revoke all on function public.musiclub_album_discovery_trigger() from public,anon,authenticated;
create trigger musiclub_album_discovery after update of album_name,artist_name,release_type,genres,tracks,image_url,release_year,release_date on public.albums
 for each row execute function public.musiclub_album_discovery_trigger();

create function public.musiclub_claim_search_discovery(p_limit integer default 5) returns setof public.musiclub_search_discovery
language plpgsql security definer set search_path='' as $$
begin
 update public.musiclub_search_discovery set status='attention',lease_token=null,locked_until=null,last_error='verification_interrupted'
 where status='processing' and locked_until<now() and attempts>=8;
 return query with due as (
  select album_id from public.musiclub_search_discovery
  where ((status in ('pending','retry') and next_attempt_at<=now()) or (status='processing' and locked_until<now())) and attempts<8
  order by requested_at for update skip locked limit greatest(1,least(coalesce(p_limit,5),10))
 ) update public.musiclub_search_discovery q set status='processing',attempts=q.attempts+1,
 lease_token=gen_random_uuid(),locked_until=now()+interval '5 minutes'
 from due where q.album_id=due.album_id returning q.*;
end $$;
revoke all on function public.musiclub_claim_search_discovery(integer) from public,anon,authenticated;
grant execute on function public.musiclub_claim_search_discovery(integer) to service_role;

create function public.musiclub_complete_search_discovery(p_album uuid,p_revision bigint,p_lease uuid,p_ok boolean,p_url text default null,p_kind text default null,p_error text default null) returns boolean
language plpgsql security definer set search_path='' as $$
declare q public.musiclub_search_discovery;
begin
 select * into q from public.musiclub_search_discovery where album_id=p_album for update;
 if not found or q.status<>'processing' or q.lease_token is distinct from p_lease then return false;end if;
 if q.revision<>p_revision then
  update public.musiclub_search_discovery set status='pending',next_attempt_at=now(),lease_token=null,locked_until=null where album_id=p_album;return false;
 end if;
 if p_ok and (p_url is null or p_url !~ '^https://www[.]musiclub[.]org/(albumes|eps|sencillos|compilaciones|remixes)/[^?#]+$' or p_kind is null or p_kind not in ('listed','excluded')) then raise exception 'Invalid verified release';end if;
 update public.musiclub_search_discovery set status=case when p_ok then 'verified' when q.attempts>=8 then 'attention' else 'retry' end,
 verified_revision=case when p_ok then p_revision else verified_revision end,
 verified_at=case when p_ok then now() else verified_at end,
 public_url=case when p_ok then p_url else public_url end,
 sitemap_url=case when p_ok then 'https://www.musiclub.org/sitemap-reviews.xml' else sitemap_url end,
 result_kind=case when p_ok then p_kind else result_kind end,
 last_error=case when p_ok then null else left(coalesce(p_error,'verification_failed'),100) end,
 next_attempt_at=now()+make_interval(secs=>least(86400,300*power(3,least(q.attempts-1,6))::integer)),
 lease_token=null,locked_until=null where album_id=p_album;
 return p_ok;
end $$;
revoke all on function public.musiclub_complete_search_discovery(uuid,bigint,uuid,boolean,text,text,text) from public,anon,authenticated;
grant execute on function public.musiclub_complete_search_discovery(uuid,bigint,uuid,boolean,text,text,text) to service_role;

create function public.musiclub_retry_search_discovery() returns integer
language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 update public.musiclub_search_discovery set status='pending',attempts=0,next_attempt_at=now(),last_error=null
 where status in ('retry','attention');get diagnostics n=row_count;return n;
end $$;
revoke all on function public.musiclub_retry_search_discovery() from public,anon,authenticated;
grant execute on function public.musiclub_retry_search_discovery() to service_role;

create function public.musiclub_search_discovery_status() returns jsonb
language sql security definer set search_path='' as $$
 select jsonb_build_object('summary',(select jsonb_build_object(
 'pending',count(*) filter(where status in ('pending','processing','retry')),
 'verified',count(*) filter(where status='verified'),'attention',count(*) filter(where status='attention')) from public.musiclub_search_discovery),
 'entries',coalesce((select jsonb_agg(to_jsonb(t)) from (
 select q.album_id,q.status,q.attempts,q.requested_at,q.verified_at,q.public_url,q.sitemap_url,q.result_kind,q.last_error,q.next_attempt_at,
 a.album_name,a.artist_name from public.musiclub_search_discovery q join public.albums a on a.id=q.album_id
 order by case when q.status='attention' then 0 when q.status<>'verified' then 1 else 2 end,q.requested_at desc limit 40
 ) t),'[]'::jsonb));
$$;
revoke all on function public.musiclub_search_discovery_status() from public,anon,authenticated;
grant execute on function public.musiclub_search_discovery_status() to service_role;

-- Start with five existing recent releases, without creating or changing any reviews.
select public.musiclub_queue_release_discovery(album_id,last_review) from (
 select album_id,max(created_at) last_review from public.reviews group by album_id order by max(created_at) desc limit 5
) recent;
notify pgrst,'reload schema';
commit;
