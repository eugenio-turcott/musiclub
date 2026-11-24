import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {CURATED_PATCH_NOTES} from '../src/data/patchNotesData.js';
import {consolidateMajorReleases,releaseBody} from '../scripts/lib/major-releases.mjs';
import queue from '../src/utils/artistRefreshQueue.cjs';

test('maintenance resumes the oldest due artists and skips fresh or leased profiles',()=>{
 const names=new Map(['a','b','c','d','e'].map(slug=>[slug,slug]));
 const now=Date.parse('2026-11-24T20:00:00Z');
 const stored=[{slug:'a',refresh_after:'2026-11-24T19:00:00Z'},{slug:'b',refresh_after:'2026-11-20T00:00:00Z'},{slug:'c',refresh_after:'2026-11-25T00:00:00Z'},{slug:'d',lease_until:'2026-11-24T21:00:00Z'}];
 const first=queue.artistRefreshBatch(names,stored,{limit:2,now});
 assert.equal(first.pending,3);assert.deepEqual(first.batch.map(([slug])=>slug),['e','b']);
 const next=queue.artistRefreshBatch(names,[...stored,{slug:'e',refresh_after:'2026-11-25T00:00:00Z'},{slug:'b',refresh_after:'2026-11-25T00:00:00Z'}],{limit:2,now});
 assert.deepEqual(next.batch.map(([slug])=>slug),['a']);
 assert.equal(queue.artistRefreshBatch(names,stored,{selected:['b'],now}).batch.length,1);
});

test('public releases consolidate every recorded major exactly once, in numeric order',async()=>{
 const releases=consolidateMajorReleases(CURATED_PATCH_NOTES);
 assert.equal(new Set(releases.map(n=>n.major)).size,releases.length);
 assert.deepEqual(releases.map(n=>n.major),[12,11,10,9,8,7,6,5,4,3,2,1,0]);
 assert.ok(releases.every(n=>/^V\.\d+\.0\.0$/.test(n.version)&&n.changes.length<=8));
 assert.equal(releases[0].latestVersion,CURATED_PATCH_NOTES[0].version);
 assert.match(releaseBody(releases[0]),/Grammy 2027/);
 const shuffled=consolidateMajorReleases([...CURATED_PATCH_NOTES].reverse());
 assert.deepEqual(shuffled,releases);
 assert.throws(()=>consolidateMajorReleases([{version:'V.99.0.0'}]),/Write a consolidated summary/);
});

test('the release publisher rejects minor and missing versions instead of publishing another version',()=>{
 for(const tag of ['v12.2.4','v99.0.0','v12.0','invalid']){
  const result=spawnSync(process.execPath,['scripts/generate-release-body.mjs',tag],{encoding:'utf8'});
  assert.notEqual(result.status,0,tag);
 }
});

test('public version filters derive from the release catalog and never fetch live commits',async()=>{
 const source=await readFile('src/components/PatchNotes.jsx','utf8');
 assert.match(source,/note\.major===Number/);assert.match(source,/allPatchNotes\.map/);
 assert.doesNotMatch(source,/GITHUB_COMMITS_API|fetchGithubCommits/);
 const workflow=await readFile('.github/workflows/release.yml','utf8');
 assert.match(workflow,/'v\*\.0\.0'/);
});
