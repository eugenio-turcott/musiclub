// Recovery rehearsal in ephemeral, local PostgreSQL. No network or production connection.
import fs from 'node:fs/promises';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { openSnapshot, parseSnapshot } from '../src/utils/privateBackup.mjs';

const backup=process.argv[2],keyFile=process.argv[3];
if(!backup||!keyFile) throw new Error('Indica el archivo cifrado y su clave local; no pegues la clave.');
const snapshot=openSnapshot(JSON.parse(await fs.readFile(backup,'utf8')),Buffer.from((await fs.readFile(keyFile,'utf8')).trim(),'base64'));
const {counts}=parseSnapshot(JSON.stringify(snapshot));
const db=new PGlite();
const quote=value=>'"'+String(value).replace(/"/g,'""')+'"';
const literal=value=>"'"+String(value).replace(/'/g,"''")+"'";
const tableName=table=>`${quote(table.schema)}.${quote(table.table)}`;
let stage='initialization';
const results=[];
try {
  await db.exec("set timezone='UTC';");
  await db.exec("create schema if not exists auth; create schema if not exists storage; create schema if not exists supabase_migrations; create role anon; create role authenticated; create role service_role; create role supabase_auth_admin; create role supabase_storage_admin;");
  // Supabase supplies these in managed projects. Stubs are confined to this offline rehearsal.
  await db.exec("create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$; create function auth.jwt() returns jsonb language sql stable as $$ select '{}'::jsonb $$; create function auth.role() returns text language sql stable as $$ select 'authenticated'::text $$; create function auth.email() returns text language sql stable as $$ select null::text $$; create function public.uuid_generate_v4() returns uuid language sql as $$ select gen_random_uuid() $$;");
  const customTypes=new Map();
  for(const entry of snapshot.enums||[]) {
    const key=entry.schema+'.'+entry.name;
    if(customTypes.has(key)) continue;
    const labels=snapshot.enums.filter(e=>e.schema===entry.schema&&e.name===entry.name).sort((a,b)=>a.order-b.order).map(e=>literal(e.label));
    await db.exec(`create type ${quote(entry.schema)}.${quote(entry.name)} as enum (${labels.join(',')});`);
    customTypes.set(key,true);
  }
  for(const column of snapshot.columns) {
    if(column.udt_schema==='pg_catalog'||customTypes.has(column.udt_schema+'.'+column.udt_name)) continue;
    const table=snapshot.tables.find(t=>t.schema===column.table_schema&&t.table===column.table_name);
    const rows=JSON.parse(Buffer.from(table.data_base64,'base64').toString('utf8'));
    const values=[...new Set(rows.map(r=>r[column.column_name]).filter(v=>v!==null&&v!==undefined))];
    if(!values.length) throw new Error('Custom type requires an explicit schema definition.');
    await db.exec(`create type ${quote(column.udt_schema)}.${quote(column.udt_name)} as enum (${values.map(literal).join(',')});`);
    customTypes.set(column.udt_schema+'.'+column.udt_name,true);
  }
  stage='tables';
  for(const table of snapshot.tables) {
    const columns=snapshot.columns.filter(c=>c.table_schema===table.schema&&c.table_name===table.table).sort((a,b)=>a.ordinal_position-b.ordinal_position);
    const definitions=columns.map(c=>{
      const type=c.udt_schema==='pg_catalog'?(c.udt_name.startsWith('_')?quote(c.udt_name.slice(1))+'[]':quote(c.udt_name)):`${quote(c.udt_schema)}.${quote(c.udt_name)}`;
      const generated=c.is_generated==='ALWAYS'?` generated always as (${c.generation_expression}) stored`:'';
      return `${quote(c.column_name)} ${type}${generated}${c.is_nullable==='NO'?' not null':''}`;
    });
    await db.exec(`create table ${tableName(table)} (${definitions.join(',')});`);
    const writable=columns.filter(c=>c.is_generated!=='ALWAYS').map(c=>quote(c.column_name)).join(',');
    const rows=Buffer.from(table.data_base64,'base64').toString('utf8');
    await db.query(`insert into ${tableName(table)} (${writable}) select ${writable} from jsonb_populate_recordset(null::${tableName(table)},$1::jsonb)`,[rows]);
    const recovered=(await db.query(`select to_jsonb(t) as row from ${tableName(table)} t`)).rows.map(r=>r.row);
    const original=JSON.parse(rows);
    // Date/numeric wire representations may differ; PostgreSQL itself compares JSONB values.
    const mismatch=await db.query(`select count(*)::int as count from ((select to_jsonb(t) as row from ${tableName(table)} t except select value from jsonb_array_elements($1::jsonb)) union all (select value from jsonb_array_elements($1::jsonb) except select to_jsonb(t) from ${tableName(table)} t)) differences`,[rows]);
    results.push({table:table.schema+'.'+table.table,expected:counts[table.schema+'.'+table.table],restored:recovered.length,exactJsonMatches:mismatch.rows[0].count===0});
    if(recovered.length!==original.length) throw new Error('Row count mismatch.');
    if(mismatch.rows[0].count!==0) throw new Error('Restored content differs from the snapshot.');
  }
  stage='functions';
  for(const fn of snapshot.functions||[]) await db.exec(fn.definition);
  stage='constraints';
  const orderedConstraints=[...(snapshot.constraints||[])].sort((a,b)=>(/^FOREIGN KEY/i.test(a.definition)?1:0)-(/^FOREIGN KEY/i.test(b.definition)?1:0));
  for(const constraint of orderedConstraints) await db.exec(`alter table ${quote(constraint.schema||'public')}.${quote(constraint.table)} add constraint ${quote(constraint.name)} ${constraint.definition}`);
  stage='views';
  const pending=[...(snapshot.views||[])];
  for(let pass=0;pending.length&&pass<(snapshot.views?.length||0);pass++) {
    for(let index=pending.length-1;index>=0;index--) {
      const view=pending[index];
      try {await db.exec(`create view ${quote(view.schemaname)}.${quote(view.viewname)} as ${view.definition}`);pending.splice(index,1);}catch { /* retry dependent views after their dependencies */ }
    }
  }
  if(pending.length) throw new Error('Dependent views could not be restored.');
  stage='indexes';
  const constraints=new Set((snapshot.constraints||[]).map(c=>c.name));
  for(const index of snapshot.indexes||[]) if(!constraints.has(index.indexname)) await db.exec(index.indexdef);
  stage='triggers';
  for(const trigger of snapshot.triggers||[]) await db.exec(trigger.definition);
  stage='policies';
  for(const policy of snapshot.policies||[]) {
    const roles=policy.roles.map(role=>role==='public'?'public':quote(role)).join(',');
    await db.exec(`create policy ${quote(policy.policyname)} on ${quote(policy.schemaname)}.${quote(policy.tablename)} as ${policy.permissive} for ${policy.cmd} to ${roles}${policy.qual?` using (${policy.qual})`:''}${policy.with_check?` with check (${policy.with_check})`:''}`);
  }
  stage='row-security';
  for(const row of snapshot.rls||[]) {
    if(row.enabled) await db.exec(`alter table public.${quote(row.table)} enable row level security`);
    if(row.forced) await db.exec(`alter table public.${quote(row.table)} force row level security`);
  }
  const report={verified:true,date:new Date().toISOString(),environment:'ephemeral-local-postgresql',results,functions:snapshot.functions?.length||0,policies:snapshot.policies?.length||0,views:snapshot.views?.length||0,limitations:['Managed auth functions are stubs only for this rehearsal.','Custom enum values are reconstructed from existing data; unused labels require the managed schema.','Storage binaries and provider configuration are outside this snapshot.','Grants and column defaults require review for recovery into a new managed project.']};
  await fs.writeFile(path.join(path.dirname(backup),'recovery-verification.json'),JSON.stringify(report,null,2),{mode:0o600});
  console.log(JSON.stringify({verified:true,tables:results.length,rows:results.reduce((a,r)=>a+r.restored,0),functions:report.functions,policies:report.policies,views:report.views,representationDifferences:results.filter(r=>!r.exactJsonMatches).map(r=>r.table),note:'Ensayo local; no se conectó ni restauró producción.'}));
} catch(error) {
  // Never print SQL parameters or private row values from PostgreSQL errors.
  console.error(JSON.stringify({verified:false,stage,code:error.code||null,message:'El ensayo encontró una diferencia; no se modificó producción.'}));
  process.exitCode=1;
} finally { await db.close(); }
