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
import {EventEmitter} from 'node:events';
import {secureSmtpSocket} from '../src/services/smtpSocket.mjs';
test('Workers SMTP establishes verified TLS by hostname and completes the callback once',async()=>{
 const socket=new EventEmitter();socket.authorized=true;socket.destroy=()=>{};
 let calls=0;
 await new Promise((resolve,reject)=>{
  secureSmtpSocket({host:'smtp.example.test',port:465},(error,result)=>{
   calls++;if(error)return reject(error);assert.equal(result.connection,socket);assert.equal(result.secured,true);resolve();
  },options=>{assert.deepEqual(options,{host:'smtp.example.test',port:465,servername:'smtp.example.test',rejectUnauthorized:true,minVersion:'TLSv1.2'});queueMicrotask(()=>socket.emit('secureConnect'));return socket;});
 });
 socket.emit('error',new Error('late close'));assert.equal(calls,1);
});
test('Workers SMTP refuses an unverified certificate and reports a connection error once',async()=>{
 const socket=new EventEmitter();socket.authorized=false;let destroyed=0;socket.destroy=()=>{destroyed++;};
 const error=await new Promise(resolve=>secureSmtpSocket({host:'smtp.example.test',port:465},resolve,()=>{queueMicrotask(()=>socket.emit('secureConnect'));return socket;}));
 assert.equal(error.code,'ETLS');assert.equal(destroyed,1);
});
