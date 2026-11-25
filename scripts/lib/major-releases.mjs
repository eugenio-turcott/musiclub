import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const summaries=require('../../src/data/majorReleaseSummaries.json');
export function versionParts(value){
 const match=String(value||'').match(/^[vV]\.?(\d+)(?:\.(\d+))?(?:\.(\d+))?$/);
 if(!match)throw new Error(`Invalid version: ${value}`);
 return match.slice(1).map(n=>Number(n||0));
}
function releaseDetails(rows){
 const sections=new Map(),seen=new Set();
 for(const note of [...rows].reverse())for(const change of note.changes||[]){
  const title=String(change.title||'').trim(),description=String(change.description||'').trim();if(!title||!description)continue;
  const key=title.toLocaleLowerCase().normalize('NFD').replace(/\p{M}/gu,'');if(seen.has(key))continue;seen.add(key);
  const context=[note.tag,title].join(' ');
  const topic=/grammy/i.test(context)?'Grammy y actividades':/2026|anual/i.test(context)?'La edición anual':/cat[aá]logo|artista|b[uú]squeda|g[eé]nero/i.test(context)?'Catálogo y descubrimiento':/review|rese[nñ]|pista|canci[oó]n|calific|disco [12]/i.test(context)?'Reseñas y canciones':/dise[nñ]|perfil|compart|insignia|nivel|gamific/i.test(context)?'Perfiles, diseño y comunidad':/pool|gashapon/i.test(context)?'Pools y Gashapon':'Mejoras del club';
  if(!sections.has(topic))sections.set(topic,[]);if(sections.get(topic).length<5)sections.get(topic).push({title,description,type:change.type||'improvement'});
 }
 return [...sections].map(([title,changes])=>({title,changes}));
}
export function consolidateMajorReleases(notes){
 const groups=new Map();
 for(const note of notes){const [major]=versionParts(note.version);if(!groups.has(major))groups.set(major,[]);groups.get(major).push(note);}
 return [...groups].sort(([a],[b])=>b-a).map(([major,rows])=>{
  rows.sort((a,b)=>{const x=versionParts(a.version),y=versionParts(b.version);return x[1]-y[1]||x[2]-y[2];});
  const first=rows[0],last=rows.at(-1),summary=summaries[major];
  if(!summary)throw new Error(`Write a consolidated summary for V.${major}.0.0 before publication`);
  return {version:`V.${major}.0.0`,major,latestVersion:last.version,date:first.date,updatedAt:rows.map(n=>n.date).sort().at(-1),title:summary.title,summary:summary.summary,tag:major===0?'Prototipos':`Musiclub ${major}`,authorName:'Eugenio Turcott',details:releaseDetails(rows),changes:summary.highlights.map(([type,title,description])=>({type,title,description}))};
 });
}
export function releaseBody(note){
 return `# Musiclub Updates - ${note.version}\n\n${note.summary}\n\n`+note.changes.map(c=>`### ${c.title}\n\n${c.description}\n`).join('\n')+`\n[Ver Musiclub](https://www.musiclub.org) · [Todas las versiones](https://www.musiclub.org/patch-notes)\n\nResumen consolidado de la etapa ${note.version} a ${note.latestVersion}.\n`;
}
