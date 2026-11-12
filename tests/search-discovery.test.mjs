import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {processSearchDiscovery,verifyDiscoveryPage,parseDiscoverySitemap} from '../src/services/searchDiscovery.mjs';
import sitemap from '../src/utils/sitemapData.cjs';
import editions from '../src/utils/releaseEditions.cjs';
import {scheduledPaths} from '../src/cloudflare/scheduledPaths.mjs';
const a='00000000-0000-4000-8000-000000000001',b='00000000-0000-4000-8000-000000000002';

test('review transactions enqueue publication without any browser call; private queue coalesces changes and survives races, failures and crashed workers',async()=>{
 const db=new PGlite();
 try{
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
  create table public.albums(id uuid primary key,album_name text,artist_name text,release_type text,genres text[],tracks jsonb,image_url text,release_year integer,release_date date,created_at timestamptz default now());
  create table public.reviews(id integer primary key,album_id uuid references albums(id),comment text,created_at timestamptz default now());
  insert into albums(id,album_name,artist_name) values('${a}','Record','Artist'),('${b}','Other','Artist');grant insert,update,delete,select on reviews to authenticated;`);
  await db.exec(await readFile(new URL('../supabase/migrations/20261112_v1205_search_discovery.sql',import.meta.url),'utf8'));
  await db.exec("set role anon;");await assert.rejects(db.query('select * from musiclub_search_discovery'),/permission denied/);await db.exec('reset role;set role authenticated;');
  await assert.rejects(db.query('select musiclub_claim_search_discovery(5)'),/permission denied/);
  await assert.rejects(db.query('select musiclub_queue_release_discovery($1)',[a]),/permission denied/);
  await db.exec(`insert into reviews values(1,'${a}','First review',now());`);
  await db.exec('reset role;');assert.equal((await db.query('select count(*)::int n from musiclub_search_discovery')).rows[0].n,1);
  await db.exec('begin;');await db.exec(`insert into reviews values(2,'${b}','Rolled back',now());rollback;`);assert.equal((await db.query('select count(*)::int n from musiclub_search_discovery')).rows[0].n,1);
  await db.exec('set role service_role;');const job=(await db.query('select * from musiclub_claim_search_discovery(5)')).rows[0];assert.equal(job.revision,1);assert.equal(job.attempts,1);assert.ok(job.lease_token);assert.equal((await db.query('select * from musiclub_claim_search_discovery(5)')).rows.length,0);
  await db.exec(`reset role;update reviews set comment='Edited while checking' where id=1;set role service_role;`);
  const finish=(j,ok,error=null)=>db.query('select musiclub_complete_search_discovery($1,$2,$3,$4,$5,$6,$7) ok',[j.album_id,j.revision,j.lease_token,ok,'https://www.musiclub.org/albumes/artist-record','listed',error]);
  assert.equal((await finish(job,true)).rows[0].ok,false);const current=(await db.query('select * from musiclub_claim_search_discovery(5)')).rows[0];assert.equal(current.revision,2);assert.equal(current.attempts,1);
  assert.equal((await finish(current,false,'page_unavailable')).rows[0].ok,false);await db.exec('reset role;');let row=(await db.query('select * from musiclub_search_discovery')).rows[0];assert.equal(row.status,'retry');assert.ok(Date.parse(row.next_attempt_at)>Date.now()+200000);assert.equal(row.verified_at,null);
  await db.exec("update musiclub_search_discovery set next_attempt_at=now()-interval '1 second';set role service_role;");const crashed=(await db.query('select * from musiclub_claim_search_discovery(5)')).rows[0];await db.exec("reset role;update musiclub_search_discovery set locked_until=now()-interval '1 second';set role service_role;");const recovered=(await db.query('select * from musiclub_claim_search_discovery(5)')).rows[0];assert.notEqual(crashed.lease_token,recovered.lease_token);assert.equal((await finish(crashed,true)).rows[0].ok,false);assert.equal((await finish(recovered,true)).rows[0].ok,true);
  await db.exec('reset role;');row=(await db.query('select * from musiclub_search_discovery')).rows[0];assert.equal(row.status,'verified');assert.equal(row.verified_revision,row.revision);
  await db.exec(`update reviews set album_id='${b}' where id=1;`);let queued=(await db.query('select * from musiclub_search_discovery order by album_id')).rows;assert.equal(queued.length,2);assert.equal(queued.every(r=>r.status==='pending'),true);
  await db.exec('delete from reviews where id=1;');assert.equal((await db.query('select status from musiclub_search_discovery where album_id=$1',[b])).rows[0].status,'pending');
  await db.exec("update musiclub_search_discovery set status='processing',attempts=8,locked_until=now()-interval '1 second';set role service_role;");assert.equal((await db.query('select * from musiclub_claim_search_discovery(5)')).rows.length,0);const status=(await db.query('select musiclub_search_discovery_status() value')).rows[0].value;assert.equal(status.summary.attention,2);assert.ok(!JSON.stringify(status).includes('lease_token'));assert.equal((await db.query('select musiclub_retry_search_discovery() n')).rows[0].n,2);
 }finally{await db.close();}
});

function batchFixture(){
 const date='2026-11-12T18:00:00Z',albums=[{id:a,album_name:'Record',artist_name:'Artist',release_type:'ALBUM',review_count:1,genres:['Pop'],public_content_updated_at:date},{id:b,album_name:'Other',artist_name:'Artist',release_type:'EP',review_count:1,genres:['Pop'],public_content_updated_at:date}];
 const jobs=albums.map(album=>({album_id:album.id,revision:1,lease_token:'lease',changed_at:date})),completions=[],reads=[];let refreshes=0;
 const groups=sitemap.buildSitemapGroups(albums,[]);
 const db={rpc:async(name,args)=>{if(name==='musiclub_claim_search_discovery')return {data:jobs};completions.push(args);return {data:true};}};
 const options={refresh:async()=>{refreshes++;return {albums,reviews:[]};},readPublic:async path=>{reads.push(path);if(path.startsWith('/sitemap-')){const section=path.match(/sitemap-(\w+)\.xml/)[1];return {status:200,html:sitemap.sitemapXml(groups[section])};}return {status:200,html:`<meta name="robots" content="index, follow"><link href="https://www.musiclub.org${path}" rel="canonical">`};}};
 return {db,options,completions,reads,refreshes:()=>refreshes,jobs,albums};
}
test('one catalogue refresh and shared sitemaps verify canonical public pages, not Google indexing',async()=>{
 const f=batchFixture();assert.deepEqual(await processSearchDiscovery(f.db,f.options),{claimed:2,verified:2,retry:0,deferred:0});assert.equal(f.refreshes(),1);assert.equal(f.reads.filter(p=>p.startsWith('/sitemap-')).length,3);assert.equal(f.reads.length,5);assert.ok(f.completions.every(p=>p.p_ok&&p.p_kind==='listed'));assert.equal(f.completions[1].p_url,'https://www.musiclub.org/eps/artist-other');
 f.jobs.length=0;assert.equal((await processSearchDiscovery(f.db,f.options)).claimed,0);assert.equal(f.refreshes(),1);
});
test('missing/stale sitemaps, noindex, canonical mismatches, interrupted reads and racing revisions never produce false verification',async()=>{
 const url='https://www.musiclub.org/albumes/artist-record';
 for(const response of [{status:503,html:''},{status:200,html:`<meta content='noindex' name='robots'><link rel='canonical' href='${url}'>`},{status:200,html:`<link rel='canonical' href='https://evil.test/x'>`},{status:200,html:`<link rel='canonical' href='${url}'>`,robotsHeader:'noindex'}])assert.throws(()=>verifyDiscoveryPage(response,url,true));
 verifyDiscoveryPage({status:200,html:`<meta name='robots' content='noindex,follow'><link href='${url}' rel='canonical'>`},url,false);
 assert.throws(()=>parseDiscoverySitemap('<html>error</html>'));assert.throws(()=>parseDiscoverySitemap('<urlset>'));
 for(const mode of ['stale','network','sitemap']){const f=batchFixture();if(mode==='stale')f.albums[0].public_content_updated_at='2026-11-01';if(mode==='network')f.options.refresh=async()=>{throw new Error('private details');};if(mode==='sitemap'){const original=f.options.readPublic;f.options.readPublic=path=>path==='/sitemap-reviews.xml'?Promise.resolve({status:200,html:sitemap.sitemapXml([])}):original(path);}
  const result=await processSearchDiscovery(f.db,f.options);assert.ok(result.retry>0);assert.ok(f.completions.some(p=>!p.p_ok));assert.ok(!JSON.stringify(f.completions).includes('private details'));
 }
 const f=batchFixture();f.db.rpc=async(name,args)=>name==='musiclub_claim_search_discovery'?{data:f.jobs}:{data:false};assert.equal((await processSearchDiscovery(f.db,f.options)).verified,0);
});
test('edits to a secondary edition advance the canonical sitemap date without creating duplicate pages',()=>{
 const rows=editions.groupReleaseEditions([{id:a,album_name:'Record',artist_name:'Artist',review_count:1,public_content_updated_at:'2026-11-01'},{id:b,album_name:'Record (Clean)',artist_name:'Artist',public_content_updated_at:'2026-11-12T18:00:00Z'}]);
 assert.equal(rows.length,1);assert.equal(rows[0].public_content_updated_at,'2026-11-12T18:00:00Z');assert.equal(sitemap.buildSitemapGroups(rows).reviews[0].lastmod,'2026-11-12T18:00:00.000Z');
});


test('five-minute discovery checks preserve the approved Sunday 19:00 CDMX Grammy reminder cadence',()=>{
 assert.deepEqual(scheduledPaths(Date.parse('2026-11-16T01:00:00Z')),['/api/search-discovery','/api/grammys/reminders']);
 assert.deepEqual(scheduledPaths(Date.parse('2026-11-16T01:05:00Z')),['/api/search-discovery']);
 assert.deepEqual(scheduledPaths(Date.parse('2026-11-16T01:15:00Z')),['/api/search-discovery','/api/grammys/reminders']);
 assert.throws(()=>scheduledPaths('invalid'));
});
