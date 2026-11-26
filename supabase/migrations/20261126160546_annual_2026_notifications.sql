create table if not exists public.annual_subscriptions (
 year smallint not null check (year between 2026 and 2100),
 user_id uuid not null references auth.users(id) on delete cascade,
 email text not null,
 enabled boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 confirmation_sent_at timestamptz,
 launch_sent_at timestamptz,
 primary key(year,user_id)
);
alter table public.annual_subscriptions enable row level security;
revoke all on public.annual_subscriptions from anon, authenticated;
grant select on public.annual_subscriptions to authenticated;
grant insert(year,user_id,email,enabled) on public.annual_subscriptions to authenticated;
grant update(email,enabled,updated_at) on public.annual_subscriptions to authenticated;
grant all on public.annual_subscriptions to service_role;
create policy annual_own_read on public.annual_subscriptions for select to authenticated using (user_id=(select auth.uid()));
create policy annual_own_insert on public.annual_subscriptions for insert to authenticated with check (user_id=(select auth.uid()) and email=lower((select auth.jwt())->>'email'));
create policy annual_own_update on public.annual_subscriptions for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()) and email=lower((select auth.jwt())->>'email'));
create index annual_subscriptions_user_idx on public.annual_subscriptions(user_id);
create index annual_subscriptions_pending_launch_idx on public.annual_subscriptions(year,user_id) where enabled and launch_sent_at is null;

create or replace function public.musiclub_annual_subscribe(p_year integer,p_enabled boolean)
returns void language plpgsql security invoker set search_path='' as $$
declare v_user uuid:=auth.uid(); v_email text:=lower(auth.jwt()->>'email');
begin
 if v_user is null or v_email is null or p_year<>2026 or p_enabled is null then raise exception 'Solicitud no permitida' using errcode='42501'; end if;
 insert into public.annual_subscriptions(year,user_id,email,enabled) values(p_year,v_user,v_email,p_enabled)
 on conflict(year,user_id) do update set enabled=excluded.enabled,email=excluded.email,updated_at=now();
end; $$;
revoke all on function public.musiclub_annual_subscribe(integer,boolean) from public,anon;
grant execute on function public.musiclub_annual_subscribe(integer,boolean) to authenticated;

-- Delivery is deliberately paused. Preparing or subscribing never approves mail.
create table if not exists public.annual_mail_campaigns (
 year smallint not null,
 phase text not null check (phase in ('announcement','confirmation','launch')),
 scheduled_at timestamptz,
 approved_at timestamptz,
 paused boolean not null default true,
 primary key(year,phase)
);
alter table public.annual_mail_campaigns enable row level security;
revoke all on public.annual_mail_campaigns from anon,authenticated;
grant all on public.annual_mail_campaigns to service_role;
insert into public.annual_mail_campaigns(year,phase,scheduled_at) values
 (2026,'announcement',null),(2026,'confirmation',null),(2026,'launch','2026-12-28 18:00:00+00')
on conflict(year,phase) do nothing;
