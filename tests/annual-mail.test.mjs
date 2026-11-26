import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {deliverAnnualNotice,processAnnualNotices,prepareAnnualEmail} from '../src/services/annualMail.mjs';
import {annualEmailDesign,ANNUAL_MAIL_PHASES} from '../src/services/annualEmailTemplate.mjs';
const before=Date.parse('2026-11-26T18:00:00Z'),launch=Date.parse('2026-12-28T18:00:00Z');
function fixture({approved=false}={}){
 const campaigns=new Map(ANNUAL_MAIL_PHASES.map(p=>[p,{paused:!approved,approved_at:approved?'2026-11-26T18:00:00Z':null,scheduled_at:p==='launch'?'2026-12-28T18:00:00Z':null}])),rows=new Map([['alice',{email:'alice@example.test',enabled:true}],['bob',{email:'bob@example.test',enabled:false}]]),ledger=new Map(),reads=[];
 const db={from:table=>{reads.push(table);const filter={},q={select:()=>q,eq:(k,v)=>(filter[k]=v,q),order:()=>q,range:()=>q,update:p=>(q.patch=p,q),maybeSingle:async()=>({data:table==='annual_mail_campaigns'?campaigns.get(filter.phase):rows.get(filter.user_id||filter.id)}),then:resolve=>{if(q.patch){Object.assign(rows.get(filter.user_id),q.patch);return Promise.resolve(resolve({}));}return Promise.resolve(resolve({data:[...rows].filter(([,r])=>table==='profiles'||r.enabled).map(([id,r])=>({id,user_id:id,...r}))}));}};return q;},rpc:async(name,args)=>{if(name==='musiclub_claim_notification'){if(ledger.has(args.p_key))return {data:false};ledger.set(args.p_key,'processing');return {data:true};}ledger.set(args.p_key,args.p_sent?'sent':'failed');return {};}};
 return {db,campaigns,rows,ledger,reads};
}
test('paused or unapproved drafts never read recipients, claim delivery slots or call SMTP',async()=>{
 const {db,campaigns,reads,ledger}=fixture();let attempts=0;const send=async()=>{attempts++;return {success:true};};
 for(const phase of ANNUAL_MAIL_PHASES)assert.equal((await processAnnualNotices(db,phase,{now:phase==='launch'?launch:before,send})).sent,0);
 campaigns.get('confirmation').paused=false;assert.equal((await deliverAnnualNotice(db,'alice','confirmation',{now:before,send})).reason,'not_approved_or_due');assert.equal(attempts,0);assert.equal(ledger.size,0);assert.ok(reads.every(t=>t==='annual_mail_campaigns'));
});
test('launch waits until noon, then sends once per enabled subscriber and respects cancellations',async()=>{
 const {db,rows}=fixture({approved:true}),sent=[],send=async(to,phase)=>(sent.push({to,phase}),{success:true});
 assert.equal((await processAnnualNotices(db,'launch',{now:launch-1,send})).sent,0);assert.equal((await processAnnualNotices(db,'confirmation',{now:before,send})).sent,1);assert.equal((await processAnnualNotices(db,'confirmation',{now:before,send})).sent,0);
 rows.get('alice').enabled=false;assert.equal((await processAnnualNotices(db,'launch',{now:launch,send})).sent,0);rows.get('alice').enabled=true;assert.equal((await processAnnualNotices(db,'launch',{now:launch,send})).sent,1);assert.equal((await processAnnualNotices(db,'launch',{now:launch,send})).sent,0);assert.deepEqual(sent.map(r=>r.phase),['confirmation','launch']);
});
test('an uncertain send stays claimed and is never resent by a later scheduled check',async()=>{
 const {db,ledger}=fixture({approved:true});let attempts=0;const send=async()=>{attempts++;throw Error('SMTP uncertain');};assert.equal((await processAnnualNotices(db,'launch',{now:launch,send})).failed,1);assert.equal((await processAnnualNotices(db,'launch',{now:launch,send})).sent,0);assert.equal(attempts,1);assert.equal(ledger.get('annual:2026:launch:alice'),'failed');
});
test('all three mail designs share one width, distinct artwork, safe personalization and embedded PNG assets',async()=>{
 const subjects=new Set();for(const phase of ANNUAL_MAIL_PHASES){const mail=annualEmailDesign(phase,{name:'<img onerror="evil">'});subjects.add(mail.subject);assert.match(mail.html,/max-width:640px/);assert.ok(mail.html.includes(`/email/annual-2026/${phase}.png`));assert.match(mail.html,/28 de diciembre/);assert.match(mail.html,/12:00 p\. m\./);assert.match(mail.html,/Ciudad de México/);assert.ok(!mail.html.includes('<img onerror="evil">'));assert.match(mail.html,/&lt;img/);
  const prepared=await prepareAnnualEmail(phase,{},p=>readFile(new URL('../public'+p,import.meta.url)));assert.ok(prepared.attachments.length>=5);assert.ok(prepared.attachments.every(a=>a.content.length&&a.contentType==='image/png'));assert.ok(prepared.html.includes('src="cid:'));assert.ok(!/src="https:/.test(prepared.html));
 }assert.equal(subjects.size,3);assert.throws(()=>annualEmailDesign('reminder'));
});
