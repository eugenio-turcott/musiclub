import fs from 'node:fs/promises';
import path from 'node:path';

export async function publicAssetBytes(assetPath) {
  if(!assetPath.startsWith('/') || assetPath.includes('..'))throw new Error('Invalid public asset path');
  if(process.env.CLOUDFLARE_DEPLOYMENT==='1') {
    const {getCloudflareContext}=await import('@opennextjs/cloudflare');
    const {env}=getCloudflareContext();
    const response=await env.ASSETS.fetch(new Request(`https://assets.musiclub.internal${assetPath}`));
    if(!response.ok)throw new Error('Public image unavailable');
    return Buffer.from(await response.arrayBuffer());
  }
  return fs.readFile(path.resolve(process.cwd(),'public',`.${assetPath}`));
}
