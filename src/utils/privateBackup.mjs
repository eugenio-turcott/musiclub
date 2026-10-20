import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

export function parseSnapshot(input) {
  let text=Buffer.isBuffer(input)?input.toString('utf8'):String(input);
  text=text.replace(/^\uFEFF/,'').trim();
  // SQL Editor CSV export: one column, one row, base64 may wrap across lines.
  text=text.replace(/^"?backup_base64"?\r?\n/,'').trim();
  if(text.startsWith('"')&&text.endsWith('"')) text=text.slice(1,-1).replace(/""/g,'"');
  const snapshot=text.startsWith('{')?JSON.parse(text):JSON.parse(Buffer.from(text,'base64').toString('utf8'));
  if(snapshot.format!=='musiclub-private-snapshot-v1'||!Array.isArray(snapshot.tables)) throw new Error('Formato de respaldo no reconocido.');
  const counts={};
  for(const table of snapshot.tables) {
    if(!table.schema||!table.table||!table.data_base64) throw new Error('Tabla incompleta en el respaldo.');
    const rows=JSON.parse(Buffer.from(table.data_base64,'base64').toString('utf8'));
    if(!Array.isArray(rows)) throw new Error('Datos de tabla inválidos.');
    counts[`${table.schema}.${table.table}`]=rows.length;
  }
  for(const required of ['public.albums','public.reviews','public.profiles','auth.users']) {
    if(!(required in counts)) throw new Error('El respaldo no incluye las tablas esenciales.');
  }
  return {snapshot,counts};
}

export function sealSnapshot(snapshot,key=randomBytes(32)) {
  if(key.length!==32) throw new Error('La clave del respaldo debe contener 32 bytes.');
  const plain=Buffer.from(JSON.stringify(snapshot));
  const iv=randomBytes(12);
  const cipher=createCipheriv('aes-256-gcm',key,iv);
  const ciphertext=Buffer.concat([cipher.update(plain),cipher.final()]);
  return {key,envelope:{format:'musiclub-encrypted-backup-v1',cipher:'aes-256-gcm',iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),sha256:createHash('sha256').update(plain).digest('hex'),data:ciphertext.toString('base64')}};
}

export function openSnapshot(envelope,key) {
  if(envelope.format!=='musiclub-encrypted-backup-v1'||envelope.cipher!=='aes-256-gcm') throw new Error('Formato cifrado desconocido.');
  const decipher=createDecipheriv('aes-256-gcm',key,Buffer.from(envelope.iv,'base64'));
  decipher.setAuthTag(Buffer.from(envelope.tag,'base64'));
  const plain=Buffer.concat([decipher.update(Buffer.from(envelope.data,'base64')),decipher.final()]);
  if(createHash('sha256').update(plain).digest('hex')!==envelope.sha256) throw new Error('La integridad del respaldo no coincide.');
  return JSON.parse(plain.toString('utf8'));
}
