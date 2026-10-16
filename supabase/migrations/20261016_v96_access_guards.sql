-- Phase 1: additive, reversible guards; no community records are deleted or rewritten.
begin;

create or replace function public.musiclub_is_admin() returns boolean
language sql stable set search_path = '' as $$
  select auth.uid() is not null and lower(coalesce(auth.jwt()->>'email', ''))
    in ('tadeoemiliano@hotmail.com', 'eugenioturcott@gmail.com');
$$;

-- Intentional public projections: private contact fields are always NULL.
-- The view owner reads public community records; callers cannot write through these views.
do $$
declare t text; columns_sql text;
begin
  foreach t in array array['reviews','profiles','cover_ratings','review_comments','review_reactions','pool_entries'] loop
    select string_agg(case
      when column_name ~* 'email|password|token|secret' then format('null::text as %I', column_name)
      when column_name = 'role' then format('%L::text as %I', 'user', column_name)
      else format('%I', column_name) end, ', ' order by ordinal_position)
      into columns_sql from information_schema.columns where table_schema='public' and table_name=t;
    execute format('create or replace view public.%I with (security_barrier=true) as select %s from public.%I', 'public_'||t, columns_sql, t);
    execute format('revoke all on public.%I from anon, authenticated', 'public_'||t);
    execute format('grant select on public.%I to anon, authenticated', 'public_'||t);
  end loop;
end $$;

-- RESTRICTIVE guards are ANDed with the original policies, including any legacy USING(true).
do $$
declare t text; owner_sql text; insert_sql text; update_sql text; delete_sql text;
begin
  foreach t in array array['albums','reviews','profiles','cover_ratings','review_comments','review_reactions','pool_entries','song_recommendations','upcoming_notifications'] loop
    execute format('alter table public.%I enable row level security', t);
    owner_sql := case t
      when 'reviews' then 'lower(reviewer_email) = lower(auth.jwt()->>''email'')'
      when 'profiles' then 'id = auth.uid() and lower(email) = lower(auth.jwt()->>''email'')'
      when 'pool_entries' then '(user_id is null or user_id = auth.uid()) and lower(nominated_by_email) = lower(auth.jwt()->>''email'')'
      when 'song_recommendations' then '(sender_id is null or sender_id = auth.uid()) and lower(sender_email) = lower(auth.jwt()->>''email'')'
      when 'upcoming_notifications' then '(user_id is null or user_id = auth.uid()) and lower(email) = lower(auth.jwt()->>''email'')'
      else '(user_id is null or user_id = auth.uid()) and lower(user_email) = lower(auth.jwt()->>''email'')' end;
    insert_sql := case t
      when 'albums' then 'auth.uid() is not null'
      when 'profiles' then 'auth.uid() is not null and (public.musiclub_is_admin() or ('||owner_sql||' and role = ''user''))'
      when 'pool_entries' then 'auth.uid() is not null and (public.musiclub_is_admin() or ('||owner_sql||' and status = ''ACTIVO'' and not coalesce(reviews_enabled,false)))'
      else 'auth.uid() is not null and (public.musiclub_is_admin() or ('||owner_sql||'))' end;
    update_sql := case t
      when 'albums' then 'public.musiclub_is_admin()'
      when 'pool_entries' then 'public.musiclub_is_admin()'
      when 'profiles' then insert_sql
      when 'song_recommendations' then 'auth.uid() is not null and (public.musiclub_is_admin() or lower(recipient_email)=lower(auth.jwt()->>''email''))'
      else insert_sql end;
    delete_sql := case t
      when 'albums' then 'public.musiclub_is_admin()'
      when 'pool_entries' then 'public.musiclub_is_admin() or (auth.uid() is not null and ('||owner_sql||') and status=''ACTIVO'')'
      when 'song_recommendations' then 'auth.uid() is not null and (public.musiclub_is_admin() or lower(sender_email)=lower(auth.jwt()->>''email'') or lower(recipient_email)=lower(auth.jwt()->>''email''))'
      else 'auth.uid() is not null and (public.musiclub_is_admin() or ('||owner_sql||'))' end;
    execute format('drop policy if exists musiclub_v96_insert_guard on public.%I',t);
    execute format('drop policy if exists musiclub_v96_update_guard on public.%I',t);
    execute format('drop policy if exists musiclub_v96_delete_guard on public.%I',t);
    execute format('create policy musiclub_v96_insert_guard on public.%I as restrictive for insert to public with check (%s)',t,insert_sql);
    execute format('create policy musiclub_v96_update_guard on public.%I as restrictive for update to public using (%s) with check (%s)',t,update_sql,update_sql);
    execute format('create policy musiclub_v96_delete_guard on public.%I as restrictive for delete to public using (%s)',t,delete_sql);
  end loop;
end $$;

-- A new table can have RLS enabled without an existing permissive policy.
drop policy if exists musiclub_v96_subscription_owner on public.upcoming_notifications;
create policy musiclub_v96_subscription_owner on public.upcoming_notifications for all to authenticated
  using (lower(email)=lower(auth.jwt()->>'email') or public.musiclub_is_admin())
  with check (lower(email)=lower(auth.jwt()->>'email') or public.musiclub_is_admin());

commit;
