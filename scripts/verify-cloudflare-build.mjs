import fs from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';

export async function verifyCloudflareBuild() {
  try {
    await fs.access('.open-next/assets/index.html');
    throw new Error('A static index.html would shadow the Next.js home page.');
  }catch(error){if(error.code!=='ENOENT')throw error;}
  const privateValues=new Map();
  for(const filename of ['.env','.env.local']) {
    let values;
    try {values=dotenv.parse(await fs.readFile(filename));}
    catch(error){if(error.code==='ENOENT')continue;throw error;}
    for(const [key,value] of Object.entries(values)) {
      if(/(?:SECRET|SERVICE.*KEY|SMTP_PASS|GMAIL_PASS|GMAIL_APP_PASSWORD)/.test(key)&&value.length>=12)privateValues.set(key,value);
    }
  }
  async function inspect(directory) {
    for(const entry of await fs.readdir(directory,{withFileTypes:true})) {
      const filename=path.join(directory,entry.name);
      if(entry.isDirectory())await inspect(filename);
      else if(/\.(?:js|mjs|cjs|json|map|html|cache|txt)$/.test(entry.name)) {
        const text=await fs.readFile(filename,'utf8');
        for(const [key,value] of privateValues) {
          if(text.includes(value))throw new Error(`Private configuration ${key} was embedded in ${filename}.`);
        }
      }
    }
  }
  await inspect('.open-next');
  console.log('Cloudflare build verified: no legacy home page or embedded local credentials.');
}
