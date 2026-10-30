import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import {verifyCloudflareBuild} from './verify-cloudflare-build.mjs';
const child=spawn(process.execPath,['node_modules/@opennextjs/cloudflare/dist/cli/index.js','build'],{
  stdio:'inherit',env:{...process.env,CLOUDFLARE_DEPLOYMENT:'1',NEXT_TELEMETRY_DISABLED:'1'},
});
child.on('error',error=>{console.error(error.message);process.exitCode=1;});
child.on('exit',async code=>{
  if(code!==0){process.exitCode=code || 1;return;}
  try {
    // OpenNext copies local env files by default. Runtime credentials belong
    // exclusively in Wrangler secrets, never in a deployable source bundle.
    await fs.writeFile('.open-next/cloudflare/next-env.mjs',
      'export const production = {};\nexport const development = {};\nexport const test = {};\n');
    await verifyCloudflareBuild();
    console.log('Runtime configuration will be supplied by Cloudflare bindings.');
  }catch(error){console.error(error.message);process.exitCode=1;}
});
