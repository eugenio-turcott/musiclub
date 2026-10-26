-- Eugenio confirmed ownership of the original Musiclub room.
-- This is the verified existing profile, not a display-name fallback.
begin;
update public.pool_rooms r set owner_id=p.id
from public.profiles p
where r.id='00000000-0000-4000-8000-000000000000'
  and r.owner_id is null
  and p.id='e48280b3-d936-467f-9506-633bc930de64'
  and p.name='Eugenio';
insert into public.pool_room_members(room_id,user_id)
select id,owner_id from public.pool_rooms
where id='00000000-0000-4000-8000-000000000000'
  and owner_id='e48280b3-d936-467f-9506-633bc930de64'
on conflict(room_id,user_id) do nothing;
commit;
