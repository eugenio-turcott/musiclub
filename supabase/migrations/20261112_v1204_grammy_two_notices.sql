begin;
alter table public.grammy_subscriptions add column confirmation_sent_at timestamptz;
-- Registration closes when the approved reminder goes out. Cancellations remain available.
create or replace function public.musiclub_grammy_subscribe(p_enabled boolean) returns boolean
language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_email text:=lower(auth.jwt()->>'email');
begin
 if v_user is null or v_email is null or position('@' in v_email)=0 then raise exception 'Inicia sesión con un correo válido';end if;
 if p_enabled and now()>='2026-11-16 01:00:00+00'::timestamptz then raise exception 'El registro de recordatorios ha cerrado';end if;
 insert into public.grammy_subscriptions(user_id,event_id,email,enabled) values(v_user,'grammys-2027',v_email,p_enabled)
 on conflict(user_id,event_id) do update set enabled=excluded.enabled,email=excluded.email;
 return p_enabled;
end $$;
revoke all on function public.musiclub_grammy_subscribe(boolean) from public,anon;
grant execute on function public.musiclub_grammy_subscribe(boolean) to authenticated;
create or replace function public.musiclub_pending_grammy_notices(p_phase text) returns table(user_id uuid,email text)
language sql security definer set search_path='' as $$
 select s.user_id,s.email from public.grammy_subscriptions s
 where s.event_id='grammys-2027' and s.enabled and s.created_at<'2026-11-16 01:00:00+00'::timestamptz
 and ((p_phase='confirmation' and s.confirmation_sent_at is null and now()<'2026-11-16 01:00:00+00'::timestamptz)
   or (p_phase='reminder' and s.reminder_sent_at is null and now()>='2026-11-16 01:00:00+00'::timestamptz and now()<'2026-11-16 06:00:00+00'::timestamptz))
 and not exists(select 1 from public.musiclub_notification_deliveries d where d.delivery_key='grammys:2027:'||p_phase||':'||s.user_id::text)
 order by s.created_at limit 50
$$;
revoke all on function public.musiclub_pending_grammy_notices(text) from public,anon,authenticated;
grant execute on function public.musiclub_pending_grammy_notices(text) to service_role;
grant select on public.musiclub_notification_deliveries to service_role;
notify pgrst,'reload schema';
commit;
