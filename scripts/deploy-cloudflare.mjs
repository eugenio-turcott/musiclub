import {spawn} from 'node:child_process';

// Native Workers Builds must never promote a preview branch to production.
if(process.env.WORKERS_CI==='1' && process.env.WORKERS_CI_BRANCH!=='master') {
  throw new Error('Only master can publish the Musiclub production Worker.');
}

// R2 starts cold and fills on demand. This avoids OpenNext's remote preview
// tunnel during cache seeding, which can time out on Windows.
const args=['node_modules/wrangler/bin/wrangler.js','deploy','--config','wrangler.jsonc',
  ...(process.env.CI?[]:['--profile','musiclub'])];
const child=spawn(process.execPath,args,{
  stdio:'inherit',env:{...process.env,OPEN_NEXT_DEPLOY:'true'},
});
child.on('error',error=>{console.error(error.message);process.exitCode=1;});
child.on('exit',async code=>{
  if(code!==0){process.exitCode=code || 1;return;}
  const origin=process.env.CLOUDFLARE_PREVIEW_URL || 'https://musiclub.eugenioturcott.workers.dev';
  try {
    for(const route of ['/','/catalogo','/reviews','/pool','/redes','/sitemap.xml']) {
      const response=await fetch(new URL(route,origin),{signal:AbortSignal.timeout(60000)});
      await response.arrayBuffer();
      if(!response.ok)throw new Error(`Health check failed: ${route} (${response.status})`);
    }
    console.log('Cloudflare public health checks passed.');
  }catch(error){console.error(error.message);process.exitCode=1;}
});
