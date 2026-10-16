begin;
create table if not exists public.musiclub_notification_deliveries (
  delivery_key text primary key check (length(delivery_key) between 5 and 240),
  owner_id uuid,
  status text not null default 'processing' check (status in ('processing','sent','failed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
alter table public.musiclub_notification_deliveries enable row level security;
revoke all on public.musiclub_notification_deliveries from anon, authenticated;

create or replace function public.musiclub_claim_notification(p_key text) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if length(p_key) not between 5 and 240 then raise exception 'Invalid delivery key'; end if;
  if coalesce(auth.jwt()->>'role','') <> 'service_role' and not public.musiclub_is_admin() then
    if auth.uid() is null then raise exception 'Authentication required'; end if;
    if not exists (select 1 from public.song_recommendations r
      where p_key='recommendation:'||r.id::text and r.sender_id=auth.uid())
      and not exists (select 1 from public.upcoming_notifications n
      where p_key='upcoming-confirmation:'||n.id::text and n.user_id=auth.uid()) then
      raise exception 'Delivery not allowed';
    end if;
  end if;
  insert into public.musiclub_notification_deliveries(delivery_key, owner_id)
    values(p_key, auth.uid()) on conflict do nothing;
  return found;
end $$;

create or replace function public.musiclub_complete_notification(p_key text, p_sent boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.musiclub_notification_deliveries set status=case when p_sent then 'sent' else 'failed' end, completed_at=now()
    where delivery_key=p_key and status='processing' and
      (owner_id=auth.uid() or public.musiclub_is_admin() or auth.jwt()->>'role'='service_role');
end $$;
revoke all on function public.musiclub_claim_notification(text) from public, anon;
revoke all on function public.musiclub_complete_notification(text,boolean) from public, anon;
grant execute on function public.musiclub_claim_notification(text) to authenticated, service_role;
grant execute on function public.musiclub_complete_notification(text,boolean) to authenticated, service_role;
commit;
