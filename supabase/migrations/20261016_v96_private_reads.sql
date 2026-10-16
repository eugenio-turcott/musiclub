-- Phase 2: run AFTER deploying the version which reads the public_* views.
begin;
do $$
declare t text; owner_sql text;
begin
  foreach t in array array['reviews','profiles','cover_ratings','review_comments','review_reactions','pool_entries','song_recommendations','upcoming_notifications'] loop
    owner_sql := case t
      when 'reviews' then 'lower(reviewer_email)=lower(auth.jwt()->>''email'')'
      when 'profiles' then 'id=auth.uid()'
      when 'pool_entries' then 'user_id=auth.uid() or lower(nominated_by_email)=lower(auth.jwt()->>''email'')'
      when 'song_recommendations' then 'lower(sender_email)=lower(auth.jwt()->>''email'') or lower(recipient_email)=lower(auth.jwt()->>''email'')'
      when 'upcoming_notifications' then 'lower(email)=lower(auth.jwt()->>''email'')'
      else 'user_id=auth.uid() or lower(user_email)=lower(auth.jwt()->>''email'')' end;
    execute format('drop policy if exists musiclub_v96_private_read_guard on public.%I',t);
    execute format('create policy musiclub_v96_private_read_guard on public.%I as restrictive for select to public using (auth.uid() is not null and (public.musiclub_is_admin() or (%s)))',t,owner_sql);
  end loop;
end $$;
commit;
