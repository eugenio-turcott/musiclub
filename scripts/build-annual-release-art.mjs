import {ANNUAL_ART} from '../src/data/annual2026Art.mjs';
import {ANNUAL_SELECTION} from '../src/server/annual2026Selection.mjs';
import {buildCubistArt} from './annual-cubist-art.mjs';
const dir=new URL('../public/annual/2026/cubist/',import.meta.url);
for(const art of ANNUAL_ART){
 const release=ANNUAL_SELECTION.find(r=>r.id===art.id);
 if(!release||release.title!==art.title||release.artist!==art.artist)throw new Error('Artwork must match its release: '+art.id);
 console.log(await buildCubistArt(art,dir));
}
