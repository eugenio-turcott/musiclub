import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {repositoryRequest} from './lib/github-repository.mjs';
import {consolidateMajorReleases,versionParts,releaseBody} from './lib/major-releases.mjs';
import {CURATED_PATCH_NOTES} from '../src/data/patchNotesData.js';
const apply=process.argv.includes('--apply');
const releases=[];
for(let page=1;;page++){
 const rows=await repositoryRequest(`/releases?per_page=100&page=${page}`);releases.push(...rows);
 if(rows.length<100)break;
}
await fs.mkdir('outputs/repository-maintenance',{recursive:true});
try{await fs.writeFile('outputs/repository-maintenance/releases-before.json',JSON.stringify(releases,null,2),{flag:'wx'});}catch(error){if(error.code!=='EEXIST')throw error;}
const history=execFileSync('git',['log','--all','--reverse','--format=%H%x09%s'],{encoding:'utf8'}).split('\n');
const majors=consolidateMajorReleases(CURATED_PATCH_NOTES).filter(note=>note.major>0);
const plan=majors.map(note=>{
 const existing=releases.find(release=>{try{const [major,minor,patch]=versionParts(release.tag_name);return major===note.major&&!minor&&!patch;}catch{return false;}});
 const match=history.find(line=>new RegExp(`(?:V\\.?|v)${note.major}\\.0(?:\\.0)?(?:$|[: ])`).test(line));
 const sha=match?.split('\t')[0];
 if(!existing&&!sha)throw new Error(`No historical starting commit found for ${note.version}`);
 return {note,existing,sha,tag:existing?.tag_name||`v${note.major}.0.0`};
});
const minorReleases=releases.filter(release=>{try{const [,minor,patch]=versionParts(release.tag_name);return minor||patch;}catch{return false;}}).filter(release=>!release.draft);
console.log(JSON.stringify({mode:apply?'apply':'preview',official:plan.map(p=>({version:p.note.version,tag:p.tag,sha:p.sha?.slice(0,7)})),moveToDraft:minorReleases.length},null,2));
if(apply){
 // Publish verified major summaries first; only then hide the reversible archives.
 for(const {note,existing,sha,tag} of plan){
  const body={name:`Musiclub Updates - ${note.version}`,body:releaseBody(note),draft:false,prerelease:false,make_latest:note.major===majors[0].major?'true':'false'};
  await repositoryRequest(existing?`/releases/${existing.id}`:'/releases',{method:existing?'PATCH':'POST',body:{...body,...(!existing?{tag_name:tag,target_commitish:sha}:{})}});
 }
 for(const release of minorReleases)await repositoryRequest(`/releases/${release.id}`,{method:'PATCH',body:{draft:true}});
 console.log(`Consolidated ${plan.length} official releases; preserved ${minorReleases.length} minor releases as drafts. Tags were not moved or deleted.`);
}
