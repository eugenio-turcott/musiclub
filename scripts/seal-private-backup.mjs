import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { parseSnapshot, sealSnapshot, openSnapshot } from '../src/utils/privateBackup.mjs';

const input=process.argv[2];
const directory=path.resolve(process.argv[3]||'audit/private-backups');
const keyDirectory=path.resolve(process.argv[4]||'audit/private-backup-keys');
if(!input) throw new Error('Indica la ruta del CSV descargado del SQL Editor. No pegues su contenido.');
await fs.mkdir(directory,{recursive:true,mode:0o700});
await fs.mkdir(keyDirectory,{recursive:true,mode:0o700});
if(process.platform==='win32') {
  const sid=execFileSync('powershell.exe',['-NoProfile','-Command','[System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value'],{encoding:'utf8'}).trim();
  execFileSync('icacls.exe',[directory,'/inheritance:r','/grant:r',`*${sid}:(OI)(CI)F`],{stdio:'ignore'});
  execFileSync('icacls.exe',[keyDirectory,'/inheritance:r','/grant:r',`*${sid}:(OI)(CI)F`],{stdio:'ignore'});
}
const {snapshot,counts}=parseSnapshot(await fs.readFile(input));
const {key,envelope}=sealSnapshot(snapshot);
const stamp=new Date().toISOString().replace(/[:.]/g,'-');
const backup=path.join(directory,`musiclub-${stamp}.encrypted.json`);
const recoveryKey=path.join(keyDirectory,`musiclub-${stamp}.recovery-key`);
await fs.writeFile(recoveryKey,key.toString('base64'),{mode:0o600,flag:'wx'});
await fs.writeFile(backup,JSON.stringify(envelope),{mode:0o600,flag:'wx'});
// Re-read both files, authenticate, decode and count every table before reporting success.
const roundtrip=openSnapshot(JSON.parse(await fs.readFile(backup,'utf8')),Buffer.from((await fs.readFile(recoveryKey,'utf8')).trim(),'base64'));
const checked=parseSnapshot(JSON.stringify(roundtrip));
if(JSON.stringify(checked.counts)!==JSON.stringify(counts)) throw new Error('No se pudo verificar el respaldo cifrado.');
await fs.writeFile(path.join(directory,`musiclub-${stamp}.manifest.json`),JSON.stringify({created_at:stamp,backup,sha256:envelope.sha256,counts,limitations:snapshot.limitations},null,2),{mode:0o600});
console.log(JSON.stringify({verified:true,backup,recoveryKey,tables:Object.keys(counts).length,rows:Object.values(counts).reduce((a,b)=>a+b,0),note:'Guarda la clave de recuperación en un lugar privado separado. La prueba comprueba descifrado e integridad; no restaura producción.'}));
