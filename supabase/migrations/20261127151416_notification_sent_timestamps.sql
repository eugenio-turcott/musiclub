-- In-app delivery time is separate from a release, review or subscription date.
create table public.musiclub_inbox_receipts (
 user_id uuid not null references auth.users(id) on delete cascade,
 notification_id text not null check (length(notification_id) between 2 and 240),
 sent_at timestamptz not null default now(),
 primary key(user_id,notification_id)
);
alter table public.musiclub_inbox_receipts enable row level security;
revoke all on public.musiclub_inbox_receipts from public, anon, authenticated;
grant select on public.musiclub_inbox_receipts to authenticated;
-- Clients cannot provide or update sent_at, including through the REST API.
grant insert(user_id,notification_id) on public.musiclub_inbox_receipts to authenticated;
create policy inbox_receipts_owner_read on public.musiclub_inbox_receipts for select to authenticated using ((select auth.uid())=user_id);
create policy inbox_receipts_owner_insert on public.musiclub_inbox_receipts for insert to authenticated with check ((select auth.uid())=user_id);
