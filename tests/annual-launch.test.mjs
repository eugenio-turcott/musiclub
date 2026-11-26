import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {ANNUAL_LAUNCH,annualIsPublished} from '../src/data/annual2026Launch.mjs';
import {annualAccess} from '../src/server/annualAccess.mjs';
import {annualMetricDetails,annualMilestones} from '../src/utils/annualInsights.mjs';
import {scheduledPaths} from '../src/cloudflare/scheduledPaths.mjs';
import {commonDiscography} from '../src/utils/verifiedDiscography.mjs';
import {buildAnnualYearbook} from '../src/utils/annualYearbook.mjs';
const launch=Date.parse(ANNUAL_LAUNCH.at);
test('annual publication opens at noon in Mexico City, with a scheduled mail check at that instant',()=>{
 assert.equal(ANNUAL_LAUNCH.at,'2026-12-28T18:00:00Z');assert.equal(annualIsPublished(launch-1),false);assert.equal(annualIsPublished(launch),true);
 assert.equal(new Intl.DateTimeFormat('en-GB',{timeZone:ANNUAL_LAUNCH.timezone,hour:'2-digit',minute:'2-digit',hour12:false}).format(launch),'12:00');
 assert.ok(scheduledPaths(launch).includes('/api/annual/2026/mail'));assert.equal(scheduledPaths(Date.parse('2027-01-02')).includes('/api/annual/2026/mail'),false);
});
test('annual access requires admin before launch, validates members after launch and gives anonymous visitors only a public client',async()=>{
 const calls=[],publicClient={role:'anon'},authorize=async(_,{admin})=>(calls.push(admin),{error:admin?'denied':'invalid session'}),publicDb=()=>publicClient;
 const anon=new Request('https://www.musiclub.org/api/annual/2026?admin=true&user_id=other');
 assert.equal((await annualAccess(anon,{authorize,publicDb,now:launch-1})).error,'denied');
 assert.deepEqual(await annualAccess(anon,{authorize,publicDb,now:launch}),{user:null,db:publicClient});
 const member=new Request(anon,{headers:{Authorization:'Bearer forged'}});assert.equal((await annualAccess(member,{authorize,publicDb,now:launch})).error,'invalid session');assert.deepEqual(calls,[true,false]);
});
test('discography is newest first, using 70/30 relevance only to break equal dates',()=>{
 const apple=id=>({id,apple_music_link:'https://music.apple.com/us/album/12345'}),spotify=id=>({id,spotify_link:'https://open.spotify.com/album/1234567890123456789012'});
 const r=commonDiscography([{...spotify('old'),releaseDate:'2022-03-18'},{...apple('new'),releaseDate:'2026-04-01'},{...spotify('same-date'),releaseDate:'2026-04-01'},{...apple('unknown')}]);assert.deepEqual(r.map(a=>a.id),['same-date','old']);
});
test('EP and single rankings sort by external rating, place unscored last and keep source numbers unchanged',()=>{
 const groups={eps:['a','b','c'],singles:['c','a','b']},releases=[{id:'a',title:'A',global:{user:{score:70,count:100}}},{id:'b',title:'B',global:{user:{score:95,count:30}}},{id:'c',title:'C',global:{}}];
 const result=buildAnnualYearbook(null,{groups,releases});for(const key of ['eps','singles']){assert.deepEqual(result[key].map(r=>r.id),['b','a','c']);assert.deepEqual(result[key].map(r=>r.rank),[1,2,3]);}assert.equal(releases[0].global.user.score,70);
});
test('personal insights describe real activity and remain sensible for an empty or small year',()=>{
 const empty=annualMetricDetails({});assert.ok(Object.values(empty).every(v=>!v.includes('NaN')));assert.deepEqual(annualMilestones({}),[]);
 const stats={reviewCount:100,trackCount:1184,commentCount:87,meanScore:9.18,genreCount:44,genres:[{name:'Pop'}],longestStreak:6,perfectCount:3};assert.match(annualMetricDetails(stats).comments,/87%/);assert.equal(annualMilestones(stats).length,3);assert.ok(annualMilestones(stats).every(r=>!r.text.includes('XP')));
});
test('opt-in RLS prevents cross-account access, spoofed email, forged delivery timestamps and campaign approval',async()=>{
 const db=new PGlite(),a='00000000-0000-4000-8000-000000000001',b='00000000-0000-4000-8000-000000000002';
 try{
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;grant usage on schema public,auth to anon,authenticated,service_role;create table auth.users(id uuid primary key);insert into auth.users values('${a}'),('${b}');create function auth.uid() returns uuid language sql as $$select nullif(current_setting('test.uid',true),'')::uuid$$;create function auth.jwt() returns jsonb language sql as $$select jsonb_build_object('email','fixture@example.test')$$;`);
  await db.exec(await fs.readFile(new URL('../supabase/migrations/20261126160546_annual_2026_notifications.sql',import.meta.url),'utf8'));
  await db.exec(`set test.uid='${a}';set role authenticated;`);await db.query('select musiclub_annual_subscribe(2026,true)');await db.query('select musiclub_annual_subscribe(2026,false)');assert.equal((await db.query('select enabled from annual_subscriptions')).rows[0].enabled,false);
  await assert.rejects(db.query("update annual_subscriptions set email='other@example.test'"),/row-level security/);await assert.rejects(db.query('update annual_subscriptions set launch_sent_at=now()'),/permission denied/);await assert.rejects(db.query('update annual_mail_campaigns set paused=false,approved_at=now()'),/permission denied/);
  await assert.rejects(db.query(`insert into annual_subscriptions(year,user_id,email) values(2026,'${b}','fixture@example.test')`),/row-level security/);
  await db.exec(`set test.uid='${b}'`);assert.equal((await db.query('select * from annual_subscriptions')).rows.length,0);await db.exec('reset role;set role anon;');await assert.rejects(db.query('select * from annual_subscriptions'),/permission denied/);await assert.rejects(db.query('select musiclub_annual_subscribe(2026,true)'),/permission denied/);
  await db.exec('reset role;');const campaigns=(await db.query('select * from annual_mail_campaigns')).rows;assert.equal(campaigns.length,3);assert.ok(campaigns.every(c=>c.paused&&c.approved_at===null));assert.equal(new Date(campaigns.find(c=>c.phase==='launch').scheduled_at).toISOString(),new Date(launch).toISOString());
 }finally{await db.close();}
});
