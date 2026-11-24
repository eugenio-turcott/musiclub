import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
const version=JSON.parse(fs.readFileSync('package.json','utf8')).version;
const [subject,...body]=execFileSync('git',['log','-1','--format=%B'],{encoding:'utf8'}).trim().split('\n');
if(subject!==`Musiclub Updates - V.${version}`||body.join('\n').trim().length<20){
 console.error(`Use title: Musiclub Updates - V.${version}\nAdd a body describing the change and its validation.`);process.exitCode=1;
}else console.log('Musiclub commit title and description verified.');
