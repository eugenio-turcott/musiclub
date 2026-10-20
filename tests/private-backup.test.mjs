import test from 'node:test';
import assert from 'node:assert/strict';
import {parseSnapshot,sealSnapshot,openSnapshot} from '../src/utils/privateBackup.mjs';
const snapshot={format:'musiclub-private-snapshot-v1',tables:['public.albums','public.reviews','public.profiles','auth.users'].map(name=>({schema:name.split('.')[0],table:name.split('.')[1],data_base64:Buffer.from(JSON.stringify([{id:1,text:'Música, "azul" & café'}])).toString('base64')}))};

test('SQL CSV exports round-trip with accented and quoted data without exposing plaintext',()=>{
  const csv='\uFEFF"backup_base64"\r\n"'+Buffer.from(JSON.stringify(snapshot)).toString('base64')+'"\r\n';
  const parsed=parseSnapshot(csv);assert.equal(parsed.counts['public.reviews'],1);
  const {key,envelope}=sealSnapshot(parsed.snapshot);
  assert.equal(JSON.stringify(envelope).includes('Música'),false);
  assert.deepEqual(openSnapshot(envelope,key),snapshot);
});
test('tampered backups and wrong keys cannot be opened',()=>{
  const {key,envelope}=sealSnapshot(snapshot);
  const changed={...envelope,data:Buffer.from('tampered').toString('base64')};
  assert.throws(()=>openSnapshot(changed,key));
  assert.throws(()=>openSnapshot(envelope,Buffer.alloc(32)));
});
test('incomplete exports do not become apparently verified backups',()=>{
  assert.throws(()=>parseSnapshot(JSON.stringify({...snapshot,tables:[]})),/tablas esenciales/);
  assert.throws(()=>parseSnapshot('{"format":"other"}'),/no reconocido/);
});
