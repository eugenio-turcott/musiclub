begin;
alter table public.grammy_categories add column reward_xp int not null default 100 check(reward_xp in(100,200,500));
update public.grammy_categories set reward_xp=500 where field_id='general';
update public.grammy_categories set reward_xp=200 where id in('best-asian-pop-music-performance','best-r-b-collaboration-or-duo-group-performance','best-traditional-pop-vocal-performance','best-traditional-folk-album','best-latin-song');
create table public.grammy_results(
 event_id text not null,category_id text not null,nominee_id uuid not null,source_url text not null,verified_at timestamptz not null default now(),
 primary key(event_id,category_id),foreign key(event_id,category_id,nominee_id) references public.grammy_nominees(event_id,category_id,id)
);
create table public.grammy_awards(
 user_id uuid not null references auth.users(id) on delete cascade,event_id text not null,category_id text not null,nominee_id uuid not null,
 xp int not null check(xp in(100,200,500)),awarded_at timestamptz not null default now(),primary key(user_id,event_id,category_id),
 foreign key(event_id,category_id) references public.grammy_results(event_id,category_id),foreign key(event_id,category_id,nominee_id) references public.grammy_nominees(event_id,category_id,id)
);
alter table public.grammy_results enable row level security;
alter table public.grammy_awards enable row level security;
revoke all on public.grammy_results,public.grammy_awards from anon,authenticated;
grant select on public.grammy_results to anon,authenticated;
grant select on public.grammy_awards to authenticated;
grant all on public.grammy_results,public.grammy_awards to service_role;
create policy grammy_results_read on public.grammy_results for select using(true);
create policy grammy_awards_own on public.grammy_awards for select to authenticated using(user_id=auth.uid());
-- Public musical achievements only: no forecasts, addresses or subscription data.
create view public.public_grammy_progress with(security_barrier=true) as
 select a.user_id,count(*)::int correct_count,count(*) filter(where a.xp=100)::int normal_correct,
 count(*) filter(where a.xp=200)::int new_correct,count(*) filter(where a.xp=500)::int general_correct,sum(a.xp)::int total_xp
 from public.grammy_awards a where a.event_id='grammys-2027' group by a.user_id;
revoke all on public.public_grammy_progress from public;
grant select on public.public_grammy_progress to anon,authenticated,service_role;

create function public.musiclub_settle_grammy_results(p_winners jsonb,p_source text) returns int
language plpgsql security definer set search_path='' as $$
declare item jsonb;cat text;nom uuid;added int;total_added int:=0;
begin
 if now()<'2027-02-08 00:00:00+00'::timestamptz or exists(select 1 from public.grammy_events where id='grammys-2027' and now()<closes_at) then raise exception 'Espera a la ceremonia y al cierre de predicciones';end if;
 if p_source !~ '^https://(www\.)?grammy\.com/' then raise exception 'Indica una fuente oficial de Grammy.com';end if;
 if jsonb_typeof(p_winners)<>'array' or jsonb_array_length(p_winners) not between 1 and 100 then raise exception 'Revisa la lista de ganadores';end if;
 perform pg_advisory_xact_lock(12012027);
 for item in select * from jsonb_array_elements(p_winners) loop
  cat:=item->>'categoryId';nom:=(item->>'nomineeId')::uuid;
  if not exists(select 1 from public.grammy_nominees where id=nom and category_id=cat and event_id='grammys-2027') then raise exception 'El ganador no corresponde a la categoría';end if;
  if exists(select 1 from public.grammy_results where event_id='grammys-2027' and category_id=cat and nominee_id<>nom) then raise exception 'Esta categoría ya tiene un ganador verificado';end if;
  insert into public.grammy_results(event_id,category_id,nominee_id,source_url) values('grammys-2027',cat,nom,p_source) on conflict do nothing;
  insert into public.grammy_awards(user_id,event_id,category_id,nominee_id,xp)
   select p.user_id,p.event_id,p.category_id,p.nominee_id,c.reward_xp from public.grammy_predictions p join public.grammy_categories c on c.id=p.category_id
   where p.event_id='grammys-2027' and p.category_id=cat and p.nominee_id=nom
   on conflict(user_id,event_id,category_id) do nothing;
  get diagnostics added=row_count;total_added:=total_added+added;
 end loop;
 return total_added;
end $$;
revoke all on function public.musiclub_settle_grammy_results(jsonb,text) from public,anon,authenticated;
grant execute on function public.musiclub_settle_grammy_results(jsonb,text) to service_role;
notify pgrst,'reload schema';
commit;
