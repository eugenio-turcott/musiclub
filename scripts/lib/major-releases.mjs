import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const summaries=require('../../src/data/majorReleaseSummaries.json');
export function versionParts(value){
 const match=String(value||'').match(/^[vV]\.?(\d+)(?:\.(\d+))?(?:\.(\d+))?$/);
 if(!match)throw new Error(`Invalid version: ${value}`);
 return match.slice(1).map(n=>Number(n||0));
}
export function consolidateMajorReleases(notes){
 const groups=new Map();
 for(const note of notes){const [major]=versionParts(note.version);if(!groups.has(major))groups.set(major,[]);groups.get(major).push(note);}
 return [...groups].sort(([a],[b])=>b-a).map(([major,rows])=>{
  rows.sort((a,b)=>{const x=versionParts(a.version),y=versionParts(b.version);return x[1]-y[1]||x[2]-y[2];});
  const first=rows[0],last=rows.at(-1),summary=summaries[major];
  if(!summary)throw new Error(`Write a consolidated summary for V.${major}.0.0 before publication`);
  return {version:`V.${major}.0.0`,major,latestVersion:last.version,date:first.date,updatedAt:rows.map(n=>n.date).sort().at(-1),title:summary.title,summary:summary.summary,tag:major===0?'Prototipos':`Musiclub ${major}`,authorName:'Eugenio Turcott',changes:summary.highlights.map(([type,title,description])=>({type,title,description}))};
 });
}
export function releaseBody(note){
 return `# Musiclub Updates - ${note.version}\n\n${note.summary}\n\n`+note.changes.map(c=>`### ${c.title}\n\n${c.description}\n`).join('\n')+`\n[Ver Musiclub](https://www.musiclub.org) · [Todas las versiones](https://www.musiclub.org/patch-notes)\n\nResumen consolidado de la etapa ${note.version} a ${note.latestVersion}.\n`;
}
