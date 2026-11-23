-- Keep verified duplicate IDs readable without duplicating public catalog entries.
alter table public.albums add column if not exists canonical_album_id uuid references public.albums(id);
alter table public.albums add constraint albums_alias_not_self check (canonical_album_id is distinct from id);
create index albums_canonical_album_id_idx on public.albums(canonical_album_id) where canonical_album_id is not null;

create or replace function public.musiclub_guard_album_alias()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if new.canonical_album_id is not distinct from old.canonical_album_id then return new; end if;
  elsif new.canonical_album_id is null then
    return new;
  end if;
  if current_user not in ('postgres','service_role','supabase_admin') and not coalesce(public.musiclub_is_admin(),false) then
    raise exception 'Only administrators can consolidate releases' using errcode = '42501';
  end if;
  if new.canonical_album_id is not null and (
    new.canonical_album_id = new.id or
    exists (select 1 from public.albums where id = new.canonical_album_id and canonical_album_id is not null) or
    exists (select 1 from public.albums where canonical_album_id = new.id)
  ) then
    raise exception 'Release aliases must point directly to a canonical release' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function public.musiclub_guard_album_alias() from public, anon, authenticated;
create trigger musiclub_guard_album_alias before insert or update of canonical_album_id on public.albums
for each row execute function public.musiclub_guard_album_alias();
