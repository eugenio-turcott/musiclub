begin;
-- Preserve the original delivery identifier when recovering the two verified
-- SMTP authentication failures. No sent/processing delivery is changed.
alter table public.musiclub_notification_deliveries add column if not exists legacy_delivery_key text;
with recovery(event,legacy_key,album_id) as (values
  ('pool-winner','pool-winner:39f691028f1116fbbd9bffa975bd6cea2effacaca88cb86299d6fb0688da75b3','01b2e1f7-c2a9-4daf-8cef-b9d7a9305f4e'::uuid),
  ('pool-graduated','pool-graduated:39cb3d0b9aca42adf8a9bf5fbeabf1c20106fc8e1a1718bee46a451f4c769b0a','7356af48-9a7b-448a-9f3a-7225232b3bc2'::uuid)
)
update public.musiclub_notification_deliveries d
  set legacy_delivery_key=d.delivery_key,delivery_key=r.event||':entry:'||e.id::text
from recovery r join public.pool_entries e on e.album_id=r.album_id and e.season_id='temporada-2-1792706004099'
  join public.seasons s on s.id=e.season_id and s.room_id='00000000-0000-4000-8000-000000000000'
where d.delivery_key=r.legacy_key and d.status='failed'
  and e.status=case when r.event='pool-winner' then 'GANADOR' else 'GRADUADO' end
  and not exists(select 1 from public.musiclub_notification_deliveries current_delivery where current_delivery.delivery_key=r.event||':entry:'||e.id::text);
commit;
