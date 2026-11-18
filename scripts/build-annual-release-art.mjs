// Cover-referenced pigment edition: no provider or generative model call.
import {ANNUAL_ART} from '../src/data/annual2026Art.mjs';
import {ANNUAL_SELECTION} from '../src/server/annual2026Selection.mjs';
import {paintRelease} from './annual-paint.mjs';
const dir=new URL('../public/annual/2026/art/',import.meta.url);
for(const piece of ANNUAL_ART){
  const release=ANNUAL_SELECTION.find(r=>r.id===piece.id);
  if(!release||release.title!==piece.title||release.artist!==piece.artist)throw new Error(`Art must match the annual selection: ${piece.id}`);
  console.log(await paintRelease(piece,dir));
}
console.log(`Prepared ${ANNUAL_ART.length} square pigment studies (640px previews, 1200px detail and PNG downloads).`);
