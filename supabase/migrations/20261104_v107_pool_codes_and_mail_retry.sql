begin;
alter table public.seasons add column if not exists public_code text;
create unique index if not exists musiclub_pool_public_code on public.seasons(public_code) where public_code is not null;
do $$ begin
  if not exists(select 1 from pg_constraint where conname='musiclub_pool_code_format') then
    alter table public.seasons add constraint musiclub_pool_code_format check(public_code is null or public_code ~ '^[A-Z0-9]{12}$');
  end if;
end $$;
create or replace function public.musiclub_generate_pool_code(p_season_id text) returns text
language plpgsql security definer set search_path=public,pg_temp as $$
declare s public.seasons; candidate text; n integer; alphabet constant text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
begin
  select * into s from public.seasons where id=p_season_id for update;
  if s.id is null or not public.musiclub_manage_room(s.room_id) then raise exception 'Solo quien administra esta sala puede generar su código'; end if;
  if s.public_code is not null then return s.public_code; end if;
  loop
    candidate:='';
    while length(candidate)<12 loop
      n:=get_byte(decode(replace(gen_random_uuid()::text,'-',''),'hex'),0);
      if n<252 then candidate:=candidate||substr(alphabet,(n%36)+1,1); end if;
    end loop;
    if candidate !~ '[A-Z]' or candidate !~ '[0-9]' then continue; end if;
    begin
      update public.seasons set public_code=candidate where id=s.id;
      return candidate;
    exception when unique_violation then null;
    end;
  end loop;
end $$;
revoke all on function public.musiclub_generate_pool_code(text) from public,anon;
grant execute on function public.musiclub_generate_pool_code(text) to authenticated;

alter table public.musiclub_notification_deliveries add column if not exists retry_count integer not null default 0;
alter table public.musiclub_notification_deliveries add column if not exists last_failed_at timestamptz;
create or replace function public.musiclub_claim_notification_retry(p_key text) returns boolean
language plpgsql security definer set search_path='' as $$
begin
  if not public.musiclub_is_admin() and coalesce(auth.jwt()->>'role','')<>'service_role' then raise exception 'Solo administración puede reintentar estos avisos'; end if;
  if p_key not like 'pool-winner:%' and p_key not like 'pool-graduated:%' then raise exception 'Aviso no permitido'; end if;
  update public.musiclub_notification_deliveries set status='processing',owner_id=auth.uid(),retry_count=retry_count+1,last_failed_at=completed_at,completed_at=null
    where delivery_key=p_key and status='failed';
  return found;
end $$;
revoke all on function public.musiclub_claim_notification_retry(text) from public,anon;
grant execute on function public.musiclub_claim_notification_retry(text) to authenticated,service_role;
commit;
