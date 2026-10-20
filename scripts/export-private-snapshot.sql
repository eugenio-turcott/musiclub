-- Run in the project's SQL Editor as postgres. READ ONLY: one consistent statement.
-- Download the single backup_base64 result as CSV; encrypt immediately with seal-private-backup.mjs.
-- Includes private account records. Never paste results into a chat or commit the downloaded CSV.
with targets as (
  select n.nspname as schema_name,c.relname as table_name
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where c.relkind='r' and (
    n.nspname='public'
    or (n.nspname='auth' and c.relname in ('users','identities'))
    or (n.nspname='storage' and c.relname in ('buckets','objects'))
    or (n.nspname='supabase_migrations' and c.relname='schema_migrations')
  )
), rows as (
  select schema_name,table_name,
    ((xpath('/table/row/payload/text()',query_to_xml(format(
      'select encode(convert_to(coalesce(jsonb_agg(to_jsonb(t)),''[]''::jsonb)::text,''UTF8''),''base64'') as payload from %I.%I t',schema_name,table_name
    ),false,false,'')))[1])::text as payload
  from targets
), snapshot as (
  select jsonb_build_object(
    'format','musiclub-private-snapshot-v1',
    'created_at',now(),
    'database_version',version(),
    'tables',(select jsonb_agg(jsonb_build_object('schema',schema_name,'table',table_name,'data_base64',payload) order by schema_name,table_name) from rows),
    'columns',(select jsonb_agg(to_jsonb(c)) from information_schema.columns c join targets t on c.table_schema=t.schema_name and c.table_name=t.table_name),
    'constraints',(select jsonb_agg(jsonb_build_object('schema',n.nspname,'table',cl.relname,'name',co.conname,'definition',pg_get_constraintdef(co.oid))) from pg_constraint co join pg_class cl on cl.oid=co.conrelid join pg_namespace n on n.oid=cl.relnamespace join targets t on t.schema_name=n.nspname and t.table_name=cl.relname),
    'enums',(select jsonb_agg(jsonb_build_object('schema',n.nspname,'name',t.typname,'label',e.enumlabel,'order',e.enumsortorder)) from pg_type t join pg_namespace n on n.oid=t.typnamespace join pg_enum e on e.enumtypid=t.oid where n.nspname in ('public','auth','storage')),
    'indexes',(select jsonb_agg(to_jsonb(i)) from pg_indexes i where schemaname='public'),
    'views',(select jsonb_agg(to_jsonb(v)) from pg_views v where schemaname='public'),
    'functions',(select jsonb_agg(jsonb_build_object('definition',pg_get_functiondef(p.oid))) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prokind in ('f','p') and not exists(select 1 from pg_depend d where d.objid=p.oid and d.deptype='e')),
    'triggers',(select jsonb_agg(jsonb_build_object('table',cl.relname,'definition',pg_get_triggerdef(t.oid))) from pg_trigger t join pg_class cl on cl.oid=t.tgrelid join pg_namespace n on n.oid=cl.relnamespace where n.nspname='public' and not t.tgisinternal),
    'policies',(select jsonb_agg(to_jsonb(p)) from pg_policies p where schemaname='public'),
    'grants',(select jsonb_agg(to_jsonb(g)) from information_schema.role_table_grants g where table_schema='public'),
    'sequences',(select jsonb_agg(to_jsonb(s)) from pg_sequences s where schemaname='public'),
    'rls',(select jsonb_agg(jsonb_build_object('table',c.relname,'enabled',c.relrowsecurity,'forced',c.relforcerowsecurity)) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r'),
    'extensions',(select jsonb_agg(jsonb_build_object('name',extname,'version',extversion)) from pg_extension),
    'limitations',jsonb_build_array('Storage binary files are not included; only bucket/object metadata.','Provider secrets, sessions, MFA factors and project configuration are excluded.','Restore requires a separate Supabase project and schema review; never overwrite production automatically.')
  ) as document
)
select encode(convert_to(document::text,'UTF8'),'base64') as backup_base64 from snapshot;
