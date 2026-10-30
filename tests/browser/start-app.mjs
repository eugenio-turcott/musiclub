// This harness is used only by CI. It never connects to the Musiclub database.
import http from 'node:http';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { tables } from './fixtures.mjs';

const dbPort=54329;
const server=http.createServer((request,response)=>{
  response.setHeader('Access-Control-Allow-Origin','*');
  response.setHeader('Access-Control-Allow-Headers','*');
  response.setHeader('Access-Control-Expose-Headers','Content-Range');
  response.setHeader('Content-Type','application/json');
  // Explicit, local-only fixture write used to test the stale public collection cache.
  if(request.method==='POST' && request.url==='/__fixture/add-release') {
    if(!tables.albums.some(album=>album.id==='late-fixture')) tables.albums.push({
      ...tables.albums[0],id:'late-fixture',album_name:'Violeta (Deluxe)',genres:['Pop'],
    });
    response.end('{"success":true}'); return;
  }
  if(request.method==='OPTIONS') { response.writeHead(204).end(); return; }
  if(request.method!=='GET'&&request.method!=='HEAD') {
    // Permit read-only RPCs. Other write attempts fail rather than reaching any provider.
    if(request.url==='/rest/v1/rpc/musiclub_review_context') { response.end(JSON.stringify({catalog_allowed:true,allowed:true,requires_confirmation:false,pools:[]})); return; }
    if(request.url==='/rest/v1/rpc/musiclub_can_review_album') { response.end('true'); return; }
    if(request.url.startsWith('/rest/v1/rpc/')) { response.end('[]'); return; }
    response.writeHead(403).end(JSON.stringify({message:'Writes disabled in browser fixtures'})); return;
  }
  const url=new URL(request.url,'http://127.0.0.1');
  const table=url.pathname.split('/').pop();
  let rows=[...(tables[table]||[])];
  for(const [column,filter] of url.searchParams) {
    if(filter.startsWith('eq.')) rows=rows.filter(row=>String(row[column])===filter.slice(3));
    if(filter.startsWith('in.(')) { const values=filter.slice(4,-1).split(',').map(value=>value.replace(/^"|"$/g,'')); rows=rows.filter(row=>values.includes(String(row[column]))); }
  }
  response.setHeader('Content-Range',`0-${Math.max(0,rows.length-1)}/${rows.length}`);
  if(request.headers.accept?.includes('vnd.pgrst.object+json')) {
    if(rows.length) response.end(JSON.stringify(rows[0]));
    else response.writeHead(406).end(JSON.stringify({code:'PGRST116',message:'No rows'}));
  } else response.end(JSON.stringify(rows));
});
await new Promise(resolve=>server.listen(dbPort,'127.0.0.1',resolve));
const env={...process.env,
  NEXT_PUBLIC_SUPABASE_URL:`http://127.0.0.1:${dbPort}`,
  REACT_APP_SUPABASE_URL:`http://127.0.0.1:${dbPort}`,
  NEXT_PUBLIC_SUPABASE_ANON_KEY:'sb_publishable_browser_tests_only_not_a_real_credential',
  REACT_APP_SUPABASE_ANON_KEY:'sb_publishable_browser_tests_only_not_a_real_credential',
  SUPABASE_SERVICE_ROLE_KEY:'browser_tests_only_not_a_real_credential',
  REACT_APP_SUPABASE_SERVICE_KEY:'browser_tests_only_not_a_real_credential',
  SPOTIFY_CLIENT_ID:'browser-tests',SPOTIFY_CLIENT_SECRET:'browser-tests',
  REACT_APP_SPOTIFY_CLIENT_ID:'browser-tests',REACT_APP_SPOTIFY_CLIENT_SECRET:'browser-tests',
  SMTP_HOST:'127.0.0.1',SMTP_PORT:'1025',SMTP_USER:'browser-tests',SMTP_PASS:'browser-tests',
  NEXT_TELEMETRY_DISABLED:'1',
};
let child;
function run(args, executable='node_modules/next/dist/bin/next') {
  return new Promise((resolve,reject)=>{
    child=spawn(process.execPath,[executable,...args],{env,stdio:'inherit'});
    child.on('error',reject);
    child.on('exit',code=>code===0?resolve():reject(new Error(`Next exited with ${code}`)));
  });
}
for(const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>{child?.kill(signal);server.close();process.exit(0);});
try {
  if(process.env.PLAYWRIGHT_CLOUDFLARE==='1') {
    await run([], 'scripts/build-cloudflare.mjs');
    const config=JSON.parse(await fs.readFile('wrangler.jsonc','utf8'));
    config.main=path.resolve('.open-next/worker.js');
    config.assets.directory=path.resolve('.open-next/assets');
    config.vars={CLOUDFLARE_DEPLOYMENT:'1',
      NEXT_PUBLIC_SUPABASE_URL:env.NEXT_PUBLIC_SUPABASE_URL,
      REACT_APP_SUPABASE_URL:env.REACT_APP_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY:env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      REACT_APP_SUPABASE_ANON_KEY:env.REACT_APP_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY:'browser_tests_only_not_a_real_credential',
      SPOTIFY_CLIENT_ID:'browser-tests',SPOTIFY_CLIENT_SECRET:'browser-tests',
      SMTP_HOST:'127.0.0.1',SMTP_PORT:'1025',SMTP_USER:'browser-tests',SMTP_PASS:'browser-tests',
    };
    await fs.mkdir('outputs',{recursive:true});
    await fs.writeFile('outputs/cloudflare-browser.json',JSON.stringify(config));
    await fs.writeFile('outputs/cloudflare-browser.env','CLOUDFLARE_DEPLOYMENT=1\n');
    await run(['populateCache','local','--config','outputs/cloudflare-browser.json'], 'node_modules/@opennextjs/cloudflare/dist/cli/index.js');
    await run(['dev','--local','--config','outputs/cloudflare-browser.json','--env-file','outputs/cloudflare-browser.env','--ip','127.0.0.1','--port','3101'], 'node_modules/wrangler/bin/wrangler.js');
  } else {
    await run(['build',...(process.env.PLAYWRIGHT_WEBPACK==='1'?['--webpack']:[])]);
    await run(['start','--hostname','127.0.0.1','--port','3101']);
  }
}
catch(error) {console.error(error.message);server.close();process.exitCode=1;}
