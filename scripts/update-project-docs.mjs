import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {CURATED_PATCH_NOTES} from '../src/data/patchNotesData.js';
import {consolidateMajorReleases} from './lib/major-releases.mjs';
const pkg=JSON.parse(await fs.readFile('package.json','utf8'));
// Use the index so unrelated unstaged work never leaks into this publication.
const staged=execFileSync('git',['ls-files','--stage'],{encoding:'utf8'}).split('\n').filter(line=>{
 const name=line.split('\t')[1]||'';
 return Boolean(name)&&!['README.md','src/data/publicReleases.json','scripts/sync_daily.log'].includes(name);
}).sort().join('\n');
const revision=createHash('sha256').update(staged).digest('hex').slice(0,16);
const releases=consolidateMajorReleases(CURATED_PATCH_NOTES);
const template=await fs.readFile('docs/README.template.md','utf8');
const status=`**V.${pkg.version}** · Novedades agrupadas en [V.${releases[0].major}](https://www.musiclub.org/patch-notes).`;
const readme=template.replace('<!-- MUSICLUB_STATUS -->',status).replace('<!-- MUSICLUB_REVISION -->',`<!-- Musiclub documentation revision: ${revision} -->`);
let stale=false;
for(const [path,content] of [['README.md',readme],['src/data/publicReleases.json',JSON.stringify(releases,null,2)+'\n']]){
 let current;try{current=await fs.readFile(path,'utf8');}catch{}
 if(current?.replaceAll('\r\n','\n')===content.replaceAll('\r\n','\n'))continue;
 if(process.argv.includes('--check')){console.error(`${path} needs npm run docs:update after staging the changes.`);stale=true;}else await fs.writeFile(path,content);
}
if(stale)process.exitCode=1;else console.log(`${process.argv.includes('--check')?'Checked':'Updated'} README and ${releases.length} major-version summaries.`);
