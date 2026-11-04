import test from 'node:test';
import assert from 'node:assert/strict';
import nodemailer from 'nodemailer';
import {prepareAttachmentsAndImages,sendPoolWinnerEmail,sendPoolGraduatedEmail} from '../src/services/emailService.js';

test('missing Cloudflare artwork bindings cannot abort an email',async()=>{
  const previous=process.env.CLOUDFLARE_DEPLOYMENT;
  process.env.CLOUDFLARE_DEPLOYMENT='1';
  try {
    const result=await prepareAttachmentsAndImages({genres:['Pop']});
    assert.match(result.vinylUrl,/^https:\/\/www.musiclub.org\/genre-vinyl\//);
    assert.ok(Array.isArray(result.attachments));
  } finally {if(previous===undefined)delete process.env.CLOUDFLARE_DEPLOYMENT;else process.env.CLOUDFLARE_DEPLOYMENT=previous;}
});
test('Pool notices require SMTP acceptance, keep members in BCC, and never use a fake delivery',async()=>{
  const original=nodemailer.createTransport;
  const env=Object.fromEntries(['SMTP_HOST','SMTP_USER','SMTP_PASS'].map(key=>[key,process.env[key]]));
  Object.assign(process.env,{SMTP_HOST:'smtp.invalid',SMTP_USER:'fixture',SMTP_PASS:'fixture'});
  let accepted=true,message;
  nodemailer.createTransport=()=>({sendMail:async options=>{message=options;return {messageId:'fixture-only',accepted:accepted?['a@example.test']:[],rejected:accepted?[]:['a@example.test']};}});
  try {
    const options={recipients:['a@example.test','b@example.test'],albumName:'Fixture',artistName:'Fixture',genres:['Pop']};
    assert.equal((await sendPoolWinnerEmail(options)).success,true);
    assert.equal(message.to,'a@example.test');assert.deepEqual(message.bcc,['b@example.test']);
    accepted=false;
    await assert.rejects(sendPoolWinnerEmail(options),/no aceptó/);
    await assert.rejects(sendPoolGraduatedEmail(options),/no aceptó/);
  } finally {
    nodemailer.createTransport=original;
    for(const [key,value] of Object.entries(env))if(value===undefined)delete process.env[key];else process.env[key]=value;
  }
});
